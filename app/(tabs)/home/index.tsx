// app/(tabs)/home/index.tsx

import React, { useState, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, RedirectProps } from 'expo-router';
import { format, addDays, subWeeks, addWeeks, startOfWeek } from 'date-fns';
import { ko } from 'date-fns/locale'; 

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
  '그룹 1': '#F07575', 
  '그룹 2': '#FDE2A1',
  '그룹 3': '#B8E998',
  '그룹 4': '#C0C0C0', 
};

const MOCK_RECIPES: Record<string, RecipeItem[]> = { 
    '2025-10-20': [ 
        { id: 1, group: '그룹 1', recipe: 'Is this wher' },
        { id: 2, group: '그룹 2', recipe: 'Budget for' },
        { id: 5, group: '그룹 2', recipe: 'Take Jake ti' }, 
    ],
    '2025-10-21': [
        { id: 3, group: '그룹 3', recipe: 'Vaccine app' },
        { id: 4, group: '그룹 3', recipe: 'Take Jake ti' },
        { id: 6, group: '그룹 3', recipe: 'DMV appoi' }, 
    ],
    '2025-10-23': [
        { id: 7, group: '그룹 1', recipe: 'St. Patrick\'s' },
        { id: 8, group: '그룹 2', recipe: 'PTO day' },
    ],
    '2025-10-27': [
        { id: 7, group: '그룹 1', recipe: 'St. Patrick\'s' },
        { id: 8, group: '그룹 2', recipe: 'PTO day' },
    ],
}; 

const ALL_GROUPS = ['그룹 1', '그룹 2', '그룹 3', '그룹 4', '새 그룹 추가'];

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

// 메인 컴포넌트
export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [currentDate, setCurrentDate] = useState(new Date(TODAY));
  const [activeGroups, setActiveGroups] = useState<string[]>(['그룹 1', '그룹 2', '그룹 3', '그룹 4']);
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
    <View style={styles.rootContainer}>
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* 상단 검색 및 설정 영역 */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleProfilePress} style={styles.profileButton}>
               <FontAwesome name="user-circle" size={32} color="#ccc" /> 
            </TouchableOpacity>
            
            <View style={styles.searchBar}>
              <Text style={styles.searchText}>검색</Text>
              <FontAwesome name="search" size={20} color="#000" />
            </View>
            <FontAwesome name="cog" size={24} color="#000" style={styles.settingsIcon} />
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
                  <Text style={[styles.navArrow, styles.navArrowSize]}>{'<'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => changeWeek(1)}>
                  <Text style={[styles.navArrow, styles.navArrowSize]}>{'>'}</Text>
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
          
          {/* 레시피 추천 영역 (냉장고 기반) */}
          <View style={styles.recommendationContainer}>
            <Text style={styles.recommendationTitle}>냉장고 기반 추천 레시피</Text>
            
            <View style={styles.recipeCardList}>
              <View style={styles.recipeCard}>
                <Text style={styles.recipeCardText}>김치찌개</Text>
                <View style={styles.recipeCardImagePlaceholder} />
              </View>
              <View style={styles.recipeCard}>
                <Text style={styles.recipeCardText}>케이준 치킨 샐러드</Text>
                <View style={styles.recipeCardImagePlaceholder} />
              </View>
            </View>
          </View>

        </ScrollView>
      </View>
      
      {/* 사이드 메뉴 컴포넌트 */}
      <GroupSideMenu isMenuOpen={isMenuOpen} onClose={handleCloseMenu} insets={insets} />
    </View>
  );
}

// 💡스타일 시트💡
const styles = StyleSheet.create({
  rootContainer: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fff', },
  scrollContent: { paddingBottom: 50, },
  
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
  searchText: {
    flex: 1,
    fontSize: 16,
    color: '#999',
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
    fontSize: 12,
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
    width: 4,
    height: 4,
    borderRadius: 2,
    marginRight: 4,
    marginTop: 4,
  },
  recipeText: {
    fontSize: 8,
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
    paddingHorizontal: 24,
    marginTop: 30,
  },
  recommendationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  recipeCardList: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  recipeCard: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recipeCardText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  recipeCardImagePlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: '#ccc',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
