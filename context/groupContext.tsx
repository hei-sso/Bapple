// context/GroupContext.tsx

import { format, startOfWeek } from 'date-fns';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';

// API
import {
  addRecipeToSchedule,
  createGroup as apiCreateGroup,
  joinGroup as apiJoinGroup,
  deleteRecipeFromSchedule,
  fetchAllMyGroupSchedules,
  fetchMyGroups,
  toggleGroupPin
} from '@/api/groupAPI';

// Context
import { useAuth } from './authContext';

// Type
import type { Group, GroupContextType, GroupCreationData, GroupRecipeItem, RecipeSchedule } from '@/types/groupTypes';

// Group Context 생성
const GroupContext = createContext<GroupContextType | undefined>(undefined);

// 그룹 상태 관리 Provider
export const GroupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth(); 
  
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [groupSchedules, setGroupSchedules] = useState<Record<string, RecipeSchedule[]>>({}); 
  const [isLoading, setIsLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0); 

  // 그룹 목록 로드 함수 (인증 상태를 기반으로 실행)
  const loadMyGroups = useCallback(async () => {
    if (!isAuthenticated) {
      setMyGroups([]); // 로그아웃 상태일 때는 그룹 목록을 비워둠
      return;
    }
      
    setIsLoading(true);
    try {
      const groups = await fetchMyGroups();
      setMyGroups(groups);
      
    } catch (error) {
      console.error("❌ 그룹 데이터 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // 외부에서 그룹 목록 갱신을 강제하기 위한 함수
  const refreshGroups = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // 주간 스케줄 로드 함수 
  const fetchSchedulesForWeek = useCallback(async (weekStartString: string) => {
    if (groupSchedules[weekStartString]) return;

    try {
      const schedules = await fetchAllMyGroupSchedules(weekStartString);
      
      setGroupSchedules(prev => ({
        ...prev,
        [weekStartString]: schedules
      }));

    } catch (error) {
      console.error("❌ 주간 스케줄 로드 실패:", error);
    }
  }, [groupSchedules]);

  // 식단 메뉴 추가 함수
  const scheduleRecipe = useCallback(async (data: { 
    recipeId: string; 
    date: string; 
    groupId: string | 'personal'; 
  }) => {
    if (!isAuthenticated) { Alert.alert("경고", "로그인이 필요합니다."); throw new Error("로그인이 필요합니다."); }

    try {
      const newScheduleItem: GroupRecipeItem = await addRecipeToSchedule(data);
      
      // Context 상태 즉시 업데이트
      setGroupSchedules(prev => {
        const dateObj = new Date(data.date);
        const weekStart = format(startOfWeek(dateObj, { weekStartsOn: 0 }), 'yyyy-MM-dd');
        const currentWeekSchedules = prev[weekStart] || [];
        
        // 해당 날짜 스케줄 찾기/생성
        const dateIndex = currentWeekSchedules.findIndex(s => s.date === data.date);
        
        if (dateIndex !== -1) {
          // 기존 날짜에 추가
          currentWeekSchedules[dateIndex].recipes.push(newScheduleItem);
        } else {
          // 새로운 날짜 생성
          currentWeekSchedules.push({ date: data.date, recipes: [newScheduleItem] });
        }

        return {
          ...prev,
          [weekStart]: [...currentWeekSchedules]
        };
      });
      Alert.alert("성공", `${newScheduleItem.recipeName}이(가) 식단에 추가되었습니다.`);

    } catch (error) {
        Alert.alert("오류", `식단 등록에 실패했습니다.`);
        throw error;
    }
  }, [isAuthenticated]);

  // 식단 메뉴 삭제 함수
  const removeRecipeFromSchedule = useCallback(async (scheduleId: string, date: string, dummyGroupId: string) => {
    if (!isAuthenticated) { Alert.alert("경고", "로그인이 필요합니다."); return; }
    
    try {
      await deleteRecipeFromSchedule(scheduleId);
      
      // Context 상태 즉시 업데이트
      setGroupSchedules(prev => {
        const dateObj = new Date(date);
        const weekStart = format(startOfWeek(dateObj, { weekStartsOn: 0 }), 'yyyy-MM-dd');
        const currentWeekSchedules = prev[weekStart] || [];

        const updatedSchedules = currentWeekSchedules
          .map(schedule => {
            if (schedule.date === date) {
              return {
                ...schedule,
                recipes: schedule.recipes.filter(recipe => recipe.id !== scheduleId)
              };
            }
            return schedule;
          })
          // 레시피가 0개가 된 스케줄 객체는 굳이 제거하지 않아도 UI에는 영향이 없지만 남겨두기
          // .filter(schedule => schedule.recipes.length > 0); 
          
        return {
          ...prev,
          [weekStart]: updatedSchedules
        };
      });
      Alert.alert("삭제 완료", "식단 메뉴가 삭제되었습니다.");

    } catch (error) {
      Alert.alert("오류", `식단 삭제에 실패했습니다.`);
      console.error("식단 삭제 실패:", error);
    }
  }, [isAuthenticated]);

  // 초기 로드 및 트리거 실행
  useEffect(() => {
    // loadMyGroups 자체가 isAuthenticated를 의존하므로, 로그인/로그아웃 시 호출됨
    loadMyGroups(); 
  }, [loadMyGroups, refreshTrigger]);

  // 그룹 생성 함수
  const createGroup = useCallback(async (data: GroupCreationData) => {
    if (!isAuthenticated) { Alert.alert("경고", "로그인이 필요합니다."); throw new Error("로그인이 필요합니다."); }

    try {
      await apiCreateGroup(data);
      refreshGroups(); // 그룹 목록 갱신 트리거
      Alert.alert("성공", `${data.name} 그룹이 생성되었습니다.`);
      
    } catch (error) {
      Alert.alert("오류", `그룹 생성에 실패했습니다`);
      throw error;
    }
  }, [isAuthenticated, refreshGroups]);

  // 그룹 가입 함수
  const joinGroup = useCallback(async (inviteCode: string) => {
    if (!isAuthenticated) { Alert.alert("경고", "로그인이 필요합니다."); throw new Error("로그인이 필요합니다."); }

    try {
      const joinedGroup = await apiJoinGroup(inviteCode);
      refreshGroups(); // 그룹 목록 갱신 트리거
      Alert.alert("성공", `${joinedGroup.name} 그룹에 가입되었습니다.`);
      
    } catch (error) {
      Alert.alert("오류", `그룹 가입에 실패했습니다`);
      throw error;
    }
  }, [isAuthenticated, refreshGroups]);

  // 그룹 고정 토글 함수
  const togglePin = useCallback(async (groupId: string) => {
    if (!isAuthenticated) { Alert.alert("오류", "로그인이 필요합니다."); return; }
    
    try {
      // Optimistic Update
      setMyGroups(prev => prev.map(group => 
        group.id === groupId ? { ...group, isPinned: !group.isPinned } : group
      ));
      
      await toggleGroupPin(groupId); 

    } catch (error) {
      Alert.alert("오류", "그룹 고정 상태 변경에 실패했습니다.");
      setRefreshTrigger(prev => prev + 1); 
    }
  }, [isAuthenticated]);

  // Context Value
  const contextValue = useMemo(() => ({
    myGroups,
    groupSchedules, 
    isLoading,
    isError: false, 
    createGroup,
    joinGroup,
    togglePin,
    fetchMyGroups: loadMyGroups, 
    fetchSchedulesForWeek,
    scheduleRecipe,
    removeRecipeFromSchedule,
    refreshGroups, // 외부에서 호출 가능하도록 포함
  }), [
    myGroups,
    groupSchedules, 
    isLoading,
    createGroup,
    joinGroup,
    togglePin,
    loadMyGroups,
    fetchSchedulesForWeek,
    scheduleRecipe,
    removeRecipeFromSchedule,
    refreshGroups,
  ]);

  return (
    <GroupContext.Provider value={contextValue}>
      {children}
    </GroupContext.Provider>
  );
};

// Custom Hook
export const useGroups = () => {
  const context = useContext(GroupContext);
  if (!context) {
    throw new Error('useGroups must be used within a GroupProvider');
  }
  return context;
};
