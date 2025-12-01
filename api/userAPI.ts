// api/userAPI.ts

import axios from 'axios';
import * as SecureStore from 'expo-secure-store'; 

// Type 임포트
import { UserProfile } from '@/types/userTypes';

// Constants 임포트
import { AUTH_TOKEN_KEY } from '@/constants/keys';

// RAILWAY BASE URL
const RAILWAY_BASE_URL = process.env.EXPO_PUBLIC_RAILWAY_BASE_URL;

// SecureStore에서 토큰 가져오는 함수
const getAuthToken = async (): Promise<string | null> => {
    try {
        return await SecureStore.getItemAsync(AUTH_TOKEN_KEY); 
    } catch (e) {
        console.error("❌ SecureStore 토큰 로드 실패:", e);
        return null;
    }
}

/**
 * 사용자 프로필 정보를 서버에서 불러오는 함수 (GET /user/profile 대응)
 * @returns UserProfile - 사용자 닉네임, 팔로워, 팔로잉, 프로필 사진 URL 등
 */
export const fetchUserProfile = async (): Promise<UserProfile> => {
    const token = await getAuthToken();
    
    if (!token) {
        // 토큰이 없으면 로그인 필요 에러를 던짐
        throw new Error("로그인이 필요합니다. 토큰이 존재하지 않습니다.");
    }

    try {
        const response = await axios.get(`${RAILWAY_BASE_URL}/user/profile`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }); 
        
        if (response.data.success && response.data.data) {
            const data = response.data.data;

            // ⭐ 응답 데이터를 UserProfile 타입에 맞게 변환하여 반환
            return { 
                id: data.id,
                nickname: data.nickname || 'Bapple', // 닉네임이 없으면 기본값
                // followers: data.followers || 0,
                // following: data.following || 0,
                profileImageUrl: data.profile_image_url || null, // API 응답 필드명 확인 필요 (profile_image_url 가정)
            };
        } else {
            throw new Error(response.data.message || "사용자 프로필 정보를 불러오지 못했습니다.");
        }

    } catch (error) {
        console.error("❌ 프로필 조회 실패:", error);
        if (axios.isAxiosError(error)) {
            // API 응답 에러 메시지 전달
            throw new Error(error.response?.data?.message || `프로필 조회 실패: ${error.message}`);
        } else {
            throw error;
        }
    }
};
