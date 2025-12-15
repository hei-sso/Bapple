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

// API
import { fetchHealthOptions, fetchUserHealthData, saveUserHealthData } from '@/api/healthAPI';

// Style
import { CheckBox } from '@/components/checkbox'; // 체크박스
import { Header } from '@/components/header'; // 헤더
import { Styles } from '@/constants/styles'; // 공통

// Type
import { HealthItem } from '@/types/userTypes';

export default function HealthScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [allHealthConditions, setAllHealthConditions] = useState<HealthItem[]>([]);
    const [allAllergies, setAllAllergies] = useState<HealthItem[]>([]);

    const [selectedHealth, setSelectedHealth] = useState<string[]>([]);
    const [selectedAllergy, setSelectedAllergy] = useState<string[]>([]);

    // 화면 탭 (◀ 질병 여부 ▶/◀ 알레르기 여부 ▶)
    const [currentTab, setCurrentTab] = useState<"health" | "allergy">("health");


    // 초기 데이터 로드
    useEffect(() => {
        const loadData = async () => {
            try {
                const options = await fetchHealthOptions();
                setAllHealthConditions(options.health_condition);
                setAllAllergies(options.allergy);

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

    const toggleHealth = useCallback((id: string) => {
        setSelectedHealth(prev =>
            prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
        );
    }, []);

    const toggleAllergy = useCallback((id: string) => {
        setSelectedAllergy(prev =>
            prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
        );
    }, []);

    const handleSaveHealth = async () => {
        if (isSaving || isLoading) return;
        setIsSaving(true);

        try {
            await saveUserHealthData(selectedHealth, selectedAllergy);
            Alert.alert("저장 완료", "건강 정보가 성공적으로 저장되었습니다.");
            router.back();
        } catch (error) {
            console.error("❌ 저장 실패:", error);
            Alert.alert("저장 오류", error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleGoBack = () => router.back();


    // 현재 탭에 따라 렌더링 결정
    const renderList = () => {
        if (currentTab === "health") {
            return (
                <View style={styles.section}>
                    <View style={styles.mapWrapper}>
                        {allHealthConditions.map(item => {
                            const isChecked = selectedHealth.includes(item.id);
                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    style={styles.itemAlign}
                                    onPress={() => toggleHealth(item.id)}
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
            );
        }

        return (
            <View style={styles.section}>
                <View style={styles.mapWrapper}>
                    {allAllergies.map(item => {
                        const isChecked = selectedAllergy.includes(item.id);
                        return (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.itemAlign}
                                onPress={() => toggleAllergy(item.id)}
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
        );
    };

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

            {/* 탭 토글 UI */}
            <View style={styles.tabRow}>
                <TouchableOpacity onPress={() => setCurrentTab("health")}>
                    <Text style={styles.arrow}>◀</Text>
                </TouchableOpacity>

                <Text style={styles.tabTitle}>
                    {currentTab === "health" ? "질병 여부" : "알레르기 여부"}
                </Text>

                <TouchableOpacity onPress={() => setCurrentTab("allergy")}>
                    <Text style={styles.arrow}>▶</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={Styles.scrollContent}>
                {renderList()}
            </ScrollView>
        </View>
    );
}

// 🎨 스타일 시트
const styles = StyleSheet.create({
    tabRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 40,
        marginTop: 10
    },
    arrow: {
        fontSize: 22,
        fontWeight: "700"
    },
    tabTitle: {
        fontSize: 18,
        fontWeight: "700"
    },
    section: {
        marginTop: 20,
        marginBottom: 20
    },
    label: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 5
    },
    divider: {
        height: 1,
        backgroundColor: "#ddd",
        marginVertical: 10
    },
    itemAlign: {
        flexDirection: "row",
        alignItems: "center",
        width: "50%", // 한 줄에 2개
        marginVertical: 10,
        paddingRight: 10
    },
    mapWrapper: {
        flexDirection: "row",
        flexWrap: "wrap"
    },
});
