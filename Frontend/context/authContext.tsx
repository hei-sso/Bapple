// context/authContext.tsx

import axios from 'axios';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

// API
import { logoutUser } from '@/api/authAPI';
import { fetchUserProfile } from '@/api/userAPI';

// Constants
import { AUTH_TOKEN_KEY } from '@/constants/keys';

// Type
import { UserProfile } from '@/types/userTypes';

// 환경 변수 & Refresh Token 키 정의
const RAILWAY_BASE_URL = process.env.EXPO_PUBLIC_RAILWAY_BASE_URL;
const REFRESH_TOKEN_KEY = 'refreshToken'; 

// 타입 정의 업데이트
interface AuthContextType {
    isAuthenticated: boolean;
    accessToken: string | null;
    isLoading: boolean;
    userProfile: UserProfile | null;
    // ⭐ signIn이 두 개의 토큰을 받음
    signIn: (accessToken: string, refreshToken: string) => Promise<void>;
    signOut: () => Promise<void>;
}

// 기본값
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const router = useRouter();
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    // 프로필 데이터 로드 함수
    const loadUserProfile = useCallback(async () => {
        try {
            // API 호출 (이미 저장된 토큰이나 인터셉터를 사용할 것으로 가정)
            const profileData = await fetchUserProfile(); 
            setUserProfile(profileData);
        } catch (e) {
            // 에러가 발생해도 토큰은 유지하고 프로필만 null로 설정
            console.error("❌ Context 프로필 로드 실패:", e);
            setUserProfile(null);
        }
    }, []);

    // 1. 앱 시작 시: 토큰 확인 및 자동 로그인(갱신) 시도
    useEffect(() => {
        async function initializeAuth() {
            try {
                // 저장된 토큰들 불러오기
                const storedRefreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
                const storedAccessToken = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);

                if (storedRefreshToken) {
                    console.log("🔄 앱 시작: Refresh Token으로 자동 로그인(갱신) 시도 중...");
                    
                    // A. Refresh Token이 있으면 → 백엔드에 새 Access Token 요청
                    const response = await axios.post(`${RAILWAY_BASE_URL}/api/auth/refresh-token`, {
                        refreshToken: storedRefreshToken
                    });

                    const newAccessToken = response.data.accessToken;

                    // 갱신 성공 → 새 토큰 저장 및 상태 업데이트
                    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, newAccessToken);
                    setAccessToken(newAccessToken);
                    
                    // 프로필 정보 불러오기
                    await loadUserProfile();
                    console.log("✅ 자동 로그인 성공");

                } else if (storedAccessToken) {
                    // B. Access Token만 있는 경우 (기존 방식 호환)
                    setAccessToken(storedAccessToken);
                    await loadUserProfile();
                }
            } catch (e) {
                console.log("⚠️ 자동 로그인 실패 (세션 만료):", e);
                // 갱신 실패 시(기간 만료 등) 로그아웃 처리
                await signOut(); 
            } finally {
                setIsLoading(false);
            }
        }
        initializeAuth();
    }, [loadUserProfile]);

    // 2. 로그인 (Access + Refresh 둘 다 저장)
    const signIn = async (newAccessToken: string, newRefreshToken: string) => {
        try {
            // 두 토큰 모두 안전하게 저장
            await SecureStore.setItemAsync(AUTH_TOKEN_KEY, newAccessToken);
            await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, newRefreshToken);
            
            setAccessToken(newAccessToken);
            
            // 로그인 직후 프로필 로드
            await loadUserProfile();
            
            router.replace('/(tabs)/home'); 
        } catch (e) {
            console.error("SignIn Error:", e);
        }
    };

    // 3. 로그아웃 (백엔드 요청 + 토큰 삭제)
    const signOut = async () => {
        try {
            // ① 저장된 토큰 가져오기
            const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
            
            // ② 토큰이 있다면 백엔드에 로그아웃 요청 전송
            if (token) {
                await logoutUser(token); 
            }

            // ③ 앱 내부 토큰 삭제 (원래 있던 코드)
            await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
            await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
            
            // ④ 상태 초기화 및 이동
            setAccessToken(null);
            setUserProfile(null);
            
            // "로그아웃 되었습니다" 알림이 필요하면 여기서 Alert.alert() 띄워도 됨
            router.replace('/welcome'); // 혹은 로그인 화면으로
            
        } catch (e) {
            console.error("SignOut Error:", e);
            // 에러가 나도 강제로 로그인 화면으로 보내는 게 안전
            router.replace('/welcome');
        }
    };

    const value = {
        isAuthenticated: !!accessToken,
        accessToken,
        isLoading,
        userProfile,
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
