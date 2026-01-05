// app/(auth)/register.tsx

import FontAwesome from '@expo/vector-icons/FontAwesome';
import { RedirectProps, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { ChevronLeft } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator // 로딩 표시를 위해 추가
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Style
import { authStyles } from '@/components/authStyles'; // Auth
import { Header } from '@/components/header'; // 헤더
import { KakaoLogin } from '@/components/kakao-login-btn'; // Kakao 로그인 버튼
import { Styles } from '@/constants/styles'; // 공통

// API
import { sendVerificationEmail, verifyEmailCode, registerUser } from '@/api/authAPI';

WebBrowser.maybeCompleteAuthSession(); 

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // 폼 상태 관리
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [birthdate, setBirthdate] = useState(''); 
  
  // 이메일 인증 플로우 상태 관리
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verificationCodeSent, setVerificationCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState(''); 
  const [isLoading, setIsLoading] = useState(false);

  const handleGoBack = () => {
    router.back(); 
  };
  
  // 1. 인증번호 발송 핸들러
  const handleSendVerificationCode = async () => {
    if (!email) { Alert.alert("알림", "이메일을 입력해 주세요."); return; }
    
    setIsLoading(true); // 로딩 시작
    try {
      // API 호출
      await sendVerificationEmail(email);
      
      setVerificationCodeSent(true); 
      Alert.alert("알림", `${email}로 인증번호가 발송되었습니다.`);
    } catch (error: any) {
      console.error(error);
      Alert.alert("오류", error.message || "인증번호 발송에 실패했습니다.");
    } finally {
      setIsLoading(false); // 로딩 끝
    }
  };
  
  // 2. 인증번호 확인 핸들러
  const handleVerifyCode = async () => {
    if (!verificationCode) { Alert.alert("알림", "인증번호를 입력해 주세요."); return; }
    
    setIsLoading(true);
    try {
      // API 호출
      await verifyEmailCode(email, verificationCode);

      setIsEmailVerified(true);
      setVerificationCodeSent(false);
      Alert.alert("인증 완료", "이메일 인증이 성공적으로 완료되었습니다.");
    } catch (error: any) {
      console.error(error);
      Alert.alert("인증 실패", error.message || "인증번호가 일치하지 않습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. 회원가입 핸들러
  const handleRegister = async () => {
    // 클라이언트 측 유효성 검사
    if (password.length < 6) {
      Alert.alert("알림", "비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    
    if (!isEmailVerified) {
       Alert.alert("경고", "이메일 인증을 완료해야 합니다.");
       return;
    }

    setIsLoading(true);
    try {
      // 서버로 보낼 데이터 구성
      const userData = {
        nickname,
        email,
        password,
        phoneNumber,
        birthdate,
      };

      // API 호출
      await registerUser(userData);

      Alert.alert("성공", "회원가입이 완료되었습니다. 로그인해주세요.");
      router.replace('/(auth)/login' as RedirectProps['href']); 
      
    } catch (error: any) {
      console.error(error);
      Alert.alert("가입 실패", error.message || "회원가입 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 약관/정책 모달 띄우기 핸들러
  const handlePolicyLink = (type: 'privacy' | 'terms') => {
    if (type === 'privacy') {
      router.push('/(auth)/privacy-policy' as RedirectProps['href']);
    } else {
      router.push('/(auth)/terms-of-use' as RedirectProps['href']);
    }
  };

  // 카카오 로그인 버튼
  const handleKakaoLogin = async () => {
      router.push('/(auth)/kakao-webview' as RedirectProps['href']);
  };
  
  const handleLoginLink = () => {
    router.replace('/(auth)/login' as RedirectProps['href']);
  };

  return (
    <View style={[Styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
        
      <View style={Header.HeaderAlign}>
        <TouchableOpacity onPress={handleGoBack} style={Header.BackButton}>
            <ChevronLeft size={28} color="#000" />
        </TouchableOpacity>
        <Text style={Header.Title}>회원가입</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={Styles.scrollContent}>
          
          <Text style={authStyles.label}>닉네임</Text>
            <TextInput
              style={authStyles.input}
              placeholder="Bapple"
              placeholderTextColor="#A9A9A9"
              value={nickname}
              onChangeText={setNickname}
              autoCapitalize="none"
            />

          <Text style={authStyles.label}>이메일</Text>
          {/* 이메일 입력 및 인증 버튼 컨테이너 */}
          <View style={localStyles.inputWithButtonContainer}>
            <TextInput
              style={[authStyles.input, localStyles.inputField]}
              placeholder="Bapple@example.com"
              placeholderTextColor="#A9A9A9"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              // 인증 완료 혹은 로딩 중이면 수정 불가
              editable={!isEmailVerified && !isLoading} 
            />
            <TouchableOpacity 
              style={[
                localStyles.verificationButton, 
                isEmailVerified ? localStyles.verifiedButton : localStyles.unverifiedButton,
                isLoading && { opacity: 0.7 } // 로딩 중 흐리게 처리
              ]}
              onPress={handleSendVerificationCode}
              disabled={isEmailVerified || isLoading}
            >
              {/* 로딩 중이면 스피너, 아니면 텍스트 표시 */}
              {isLoading && !verificationCodeSent ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={localStyles.verificationButtonText}>
                    {isEmailVerified ? '인증 완료' : '인증'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
          
          {/* 인증번호 입력 필드 (발송 후에만 표시) */}
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
                    disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={localStyles.verificationButtonText}>확인</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          <Text style={authStyles.label}>비밀번호</Text>
          <TextInput
            style={authStyles.input}
            placeholder="**********"
            placeholderTextColor="#A9A9A9"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          <Text style={authStyles.label}>전화번호</Text>
          <TextInput
            style={authStyles.input}
            placeholder="010-1234-5678"
            placeholderTextColor="#A9A9A9"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />

          <Text style={authStyles.label}>생년월일</Text>
          <TextInput
            style={authStyles.input}
            placeholder="YYYY/MM/DD"
            placeholderTextColor="#A9A9A9"
            value={birthdate}
            onChangeText={setBirthdate}
            keyboardType="numbers-and-punctuation"
          />

          {/* 약관 동의 텍스트 */}
          <View style={localStyles.policyContainer}>
            <Text style={localStyles.policyText}>계속 진행하면 </Text>
            <TouchableOpacity onPress={() => handlePolicyLink('privacy')}>
              <Text style={localStyles.policyLinkText}>개인정보 처리방침</Text>
            </TouchableOpacity>
            <Text style={localStyles.policyText}>과 </Text>
            <TouchableOpacity onPress={() => handlePolicyLink('terms')}>
              <Text style={localStyles.policyLinkText}>이용약관</Text>
            </TouchableOpacity>
            <Text style={localStyles.policyText}>에 동의하는 것으로 간주됩니다.</Text>
          </View>

          {/* 회원가입 버튼 */}
          <TouchableOpacity 
            style={[authStyles.primaryButton, isLoading && { backgroundColor: '#888' }]} 
            onPress={handleRegister}
            disabled={isLoading}
          >
             {isLoading ? (
                <ActivityIndicator color="#fff" />
             ) : (
                <Text style={authStyles.primaryButtonText}>회원가입</Text>
             )}
          </TouchableOpacity>

          <View style={localStyles.orContainer}>
            <Text style={localStyles.orText}>또는</Text>
          </View>

          {/* 카카오 로그인 버튼 */}
          <TouchableOpacity style={KakaoLogin.ButtonBackground} onPress={handleKakaoLogin}>
            <View style={KakaoLogin.ButtonAlign}>
              <FontAwesome name="comment" size={20} color="#000" style={KakaoLogin.Icon} />
              <Text style={KakaoLogin.ButtonText}>로그인</Text>
            </View>
          </TouchableOpacity>

          {/* '이미 계정이 있으신가요? 로그인' 링크 */}
          <View style={localStyles.loginLinkContainer}>
            <Text style={localStyles.linkBaseText}>이미 계정이 있으신가요? </Text>
            <TouchableOpacity onPress={handleLoginLink}>
              <Text style={localStyles.loginLinkText}>로그인</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>     
      </KeyboardAvoidingView>
    </View>
  );
}

// 🎨 스타일 시트
const localStyles = StyleSheet.create({
  // 인증번호 입력 그룹
  verificationInputGroup: {
    marginTop: -5, 
    marginBottom: 5
  },

  // 입력 필드와 버튼을 한 줄에 배치하기 위한 컨테이너
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

  // 인증 버튼
  verificationButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    height: 50, 
    justifyContent: 'center',
    alignItems: 'center'
  },

  // 미인증 상태 버튼
  unverifiedButton: {
    backgroundColor: '#000'
  },

  // 인증 완료 시 버튼
  verifiedButton: {
    backgroundColor: '#ccc'
  },
  verificationButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold'
  },
    
  // 약관 동의
  policyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap', 
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 10,
    width: '100%'
  },
  policyText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18
  },
  policyLinkText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    textDecorationLine: 'underline'
  },
  
  // '또는' 구분선
  orContainer: {
    alignItems: 'center',
    marginVertical: 10
  },
  orText: {
    fontSize: 14,
    color: '#999'
  },

  // 이미 계정이 있으신가요? 로그인
  linkBaseText: {
    fontSize: 14,
    color: '#666'
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20
  },
  loginLinkText: {
    fontSize: 14,
    color: '#666',
    textDecorationLine: 'underline'
  }
});
