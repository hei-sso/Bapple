// context/recipeContext.tsx

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';

// API
import { fetchAllRecipes, fetchMyFavorites, addRecipeToFavorite, removeRecipeFromFavorite } from '@/api/recipeAPI';

// Context
import { useAuth } from './authContext';

// Type
import type { Category, Recipe, RecipeContextType } from '@/types/recipeTypes';

// Recipe Context 생성
const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

// 레시피 상태 관리 Provider
export const RecipeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 인증 상태 확인 (로그인 여부에 따라 찜 목록 로드)
  const { isAuthenticated } = useAuth(); 
  
  // DB에서 가져올 데이터 상태
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [myFavoriteRecipes, setMyFavoriteRecipes] = useState<Recipe[]>([]);

  // UI 및 로딩 상태
  const [selectedCategory, setSelectedCategory] = useState<string>('my_recipe');
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // 데이터 새로고침 트리거

  // 1. 초기 데이터 로드 함수 (API 호출)
  const loadInitialData = useCallback(async () => {
    if (!isAuthenticated) {
      // 로그아웃 상태일 경우 데이터 초기화
      setAllCategories([]);
      setMyFavoriteRecipes([]);
      setIsLoading(false);
      return; 
    }

    setIsLoading(true);
    setIsError(false);
    try {
      const [categories, favorites] = await Promise.all([
        fetchAllRecipes(), // 전체 레시피 로드
        fetchMyFavorites(),   // 내 찜 레시피 로드 (인증 필요)
      ]);

      // 첫 번째 카테고리인 '찜' 카테고리에 찜 레시피 목록을 반영 (UI 로직)
      const categoriesWithFavorites = categories.map(cat => {
          if (cat.id === 'my_recipe') {
              return { ...cat, recipes: favorites };
          }
          return cat;
      });

      setAllCategories(categoriesWithFavorites);
      setMyFavoriteRecipes(favorites);

    } catch (error) {
      console.error("❌ 레시피 데이터 로드 실패:", error);
      setIsError(true);
      Alert.alert("오류", "레시피 데이터를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // 2. 컴포넌트 마운트 및 refreshTrigger 변경 시 데이터 로드 실행
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData, refreshTrigger]);

  // 3. 찜 추가 (DB 통신 후 로컬 상태 업데이트)
  const addFavorite = useCallback(async (recipe: Recipe) => {
    if (!isAuthenticated) { Alert.alert("오류", "로그인이 필요합니다."); return; }
    
    if (myFavoriteRecipes.find(item => item.id === recipe.id)) return; // 이미 찜

    try {
      await addRecipeToFavorite(recipe.id); 
        
      // 성공 시 즉시 업데이트
      setMyFavoriteRecipes(prev => [...prev, recipe]);
      // allCategories의 'my_recipe' 카테고리도 업데이트
      setAllCategories(prev => prev.map(cat => 
        cat.id === 'my_recipe' ? { ...cat, recipes: [...cat.recipes, recipe] } : cat
      ));
        
    } catch (error) {
      Alert.alert("오류", "찜 추가에 실패했습니다.");
      setRefreshTrigger(prev => prev + 1); // 실패 시 새로고침하여 동기화
    }
  }, [isAuthenticated, myFavoriteRecipes]);

  // 4. 찜 삭제 (DB 통신 후 로컬 상태 업데이트)
  const removeFavorite = useCallback(async (recipeId: string) => {
    if (!isAuthenticated) { Alert.alert("오류", "로그인이 필요합니다."); return; }

    try {
      await removeRecipeFromFavorite(recipeId); 
      
      // 성공 시 즉시 업데이트
      setMyFavoriteRecipes(prev => prev.filter(item => item.id !== recipeId));
      // allCategories의 'my_recipe' 카테고리도 업데이트
      setAllCategories(prev => prev.map(cat => 
        cat.id === 'my_recipe' ? { ...cat, recipes: cat.recipes.filter(r => r.id !== recipeId) } : cat
      ));

    } catch (error) {
      Alert.alert("오류", "찜 삭제에 실패했습니다.");
      setRefreshTrigger(prev => prev + 1); 
    }
  }, [isAuthenticated]);

  // 5. 데이터 새로고침 함수
  const refetchData = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Context Value (성능 최적화)
  const contextValue = useMemo(() => ({
    allCategories,
    myFavoriteRecipes,
    addFavorite,
    removeFavorite,
    selectedCategory,
    setSelectedCategory,
    isLoading,
    isError,
    refetchData,
  }), [
    allCategories,
    myFavoriteRecipes,
    addFavorite,
    removeFavorite,
    selectedCategory,
    isLoading,
    isError,
    refetchData
  ]);

  return (
    <RecipeContext.Provider value={contextValue}>
      {children}
    </RecipeContext.Provider>
  );
};

// Custom Hook
export const useRecipe = () => {
    const context = useContext(RecipeContext);
    if (!context) {
        throw new Error('useRecipe must be used within a RecipeProvider');
    }
    return context;
};
