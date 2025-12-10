// api/recipeAPI.ts

import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Constants
import { AUTH_TOKEN_KEY } from '@/constants/keys';

// Type
import type { Category, Recipe, RecommendedRecipe } from '@/types/recipeTypes';

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

/**
 * 1. 전체 레시피 목록 및 카테고리 로드 (GET /recipe/all) (앱 UI 구성용)
 * @returns Category[] - 카테고리별로 그룹화된 레시피 목록
 */
export const fetchAllRecipes = async (): Promise<Category[]> => {
    try {
        const response = await axios.get(`${RAILWAY_BASE_URL}/recipe/all`);
        
        if (response.data.success && response.data.data) {
            // ⭐ 서버 응답이 Category[] 형태라고 가정
            return response.data.data as Category[]; 
        } else {
            throw new Error(response.data.message || "전체 레시피 목록을 불러오지 못했습니다.");
        }
    } catch (error) {
        console.error("❌ 전체 레시피 로드 실패:", error);
        throw new Error(axios.isAxiosError(error) ? `네트워크 오류: ${error.message}` : "서버 오류 발생");
    }
};

/**
 * 2. 현재 로그인된 사용자의 찜 레시피 목록 로드 (GET /recipe/favorite)
 * @returns Recipe[] - 사용자가 찜한 레시피 목록
 */
export const fetchMyFavorites = async (): Promise<Recipe[]> => {
    const token = await getAuthToken();
    
    if (!token) {
        // 로그아웃 상태일 경우
        return []; 
    }

    try {
        const response = await axios.get(`${RAILWAY_BASE_URL}/recipe/favorite`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success && response.data.data) {
            // ⭐ 서버 응답이 Recipe[] 형태라고 가정
            return response.data.data as Recipe[];
        } else {
            throw new Error(response.data.message || "찜 레시피를 불러오지 못했습니다.");
        }
    } catch (error) {
        console.error("❌ 찜 레시피 로드 실패:", error);
        throw new Error(axios.isAxiosError(error) ? `찜 목록 조회 실패: ${error.message}` : "서버 오류 발생");
    }
};

/**
 * 3. 레시피 찜 추가 (POST /recipe/favorite)
 * @param recipeId - 찜할 레시피의 고유 ID
 */
export const addRecipeToFavorite = async (recipeId: string): Promise<void> => {
    const token = await getAuthToken();
    
    if (!token) {
        throw new Error("로그인이 필요합니다. 토큰이 존재하지 않습니다.");
    }
    
    try {
        // POST 요청 (recipe_id를 바디에 담아 전송)
        await axios.post(`${RAILWAY_BASE_URL}/recipe/favorite`, { recipe_id: recipeId }, {
            headers: { Authorization: `Bearer ${token}` }
        });

    } catch (error) {
        console.error("❌ 찜 추가 실패:", error);
        throw new Error(axios.isAxiosError(error) ? `찜 추가 실패: ${error.message}` : "서버 오류 발생");
    }
};

/**
 * 4. 레시피 찜 삭제 (DELETE /recipe/favorite/{recipeId})
 * @param recipeId - 삭제할 레시피의 고유 ID
 */
export const removeRecipeFromFavorite = async (recipeId: string): Promise<void> => {
    const token = await getAuthToken();
    
    if (!token) {
        throw new Error("로그인이 필요합니다. 토큰이 존재하지 않습니다.");
    }

    try {
        // DELETE 요청 (ID를 URL 경로에 포함)
        await axios.delete(`${RAILWAY_BASE_URL}/recipe/favorite/${recipeId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

    } catch (error) {
        console.error("❌ 찜 삭제 실패:", error);
        throw new Error(axios.isAxiosError(error) ? `찜 삭제 실패: ${error.message}` : "서버 오류 발생");
    }
};

// 5. AI 추천 레시피 목록 로드 (POST /api/recommend/week)
export const fetchRecommendedRecipes = async (user_id: string): Promise<RecommendedRecipe[]> => {
    const token = await getAuthToken();
    
    if (!token) {
        throw new Error("로그인이 필요합니다. AI 추천 기능을 사용할 수 없습니다.");
    }
    
    try {
        const response = await axios.post(
            `${RAILWAY_BASE_URL}/api/recommend/week`, 
            { user_id: user_id },
            { 
                headers: { 
                    Authorization: `Bearer ${token}`
                } 
            } 
        );
        
        // response.data.data -> response.data.items 로 변경
        // 백엔드: { success: true, items: [...] }
        if (response.data.success && response.data.items) {
            return response.data.items as RecommendedRecipe[]; 
        } else {
            // items가 없을 때 에러 메시지 띄우기
            throw new Error(response.data.message || "AI 추천 레시피 목록을 불러오지 못했습니다.");
        }
    } catch (error) {
        console.error("❌ AI 추천 레시피 로드 실패:", error);
        throw new Error(axios.isAxiosError(error) 
            ? `추천 레시피 조회 실패: ${error.message} (상태 코드: ${error.response?.status})` 
            : "서버 오류 발생"
        );
    }
};
