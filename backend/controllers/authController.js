import axios from "axios";
import jwt from "jsonwebtoken";
// index.js에서 dotenv, config();처리
// import dotenv from "dotenv";
// dotenv.config();

// 카카오 로그인 완료 후 Redirect URI로 돌아오면 실행
export const kakaoCallback = async (req, res) => {
  const { code } = req.query;

  // 환경 변수를 함수 내에 직접 참조
  const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY;
  const KAKAO_REDIRECT_URI = process.env.KAKAO_REDIRECT_URI;
  const JWT_SECRET = process.env.JWT_SECRET; // JWT Secret 불러오기

  if (!code) {
    return res.status(400).json({message: '인가 코드가 누락됨.'});
  }

  try {
    // (1) Authorization Code로 Access Token 요청
    const tokenResponse = await axios.post("https://kauth.kakao.com/oauth/token", null, {
      params: {
        grant_type: "authorization_code",
        client_id: KAKAO_REST_API_KEY,
        redirect_uri: KAKAO_REDIRECT_URI,
        code,
      },
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const { access_token } = tokenResponse.data;

    // (2) 사용자 정보 요청
    const userResponse = await axios.get("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const userData = userResponse.data;
    const kakaoAccount = userResponse.data.kakao_account;
    const email = kakaoAccount.email || `kakao_${userResponse.data.id}@noemail.com`;
    const nickname = kakaoAccount.profile.nickname || "카카오사용자";

    // (3) DB 연동 (지금은 임시로 콘솔 출력)
    console.log("📩 카카오 사용자 정보:", { email, nickname });

    // (4) JWT 발급 (7일 유효)
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "7d" });

    // (5) 성공 응답
    res.json({
      message: "카카오 로그인 성공",
      token, //프론트엔드님이 이 토큰을 받아 저장하시면 됩니다.
      user: { email, nickname },
    });
  } catch (error) {
    console.error(" 카카오 로그인 실패:", error.response?.data || error.message);
    res.status(500).json({ message: "카카오 로그인 실패" });
  }
};
