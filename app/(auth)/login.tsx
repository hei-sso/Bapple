// app/(auth)/login.tsx

import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, 
  KeyboardAvoidingView, Platform, ScrollView, 
  StyleSheet, Alert
} from 'react-native';
import { useRouter, RedirectProps } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authStyles } from './styles';
import FontAwesome from '@expo/vector-icons/FontAwesome'; 
import * as WebBrowser from 'expo-web-browser';
import axios from 'axios';
import qs from 'qs';

// Context 훅 임포트
import { useAuth } from '../../context/authContext'; 

WebBrowser.maybeCompleteAuthSession(); 

// 카카오 로그인 상수 (WebView REST API 방식)
const KAKAO_REST_API_KEY = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY!;
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL!; 
const SCHEME = 'bapple';

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

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isWebViewVisible, setIsWebViewVisible] = useState(false); // WebView 표시 상태

  // 카카오 로그인 핵심 로직 (참고: https://kong-dev.tistory.com/163)
  // WebView에서 받은 URL에서 인가 코드(code)를 추출
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

    // 1. 카카오 토큰 요청에 필요한 파라미터 (qs 라이브러리 사용)
    const options = qs.stringify({
      grant_type: 'authorization_code',
      client_id: KAKAO_REST_API_KEY,
      redirect_uri: REDIRECT_URI_WEB,
      code,
    });

    try {
      // 1-1. 카카오로부터 ACCESS_TOKEN 획득 (Front-end가 직접 처리)
      const tokenResponse = await axios.post(requestTokenUrl, options, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      });
      const KAKAO_ACCESS_TOKEN = tokenResponse.data.access_token;
      
      // 2. Back-end로 KAKAO_ACCESS_TOKEN 전달 (사용자 정보 요청 및 JWT 획득)
      const BACKEND_API_URL = `${BACKEND_URL}/api/auth/kakao/callback`; 

      const body = {
        KAKAO_ACCESS_TOKEN,
      };
      
      // 3. 백엔드와 통신하여 서비스 JWT 토큰 획득 및 로그인 처리
      const response = await axios.post(BACKEND_API_URL, body);
      const serviceToken = response.data.token; // 백엔드에서 받은 최종 JWT 토큰

      // 4. 로그인 완료 처리
      await signIn(serviceToken); // useAuth 컨텍스트를 사용 (토큰 저장 및 홈 이동)

    } catch (e) {
      console.error("카카오 로그인 (WebView) 실패:", e);
      Alert.alert('로그인 실패', '카카오 인증 및 백엔드 처리 중 오류가 발생했습니다.');
    }
  };
  
  // 카카오 로그인 버튼 핸들러: WebView 스택 페이지로 이동
  const handleKakaoLogin = async () => {
      // 💡 /auth/kakao-webview.tsx 경로로 이동
      router.push('/(auth)/kakao-webview' as RedirectProps['href']);
  };
  
  // 기존 핸들러 유지---------------------------------------------
  const handleGoBack = () => { router.back(); };
  const handleLogin = async () => {
    Alert.alert("성공", "이메일 로그인 성공 (임시)");
    const mockToken = "mock_email_login_token"; 
    await signIn(mockToken); 
  };
  const handleSetPassword = () => { router.push('/(auth)/set-password' as RedirectProps['href']); };
  const handleRegisterLink = () => { router.replace('/(auth)/register' as RedirectProps['href']); };
  // ------------------------------------------------------------

  return (
    <KeyboardAvoidingView
      style={[authStyles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={authStyles.scrollContent}>
        
        {/* Header 영역 */}
        <View style={authStyles.header}>
          <TouchableOpacity onPress={handleGoBack} style={authStyles.backButtonContainer}>
             <Text style={authStyles.backButton}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={authStyles.title}>로그인</Text>
        </View>

        {/* 폼 영역 */}
        <View style={authStyles.form}>
          <Text style={authStyles.label}>이메일</Text>
          <TextInput
            style={authStyles.input}
            placeholder="bapple@bapple.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholderTextColor="#A9A9A9"
            autoCapitalize="none"
          />
          <Text style={authStyles.label}>비밀번호</Text>
          <TextInput
            style={authStyles.input}
            placeholder="***********"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor="#A9A9A9"
          />
          {/* 비밀번호 재설정 링크 */}
          <TouchableOpacity 
            style={localStyles.setPasswordLinkContainer} 
            onPress={handleSetPassword}
          >
            <Text style={localStyles.setPasswordLinkText}>비밀번호 재설정</Text>
          </TouchableOpacity>
        </View>
        
        {/* 이메일 로그인 버튼 */}
        <TouchableOpacity 
          style={localStyles.emailLoginButton}
          onPress={handleLogin}
        >
          <Text style={authStyles.secondaryButtonText}>이메일로 로그인</Text>
        </TouchableOpacity>

        {/* '또는' 구분선 영역 */}
        <View style={localStyles.orContainer}>
          <Text style={localStyles.orDividerText}>
            또는
          </Text>
        </View>

        {/* 카카오 로그인 버튼 (handleKakaoLogin 연결) */}
        <TouchableOpacity 
          style={localStyles.kakaoButton} 
          onPress={handleKakaoLogin}
        >
          <View style={localStyles.kakaoButtonContent}>
            <FontAwesome name="comment" size={20} color="#000" style={localStyles.kakaoIcon} />
            <Text style={localStyles.kakaoButtonText}>로그인</Text>
          </View>
        </TouchableOpacity>
        
        {/* 하단 회원가입 링크 */}
        <View style={localStyles.registerLinkContainer}>
          <Text style={localStyles.registerLinkTextBase}>Bapple이 처음이신가요? </Text>
          <TouchableOpacity onPress={handleRegisterLink}>
            <Text style={localStyles.registerLinkText}>회원가입</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// 💡 login.tsx에만 필요한 추가 스타일
const localStyles = StyleSheet.create({
  // 비밀번호 재설정 링크
  setPasswordLinkContainer: {
    width: '100%',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  setPasswordLinkText: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'underline', 
  },
  
  // 이메일로로 로그인 버튼
  emailLoginButton: {
    width: '100%',
    paddingVertical: 16, 
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000', 
    marginTop: 20,
  },

  // '또는' 컨테이너
  orContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  orDividerText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },

  // 카카오 로그인 버튼
  kakaoButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: '#FFD100',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  kakaoButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  
  // 하단 회원가입 링크
  registerLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
  },
  registerLinkTextBase: {
    fontSize: 14,
    color: '#666',
  },
  registerLinkText: {
    fontSize: 14,
    color: '#666',
    textDecorationLine: 'underline', 
  }
});
