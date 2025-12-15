// types/fridgeTypes.ts

import React from 'react';

// 재료 인터페이스
export interface Ingredient {
    id: string;
    name: string;
    category: string; // 소속 카테고리 ID
}

// 카테고리 인터페이스 (전체 재료 목록 포함)
export interface Category {
    id: string;
    name: string;
    ingredients: Ingredient[];
}

// 냉장고 Context 타입 정의
export interface FridgeContextType {
    allCategories: Category[]; 
    myFridgeIngredients: Ingredient[]; 
    
    // DB 연동 상태
    isLoading: boolean;
    isError: boolean;
    
    // 비동기 함수
    addIngredient: (ingredient: Ingredient) => Promise<void>;
    removeIngredient: (ingredientId: string) => Promise<void>;
    refetchData: () => void; 
    
    // UI 상태
    selectedCategory: string;
    setSelectedCategory: React.Dispatch<React.SetStateAction<string>>;
}
