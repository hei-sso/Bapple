// app/mypage/friends.tsx

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function FriendsScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backButton}>&lt;</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>친구</Text>
                <View style={styles.placeholder}></View>
            </View>
            <View style={styles.content}>
                <View style={styles.tabContainer}>
                    <TouchableOpacity style={styles.tabButton}><Text style={styles.activeTabText}>팔로잉</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.tabButton}><Text style={styles.tabText}>팔로워</Text></TouchableOpacity>
                </View>
                <Text style={styles.listArea}>친구 목록 UI 영역</Text>
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
    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
    },
    tabButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        marginHorizontal: 5,
    },
    activeTabText: { fontWeight: 'bold', color: '#000' },
    tabText: { color: '#666' },
    listArea: {
        marginTop: 10,
        textAlign: 'center',
        color: '#999'
    }
});
