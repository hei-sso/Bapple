// app/recipe/detail.tsx

import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Trash2 } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Button,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// API
import { fetchRecipeDetail } from '@/api/recipeAPI';

// Style
import { Header } from '@/components/header';
import { Styles } from '@/constants/styles';

// Context
import { GroupProvider, useGroups } from '@/context/groupContext';

// Component
import RecipeScheduleModal from '@/components/RecipeScheduleModal';

// Type
import type { RecipeDetail } from '@/types/recipeTypes';


// 내부 로직 컴포넌트 (Context 사용을 위해 분리)
function RecipeDetailContent() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    
    // 파라미터 받기 (삭제 버튼 표시를 위한 파라미터만 유지)
    const { id, isScheduled } = useLocalSearchParams(); 
    
    const recipeId = Array.isArray(id) ? id[0] : id || '';
    
    // 식단 등록 경로에서 열렸을 때만 삭제 버튼 표시
    const showDeleteButton = isScheduled === 'true'; 

    // Context & State
    const { scheduleRecipe } = useGroups();
    
    const [isModalVisible, setModalVisible] = useState(false);
    const [recipeDetail, setRecipeDetail] = useState<RecipeDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // 상세 정보 로드 (API 연결)
    useEffect(() => {
        if (!recipeId) {
            Alert.alert("오류", "레시피 ID가 유효하지 않습니다.");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        fetchRecipeDetail(recipeId) 
            .then(data => {
                setRecipeDetail(data);
            })
            .catch(error => {
                console.error("❌ 상세 레시피 로드 실패:", error);
                Alert.alert("오류", `레시피 상세 정보를 불러오지 못했습니다: ${error.message}`);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [recipeId]);

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

    // 로딩 중
    if (isLoading) {
        return (
            <View style={[Styles.container, styles.loadingContainer, { paddingTop: insets.top }]}>
                <Text>레시피 정보를 불러오는 중...</Text>
            </View>
        );
    }
    
    // 데이터 로드 실패
    if (!recipeDetail) {
         return (
            <View style={[Styles.container, styles.loadingContainer, { paddingTop: insets.top }]}>
                <Text>레시피 정보를 찾을 수 없습니다.</Text>
                <View style={{ marginTop: 20 }}>
                    <Button title="뒤로 가기" onPress={handleGoBack} />
                </View>
            </View>
        );
    }


    // 렌더링
    return (
        <View style={[Styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            {/* Header */}
            <View style={Header.HeaderAlign}>
                <TouchableOpacity onPress={handleGoBack} style={Header.BackButton}>
                    <ChevronLeft size={28} color="#000" />
                </TouchableOpacity>
                <Text style={Header.Title} numberOfLines={1}>레시피 상세</Text>
                 
                {/* 삭제 버튼: 기능 없이 시각적으로만 존재 */}
                {showDeleteButton && (
                    <TouchableOpacity 
                        // onPress={...} 삭제
                        style={styles.deleteButton} 
                        // disabled={true} 로직을 제거하고 시각적으로만 존재
                    >
                        <Trash2 size={24} color="gray" /> {/* 비활성화 느낌을 위해 gray 사용 */}
                    </TouchableOpacity>
                )}
            </View>
            
            <ScrollView contentContainerStyle={styles.scrollContent}>
                
                {/* 1. 레시피 이름 (스크린샷 중앙 상단) */}
                <View style={styles.nameContainer}>
                    <Text style={styles.recipeName}>{recipeDetail.name}</Text>
                </View>

                {/* 2. 레시피 사진 (스크린샷) */}
                <View style={styles.imagePlaceholder}>
                    {recipeDetail.recipeImageUrl ? (
                        <Image 
                            source={{ uri: recipeDetail.recipeImageUrl }} 
                            style={styles.image} 
                        />
                    ) : (
                        <Text style={styles.imageText}>레시피 사진</Text>
                    )}
                </View>
                
                {/* 3. 난이도 / 조리 시간 (스크린샷) */}
                <View style={styles.infoRow}>
                    <View style={styles.infoBox}>
                        <Text style={styles.infoLabel}>난이도</Text>
                        <Text style={styles.infoValue}>{recipeDetail.difficulty}</Text>
                    </View>
                    <View style={styles.infoBox}>
                        <Text style={styles.infoLabel}>조리 시간</Text>
                        <Text style={styles.infoValue}>{recipeDetail.cookTimeMinutes}분</Text>
                    </View>
                </View>
                
                {/* 4. 레시피 재료 (스크린샷) */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>레시피 재료</Text>
                    {recipeDetail.ingredients.map((item, index) => (
                        <Text key={index} style={styles.listItemText}>- {item}</Text>
                    ))}
                </View>
                
                {/* 5. 조리 방법 (스크린샷) */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>조리 방법</Text>
                    {recipeDetail.instructions.map((item, index) => (
                        <Text key={index} style={styles.listItemText}>{index + 1}. {item}</Text>
                    ))}
                </View>
                
                {/* 식단 추가 버튼 (기존 기능) */}
                <View style={{ marginTop: 30, paddingHorizontal: 20 }}>
                    <Button title="식단에 추가하기" onPress={() => setModalVisible(true)} />
                </View>

            </ScrollView>

            {/* 모달 */}
            <RecipeScheduleModal
                isVisible={isModalVisible}
                onClose={() => setModalVisible(false)}
                recipeId={recipeId || ''}
                recipeName={recipeDetail.name}
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    scrollContent: {
        paddingBottom: 40
    },

    // 삭제 버튼 스타일
    deleteButton: {
        position: 'absolute',
        right: 20, 
        top: 10, 
        zIndex: 10, 
        padding: 5
    },

    // 레시피 이름 컨테이너 추가
    nameContainer: {
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 10
    },
    recipeName: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center'
    },
    imagePlaceholder: {
        width: '100%',
        height: 250, 
        backgroundColor: '#eee',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover'
    },
    imageText: {
        color: '#666',
        fontSize: 18
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 20,
        marginBottom: 30
    },
    infoBox: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 15,
        alignItems: 'center',
        minWidth: '40%',
        backgroundColor: '#fff'
    },
    infoLabel: {
        fontSize: 14,
        color: '#888',
        marginBottom: 5
    },
    infoValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333'
    },
    sectionContainer: {
        paddingHorizontal: 20,
        marginBottom: 30
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
        borderBottomWidth: 2,
        borderBottomColor: '#f0f0f0',
        paddingBottom: 5,
        color: '#333'
    },
    listItemText: {
        fontSize: 16,
        lineHeight: 24,
        color: '#444',
        marginBottom: 5
    }
});
