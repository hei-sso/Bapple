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

// API
import { fetchInviteCode } from '@/api/groupAPI';

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

    const safeSchedules = Array.isArray(schedules) ? schedules : [];
    const schedulesMap = new Map(safeSchedules.map(s => [s.date, s]));
    
    for (let i = 0; i < 7; i++) {
        const day = addDays(startDay, i);
        const dateString = dateToDateString(day);
        const recipeSchedule = schedulesMap.get(dateString);

        let recipes = recipeSchedule?.recipes;
        if (!Array.isArray(recipes)) recipes = [];

        days.push({
            date: day.getDate(),
            dateString: dateString,
            isToday: dateString === TODAY_STRING,
            isSelected: dateString === currentSelectedDateString,
            recipes: recipes,
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

    // params 가져오기
    const params = route.params as { groupName?: string; groupId?: string; inviteCode?: string } || {};
    const groupId = params.groupId;
    const groupName = params.groupName || '그룹 상세';
    
    // 초대 코드 및 로딩 상태
    const [inviteCode, setInviteCode] = useState<string | null>(params.inviteCode || null);
    const [isShareModalVisible, setIsShareModalVisible] = useState(false);
    const [isCodeLoading, setIsCodeLoading] = useState(false); // 로딩 상태

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
        const safeSchedules = Array.isArray(schedulesForCurrentWeek) ? schedulesForCurrentWeek : [];
        const selectedDay = safeSchedules.find(s => s.date === currentDateString);
        if (!selectedDay) return [];
        let recipes = selectedDay.recipes;
        if (!Array.isArray(recipes)) recipes = [];
        return recipes.filter(recipe => recipe.groupId === groupId); 
    }, [currentDateString, schedulesForCurrentWeek, groupId]); 
    
    const RECIPE_CARD_WIDTH = width * 0.87;

    const handleRecipeDetail = (recipe: GroupRecipeItem) => {
        const realRecipeId = (recipe as any).recipeId || (recipe as any).recipe_id;
        if (realRecipeId) {
             router.push({
                pathname: '/recipe/detail',
                params: {
                    id: realRecipeId.toString(), 
                    name: recipe.recipeName, 
                },
            } as RedirectProps['href']);
        } else {
             Alert.alert("오류", "해당 레시피의 원본 정보를 찾을 수 없습니다.");
        }
    };

    // 공유 버튼 클릭 핸들러
    const handleSharePress = async () => {
        if (!groupId) return;

        // 1. 이미 코드가 있다면 로딩 없이 바로 모달 표시
        if (inviteCode) {
            setIsShareModalVisible(true);
            return;
        }

        // 2. 코드가 없다면 로딩 시작 -> API 호출 -> 로딩 종료
        try {
            setIsShareModalVisible(true); // 모달을 먼저 띄움
            setIsCodeLoading(true);       // 로딩바 돌리기 시작
            
            const code = await fetchInviteCode(groupId); // API 호출
            setInviteCode(code);          // 코드 저장
            
        } catch (error) {
            console.error(error);
            Alert.alert("오류", "초대 코드를 불러오지 못했습니다.");
            setIsShareModalVisible(false); // 실패 시 모달 닫기
        } finally {
            setIsCodeLoading(false);      // 로딩 종료
        }
    };
    
    if (!groupId) {
        return <View style={Styles.container} />;
    }

    return (
        <View style={[Styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={[Header.HeaderAlign]}>
                <TouchableOpacity onPress={handleGoBack} style={Header.BackButton}>
                    <ChevronLeft size={28} color="#000" />
                </TouchableOpacity>
                <Text style={Header.Title}>{groupName}</Text>
                
                {/* 공유 버튼 연결 */}
                <TouchableOpacity onPress={handleSharePress} style={styles.shareButton}>
                    <Share2 size={24} color="#000" />
                </TouchableOpacity>
            </View>
            
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView>
                    <View style={Calendar.calendarArea}>
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
                                const safeRecipes = Array.isArray(dayData.recipes) ? dayData.recipes : [];
                                const recipeCount = safeRecipes.filter(r => r.groupId === groupId).length; 

                                return (
                                <TouchableOpacity 
                                    key={dayData.dateString}
                                    style={[Calendar.weekCalendarCell, { width: cellWidth }, dayData.isSelected && Calendar.weekSelectedCell, dayData.dayOfWeek === 6 && { borderRightWidth: 0 }]}
                                    onPress={() => setCurrentDateString(dayData.dateString)}
                                >
                                    <View style={[Calendar.dayNumberContainer, dayData.isSelected && Calendar.todayIndicator]}>
                                        <Text style={[Calendar.weekDayNumber, dayData.isSelected && Calendar.todayText]}>{dayData.date}</Text>
                                    </View>
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

                    <View>
                        <Text style={styles.recipeListTitle}>
                            {currentDateString} (총 {currentRecipes.length}개)
                        </Text>
                        
                        {currentRecipes.length > 0 ? (
                            <ScrollView horizontal contentContainerStyle={styles.recipeCardScrollContent}>
                                {currentRecipes.map((recipeItem, index) => (
                                    <TouchableOpacity onPress={() => handleRecipeDetail(recipeItem)} key={recipeItem.id}>
                                        <View style={[styles.recipeItemCard, { width: RECIPE_CARD_WIDTH }, index < currentRecipes.length - 1 && styles.recipeCardMarginRight]}>
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
                    
                    <View style={styles.memoSection}>
                        <Text style={styles.memoTitle}>Memo</Text>
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
            
            {/* 모달에 isLoading 상태 전달 */}
            <ShareCodeModal 
                isVisible={isShareModalVisible}
                onClose={() => setIsShareModalVisible(false)}
                groupName={groupName}
                inviteCode={inviteCode} 
                isLoading={isCodeLoading}
            />
        </View>
    );
}

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
