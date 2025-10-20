// app/(tabs)/home/detail.tsx

// 💡 [수정] useState와 useCallback을 React에서 명시적으로 임포트합니다.
import React, { useMemo, useState, useCallback } from 'react'; 
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter, RedirectProps } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const { width } = Dimensions.get('window');

// -----------------------------------------------------------
// 💡 Mock 데이터 및 상수 
// -----------------------------------------------------------

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
  ],
  '2025-10-22': [
    { id: 3, group: '그룹 3', recipe: 'St. Patrick' },
  ],
  '2025-10-27': [
    { id: 4, group: '그룹 4', recipe: 'Dinner will' },
  ],
};

const TODAY_STRING = new Date().toISOString().split('T')[0];

// -----------------------------------------------------------
// 💡 유틸리티: 상세 화면용 7일치 데이터 생성
// -----------------------------------------------------------

interface DayData {
    date: number;
    dateString: string;
    isToday: boolean;
    isSelected: boolean;
    recipes: RecipeItem[];
    dayOfWeek: number;
}

const getWeekDays = (weekStartString: string, currentSelectedDateString: string): DayData[] => {
    const startDay = new Date(weekStartString);
    const days: DayData[] = [];
    
    for (let i = 0; i < 7; i++) {
        const day = new Date(startDay);
        day.setDate(startDay.getDate() + i);

        const dateString = day.toISOString().split('T')[0];
        
        days.push({
            date: day.getDate(),
            dateString: dateString,
            isToday: dateString === TODAY_STRING,
            isSelected: dateString === currentSelectedDateString,
            recipes: MOCK_RECIPES[dateString] || [],
            dayOfWeek: day.getDay()
        });
    }
    return days;
};

const dateToDateString = (date: Date): string => date.toISOString().split('T')[0];

// -----------------------------------------------------------
// 💡 메인 컴포넌트
// -----------------------------------------------------------

export default function DateDetailScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { date, weekStart } = useLocalSearchParams<{ date: string, weekStart: string }>(); 

    const initialDateString = date || dateToDateString(new Date());

    const [currentDateString, setCurrentDateString] = useState(initialDateString); // 💡 useState 사용
    
    const currentSelectedDate = new Date(currentDateString);
    const dayOfWeek = currentSelectedDate.getDay();
    const currentWeekStart = new Date(currentSelectedDate);
    currentWeekStart.setDate(currentSelectedDate.getDate() - dayOfWeek);
    const currentWeekStartString = dateToDateString(currentWeekStart);

    const weekDays = useMemo(() => getWeekDays(currentWeekStartString, currentDateString), [currentWeekStartString, currentDateString]);
    
    const handleGoBack = () => {
        router.back();
    };

    // ------------------------- UI 렌더링 ---------------------------
    
    const WEEK_CALENDAR_PADDING_H = 24;
    const BORDER_WIDTH = 1;
    const recipeItem = (MOCK_RECIPES[currentDateString] || [])[0]; // 대표 레시피 1개 (UI 표시용)

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* 1. 독립적인 Header 영역 */}
                <View style={styles.appHeader}>
                    <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                        <Text style={styles.backText}>{'<'}</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {new Date(currentDateString).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                    </Text>
                </View>
                
                {/* 2. 주간 달력 표시 (상세 뷰) */}
                <View style={styles.calendarArea}>
                    <View style={styles.dayOfWeekHeader}>
                        {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                            <Text key={day} style={styles.dayOfWeekText}>{day}</Text>
                        ))}
                    </View>
                    <View style={styles.weekCalendarGrid}>
                        {weekDays.map(dayData => {
                            const cellWidth = (width - (WEEK_CALENDAR_PADDING_H * 2) - BORDER_WIDTH * 2) / 7;
                            
                            return (
                                <TouchableOpacity 
                                    key={dayData.dateString}
                                    style={[
                                        styles.weekCalendarCell,
                                        { width: cellWidth },
                                        dayData.isSelected && styles.weekSelectedCell, // 선택된 날짜 강조
                                        dayData.isToday && styles.weekTodayCell,
                                    ]}
                                    onPress={() => setCurrentDateString(dayData.dateString)} // 날짜 선택 시 업데이트
                                >
                                    <View style={[ // 선택한 날짜 동그라미 강조
                                        styles.dayNumberContainer,
                                        dayData.isSelected && styles.SelectedIndicator
                                    ]}>
                                        <Text style={[
                                            styles.weekDayNumber,
                                            dayData.isSelected && styles.todayAndSelectedText
                                        ]}>{dayData.date}</Text>
                                    </View>
                                    
                                    {/* 레시피 카운트 (디자인상 없음, Mock 데이터 유무만 확인) */}
                                    {dayData.recipes.length > 0 && (
                                        <View style={styles.weekRecipeCount}>
                                            <Text style={styles.weekRecipeCountText}>{dayData.recipes.length}</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* 3. 레시피 상세 카드 (현재 선택된 날짜의 레시피) */}
                <View style={styles.recipeListContainer}>
                    {recipeItem ? (
                        <View style={styles.recipeItemCard}>
                            <View style={[styles.groupTag, { backgroundColor: GROUP_COLORS[recipeItem.group] }]}>
                                <Text style={styles.groupTagText}>{recipeItem.group}</Text>
                            </View>
                            <View style={styles.recipeCardContent}>
                                <Text style={styles.recipeName}>
                                    {recipeItem.recipe}
                                </Text>
                                <View style={styles.recipeImagePlaceholder} />
                            </View>
                        </View>
                    ) : (
                        <Text style={styles.noRecipeText}>이 날짜에는 등록된 레시피가 없습니다.</Text>
                    )}
                </View>
                
            </ScrollView>
        </View>
    );
}

// -----------------------------------------------------------
// 💡 스타일 시트 (UI 전면 수정)
// -----------------------------------------------------------

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#fff', 
    },
    scrollContent: { 
        paddingBottom: 50, 
    },
    
    // 1. 독립적인 Header 영역
    appHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center', 
        paddingHorizontal: 24,
        paddingVertical: 15,
        marginBottom: 20,
    },
    backButton: {
        position: 'absolute',
        left: 24,
        padding: 5,
    },
    backText: {
        fontSize: 28,
        fontWeight: '300',
        color: '#000',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
    },

    // 2. 주간 달력 표시 영역
    calendarArea: {
        paddingHorizontal: 24,
        marginBottom: 30,
    },
    dayOfWeekHeader: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 8,
    },
    dayOfWeekText: {
        fontSize: 12,
        fontWeight: '600',
        width: (width - 48) / 7, 
        textAlign: 'center',
    },
    weekCalendarGrid: {
        flexDirection: 'row',
        flexWrap: 'nowrap',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#eee',
    },
    weekCalendarCell: {
        width: (width - 48 - 2) / 7, 
        paddingVertical: 10,
        alignItems: 'center',
        borderRightWidth: 1,
        borderColor: '#eee',
    },
    dayNumberContainer: {
        width: 25,
        height: 25,
        borderRadius: 12.5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    weekSelectedCell: {
        backgroundColor: '#f0f0f0', 
    },
    weekTodayCell: {
        // 오늘 날짜 표시 스타일
    },
    SelectedIndicator: {
        backgroundColor: '#000', // 선택 시 검은 동그라미
    },
    todayAndSelectedText: {
        color: '#fff',
    },
    weekDayNumber: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    weekRecipeCount: {
        backgroundColor: '#f0f0f0', // 약한 배경색
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginTop: 5,
    },
    weekRecipeCountText: {
        fontSize: 12,
        color: '#000',
    },


    // 3. 레시피 상세 카드
    recipeListContainer: {
        paddingHorizontal: 24,
    },
    recipeItemCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#eee',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    groupTag: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 15,
        marginBottom: 15,
    },
    groupTagText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333',
    },
    recipeCardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    recipeName: {
        fontSize: 20,
        fontWeight: 'bold',
        flex: 1,
        marginRight: 15,
        lineHeight: 28,
    },
    recipeImagePlaceholder: {
        width: 120,
        height: 120,
        backgroundColor: '#ccc',
        borderRadius: 8,
        marginLeft: 'auto',
    },
    noRecipeText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#999',
        marginTop: 30,
    }
});