// types/userTypes.ts

export interface HealthItem {
    id: string;
    name: string;
}

export interface HealthOptions {
    health_condition: HealthItem[]; 
    allergy: HealthItem[];          
}

export interface UserHealthPayload {
    health_conditions: string[]; 
    allergies: string[];        
}

export interface UserProfile {
    id: number;
    nickname: string;
    email: string;
    followers: number;
    following: number;
    profileImageUrl: string | null;
    phoneNumber: string | null;
    birthday: string | null;
}
