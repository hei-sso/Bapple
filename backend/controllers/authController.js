import axios from "axios";
import jwt from "jsonwebtoken";

export const kakaoTokenExchange = async (req, res) => {
  console.log("[BACKEND] 카카오 token_exchange 시작");

  const { code } = req.body;

  if (!code) {
    console.log("❌ code 없음");
    return res.status(400).json({ message: "code가 전달되지 않았습니다." });
  }

  try {
    console.log("1️Access Token 요청 중...");

    const tokenResponse = await axios.post(
      "https://kauth.kakao.com/oauth/token",
      null,
      {
        params: {
          grant_type: "authorization_code",
          client_id: process.env.KAKAO_REST_API_KEY,
          redirect_uri: process.env.KAKAO_REDIRECT_URI,
          code,
        },
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    const access_token = tokenResponse.data.access_token;
    console.log("✔ 카카오 Access Token 획득:", access_token);

    // 사용자 정보 요청
    console.log("카카오 사용자 정보 요청 중...");

    const userResponse = await axios.get(
      "https://kapi.kakao.com/v2/user/me",
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );

    const kakaoUser = userResponse.data;
    console.log("🎉 카카오 사용자 정보:");
    console.log(JSON.stringify(kakaoUser, null, 2));

    const kakaoId = kakaoUser.id;
    const nickname = kakaoUser.kakao_account?.profile?.nickname ?? "카카오유저";
    const email =
      kakaoUser.kakao_account?.email ??
      `kakao_${kakaoId}@noemail.com`;

    // JWT 생성 (DB 없이)
    const payload = {
      userId: kakaoId,
      nickname,
      email,
      provider: "kakao",
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    console.log("생성된 JWT:", token);

    return res.json({
      message: "카카오 로그인 성공",
      token,
      user: payload,
    });

  } catch (error) {
    console.error("❌ 카카오 로그인 실패:", error.response?.data || error.message);
    return res.status(500).json({
      message: "카카오 로그인 실패",
      error: error.response?.data || error.message,
    });
  }
};
