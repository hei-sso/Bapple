// controllers/authController.js

import axios from "axios";
import jwt from "jsonwebtoken";
import db from "../db.js";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET;
const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY;
const KAKAO_REDIRECT_URI = process.env.KAKAO_REDIRECT_URI;

export const kakaoTokenExchange = async (req, res) => {
  console.log("=== KAKAO TOKEN EXCHANGE START ===");

  const { code } = req.body;

  if (!code) {
    console.log("ERROR: code 누락");
    return res.status(400).json({ message: "인가 코드(code)가 없습니다." });
  }

  let connection;

  try {
    console.log("1) 카카오 토큰 요청 중...");
    const tokenResponse = await axios.post(
      "https://kauth.kakao.com/oauth/token",
      null,
      {
        params: {
          grant_type: "authorization_code",
          client_id: KAKAO_REST_API_KEY,
          redirect_uri: KAKAO_REDIRECT_URI,
          code,
        },
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    const access_token = tokenResponse.data.access_token;
    console.log("1) 카카오 토큰 획득 성공");

    // 2) 사용자 정보 가져오기
    console.log("2) 사용자 정보 요청 중...");
    const userResponse = await axios.get("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    console.log("2) 사용자 정보 요청 성공");

    const kakao_id = userResponse.data.id;
    const kakaoAcc = userResponse.data.kakao_account;

    const email = kakaoAcc.email || `kakao_${kakao_id}@noemail.com`;
    const nickname = kakaoAcc.profile.nickname || "카카오사용자";

    // 3) DB 처리
    connection = await db.getConnection();
    await connection.beginTransaction();

    let [rows] = await connection.query("SELECT * FROM user WHERE kakao_id = ?", [kakao_id]);
    let user = rows[0];
    let isNewUser = false;

    if (!user) {
      console.log("신규 유저 → DB 등록");
      isNewUser = true;

      const friend_code = crypto.randomBytes(4).toString("hex").toUpperCase();

      const [insert] = await connection.query(
        `INSERT INTO user (kakao_id, email, nickname, provider, friend_code, status)
         VALUES (?, ?, ?, 'kakao', ?, 'ACTIVE')`,
        [kakao_id, email, nickname, friend_code]
      );

      const newId = insert.insertId;
      const [newUser] = await connection.query("SELECT * FROM user WHERE user_id = ?", [newId]);
      user = newUser[0];
    } else {
      console.log("기존 유저 → 정보 업데이트");
      await connection.query(
        `UPDATE user 
         SET nickname = ?, email = ?, last_login = NOW(), status = 'ACTIVE' 
         WHERE kakao_id = ?`,
        [nickname, email, kakao_id]
      );
      user.nickname = nickname;
      user.email = email;
    }

    await connection.commit();

    // 4) JWT 발급
    const token = jwt.sign(
      {
        userId: user.user_id,
        email: user.email,
        nickname: user.nickname,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("=== KAKAO LOGIN SUCCESS ===");

    return res.json({
      token,
      user: {
        userId: user.user_id,
        email: user.email,
        nickname: user.nickname,
        friend_code: user.friend_code,
      },
      isNewUser,
    });
  } catch (err) {
    if (connection) await connection.rollback();

    console.error("카카오 로그인 실패:", err.response?.data || err.message);

    return res.status(500).json({
      message: "카카오 로그인 실패",
      error: err.response?.data,
    });
  } finally {
    if (connection) connection.release();
  }
};
