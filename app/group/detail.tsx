import { useRoute } from '@react-navigation/native';
import { addDays, addWeeks, format, startOfWeek, subWeeks } from 'date-fns';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Style 임포트
import { Header } from '@/components/header'; // 헤더
import { Calendar } from '@/components/week-calendar'; // 달력
import { Styles } from '@/constants/styles'; // 공통

const { width } = Dimensions.get('window');
// 일요일(0)부터 시작
const WEEK_STARTS_ON = 0 as const; 
const dateToDateString = (date: Date): string => format(date, 'yyyy-MM-dd');
const TODAY_STRING = dateToDateString(new Date());

interface RecipeItem {
    id: number;
    group: string;
    recipe: string;
}

const MOCK_RECIPES: Record<string, RecipeItem[]> = { 
    // 오늘 날짜 주변으로 Mock Data 조정
    [dateToDateString(addDays(new Date(), -2))]: [ 
        { id: 1, group: '그룹 1', recipe: '김치찌개' },
        { id: 2, group: '그룹 1', recipe: '불고기' },
        { id: 3, group: '그룹 1', recipe: '닭볶음탕' }, 
    ],
    [dateToDateString(addDays(new Date(), -1))]: [
        { id: 4, group: '그룹 1', recipe: '스테이크' },
    ],
    [TODAY_STRING]: [
        { id: 5, group: '그룹 1', recipe: '파스타' },
        { id: 6, group: '그룹 1', recipe: '샐러드' },
        { id: 7, group: '그룹 1', recipe: '월남쌈' },
    ],
    [dateToDateString(addDays(new Date(), 3))]: [
        { id: 8, group: '그룹 1', recipe: '잡채' },
    ],
}; 

interface DayData {
    date: number;
    dateString: string;
    isToday: boolean;
    isSelected: boolean;
    recipes: RecipeItem[];
    dayOfWeek: number;
}

// 일주일 날짜 데이터 생성
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

// 초기 메모장 내용 (빈 칸)
const initialMemo = '';

// 메인 화면 처리
export default function GroupDetailScreen() {
    const router = useRouter(); 
    const route = useRoute();
    const insets = useSafeAreaInsets();

    // @ts-ignore: groupName 타입은 동적으로 넘어오므로 임시로 사용
    const { groupName = '그룹 상세' } = route.params || {};

    // 달력 상태 관리
    const initialDateString = TODAY_STRING;
    const initialWeekStart = startOfWeek(new Date(), { weekStartsOn: WEEK_STARTS_ON }); 

    const [currentDateString, setCurrentDateString] = useState(initialDateString);
    const [currentWeekStartDate, setCurrentWeekStartDate] = useState(initialWeekStart);

    // 메모장 상태 관리
    const [memoText, setMemoText] = useState(initialMemo);
    const MAX_MEMO_LENGTH = 100;

    const weekDays = useMemo(() => getWeekDays(dateToDateString(currentWeekStartDate), currentDateString), [currentWeekStartDate, currentDateString]);
    
    const handleGoBack = () => {
        router.back();
    };

    // 주 단위 이동 핸들러
    const changeWeek = useCallback((delta: number) => {
        setCurrentWeekStartDate(prev => {
            const newWeekStart = delta > 0 ? addWeeks(prev, 1) : subWeeks(prev, 1);
            
            // 선택된 날짜가 새 주로 이동하도록 조정 (같은 요일 유지)
            const newSelectedDate = addDays(newWeekStart, new Date(currentDateString).getDay());
            setCurrentDateString(dateToDateString(newSelectedDate));

            return newWeekStart;
        });
    }, [currentDateString]);

    // 현재 선택된 날짜의 레시피 목록 (선택된 그룹에 해당하는 레시피만 필터링)
    const currentRecipes = useMemo(() => {
        const recipesForDate = MOCK_RECIPES[currentDateString] || [];
        return recipesForDate.filter(recipe => recipe.group === groupName);
    }, [currentDateString, groupName]); 
    
    const RECIPE_CARD_WIDTH = width * 0.87; // 레시피 상세 카드 가로 길이 조정

    return (
        <View style={[Styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>

            {/* Header 영역 (그룹 이름 표시) */}
            <View style={Header.HeaderAlign}>
                <TouchableOpacity onPress={handleGoBack} style={Header.BackButton}>
                    <ChevronLeft size={28} color="#000" />
                </TouchableOpacity>
                <Text style={Header.Title}>{groupName}</Text>
            </View>
            
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView contentContainerStyle={Styles.scrollContent}>
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
                                // 찌부 방지
                                const cellWidth = (width - (24 * 2) - 1) / 7; // 달력 칸 넓이 조정

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
                                    // 선택됐을 때 검은 동그라미
                                    dayData.isSelected && Calendar.todayIndicator, 
                                    ]}>
                                    <Text style={[
                                        Calendar.weekDayNumber,
                                        // 선택된 날짜는 흰색 글씨
                                        dayData.isSelected && Calendar.todayText, 
                                    ]}>{dayData.date}</Text>
                                    </View>
                                    
                                    {/* 레시피 카운트 */}
                                    {dayData.recipes.filter(r => r.group === groupName).length > 0 && (
                                    <View style={Calendar.weekRecipeCountContainer}>
                                        <Text style={Calendar.weekRecipeCountText}>{dayData.recipes.filter(r => r.group === groupName).length}</Text>
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
                            {/* 제목 변경 및 필터링된 개수 표시 */}
                            {currentDateString} (총 {currentRecipes.length}개)
                        </Text>
                        
                        {currentRecipes.length > 0 ? (
                            <ScrollView horizontal contentContainerStyle={styles.recipeCardScrollContent}>
                                {currentRecipes.map((recipeItem, index) => (
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
                                            <Text style={styles.recipeName}>
                                                    {recipeItem.recipe}
                                            </Text>
                                            <View style={styles.recipeImagePlaceholder} />
                                        </View>
                                    </View>
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
        </View>
    );
}

// 💡스타일 시트💡
const styles = StyleSheet.create({
    // 레시피 상세 카드
    recipeListTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    recipeCardScrollContent: {
        paddingBottom: 10, 
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
        flexShrink: 0, 
    },
    recipeCardMarginRight: {
        marginRight: 15,
    },
    recipeCardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    recipeName: {
        fontSize: 20, 
        fontWeight: 'bold',
        lineHeight: 30,
    },
    recipeImagePlaceholder: {
        width: 80, 
        height: 80, 
        backgroundColor: '#ccc',
        borderRadius: 8,
        marginLeft: 'auto',
        flexShrink: 0,
    },
    noRecipeText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#999',
        marginTop: 30,
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
        borderRadius: 8, 
    },
    memoInputContainer: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        minHeight: 120,
        backgroundColor: '#fff',
    },
    memoInput: {
        fontSize: 16,
        flex: 1,
        maxHeight: 100,
    },
    charCount: {
        textAlign: 'right',
        fontSize: 12,
        color: '#999',
        marginTop: 5,
    }
});
