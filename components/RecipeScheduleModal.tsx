// components/RecipeScheduleModal.tsx

import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar as CalendarIcon, Users, X } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

// Context
import { useGroups } from '@/context/groupContext';

// Type
import type { Group } from '@/types/groupTypes';

const TODAY_DATE = new Date();

interface RecipeScheduleModalProps {
    isVisible: boolean;
    onClose: () => void;
    recipeId: string; // 추가할 레시피 ID
    recipeName: string; // 추가할 레시피 이름
    onSchedule: (data: { 
        recipeId: string; 
        date: string; 
        groupId: string | 'personal'; 
    }) => Promise<void>;
}

const RecipeScheduleModal: React.FC<RecipeScheduleModalProps> = ({
    isVisible,
    onClose,
    recipeId,
    recipeName,
    onSchedule,
}) => {
    const { myGroups, isLoading: groupsLoading } = useGroups();
    const [selectedDate, setSelectedDate] = useState(TODAY_DATE); 
    const [selectedGroup, setSelectedGroup] = useState<string | 'personal'>('personal');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Date Picker show/hide state (iOS에서는 항상 표시, Android는 모달로 처리)
    const [showPicker, setShowPicker] = useState(Platform.OS === 'ios');

    // 개인 냉장고 항목 추가
    const allGroups = useMemo(() => {
        const personalGroup: Group = { 
            id: 'personal', 
            name: '나 (개인 식단)', 
            description: '개인 식단 등록', 
            ownerId: '', 
            inviteCode: '', 
            settings: { isFridgeShared: 'owner_only' },
            memberCount: 1, 
            maxMembers: 1,
            isPinned: true, 
            imageUri: 'NULL',
            createdAt: format(TODAY_DATE, 'yyyy-MM-dd'),
        };
        return [personalGroup, ...myGroups];
    }, [myGroups]);

    // DateTimePicker 값 변경 핸들러
    const onChange = (event: any, date?: Date) => {
        if (Platform.OS === 'android') {
            setShowPicker(false);
        }
        if (date) {
            setSelectedDate(date);
        }
    };

    const handleSchedule = async () => {
        // recipeId 유효성 검사
        if (!recipeId) {
            Alert.alert('오류', '레시피 정보가 올바르지 않습니다. 다시 시도해주세요.');
            console.error("RecipeScheduleModal: recipeId is missing");
            return;
        }

        const dateString = format(selectedDate, 'yyyy-MM-dd');

        if (!dateString || !selectedGroup) {
            Alert.alert('경고', '날짜와 그룹을 선택해주세요.');
            return;
        }

        setIsSubmitting(true);
        try {
            // onSchedule 호출 시 recipeId를 명확하게 전달
            console.log("🚀 Modal handleSchedule submitting:", { recipeId, date: dateString, groupId: selectedGroup });
            
            await onSchedule({
                recipeId: recipeId, // 여기서 props로 받은 recipeId를 그대로 전달
                date: dateString,
                groupId: selectedGroup,
            });
            onClose(); 
        } catch (error) {
            // 에러 처리는 부모 컴포넌트(onSchedule 내부)나 여기서 할 수 있음
            // 이미 부모에서 Alert를 띄우므로 여기서는 로그만 남김
            console.error("식단 등록 실패 (Modal):", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isLoading = isSubmitting || groupsLoading;

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    
                    {/* 닫기 버튼 */}
                    <TouchableOpacity style={styles.closeButton} onPress={onClose} disabled={isLoading}>
                        <X size={24} color="#333" />
                    </TouchableOpacity>

                    <Text style={styles.title}>식단 메뉴 추가</Text>
                    <Text style={styles.recipeNameText}>선택 레시피: {recipeName}</Text>
                    
                    <ScrollView contentContainerStyle={styles.scrollContent}>

                        {/* 날짜 선택 */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <CalendarIcon size={20} color="#000" />
                                <Text style={styles.sectionTitle}>추가할 날짜 선택</Text>
                            </View>
                            <Text style={styles.selectedInfo}>
                                선택 날짜: {format(selectedDate, 'yyyy년 M월 d일 (E)', { locale: ko })}
                            </Text>
                            
                            {Platform.OS === 'android' && (
                                <TouchableOpacity 
                                    style={styles.androidDatePickerButton} 
                                    onPress={() => setShowPicker(true)}
                                >
                                    <Text style={styles.androidDatePickerButtonText}>날짜 선택</Text>
                                </TouchableOpacity>
                            )}
                            
                            {(showPicker || Platform.OS === 'ios') && (
                                <DateTimePicker
                                    testID="dateTimePicker"
                                    value={selectedDate}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'inline' : 'default'} // iOS는 캘린더 모양으로 인라인 표시
                                    onChange={onChange}
                                    style={Platform.OS === 'ios' ? styles.iosDatePicker : undefined}
                                />
                            )}
                        </View>

                        {/* 그룹 선택 */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Users size={20} color="#000" />
                                <Text style={styles.sectionTitle}>그룹 선택</Text>
                            </View>
                            <Text style={styles.selectedInfo}>
                                등록 위치: {allGroups.find(g => g.id === selectedGroup)?.name || '선택 필요'}
                            </Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupScroll}>
                                {allGroups.map(group => (
                                    <TouchableOpacity 
                                        key={group.id}
                                        style={[
                                            styles.groupButton,
                                            selectedGroup === group.id && styles.groupButtonActive,
                                        ]}
                                        onPress={() => setSelectedGroup(group.id)}
                                        disabled={isLoading}
                                    >
                                        <Text style={[
                                            styles.groupButtonText,
                                            selectedGroup === group.id && styles.groupButtonTextActive,
                                        ]}>
                                            {group.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </ScrollView>

                    {/* 등록 버튼 */}
                    <TouchableOpacity 
                        style={[styles.confirmButton, isLoading && styles.confirmButtonDisabled]}
                        onPress={handleSchedule}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.confirmButtonText}>식단 등록하기</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

// 🎨 스타일 시트
const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)'
    },
    modalView: {
        width: '95%',
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        maxHeight: '65%'
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 10,
        padding: 5
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333'
    },
    recipeNameText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20
    },
    scrollContent: {
        width: '100%'
    },
    section: {
        width: '100%',
        marginBottom: 20,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0'
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
        marginLeft: 8
    },
    selectedInfo: {
        fontSize: 14,
        color: '#404040ff',
        marginBottom: 10
    },
    // iOS DatePicker 인라인 스타일
    iosDatePicker: {
        width: '100%',
        height: 50,
        backgroundColor: '#000'
    },
    // Android 버튼 스타일
    androidDatePickerButton: {
        backgroundColor: '#e6e6e6',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10
    },
    androidDatePickerButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333'
    },
    // 그룹 선택
    groupScroll: {
        maxHeight: 50,
        flexDirection: 'row'
    },
    groupButton: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ccc',
        marginRight: 10,
        backgroundColor: '#f5f5f5'
    },
    groupButtonActive: {
        backgroundColor: '#404040ff',
        borderColor: '#404040ff'
    },
    groupButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333'
    },
    groupButtonTextActive: {
        color: 'white'
    },

    // 등록 버튼
    confirmButton: {
        backgroundColor: '#4CAF50',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        width: '100%',
        marginTop: 10
    },
    confirmButtonDisabled: {
        backgroundColor: '#aaa'
    },
    confirmButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold'
    }
});

export default RecipeScheduleModal;
