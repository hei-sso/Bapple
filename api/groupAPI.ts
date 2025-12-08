// api/groupAPI.ts

import axios from 'axios';
import * as SecureStore from 'expo-secure-store'; 

// Constants
import { AUTH_TOKEN_KEY } from '@/constants/keys';

// Type
import type { Group, GroupCreationData, RecipeSchedule, GroupRecipeItem } from '@/types/groupTypes'; 

// RAILWAY BASE URL
const RAILWAY_BASE_URL = process.env.EXPO_PUBLIC_RAILWAY_BASE_URL;

// 토큰 헬퍼 함수
const getAuthToken = async (): Promise<string | null> => {
    try {
        return await SecureStore.getItemAsync(AUTH_TOKEN_KEY); 
    } catch (e) {
        console.error("❌ SecureStore 토큰 로드 실패:", e);
        return null;
    }
}

// 그룹 목록 로드
export const fetchMyGroups = async (): Promise<Group[]> => {
    const token = await getAuthToken();
    if (!token) {
        console.log("⚠️ 토큰 없음: 그룹 목록을 빈 상태로 반환합니다.");
        return []; 
    }
    try {
        const response = await axios.get(`${RAILWAY_BASE_URL}/groups/my`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success && response.data.data) {
            return response.data.data as Group[]; 
        } else {
            console.error("❌ 그룹 목록 로드 실패 (서버 응답 오류):", response.data.message);
            return []; 
        }
    } catch (error) {
        // 네트워크/DB 오류 발생 시에도 throw하지 않고 빈 배열 반환하여 UI 표시 보장
        console.error("❌ 그룹 목록 로드 실패 (네트워크/DB 오류):", error);
        return []; 
    }
};

// 새 그룹 생성
export const createGroup = async (data: GroupCreationData): Promise<Group> => {
    const token = await getAuthToken();
    if (!token) throw new Error("로그인이 필요합니다.");
    
    const payload = {
        name: data.name,
        description: data.description,
        is_fridge_shared: data.isFridgeShared,
    };

    try {
        const response = await axios.post(`${RAILWAY_BASE_URL}/groups`, payload, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success && response.data.data) {
            return response.data.data as Group;
        } else {
            throw new Error(response.data.message || "그룹 생성에 실패했습니다.");
        }
    } catch (error) {
        console.error("❌ 그룹 생성 실패:", error);
        throw new Error(axios.isAxiosError(error) ? `그룹 생성 실패: ${error.message}` : "서버 오류 발생");
    }
};

// 초대 코드로 그룹 가입
export const joinGroup = async (inviteCode: string): Promise<Group> => {
    const token = await getAuthToken();
    if (!token) throw new Error("로그인이 필요합니다.");
    
    try {
        const response = await axios.post(`${RAILWAY_BASE_URL}/groups/join`, { invite_code: inviteCode }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success && response.data.data) {
            return response.data.data as Group;
        } else {
            throw new Error(response.data.message || "그룹 가입에 실패했습니다. (초대 코드 오류)");
        }
    } catch (error) {
        console.error("❌ 그룹 가입 실패:", error);
        throw new Error(axios.isAxiosError(error) ? `가입 실패: ${error.message}` : "서버 오류 발생");
    }
};

// 그룹 고정 상태 토글
export const toggleGroupPin = async (groupId: string): Promise<void> => {
    const token = await getAuthToken();
    if (!token) throw new Error("로그인이 필요합니다.");

    try {
        await axios.patch(`${RAILWAY_BASE_URL}/groups/${groupId}/pin`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
    } catch (error) {
        console.error(`❌ 그룹 ${groupId} 고정 토글 실패:`, error);
        throw new Error(axios.isAxiosError(error) ? `토글 실패: ${error.message}` : "서버 오류 발생");
    }
};

// 사용자의 전체 그룹 레시피 스케줄 로드 (GET /schedule/my)
export const fetchAllMyGroupSchedules = async (weekStartString: string): Promise<RecipeSchedule[]> => {
    const token = await getAuthToken();
    if (!token) {
        return []; 
    }

    try {
        const response = await axios.get(`${RAILWAY_BASE_URL}/schedule/my`, {
            params: { week_start_date: weekStartString },
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success && response.data.data) {
            return response.data.data as RecipeSchedule[]; 
        } else {
            return [];
        }
    } catch (error) {
        console.error("❌ 주간 스케줄 로드 실패:", error);
        return [];
    }
};

// 식단 메뉴 추가 (POST /schedule)
export const addRecipeToSchedule = async (data: { 
    recipeId: string; 
    date: string; 
    groupId: string | 'personal'; 
}): Promise<GroupRecipeItem> => {
    const token = await getAuthToken();
    if (!token) throw new Error("로그인이 필요합니다.");

    const payload = {
        recipe_id: data.recipeId,
        schedule_date: data.date,
        group_id: data.groupId === 'personal' ? null : data.groupId, // 'personal'은 null로 서버에 전달
    };
    
    try {
        const response = await axios.post(`${RAILWAY_BASE_URL}/schedule`, payload, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success && response.data.data) {
            // 서버에서 생성된 GroupRecipeItem (ID 포함)을 반환한다고 가정
            // 서버에서 groupId가 null로 반환될 수 있으므로, 타입 캐스팅 주의
            return response.data.data as GroupRecipeItem; 
        } else {
            throw new Error(response.data.message || "식단 추가에 실패했습니다.");
        }
    } catch (error) {
        console.error("❌ 식단 메뉴 추가 실패:", error);
        throw new Error(axios.isAxiosError(error) ? `메뉴 추가 실패: ${error.message}` : "서버 오류 발생");
    }
};

// 식단 메뉴 삭제 (DELETE /schedule/{scheduleId})
export const deleteRecipeFromSchedule = async (scheduleId: string): Promise<void> => {
    const token = await getAuthToken();
    if (!token) throw new Error("로그인이 필요합니다.");

    try {
        await axios.delete(`${RAILWAY_BASE_URL}/schedule/${scheduleId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
    } catch (error) {
        console.error("❌ 식단 메뉴 삭제 실패:", error);
        throw new Error(axios.isAxiosError(error) ? `메뉴 삭제 실패: ${error.message}` : "서버 오류 발생");
    }
};
