// app/mypage/profile.tsx

import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// API
import { updateUserProfile } from '@/api/userAPI';

// Style
import { Header } from '@/components/header'; // 헤더
import { Styles } from '@/constants/styles'; // 공통

// Context
import { useAuth } from '@/context/authContext';

const PROFILE_IMAGE_SIZE = 120;

// 전화번호 자동 하이픈 포맷 함수
const formatPhoneNumber = (text: string): string => {
    // 숫자만 추출
    const cleaned = ('' + text).replace(/\D/g, ''); 
    
    // 10~11자리 포맷 (XXX-XXXX-XXXX 또는 XXX-XXX-XXXX)
    let match = cleaned.match(/^(\d{3})(\d{4})(\d{4})$/);
    if (!match) {
        // 9자리 이하일 경우 중간에 하이픈 추가 (XXX-XXXX)
        match = cleaned.match(/^(\d{3})(\d{3,4})(\d{0,4})$/);
    }
    
    if (match) {
        // 전체 길이가 8자리 이상이면 포맷 적용
        if (cleaned.length >= 8) {
            return [match[1], match[2], match[3]].filter(Boolean).join('-');
        }
        // 길이가 짧으면 그냥 하이픈 없이 반환
        return [match[1], match[2]].filter(Boolean).join('-');
    }
    return cleaned;
};

// 생년월일 자동 슬래시 포맷 함수 (YYYY/MM/DD)
const formatBirthday = (text: string): string => {
    // 숫자만 추출
    const cleaned = ('' + text).replace(/\D/g, ''); 

    // YYYYMMDD 포맷
    const match = cleaned.match(/^(\d{4})(\d{2})(\d{2})$/);
    
    if (match) {
        return [match[1], match[2], match[3]].join('-');
    }
    
    // YYYY 또는 YYYYMM 입력 시 슬래시 미리보기
    if (cleaned.length > 4 && cleaned.length <= 6) {
        return cleaned.slice(0, 4) + '-' + cleaned.slice(4);
    }
    if (cleaned.length > 6 && cleaned.length <= 8) {
        return cleaned.slice(0, 4) + '-' + cleaned.slice(4, 6) + '-' + cleaned.slice(6);
    }

    return cleaned;
};

export default function ProfileScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // Context에서 사용자 정보 및 로딩 상태 가져오기
    const { userProfile: initialUser, isLoading: isAuthLoading } = useAuth();
    
    // 폼 상태
    const [nickname, setNickname] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [birthday, setBirthday] = useState('');

    // UI 상태
    const [isSaving, setIsSaving] = useState(false); // 저장 중 로딩 상태

    // 이메일 인증 플로우 상태 관리 (Mock data)
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [verificationCodeSent, setVerificationCodeSent] = useState(false);
    const [verificationCode, setVerificationCode] = useState(''); 

    // ⭐ 초기 데이터 로드 (Context에서 가져온 데이터를 폼 상태에 반영)
    useEffect(() => {
        if (initialUser) {
            // Context의 userProfile에서 데이터 로드
            setNickname(initialUser.nickname || '');

            // ★ 수정 1: 실제 이메일 데이터 연결 (하드코딩 'apple@imsi.com' 삭제)
            setEmail(initialUser.email || ''); 
            
            // 전화번호 연결
            setPhoneNumber(initialUser.phoneNumber || ''); 
            
            // ★ 수정 2: 생년월일 포맷팅 (YYYY-MM-DD 뒤에 붙은 시간 제거)
            const rawBirthday = initialUser.birthday || '';
            const cleanBirthday = rawBirthday.split('T')[0]; // "2004-10-18"만 남김
            setBirthday(cleanBirthday); 
            
            // 초기 이메일 인증 상태는 DB 값으로 설정되어야 하지만, 일단 false로 가정
            setIsEmailVerified(false);
        }
    }, [initialUser]);

    // 전화번호 입력 핸들러
    const handlePhoneChange = useCallback((text: string) => {
        const formatted = formatPhoneNumber(text);
        setPhoneNumber(formatted.slice(0, 13)); // 13자 (010-XXXX-XXXX)로 길이 제한
    }, []);

    // 생년월일 입력 핸들러
    const handleBirthdayChange = useCallback((text: string) => {
        const formatted = formatBirthday(text);
        setBirthday(formatted.slice(0, 10)); // 10자 (YYYY/MM/DD)로 길이 제한
    }, []);

    // ⭐ 프로필 변경 사항 저장 핸들러 (API 호출 통합)
    const handleSaveProfile = async () => {
        if (isSaving || isAuthLoading || !initialUser) return;
        
        if (!nickname) {
            Alert.alert("알림", "닉네임은 필수입니다.");
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                nickname,
                email, 
                phoneNumber,
                birthday
            };
            
            // ⭐ 서버로 업데이트 요청
            await updateUserProfile(payload);

            Alert.alert("저장 완료", "프로필 정보가 성공적으로 업데이트되었습니다.");
            // Context의 프로필 새로고침 로직이 필요하지만, 일단 화면만 뒤로 이동
            router.back(); 
        } catch (error) {
            console.error("❌ 프로필 저장 실패:", error);
            Alert.alert("저장 실패", error instanceof Error ? error.message : "프로필 저장 중 오류가 발생했습니다.");
        } finally {
            setIsSaving(false);
        }
    };

    // ⭐ 인증번호 발송 핸들러 (Mock Data)
    const handleSendVerificationCode = useCallback(async () => {
        if (!email) { Alert.alert("알림", "이메일을 입력해 주세요."); return; }
        
        setIsSaving(true);
        // Mock API 호출 흉내
        await new Promise(resolve => setTimeout(resolve, 1500)); 

        setVerificationCodeSent(true); 
        Alert.alert("알림", `${email}로 인증번호가 발송되었습니다. (Mock: 123456)`);
        setIsSaving(false);

    }, [email]);

    // ⭐ 인증번호 확인 핸들러 (Mock Data)
    const handleVerifyCode = useCallback(async () => {
        if (!verificationCode) { Alert.alert("알림", "인증번호를 입력해 주세요."); return; }
        
        setIsSaving(true);
        // Mock API 호출 흉내
        await new Promise(resolve => setTimeout(resolve, 1500)); 

        if (verificationCode === '123456') { 
            setIsEmailVerified(true);
            setVerificationCodeSent(false);
            Alert.alert("인증 완료", "이메일 인증이 성공적으로 완료되었습니다.");
        } else {
            Alert.alert("인증 실패", "인증번호가 일치하지 않습니다.");
        }
        setIsSaving(false);
    }, [verificationCode]);

    // 로딩 및 에러 상태 처리
    if (isAuthLoading) {
         return (
            <View style={[Styles.container, styles.centeredLoading, { paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color="#848484ff" />
                <Text style={styles.loadingText}>프로필 로드 중...</Text>
            </View>
        );
    }
    
    if (!initialUser) {
        return (
            <View style={[Styles.container, styles.centeredLoading, { paddingTop: insets.top }]}>
                <Text style={styles.errorText}>프로필 정보를 불러올 수 없습니다. 다시 로그인하거나 앱을 다시 시작해 주세요.</Text>
            </View>
        );
    }

    return (
        <View style={[Styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>

            {/* Header 영역 */}
            <View style={Header.HeaderAlign}>
                <TouchableOpacity onPress={() => router.back()} style={Header.BackButton} disabled={isSaving}>
                    <ChevronLeft size={28} color="#000" />
                </TouchableOpacity>
                <Text style={Header.Title}>프로필</Text>
                <TouchableOpacity onPress={handleSaveProfile} style={Header.SaveButton} disabled={isSaving}>
                    {isSaving ? (
                        <ActivityIndicator size="small" color="#d2d2d2ff" />
                    ) : (
                        <Text style={Header.SaveButtonText}>저장</Text>
                    )}
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView contentContainerStyle={Styles.scrollContent}>
                        
                    {/* 프로필 사진 영역 */}
                    <View style={styles.profileImageArea}>
                        <View style={styles.profileImagePlaceholder} />
                        <TouchableOpacity>
                            <Text style={styles.changePhotoButton}>사진 변경하기</Text>
                        </TouchableOpacity>
                    </View>

                    {/* 닉네임 */}
                    <Text style={styles.label}>닉네임</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Bapple"
                        placeholderTextColor={"#A9A9A9"}
                        value={nickname}
                        onChangeText={setNickname}
                        autoCapitalize="none"
                        editable={!isSaving}
                    />

                    {/* 이메일 입력 및 인증 버튼 컨테이너 */}
                    <Text style={styles.label}>이메일</Text>
                    <View style={localStyles.inputWithButtonContainer}>
                        <TextInput
                            style={[styles.input, localStyles.inputField]}
                            placeholder="Bapple@example.com"
                            placeholderTextColor={"#A9A9A9"}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            editable={!isEmailVerified && !isSaving} // 인증 완료 시 수정 불가
                        />
                        <TouchableOpacity 
                            style={[localStyles.verificationButton, isEmailVerified ? localStyles.verifiedButton : localStyles.unverifiedButton]}
                            onPress={handleSendVerificationCode}
                            disabled={isEmailVerified || isSaving}
                        >
                            <Text style={localStyles.verificationButtonText}>{isEmailVerified ? '인증 완료' : '인증'}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* 인증번호 입력 필드 (발송 후에만 표시) */}
                    {verificationCodeSent && !isEmailVerified && (
                    <View style={localStyles.verificationInputGroup}>
                        <Text style={styles.label}>인증번호</Text>
                        <View style={localStyles.inputWithButtonContainer}>
                            <TextInput
                                style={[styles.input, localStyles.inputField]}
                                placeholder="인증번호 6자리 입력"
                                placeholderTextColor={"#A9A9A9"}
                                value={verificationCode}
                                onChangeText={setVerificationCode}
                                keyboardType="numeric"
                                editable={!isSaving}
                            />
                            <TouchableOpacity 
                                style={[localStyles.verificationButton, localStyles.unverifiedButton]} 
                                onPress={handleVerifyCode}
                                disabled={isSaving}
                            >
                                <Text style={localStyles.verificationButtonText}>확인</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    )}

                    {/* 전화번호 */}
                    <Text style={styles.label}>전화번호</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="010-1234-5678"
                        placeholderTextColor={"#A9A9A9"}
                        value={phoneNumber}
                        onChangeText={handlePhoneChange}
                        keyboardType="phone-pad"
                        editable={!isSaving}
                        maxLength={13}
                    />

                    {/* 생년월일 */}
                    <Text style={styles.label}>생년월일</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="YYYY/MM/DD"
                        placeholderTextColor={"#A9A9A9"}
                        value={birthday}
                        onChangeText={handleBirthdayChange}
                        keyboardType="phone-pad"
                        editable={!isSaving}
                        maxLength={10}
                    />
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

// 🎨 스타일 시트
const styles = StyleSheet.create({
    centeredLoading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666'
    },
    errorText: {
        fontSize: 16,
        color: '#D32F2F',
        textAlign: 'center'
    },
    profileImageArea: {
        alignItems: 'center',
        paddingVertical: 30,
        borderBottomWidth: 1,
        borderColor: '#eee',
        marginBottom: 20
    },
    profileImagePlaceholder: {
        width: PROFILE_IMAGE_SIZE,
        height: PROFILE_IMAGE_SIZE,
        borderRadius: PROFILE_IMAGE_SIZE / 2,
        backgroundColor: '#eee', 
        marginBottom: 10
    },
    changePhotoButton: {
        fontSize: 14,
        color: '#000',
        textDecorationLine: 'underline'
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 15,
        marginBottom: 5,
        color: '#333'
    },
    input: {
        width: '100%',
        height: 50,
        paddingHorizontal: 15,
        borderColor: '#e0e0e0',
        borderWidth: 1,
        borderRadius: 8,
        fontSize: 16,
        marginBottom: 10 // 여백 추가
    },
    primaryButton: { 
        width: '100%',
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000',
        marginTop: 20
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff'
    }
});

const localStyles = StyleSheet.create({
    verificationInputGroup: {
        marginTop: -5, 
        marginBottom: 5
    },
    inputWithButtonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginBottom: 10
    },
    inputField: {
        flex: 1, 
        marginRight: 10
    },
    verificationButton: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 8,
        height: 50, 
        justifyContent: 'center',
        alignItems: 'center'
    },
    unverifiedButton: {
        backgroundColor: '#000'
    },
    verifiedButton: {
        backgroundColor: '#ccc'
    },
    verificationButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold'
    }
});
