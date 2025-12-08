// app/mypage/fridge-setting.tsx

import { useRouter } from 'expo-router';
import { ChevronLeft, Globe, Lock, Users } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Style
import { Header } from '@/components/header'; // 헤더
import { Styles } from '@/constants/styles'; // 공통

// Type: 'private' | 'friends' | 'public'
type FridgeVisibility = 'private' | 'friends' | 'public';

// 설정 옵션 목록
const OPTIONS = [
    { 
        value: 'private' as FridgeVisibility, 
        label: "비공개", 
        description: "나만 냉장고 목록을 볼 수 있습니다.",
        Icon: Lock,
        color: '#E57373' // Red
    },
    { 
        value: 'friends' as FridgeVisibility, 
        label: "친구 공개", 
        description: "팔로잉하는 친구들만 냉장고 목록을 볼 수 있습니다.",
        Icon: Users,
        color: '#4FC3F7' // Blue
    },
    { 
        value: 'public' as FridgeVisibility, 
        label: "모두 공개", 
        description: "모든 사용자가 나의 냉장고 목록을 볼 수 있습니다.",
        Icon: Globe,
        color: '#81C784' // Green
    },
];

interface RadioOptionProps {
    option: typeof OPTIONS[0];
    selectedValue: FridgeVisibility;
    onSelect: (value: FridgeVisibility) => void;
}

const RadioOption: React.FC<RadioOptionProps> = ({ option, selectedValue, onSelect }) => {
    const isActive = option.value === selectedValue;
    return (
        <TouchableOpacity
            style={[styles.radioOption, isActive && styles.radioOptionActive]}
            onPress={() => onSelect(option.value)}
        >
            <option.Icon size={24} color={isActive ? '#000' : option.color} style={{ marginRight: 15 }} />
            <View style={{ flex: 1 }}>
                <Text style={styles.radioTextLabel}>{option.label}</Text>
                <Text style={styles.radioTextDescription}>{option.description}</Text>
            </View>
            {/* 선택 표시를 위한 도트 */}
            <View style={[styles.radioDot, isActive && { backgroundColor: '#000' }]} />
        </TouchableOpacity>
    );
};

// 메인 컴포넌트
export default function FridgeSettingsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const pageTitle = "냉장고 공개 범위";

    // DB에서 불러온 초기값이라고 가정하고 'friends'로 초기화
    const [visibility, setVisibility] = useState<FridgeVisibility>('friends'); 
    
    const handleGoBack = () => {
        router.back();
    };

    const handleSave = () => {
        const selectedLabel = OPTIONS.find(o => o.value === visibility)?.label;
        Alert.alert("저장 완료", `냉장고 공개 범위가 '${selectedLabel}'(으)로 설정되었습니다. (DB 연동 필요)`);
        // 실제 구현 시: API 호출하여 DB 업데이트
    }

    return (
        <View style={[Styles.container, { paddingTop: insets.top }]}>
            {/* 헤더 영역 */}
            <View style={Header.HeaderAlign}>
                <TouchableOpacity onPress={handleGoBack} style={Header.BackButton}>
                    <ChevronLeft size={28} color="#000" />
                </TouchableOpacity>
                <Text style={Header.Title}>{pageTitle}</Text>
            </View>
            
            <ScrollView style={styles.content}>
                <Text style={styles.sectionTitle}>누구에게 나의 냉장고를 공개할까요?</Text>
                
                <View style={styles.radioContainer}>
                    {OPTIONS.map((option) => (
                        <RadioOption
                            key={option.value}
                            option={option}
                            selectedValue={visibility}
                            onSelect={setVisibility}
                        />
                    ))}
                </View>
                
            </ScrollView>

            {/* 저장 버튼 */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <Text style={styles.saveButtonText}>저장하기</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

// 🎨 스타일 시트
const styles = StyleSheet.create({
    content: {
        padding: 10
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333'
    },
    radioContainer: {
        marginBottom: 30
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        marginBottom: 10,
        backgroundColor: '#f9f9f9'
    },
    radioOptionActive: {
        backgroundColor: '#e6ffe6', // 밝은 녹색 계열
        borderColor: '#4CAF50'
    },
    radioTextLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2
    },
    radioTextDescription: {
        fontSize: 13,
        color: '#666'
    },
    radioDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#000',
        backgroundColor: '#fff',
        marginLeft: 15
    },
    // 하단 저장 버튼
    footer: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderColor: '#eee',
        backgroundColor: '#fff'
    },
    saveButton: {
        backgroundColor: '#000',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center'
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold'
    }
});
