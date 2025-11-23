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
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Style 임포트
import { authStyles } from '@/components/authStyles'; // Auth
import { Header } from '@/components/header'; // 헤더
import { KakaoLogin } from '@/components/kakao-login-btn'; // Kakao 로그인 버튼
import { Styles } from '@/constants/styles'; // 공통

WebBrowser.maybeCompleteAuthSession(); 

// 카카오 관련 상수와 로직을 제거 (UI 유지를 위해 RegisterScreen은 유지)
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
  
  const handleGoBack = () => {
    router.back(); 
  };
  
  const handleRegister = async () => {
    if (password.length < 6) { // 비밀번호 유효성 (임시) 체크
      Alert.alert("알림", "비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    
    if (!isEmailVerified) {
       Alert.alert("경고", "이메일 인증을 완료해야 합니다.");
       return;
    }

    Alert.alert("성공", "회원가입 성공 (임시)");
    router.replace('/(auth)/login' as RedirectProps['href']); 
  };

  // 인증번호 발송 핸들러
  const handleSendVerificationCode = async () => {
    if (!email) { Alert.alert("알림", "이메일을 입력해 주세요."); return; }
    setVerificationCodeSent(true); 
    Alert.alert("알림", `${email}로 인증번호가 발송되었습니다.`);
  };
  
  // 인증번호 확인 핸들러
  const handleVerifyCode = async () => {
    if (!verificationCode) { Alert.alert("알림", "인증번호를 입력해 주세요."); return; }
    setIsEmailVerified(true);
    setVerificationCodeSent(false);
    Alert.alert("인증 완료", "이메일 인증이 성공적으로 완료되었습니다.");
  };
  
  // 약관/정책 모달 띄우기 핸들러
  const handlePolicyLink = (type: 'privacy' | 'terms') => {
    if (type === 'privacy') {
      router.push('/(auth)/privacy-policy' as RedirectProps['href']);
    } else {
      router.push('/(auth)/terms-of-use' as RedirectProps['href']);
    }
  };

  // 카카오 로그인 버튼 핸들러: WebView 스택 페이지로 이동
  const handleKakaoLogin = async () => {
      router.push('/(auth)/kakao-webview' as RedirectProps['href']);
  };
  
  // 로그인 링크 핸들러
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
              editable={!isEmailVerified} // 인증 완료 시 수정 불가
            />
            <TouchableOpacity 
              style={[localStyles.verificationButton, isEmailVerified ? localStyles.verifiedButton : localStyles.unverifiedButton]}
              onPress={handleSendVerificationCode}
              disabled={isEmailVerified}
            >
              <Text style={localStyles.verificationButtonText}>{isEmailVerified ? '인증 완료' : '인증'}</Text>
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
                <TouchableOpacity style={[localStyles.verificationButton, localStyles.unverifiedButton]} onPress={handleVerifyCode}>
                  <Text style={localStyles.verificationButtonText}>확인</Text>
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
          <TouchableOpacity style={authStyles.primaryButton} onPress={handleRegister}>
            <Text style={authStyles.primaryButtonText}>회원가입</Text>
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

// 💡스타일 시트💡
const localStyles = StyleSheet.create({
  // 인증번호 입력 그룹
  verificationInputGroup: {
    marginTop: -5, 
    marginBottom: 5,
  },
  // 입력 필드와 버튼을 한 줄에 배치하기 위한 컨테이너
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
  // 인증 버튼
  verificationButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    height: 50, 
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 미인증 상태 버튼
  unverifiedButton: {
    backgroundColor: '#000',
  },
  // 인증 완료 시 버튼
  verifiedButton: {
    backgroundColor: '#ccc',
  },
  verificationButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
    
  // 약관 동의 텍스트
  policyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap', 
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 10,
    width: '100%',
  },
  policyText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  policyLinkText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    textDecorationLine: 'underline',
  },
  
  // '또는' 구분선
  orContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  orText: {
    fontSize: 14,
    color: '#999',
  },

  // 이미 계정이 있으신가요? 로그인
  linkBaseText: {
    fontSize: 14,
    color: '#666',
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginLinkText: {
    fontSize: 14,
    color: '#666',
    textDecorationLine: 'underline', 
  }
});
