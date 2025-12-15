// app/recipe/detail.tsx

import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Alert,
    Button,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Style
import { Header } from '@/components/header';
import { Styles } from '@/constants/styles';

// Context & Component
import RecipeScheduleModal from '@/components/RecipeScheduleModal'; // 모달 컴포넌트
import { GroupProvider, useGroups } from '@/context/groupContext';

// 내부 로직 컴포넌트 (Context 사용을 위해 분리)
function RecipeDetailContent() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    
    // 파라미터 받기
    const { id, name } = useLocalSearchParams(); 
    
    // 배열로 들어올 때를 대비해 문자열로 변환 (undefined 방지)
    const safeId = Array.isArray(id) ? id[0] : id;
    const safeName = Array.isArray(name) ? name[0] : name;

    // Context & State
    const { scheduleRecipe } = useGroups();
    const [isModalVisible, setModalVisible] = useState(false);

    const handleGoBack = () => {
        router.back();
    };

    // 식단 추가 함수 (모달에서 호출)
    const handleScheduleSubmit = async (data: { 
        recipeId: string; 
        date: string; 
        groupId: string | 'personal'; 
    }) => {
        try {
            await scheduleRecipe({
                recipeId: data.recipeId,
                date: data.date,
                groupId: data.groupId
            });
            Alert.alert("성공", "식단에 추가되었습니다!");
        } catch (error) {
            console.error(error);
            Alert.alert("오류", "식단 추가 실패");
        }
    };

    return (
        <View style={[Styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={Header.HeaderAlign}>
                <TouchableOpacity onPress={handleGoBack} style={Header.BackButton}>
                    <ChevronLeft size={28} color="#000" />
                </TouchableOpacity>
                <Text style={Header.Title}>레시피 상세</Text>
            </View>

            <View style={styles.content}>
                <Text style={styles.contentTitle}>{safeName}</Text>
                <Text style={styles.contentSub}>레시피 ID: {safeId}</Text>
                
                {/* 기능 추가: 기본 버튼으로 모달 열기 */}
                <View style={{ marginTop: 20 }}>
                    <Button title="식단에 추가하기" onPress={() => setModalVisible(true)} />
                </View>
            </View>

            {/* 모달에 safeId 전달 */}
            <RecipeScheduleModal
                isVisible={isModalVisible}
                onClose={() => setModalVisible(false)}
                recipeId={safeId || ''}
                recipeName={safeName || ''}
                onSchedule={handleScheduleSubmit}
            />
        </View>
    );
}

// Provider 감싸기
export default function RecipeDetailScreen() {
    return (
        <GroupProvider>
            <RecipeDetailContent />
        </GroupProvider>
    );
}

// 🎨 스타일 시트
const styles = StyleSheet.create({
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    contentTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10
    },
    contentSub: {
        fontSize: 16,
        color: '#666'
    }
});
