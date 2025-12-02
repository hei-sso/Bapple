// api/userAPI.ts

import axios from 'axios';
import * as SecureStore from 'expo-secure-store'; 
import { UserProfile } from '@/types/userTypes';

const AUTH_TOKEN_KEY = 'user_access_token';
const RAILWAY_BASE_URL = process.env.EXPO_PUBLIC_RAILWAY_BASE_URL;

// 토큰 가져오기
const getAuthToken = async (): Promise<string | null> => {
    try {
        return await SecureStore.getItemAsync(AUTH_TOKEN_KEY); 
    } catch (e) {
        console.error("❌ SecureStore 토큰 로드 실패:", e);
        return null;
    }
}

// 1. 프로필 조회 (GET /user/profile)
export const fetchUserProfile = async (): Promise<UserProfile> => {
    const token = await getAuthToken();
    
    if (!token) throw new Error("로그인이 필요합니다.");

    try {
        const response = await axios.get(`${RAILWAY_BASE_URL}/user/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        }); 
        
        if (response.data.success && response.data.data) {
            const data = response.data.data;

            // 백엔드가 보내주는 이름에 맞춰서 매핑
            return { 
                id: data.id || 0, // id가 없으면 0 처리
                nickname: data.nickname || '',
                email: data.email || '', // 이메일 추가
                
                // 팔로잉, 팔로워 기본값 0
                followers: data.followers || 0,
                following: data.following || 0,

                // 이미지, 전화번호 및 생년월일 필드 (값이 없으면 null 또는 빈 문자열 반환)
                profileImageUrl: data.profile_image_url || null,
                
                // 백엔드가 phoneNumber로 주면 그거 쓰고, 아니면 phone_number 확인
                phoneNumber: data.phoneNumber || data.phone_number || '', 
                
                // 백엔드가 birthday로 주면 그거 쓰고, 아니면 birthdate 확인
                birthday: data.birthday || data.birthdate || '',
            };
        } else {
            throw new Error(response.data.message || "프로필 로드 실패");
        }

    } catch (error) {
        console.error("❌ 프로필 조회 실패:", error);
        throw error;
    }
};

// 2. 프로필 업데이트 (PUT /user/profile)
export const updateUserProfile = async (payload: Partial<UserProfile>): Promise<void> => {
    const token = await getAuthToken();
    if (!token) throw new Error("로그인이 필요합니다.");

    try {
        const response = await axios.put(`${RAILWAY_BASE_URL}/user/profile`, payload, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        // 백엔드가 데이터를 안 주고 메시지만 줄 수도 있음 (success가 true면 성공으로 간주)
        if (response.data.success) {
            return; // 성공 (리턴값 없음)
        } else {
            throw new Error(response.data.message || "저장 실패");
        }

    } catch (error) {
        console.error("❌ 프로필 업데이트 실패:", error);
        if (axios.isAxiosError(error)) {
            // API 응답 에러 메시지 전달
            throw new Error(error.response?.data?.message || `저장 실패: ${error.message}`);
        } else {
            throw error;
        }
    }
};
