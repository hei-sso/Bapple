// context/fridgeContext.tsx

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';

// API
import { fetchIngredients, fetchMyFridge, addIngredientToFridge, removeIngredientFromFridge } from '@/api/fridgeAPI';

// Context
import { useAuth } from './authContext';

// Type
import type { Category, Ingredient, FridgeContextType } from '@/types/fridgeTypes';

// Fridge Context 생성
const FridgeContext = createContext<FridgeContextType | undefined>(undefined);

// 냉장고 상태 관리 Provider
export const FridgeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 인증 상태 확인
  const { isAuthenticated } = useAuth(); 
  
  // DB에서 가져올 데이터 상태
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [myFridgeIngredients, setMyFridgeIngredients] = useState<Ingredient[]>([]);

  // UI 및 로딩 상태
  const [selectedCategory, setSelectedCategory] = useState<string>('my_fridge');
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // 데이터 새로고침 트리거

  // 1. 초기 데이터 로드 함수 (API 호출)
  const loadInitialData = useCallback(async () => {
    if (!isAuthenticated) {
      // 로그아웃 상태일 경우 데이터 초기화
      setAllCategories([]);
      setMyFridgeIngredients([]);
      setIsLoading(false);
      return; 
    }

    setIsLoading(true);
    setIsError(false);
    try {
      const [categories, fridge] = await Promise.all([
        fetchIngredients(), // 전체 재료 로드
        fetchMyFridge(),   // 내 냉장고 재료 로드 (인증 필요)
      ]);

      setAllCategories(categories);
      setMyFridgeIngredients(fridge);

    } catch (error) {
      console.error("❌ 냉장고 데이터 로드 실패:", error);
      setIsError(true);
      Alert.alert("오류", "냉장고 데이터를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // 2. 컴포넌트 마운트 및 refreshTrigger 변경 시 데이터 로드 실행
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData, refreshTrigger]);

  // 3. 재료 추가 (DB 통신 후 로컬 상태 업데이트)
  const addIngredient = useCallback(async (ingredient: Ingredient) => {
    if (!isAuthenticated) { Alert.alert("오류", "로그인이 필요합니다."); return; }
    
    if (myFridgeIngredients.find(item => item.id === ingredient.id)) return;

    try {
      await addIngredientToFridge(ingredient.id); 
        
      // 성공 시 즉시 업데이트
      setMyFridgeIngredients(prev => [...prev, ingredient]);
        
    } catch (error) {
      Alert.alert("오류", "재료 추가에 실패했습니다.");
      setRefreshTrigger(prev => prev + 1); // 실패 시 새로고침하여 동기화
    }
  }, [isAuthenticated, myFridgeIngredients]);

  // 4. 재료 삭제 (DB 통신 후 로컬 상태 업데이트)
  const removeIngredient = useCallback(async (ingredientId: string) => {
    if (!isAuthenticated) { Alert.alert("오류", "로그인이 필요합니다."); return; }

    try {
      await removeIngredientFromFridge(ingredientId); 
      
      // 성공 시 즉시 업데이트
      setMyFridgeIngredients(prev => prev.filter(item => item.id !== ingredientId));

    } catch (error) {
      Alert.alert("오류", "재료 삭제에 실패했습니다.");
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
    myFridgeIngredients,
    addIngredient,
    removeIngredient,
    selectedCategory,
    setSelectedCategory,
    isLoading,
    isError,
    refetchData,
  }), [
    allCategories,
    myFridgeIngredients,
    addIngredient,
    removeIngredient,
    selectedCategory,
    isLoading,
    isError,
    refetchData
  ]);

  return (
    <FridgeContext.Provider value={contextValue}>
      {children}
    </FridgeContext.Provider>
  );
};

// Custom Hook
export const useFridge = () => {
    const context = useContext(FridgeContext);
    if (!context) {
        throw new Error('useFridge must be used within a FridgeProvider');
    }
    return context;
};
