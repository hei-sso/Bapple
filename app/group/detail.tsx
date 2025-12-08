// app/group/detail.tsx

import { useRoute } from '@react-navigation/native';
import { addDays, addWeeks, format, startOfWeek, subWeeks } from 'date-fns';
import { RedirectProps, useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Share2 } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Style
import { Header } from '@/components/header';
import { Calendar } from '@/components/week-calendar';
import { Styles } from '@/constants/styles';

// Context
import { GroupProvider, useGroups } from '@/context/groupContext';

// Components
import ShareCodeModal from '@/components/ShareCodeModal';

// Type
import type { GroupRecipeItem, RecipeSchedule } from '@/types/groupTypes';

const { width } = Dimensions.get('window');
const WEEK_STARTS_ON = 0 as const; 
const dateToDateString = (date: Date): string => format(date, 'yyyy-MM-dd');
const TODAY_STRING = dateToDateString(new Date());

interface DayData {
    date: number;
    dateString: string;
    isToday: boolean;
    isSelected: boolean;
    recipes: GroupRecipeItem[]; 
    dayOfWeek: number;
}

// 일주일 날짜 데이터 생성
const getWeekDays = (
    weekStartString: string, 
    currentSelectedDateString: string, 
    schedules: RecipeSchedule[]
): DayData[] => {
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

const initialMemo = '';

function GroupDetailScreenContent() {
    const router = useRouter(); 
    const route = useRoute();
    const insets = useSafeAreaInsets();
    const { fetchSchedulesForWeek, groupSchedules } = useGroups();

    const params = route.params as { groupName?: string; groupId?: string; inviteCode?: string } || {};
    const groupId = params.groupId;
    const groupName = params.groupName || '그룹 상세';
    const inviteCode = params.inviteCode || null; 

    // 모달 상태 관리
    const [isShareModalVisible, setIsShareModalVisible] = useState(false);

    useEffect(() => {
        if (!groupId) {
            Alert.alert("오류", "그룹 정보 없이 상세 화면에 접근했습니다.", [{ text: "확인", onPress: () => router.back() }]);
        }
    }, [groupId, router]);

    const initialDateString = TODAY_STRING;
    const initialWeekStart = startOfWeek(new Date(), { weekStartsOn: WEEK_STARTS_ON }); 

    const [currentDateString, setCurrentDateString] = useState(initialDateString);
    const [currentWeekStartDate, setCurrentWeekStartDate] = useState(initialWeekStart);
    
    const currentWeekStartString = useMemo(() => dateToDateString(currentWeekStartDate), [currentWeekStartDate]);
    
    const [memoText, setMemoText] = useState(initialMemo);
    const MAX_MEMO_LENGTH = 100;
    
    useEffect(() => {
        if (groupId) {
            fetchSchedulesForWeek(currentWeekStartString);
        }
    }, [currentWeekStartString, fetchSchedulesForWeek, groupId]);

    const schedulesForCurrentWeek = groupSchedules[currentWeekStartString] || []; 

    const weekDays = useMemo(() => 
        getWeekDays(currentWeekStartString, currentDateString, schedulesForCurrentWeek), 
        [currentWeekStartString, currentDateString, schedulesForCurrentWeek]
    );
    
    const handleGoBack = () => {
        router.back();
    };

    const changeWeek = useCallback((delta: number) => {
        setCurrentWeekStartDate(prev => {
            const newWeekStart = delta > 0 ? addWeeks(prev, 1) : subWeeks(prev, 1);
            
            const dayOfWeek = new Date(currentDateString).getDay();
            const newSelectedDate = addDays(newWeekStart, dayOfWeek);
            setCurrentDateString(dateToDateString(newSelectedDate));

            return newWeekStart;
        });
    }, [currentDateString]);

    const currentRecipes = useMemo(() => {
        if (!groupId) return []; 
        
        const selectedDay = schedulesForCurrentWeek.find(s => s.date === currentDateString);
        if (!selectedDay) return [];
        
        return selectedDay.recipes.filter(recipe => recipe.groupId === groupId); 
        
    }, [currentDateString, schedulesForCurrentWeek, groupId]); 
    
    const RECIPE_CARD_WIDTH = width * 0.87;

    const handleRecipeDetail = (recipe: GroupRecipeItem) => {
        router.push({
            pathname: '/recipe/detail',
            params: {
                id: recipe.id.toString(),
                name: recipe.recipeName, 
            },
        } as RedirectProps['href']);
    };
    
    if (!groupId) {
        return <View style={Styles.container} />;
    }

    return (
        <View style={[Styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>

            {/* Header 영역 (그룹 이름 표시 및 공유 버튼) */}
            <View style={[Header.HeaderAlign]}>
                <TouchableOpacity onPress={handleGoBack} style={Header.BackButton}>
                    <ChevronLeft size={28} color="#000" />
                </TouchableOpacity>
                <Text style={Header.Title}>{groupName}</Text>
                
                {/* 공유 버튼 */}
                <TouchableOpacity onPress={() => setIsShareModalVisible(true)} style={styles.shareButton}>
                    <Share2 size={24} color="#000" />
                </TouchableOpacity>
            </View>
            
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView>
                    {/* 주간 달력 표시 */}
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

                        {/* 요일 헤더 */}
                        <View style={Calendar.dayOfWeekContainer}>
                            {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                                <Text key={day} style={Calendar.dayOfWeekText}>{day}</Text>
                            ))}
                        </View>
                        
                        {/* 달력 그리드 */}
                        <View style={Calendar.weekCalendarGrid}>
                            {weekDays.map(dayData => {
                                const cellWidth = (width - (24 * 2) - 1) / 7;

                                const recipeCount = dayData.recipes.filter(r => r.groupId === groupId).length; 

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

                    {/* 레시피 상세 카드 (가로 스크롤) */}
                    <View>
                        <Text style={styles.recipeListTitle}>
                            {currentDateString} (총 {currentRecipes.length}개)
                        </Text>
                        
                        {currentRecipes.length > 0 ? (
                            <ScrollView horizontal contentContainerStyle={styles.recipeCardScrollContent}>
                                {currentRecipes.map((recipeItem, index) => (
                                    <TouchableOpacity onPress={() => handleRecipeDetail(recipeItem)} key={recipeItem.id}>
                                        <View 
                                            key={recipeItem.id} 
                                            style={[
                                                styles.recipeItemCard,
                                                { width: RECIPE_CARD_WIDTH }, 
                                                index < currentRecipes.length - 1 && styles.recipeCardMarginRight 
                                            ]}
                                        >
                                            {/* 레시피 카드 */}
                                            <View style={styles.recipeCardContent}>
                                                <Text style={styles.recipeName}>{recipeItem.recipeName}</Text> 
                                                <View style={styles.recipeImagePlaceholder} />
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        ) : (
                            <Text style={styles.noRecipeText}>이 날짜에는 등록된 레시피가 없습니다.</Text>
                        )}
                    </View>
                    
                    {/* 메모장 섹션 */}
                    <View style={styles.memoSection}>
                        <Text style={styles.memoTitle}>Memo</Text>
                        
                        {/* 입력창 */}
                        <View style={styles.memoInputContainer}>
                            <TextInput
                                style={styles.memoInput}
                                multiline={true}
                                placeholder="메모를 작성해 보세요. (최대 100글자)"
                                value={memoText}
                                onChangeText={(text) => setMemoText(text.slice(0, MAX_MEMO_LENGTH))}
                                maxLength={MAX_MEMO_LENGTH}
                                textAlignVertical="top"
                                placeholderTextColor="#A9A9A9"
                            />
                            <Text style={styles.charCount}>
                                {memoText.length}/{MAX_MEMO_LENGTH}
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
            
            {/* 초대 코드 공유 모달 렌더링 */}
            <ShareCodeModal 
                isVisible={isShareModalVisible}
                onClose={() => setIsShareModalVisible(false)}
                groupName={groupName}
                inviteCode={inviteCode}
            />

        </View>
    );
}

// 메인 Export 함수: GroupProvider로 감싸기
export default function GroupDetailScreen() {
    return (
        <GroupProvider>
            <GroupDetailScreenContent />
        </GroupProvider>
    );
}

// 🎨 스타일 시트
const styles = StyleSheet.create({
    shareButton: { 
        position: 'absolute',
        right: 15,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        paddingLeft: 10
    },
    recipeListTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
        marginTop: 15
    },
    recipeCardScrollContent: {
        paddingBottom: 10
    },
    recipeItemCard: {
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
        flexShrink: 0
    },
    recipeCardMarginRight: {
        marginRight: 15
    },
    recipeCardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
    },
    recipeName: {
        fontSize: 20, 
        fontWeight: 'bold',
        lineHeight: 30,
        flexShrink: 1
    },
    recipeImagePlaceholder: {
        width: 80, 
        height: 80, 
        backgroundColor: '#ccc',
        borderRadius: 8,
        marginLeft: 'auto',
        flexShrink: 0
    },
    noRecipeText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#999',
        marginTop: 30
    },

    // 메모장
    memoSection: {
        marginTop: 20,
        marginBottom: 80
    },
    memoTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#333',
        padding: 10,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#eee',
        textAlign: 'center',
        backgroundColor: '#e4e4e4ff',
        marginBottom: 10,
        borderRadius: 8
    },
    memoInputContainer: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        minHeight: 120,
        backgroundColor: '#fff'
    },
    memoInput: {
        fontSize: 16,
        flex: 1,
        maxHeight: 100
    },
    charCount: {
        textAlign: 'right',
        fontSize: 12,
        color: '#999',
        marginTop: 5
    }
});
