// api/authAPI.ts

import axios from 'axios';

const RAILWAY_BASE_URL = process.env.EXPO_PUBLIC_RAILWAY_BASE_URL;

// Axios 인스턴스 혹은 직접 호출 사용

// 1. 인증번호 이메일 발송 요청
export const sendVerificationEmail = async (email: string) => {
  try {
    // URL 수정: /api/auth/send_email (슬래시 중복 제거)
    const response = await axios.post(`${RAILWAY_BASE_URL}/api/auth/send_email`, { 
      email 
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '이메일 발송 실패');
  }
};

// 2. 인증번호 검증 요청
export const verifyEmailCode = async (email: string, code: string) => {
  try {
    const response = await axios.post(`${RAILWAY_BASE_URL}/api/auth/verify_email`, { 
      email, 
      code 
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '인증번호 검증 실패');
  }
};

// 3. 최종 회원가입 요청
export const registerUser = async (userData: any) => {
  try {
    // URL: /api/auth/register
    const response = await axios.post(`${RAILWAY_BASE_URL}/api/auth/signup`, {
      ...userData
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '회원가입 실패');
  }
};

// 4. 로그아웃 요청
export const logoutUser = async (token: string) => {
  try {
    // 백엔드 로그아웃 URL (예: /api/auth/logout)
    await axios.post(`${RAILWAY_BASE_URL}/api/auth/logout`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    // 로그아웃은 응답 데이터가 딱히 필요 없는 경우가 많아 리턴 없이 종료
  } catch (error) {
    // 로그아웃 실패해도 앱에서는 로그아웃 시켜야 하므로 에러를 던지지 않고 경고만 찍음
    console.warn("⚠️ 백엔드 로그아웃 요청 실패 (무시하고 진행):", error);
  }
};
