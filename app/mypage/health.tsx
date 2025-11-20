// app/mypage/health.tsx

import { useRouter } from 'expo-router';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Style 임포트
import { authStyles } from '@/constants/styles';  // 공통
import { Header } from '@/components/header';  // 헤더

export default function HealthScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const pageTitle = "건강 정보";

    const handleGoBack = () => {
        router.back();
    };

    return (
        <View style={[authStyles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={Header.HeaderAlign}>
                <TouchableOpacity onPress={handleGoBack} style={Header.BackButton}>
                    <Text style={Header.BackText}>{'<'}</Text>
                </TouchableOpacity>
                <Text style={Header.Title}>{pageTitle}</Text>
            </View>
            <View style={styles.content}>
                <Text style={styles.contentText}>페이지 내용 구현 예정</Text>
            </View>
        </View>
    );
}

// 💡스타일 시트💡
const styles = StyleSheet.create({
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', },
    contentText: { fontSize: 16, color: '#999', },
});
