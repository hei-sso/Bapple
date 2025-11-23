// components/week-calendar.ts

import { Dimensions, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');

export const Calendar = StyleSheet.create({
    // 달력 영역
    calendarArea: {
        marginBottom: 30,
        position: 'relative',
        marginTop: 15, // 달력 영역과 헤더 날짜 사이 여백
    },
    // 주 이동 버튼
    weekNavContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
    },
    weekNavAlign: {
        position: 'absolute',
        right: 0,
        flexDirection: 'row',
    },
    weekNavButton: {
        paddingHorizontal: 5,
    },
    // 일주일 (월~금) 표시
    dayOfWeekContainer: {
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
    // 달력 칸
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
    // 달력 칸 안의 날짜
    dayNumberContainer: {
        width: 25,
        height: 25,
        borderRadius: 12.5, // 동그라미
        justifyContent: 'center',
        alignItems: 'center',
    },
    // 선택된 날짜의 배경색
    weekSelectedCell: {
        backgroundColor: '#f0f0f0',
    },
    // 오늘 날짜 선택 시, 검은색 동그라미와 흰색 글씨
    todayIndicator: {
        backgroundColor: '#000', // 검은색 동그라미
    },
    todayText: {
        color: '#fff', // 흰색 글씨
        fontWeight: 'bold',
    },
    // 달력 날짜 표시 (12, 13, 14)
    weekDayNumber: {
        fontSize: 16, 
        fontWeight: 'bold',
    },
    // 레시피
    weekRecipeCountContainer: {
        marginTop: 6,
    },
    weekRecipeCountText: {
        fontSize: 12,
        color: '#000',
    }
});
