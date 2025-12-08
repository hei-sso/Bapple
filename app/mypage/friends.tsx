// app/mypage/friends.tsx

import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { ChevronLeft, Search } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator, // 로딩 상태 표시
    Alert,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Context
import { useFriendsData } from '@/context/friendContext';

// Type
import { Friend, FriendTab } from '@/types/friendTypes';

// Style
import { Header } from '@/components/header'; // 헤더
import { Styles } from '@/constants/styles'; // 공통

interface FriendItemProps {
    friend: Friend;
    isFollowing: boolean;
    onToggleFollow: (id: string, isFollowing: boolean) => void;
}

const FriendListItem: React.FC<FriendItemProps> = ({ friend, isFollowing, onToggleFollow }) => (
    <View style={styles.friendItem}>
        {/* 프로필 이미지 */}
        <View style={styles.profileImageContainer}>
            {friend.profileImageUri ? (
                <Image source={{ uri: friend.profileImageUri }} style={styles.profileImage} />
            ) : (
                // 이미지 없을 시 플레이스홀더
                <View style={[styles.profileImage, styles.imagePlaceholder]}>
                    <Text style={styles.placeholderText}>{friend.nickname.substring(0, 1)}</Text>
                </View>
            )}
        </View>
        
        {/* 닉네임 및 ID */}
        <View style={styles.friendInfo}>
            <Text style={styles.friendNickname}>{friend.nickname}</Text>
            <Text style={styles.friendUniqueId}>@{friend.uniqueId}</Text>
        </View>

        {/* 버튼 */}
        <TouchableOpacity 
            style={[styles.followButton, isFollowing ? styles.unfollowButton : styles.followButtonActive]}
            onPress={() => {
                Alert.alert(
                    isFollowing ? "팔로우 취소" : "팔로우",
                    `${friend.nickname}님을 ${isFollowing ? '취소' : '추가'}합니다.`,
                    [{ text: "확인", onPress: () => onToggleFollow(friend.id, isFollowing) }]
                );
            }}
        >
            <Text style={isFollowing ? styles.unfollowButtonText : styles.followButtonText}>
                {isFollowing ? '취소' : '팔로우'}
            </Text>
        </TouchableOpacity>
    </View>
);

// 메인 컴포넌트
export default function FriendsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState<FriendTab>('following');
    const [searchQuery, setSearchQuery] = useState('');
    
    // useFriendsData 훅을 사용하여 DB 연결된 데이터 및 로직 가져오기
    const { 
        data: { followingList, followerList, myUniqueId, isLoading }, 
        handleToggleFollow,
        refetchData
    } = useFriendsData();

    // 친구 검색 및 추가 로직
    const handleSearchAndAdd = useCallback(() => {
        if (!searchQuery) {
            Alert.alert("알림", "친구의 고유 ID를 입력해주세요.");
            return;
        }
        
        Alert.alert(
            "친구 찾기",
            `고유 ID "@${searchQuery}"를 가진 친구를 DB에서 검색하고 추가 요청을 보냅니다.`,
            [{ text: "확인" }]
        );
        setSearchQuery('');
    }, [searchQuery]);

    // 고유 ID 클립보드 복사 로직
    const handleCopyId = useCallback(() => {
        if (myUniqueId) {
            // 실제 클립보드 복사 로직 구현
            Alert.alert("복사 완료", `나의 고유 ID "${myUniqueId}"가 클립보드에 복사되었습니다.`, [{ text: "확인" }]);
        }
    }, [myUniqueId]);

    // 현재 탭에 맞는 목록 선택
    const data = activeTab === 'following' ? followingList : followerList;
    const renderItem = ({ item }: { item: Friend }) => {
        const isFollowingItem = activeTab === 'following'; 
        return (
            <FriendListItem 
                friend={item} 
                isFollowing={isFollowingItem} 
                onToggleFollow={handleToggleFollow} 
            />
        );
    };

    // ListEmptyComponent: 로딩 중이거나 목록이 비어있을 때
    const EmptyListMessage = () => {
        if (isLoading) {
            return (
                <View style={styles.emptyListContainer}>
                    <ActivityIndicator size="large" color="#000" />
                    <Text style={styles.emptyListText}>친구 데이터를 불러오는 중...</Text>
                </View>
            );
        }
        
        // 로딩이 끝났는데 데이터가 없는 경우
        return (
            <View style={styles.emptyListContainer}>
                <Text style={styles.emptyListText}>친구 목록이 비어 있습니다.</Text>
                {/* myUniqueId가 null인 경우 (DB 연결 오류)에는 재시도 버튼 유도 X */}
                {myUniqueId && (
                    <TouchableOpacity style={styles.refetchButton} onPress={refetchData}>
                        <Text style={styles.refetchButtonText}>목록 새로고침</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    // 나의 고유 ID 표시 텍스트 결정
    const displayUniqueId = myUniqueId 
        ? `@${myUniqueId}` 
        : isLoading ? '로딩 중...' : 'DB 연결 오류'; 

    return (
        <View style={[Styles.container, { paddingTop: insets.top }]}>
            <View style={Header.HeaderAlign}>
                <TouchableOpacity onPress={() => router.back()} style={Header.BackButton}>
                    <ChevronLeft size={28} color="#000" />
                </TouchableOpacity>
                <Text style={Header.Title}>친구</Text>
            </View>
            
            <View>
                {/* 검색/추가 영역 */}
                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="친구의 고유 ID를 입력하여 검색/추가"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCapitalize="none"
                        placeholderTextColor="#999"
                    />
                    <TouchableOpacity style={styles.searchButton} onPress={handleSearchAndAdd}>
                        <Search size={22} color="#000" />
                    </TouchableOpacity>
                </View>
                
                {/* 나의 고유 ID 표시 및 복사 버튼 */}
                <TouchableOpacity 
                    // DB 연결 오류 또는 로딩 중일 때 스타일 변경
                    style={[styles.myIdContainer, (!myUniqueId && !isLoading) && styles.myIdErrorContainer]} 
                    onPress={handleCopyId}
                    disabled={!myUniqueId} 
                >
                    <Text style={[styles.myIdLabel, (!myUniqueId && !isLoading) && styles.myIdErrorLabel]}>나의 고유 ID:</Text>
                    <Text style={[styles.myIdText, (!myUniqueId && !isLoading) && styles.myIdErrorText]}>{displayUniqueId}</Text>
                    {/* myUniqueId가 있을 때만 복사 아이콘 표시 */}
                    {myUniqueId && <FontAwesome name="copy" size={16} color="#856404" style={styles.copyIcon} />}
                </TouchableOpacity>

                {/* 탭 네비게이션 */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity 
                        style={[styles.tabButton, activeTab === 'following' && styles.activeTabButton]}
                        onPress={() => setActiveTab('following')}
                    >
                        <Text style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}>
                            팔로잉 ({followingList.length})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.tabButton, activeTab === 'follower' && styles.activeTabButton]}
                        onPress={() => setActiveTab('follower')}
                    >
                        <Text style={[styles.tabText, activeTab === 'follower' && styles.activeTabText]}>
                            팔로워 ({followerList.length})
                        </Text>
                    </TouchableOpacity>
                </View>
                
                {/* 친구 목록 */}
                <FlatList
                    data={data}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    ListEmptyComponent={EmptyListMessage} 
                    contentContainerStyle={styles.listContentContainer}
                />
            </View>
        </View>
    );
}

// 🎨 스타일 시트
const IMAGE_SIZE = 50;

const styles = StyleSheet.create({
    // 검색 영역
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 25, 
        paddingLeft: 15,
        marginBottom: 15,
        marginTop: 15,
        height: 50,
        borderWidth: 1, 
        borderColor: '#ccc'
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        height: '100%'
    },
    searchButton: {
        padding: 10,
        marginRight: 5,
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%'
    },

    // 나의 고유 ID
    myIdContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff3cd', 
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#ffeeba'
    },
    myIdErrorContainer: {
        backgroundColor: '#f8d7da', 
        borderColor: '#f5c6cb'
    },
    myIdLabel: {
        fontSize: 14,
        color: '#856404', 
        fontWeight: '500',
        marginRight: 5
    },
    myIdErrorLabel: {
        color: '#721c24'
    },
    myIdText: {
        fontSize: 14,
        color: '#856404', 
        fontWeight: 'bold',
        flexShrink: 1
    },
    myIdErrorText: {
        color: '#721c24'
    },
    copyIcon: {
        marginLeft: 'auto', 
        paddingLeft: 10
    },

    // 탭 네비게이션
    tabContainer: {
        flexDirection: 'row',
        marginBottom: 10,
        backgroundColor: '#f0f0f0', 
        borderRadius: 10,
        padding: 4
    },
    tabButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
        backgroundColor: 'transparent'
    },
    activeTabButton: {
        backgroundColor: '#fff'
    },
    tabText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500'
    },
    activeTabText: {
        color: '#000',
        fontWeight: 'bold'
    },

    // 친구 목록 아이템
    listContentContainer: {
        paddingBottom: 40
    },
    friendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderColor: '#f9f9f9'
    },
    profileImageContainer: {
        marginRight: 15
    },
    profileImage: {
        width: IMAGE_SIZE,
        height: IMAGE_SIZE,
        borderRadius: IMAGE_SIZE / 2
    },
    imagePlaceholder: {
        backgroundColor: '#ccc',
        justifyContent: 'center',
        alignItems: 'center'
    },
    placeholderText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff'
    },
    friendInfo: {
        flex: 1
    },
    friendNickname: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333'
    },
    friendUniqueId: {
        fontSize: 14,
        color: '#999',
        marginTop: 2
    },
    followButton: {
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#000',
        backgroundColor: '#fff'
    },
    followButtonActive: { 
        backgroundColor: '#000',
        borderColor: '#000'
    },
    followButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff'
    },
    unfollowButton: { 
        backgroundColor: '#fff',
        borderColor: '#ccc'
    },
    unfollowButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#000'
    },

    // Empty List Message Styles
    emptyListContainer: {
        alignItems: 'center',
        marginTop: 50,
        paddingHorizontal: 20
    },
    emptyListText: {
        textAlign: 'center',
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 5
    },
    emptyListSubText: {
        textAlign: 'center',
        color: '#999',
        marginTop: 5,
        fontSize: 14
    },
    refetchButton: {
        marginTop: 20,
        backgroundColor: '#000',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 8
    },
    refetchButtonText: {
        color: '#fff',
        fontWeight: 'bold'
    }
});
