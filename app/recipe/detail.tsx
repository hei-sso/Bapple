import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Style 임포트
import { Header } from '@/components/header';
import { Styles } from '@/constants/styles';

export default function RecipeDetailScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { id, name } = useLocalSearchParams();  // ⭐ 추천 레시피 ID랑 이름 받기

    const handleGoBack = () => {
        router.back();
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
                <Text style={styles.contentTitle}>{name}</Text>
                <Text style={styles.contentSub}>레시피 ID: {id}</Text>
            </View>
        </View>
    );
}

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