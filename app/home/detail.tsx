// app/home/detail.tsx

import { addDays, addWeeks, format, startOfWeek, subWeeks } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Style
import { Header } from '@/components/header';
import { Calendar } from '@/components/week-calendar';
import { Styles } from '@/constants/styles';

// Context
import { GroupProvider, useGroups } from '@/context/groupContext';

// Type
import type { GroupRecipeItem, RecipeSchedule } from '@/types/groupTypes';

const { width } = Dimensions.get('window');
const TODAY_STRING = new Date().toISOString().split('T')[0];
const WEEK_STARTS_ON = 0 as const; // 일요일

// 그룹 색상 (index.tsx와 동일하게 임시 함수 사용)
const getGroupColor = (groupId: string | null | undefined): string => {
    const id = groupId || 'personal';
    if (id === 'personal') return '#C0C0C0';
    
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = ['#F07575', '#FDE2A1', '#B8E998', '#7ccef0ff', '#F5A9B8'];
    return colors[hash % colors.length];
};

// 유틸리티: 상세 화면용 7일치 데이터 생성
interface DayData {
    date: number;
    dateString: string;
    isToday: boolean;
    isSelected: boolean;
    recipes: GroupRecipeItem[]; 
    dayOfWeek: number;
}

const dateToDateString = (date: Date): string => format(date, 'yyyy-MM-dd');

const getWeekDays = (weekStartString: string, currentSelectedDateString: string, schedules: RecipeSchedule[]): DayData[] => {
    const startDay = new Date(weekStartString);
    const days: DayData[] = [];
    const schedulesMap = new Map(schedules.map(s => [s.date, s]));
    
    for (let i = 0; i < 7; i++) {
        const day = addDays(startDay, i);
        const dateString = dateToDateString(day);
        const recipeSchedule = schedulesMap.get(dateString);
        
        days.push({
            date: day.getDate(),
            dateString: dateString,
            isToday: dateString === TODAY_STRING,
            isSelected: dateString === currentSelectedDateString,
            recipes: recipeSchedule ? recipeSchedule.recipes : [],
            dayOfWeek: day.getDay()
        });
    }
    return days;
};

// 레시피 상세 카드 컴포넌트 (Swipeable 적용)
interface RecipeCardProps {
    item: GroupRecipeItem;
    onDelete: (scheduleId: string) => void;
    onDetailPress: (recipeId: string, recipeName: string) => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ item, onDelete, onDetailPress }) => {
    const swipeableRef = useRef<Swipeable>(null);

    // 삭제 버튼 렌더링
    const renderRightActions = (progress: Animated.AnimatedInterpolation<string | number>, dragX: Animated.AnimatedInterpolation<string | number>) => {
        const scale = dragX.interpolate({
            inputRange: [-100, 0],
            outputRange: [1, 0],
            extrapolate: 'clamp',
        });

        return (
            <TouchableOpacity 
                style={styles.deleteButton} 
                onPress={() => {
                    swipeableRef.current?.close();
                    onDelete(item.id); // GroupRecipeItem의 id는 DB 스케줄 ID
                }}
            >
                <Animated.View style={[{ transform: [{ scale }] }]}>
                    <Trash2 size={24} color="#fff" />
                    <Text style={styles.deleteButtonText}>삭제</Text>
                </Animated.View>
            </TouchableOpacity>
        );
    };

    const isPersonal = !item.groupId; // 그룹 ID가 없거나 null이면 개인 식단

    return (
        <Swipeable
            ref={swipeableRef}
            renderRightActions={renderRightActions}
            friction={2} // 스와이프 저항
            overshootRight={false}
        >
            <TouchableOpacity 
                onPress={() => onDetailPress(item.id, item.recipeName)}
            >
                <View style={styles.recipeItemCard}>
                    <View style={[
                        styles.groupTag, 
                        { backgroundColor: getGroupColor(item.groupId) }
                    ]}>
                        <Text style={styles.groupTagText}>
                            {isPersonal ? '나' : `그룹 ID: ${item.groupId}`}
                        </Text>
                    </View>

                    <View style={styles.recipeCardContent}>
                        <Text style={styles.recipeName}>{item.recipeName}</Text>
                        <View style={styles.recipeImagePlaceholder} />
                    </View>
                </View>
            </TouchableOpacity>
        </Swipeable>
    );
};


// 상세 화면 콘텐츠 컴포넌트
function DateDetailScreenContent() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { date, weekStart, groupIds } = useLocalSearchParams<{ date: string, weekStart: string, groupIds: string }>(); 
    const { groupSchedules, fetchSchedulesForWeek, removeRecipeFromSchedule } = useGroups();

    // 활성화된 그룹 ID 목록 (필터링 유지 목적)
    const activeGroupIds = useMemo(() => groupIds ? groupIds.split(',') : ['personal'], [groupIds]);

    // 유효성 검사 및 초기값 설정
    const initialDateString = date || dateToDateString(new Date());
    const initialWeekStart = weekStart ? new Date(weekStart) : startOfWeek(new Date(), { weekStartsOn: WEEK_STARTS_ON }); 

    const [currentDateString, setCurrentDateString] = useState(initialDateString);
    const [currentWeekStartDate, setCurrentWeekStartDate] = useState(initialWeekStart);

    const currentWeekStartString = dateToDateString(currentWeekStartDate);
    const nextWeekStartString = dateToDateString(addWeeks(currentWeekStartDate, 1));
    
    // API 호출 (현재 주 + 다음 주)
    useEffect(() => {
        fetchSchedulesForWeek(currentWeekStartString);
        fetchSchedulesForWeek(nextWeekStartString);
    }, [currentWeekStartString, nextWeekStartString, fetchSchedulesForWeek]);

    // 2주간의 스케줄 데이터를 병합
    const combinedSchedules = useMemo(() => {
        const currentWeek = groupSchedules[currentWeekStartString] || [];
        const nextWeek = groupSchedules[nextWeekStartString] || [];
        return [...currentWeek, ...nextWeek];
    }, [groupSchedules, currentWeekStartString, nextWeekStartString]);
    
    // 달력 데이터 생성 (스케줄 데이터 기반)
    const weekDays = useMemo(() => 
        getWeekDays(currentWeekStartString, currentDateString, combinedSchedules), 
        [currentWeekStartString, currentDateString, combinedSchedules]
    );

    const handleGoBack = () => {
        router.back();
    };
    
    // 주 단위 이동 핸들러
    const changeWeek = useCallback((delta: number) => {
        setCurrentWeekStartDate(prev => {
            const newWeekStart = delta > 0 ? addWeeks(prev, 1) : subWeeks(prev, 1);
            
            const newSelectedDate = addDays(newWeekStart, new Date(currentDateString).getDay());
            setCurrentDateString(dateToDateString(newSelectedDate));

            return newWeekStart;
        });
    }, [currentDateString]);
    
    // 현재 선택된 날짜의 레시피 목록 (홈 화면에서 전달된 필터 기준으로 필터링)
    const recipeItems = useMemo(() => {
        const selectedSchedule = combinedSchedules.find(s => s.date === currentDateString);
        if (!selectedSchedule) return [];
        
        return selectedSchedule.recipes.filter(recipe => 
            activeGroupIds.includes(recipe.groupId || 'personal')
        );
    }, [currentDateString, combinedSchedules, activeGroupIds]);
    
    // 메뉴 상세 화면 이동 (임시)
    const handleRecipeDetail = useCallback((recipeId: string, recipeName: string) => {
        router.push({
            pathname: '/recipe/detail', 
            params: { id: recipeId, name: recipeName },
        });
    }, [router]);
    
    // 메뉴 삭제 핸들러 (Swipeable에서 호출)
    const handleDeleteRecipe = useCallback((scheduleId: string) => {
        Alert.alert(
            "식단 메뉴 삭제",
            "정말로 이 메뉴를 삭제하시겠습니까?",
            [
                { text: "취소", style: "cancel" },
                { 
                    text: "삭제", 
                    style: "destructive", 
                    // removeRecipeFromSchedule 호출 (groupId는 더미로 전달)
                    onPress: () => removeRecipeFromSchedule(scheduleId, currentDateString, 'DUMMY')
                },
            ]
        );
    }, [removeRecipeFromSchedule, currentDateString]);

    return (
        <View style={[Styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>

            {/* Header 영역 */}
            <View style={Header.HeaderAlign}>
                <TouchableOpacity onPress={handleGoBack} style={Header.BackButton}>
                    <ChevronLeft size={28} color="#000" />
                </TouchableOpacity>
                <Text style={Header.Title}>
                    {new Date(currentDateString).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                </Text>
            </View>
                
            <ScrollView contentContainerStyle={Styles.scrollContent}>
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
                            const cellWidth = (width - (24 * 2) - 1) / 7;
                            // 활성화된 그룹의 레시피만 카운트
                            const recipeCount = dayData.recipes.filter(r => activeGroupIds.includes(r.groupId || 'personal')).length;

                            return (
                                <TouchableOpacity 
                                    key={dayData.dateString}
                                    style={[
                                        Calendar.weekCalendarCell,
                                        { width: cellWidth },
                                        dayData.isSelected && Calendar.weekSelectedCell,
                                        dayData.dayOfWeek === 6 && { borderRightWidth: 0 } 
                                    ]}
                                    onPress={() => setCurrentDateString(dayData.dateString)}
                                >
                                    <View style={[ 
                                        Calendar.dayNumberContainer,
                                        dayData.isSelected && Calendar.todayIndicator, 
                                    ]}>
                                        <Text style={[
                                            Calendar.weekDayNumber,
                                            dayData.isSelected && Calendar.todayText, 
                                        ]}>{dayData.date}</Text>
                                    </View>
                                    
                                    {/* 레시피 카운트 */}
                                    {recipeCount > 0 && (
                                        <View style={Calendar.weekRecipeCountContainer}>
                                            <Text style={Calendar.weekRecipeCountText}>{recipeCount}</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* 레시피 상세 카드 (현재 선택된 날짜의 레시피) */} 
                {recipeItems && recipeItems.length > 0 ? (
                    recipeItems.map((item) => (
                        <RecipeCard 
                            key={item.id} 
                            item={item}
                            onDelete={handleDeleteRecipe}
                            onDetailPress={handleRecipeDetail}
                        />
                    ))
                ) : (
                    <Text style={styles.noRecipeText}>이 날짜에는 등록된 레시피가 없습니다.</Text>
                )}
            </ScrollView>
        </View>
    );
}

// 메인 Export 함수: GroupProvider로 감싸기
export default function DateDetailScreen() {
    return (
        <GroupProvider>
            <DateDetailScreenContent />
        </GroupProvider>
    );
}

// 🎨 스타일 시트
const { width: windowWidth } = Dimensions.get('window');

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
        marginBottom: 10
    },
    groupTag: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 15,
        marginBottom: 15
    },
    groupTagText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333'
    },
    recipeCardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
    },
    recipeName: {
        fontSize: 22, 
        fontWeight: 'bold',
        flex: 1,
        marginRight: 15,
        lineHeight: 30
    },
    recipeImagePlaceholder: {
        width: 120,
        height: 120,
        backgroundColor: '#ccc',
        borderRadius: 8,
        marginLeft: 'auto'
    },
    noRecipeText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#999',
        marginTop: 30
    },

    // Swipeable 삭제 버튼 스타일
    deleteButton: {
        backgroundColor: '#FF3B30',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: '100%', 
        borderRadius: 10,
        marginBottom: 10
    },
    deleteButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 5
    }
});
