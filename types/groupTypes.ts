// types/groupTypes.ts

// 그룹 기본 정보 타입
export interface Group {
    id: string; // DB ID
    name: string;
    description: string; // 한 줄 소개
    ownerId: string; // 방장 ID
    inviteCode: string; // 초대 코드
    settings: {
        isFridgeShared: 'all' | 'owner_only'; // 냉장고 공유 설정
    };
    memberCount: number;
    maxMembers: number;
    isPinned: boolean;
    imageUri: string | 'NULL';
    createdAt: string;
}

// 그룹 Context 타입
export interface GroupContextType {
    myGroups: Group[]; // 사용자가 속한 모든 그룹 목록
    groupSchedules: Record<string, RecipeSchedule[]>; // {weekStartString: RecipeSchedule[]}
    isLoading: boolean;
    isError: boolean;
    
    // CRUD 및 기능 함수
    createGroup: (data: GroupCreationData) => Promise<void>;
    joinGroup: (inviteCode: string) => Promise<void>;
    togglePin: (groupId: string) => Promise<void>; // DB 업데이트 포함
    fetchMyGroups: () => Promise<void>; // 데이터 새로고침
    fetchSchedulesForWeek: (weekStartString: string) => Promise<void>; // 주간 스케줄 로드
    
    scheduleRecipe: (data: { 
        recipeId: string; 
        date: string; 
        groupId: string | 'personal'; 
    }) => Promise<void>; // 식단 메뉴 추가
    removeRecipeFromSchedule: (scheduleId: string, date: string, groupId: string) => Promise<void>; // 식단 메뉴 삭제

    refreshGroups: () => void;
}

// 그룹 생성에 필요한 데이터 타입
export interface GroupCreationData {
    name: string;
    description: string;
    isFridgeShared: 'all' | 'owner_only';
}

// 그룹 상세 (달력) 관련 타입
export interface GroupRecipeItem {
    id: string; // 스케줄 ID (PK)
    recipeId: string; // 실제 레시피 ID (FK)
    recipeName: string; // 레시피 이름
    groupId: string | null; // 등록된 그룹 ID (null이면 개인 식단)
    memberId: string; // 등록한 멤버 ID (스케줄 관리 용)
    // AI 추천 레시피와 통합하기 위한 필드
    rating: number; // 별점 (1~5)
    cookTimeMinutes: number; // 조리 시간 (분)
}

// 레시피 스케줄
export interface RecipeSchedule {
    date: string; // 'yyyy-MM-dd'
    recipes: GroupRecipeItem[];
}
