// app/mypage/fridge-settings.tsx

import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Style
import { Header } from '@/components/header'; // 헤더
import { Styles } from '@/constants/styles'; // 공통

export default function FridgeSettingsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const pageTitle = "냉장고 공개 범위";

    const handleGoBack = () => {
        router.back();
    };

    return (
        <View style={[Styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={Header.HeaderAlign}>
                <TouchableOpacity onPress={handleGoBack} style={Header.BackButton}>
                    <ChevronLeft size={28} color="#000" />
                </TouchableOpacity>
                <Text style={Header.Title}>{pageTitle}</Text>
            </View>
            <View style={styles.content}>
                <Text style={styles.contentText}>페이지 내용 구현 예정</Text>
            </View>
        </View>
    );
}

// 🎨 스타일 시트
const styles = StyleSheet.create({
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    contentText: {
        fontSize: 16,
        color: '#999'
    }
});
