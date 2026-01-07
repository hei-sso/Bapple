import axios from "axios";
import jwt from "jsonwebtoken";
import db from '../db.js';
import nodemailer from 'nodemailer';
import sgTransport from 'nodemailer-sendgrid-transport';
import crypto from 'crypto';
import qs from 'qs';
import bcrypt from 'bcrypt'; // 암호화를 위해 필수

const JWT_SECRET = process.env.JWT_SECRET;
const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY;
const KAKAO_REDIRECT_URI = process.env.KAKAO_REDIRECT_URI;

// [DEBUG] 환경변수 체크
console.log(`[SYS] JWT_SECRET 로드: ${JWT_SECRET ? 'OK' : 'FAIL'}`);
console.log(`[SYS] KAKAO_KEY 로드: ${KAKAO_REST_API_KEY ? 'OK' : 'FAIL'}`);
console.log(`[SYS] SENDGRID_KEY 로드: ${process.env.SENDGRID_API_KEY ? 'OK' : 'FAIL'}`);
console.log(`[SYS] SENDGRID_FROM: ${process.env.SENDGRID_FROM_EMAIL}`);

// 1. 카카오 토큰 교환 및 로그인/회원가입
export const kakaoTokenExchange = async (req, res) => {
  console.log("--- [KAKAO] 토큰 교환 시작 ---");
  const code = req.body.code || req.query.code;

  if (!code) {
    return res.status(400).json({ message: "카카오 인가 코드가 누락되었습니다." });
  }

  let connection;

  try {
    // 1. 카카오 토큰 요청
    const tokenResponse = await axios.post(
      "https://kauth.kakao.com/oauth/token",
      qs.stringify({
        grant_type: "authorization_code",
        client_id: KAKAO_REST_API_KEY,
        redirect_uri: KAKAO_REDIRECT_URI,
        code: code,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" } }
    );

    const { access_token: KAKAO_ACCESS_TOKEN } = tokenResponse.data;

    // 2. 사용자 정보 요청
    const userResponse = await axios.get("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${KAKAO_ACCESS_TOKEN}` },
    });

    const kakao_id = userResponse.data.id;
    const kakaoAccount = userResponse.data.kakao_account;
    const email = kakaoAccount.email || `kakao_${userResponse.data.id}@noemail.com`;
    const nickname = (kakaoAccount.profile.nickname || "카카오사용자").substring(0, 12);

    connection = await db.getConnection();
    await connection.beginTransaction();

    let [rows] = await connection.query('SELECT * FROM user WHERE kakao_id = ?', [kakao_id]);
    let user = rows[0];
    let isNewUser = false;

    if (!user) {
      // 신규 가입
      console.log(`[KAKAO] 신규 유저 가입 진행: ${kakao_id}`);
      isNewUser = true;
      const friend_code = crypto.randomBytes(4).toString('hex').toUpperCase();

      const [insertResult] = await connection.query(
        `INSERT INTO user (kakao_id, email, nickname, provider, friend_code, status) VALUES (?, ?, ?, 'kakao', ?, 'ACTIVE')`,
        [kakao_id, email, nickname, friend_code]
      );

      const newUserId = insertResult.insertId;
      const defaultFridgeName = `${nickname}님의 냉장고`;
      
      await connection.query(
        `INSERT INTO fridge (owner_user_id, name, is_default, visibility) VALUES (?, ?, 1, 'private')`,
        [newUserId, defaultFridgeName]
      );

      // 유저 정보 재조회
      [rows] = await connection.query('SELECT * FROM user WHERE user_id = ?', [newUserId]);
      user = rows[0];
    } else {
      // 기존 유저 업데이트
      console.log(`[KAKAO] 기존 유저 로그인: ${user.user_id}`);
      await connection.query(
        `UPDATE user SET nickname = ?, email = ?, status = 'ACTIVE', deleted_at = NULL, last_login_at = NOW() WHERE kakao_id = ?`,
        [nickname, email, kakao_id]
      );
      user.nickname = nickname;
      user.email = email;
      user.status = 'ACTIVE';
    }

    // 토큰 발급
    const payload = { userId: user.user_id, email: user.email, nickname: user.nickname };
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
    
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await connection.query('DELETE FROM refresh_token WHERE user_id = ?', [user.user_id]);
    await connection.query(
      `INSERT INTO refresh_token (user_id, token, expires_at) VALUES (?, ?, ?)`,
      [user.user_id, refreshToken, expiresAt]
    );

    await connection.commit();

    res.status(isNewUser ? 201 : 200).json({
      message: isNewUser ? "카카오 신규 회원가입 성공" : "카카오 로그인 성공",
      accessToken,
      refreshToken,
      user: {
        userId: user.user_id,
        nickname: user.nickname,
        email: user.email,
        profileImageUrl: user.profile_image_url,
        status: user.status
      },
      isNewUser
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error("❌ [KAKAO ERROR]:", error.response?.data || error.message);
    res.status(500).json({ message: "카카오 로그인 실패", error: error.message });
  } finally {
    if (connection) connection.release();
  }
};


// 2. 토큰 갱신 API
export const refreshAccessToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ message: "Refresh Token 누락" });

  let connection;
  try {
    connection = await db.getConnection();
    const [rows] = await connection.query('SELECT * FROM refresh_token WHERE token = ?', [refreshToken]);
    const dbToken = rows[0];

    if (!dbToken) return res.status(403).json({ message: "유효하지 않은 토큰" });

    if (new Date() > new Date(dbToken.expires_at)) {
      await connection.query('DELETE FROM refresh_token WHERE token = ?', [refreshToken]);
      return res.status(403).json({ message: "토큰 만료" });
    }

    const [userRows] = await connection.query('SELECT * FROM user WHERE user_id = ?', [dbToken.user_id]);
    const user = userRows[0];
    if (!user) return res.status(404).json({ message: "유저 없음" });

    const newAccessToken = jwt.sign(
      { userId: user.user_id, email: user.email, nickname: user.nickname },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    console.log(`[AUTH] 토큰 갱신 완료: User ${user.user_id}`);
    res.json({ success: true, accessToken: newAccessToken });

  } catch (error) {
    console.error("[AUTH] 갱신 에러:", error);
    res.status(500).json({ message: "서버 오류" });
  } finally {
    if (connection) connection.release();
  }
};


// 3. 이메일 인증 관련 설정
const getTransporter = () => {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) throw new Error("SENDGRID_API_KEY 없음");

  return nodemailer.createTransport(sgTransport({
    auth: { api_key: apiKey }
  }));
};

// 4. 인증 이메일 발송 (디버깅 강화됨)
export const sendVerificationEmail = async (req, res) => {
  console.log("--- [EMAIL] 인증 메일 발송 요청 시작 ---");
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ success: false, message: '이메일을 입력해주세요.' });
  }

  const verificationCode = crypto.randomInt(100000, 1000000).toString();
  const expirationTime = new Date(Date.now() + 5 * 60 * 1000); // 5분

  try {
    const transport = getTransporter();
    
    // DB 저장
    const query = `
      INSERT INTO email_verification (email, code, expires_at) 
      VALUES (?, ?, ?) 
      ON DUPLICATE KEY UPDATE code = VALUES(code), expires_at = VALUES(expires_at)
    `;
    await db.query(query, [email, verificationCode, expirationTime]);
    console.log(`[EMAIL] DB 저장 완료: ${email} / 코드: ${verificationCode}`);

    // 메일 옵션
    const mailOption = {
      from: process.env.SENDGRID_FROM_EMAIL, // .env 확인 필수
      to: email,
      subject: '[Bapple] 회원가입 인증 코드',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>이메일 인증</h2>
          <p>아래 인증 코드를 입력하여 회원가입을 완료해주세요.</p>
          <h1 style="color: #2D3748; letter-spacing: 5px;">${verificationCode}</h1>
          <p>이 코드는 5분간 유효합니다.</p>
        </div>
      `,
    };

    // 실제 전송
    await transport.sendMail(mailOption);
    
    console.log(`[EMAIL] 전송 성공! (${email})`);
    res.json({ success: true, message: '인증 코드가 발송되었습니다.' });

  } catch (err) {
    console.error("❌ [EMAIL ERROR] 메일 전송 실패!");
    console.error("에러 메시지:", err.message);

    // SendGrid 상세 에러 로그 (중요)
    if (err.response) {
      console.error("SendGrid 상세 응답:", JSON.stringify(err.response.body, null, 2));
    } else {
      console.error("상세 응답 없음 (네트워크 혹은 설정 문제)");
    }

    res.status(500).json({ success: false, message: '메일 전송 실패. 서버 로그를 확인하세요.' });
  }
};


// 5. 인증 코드 검증 (삭제 로직 변경)
export const verifyEmailCode = async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ success: false, message: '입력값이 부족합니다.' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM email_verification WHERE email = ?', [email]);
    const verificationData = rows[0];

    if (!verificationData) {
      return res.status(400).json({ success: false, message: '인증 요청 기록이 없습니다.' });
    }

    if (new Date() > new Date(verificationData.expires_at)) {
      // 만료된 경우 삭제
      await db.query('DELETE FROM email_verification WHERE email = ?', [email]);
      return res.status(400).json({ success: false, message: '인증 코드가 만료되었습니다.' });
    }

    if (String(code) !== String(verificationData.code)) {
      return res.status(400).json({ success: false, message: '인증 코드가 일치하지 않습니다.' });
    }

    // [중요] 여기서 바로 삭제하지 않습니다! 
    // 최종 가입(signup) API에서 한 번 더 확인하고 삭제해야 안전합니다.
    // await db.query('DELETE FROM email_verification WHERE email = ?', [email]);
    
    console.log(`[VERIFY] 인증 성공: ${email}`);
    res.json({ success: true, message: '이메일 인증이 완료되었습니다.' });

  } catch (err) {
    console.error('[VERIFY ERROR]', err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
};


// [NEW] 6. 최종 회원가입 (로컬)
export const signup = async (req, res) => {
  console.log("--- [SIGNUP] 회원가입 요청 시작 ---");
  
  // 1. 프론트엔드에서 보내는 변수명: email, password, nickname, code, phone, birth
  const { email, password, nickname, code, phone, birth } = req.body;

  // 필수 값 검증
  if (!email || !password || !nickname || !code || !phone || !birth) {
    return res.status(400).json({ message: "모든 정보(이메일, 비번, 닉네임, 코드, 전화번호, 생년월일)를 입력해주세요." });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // 2. 이메일 중복 체크
    const [existingUsers] = await connection.query('SELECT * FROM user WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(409).json({ message: "이미 가입된 이메일입니다." });
    }

    // 3. 인증 코드 확인
    const [verifRows] = await connection.query('SELECT * FROM email_verification WHERE email = ?', [email]);
    const verificationData = verifRows[0];

    if (!verificationData || 
        String(verificationData.code) !== String(code) || 
        new Date() > new Date(verificationData.expires_at)) {
      return res.status(400).json({ message: "인증 코드가 유효하지 않거나 만료되었습니다." });
    }

    // 4. 비밀번호 암호화 & 친구코드 생성 (8자리)
    const hashedPassword = await bcrypt.hash(password, 10);
    const friend_code = crypto.randomBytes(4).toString('hex').toUpperCase(); // 4바이트 = 8글자 Hex (딱 맞음!)

    // 5. 유저 Insert (★중요: DB 컬럼명 phone_number, birthday 에 맞춤)
    const [insertResult] = await connection.query(
      `INSERT INTO user 
       (email, password, nickname, provider, friend_code, status, phone_number, birthday) 
       VALUES (?, ?, ?, 'local', ?, 'ACTIVE', ?, ?)`,
      [email, hashedPassword, nickname, friend_code, phone, birth]
    );

    const newUserId = insertResult.insertId;

    // 6. 기본 냉장고 생성
    await connection.query(
      `INSERT INTO fridge (owner_user_id, name, is_default, visibility) VALUES (?, ?, 1, 'private')`,
      [newUserId, `${nickname}님의 냉장고`]
    );

    // 7. 인증 데이터 삭제
    await connection.query('DELETE FROM email_verification WHERE email = ?', [email]);

    await connection.commit();
    console.log(`[SIGNUP SUCCESS] 회원가입 최종 완료: ${email} (ID: ${newUserId})`);
    res.status(201).json({ success: true, message: "회원가입이 완료되었습니다!" });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error("❌ [SIGNUP ERROR]:", error);
    res.status(500).json({ message: "서버 오류로 가입에 실패했습니다." });
  } finally {
    if (connection) connection.release();
  }
};