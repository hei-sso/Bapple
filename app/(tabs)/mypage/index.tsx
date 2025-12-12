// app/(tabs)/mypage/index.tsx

import FontAwesome from '@expo/vector-icons/FontAwesome';
import { RedirectProps, useRouter } from 'expo-router';
import { ChevronRight, RefreshCw } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// API


// Style
import { Styles } from '@/constants/styles'; // 공통

// Context
import { useAuth } from '@/context/authContext';
import { useFriendsData } from '@/context/friendContext';

// Type
import { Friend, FriendTab } from '@/types/friendTypes';

// 하단 설정/정보 메뉴 목록
const INFO_MENUS = [
    { label: "건강 정보", path: "/mypage/health" },
    { label: "냉장고 공개 범위", path: "/mypage/fridge-setting" },
];

// 메인 컴포넌트
export default function MyPageScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    
    // useAuth 훅을 사용하여 인증 및 프로필 데이터 가져오기
    const { isAuthenticated, isLoading: isAuthLoading, userProfile: user, accessToken } = useAuth();

    // 친구 데이터 및 상태 가져오기
    const { data: friendsData, refetchData } = useFriendsData();
    const { followingList, followerList, myUniqueId, isLoading: isFriendsLoading } = friendsData;

    // 현재 화면의 로딩 상태 (API 실패 후 재시도를 위해 사용 가능)
    const [isDataLoading, setIsDataLoading] = useState(false);
    
    // 인증되지 않은 경우 (토큰이 없거나 만료된 경우) 로그인 화면으로 리디렉션
    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated) {
            router.replace('/welcome' as RedirectProps['href']);
        }
    }, [isAuthenticated, isAuthLoading, router]);

    // 설정 페이지
    const handleSetting = useCallback(() => {
        router.push('/mypage/setting' as RedirectProps['href']);
    }, [router]);

    // 프로필 수정 버튼
    const handleEditProfile = useCallback(() => {
        router.push('/mypage/profile' as RedirectProps['href']);
    }, [router]);

    // 친구 추가 버튼: friends.tsx 화면으로 라우팅 연결
    const handleAddFriend = useCallback(() => {
        router.push('/mypage/friends' as RedirectProps['href']);
    }, [router]);

    // 건강 정보/냉장고 공개 범위 설정
    const handleNavigation = useCallback((path: string) => {
        router.push(path as RedirectProps['href']);
    }, [router]);

    // 프로필 로드 실패 시 재시도 로직 (userProfile이 null인 경우)
    const handleRefresh = useCallback(() => {
        if (accessToken) {
            console.log("프로필 로드 재시도 필요: Context의 프로필 로직 재실행 필요");
            // 강제 리로드 또는 Context의 refresh 함수 호출을 가정
            setIsDataLoading(true);
            // ⭐ 나중에 여기서 Context의 refreshProfile()을 호출하고 setIsDataLoading(false)로 마무리
            setTimeout(() => {
                setIsDataLoading(false); // 임시 로딩 해제
            }, 1000); 
        }
    }, [accessToken]);

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

    // 1. 초기 인증 로딩 중 (가장 먼저 체크)
    if (isAuthLoading) {
        return (
            <View style={[Styles.indexContainer, styles.centeredLoading, { paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color="#848484ff" />
                <Text style={styles.loadingText}>인증 정보 확인 중...</Text>
            </View>
        );
    }

    // 2. 인증은 되었으나, 프로필 로드 실패
    if (isAuthenticated && !user) {
        return (
            <View style={[Styles.indexContainer, styles.centeredLoading, { paddingTop: insets.top }]}>
                <Text style={styles.errorTitle}>앗! 프로필을 불러오지 못했습니다.</Text>
                <Text style={styles.errorText}>서버 내부 오류(500)가 발생했거나 네트워크 연결에 문제가 있을 수 있습니다.</Text>
                <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh} disabled={isDataLoading}>
                    {isDataLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <>
                            <RefreshCw size={18} color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.refreshButtonText}>다시 시도</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        );
    }
    
    // 3. 프로필 로드가 완료된 정상 상태
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
                    
                    <View style={styles.profileImageContainer}>
                        {/* 프로필 이미지: URL이 있으면 Image 컴포넌트 사용, 없으면 플레이스홀더 */}
                        {user!.profileImageUrl ? (
                             <Image 
                                source={{ uri: user!.profileImageUrl }} 
                                style={styles.profileImage} 
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={styles.profileImagePlaceholder} />
                        )}
                        
                        {/* 수정 버튼 */}
                        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
                            <FontAwesome name="pencil" size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* 닉네임, 팔로워/팔로잉 */}
                    <View style={styles.userInfo}>
                        <Text style={styles.nicknameText}>{user!.nickname}</Text>
                        
                        <View style={styles.followStats}>
                            <Text style={styles.statItem}>{followerList.length ?? 0} 팔로워</Text>
                            <Text style={styles.statItem}>{followingList.length ?? 0} 팔로잉</Text>
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

// 🎨 스타일 시트
const PROFILE_SIZE = 90;
const EDIT_BUTTON_SIZE = 35;
const EDIT_BUTTON_OFFSET = 5;

const styles = StyleSheet.create({
    scrollContent: {
        paddingTop: 0,
        paddingBottom: 50,
        paddingHorizontal: 24
    },
    
    // 중앙 로딩/에러 상태용 스타일 추가
    centeredLoading: {
        justifyContent: 'center',
        alignItems: 'center'
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666'
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#D32F2F'
    },
    errorText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        marginBottom: 20,
        paddingHorizontal: 30
    },
    refreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#000',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8
    },
    refreshButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold'
    },
    settingsHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingVertical: 10,
        marginTop: 6,
        height: 44
    },
    profileArea: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: -15,
        marginBottom: 30
    },
    profileImageContainer: {
        width: PROFILE_SIZE,
        height: PROFILE_SIZE,
        marginRight: 20
    },

    // Image 컴포넌트용 스타일
    profileImage: {
        width: PROFILE_SIZE,
        height: PROFILE_SIZE,
        borderRadius: PROFILE_SIZE / 2
    },
    profileImagePlaceholder: {
        width: PROFILE_SIZE,
        height: PROFILE_SIZE,
        borderRadius: PROFILE_SIZE / 2,
        backgroundColor: '#eee' // 회색 배경
    },
    editButton: {
        position: 'absolute',
        bottom: 0,
        right: -EDIT_BUTTON_OFFSET, 
        width: EDIT_BUTTON_SIZE,
        height: EDIT_BUTTON_SIZE,
        borderRadius: EDIT_BUTTON_SIZE / 2,
        backgroundColor: '#000', 
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2, 
        borderColor: '#fff'
    },
    userInfo: {
        flex: 1,
        justifyContent: 'center',
        marginTop: 10
    },
    nicknameText: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 10
    },
    followStats: {
        flexDirection: 'row',
        gap: 20
    },
    statItem: {
        fontSize: 16,
        color: '#666'
    },
    addFriendButton: {
        backgroundColor: '#000',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 30,
        width: '100%'
    },
    addFriendButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold'
    },
    infoSection: {
        borderTopWidth: 1,
        borderColor: '#eee'
    },
    infoItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderColor: '#eee'
    },
    infoItemText: {
        fontSize: 16,
        color: '#333'
    },
    infoItemFirst: {
        borderTopWidth: 0
    },
    infoItemLast: {
        borderBottomWidth: 0
    }
});
