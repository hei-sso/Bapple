import axios from "axios";
import jwt from "jsonwebtoken";
import db from '../db.js';
import nodemailer from 'nodemailer';
import sgTransport from 'nodemailer-sendgrid-transport';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET;

const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY;
const KAKAO_REDIRECT_URI = process.env.KAKAO_REDIRECT_URI;

// 카카오 토큰 교환 및 로그인/회원가입
export const kakaoTokenExchange = async (req, res) => {
  // 1. [추가] 클라이언트가 보낸 카카오 access_token 받기
  console.log("--- KAKAO TOKEN EXCHANGE 시작 ---");
  const { code } = req.body; 

  if (!code) {
    console.log("ERROR: KAKAO_ACCESS_TOKEN 누락");
    return res.status(400).json({ message: "카카오 KAKAO_ACCESS_TOKEN이 누락되었습니다." });
  }
  let connection;
  console.log(`DEBUG: KAKAO 토큰 길이: ${KAKAO_ACCESS_TOKEN.length}`);
  
  try {
    // 2. code로 카카오 access token 교환 요청
    console.log("DEBUG: 카카오 토큰 교환 요청 중...");
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
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"},
        }
      );

      const {KAKAO_ACCESS_TOKEN} = tokenResponse.data;
      console.log("DEBUG: 카카오 토큰 교환 완료.");

    // 3. access_token으로 사용자 정보 받기
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

    // 4. DB 연동 (변경된 로직)
    let [rows] = await connection.query('SELECT * FROM user WHERE kakao_id = ?', [kakao_id]);
    let user = rows[0];
    let isNewUser = false;

    if (!user) {
      // 신규 유저 -> DB에 회원가입
      console.log("DEBUG: 신규 카카오 유저(kakao_id: ${kakao_id}), DB에 회원가입 진행 중...");
      isNewUser = true;

      const friend_code = crypto.randomBytes(4).toString('hex').toUpperCase() 
      
      const [insertResult] = await connection.query(
        `INSERT INTO user (kakao_id, email, nickname, provider, friend_code, status) VALUES (?, ?, ?, 'kakao', ?, 'ACTIVE')`,
        [kakao_id, email, nickname, friend_code]
      );

      const newUserId = insertResult.insertId;

      // 방금 가입시킨 유저 정보 다시 조회
      [rows] = await connection.query('SELECT * FROM user WHERE user_id = ?', [newUserId]);
      user = rows[0];
      console.log("DEBUG: 신규 유저 회원가입 완료 (user_id: ${user.user_id})");
    } else {
      // 기존 유저 -> 정보 업데이트 및 로그인 처리
      console.log(`DEBUG: 기존 카카오 유저 (user_id: ${user.user_id}), 정보 업데이트 진행 중...`);
      
      // (선택) 기존 유저 정보 업데이트
      await connection.query(
        `UPDATE user SET 
          nickname = ?, 
          email = ?,
          status = 'ACTIVE',
          deleted_at = NULL,
          last_login = NOW() 
          WHERE kakao_id = ?`,
        [nickname, email, kakao_id]
      );

      // 업데이트된 유저 정보fh user 객체 갱신
      user.nickname = nickname;
      user.email = email;
      user.status = 'ACTIVE';
    }

    await connection.commit();

    const payload = {
      userId: user.user_id,
      email: user.email,
      nickname: user.nickname
    };

    const token = jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 6. 성공 응답 (기존 로직)
    res.status(isNewUser ? 201 : 200).json({
      message: isNewUser ? "카카오 신규 회원가입 및 로그인 성공" : "카카오 로그인 성공",
      token, // 프론트엔드가 이 토큰을 저장합니다.
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
  } catch (error) { // 7. [수정] 에러 처리
    if (connection) await connection.rollback();

    //카카오 토큰 유효하지 않거나 만료될 경우 (401)
    if (error.response && error.response.status === 401) {
      console.error("유효하지 않은 카카오 토큰:", error.response.data);
      return res.status(401).json({
        message: "유효하지 않은 카카오 토큰입니다.",
        code: "KaKAO_TOKEN_INVALID"
         });
    }
  console.error(" 카카오 로그인(토큰 교환) 실패:", error.response?.data || error.message);
    res.status(500).json({ message: "카카오 로그인 실패(서버 오류)" });
  } finally {
    // DB 연결 반환
    if (connection) connection.release();
  }
};
    
// 이메일 인증 (변경 없음, 502 오류 해결됨)

const getTransporter = () => {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.error("SENDGRID_API_KEY 환경 변수 설정 안됨");
    throw new Error("이메일 서비스 설정 누락되어 요청을 처리 X");
  }

  // SendGrid 설정 
const sendgridOptions = {
    auth: {
        api_key: apiKey
    }
};

return nodemailer.createTransport(sgTransport(sendgridOptions));
};

// 이메일 인증 컨트롤러 (DB 사용)
export const sendVerificationEmail = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: '이메일 주소를 입력해주세요.' });
  }

  const verificationCode = crypto.randomInt(100000, 1000000).toString();
  const expirationTime = new Date(Date.now() + 5 * 60 * 1000); // 5분 뒤

  try {
    const transport = getTransporter();
    // DB에 코드 저장 (UPSERT: 없으면 생성, 있으면 덮어쓰기)
    const query = 
      `INSERT INTO email_verification (email, code, expires_at) 
      VALUES (?, ?, ?) 
      ON DUPLICATE KEY UPDATE 
      code = VALUES(code), 
      expires_at = VALUES(expires_at)`;
    await db.query(query, [email, verificationCode, expirationTime]  
    );

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
    // DB에서 코드 조회
    const [rows] = await db.query(
      'SELECT * FROM email_verification WHERE email = ?',
      [email]
    );
    const verificationData = rows[0];

    if (!verificationData) {
      return res.status(400).json({ success: false, message: '인증 코드를 요청한 기록이 없습니다.' });
    }

    // 시간 만료 체크
    if (new Date() > new Date(verificationData.expires_at)) {
      await db.query('DELETE FROM email_verifications WHERE email = ?', [email]);
      return res.status(400).json({ success: false, message: '인증 코드가 만료되었습니다.' });
    }

    // 코드 일치 체크
    if (code !== verificationData.code) {
      return res.status(400).json({ success: false, message: '인증 코드가 일치하지 않습니다.' });
    }

    // 성공 시 DB에서 코드 삭제
    await db.query('DELETE FROM email_verification WHERE email = ?', [email]);
    
    res.json({ success: true, message: '이메일 인증 성공' });

  } catch (err) {
    console.error('인증코드 검증 중 오류 발생 : ', err);
    res.status(500).json({ success: false, message: '서버 오류 발생' });
  }
};
