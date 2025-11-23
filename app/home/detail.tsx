// app/(tabs)/home/detail.tsx

import { addDays, addWeeks, format, startOfWeek, subWeeks } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
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
import { Header } from '@/components/header'; // 헤더
import { Calendar } from '@/components/week-calendar'; // 달력
import { Styles } from '@/constants/styles'; // 공통

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

    const recipeItem = (MOCK_RECIPES[currentDateString] || [])[0];

    return (
        <View style={[Styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <ScrollView contentContainerStyle={Styles.scrollContent}>

                {/* Header 영역 */}
                <View style={Header.HeaderAlign}>
                    <TouchableOpacity onPress={handleGoBack} style={Header.BackButton}>
                        <ChevronLeft size={28} color="#000" />
                    </TouchableOpacity>
                    <Text style={Header.Title}>
                        {new Date(currentDateString).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                    </Text>
                </View>
                
                {/* 주간 달력 표시 (상세 뷰) */}
                <View style={Calendar.calendarArea}>
                    
                    {/* 달력 상단 (주 이동 버튼) */}
                    <View style={Calendar.weekNavContainer}>
                        <View style={Calendar.weekNavAlign}> 
                            <TouchableOpacity onPress={() => changeWeek(-1)} style={Calendar.weekNavButton}>
                                <ChevronLeft size={24} color="#000" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => changeWeek(1)} style={Calendar.weekNavButton}>
                                <ChevronRight size={24} color="#000" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={Calendar.dayOfWeekContainer}>
                        {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                            <Text key={day} style={Calendar.dayOfWeekText}>{day}</Text>
                        ))}
                    </View>
                    <View style={Calendar.weekCalendarGrid}>
                        {weekDays.map(dayData => {
                            // 찌부 방지
                            const cellWidth = (width - (24 * 2) - 1) / 7;

                            return (
                                <TouchableOpacity 
                                    key={dayData.dateString}
                                    style={[
                                        Calendar.weekCalendarCell,
                                        { width: cellWidth },
                                        dayData.isSelected && Calendar.weekSelectedCell,
                                        // 토요일 borderRightWidth 제거
                                        dayData.dayOfWeek === 6 && { borderRightWidth: 0 } 
                                    ]}
                                    onPress={() => setCurrentDateString(dayData.dateString)}
                                >
                                    <View style={[ 
                                        Calendar.dayNumberContainer,
                                        // 오늘일 때와 선택됐을 때 검은 동그라미
                                        dayData.isSelected && Calendar.todayIndicator, 
                                    ]}>
                                        <Text style={[
                                            Calendar.weekDayNumber,
                                            // 오늘이거나 선택된 날짜는 흰색 글씨
                                            dayData.isSelected && Calendar.todayText, 
                                        ]}>{dayData.date}</Text>
                                    </View>
                                    
                                    {/* 레시피 카운트 */}
                                    {dayData.recipes.length > 0 && (
                                        <View style={Calendar.weekRecipeCountContainer}>
                                            <Text style={Calendar.weekRecipeCountText}>{dayData.recipes.length}</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* 레시피 상세 카드 (현재 선택된 날짜의 레시피) */}
                <View>
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
    // 레시피 상세 카드
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
