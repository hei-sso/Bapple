// app/mypage/fridge-settings.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function FridgeSettingsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const pageTitle = "냉장고 공개 범위";

    const handleGoBack = () => {
        router.back();
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={styles.appHeader}>
                <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                    <Text style={styles.backText}>{'<'}</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{pageTitle}</Text>
            </View>
            <View style={styles.content}>
                <Text style={styles.contentText}>페이지 내용 구현 예정</Text>
            </View>
        </View>
    );
}

// 💡스타일 시트💡
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', },
    appHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 15, marginBottom: 20,
    },
    backButton: { position: 'absolute', left: 24, padding: 5, zIndex: 10, },
    backText: { fontSize: 28, fontWeight: '300', color: '#000', },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#000', },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', },
    contentText: { fontSize: 16, color: '#999', },
});
