// types/recipeTypes.ts

import React from 'react';

// 레시피 인터페이스
export interface Recipe {
    id: string;
    name: string;
    category: string; // 소속 카테고리 ID
}

// 카테고리 인터페이스 (전체 레시피 목록 포함)
export interface Category {
    id: string;
    name: string;
    recipes: Recipe[];
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
