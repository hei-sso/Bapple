// types/recipeTypes.ts

import React from 'react';

// 레시피 인터페이스
export interface Recipe {
    id: string;
    name: string;
    category: string; // 소속 카테고리 ID
    recipeImageUrl: string | null; // 레시피 사진 URL
}

// 카테고리 인터페이스 (전체 레시피 목록 포함)
export interface Category {
    id: string;
    name: string;
    recipes: Recipe[];
}

// AI 추천 레시피 타입
export interface RecommendedRecipe {
    id: string;
    name: string;
    rating: number; // 별점 (1~5)
    cookTimeMinutes: number; // 조리 시간 (분)
    recipeImageUrl: string | null; // 레시피 사진 URL
}

//  레시피 상세 인터페이스 (상세 페이지용)
export interface RecipeDetail {
    id: string;
    name: string;
    recipeImageUrl: string | null;
    difficulty: string; // 난이도
    cookTimeMinutes: number; // 조리 시간
    ingredients: string[] | null; // 레시피 재료
    instructions: string[] | null; // 조리 방법
}

// 레시피 Context 타입 정의
export interface RecipeContextType {
    allCategories: Category[]; 
    myFavoriteRecipes: Recipe[]; 
    
    // DB 연동 상태 추가
    isLoading: boolean;
    isError: boolean;
    
    // 비동기 함수로 변경
    addFavorite: (recipe: Recipe) => Promise<void>; 
    removeFavorite: (recipeId: string) => Promise<void>; 
    refetchData: () => void; // 새로고침 함수 추가
    
    // UI 상태
    selectedCategory: string;
    setSelectedCategory: React.Dispatch<React.SetStateAction<string>>;
}
