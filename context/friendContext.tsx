// context/friendContext.ts

import { useState, useEffect, useCallback } from 'react';

//API
import { fetchFriendsListAndUserId, updateFollowStatusAPI } from '@/api/friendAPI';

// Type
import { Friend, FriendsData } from '@/types/friendTypes';

const EMPTY_LIST: Friend[] = []; 
const INITIAL_STATE: FriendsData = {
    followingList: EMPTY_LIST,
    followerList: EMPTY_LIST,
    myUniqueId: null,
    isLoading: true,
};

// 친구 목록 및 사용자 ID를 관리하는 커스텀 훅
export const useFriendsData = (): {
    data: FriendsData;
    handleToggleFollow: (id: string, currentlyFollowing: boolean) => void;
    refetchData: () => void;
} => {
    const [data, setData] = useState<FriendsData>(INITIAL_STATE);

    // 친구 목록 데이터를 불러와 상태를 업데이트하는 핵심 함수
    const fetchData = useCallback(async () => {
        setData(prev => ({ ...prev, isLoading: true }));
        
        const result = await fetchFriendsListAndUserId(); 

        setData({
            followingList: result.following,
            followerList: result.follower,
            myUniqueId: result.myUniqueId, 
            isLoading: false,
        });
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const refetchData = useCallback(() => {
        fetchData();
    }, [fetchData]);

    // 팔로우/팔로우 취소 로직 (DB 연동 및 데이터 리프레시)
    const handleToggleFollow = useCallback(async (id: string, currentlyFollowing: boolean) => {
        const action = currentlyFollowing ? 'UNFOLLOW' : 'FOLLOW';
        
        try {
            await updateFollowStatusAPI(id, action);
            refetchData();
        } catch (error) {
            // API에서 던진 에러 메시지 그대로 사용
            alert(`[오류] ${error instanceof Error ? error.message : '네트워크 오류가 발생했습니다.'}`);
        }
    }, [refetchData]);

    return { data, handleToggleFollow, refetchData };
};
