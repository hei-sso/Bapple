// types/userTypes.ts

// 질병 및 알레르기 항목 개별 정의
export interface HealthItem {
    id: number;
    name: string;
}

// 전체 목록 조회 응답 (GET /health/options 가정)
export interface HealthOptions {
    health_condition: HealthItem[]; // 모든 질병 목록
    allergy: HealthItem[];          // 모든 알레르기 목록
}

// 사용자 프로필 조회/저장 시 건강 정보 필드
export interface UserHealthPayload {
    health_conditions: number[]; // 사용자가 선택한 질병 ID 목록 (health_condition_id 리스트)
    allergies: number[];         // 사용자가 선택한 알레르기 ID 목록 (allergy_id 리스트)
}
