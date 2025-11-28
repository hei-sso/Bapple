// app/mypage/health.tsx

import Checkbox from 'expo-checkbox';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Style 임포트
import { CheckBox } from '@/components/checkbox'; // 체크박스
import { Header } from '@/components/header'; // 헤더
import { Styles } from '@/constants/styles'; // 공통

// Type 임포트
import { HealthItem } from '@/types/userTypes';

// API 임포트
import { fetchHealthOptions, fetchUserHealthData, saveUserHealthData } from '@/api/healthAPI';

export default function HealthScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // 로딩/저장 상태
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // 전체 목록 상태 (DB에서 로드)
    const [allHealthConditions, setAllHealthConditions] = useState<HealthItem[]>([]);
    const [allAllergies, setAllAllergies] = useState<HealthItem[]>([]);

    // 사용자 선택 상태 (초기에는 빈 배열, DB에서 로드 후 업데이트)
    const [selectedHealth, setSelectedHealth] = useState<string[]>([]);
    const [selectedAllergy, setSelectedAllergy] = useState<string[]>([]);

    // 1. 초기 데이터 로딩 (전체 옵션 목록 + 사용자 선택 값)
    useEffect(() => {
        const loadData = async () => {
            try {
                // (1) 전체 목록 로드 (API/DB)
                const options = await fetchHealthOptions(); 
                setAllHealthConditions(options.health_condition);
                setAllAllergies(options.allergy);
                
                // (2) 사용자 선택 값 로드 (API/DB)
                const profile = await fetchUserHealthData();
                setSelectedHealth(profile.health_conditions);
                setSelectedAllergy(profile.allergies);
                
            } catch (error) {
                console.error("❌ 데이터 로드 실패:", error);
                Alert.alert("로드 오류", error instanceof Error ? error.message : "정보를 불러오는데 실패했습니다.");
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);


    // 체크박스 토글 로직
    const toggleHealth = useCallback((id: string) => {
        setSelectedHealth((prev) =>
            prev.includes(id)
                ? prev.filter((a) => a !== id)
                : [...prev, id]
        );
    }, []);

    const toggleAllergy = useCallback((id: string) => {
        setSelectedAllergy((prev) =>
            prev.includes(id)
                ? prev.filter((a) => a !== id)
                : [...prev, id]
        );
    }, []);


    // '저장' 버튼 핸들러 (API 호출)
    const handleSaveHealth = async () => {
        if (isSaving || isLoading) return; 

        setIsSaving(true);
        try {
            // 백엔드 updateProfile에 맞게 ID 배열만 전송
            await saveUserHealthData(selectedHealth, selectedAllergy);
            
            // 저장 성공 시
            Alert.alert("저장 완료", "건강 정보가 성공적으로 저장되었습니다.");
            router.back(); 

        } catch (error) {
            console.error("❌ 저장 실패:", error);
            const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
            Alert.alert("저장 오류", errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    const handleGoBack = () => router.back();

    return (
        <View style={[Styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            {/* 헤더 */}
            <View style={Header.HeaderAlign}>
                <TouchableOpacity onPress={handleGoBack} style={Header.BackButton} disabled={isSaving}>
                    <ChevronLeft size={28} color="#000" />
                </TouchableOpacity>
                <Text style={Header.Title}>건강 정보</Text>
                <TouchableOpacity onPress={handleSaveHealth} style={Header.SaveButton} disabled={isSaving}>
                    {isSaving ? (
                        <ActivityIndicator size="small" color="#007AFF" />
                    ) : (
                        <Text style={Header.SaveButtonText}>저장</Text>
                    )}
                </TouchableOpacity>
            </View>
            
            <ScrollView contentContainerStyle={Styles.scrollContent}>

                {/* 질병 여부 섹션 */}
                <View style={styles.section}>
                    <Text style={styles.label}>질병 여부</Text>
                    <View style={styles.divider}>
                        <View style={styles.mapWrapper}>
                            {allHealthConditions.map((item) => {
                                const isChecked = selectedHealth.includes(item.id);

                                return (
                                    <TouchableOpacity 
                                        key={item.id} 
                                        style={styles.itemAlign}
                                        onPress={() => toggleHealth(item.id)}
                                        disabled={isSaving}
                                    >
                                        <Checkbox
                                            style={CheckBox.checkbox}
                                            value={isChecked}
                                            onValueChange={() => toggleHealth(item.id)}
                                            color={isChecked ? '#000' : undefined}
                                        />
                                        <Text style={CheckBox.itemLabel}>{item.name}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </View>
                
                {/* 알레르기 여부 섹션 */}
                <View style={styles.section}>
                    <Text style={styles.label}>알레르기 여부</Text>
                    <View style={styles.divider}>
                        <View style={styles.mapWrapper}>
                            {allAllergies.map((item) => {
                                const isChecked = selectedAllergy.includes(item.id);

                                return (
                                    <TouchableOpacity 
                                        key={item.id} 
                                        style={styles.itemAlign}
                                        onPress={() => toggleAllergy(item.id)}
                                        disabled={isSaving}
                                    >
                                        <Checkbox
                                            style={CheckBox.checkbox}
                                            value={isChecked}
                                            onValueChange={() => toggleAllergy(item.id)}
                                            color={isChecked ? '#000' : undefined}
                                        />
                                        <Text style={CheckBox.itemLabel}>{item.name}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </View>
                
            </ScrollView>
        </View>
    );
}

// 💡스타일 시트💡
const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#555',
    },
    section: {
        marginTop: 20,
        marginBottom: 30, // 섹션 간격 조정
    },
    label: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 5,
    },
    divider: {
        height: 1,
        backgroundColor: "#ddd",
        marginVertical: 10
    },
    itemAlign: {
        flexDirection: "row",
        alignItems: "center",
        width: "33.33%", // 한 줄에 3개
        marginVertical: 10,
        paddingRight: 10,
    },
    mapWrapper: {
        flexDirection: "row",
        flexWrap: "wrap"
    },
});
