// app/(tabs)/home/detail.tsx

import { addDays, addWeeks, format, startOfWeek, subWeeks } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Style 임포트
import { authStyles } from '@/constants/styles';  // 공통
import { Header } from '@/components/header';  // 헤더

const { width } = Dimensions.get('window');

// Mock 데이터 및 상수
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

const TODAY_STRING = new Date().toISOString().split('T')[0];

// 유틸리티: 상세 화면용 7일치 데이터 생성
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
        const day = addDays(startDay, i);
        const dateString = dateToDateString(day);
        
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

const dateToDateString = (date: Date): string => format(date, 'yyyy-MM-dd');

// 메인 컴포넌트
export default function DateDetailScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { date, weekStart } = useLocalSearchParams<{ date: string, weekStart: string }>(); 

    const initialDateString = date || dateToDateString(new Date());

    const initialWeekStart = weekStart ? new Date(weekStart) : startOfWeek(new Date(), { weekStartsOn: 0 }); 

    const [currentDateString, setCurrentDateString] = useState(initialDateString);
    const [currentWeekStartDate, setCurrentWeekStartDate] = useState(initialWeekStart);

    const weekDays = useMemo(() => getWeekDays(dateToDateString(currentWeekStartDate), currentDateString), [currentWeekStartDate, currentDateString]);
    
    const handleGoBack = () => {
        router.back();
    };
    
    // 주 단위 이동 핸들러
    const changeWeek = useCallback((delta: number) => {
        setCurrentWeekStartDate(prev => {
            const newWeekStart = delta > 0 ? addWeeks(prev, 1) : subWeeks(prev, 1);
            
            // 주의 시작일을 변경할 때, 선택된 날짜도 해당 주의 날짜로 조정 (선택 유지 목적)
            const newSelectedDate = addDays(newWeekStart, new Date(currentDateString).getDay());
            setCurrentDateString(dateToDateString(newSelectedDate));

            return newWeekStart;
        });
    }, [currentDateString]);

    const WEEK_CALENDAR_PADDING_H = 24;
    const BORDER_WIDTH = 1;
    const recipeItem = (MOCK_RECIPES[currentDateString] || [])[0];

    return (
        <View style={[authStyles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <ScrollView contentContainerStyle={authStyles.scrollContent}>

                {/* Header 영역 */}
                <View style={Header.HeaderAlign}>
                    <TouchableOpacity onPress={handleGoBack} style={Header.BackButton}>
                        <Text style={Header.BackText}>{'<'}</Text>
                    </TouchableOpacity>
                    <Text style={Header.Title}>
                        {new Date(currentDateString).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                    </Text>
                </View>
                
                {/* 주간 달력 표시 (상세 뷰) */}
                <View style={styles.calendarArea}>
                    
                    {/* 달력 상단 우측 주 이동 버튼 */}
                    <View style={styles.weekNavContainer}>
                        <TouchableOpacity onPress={() => changeWeek(-1)} style={styles.navButton}>
                            <Text style={styles.navArrow}>{'<  '}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => changeWeek(1)} style={styles.navButton}>
                            <Text style={styles.navArrow}>{'  >'}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.dayOfWeekHeader}>
                        {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                            <Text key={day} style={styles.dayOfWeekText}>{day}</Text>
                        ))}
                    </View>
                    <View style={styles.weekCalendarGrid}>
                        {weekDays.map(dayData => {
                            // 찌부 해결 - 너비 계산
                            const cellWidth = (width - (WEEK_CALENDAR_PADDING_H * 2) - BORDER_WIDTH) / 7;

                            return (
                                <TouchableOpacity 
                                    key={dayData.dateString}
                                    style={[
                                        styles.weekCalendarCell,
                                        { width: cellWidth },
                                        dayData.isSelected && styles.weekSelectedCell,
                                        // 토요일 borderRightWidth 제거
                                        dayData.dayOfWeek === 6 && { borderRightWidth: 0 } 
                                    ]}
                                    onPress={() => setCurrentDateString(dayData.dateString)}
                                >
                                    <View style={[ 
                                        styles.dayNumberContainer,
                                        // 오늘일 때와 선택됐을 때 검은 동그라미
                                        dayData.isSelected && styles.todayIndicator, 
                                    ]}>
                                        <Text style={[
                                            styles.weekDayNumber,
                                            // 오늘이거나 선택된 날짜는 흰색 글씨
                                            dayData.isSelected && styles.todayText, 
                                        ]}>{dayData.date}</Text>
                                    </View>
                                    
                                    {/* 레시피 카운트 */}
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

                {/* 레시피 상세 카드 (현재 선택된 날짜의 레시피) */}
                <View style={styles.recipeListContainer}>
                    {recipeItem ? (
                        <View style={styles.recipeItemCard}>
                            <View style={[styles.groupTag, { backgroundColor: GROUP_COLORS[recipeItem.group] }]}>
                                <Text style={styles.groupTagText}>{recipeItem.group}</Text>
                            </View>
                            <View style={styles.recipeCardContent}>
                                <Text style={styles.recipeName}>
                                    {recipeItem.recipe}
                                    {'\n'}
                                    케이준 치킨 샐러드
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

// 💡스타일 시트💡
const styles = StyleSheet.create({
    // 주간 달력 표시 영역
    calendarArea: {
        marginBottom: 30,
        position: 'relative',
        marginTop: 15, // 달력 영역과 헤더 날짜 사이 여백
    },
    
    // 주 이동 버튼 컨테이너
    weekNavContainer: {
        position: 'absolute',
        top: -35, // 위치를 조정하여 날짜 제목과 겹치지 않게 함
        right: 24,
        flexDirection: 'row',
        zIndex: 5,
    },
    navButton: {
        paddingHorizontal: 5,
    },
    navArrow: {
        fontSize: 21,
        color: '#000',
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
        // width는 동적으로 계산됨
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
    
    // 오늘/선택 시 검은색 동그라미와 흰색 텍스트
    todayIndicator: {
        backgroundColor: '#000', // 검은색 동그라미
    },
    todayText: {
        color: '#fff', // 흰색 글씨
        fontWeight: 'bold',
    },
    weekDayNumber: {
        fontSize: 16, 
        fontWeight: 'bold',
    },
    weekRecipeCount: {
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginTop: 5,
    },
    weekRecipeCountText: {
        fontSize: 12,
        color: '#000',
    },

    // 레시피 상세 카드
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
        fontSize: 22, 
        fontWeight: 'bold',
        flex: 1,
        marginRight: 15,
        lineHeight: 30,
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
