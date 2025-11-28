// app/(tabs)/home/index.tsx

import { Ionicons } from '@expo/vector-icons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { addDays, addWeeks, format, startOfWeek, subWeeks } from 'date-fns';
import { ko } from 'date-fns/locale';
import { RedirectProps, useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Style 임포트
import { Styles } from '@/constants/styles'; // 공통

// Mock 데이터 및 상수
const { width } = Dimensions.get('window');

const TODAY = new Date();
const TODAY_STRING = format(TODAY, 'yyyy-MM-dd');
const SIDE_MENU_WIDTH = width * 0.55;

interface RecipeItem {
    id: number;
    group: string;
    recipe: string;
}

const GROUP_COLORS: Record<string, string> = {
  '나': '#C0C0C0',
  '그룹 1': '#F07575', 
  '그룹 2': '#FDE2A1',
  '그룹 3': '#B8E998',
  '그룹 4': '#7ccef0ff', 
};

const MOCK_RECIPES: Record<string, RecipeItem[]> = { 
    '2025-11-24': [ 
        { id: 1, group: '그룹 1', recipe: '김치찌개' },
        { id: 2, group: '그룹 2', recipe: '비빔밥' },
        { id: 5, group: '그룹 4', recipe: '잡채' }, 
    ],
    '2025-11-26': [
        { id: 3, group: '나', recipe: '떡볶이' },
        { id: 4, group: '그룹 2', recipe: '갈비찜' },
        { id: 6, group: '그룹 3', recipe: '짜장면' },
        { id: 7, group: '그룹 4', recipe: '부대찌개' },
    ],
    '2025-11-27': [
        { id: 7, group: '나', recipe: '불고기' },
        { id: 8, group: '그룹 2', recipe: '김밥' },
    ],
    '2025-11-29': [
        { id: 7, group: '그룹 1', recipe: '볶음밥' },
        { id: 8, group: '그룹 2', recipe: '연어 스테이크' },
    ],
};

const ALL_GROUPS = ['나', '그룹 1', '그룹 2', '그룹 3', '그룹 4', '새 그룹 추가'];

// 달력 유틸리티 (2주 범위)
const getCalendarDays = (date: Date) => {
  // 일요일(0)이 주의 시작일
  const startDay = startOfWeek(date, { weekStartsOn: 0 }); 
  
  const days = [];
  const totalDays = 14; 

  for (let i = 0; i < totalDays; i++) {
    const day = addDays(startDay, i);
    const dateString = format(day, 'yyyy-MM-dd');
    const isCurrentMonth = day.getMonth() === date.getMonth(); 
    
    days.push({
      date: day.getDate(),
      dateString: dateString,
      isToday: dateString === TODAY_STRING,
      isCurrentMonth: isCurrentMonth,
      recipes: MOCK_RECIPES[dateString] || [],
      dayOfWeek: day.getDay() 
    });
  }
  return days;
};

// 그룹 사이드 메뉴 컴포넌트
interface GroupSideMenuProps {
    isMenuOpen: boolean;
    onClose: () => void;
    insets: ReturnType<typeof useSafeAreaInsets>;
}

const GroupSideMenu: React.FC<GroupSideMenuProps> = ({ isMenuOpen, onClose, insets }) => {
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

    return (
        <>
            {isMenuOpen && (
                <TouchableOpacity 
                    style={styles.menuOverlay} 
                    onPress={onClose}
                />
            )}
            <Animated.View
                style={[
                    styles.sideMenuContainer,
                    { transform: [{ translateX }], paddingTop: insets.top, paddingBottom: insets.bottom }
                ]}
                {...panResponder.panHandlers}
            >
                <Text style={styles.sideMenuTitle}>내 그룹 목록</Text>
                <ScrollView contentContainerStyle={styles.sideMenuScrollContent}>
                    {ALL_GROUPS.map((group, index) => (
                        <TouchableOpacity key={index} style={styles.menuItem}>
                            <View style={[
                                styles.menuGroupDot, 
                                { 
                                    backgroundColor: GROUP_COLORS[group] || (group === '새 그룹 추가' ? '#333' : '#ccc') 
                                }
                            ]} />
                            <Text style={styles.menuItemText}>{group}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </Animated.View>
        </>
    );
};

// 추천 레시피 컴포넌트
const RecipeCards = () => {
  const router = useRouter();

  const recipes = [
    { id: 1, name: '김치찌개' },
    { id: 2, name: '케이준 치킨 샐러드' },
    { id: 3, name: '까르보나라' },
    { id: 4, name: '불고기' },
    { id: 5, name: '연어 스테이크' },
  ];

  const handleRecipeDetail = (recipe: { id: number; name: string }) => {
    router.push({
      pathname: '/recipe/detail',
      params: {
        id: recipe.id.toString(),
        name: recipe.name,
      },
    });
  };

  return (
    <View style={styles.recommendationContainer}>
      <Text style={styles.recommendationTitle}>추천 레시피</Text>

      <Carousel
        loop               // 무한 루프
        autoPlay           // 자동 스크롤
        autoPlayInterval={2000}
        data={recipes}
        width={width}  // 카드 너비
        height={220}
        scrollAnimationDuration={800}
        mode="parallax"
        modeConfig={{
          parallaxScrollingScale: 0.8,   // 카드 크기
          parallaxScrollingOffset: 100,   // 옆 카드가 얼마나 보일지
        }}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleRecipeDetail(item)}>
            <View style={styles.recipeCard}>
              <Text style={styles.recipeCardText}>{item.name}</Text>
              <View style={styles.recipeCardImagePlaceholder} />
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

// 메인 컴포넌트
export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [currentDate, setCurrentDate] = useState(new Date(TODAY));
  const [activeGroups, setActiveGroups] = useState<string[]>(['나', '그룹 1', '그룹 2', '그룹 3', '그룹 4']);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const calendarDays = useMemo(() => getCalendarDays(currentDate), [currentDate]);

  const toggleGroup = (group: string) => {
    setActiveGroups(prev => 
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    );
  };
  
  // 주 이동 로직
  const changeWeek = (delta: number) => { 
    setCurrentDate(prev => {
      // date-fns의 subWeeks 또는 addWeeks 사용
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
          weekStart: weekStartDateString
      }
    } as RedirectProps['href']);
  };

  const getFilteredRecipes = (recipes: RecipeItem[]) => {
    return recipes.filter(recipe => activeGroups.includes(recipe.group));
  };
  
  const handleProfilePress = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);
  
  const handleCloseMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  // 설정 페이지
  const handleSetting = useCallback(() => {
      router.push('/mypage/setting' as RedirectProps['href']);
  }, [router]);

  const CALENDAR_PADDING_H = 20;
  const BORDER_WIDTH = 1;

  const renderCalendarCell = (dayData: (typeof calendarDays)[0]) => {
  const filteredRecipes = getFilteredRecipes(dayData.recipes);
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
                { backgroundColor: GROUP_COLORS[recipe.group] || '#ccc' }
              ]} 
            />
            <Text style={styles.recipeText} numberOfLines={1}>
              {recipe.recipe}
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

  const renderGroupButton = (group: string) => {
  const isActive = activeGroups.includes(group);
  const color = GROUP_COLORS[group] || '#ccc';

  return (
    <TouchableOpacity
      key={group}
      style={[
        styles.groupButton,
        { backgroundColor: isActive ? color : '#fff', borderColor: color },
      ]}
      onPress={() => toggleGroup(group)}
    >
      <Text style={[
        styles.groupButtonText,
        { color: isActive ? '#fff' : color },
        !isActive && styles.disabledGroupText
      ]}>
        {group}
      </Text>
    </TouchableOpacity>
  );
};

  // 메인 뷰
  return (
    <View style={[Styles.indexContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        
        {/* 상단 검색 및 설정 영역 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleProfilePress} style={styles.profileButton}>
              <FontAwesome name="user-circle" size={32} color="#ccc" /> 
          </TouchableOpacity>
          
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
        <View style={styles.groupFilterContainer}>
          {ALL_GROUPS.filter(g => g !== '새 그룹 추가').map(renderGroupButton)}
        </View>

        {/* 달력 영역 */}
        <View style={styles.calendarContainer}>
          
          {/* 월 표시 및 네비게이션 */}
          <View style={styles.monthHeader}>
            {/* 주 이동 로직 */}
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
      <RecipeCards />
      
      {/* 사이드 메뉴 컴포넌트 */}
      <GroupSideMenu isMenuOpen={isMenuOpen} onClose={handleCloseMenu} insets={insets} />
    </View>
  );
}

// 💡스타일 시트💡
const styles = StyleSheet.create({
  scrollContent: {
    justifyContent: 'center', // 수평 중앙
    alignItems: 'center',     // 수직 중앙
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
    marginBottom: 10,
  },
  profileButton: { 
    marginRight: 15,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
    flex: 1,
    marginRight: 15,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  searchIcon: {
    marginLeft: 10,
  },
  settingsIcon: {
    color: '#000',
  },

  // 그룹 필터
  groupFilterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 20,
    gap: 10,
  },
  groupButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
  },
  groupButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  disabledGroupText: {
    color: '#ccc',
  },

  // 달력
  calendarContainer: {
    paddingHorizontal: 20,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  monthText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  monthNav: {
    flexDirection: 'row',
    gap: 15,
  },
  navArrow: {
    color: '#000',
    fontWeight: '300',
  },
  navArrowSize: {
    fontSize: 21,
  },
  
  dayOfWeekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: '#eee',
    paddingVertical: 8,
  },
  dayOfWeekText: {
    fontSize: 14,
    fontWeight: '600',
    width: (width - 40) / 7,
    textAlign: 'center',
  },
  
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderColor: '#eee',
  },
  calendarCell: {
    borderRightWidth: 1,
    borderTopWidth: 1,
    borderColor: '#eee',
    padding: 3,
    alignItems: 'flex-start',
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
    alignItems: 'center',
  },
  dayNumber: {
    fontSize: 12,
    color: '#000',
  },
  todayIndicator: {
    backgroundColor: '#000',
  },
  todayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  otherMonthText: {
    color: '#ccc',
  },

  // 레시피 목록
  recipeList: {
    marginTop: 2,
    width: '100%',
    maxHeight: 45,
    overflow: 'hidden',
  },
  recipeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 1,
  },
  recipeDot: {
    width: 5,
    height: 5,
    borderRadius: 2,
    marginRight: 4,
    marginTop: 4,
  },
  recipeText: {
    fontSize: 10,
    color: '#333',
    lineHeight: 10,
    flexShrink: 1,
  },
  viewMoreText: {
    fontSize: 8,
    color: '#007AFF',
    marginTop: 2,
    textAlign: 'right',
    width: '100%',
  },

  // 레시피 추천 영역
  recommendationContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  recommendationTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
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
  },
  recipeCardText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#000',
  },
  recipeCardImagePlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: '#ccc',
    borderRadius: 8,
  },

  // 사이드 메뉴 스타일
  menuOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 100,
  },
  sideMenuContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: SIDE_MENU_WIDTH,
    backgroundColor: '#fff',
    zIndex: 101,
    paddingHorizontal: 15,
    borderRightWidth: 1,
    borderColor: '#eee',
  },
  sideMenuTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      marginTop: 20,
      marginBottom: 15,
  },
  sideMenuScrollContent: {
      paddingBottom: 20,
  },
  menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderColor: '#f0f0f0',
  },
  menuGroupDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 10,
  },
  menuItemText: {
      fontSize: 16,
  },
});
