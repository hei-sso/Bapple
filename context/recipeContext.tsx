// context/recipeContext.ts

import React from 'react';

// 레시피 인터페이스
export interface Recipe {
  id: string;
  name: string;
  category: string; // 소속 카테고리 ID
}

// 카테고리 인터페이스
export interface Category {
  id: string;
  name: string;
  recipes: Recipe[];
}

// 레시피 Context 타입 정의
export interface RecipeContextType {
  // 전체 카테고리 (Mock 데이터 기반)
  allCategories: Category[];
  // 현재 '찜' 목록에 있는 레시피 목록
  myFavoriteRecipes: Recipe[];
  // 레시피를 '찜'에 추가하는 함수
  addFavorite: (recipe: Recipe) => void;
  // 레시피를 '찜'에서 삭제하는 함수
  removeFavorite: (recipeId: string) => void;
  // 선택된 카테고리 ID (UI 상태)
  selectedCategory: string;
  // 선택된 카테고리 ID를 설정하는 함수
  setSelectedCategory: React.Dispatch<React.SetStateAction<string>>;
}
