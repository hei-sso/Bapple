// api/fridgeAPI.ts

import axios from 'axios';
import * as SecureStore from 'expo-secure-store'; 
import { Alert } from 'react-native';

// Constants
import { AUTH_TOKEN_KEY } from '@/constants/keys';

// Type
import type { Category, Ingredient } from '@/types/fridgeTypes'; 

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
 * 1. 전체 식재료 목록 및 카테고리 로드 (GET /fridge/ingredients) (앱 UI 구성용)
 * @returns Category[] - 카테고리별로 그룹화된 재료 목록
 */
export const fetchIngredients = async (): Promise<Category[]> => {
    try {
        const response = await axios.get(`${RAILWAY_BASE_URL}/fridge/ingredients`);
        
        if (response.data.success && response.data.data) {
            // ⭐ 서버 응답이 Category[] 형태라고 가정
            return response.data.data as Category[]; 
        } else {
            throw new Error(response.data.message || "전체 재료 목록을 불러오지 못했습니다.");
        }
    } catch (error) {
        console.error("❌ 전체 재료 로드 실패:", error);
        throw new Error(axios.isAxiosError(error) ? `네트워크 오류: ${error.message}` : "서버 오류 발생");
    }
};

/**
 * 2. 현재 로그인된 사용자의 냉장고 재료 목록 로드 (GET /fridge/my)
 * @returns Ingredient[] - 사용자가 등록한 재료 목록
 */
export const fetchMyFridge = async (): Promise<Ingredient[]> => {
    const token = await getAuthToken();
    
    if (!token) {
        // Context에서 로그인 상태를 확인하겠지만, API 레벨에서도 방어적으로 처리
        Alert.alert("오류", "로그인이 필요합니다."); 
        return []; 
    }

    try {
        const response = await axios.get(`${RAILWAY_BASE_URL}/fridge/my`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success && response.data.data) {
            // ⭐ 서버 응답이 Ingredient[] 형태라고 가정
            return response.data.data as Ingredient[];
        } else {
            throw new Error(response.data.message || "내 냉장고 재료를 불러오지 못했습니다.");
        }
    } catch (error) {
        console.error("❌ 내 냉장고 로드 실패:", error);
        throw new Error(axios.isAxiosError(error) ? `프로필 조회 실패: ${error.message}` : "서버 오류 발생");
    }
};

/**
 * 3. 냉장고에 재료 추가 (POST /fridge/my)
 * @param ingredientId - 추가할 재료의 고유 ID
 */
export const addIngredientToFridge = async (ingredientId: string): Promise<void> => {
    const token = await getAuthToken();
    
    if (!token) {
        throw new Error("로그인이 필요합니다. 토큰이 존재하지 않습니다.");
    }
    
    try {
        // POST 요청 (ingredient_id를 바디에 담아 전송)
        await axios.post(`${RAILWAY_BASE_URL}/fridge/my`, { ingredient_id: ingredientId }, {
            headers: { Authorization: `Bearer ${token}` }
        });

    } catch (error) {
        console.error("❌ 재료 추가 실패:", error);
        throw new Error(axios.isAxiosError(error) ? `재료 추가 실패: ${error.message}` : "서버 오류 발생");
    }
};

/**
 * 4. 냉장고에서 재료 삭제 (DELETE /fridge/my/{ingredientId})
 * @param ingredientId - 삭제할 재료의 고유 ID
 */
export const removeIngredientFromFridge = async (ingredientId: string): Promise<void> => {
    const token = await getAuthToken();
    
    if (!token) {
        throw new Error("로그인이 필요합니다. 토큰이 존재하지 않습니다.");
    }

    try {
        // DELETE 요청 (ID를 URL 경로에 포함)
        await axios.delete(`${RAILWAY_BASE_URL}/fridge/my/${ingredientId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

    } catch (error) {
        console.error("❌ 재료 삭제 실패:", error);
        throw new Error(axios.isAxiosError(error) ? `재료 삭제 실패: ${error.message}` : "서버 오류 발생");
    }
};
