// context/authContext.tsx

import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store'; // 보안 저장소 사용
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

// 타입 정의
interface AuthContextType {
  isAuthenticated: boolean;
  accessToken: string | null;
  isLoading: boolean;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// 기본값 (초기 로딩 상태는 true)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Context Provider
export const AUTH_TOKEN_KEY = 'user_access_token';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // 초기 인증 로딩 상태

  // 1. 앱 시작 시 토큰 로드 및 인증 상태 확인
  useEffect(() => {
    async function loadToken() {
      try {
        const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
        if (token) {
          setAccessToken(token);
        }
      } catch (e) {
        console.error("SecureStore load error:", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadToken();
  }, []);

  // 2. 로그인 (토큰 저장)
  const signIn = async (token: string) => {
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
    setAccessToken(token);
    // 로그인 완료 후 홈으로 이동 (RootLayout에서 isAuthenticated 상태 변화를 감지하고 Redirect함)
    router.replace('/(tabs)/home'); 
  };

  // 3. 로그아웃 (토큰 삭제)
  const signOut = async () => {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    setAccessToken(null);
    // 로그아웃 후 Welcome 화면으로 이동
    router.replace('/welcome');
  };

  const value = {
    isAuthenticated: !!accessToken,
    accessToken,
    isLoading,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
