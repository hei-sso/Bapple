// types/friendTypes.ts

export type FriendTab = 'following' | 'follower';

export interface Friend {
    id: string;
    nickname: string;
    uniqueId: string;
    profileImageUri: string | null;
}

export interface FriendsData {
    followingList: Friend[];
    followerList: Friend[];
    myUniqueId: string | null; // null이면 DB 연결 오류
    isLoading: boolean;
}
