// context/authContext.tsx

import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, ReactNode, useContext, useEffect, useState, useCallback } from 'react';

// API 임포트
import { fetchUserProfile } from '@/api/userAPI';

// Type 임포트
import { UserProfile } from '@/types/userTypes';

// Constants 임포트
import { AUTH_TOKEN_KEY } from '@/constants/keys';

// 타입 정의
interface AuthContextType {
    isAuthenticated: boolean;
    accessToken: string | null;
    isLoading: boolean;
    userProfile: UserProfile | null;
    signIn: (token: string) => Promise<void>;
    signOut: () => Promise<void>;
}

// 기본값
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const router = useRouter();
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null); // 프로필 상태

    // 프로필 데이터를 서버에서 불러오는 함수
    const loadUserProfile = useCallback(async (token: string) => {
        try {
            // ⭐ API 함수 호출
            const profileData = await fetchUserProfile(); 
            setUserProfile(profileData);
        } catch (e) {
            // 에러가 발생해도 토큰은 유지하고 프로필만 null로 설정
            console.error("❌ Context 프로필 로드 실패:", e);
            setUserProfile(null);
        }
    }, []);

    // 1. 앱 시작 시 토큰 로드 및 인증 상태 확인
    useEffect(() => {
        async function loadToken() {
            try {
                const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
                if (token) {
                    setAccessToken(token);
                    // ⭐ 토큰이 있다면 프로필 정보도 불러오기
                    await loadUserProfile(token); 
                }
            } catch (e) {
                console.error("SecureStore load error:", e);
            } finally {
                setIsLoading(false);
            }
        }
        loadToken();
    }, [loadUserProfile]);

    // 2. 로그인 (토큰 저장)
    const signIn = async (token: string) => {
        await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
        setAccessToken(token);
        // ⭐ 로그인 시 토큰 저장 후 프로필 정보도 불러오기
        await loadUserProfile(token); 
        router.replace('/(tabs)/home'); 
    };

    // 3. 로그아웃 (토큰 삭제)
    const signOut = async () => {
        await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
        setAccessToken(null);
        setUserProfile(null); // ⭐ 로그아웃 시 프로필 초기화 (보류)
        router.replace('/welcome');
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
