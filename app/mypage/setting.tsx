// app/mypage/setting.tsx

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function SettingScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backButton}>&lt;</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>설정</Text>
                <View style={styles.placeholder}></View>
            </View>
            <View style={styles.content}>
                <Text style={styles.sectionTitle}>계정</Text>
                <TouchableOpacity style={styles.menuItem}><Text>알림</Text></TouchableOpacity>
                <TouchableOpacity style={styles.menuItem}><Text>회원 탈퇴</Text></TouchableOpacity>
                
                <Text style={styles.sectionTitle}>지원</Text>
                <TouchableOpacity style={styles.menuItem}><Text>고객 센터</Text></TouchableOpacity>

                <TouchableOpacity style={styles.logoutButton}>
                    <Text style={styles.logoutButtonText}>로그아웃</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

// 💡스타일 시트💡
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingTop: 50,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderColor: '#eee',
    },
    backButton: { fontSize: 24, color: '#000' },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    placeholder: { width: 24 },
    content: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#666',
        marginTop: 20,
        marginBottom: 10,
    },
    menuItem: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderColor: '#eee',
    },
    logoutButton: {
        marginTop: 40,
        paddingVertical: 15,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        alignItems: 'center',
    },
    logoutButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
});
