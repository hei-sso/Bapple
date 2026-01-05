// api/healthAPI.ts

import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Constants
import { AUTH_TOKEN_KEY } from '@/constants/keys';

// Type
import { HealthOptions, UserHealthPayload } from '@/types/userTypes';

// RAILWAY BASE URL
const RAILWAY_BASE_URL = process.env.EXPO_PUBLIC_RAILWAY_BASE_URL;

// 토큰 가져오는 함수
const getAuthToken = async (): Promise<string | null> => {
    try {
        // SecureStore.getItemAsync()을 사용하여 보안 저장소에서 토큰을 불러옴
        return await SecureStore.getItemAsync(AUTH_TOKEN_KEY); 
    } catch (e) {
        console.error("❌ SecureStore 토큰 로드 실패:", e); 
        return null;
    }
}

// 전체 건강/알레르기 옵션 목록을 DB에서 불러오는 함수
export const fetchHealthOptions = async (): Promise<HealthOptions> => {
    try {
        // GET /health/options 엔드포인트
        const response = await axios.get(`${RAILWAY_BASE_URL}/health/options`);
        
        if (response.data.success && response.data.data) {
            return response.data.data; // { health_condition: [...], allergy: [...] }
        } else {
            throw new Error(response.data.message || "건강 옵션 목록을 불러오지 못했습니다.");
        }
    } catch (error) {
        console.error("❌ 옵션 로드 실패:", error);
        // Axios 에러 처리 강화
        throw new Error(axios.isAxiosError(error) ? `네트워크 오류: ${error.message}` : "서버 오류 발생");
    }
};

// 사용자 프로필에서 현재 선택된 건강 정보 ID 목록을 불러오는 함수 (GET /user/profile 대응)
export const fetchUserHealthData = async (): Promise<UserHealthPayload> => {
    try {
        // await을 사용해 SecureStore에서 토큰 로드 대기
        const token = await getAuthToken(); 
        
        if (!token) {
            // 로그인이 안 되었거나 토큰 만료 시
            throw new Error("로그인이 필요합니다. 토큰이 존재하지 않습니다.");
        }
        // 백엔드: GET /user/profile
        const response = await axios.get(`${RAILWAY_BASE_URL}/user/profile`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }); 
        
        // 백엔드에서 반환된 data 필드에서 health_conditions와 allergies만 추출
        if (response.data.success && response.data.data) {
            const { health_conditions, allergies } = response.data.data;
            return { 
                // ID 목록이 없으면 빈 배열 반환하여 초기에는 선택되지 않도록 함
                health_conditions: health_conditions || [], 
                allergies: allergies || [] 
            };
        } else {
            throw new Error(response.data.message || "사용자 건강 정보를 불러오지 못했습니다.");
        }

    } catch (error) {
        console.error("❌ 프로필 조회 실패:", error);
        // 에러 메시지 세분화 (네트워크/토큰/서버 응답 등)
        if (axios.isAxiosError(error)) {
            throw new Error(error.response?.data?.message || `프로필 조회 실패: ${error.message}`);
        } else {
            throw error; // 토큰 없음 등의 명시적 에러는 그대로 던지기
        }
    }
};

/**
 * 사용자 건강 정보를 저장하는 함수 (PUT /user/profile 대응)
 * @param health_conditions - 선택된 질병 ID 배열
 * @param allergies - 선택된 알레르기 ID 배열
 */
export const saveUserHealthData = async (health_conditions: string[], allergies: string[]): Promise<void> => {
    try {
        const token = await getAuthToken();
        
        if (!token) {
            throw new Error("로그인이 필요합니다. 토큰이 존재하지 않습니다.");
        }

        // 백엔드: PUT /user/profile
        const payload: UserHealthPayload = { health_conditions, allergies };
        
        const response = await axios.put(`${RAILWAY_BASE_URL}/user/profile`, payload, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        
        if (!response.data.success) {
            throw new Error(response.data.message || "정보 저장에 실패했습니다.");
        }
    } catch (error) {
        console.error("❌ 건강 정보 저장 실패:", error);
        if (axios.isAxiosError(error)) {
            throw new Error(error.response?.data?.message || `저장 실패: ${error.message}`);
        } else {
            throw error;
        }
    }
};
