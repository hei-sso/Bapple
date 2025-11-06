// app/(auth)/set-password.tsx

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity,
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  StyleSheet,
  Alert
} from 'react-native';
import { useRouter, RedirectProps } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authStyles } from './styles'; // 공통 스타일 임포트

export default function SetPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // 인증 및 새 비밀번호 상태 관리
  const [email, setEmail] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verificationCodeSent, setVerificationCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState(''); 
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleGoBack = () => {
    router.back(); 
  };

  // 인증번호 발송 핸들러 (register.tsx와 동일)
  const handleSendVerificationCode = async () => {
    if (!email) {
        Alert.alert("알림", "이메일을 입력해 주세요.");
        return;
    }

    // ===============================================
    // [백엔드 연동 필요] 이메일 인증번호 발송 로직
    // (비밀번호 재설정용 토큰/세션 발급 로직 포함)
    // ===============================================
    
    setVerificationCodeSent(true); 
    Alert.alert("알림", `${email}로 인증번호가 발송되었습니다.`);
  };
  
  // 인증번호 확인 핸들러 (register.tsx와 동일)
  const handleVerifyCode = async () => {
    if (!verificationCode) {
        Alert.alert("알림", "인증번호를 입력해 주세요.");
        return;
    }
    
    // =========================================================
    // [백엔드 연동 필요] 인증번호 확인 로직
    // (서버에서 인증번호 일치 확인 및 비밀번호 변경 권한 부여)
    // =========================================================
    
    // 서버로부터 인증 성공 응답 가정
    setIsEmailVerified(true);
    setVerificationCodeSent(false);
    Alert.alert("인증 완료", "이메일 인증이 성공적으로 완료되었습니다. 이제 새 비밀번호를 설정할 수 있습니다.");
  };

  const handleChangePassword = async () => {
    // 이메일 인증 필수 체크
    if (!isEmailVerified) {
        Alert.alert("경고", "이메일 인증을 먼저 완료해 주세요.");
        return;
    }
    
    if (newPassword !== confirmPassword) {
      Alert.alert("오류", "새 비밀번호가 일치하지 않습니다.");
      return;
    }
    
    // ===================================================
    // [백엔드 연동 필요] 비밀번호 변경 API 호출
    // (새 비밀번호, 인증 토큰/세션 ID 등을 서버로 전송)
    // ===================================================

    Alert.alert("성공", "비밀번호가 성공적으로 변경되었습니다.");
    router.replace('/(auth)/login' as RedirectProps['href']);
  };

  return (
    <KeyboardAvoidingView
      style={[authStyles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={authStyles.scrollContent}>
        
        {/* 헤더 */}
        <View style={authStyles.header}>
          <TouchableOpacity onPress={handleGoBack} style={authStyles.backButtonContainer}>
             <Text style={authStyles.backButton}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={authStyles.title}>비밀번호 재설정</Text>
        </View>

        <View style={authStyles.form}>
          {/* 이메일 입력 및 인증 버튼 */}
          <Text style={authStyles.label}>이메일</Text>
          <View style={localStyles.inputWithButtonContainer}>
            <TextInput
              style={[authStyles.input, localStyles.inputField]}
              placeholder="bapple@bapple.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isEmailVerified} // 인증 완료 시 수정 불가
              placeholderTextColor="#A9A9A9"
            />
            <TouchableOpacity 
              style={[localStyles.verificationButton, isEmailVerified ? localStyles.verifiedButton : localStyles.unverifiedButton]}
              onPress={handleSendVerificationCode}
              disabled={isEmailVerified}
            >
              <Text style={localStyles.verificationButtonText}>{isEmailVerified ? '인증 완료' : '인증'}</Text>
            </TouchableOpacity>
          </View>
          
          {/* 인증번호 입력 필드 */}
          {verificationCodeSent && !isEmailVerified && (
            <View style={localStyles.verificationInputGroup}>
              <Text style={authStyles.label}>인증번호</Text>
              <View style={localStyles.inputWithButtonContainer}>
                <TextInput
                  style={[authStyles.input, localStyles.inputField]}
                  placeholder="인증번호 6자리 입력"
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  keyboardType="numeric"
                  placeholderTextColor="#A9A9A9"
                />
                <TouchableOpacity 
                  style={[localStyles.verificationButton, localStyles.unverifiedButton]} 
                  onPress={handleVerifyCode}
                >
                  <Text style={localStyles.verificationButtonText}>확인</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <Text style={authStyles.label}>새 비밀번호</Text>
          <TextInput
            style={authStyles.input}
            placeholder="***********"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            editable={isEmailVerified} // 인증 완료 후에만 활성화
            placeholderTextColor="#A9A9A9"
          />
          <Text style={authStyles.label}>새 비밀번호 확인</Text>
          <TextInput
            style={authStyles.input}
            placeholder="***********"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={isEmailVerified} // 인증 완료 후에만 활성화
            placeholderTextColor="#A9A9A9"
          />
        </View>
        
        {/* 비밀번호 변경 버튼 */}
        <TouchableOpacity 
            style={[localStyles.changePasswordButton, !isEmailVerified && localStyles.disabledButton]} 
            onPress={handleChangePassword}
            disabled={!isEmailVerified} // 인증 완료 후에만 활성화
        >
          <Text style={localStyles.changePasswordButtonText}>비밀번호 변경</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// 💡스타일 시트💡
const localStyles = StyleSheet.create({
    // 인증 필드 관련 스타일 (register.tsx랑 같음)
    verificationInputGroup: {
        marginTop: -5, 
        marginBottom: 5,
    },
    inputWithButtonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginBottom: 10, 
    },
    inputField: {
        flex: 1, 
        marginRight: 10, 
    },
    verificationButton: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 8,
        height: 50, 
        justifyContent: 'center',
        alignItems: 'center',
    },
    unverifiedButton: {
        backgroundColor: '#000',
    },
    verifiedButton: {
        backgroundColor: '#ccc',
    },
    verificationButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },

    // 비활성화 버튼 스타일
    disabledButton: {
        backgroundColor: '#ccc',
    },

    // 비밀번호 변경 버튼 (기존 스타일)
    changePasswordButton: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000', 
        marginTop: 30,
    },
    changePasswordButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
});
