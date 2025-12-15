// api/friendAPI.ts

import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Constants
import { AUTH_TOKEN_KEY } from '@/constants/keys'; 

// Type
import { Friend } from '@/types/friendTypes';

// RAILWAY BASE URL
const RAILWAY_BASE_URL = process.env.EXPO_PUBLIC_RAILWAY_BASE_URL;

// 토큰 가져오는 함수
const getAuthToken = async (): Promise<string | null> => {
    try {
        return await SecureStore.getItemAsync(AUTH_TOKEN_KEY); 
    } catch (e) {
        console.error("❌ SecureStore 토큰 로드 실패:", e); 
        return null;
    }
}

// 친구 목록 및 사용자 고유 ID를 DB에서 불러오는 함수 (GET /friends/list)
export const fetchFriendsListAndUserId = async (): Promise<{ myUniqueId: string | null; following: Friend[]; follower: Friend[] }> => {
    const EMPTY_LIST: Friend[] = [];
    try {
        const token = await getAuthToken(); 
        
        if (!token) {
            throw new Error("로그인이 필요합니다. 토큰이 존재하지 않습니다.");
        }
        
        // 백엔드: GET /friends/list (친구 목록 및 사용자 ID를 한 번에 반환한다고 가정)
        const response = await axios.get(`${RAILWAY_BASE_URL}/friends/list`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }); 
        
        if (response.data.success && response.data.data) {
            const { userUniqueId, following, follower } = response.data.data;

            return { 
                myUniqueId: userUniqueId || null,
                following: following || EMPTY_LIST, 
                follower: follower || EMPTY_LIST 
            };
        } else {
            throw new Error(response.data.message || "친구 목록을 불러오지 못했습니다.");
        }

    } catch (error) {
        console.error("❌ 친구 목록 조회 실패:", error);
        
        if (axios.isAxiosError(error)) {
            // DB 연결 실패 또는 서버 오류 발생 시, myUniqueId=null을 유도하여 UI에 'DB 연결 오류' 표시
            console.error(`네트워크 오류/서버 응답: ${error.message}`);
        } else {
            // 토큰 없음 오류 등
            console.error(error);
        }

        // DB 연결 오류 또는 심각한 에러 발생 시, 빈 데이터와 null ID 반환
        return { myUniqueId: null, following: EMPTY_LIST, follower: EMPTY_LIST };
    }
};

// 팔로우 상태를 업데이트하는 함수 (POST /friends/follow)
export const updateFollowStatusAPI = async (targetId: string, action: 'FOLLOW' | 'UNFOLLOW'): Promise<void> => {
    try {
        const token = await getAuthToken();
        
        if (!token) {
            throw new Error("로그인이 필요합니다. 토큰이 존재하지 않습니다.");
        }

        const payload = { targetId, action };
        
        // 백엔드: POST /friends/follow
        const response = await axios.post(`${RAILWAY_BASE_URL}/friends/follow`, payload, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        
        if (!response.data.success) {
            throw new Error(response.data.message || "팔로우/취소 요청에 실패했습니다.");
        }
    } catch (error) {
        console.error("❌ 팔로우 업데이트 실패:", error);
        if (axios.isAxiosError(error)) {
            throw new Error(error.response?.data?.message || `업데이트 실패: ${error.message}`);
        } else {
            throw error;
        }
    }
};
