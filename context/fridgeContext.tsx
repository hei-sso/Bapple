// context/fridgeContext.ts

import React from 'react';

// 재료 인터페이스
export interface Ingredient {
  id: string;
  name: string;
  category: string; // 소속 카테고리 ID
}

// 카테고리 인터페이스
export interface Category {
  id: string;
  name: string;
  ingredients: Ingredient[];
}

// 냉장고 Context 타입 정의
export interface FridgeContextType {
  // 전체 카테고리 (Mock 데이터 기반)
  allCategories: Category[];
  // 현재 '내 냉장고'에 있는 재료 목록
  myFridgeIngredients: Ingredient[];
  // 재료를 '내 냉장고'에 추가하는 함수
  addIngredient: (ingredient: Ingredient) => void;
  // 재료를 '내 냉장고'에서 삭제하는 함수
  removeIngredient: (ingredientId: string) => void;
  // 선택된 카테고리 ID (UI 상태)
  selectedCategory: string;
  // 선택된 카테고리 ID를 설정하는 함수
  setSelectedCategory: React.Dispatch<React.SetStateAction<string>>;
}
