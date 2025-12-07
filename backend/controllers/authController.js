import axios from "axios";
import jwt from "jsonwebtoken";
import db from '../db.js';
import nodemailer from 'nodemailer';
import sgTransport from 'nodemailer-sendgrid-transport';
import crypto from 'crypto';
import qs from 'qs';

const JWT_SECRET = process.env.JWT_SECRET;
const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY;
const KAKAO_REDIRECT_URI = process.env.KAKAO_REDIRECT_URI;

console.log(`[DEBUG] JWT_SECRET 로드 여부: ${JWT_SECRET ? 'OK' : 'UNDEFINED (누락됨!)'}`);
console.log(`[DEBUG] KAKAO_REST_API_KEY: ${KAKAO_REST_API_KEY}`); 
console.log(`[DEBUG] KAKAO_REDIRECT_URI: ${KAKAO_REDIRECT_URI}`);

// 1. 카카오 토큰 교환 및 로그인/회원가입 (Access + Refresh Token 발급)
export const kakaoTokenExchange = async (req, res) => {
  console.log("--- KAKAO TOKEN EXCHANGE 시작 ---");
  const code = req.body.code || req.query.code;

  console.log(`[DEBUG] 수신된 인가 코드: ${code ? '존재함' : '없음'}`);
   
  if (!code) {
    console.log("ERROR: KAKAO_ACCESS_TOKEN(인가코드) 누락");
    return res.status(400).json({ message: "카카오 인가 코드가 누락되었습니다." });
  }
   
  let connection;
   
  try {
    // 1. code로 카카오 access token 교환 요청
    console.log("DEBUG: 카카오 토큰 교환 요청 중...");
    
    const tokenResponse = await axios.post(
      "https://kauth.kakao.com/oauth/token",
      qs.stringify({
        grant_type: "authorization_code",
        client_id: KAKAO_REST_API_KEY,
        redirect_uri: KAKAO_REDIRECT_URI,
        code: code,
      }), 
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
        },
      }
    );
   
    const { access_token: KAKAO_ACCESS_TOKEN } = tokenResponse.data;
    
    console.log("DEBUG: 카카오 토큰 교환 완료.");
    // console.log(`DEBUG: KAKAO 토큰 길이: ${KAKAO_ACCESS_TOKEN.length}`);

    // 2. access_token으로 사용자 정보 받기
    console.log("DEBUG: 카카오 사용자 정보 요청 중...");
    const userResponse = await axios.get("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${KAKAO_ACCESS_TOKEN}` },
    });
    console.log("DEBUG: 카카오 사용자 정보 획득 완료.");
    
    const kakao_id = userResponse.data.id;
    const kakaoAccount = userResponse.data.kakao_account;
    const email = kakaoAccount.email || `kakao_${userResponse.data.id}@noemail.com`;
    const nickname = (kakaoAccount.profile.nickname || "카카오사용자").substring(0, 12);

    connection = await db.getConnection();
    await connection.beginTransaction();

    // 3. DB 연동 (유저 확인)
    let [rows] = await connection.query('SELECT * FROM user WHERE kakao_id = ?', [kakao_id]);
    let user = rows[0];
    let isNewUser = false;

    if (!user) {
      // 신규 유저 -> DB에 회원가입
      console.log(`DEBUG: 신규 카카오 유저(kakao_id: ${kakao_id}), DB에 회원가입 진행 중...`);
      isNewUser = true;

      const friend_code = crypto.randomBytes(4).toString('hex').toUpperCase();
      
      const [insertResult] = await connection.query(
        `INSERT INTO user (kakao_id, email, nickname, provider, friend_code, status) VALUES (?, ?, ?, 'kakao', ?, 'ACTIVE')`,
        [kakao_id, email, nickname, friend_code]
      );

      const newUserId = insertResult.insertId;

      // 냉장고 생성
      const defaultFridgeName = `${nickname}님의 냉장고`;
      await connection.query(
        `INSERT INTO fridge (owner_user_id, name, is_default, visibility) VALUES (?, ?, 1, 'private')`, 
        [newUserId, defaultFridgeName] 
      );
      
      // 방금 가입시킨 유저 정보 다시 조회
      [rows] = await connection.query('SELECT * FROM user WHERE user_id = ?', [newUserId]);
      user = rows[0];
      
      console.log(`DEBUG: 신규 유저 및 기본 냉장고 생성 완료 (user_id: ${user.user_id})`);
    } else {
      // 기존 유저 -> 정보 업데이트
      console.log(`DEBUG: 기존 카카오 유저 (user_id: ${user.user_id}), 정보 업데이트 진행 중...`);
      
      await connection.query(
        `UPDATE user SET nickname = ?, email = ?, status = 'ACTIVE', deleted_at = NULL, last_login_at = NOW() WHERE kakao_id = ?`,
        [nickname, email, kakao_id]
      );

      // 업데이트된 유저 정보로 user 객체 갱신
      user.nickname = nickname;
      user.email = email;
      user.status = 'ACTIVE';
    }

    // [토큰 발급] Access Token(1시간) + Refresh Token(7일)
    const payload = {
      userId: user.user_id,
      email: user.email,
      nickname: user.nickname
    };

    // A. Access Token 생성 (JWT)
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

    // B. Refresh Token 생성 (랜덤 문자열 - Opaque Token)
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 현재 시간 + 7일

    // [수정] 기존 토큰 삭제 후 새 토큰 저장 (중복 방지)
    // 설명: 로그인 시 해당 유저의 옛날 리프레시 토큰을 모두 지웁니다.
    await connection.query(
        'DELETE FROM refresh_token WHERE user_id = ?', 
        [user.user_id]
    );

    // C. DB 저장 (refresh_token 테이블)
    await connection.query(
      `INSERT INTO refresh_token (user_id, token, expires_at) VALUES (?, ?, ?)`,
      [user.user_id, refreshToken, expiresAt]
    );

    // 트랜잭션 커밋
    await connection.commit();

    // 4. 성공 응답
    res.status(isNewUser ? 201 : 200).json({
      message: isNewUser ? "카카오 신규 회원가입 및 로그인 성공" : "카카오 로그인 성공",
      accessToken,    // API 요청용
      refreshToken,   // 자동 로그인(갱신)용
      user: {
        userId: user.user_id,
        friend_code: user.friend_code,
        nickname: user.nickname,
        email: user.email,
        profileImageUrl: user.profile_image_url,
        status: user.status
      },
      isNewUser: isNewUser
    });
    console.log("--- KAKAO TOKEN EXCHANGE 성공적으로 응답 완료 ---");

  } catch (error) { 
    // 에러 처리
    if (connection) await connection.rollback();

    console.error("❌ 카카오 로그인 실패 상세 로그:");
    
    if (error.response) {
       console.error("- Status Code:", error.response.status);
       console.error("- Error Data:", error.response.data);
       if (error.response.status === 401) {
           return res.status(401).json({ message: "유효하지 않은 카카오 토큰입니다.", code: "KAKAO_TOKEN_INVALID" });
       }
       return res.status(error.response.status).json(error.response.data);
    }
    
    console.error("- Error Message:", error.message);
    res.status(500).json({ message: "카카오 로그인 실패(서버 오류)", error: error.message });
    
  } finally {
    if (connection) connection.release();
  }
};


// 2. 토큰 갱신 (자동 로그인) API
// 설명: 앱 시작 시 또는 401 에러 발생 시 호출하여 Access Token을 재발급 받습니다.
export const refreshAccessToken = async (req, res) => {
  const { refreshToken } = req.body; 

  if (!refreshToken) {
    return res.status(400).json({ message: "Refresh Token이 누락되었습니다." });
  }

  let connection;
  try {
    connection = await db.getConnection();

    // 1. DB에서 리프레시 토큰 조회
    const [rows] = await connection.query(
      'SELECT * FROM refresh_token WHERE token = ?', 
      [refreshToken]
    );
    const dbToken = rows[0];

    // 2. 토큰 존재 여부 확인
    if (!dbToken) {
      // DB에 없으면 유효하지 않은 토큰 (로그아웃되었거나 조작됨)
      return res.status(403).json({ message: "유효하지 않은 Refresh Token입니다. 다시 로그인해주세요." });
    }

    // 3. 만료 여부 확인 (DB의 expires_at 컬럼 활용)
    const now = new Date();
    const expiresAt = new Date(dbToken.expires_at);

    if (now > expiresAt) {
      // 만료된 토큰은 DB에서 삭제하고 에러 반환
      await connection.query('DELETE FROM refresh_token WHERE token = ?', [refreshToken]);
      return res.status(403).json({ message: "Refresh Token이 만료되었습니다. 다시 로그인해주세요." });
    }

    // 4. 유저 정보 조회 (최신 정보로 Access Token 발급)
    const [userRows] = await connection.query('SELECT * FROM user WHERE user_id = ?', [dbToken.user_id]);
    const user = userRows[0];

    if (!user) {
      return res.status(404).json({ message: "존재하지 않는 사용자입니다." });
    }

    // 5. 새로운 Access Token 발급 (1시간 유효)
    const payload = {
      userId: user.user_id,
      email: user.email,
      nickname: user.nickname
    };
    
    const newAccessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

    console.log(`[AUTH] Access Token 재발급 완료 (User: ${user.user_id})`);

    // 6. 응답
    res.json({
      success: true,
      message: "토큰 갱신 성공",
      accessToken: newAccessToken
    });

  } catch (error) {
    console.error("[AUTH] 토큰 갱신 중 에러 발생:", error);
    res.status(500).json({ message: "서버 오류 발생" });
  } finally {
    if (connection) connection.release();
  }
};


// 3. 이메일 인증 관련 함수들
const getTransporter = () => {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.error("SENDGRID_API_KEY 환경 변수 설정 안됨");
    throw new Error("이메일 서비스 설정 누락되어 요청을 처리 X");
  }

  const sendgridOptions = {
    auth: {
      api_key: apiKey
    }
  };

  return nodemailer.createTransport(sgTransport(sendgridOptions));
};

export const sendVerificationEmail = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: '이메일 주소를 입력해주세요.' });
  }

  const verificationCode = crypto.randomInt(100000, 1000000).toString();
  const expirationTime = new Date(Date.now() + 5 * 60 * 1000); 

  try {
    const transport = getTransporter();
    const query = 
      `INSERT INTO email_verification (email, code, expires_at) 
       VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE 
       code = VALUES(code), 
       expires_at = VALUES(expires_at)`;
    
    await db.query(query, [email, verificationCode, expirationTime]);

    const mailOption = {
      from: process.env.SENDGRID_FROM_EMAIL,
      to: email,
      subject: '회원가입 인증 코드',
      html: `<h1>인증 코드: ${verificationCode}</h1><p>5분 내에 입력해주세요.</p>`,
    };

    await transport.sendMail(mailOption);
    
    console.log(`[SendGrid] 메일 발송 성공: ${email} 로 인증 코드 전송`);
    res.json({
      success: true,
      message: '인증코드 성공적으로 발송'
    });

  } catch (err) {
    console.error('인증 코드 발송 중 오류 발생: ', err.message);
    res.status(500).json({ success: false, message: '인증코드 발송 실패 (서버 오류)' });
  }
};

export const verifyEmailCode = async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ success: false, message: '이메일과 인증 코드를 모두 입력해주세요.' });
  }
  try {
    const [rows] = await db.query(
      'SELECT * FROM email_verification WHERE email = ?',
      [email]
    );
    const verificationData = rows[0];

    if (!verificationData) {
      return res.status(400).json({ success: false, message: '인증 코드를 요청한 기록이 없습니다.' });
    }

    if (new Date() > new Date(verificationData.expires_at)) {
      await db.query('DELETE FROM email_verification WHERE email = ?', [email]);
      return res.status(400).json({ success: false, message: '인증 코드가 만료되었습니다.' });
    }

    if (code !== verificationData.code) {
      return res.status(400).json({ success: false, message: '인증 코드가 일치하지 않습니다.' });
    }

    await db.query('DELETE FROM email_verification WHERE email = ?', [email]);
    
    res.json({ success: true, message: '이메일 인증 성공' });

  } catch (err) {
    console.error('인증코드 검증 중 오류 발생 : ', err);
    res.status(500).json({ success: false, message: '서버 오류 발생' });
  }
};