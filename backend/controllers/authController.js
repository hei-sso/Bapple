import axios from "axios";
import jwt from "jsonwebtoken";
import db from '../db.js';
import nodemailer from 'nodemailer';
import sgTransport from 'nodemailer-sendgrid-transport';
import crypto from 'crypto';


// 카카오 로그인 완료 후 Redirect URI로 돌아오면 실행
export const kakaoCallback = async (req, res) => {
  const { code } = req.body;

  // 환경 변수를 함수 내에 직접 참조
  const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY;
  const KAKAO_REDIRECT_URI = process.env.KAKAO_REDIRECT_URI;
  const JWT_SECRET = process.env.JWT_SECRET; // JWT Secret 불러오기

  if (!code) {
    return res.status(400).json({message: '인가 코드가 누락됨.'});
  }

  try {
    // Authorization Code로 Access Token 요청
    const tokenResponse = await axios.post("https://bapple-production.up.railway.app/api/auth/kakao/callback", null, {
      params: {
        grant_type: "authorization_code",
        client_id: KAKAO_REST_API_KEY,
        redirect_uri: KAKAO_REDIRECT_URI,
        code,
      },
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const { access_token } = tokenResponse.data;

    // 사용자 정보 요청
    const userResponse = await axios.get("https://bapple-production.up.railway.app/api/auth/kakao/callback", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const kakao_id = userResponse.data.id;
    const kakaoAccount = userResponse.data.kakao_account;
    const email = kakaoAccount.email || `kakao_${userResponse.data.id}@noemail.com`;
    const nickname = kakaoAccount.profile.nickname || "카카오사용자";

    // DB 연동 (지금은 임시로 콘솔 출력)
//     console.log(" 카카오 사용자 정보:", { email, nickname });

//     // JWT 발급 (7일 유효)
//     const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "7d" });

//     // 성공 응답
//     res.json({
//       message: "카카오 로그인 성공",
//       token, //프론트엔드님이 이 토큰을 받아 저장하시면 됩니다.
//       user: { email, nickname },
//     });
//   } catch (error) {
//     console.error(" 카카오 로그인 실패:", error.response?.data || error.message);
//     res.status(500).json({ message: "카카오 로그인 실패" });
//   }
// };
    let [rows] = await db.query('SELECT * FROM users WHERE kakao_id = ?', [kakao_id]);
    let user = rows[0];

    if (!user) {
      // 신규 유저 -> DB에 회원가입
      const [insertResult] = await db.query(
        'INSERT INTO users (kakao_id, email, nickname, provider) VALUES (?, ?, ?, ?)',
        [kakao_id, email, nickname, 'kakao']
      );
      [rows] = await db.query('SELECT * FROM users WHERE user_id = ?', [insertResult.insertId]);
      user = rows[0];
    } else {
      // (선택) 기존 유저 정보 업데이트
      await db.query('UPDATE users SET nickname = ?, email = ? WHERE kakao_id = ?', 
        [nickname, email, kakao_id]
      );
    }

    // 4. JWT 발급 (우리 서비스 user_id 사용)
    const token = jwt.sign(
      { userId: user.user_id }, //핵심: 우리 DB ID
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 5. 성공 응답 (앱으로 토큰과 유저 정보 전송)
    res.json({
      message: "카카오 로그인 성공",
      token, // 프론트엔드가 이 토큰을 저장합니다.
      user: {
        userId: user.user_id,
        nickname: user.nickname,
        email: user.email,
      },
    });

  } catch (error) {
    console.error(" 카카오 로그인 실패:", error.response?.data || error.message);
    res.status(500).json({ message: "카카오 로그인 실패" });
  }
};


// SendGrid 설정 
const sendgridOptions = {
    auth: {
        api_key: process.env.SENDGRID_API_KEY
    }
};
const transporter = nodemailer.createTransport(sgTransport(sendgridOptions));


// 이메일 인증 컨트롤러 (DB 사용)

export const sendVerificationEmail = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: '이메일 주소를 입력해주세요.' });
  }

  const verificationCode = crypto.randomInt(100000, 1000000).toString();
  const expirationTime = new Date(Date.now() + 5 * 60 * 1000); // 5분 뒤

  try {
    // DB에 코드 저장 (UPSERT: 없으면 생성, 있으면 덮어쓰기)
    await db.query(
      'INSERT INTO email_verifications (email, code, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE code = ?, expires_at = ?',
      [email, verificationCode, expirationTime, verificationCode, expirationTime]
    );

    const mailOption = {
      from: process.env.SENDGRID_FROM_EMAIL,
      to: email,
      subject: '회원가입 인증 코드',
      html: `<h1>인증 코드: ${verificationCode}</h1><p>5분 내에 입력해주세요.</p>`,
    };

    await transporter.sendMail(mailOption);
    
    res.json({
      success: true,
      message: '인증코드 성공적으로 발송됨 '
    });

  } catch (err) {
    console.error('인증 코드 발송 중 오류 발생: ', err);
    res.status(500).json({ success: false, message: '인증코드 발송 실패' });
  }
};

export const verifyEmailCode = async (req, res) => {
  const { email, code } = req.body;

  try {
    // DB에서 코드 조회
    const [rows] = await db.query(
      'SELECT * FROM email_verifications WHERE email = ?',
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
    await db.query('DELETE FROM email_verifications WHERE email = ?', [email]);
    
    res.json({ success: true, message: '이메일 인증 성공' });

  } catch (err) {
    console.error('인증코드 검증 중 오류 발생 : ', err);
    res.status(500).json({ success: false, message: '서버 오류 발생' });
  }
};
