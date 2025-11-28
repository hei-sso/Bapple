// app/(tabs)/mypage/index.tsx

import FontAwesome from '@expo/vector-icons/FontAwesome';
import { RedirectProps, useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Style 임포트
import { Styles } from '@/constants/styles'; // 공통

const { width } = Dimensions.get('window');

// Mock 데이터 및 상수
const MOCK_USER = {
    nickname: "Bapple",
    followers: 22,
    following: 22,
    // 💡[추후 구현] 실제 DB에서 가져올 데이터
};

// 하단 설정/정보 메뉴 목록
const INFO_MENUS = [
    { label: "건강 정보", path: "/mypage/health" },
    { label: "냉장고 공개 범위", path: "/mypage/fridge-setting" },
];

// 메인 컴포넌트
export default function MyPageScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    // 💡[추후 구현] useAuth 훅 등으로 사용자 정보 관리
    const [user, setUser] = useState(MOCK_USER);

    // 설정 페이지
    const handleSetting = useCallback(() => {
        router.push('/mypage/setting' as RedirectProps['href']);
    }, [router]);

    // 프로필 수정 버튼
    const handleEditProfile = useCallback(() => {
        router.push('/mypage/profile' as RedirectProps['href']);
    }, [router]);

    // 친구 추가 버튼
    const handleAddFriend = useCallback(() => {
        // 💡[추후 구현] 친구 추가/검색 화면으로 이동
        console.log("친구 추가하기 버튼 클릭");
    }, []);

    // 건강 정보/냉장고 공개 범위 설정
    const handleNavigation = useCallback((path: string) => {
        router.push(path as RedirectProps['href']);
    }, [router]);

    const renderInfoItem = (item: (typeof INFO_MENUS)[0], index: number) => (
        <TouchableOpacity 
            key={item.label}
            style={[
                styles.infoItem,
                index === 0 && styles.infoItemFirst,
                index === INFO_MENUS.length - 1 && styles.infoItemLast,
            ]}
            onPress={() => handleNavigation(item.path)}
        >
            <Text style={styles.infoItemText}>{item.label}</Text>
            <ChevronRight size={24} color="#000" />
        </TouchableOpacity>
    );

    return (
        <View style={[Styles.indexContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                
                {/* 상단 설정 아이콘 */}
                <View style={styles.settingsHeader}>
                    <TouchableOpacity onPress={handleSetting}>
                        <FontAwesome name="cog" size={24} color="#000" />
                    </TouchableOpacity>
                </View>

                {/* 프로필 정보 영역 */}
                <View style={styles.profileArea}>
                    
                    {/* 프로필 이미지 및 수정 버튼 (겹치게 처리) */}
                    <View style={styles.profileImageContainer}>
                        {/* 프로필 이미지 (회색 원) */}
                        <View style={styles.profileImagePlaceholder} />
                        
                        {/* 수정 버튼 (겹치는 검은색 원) */}
                        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
                            <FontAwesome name="pencil" size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* 닉네임, 팔로워/팔로잉 */}
                    <View style={styles.userInfo}>
                        <Text style={styles.nicknameText}>{user.nickname}</Text>
                        
                        <View style={styles.followStats}>
                            <Text style={styles.statItem}>{user.followers} 팔로워</Text>
                            <Text style={styles.statItem}>{user.following} 팔로잉</Text>
                        </View>
                    </View>
                </View>

                {/* 친구 추가 버튼 */}
                <TouchableOpacity style={styles.addFriendButton} onPress={handleAddFriend}>
                    <Text style={styles.addFriendButtonText}>+  친구 추가하기</Text>
                </TouchableOpacity>

                {/* 정보/설정 목록 */}
                <View style={styles.infoSection}>
                    {INFO_MENUS.map(renderInfoItem)}
                </View>

            </ScrollView>
        </View>
    );
}

// 💡스타일 시트💡
const PROFILE_SIZE = 90;
const EDIT_BUTTON_SIZE = 35;
const EDIT_BUTTON_OFFSET = 5; // 프로필 사진 모서리에 겹치는 정도

const styles = StyleSheet.create({
    scrollContent: {
        paddingTop: 0,
        paddingBottom: 50,
        paddingHorizontal: 24,
    },
    
    // 상단 설정 아이콘
    settingsHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingVertical: 10,
        marginTop: 6,
        height: 44,
    },

    // 프로필 정보 영역
    profileArea: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: -15,
        marginBottom: 30,
    },
    profileImageContainer: {
        width: PROFILE_SIZE,
        height: PROFILE_SIZE,
        marginRight: 20,
    },
    profileImagePlaceholder: {
        width: PROFILE_SIZE,
        height: PROFILE_SIZE,
        borderRadius: PROFILE_SIZE / 2,
        backgroundColor: '#eee', // 회색 배경
    },
    editButton: {
        position: 'absolute',
        bottom: 0,
        right: -EDIT_BUTTON_OFFSET, // 프로필 오른쪽 모서리로 이동
        width: EDIT_BUTTON_SIZE,
        height: EDIT_BUTTON_SIZE,
        borderRadius: EDIT_BUTTON_SIZE / 2,
        backgroundColor: '#000', // 검은색 배경
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2, // 흰색 경계선 (선택 사항)
        borderColor: '#fff',
    },
    
    userInfo: {
        flex: 1,
        justifyContent: 'center',
        marginTop: 10,
    },
    nicknameText: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    followStats: {
        flexDirection: 'row',
        gap: 20,
    },
    statItem: {
        fontSize: 16,
        color: '#666',
    },

    // 친구 추가 버튼
    addFriendButton: {
        backgroundColor: '#000',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 30,
        width: '100%',
    },
    addFriendButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },

    // 정보/설정 목록
    infoSection: {
        borderTopWidth: 1,
        borderColor: '#eee',
    },
    infoItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderColor: '#eee',
    },
    infoItemText: {
        fontSize: 16,
        color: '#333',
    },
    // 첫 번째 항목의 상단 테두리를 제거 (infoSection의 borderTopWidth로 대체)
    infoItemFirst: {
        borderTopWidth: 0,
    },
    // 마지막 항목의 하단 테두리를 제거 (디자인에 따라 다름)
    infoItemLast: {
        borderBottomWidth: 0,
    }
});
