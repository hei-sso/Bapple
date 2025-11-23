// app/mypage/health.tsx
import Checkbox from 'expo-checkbox';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Style 임포트
import { authStyles } from '@/constants/styles';  // 공통
import { Header } from '@/components/header';  // 헤더
import { CheckBox } from '@/components/checkbox' // 체크박스

const mockData = {
    health_condition: [
        { id: 1, name: "당뇨" },
        { id: 2, name: "고지혈"},
    ],
    allergy: [
        { id: 1, name: "우유" },
        { id: 2, name: "메밀" },
        { id: 3, name: "땅콩" },
        { id: 4, name: "대두" },
    ],
    user_health_condition: [2],
    user_allergy: [1],
};

export default function HealthScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // 상태 관리
    const [selectedHealth, setSelectedHealth] = useState<number[]>(mockData.user_health_condition);
    const [seletecAllergy, setSelectedAllergy] = useState<number[]>(mockData.user_allergy);

    const toggleHealth = (id: number) => {
        setSelectedHealth((prev) =>
        prev.includes(id)
            ? prev.filter((a) => a !== id)
            : [...prev, id]
        );
    };

    const toggleAllergy = (id: number) => {
        setSelectedAllergy((prev) =>
        prev.includes(id)
            ? prev.filter((a) => a !== id)
            : [...prev, id]
        );
    };

    const handleGoBack = () => router.back();

    const handleSaveHealth = () => {
      // [추후 구현] 건강 정보 변경 사항 저장 로직
      console.log("선택된 질병:", selectedHealth);
      console.log("선택된 알레르기:", seletecAllergy);
      router.back();
    };

    return (
        <View style={[authStyles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={Header.HeaderAlign}>
                <TouchableOpacity onPress={handleGoBack} style={Header.BackButton}>
                    <Text style={Header.BackText}>{'<'}</Text>
                </TouchableOpacity>
                <Text style={Header.Title}>건강 정보</Text>
                <TouchableOpacity onPress={handleSaveHealth} style={Header.SaveButton}>
                    <Text style={Header.SaveButtonText}>저장</Text>
                </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={authStyles.scrollContent}>

                {/* 질병 여부 */}
                <View style={styles.section}>
                    <Text style={styles.label}>질병 여부</Text>
                    <View style={styles.divider}>
                        <View style={styles.mapWrapper}>
                            {mockData.health_condition.map((item) => {
                                const Checked = selectedHealth.includes(item.id);

                                return (
                                    <View key={item.id} style={styles.itemAlign}>
                                        <Checkbox
                                            style={CheckBox.checkbox}
                                            value={Checked}
                                            onValueChange={() => toggleHealth(item.id)}
                                            color={Checked ? '#000' : undefined}
                                        />
                                        <Text style={CheckBox.itemLabel}>{item.name}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                </View>
                
                {/* 알레르기 여부 */}
                <Text style={styles.label}>알레르기 여부</Text>
                <View style={styles.divider}>
                    <View style={styles.mapWrapper}>
                        {mockData.allergy.map((item) => {
                            const Checked = seletecAllergy.includes(item.id);

                            return (
                                <View key={item.id} style={styles.itemAlign}>
                                    <Checkbox
                                        style={CheckBox.checkbox}
                                        value={Checked}
                                        onValueChange={() => toggleAllergy(item.id)}
                                        color={Checked ? '#000' : undefined}
                                    />
                                    <Text style={CheckBox.itemLabel}>{item.name}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

// 💡스타일 시트💡
const styles = StyleSheet.create({
    section: {
        marginTop: 20,
        marginBottom: 80,  // 섹션 간격 고정값
    },
    label: {
        fontSize: 18,
        fontWeight: "700",
    },
    divider: {
        height: 1,
        backgroundColor: "#ddd",
        marginVertical: 10
    },
    itemAlign: {
        flexDirection: "row",
        alignItems: "center",
        width: "30%", // 한 줄에 3개
        marginVertical: 10,
    },
    mapWrapper: {
        flexDirection: "row",
        flexWrap: "wrap"
    },
});
