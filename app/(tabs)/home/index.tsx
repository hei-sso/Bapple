// app/(tabs)/home/index.tsx

import { Ionicons } from '@expo/vector-icons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { addDays, addWeeks, format, startOfWeek, subWeeks } from 'date-fns';
import { ko } from 'date-fns/locale';
import { RedirectProps, useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Pin, PinOff, Plus } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// API
// @ts-ignore
import { fetchRecommendedRecipes } from '@/api/recipeAPI';

// Style
import { Styles } from '@/constants/styles';

// Components
import GroupCreationModal from '@/components/GroupCreationModal';
import RecipeScheduleModal from '@/components/RecipeScheduleModal';

// Context
import { GroupProvider, useGroups } from '@/context/groupContext';

// Type
import type { Group, GroupRecipeItem, RecipeSchedule } from '@/types/groupTypes';

// 상수
const { width } = Dimensions.get('window');
const TODAY = new Date();
const TODAY_STRING = format(TODAY, 'yyyy-MM-dd');
const SIDE_MENU_WIDTH = width * 0.55;
const WEEK_STARTS_ON = 0 as const; // 일요일

// 그룹 색상 (임시 함수)
const getGroupColor = (groupId: string | null | undefined): string => {
    const id = groupId || 'personal';
    if (id === 'personal') return '#C0C0C0';
    
    // 단순 해시 함수를 사용하여 색상 매핑
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = ['#F07575', '#FDE2A1', '#B8E998', '#7ccef0ff', '#F5A9B8'];
    return colors[hash % colors.length];
};

// AI 추천 레시피 타입
interface RecommendedRecipe {
    id: string;
    name: string;
    rating: number; // 별점 (1~5)
    cookTimeMinutes: number; // 조리 시간 (분)
}

// 달력 유틸리티 (2주 범위)
const getCalendarDays = (date: Date, schedules: RecipeSchedule[], activeGroupIds: string[]) => {
  const startDay = startOfWeek(date, { weekStartsOn: WEEK_STARTS_ON }); 
  
  const days = [];
  const totalDays = 14; 
  const schedulesMap = new Map<string, GroupRecipeItem[]>();

  schedules.forEach(schedule => {
      schedulesMap.set(schedule.date, schedule.recipes);
  });
  
  for (let i = 0; i < totalDays; i++) {
    const day = addDays(startDay, i);
    const dateString = format(day, 'yyyy-MM-dd');
    const isCurrentMonth = day.getMonth() === date.getMonth(); 
    
    const recipes = schedulesMap.get(dateString) || [];
    
    days.push({
      date: day.getDate(),
      dateString: dateString,
      isToday: dateString === TODAY_STRING,
      isCurrentMonth: isCurrentMonth,
      // 활성화된 그룹의 레시피만 필터링
      recipes: recipes.filter(r => activeGroupIds.includes(r.groupId || 'personal')),
      dayOfWeek: day.getDay() 
    });
  }
  return days;
};

// AI 추천 레시피 섹션 컴포넌트
const AIRecommendedRecipes: React.FC<{ onRecipeSelect: (recipe: RecommendedRecipe) => void }> = ({ onRecipeSelect }) => {
  const [recipes, setRecipes] = useState<RecommendedRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadRecipes = async () => {
      setIsLoading(true);
      try {
        // @ts-ignore
        const recommended = await fetchRecommendedRecipes('personal'); 
        setRecipes(recommended);
      } catch (e) {
        console.error("AI 추천 레시피 로드 실패:", e);
        // ⚠️ DB 연결 전 임시 Mock Data (최종 제출 시 삭제 예정)
        setRecipes([
          { id: 'ai-mock-1', name: '닭가슴살 샐러드', rating: 1.0, cookTimeMinutes: 15 },
          { id: 'ai-mock-2', name: '새우 볶음밥', rating: 4.0, cookTimeMinutes: 20 },
          { id: 'ai-mock-3', name: '계란 토스트', rating: 2.5, cookTimeMinutes: 5 },
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    loadRecipes();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.recommendationContainer}>
        <Text style={styles.recommendationTitle}>추천 레시피</Text>
        <ActivityIndicator size="large" color="#404040ff" style={{marginTop: 20}} />
      </View>
    );
  }
  
  if (recipes.length === 0) {
    return (
      <View style={styles.recommendationContainer}>
        <Text style={styles.recommendationTitle}>추천 레시피</Text>
        <Text style={styles.noDataText}>추천 가능한 레시피가 없습니다.{"\n"}재료를 추가해주세요!</Text>
      </View>
    );
  }

  const carouselWidth = width;
  
  return (
    <View style={styles.recommendationContainer}>
      <Text style={styles.recommendationTitle}>추천 레시피</Text>
      
      <Carousel
        loop
        autoPlay
        autoPlayInterval={2000}
        data={recipes}
        width={carouselWidth}
        height={220}
        scrollAnimationDuration={800}
        mode="parallax"
        modeConfig={{
          parallaxScrollingScale: 0.8,
          parallaxScrollingOffset: 100,
        }}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => onRecipeSelect(item)} >
            <View style={styles.recipeCard}>
              <View style={styles.recipeCardContentArea}>
                <Text style={styles.recipeCardText}>{item.name}</Text>
                <View style={styles.ratingTimeContainer}>
                  <View style={styles.ratingBadge}>
                    <FontAwesome name="star" size={12} color="#FFD700" />
                    <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                  </View>
                  <View style={styles.timeBadge}>
                    <Ionicons name="time-outline" size={12} color="#333" />
                    <Text style={styles.timeText}>{item.cookTimeMinutes}분</Text>
                  </View>
                </View>
              </View>
              <View style={styles.recipeCardImagePlaceholder} />
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

// ⭐️ 그룹 목록 아이템 컴포넌트 (사이드바용) ⭐️
const SideMenuGroupItem: React.FC<{ 
    group: Group; 
    onPress: (group: Group) => void; 
    onPinToggle: (groupId: string) => void; // ⭐️ 추가
    isDisabled: boolean; 
}> = ({ group, onPress, onPinToggle, isDisabled }) => {
    const groupColor = getGroupColor(group.id); 
    const PinIcon = group.isPinned ? Pin : PinOff; // 꽉 찬 핀/빈 핀
    const pinColor = group.isPinned ? '#000' : '#888';

    const isPersonal = group.id === 'personal';

    return (
        <TouchableOpacity style={styles.menuItem} onPress={() => onPress(group)} disabled={isDisabled}>
            <View style={[styles.menuGroupDot, { backgroundColor: groupColor }]} />
            <View style={styles.menuItemContent}>
                <Text style={styles.menuItemText}>{group.name}</Text>
                
                {/* ⭐️ 고정핀 토글 버튼 ⭐️ */}
                {!isPersonal && (
                    <TouchableOpacity
                        style={styles.menuPinButton}
                        onPress={(e) => {
                            e.stopPropagation(); // 그룹 선택 방지
                            onPinToggle(group.id);
                        }}
                        disabled={isDisabled}
                    >
                        <PinIcon size={16} color={pinColor} />
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );
};

// 그룹 사이드 메뉴 컴포넌트
const GroupSideMenu: React.FC<{ 
  isMenuOpen: boolean; 
  onClose: () => void; 
  insets: ReturnType<typeof useSafeAreaInsets>;
  onGroupCreatePress: () => void;
  onGroupSelect: (groupId: string) => void; 
  activeGroupIds: string[];
}> = ({ isMenuOpen, onClose, insets, onGroupCreatePress, onGroupSelect, activeGroupIds }) => {
  const router = useRouter();
  // ⭐️ useGroups에서 togglePin을 가져옵니다. ⭐️
  const { myGroups, isLoading, togglePin } = useGroups(); 
  
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isMenuOpen ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isMenuOpen, slideAnim]);

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SIDE_MENU_WIDTH, 0],
  });

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return isMenuOpen && gestureState.dx < 0 && Math.abs(gestureState.dx) > 5;
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.vx < -0.5 || gestureState.dx < -50) {
        onClose();
      } else {
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  // 그룹 목록 + '나' (개인 냉장고) 항목 생성 및 정렬
  const sortedGroups = useMemo(() => {
    const personalGroup: Group = { 
      id: 'personal', 
      name: '나', // 이름 수정 유지
      description: '개인 식단', 
      ownerId: '', 
      inviteCode: '', 
      settings: { isFridgeShared: 'owner_only' },
      memberCount: 1, 
      maxMembers: 1,
      isPinned: true, 
      imageUri: 'NULL',
      createdAt: format(TODAY, 'yyyy-MM-dd'),
    };
      
    const groupsWithPersonal = [personalGroup, ...myGroups];

    return groupsWithPersonal.slice().sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return a.id.localeCompare(b.id); 
    });
  }, [myGroups]);

  // 그룹 아이템 클릭 핸들러
  const handleGroupPress = useCallback((group: Group) => {
    onClose(); 
      
    // '나'인지 확인해서 라우트 분기
    if (group.id === 'personal') {
        // 1. '나' (personal) 항목: 홈 화면 디테일 페이지로 이동 (달력에서 클릭할 때랑 동일)
        router.push({ 
            pathname: '/home/detail', 
            params: { 
                date: format(TODAY, 'yyyy-MM-dd'), // 오늘 날짜 기본값
                groupIds: activeGroupIds.join(',') 
            } 
        });
    } else {
        // 2. 일반 그룹 항목: 그룹 상세 페이지로 이동 (그룹 정보/설정)
        router.push({ 
            pathname: '/group/detail',
            params: { 
                groupId: group.id, 
                groupName: group.name,
            } 
        });
    }
  }, [onClose, router, activeGroupIds]);
  
  // 고정핀 토글 핸들러
  const handlePinToggle = useCallback((groupId: string) => {
      togglePin(groupId);
  }, [togglePin]);

  return (
    <>
      {isMenuOpen && (
        <TouchableOpacity style={styles.menuOverlay} onPress={onClose} />
      )}
      <Animated.View
        style={[
          styles.sideMenuContainer,
          { transform: [{ translateX }] }
        ]}
        {...panResponder.panHandlers}
      >
        {/* 상단 Safe Area 처리 */}
        <View style={{ paddingTop: insets.top }} /> 
        
        <Text style={[styles.sideMenuTitle, { marginTop: 0, marginBottom: 15, paddingHorizontal: 15 }]}>
            내 그룹 목록
        </Text>
        
        <ScrollView contentContainerStyle={styles.sideMenuScrollContent}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#666" style={{ marginTop: 20 }} />
          ) : (
            sortedGroups.map((group) => (
              <SideMenuGroupItem 
                key={group.id} 
                group={group} 
                onPress={handleGroupPress}
                onPinToggle={handlePinToggle}
                isDisabled={isLoading}
              />
            ))
          )}
        </ScrollView>
          
        {/* '새 그룹 생성' 버튼 */}
        <View style={[styles.menuFooter, { paddingBottom: 15 + insets.bottom, left: 0 }]}>
          <TouchableOpacity style={styles.newGroupButton} onPress={onGroupCreatePress}>
            <Plus size={20} color="#000" />
            <Text style={styles.newGroupButtonText}>새 그룹 생성</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </>
  );
};

const HomeScreenContent = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { myGroups, groupSchedules, fetchSchedulesForWeek, scheduleRecipe } = useGroups();
  
  const [currentDate, setCurrentDate] = useState(new Date(TODAY));
  // 그룹 ID로 필터링 (초기값: 'personal'과 모든 그룹 ID)
  const [activeGroupIds, setActiveGroupIds] = useState<string[]>(['personal', ...myGroups.map(g => g.id)]); 
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGroupModalVisible, setIsGroupModalVisible] = useState(false);
  
  // 레시피 스케줄 모달 상태
  const [isRecipeModalVisible, setIsRecipeModalVisible] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<{ id: string; name: string } | null>(null);

  // 현재 주차의 시작일 (yyyy-MM-dd)
  const currentWeekStartString = format(startOfWeek(currentDate, { weekStartsOn: WEEK_STARTS_ON }), 'yyyy-MM-dd');
  // 다음 주차 시작일
  const nextWeekStartString = format(addWeeks(currentDate, 1), 'yyyy-MM-dd');

  // API에서 현재 2주간의 스케줄 로드
  useEffect(() => {
    fetchSchedulesForWeek(currentWeekStartString);
    fetchSchedulesForWeek(nextWeekStartString);
  }, [currentWeekStartString, nextWeekStartString, fetchSchedulesForWeek]);
  
  // 그룹 목록이 업데이트 될 때 필터링 목록도 업데이트
  useEffect(() => {
    setActiveGroupIds(prev => {
      const newGroups = myGroups.map(g => g.id);
      return [...new Set([...prev.filter(id => id === 'personal' || newGroups.includes(id)), ...newGroups])];
    });
  }, [myGroups]);

  // 2주간의 스케줄 데이터를 병합
  const combinedSchedules = useMemo(() => {
    const currentWeek = groupSchedules[currentWeekStartString] || [];
    const nextWeek = groupSchedules[format(addWeeks(currentDate, 1), 'yyyy-MM-dd')] || [];
    return [...currentWeek, ...nextWeek];
  }, [groupSchedules, currentWeekStartString, currentDate]);
  
  const calendarDays = useMemo(() => getCalendarDays(currentDate, combinedSchedules, activeGroupIds), [currentDate, combinedSchedules, activeGroupIds]);

  // 그룹 필터 토글
  const toggleGroupFilter = (groupId: string) => {
    setActiveGroupIds(prev => 
      prev.includes(groupId) ? prev.filter(g => g !== groupId) : [...prev, groupId]
    );
  };
  
  // 주 이동 로직
  const changeWeek = (delta: number) => { 
    setCurrentDate(prev => {
      return delta < 0 ? subWeeks(prev, 1) : addWeeks(prev, 1);
    });
  };

  const handleDatePress = (dayData: (typeof calendarDays)[0]) => {
    const dayOfWeek = new Date(dayData.dateString).getDay(); 
    const weekStartDate = new Date(dayData.dateString);
    weekStartDate.setDate(weekStartDate.getDate() - dayOfWeek);
    const weekStartDateString = format(weekStartDate, 'yyyy-MM-dd');
    
    // home/detail.tsx로 이동
    router.push({
      pathname: '/home/detail',
      params: {
        date: dayData.dateString,
        weekStart: weekStartDateString,
        groupIds: activeGroupIds.join(',') // 현재 활성화된 그룹 ID 목록 전달 (필터링 유지 목적)
      }
    } as RedirectProps['href']);
  };
  
  const handleProfilePress = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);
  
  const handleCloseMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const handleSetting = useCallback(() => {
    router.push('/mypage/setting' as RedirectProps['href']);
  }, [router]);
  
  // 새 그룹 생성 버튼 핸들러 (사이드 메뉴에서 호출)
  const handleGroupCreatePress = useCallback(() => {
    handleCloseMenu();
    setIsGroupModalVisible(true); 
  }, [handleCloseMenu]);

  // AI 추천 레시피 선택 핸들러
  const handleRecipeSelect = useCallback((recipe: RecommendedRecipe) => {
    setSelectedRecipe(recipe);
    setIsRecipeModalVisible(true);
  }, []);

  // 레시피 스케줄 등록 핸들러 (RecipeScheduleModal에서 호출)
  const handleScheduleRecipe = useCallback(async (data: { 
    recipeId: string; 
    date: string; 
    groupId: string | 'personal'; 
  }) => {
    await scheduleRecipe(data);
  }, [scheduleRecipe]);


  const CALENDAR_PADDING_H = 20;
  const BORDER_WIDTH = 1;

  const renderCalendarCell = (dayData: (typeof calendarDays)[0]) => {
    const filteredRecipes = dayData.recipes; 
    const cellWidth = (width - (CALENDAR_PADDING_H * 2) - BORDER_WIDTH * 2) / 7; 

    return (
      <TouchableOpacity
        key={dayData.dateString}
        style={[
          styles.calendarCell,
          { width: cellWidth, minHeight: cellWidth * 1.5 }, 
        ]}
        onPress={() => handleDatePress(dayData)}
      >
        {/* 날짜 번호 */}
        <View style={[
          styles.dayNumberContainer,
          dayData.isToday && styles.todayIndicator, 
        ]}>
          <Text style={[
            styles.dayNumber,
            dayData.isToday && styles.todayText,
            !dayData.isCurrentMonth && styles.otherMonthText,
          ]}>
            {dayData.date}
          </Text>
        </View>

        {/* 레시피 아이템 목록 (색상 점) */}
        <View style={styles.recipeList}>
          {/* 3개까지만 보여주기 */}
          {filteredRecipes.slice(0, 3).map((recipe, index) => (
            <View key={index} style={styles.recipeItem}>
              <View 
                style={[
                  styles.recipeDot, 
                  { backgroundColor: getGroupColor(recipe.groupId || 'personal') }
                ]} 
              />
              <Text style={styles.recipeText} numberOfLines={1}>
                {recipe.recipeName}
              </Text>
            </View>
          ))}
          {/* 3개 초과 시에는 'view more' 렌더링 */}
          {filteredRecipes.length > 3 && ( 
            <Text style={styles.viewMoreText}>view more</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderGroupButton = (group: Group) => {
    const groupId = group.id;
    const isActive = activeGroupIds.includes(groupId);
    const color = getGroupColor(groupId);

    return (
      <TouchableOpacity
        key={groupId}
        style={[
          styles.groupButton,
          { backgroundColor: isActive ? color : '#fff', borderColor: color },
        ]}
        onPress={() => toggleGroupFilter(groupId)}
      >
        <Text style={[
          styles.groupButtonText,
          { color: isActive ? '#fff' : color },
          !isActive && styles.disabledGroupText
        ]}>
          {group.name}
        </Text>
      </TouchableOpacity>
    );
  };
  
  // 그룹 필터링 버튼 목록 (개인 + 내 그룹)
  const groupFilterList = useMemo(() => {
    const personal: Group = { 
      id: 'personal',
      name: '나',
      description: '',
      ownerId: '',
      inviteCode: '',
      settings: { isFridgeShared: 'owner_only' },
      memberCount: 1,
      maxMembers: 1,
      isPinned: false,
      imageUri: 'NULL',
      createdAt: format(TODAY, 'yyyy-MM-dd')
    };
    return [personal, ...myGroups];
  }, [myGroups]);

  // 메인 뷰
  return (
    <ScrollView style={Styles.indexContainer} contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      
      {/* 상단 검색 및 설정 영역 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleProfilePress} style={styles.profileButton}>
          <FontAwesome name="user-circle" size={32} color="#ccc" /> 
        </TouchableOpacity>
          {/* 검색 영역 */}
          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="검색"
              placeholderTextColor="#888"
            />
            <Ionicons name="search" size={20} color="#000" style={styles.searchIcon} /> 
          </View>
        <TouchableOpacity onPress={handleSetting}>
          <FontAwesome name="cog" size={24} color="#000" style={styles.settingsIcon} />
        </TouchableOpacity>
      </View>

      {/* 그룹 활성화/비활성화 버튼 영역 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.groupFilterContainer}>
        {groupFilterList.map(renderGroupButton)}
      </ScrollView>

      {/* 달력 영역 */}
      <View style={styles.calendarContainer}>
        
        {/* 월 표시 및 네비게이션 */}
        <View style={styles.monthHeader}>
          <Text style={styles.monthText}>{format(currentDate, 'M월', { locale: ko })}</Text>
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={() => changeWeek(-1)}>
              <ChevronLeft size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => changeWeek(1)}>
              <ChevronRight size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 요일 헤더 */}
        <View style={styles.dayOfWeekHeader}>
          {['일', '월', '화', '수', '목', '금', '토'].map(day => (
            <Text key={day} style={styles.dayOfWeekText}>{day}</Text>
          ))}
        </View>

        {/* 달력 날짜 그리드 (2주) */}
        <View style={styles.calendarGrid}>
          {calendarDays.map(renderCalendarCell)}
        </View>
      </View>
      
      {/* 추천 레시피 컴포넌트 */}
      <AIRecommendedRecipes onRecipeSelect={handleRecipeSelect} />
      
      {/* 사이드 메뉴 컴포넌트 */}
      <GroupSideMenu 
        isMenuOpen={isMenuOpen} 
        onClose={handleCloseMenu} 
        insets={insets} 
        onGroupCreatePress={handleGroupCreatePress} 
        onGroupSelect={toggleGroupFilter} 
        activeGroupIds={activeGroupIds}
      />
      
      {/* 그룹 생성/가입 모달 팝업 */}
      <GroupCreationModal 
        isVisible={isGroupModalVisible}
        onClose={() => setIsGroupModalVisible(false)}
        initialMode="create" 
      />
      
      {/* 식단 메뉴 추가 모달 팝업 */}
      {selectedRecipe && (
        <RecipeScheduleModal
          isVisible={isRecipeModalVisible}
          onClose={() => setIsRecipeModalVisible(false)}
          recipeId={selectedRecipe.id}
          recipeName={selectedRecipe.name}
          onSchedule={handleScheduleRecipe}
        />
      )}
    </ScrollView>
  );
}

// 메인 Export 함수: Provider로 감싸기
export default function HomeScreen() {
  return (
    <GroupProvider>
      <HomeScreenContent />
    </GroupProvider>
  );
}

// 🎨 스타일 시트
const styles = StyleSheet.create({
  scrollContent: {
    justifyContent: 'center', 
    alignItems: 'center',
    paddingHorizontal: 80,
    paddingBottom: 50
  },

  // 헤더 (검색 및 설정)
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 10
  },
  profileButton: { 
    marginRight: 15
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
    flex: 1,
    marginRight: 15
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000'
  },
  searchIcon: {
    marginLeft: 10
  },
  settingsIcon: {
    color: '#000'
  },

  // 그룹 필터
  groupFilterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 20,
    gap: 10
  },
  groupButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 1
  },
  groupButtonText: {
    fontSize: 14,
    fontWeight: 'bold'
  },
  disabledGroupText: {
    color: '#ccc'
  },

  // 달력
  calendarContainer: {
    paddingHorizontal: 20
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  monthText: {
    fontSize: 24,
    fontWeight: 'bold'
  },
  monthNav: {
    flexDirection: 'row',
    gap: 15
  },
  navArrow: {
    color: '#000',
    fontWeight: '300'
  },
  navArrowSize: {
    fontSize: 21
  },
  dayOfWeekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: '#eee',
    paddingVertical: 8
  },
  dayOfWeekText: {
    fontSize: 14,
    fontWeight: '600',
    width: (width - 40) / 7,
    textAlign: 'center'
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderColor: '#eee'
  },
  calendarCell: {
    borderRightWidth: 1,
    borderTopWidth: 1,
    borderColor: '#eee',
    padding: 3,
    alignItems: 'flex-start'
  },
  
  // 날짜 번호 및 오늘 표시
  dayNumberContainer: {
    alignSelf: 'flex-end',
    marginBottom: 5,
    marginRight: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  dayNumber: {
    fontSize: 12,
    color: '#000'
  },
  todayIndicator: {
    backgroundColor: '#000'
  },
  todayText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  otherMonthText: {
    color: '#ccc'
  },

  // 레시피 목록
  recipeList: {
    marginTop: 2,
    width: '100%',
    maxHeight: 45,
    overflow: 'hidden'
  },
  recipeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 1
  },
  recipeDot: {
    width: 5,
    height: 5,
    borderRadius: 2,
    marginRight: 4,
    marginTop: 4
  },
  recipeText: {
    fontSize: 10,
    color: '#333',
    lineHeight: 10,
    flexShrink: 1
  },
  viewMoreText: {
    fontSize: 8,
    color: '#007AFF',
    marginTop: 2,
    textAlign: 'right',
    width: '100%'
  },

  // 레시피 추천 영역
  recommendationContainer: {
    alignItems: 'center',
    marginTop: 20
  },
  recommendationTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333'
  },
  recipeCard: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    height: 220, 
    justifyContent: 'space-between'
  },
  recipeCardContentArea: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start'
  },
  recipeCardText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10, 
    color: '#000'
  },
  recipeCardImagePlaceholder: {
    width: '100%',
    height: 100, 
    backgroundColor: '#ccc',
    borderRadius: 8,
    marginTop: 'auto',
  },

  // 난이도 별점 및 시간
  ratingTimeContainer: {
    flexDirection: 'row',
    marginBottom: 5
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbe6',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 8
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f7ff',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  timeText: {
    fontSize: 12,
    color: '#333',
    marginLeft: 4
  },
  noDataText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 20
  },
  
  // 사이드 메뉴 스타일
  menuOverlay: {
    ...StyleSheet.absoluteFillObject,
    // ⭐️ 수정: 배경색과 투명도 설정
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 100
  },
  sideMenuContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: SIDE_MENU_WIDTH,
    backgroundColor: '#fff',
    zIndex: 101,
    // paddingHorizontal: 15 제거 -> 자식 요소에서 처리
    borderRightWidth: 1,
    borderColor: '#eee'
  },
  sideMenuTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 0, 
    marginBottom: 15,
    paddingHorizontal: 15, // 좌우 패딩
  },
  sideMenuScrollContent: {
    paddingHorizontal: 15, // 좌우 패딩
    paddingBottom: 85 // 푸터 공간 확보
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0'
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 10,
    justifyContent: 'space-between', // ⭐️ 핀 버튼을 오른쪽 끝으로 밀기
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500'
  },
  menuGroupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10
  },
  // ⭐️ 신규: 핀 버튼 컨테이너 스타일 ⭐️
  menuPinButton: {
      padding: 5,
  },
  // 새 그룹 생성 버튼
  menuFooter: {
    position: 'absolute', 
    bottom: 0,
    left: 0, // ⭐️ 수정: left 0으로 설정하여 컨테이너 너비에 맞춤
    right: 0, // ⭐️ 수정: right 0으로 설정하여 컨테이너 너비에 맞춤
    backgroundColor: '#fff', 
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingVertical: 15,
    paddingHorizontal: 15,
    width: SIDE_MENU_WIDTH, // ⭐️ 수정: 너비를 명시적으로 사이드 메뉴 너비로 설정
    zIndex: 102, 
  },
  newGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8
  },
  newGroupButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 10
  }
});
