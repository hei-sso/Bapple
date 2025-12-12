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
  Image,
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
import type { RecommendedRecipe } from '@/types/recipeTypes';

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
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = ['#F07575', '#FDE2A1', '#B8E998', '#7ccef0ff', '#F5A9B8'];
    return colors[hash % colors.length];
};

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
  
  const currentWeekStart = format(startOfWeek(TODAY, { weekStartsOn: WEEK_STARTS_ON }), 'yyyy-MM-dd');
  const SECONDARY_COLOR = '#404040ff';
  const ACCENT_COLOR_STAR = '#FFD700';
  const TEXT_COLOR_DARK = '#333';

  useEffect(() => {
    const loadRecipes = async () => {
      setIsLoading(true);
      try {
        const recommended = await fetchRecommendedRecipes(currentWeekStart); 
        setRecipes(recommended);
      } catch (e) {
        console.error("AI 추천 레시피 로드 실패:", e);
        setRecipes([]); 
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
        <ActivityIndicator size="large" color={SECONDARY_COLOR} />
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
        height={300} // 카드의 높이와 동일하게 유지
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
                
                {/* 텍스트, 배지 컨테이너 (왼쪽 영역) */}
                <View style={styles.textContentAndBadges}>
                    <Text style={styles.recipeCardText}>{item.name}</Text>
                    
                    <View style={styles.ratingTimeContainer}>
                      
                      {/* 난이도 별점 (rating 사용) */}
                      <View style={styles.ratingBadge}>
                        {[...Array(item.rating || 1)].map((_, index) => (
                          <FontAwesome 
                            key={index} 
                            name="star" 
                            size={12} 
                            color={ACCENT_COLOR_STAR} 
                            style={{ marginRight: 2 }}
                          />
                        ))}
                        <Text style={[styles.ratingText, { marginLeft: 4 }]}>
                           {item.rating === 1 ? '초급' : item.rating === 3 ? '고급' : '중급'}
                        </Text>
                      </View>

                      {/* 조리시간 */}
                      <View style={styles.timeBadge}>
                        <Ionicons name="time-outline" size={12} color={TEXT_COLOR_DARK} />
                        <Text style={styles.timeText}>
                            {item.cookTimeMinutes ? `${item.cookTimeMinutes}분` : "정보없음"}
                        </Text>
                      </View>
                    </View>
                </View>

                {/* 이미지/플레이스홀더 영역*/}
                {item.recipeImageUrl ? (
                    <Image 
                      source={{ uri: item.recipeImageUrl }} 
                      style={styles.recipeCardImageInContent} 
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.recipeCardImagePlaceholderInContent}> 
                      <Text style={styles.placeholderText}>이미지 없음</Text>
                    </View>
                  )}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

// 그룹 목록 아이템
const SideMenuGroupItem: React.FC<{ 
  group: Group; 
  onPress: (group: Group) => void; 
  onPinToggle: (groupId: string) => void;
  isDisabled: boolean; 
}> = ({ group, onPress, onPinToggle, isDisabled }) => {
  const groupColor = getGroupColor(group.id); 
  const PinIcon = group.isPinned ? Pin : PinOff;
  const PRIMARY_COLOR = '#000';
  const TEXT_COLOR_GRAY = '#888';
  const pinColor = group.isPinned ? PRIMARY_COLOR : TEXT_COLOR_GRAY;
  const isPersonal = group.id === 'personal';

  return (
    <TouchableOpacity style={styles.menuItem} onPress={() => onPress(group)} disabled={isDisabled}>
      <View style={[styles.menuGroupDot, { backgroundColor: groupColor }]} />
      <View style={styles.menuItemContent}>
        <Text style={styles.menuItemText}>{group.name}</Text>
        {!isPersonal && (
          <TouchableOpacity
            style={styles.menuPinButton}
            onPress={(e) => {
              e.stopPropagation();
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

// 사이드 메뉴
const GroupSideMenu: React.FC<{ 
  isMenuOpen: boolean; 
  onClose: () => void; 
  insets: ReturnType<typeof useSafeAreaInsets>;
  onGroupCreatePress: () => void;
  onGroupSelect: (groupId: string) => void; 
  activeGroupIds: string[];
}> = ({ isMenuOpen, onClose, insets, onGroupCreatePress, onGroupSelect, activeGroupIds }) => {
  const router = useRouter();
  const { myGroups, isLoading, togglePin } = useGroups(); 
  
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const PRIMARY_COLOR = '#000';
  const TEXT_COLOR_DARK = '#333';

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

  const MENU_FOOTER_HEIGHT = 30;

  const sortedGroups = useMemo(() => {
    const personalGroup: Group = { 
      id: 'personal', 
      name: '나',
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
      if (a.id === 'personal') return -1;
      if (b.id === 'personal') return 1;
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return a.id.localeCompare(b.id); 
    });
  }, [myGroups]);

  const handleGroupPress = useCallback((group: Group) => {
    onClose(); 
    if (group.id === 'personal') {
      router.push({ 
        pathname: '/home/detail', 
        params: { 
          date: format(TODAY, 'yyyy-MM-dd'),
          groupIds: activeGroupIds.join(',') 
        } 
      });
    } else {
      router.push({ 
        pathname: '/group/detail',
        params: { 
          groupId: group.id, 
          groupName: group.name,
        } 
      });
    }
  }, [onClose, router, activeGroupIds]);
  
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
        <View style={{ paddingTop: insets.top }} /> 
        <Text style={[styles.sideMenuTitle, { marginTop: 20, marginBottom: 15, paddingHorizontal: 15 }]}>
          내 그룹 목록
        </Text>
        <ScrollView style={{ flex: 1 }}>
          {isLoading ? (
            <ActivityIndicator size="small" color={TEXT_COLOR_DARK} />
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
        <View style={[styles.menuFooter, { paddingBottom: insets.bottom, height: MENU_FOOTER_HEIGHT + insets.bottom }]}>
          <TouchableOpacity style={styles.newGroupButton} onPress={onGroupCreatePress}>
            <Plus size={20} color={PRIMARY_COLOR} />
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
  const { myGroups, groupSchedules, fetchSchedulesForWeek, scheduleRecipe, refreshGroups } = useGroups(); 
  
  const [currentDate, setCurrentDate] = useState(new Date(TODAY));
  const [activeGroupIds, setActiveGroupIds] = useState<string[]>(['personal', ...myGroups.map(g => g.id)]); 
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGroupModalVisible, setIsGroupModalVisible] = useState(false);
  
  const [isRecipeModalVisible, setIsRecipeModalVisible] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<{ id: string; name: string } | null>(null);
  
  const handleGroupCreated = useCallback(() => {
    setIsGroupModalVisible(false); 
    refreshGroups(); 
  }, [refreshGroups]);

  const currentWeekStartString = format(startOfWeek(currentDate, { weekStartsOn: WEEK_STARTS_ON }), 'yyyy-MM-dd');
  const nextWeekStartString = format(addWeeks(currentDate, 1), 'yyyy-MM-dd');

  useEffect(() => {
    fetchSchedulesForWeek(currentWeekStartString);
    fetchSchedulesForWeek(nextWeekStartString);
  }, [currentWeekStartString, nextWeekStartString, fetchSchedulesForWeek]);
  
  useEffect(() => {
    setActiveGroupIds(prev => {
      const newGroups = myGroups.map(g => g.id);
      const activeKept = prev.filter(id => id === 'personal' || newGroups.includes(id));
      return [...new Set([...activeKept, ...newGroups, 'personal'])];
    });
  }, [myGroups]);

  const combinedSchedules = useMemo(() => {
    const currentWeek = groupSchedules[currentWeekStartString] || [];
    const nextWeek = groupSchedules[format(addWeeks(currentDate, 1), 'yyyy-MM-dd')] || [];
    return [...currentWeek, ...nextWeek];
  }, [groupSchedules, currentWeekStartString, currentDate]);
  
  const calendarDays = useMemo(() => getCalendarDays(currentDate, combinedSchedules, activeGroupIds), [currentDate, combinedSchedules, activeGroupIds]);

  const toggleGroupFilter = (groupId: string) => {
    setActiveGroupIds(prev => {
      if (groupId === 'personal') return prev; 
      return prev.includes(groupId) ? prev.filter(g => g !== groupId) : [...prev, groupId];
    });
  };
  
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
    
    router.push({
      pathname: '/home/detail',
      params: {
        date: dayData.dateString,
        weekStart: weekStartDateString,
        groupIds: activeGroupIds.join(',') 
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
  
  const handleGroupCreatePress = useCallback(() => {
    handleCloseMenu();
    setIsGroupModalVisible(true); 
  }, [handleCloseMenu]);

  const handleRecipeSelect = useCallback((recipe: RecommendedRecipe) => {
    setSelectedRecipe(recipe);
    setIsRecipeModalVisible(true);
  }, []);

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

        <View style={styles.recipeList}>
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
    
    const isPersonal = groupId === 'personal'; 

    return (
      <TouchableOpacity
        key={groupId}
        style={[
          styles.groupButton,
          { backgroundColor: isActive ? color : '#fff', borderColor: color },
        ]}
        onPress={() => toggleGroupFilter(groupId)}
        disabled={isPersonal} 
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

  const PRIMARY_COLOR = '#000';
  const TEXT_COLOR_LIGHT = '#ccc';
  const TEXT_COLOR_GRAY = '#888';

  return (
    <View style={[Styles.indexContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleProfilePress} style={styles.profileButton}>
          <FontAwesome name="user-circle" size={32} color={TEXT_COLOR_LIGHT} /> 
        </TouchableOpacity>
          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="검색"
              placeholderTextColor={TEXT_COLOR_GRAY}
            />
            <Ionicons name="search" size={20} color={PRIMARY_COLOR} style={styles.searchIcon} /> 
          </View>
        <TouchableOpacity onPress={handleSetting}>
          <FontAwesome name="cog" size={24} color={PRIMARY_COLOR} style={styles.settingsIcon} />
        </TouchableOpacity>
      </View>

      <View style={styles.groupFilterContainer}>
        {groupFilterList.map(renderGroupButton)}
      </View>

      <View style={styles.calendarContainer}>
        <View style={styles.monthHeader}>
          <Text style={styles.monthText}>{format(currentDate, 'M월', { locale: ko })}</Text>
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={() => changeWeek(-1)}>
              <ChevronLeft size={24} color={PRIMARY_COLOR} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => changeWeek(1)}>
              <ChevronRight size={24} color={PRIMARY_COLOR} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.dayOfWeekHeader}>
          {['일', '월', '화', '수', '목', '금', '토'].map(day => (
            <Text key={day} style={styles.dayOfWeekText}>{day}</Text>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {calendarDays.map(renderCalendarCell)}
        </View>
      </View>
      
      <AIRecommendedRecipes onRecipeSelect={handleRecipeSelect} />
      
      <GroupSideMenu 
        isMenuOpen={isMenuOpen} 
        onClose={handleCloseMenu} 
        insets={insets} 
        onGroupCreatePress={handleGroupCreatePress} 
        onGroupSelect={toggleGroupFilter} 
        activeGroupIds={activeGroupIds}
      />
      
      <GroupCreationModal 
        isVisible={isGroupModalVisible}
        onClose={() => setIsGroupModalVisible(false)}
        onGroupCreated={handleGroupCreated}
        initialMode="create" 
      />
      
      {selectedRecipe && (
        <RecipeScheduleModal
          isVisible={isRecipeModalVisible}
          onClose={() => setIsRecipeModalVisible(false)}
          recipeId={selectedRecipe.id}
          recipeName={selectedRecipe.name}
          onSchedule={handleScheduleRecipe}
        />
      )}
    </View>
  );
}

export default function HomeScreen() {
  return (
    <GroupProvider>
      <HomeScreenContent />
    </GroupProvider>
  );
}

const PRIMARY_COLOR = '#000';
const BG_COLOR_LIGHT = '#f5f5f5';
const BORDER_COLOR_LIGHT = '#eee';
const TEXT_COLOR_DARK = '#333';
const TEXT_COLOR_GRAY = '#888';
const TEXT_COLOR_LIGHT = '#ccc';

const styles = StyleSheet.create({
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
    backgroundColor: BG_COLOR_LIGHT,
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
    flex: 1,
    marginRight: 15
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: PRIMARY_COLOR
  },
  searchIcon: {
    marginLeft: 10,
    color: PRIMARY_COLOR
  },
  settingsIcon: {
    color: PRIMARY_COLOR
  },
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
    color: TEXT_COLOR_LIGHT 
  },
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
    fontWeight: 'bold',
    color: PRIMARY_COLOR
  },
  monthNav: {
    flexDirection: 'row',
    gap: 15
  },
  dayOfWeekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: BORDER_COLOR_LIGHT,
    paddingVertical: 8
  },
  dayOfWeekText: {
    fontSize: 14,
    fontWeight: '600',
    width: (width - 40) / 7,
    textAlign: 'center',
    color: TEXT_COLOR_DARK
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderColor: BORDER_COLOR_LIGHT
  },
  calendarCell: {
    borderRightWidth: 1,
    borderTopWidth: 1,
    borderColor: BORDER_COLOR_LIGHT,
    padding: 3,
    alignItems: 'flex-start'
  },
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
    color: PRIMARY_COLOR
  },
  todayIndicator: {
    backgroundColor: PRIMARY_COLOR
  },
  todayText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  otherMonthText: {
    color: TEXT_COLOR_LIGHT
  },
  recipeList: {
    marginTop: 2,
    width: '100%',
    maxHeight: 45,
    overflow: 'hidden',
    paddingLeft: 3 
  },
  recipeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 1
  },
  recipeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 4,
    marginTop: 3 
  },
  recipeText: {
    fontSize: 10,
    color: TEXT_COLOR_DARK,
    lineHeight: 12,
    flexShrink: 1
  },
  viewMoreText: {
    fontSize: 8,
    color: '#007AFF', 
    marginTop: 2,
    textAlign: 'right',
    width: '100%',
    paddingRight: 2
  },
  recommendationContainer: {
    alignItems: 'center',
    marginTop: 20
  },
  recommendationTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: TEXT_COLOR_DARK
  },
  recipeCard: {
    backgroundColor: '#fff',
    padding: 18,
    marginHorizontal: 10, 
    borderRadius: 12, 
    borderWidth: 1,
    borderColor: BORDER_COLOR_LIGHT,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    height: 300,
    justifyContent: 'flex-start'
  },
  recipeCardContentArea: {
    flex: 1,
    justifyContent: 'space-between', 
    alignItems: 'flex-start'
  },
  textContentAndBadges: {
    flex: 1,
    marginRight: 10,
    justifyContent: 'flex-start'
  },
  recipeCardText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PRIMARY_COLOR
  },
  recipeCardImageInContent: {
    width: 330,
    height: 200, // 고정 크기
    borderRadius: 8
  },
  recipeCardImagePlaceholderInContent: {
    width: 330,
    height: 200, // 고정 크기
    backgroundColor: BG_COLOR_LIGHT, 
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER_COLOR_LIGHT
  },
  noDataText: {
    fontSize: 16,
    color: TEXT_COLOR_GRAY,
    textAlign: 'center',
    marginTop: 20
  },
  ratingTimeContainer: {
    flexDirection: 'row',
    marginBottom: 5,
    marginTop: 'auto'
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbe6', 
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: TEXT_COLOR_DARK,
    marginLeft: 4
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f7ff', 
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  timeText: {
    fontSize: 12,
    color: TEXT_COLOR_DARK,
    marginLeft: 4
  },
  placeholderText: { 
    fontSize: 14,
    color: TEXT_COLOR_GRAY,
  },
  menuOverlay: {
    ...StyleSheet.absoluteFillObject,
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
    borderRightWidth: 1,
    borderColor: BORDER_COLOR_LIGHT
  },
  sideMenuTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: PRIMARY_COLOR
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderColor: BORDER_COLOR_LIGHT
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 10,
    justifyContent: 'space-between'
  },
  menuItemText: {
    fontSize: 16,
    color: TEXT_COLOR_DARK,
    fontWeight: '500'
  },
  menuGroupDot: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  menuPinButton: {
    padding: 5
  },
  menuFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 15
  },
  newGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: BG_COLOR_LIGHT,
    borderRadius: 8
  },
  newGroupButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
    marginLeft: 10
  }
});