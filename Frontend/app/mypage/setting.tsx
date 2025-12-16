// app/mypage/setting.tsx

import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
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

import { useAuth } from '@/context/authContext';

export default function SettingScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { signOut } = useAuth(); 

    // 로그아웃 버튼 핸들러
    const handleLogout = () => {
        Alert.alert(
            "로그아웃",
            "정말 로그아웃 하시겠습니까?",
            [
                { text: "취소", style: "cancel" },
                { 
                    text: "로그아웃", 
                    style: "destructive",
                    onPress: async () => {
                        // Context의 signOut 함수 호출 (백엔드 통신 + 토큰 삭제 자동 처리)
                        await signOut(); 
                    }
                }
            ]
        );
    };

    return (
        <View style={[Styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={Header.HeaderAlign}>
                <TouchableOpacity onPress={() => router.back()} style={Header.BackButton}>
                    <ChevronLeft size={28} color="#000" />
                </TouchableOpacity>
                <Text style={Header.Title}>설정</Text>
            </View>

            <ScrollView contentContainerStyle={Styles.scrollContent}>
                <Text style={styles.sectionTitle}>계정</Text>
                <TouchableOpacity style={styles.menuItem}>
                    <Text style={styles.menuItemText}>알림</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem}>
                    <Text style={styles.menuItemText}>회원 탈퇴</Text>
                </TouchableOpacity>
                
                <Text style={styles.sectionTitle}>지원</Text>
                <TouchableOpacity style={styles.menuItem}>
                    <Text style={styles.menuItemText}>고객 센터</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.logoutButton}>
                    <Text style={styles.logoutButtonText}>로그아웃</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

// 🎨 스타일 시트
const styles = StyleSheet.create({
    content: {
        padding: 20
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
        marginTop: 20,
        marginBottom: 10
    },
    menuItem: {
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderColor: '#eee'
    },
    menuItemText: {
        fontSize: 16
    },
    logoutButton: {
        marginTop: 40,
        paddingVertical: 15,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        alignItems: 'center'
    },
    logoutButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333'
    }
});
