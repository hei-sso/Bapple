// app/(auth)/register.tsx

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  StyleSheet, 
  Alert,
  Modal 
} from 'react-native';
import { useRouter, RedirectProps } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authStyles } from './styles';
import FontAwesome from '@expo/vector-icons/FontAwesome'; 
import * as WebBrowser from 'expo-web-browser'; 
import axios from 'axios';
import qs from 'qs';

WebBrowser.maybeCompleteAuthSession(); 

// 환경 변수 및 상수 (WebView REST API 방식)
const KAKAO_REST_API_KEY = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY!;
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL!; 

// 카카오 디벨로퍼에 등록된 Redirect URI여야 함 (테스트 용)
const REDIRECT_URI_WEB = process.env.EXPO_PUBLIC_BACKEND_URL; 

// 카카오 인가 요청 URL
const KAKAO_AUTH_URL = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${KAKAO_REST_API_KEY}&redirect_uri=${REDIRECT_URI_WEB}&scope=profile,account_email`;

// WebView에서 실행될 JavaScript (URL에 code가 포함되면 메시지 전송)
// 인가 코드(code)가 포함된 최종 Redirect URI로 이동했을 때, URL 전체를 Native로 전달
const INJECTED_JAVASCRIPT = `
  if (window.location.href.includes('code=')) {
    window.ReactNativeWebView.postMessage(window.location.href);
  }
  true;
`;

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
  const [isWebViewVisible, setIsWebViewVisible] = useState(false); // WebView 표시 상태

  // 카카오 로그인 핵심 로직 (참고: https://kong-dev.tistory.com/163)
  // WebView에서 받은 URL에서 인가 코드(code)를 추
  const getCode = (url: string) => {
    setIsWebViewVisible(false);
    
    const exp = 'code=';
    const condition = url.indexOf(exp);
    
    if (condition !== -1) {
      const requestCode = url.substring(condition + exp.length);
      requestToken(requestCode); // 인가 코드를 이용해 토큰 요청
    } else {
        Alert.alert('오류', '카카오 인증 코드 추출 실패.');
    }
  };

  // 인가 코드를 이용해 카카오 ACCESS_TOKEN을 받고, 백엔드에 전달
  const requestToken = async (code: string) => {
    const requestTokenUrl = 'https://kauth.kakao.com/oauth/token';

    const options = qs.stringify({
      grant_type: 'authorization_code',
      client_id: KAKAO_REST_API_KEY,
      redirect_uri: REDIRECT_URI_WEB,
      code,
    });

    try {
      // 1. 카카오로부터 ACCESS_TOKEN 획득 (Front-end가 직접 처리)
      const tokenResponse = await axios.post(requestTokenUrl, options, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      });
      const KAKAO_ACCESS_TOKEN = tokenResponse.data.access_token;
      
      // 2. Back-end로 KAKAO_ACCESS_TOKEN 전달 (사용자 정보 요청 및 JWT 획득)
      const BACKEND_API_URL = `${BACKEND_URL}/api/auth/kakao/token_exchange`; 

      const body = {
        KAKAO_ACCESS_TOKEN,
      };
      
      // 3. 백엔드와 통신하여 서비스 JWT 토큰 획득 및 로그인 처리
      const response = await axios.post(BACKEND_API_URL, body);
      const serviceToken = response.data.token; // 백엔드에서 받은 최종 JWT 토큰

      // 4. 로그인 완료 처리 (useAuth의 signIn 함수가 없으므로 임시로 router.replace 사용)
      router.replace('/(auth)/login'); 

    } catch (e) {
      console.error("카카오 로그인 (WebView) 실패:", e);
      Alert.alert('로그인 실패', '다시 시도해 주세요.');
    }
  };
  // ------------------------------------------------------------


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

  // 인증번호 발송 핸들러 (로직 유지)
  const handleSendVerificationCode = async () => {
    if (!email) { Alert.alert("알림", "이메일을 입력해 주세요."); return; }
    setVerificationCodeSent(true); 
    Alert.alert("알림", `${email}로 인증번호가 발송되었습니다.`);
  };
  
  // 인증번호 확인 핸들러 (로직 유지)
  const handleVerifyCode = async () => {
    if (!verificationCode) { Alert.alert("알림", "인증번호를 입력해 주세요."); return; }
    setIsEmailVerified(true);
    setVerificationCodeSent(false);
    Alert.alert("인증 완료", "이메일 인증이 성공적으로 완료되었습니다.");
  };
  
  // 약관/정책 모달 띄우기 핸들러 (로직 유지)
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
    <KeyboardAvoidingView
      style={[authStyles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={authStyles.scrollContent}>
        
        <View style={authStyles.header}>
          <TouchableOpacity onPress={handleGoBack} style={authStyles.backButtonContainer}>
             <Text style={authStyles.backButton}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={authStyles.title}>회원가입</Text>
        </View>

        <View style={authStyles.form}>
          
          <Text style={authStyles.label}>닉네임</Text>
          <TextInput
            style={authStyles.input}
            placeholder="bapple"
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
              placeholder="bapple@bapple.com"
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
            placeholder="***********"
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
            placeholder="DD / MM / YYYY"
            placeholderTextColor="#A9A9A9"
            value={birthdate}
            onChangeText={setBirthdate}
            keyboardType="numbers-and-punctuation"
          />
          
        </View>
        
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

        {/* 카카오 로그인 버튼: WebView 표시 트리거 */}
        <TouchableOpacity 
          style={authStyles.kakaoButton} 
          onPress={handleKakaoLogin}
        >
          <View style={localStyles.kakaoButtonContent}>
            <FontAwesome name="comment" size={20} color="#000" style={localStyles.kakaoIcon} />
            <Text style={authStyles.kakaoButtonText}>로그인</Text>
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
  );
}

// 💡 register.tsx에만 필요한 추가 스타일
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

  // 카카오 버튼 내부 아이콘/텍스트 배치
  kakaoButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%', 
  },
  kakaoIcon: {
    position: 'absolute', 
    left: 15,
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
