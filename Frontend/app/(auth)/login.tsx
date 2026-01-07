// app/(auth)/login.tsx

import FontAwesome from '@expo/vector-icons/FontAwesome';
import { RedirectProps, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { ChevronLeft } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Style
import { authStyles } from '@/components/authStyles'; // Auth
import { Header } from '@/components/header'; // 헤더
import { KakaoLogin } from '@/components/kakao-login-btn'; // Kakao 로그인 버튼
import { Styles } from '@/constants/styles'; // 공통

// Context
import { useAuth } from '@/context/authContext';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 카카오 로그인 버튼 핸들러: WebView 스택 페이지로 이동만 담당
  const handleKakaoLogin = async () => {
      // 실제 카카오 인증 및 토큰 교환은 kakao-webview.tsx에서 처리
      router.push('/(auth)/kakao-webview' as RedirectProps['href']);
  };
  
  // 기존 핸들러 유지
  const handleGoBack = () => { router.back(); };
  
  // ⭐ 이메일 로그인 (임시)
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("경고", "이메일과 비밀번호를 입력해주세요.");
      return;
    }
    
    Alert.alert("성공", "이메일 로그인 성공 (임시)");
    const newToken = "email_login_token";
    const refreshToken = "email_login_refresh_token";
    await signIn(newToken, refreshToken); 
    router.replace('/(tabs)/home');
  };
  
  const handleSetPassword = () => { router.push('/(auth)/set-password' as RedirectProps['href']); };
  const handleRegisterLink = () => { router.replace('/(auth)/register' as RedirectProps['href']); };

  return (
    <View style={[Styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
        
      {/* Header 영역 */}
      <View style={Header.HeaderAlign}>
        <TouchableOpacity onPress={handleGoBack} style={Header.BackButton}>
          <ChevronLeft size={28} color="#000" />
        </TouchableOpacity>
        <Text style={Header.Title}>로그인</Text>
      </View>

      <Text style={authStyles.label}>이메일</Text>
      <TextInput
        style={authStyles.input}
        placeholder="Bapple@example.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        placeholderTextColor="#A9A9A9"
        autoCapitalize="none"
      />

      <Text style={authStyles.label}>비밀번호</Text>
      <TextInput
        style={authStyles.input}
        placeholder="**********"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor="#A9A9A9"
      />

      {/* 비밀번호 재설정 링크 */}
      <TouchableOpacity style={localStyles.setPasswordLinkContainer} onPress={handleSetPassword}>
        <Text style={localStyles.setPasswordLinkText}>비밀번호 재설정</Text>
      </TouchableOpacity>
        
      {/* 이메일 로그인 버튼 */}
      <TouchableOpacity style={localStyles.emailLoginButton} onPress={handleLogin}>
          <Text style={authStyles.emailButtonText}>이메일로 로그인</Text>
      </TouchableOpacity>

      {/* '또는' 구분선 영역 */}
      <View style={localStyles.orContainer}>
        <Text style={localStyles.orDividerText}>또는</Text>
      </View>

      {/* 카카오 로그인 버튼 */}
      <TouchableOpacity style={KakaoLogin.ButtonBackground} onPress={handleKakaoLogin}>
        <View style={KakaoLogin.ButtonAlign}>
          <FontAwesome name="comment" size={20} color="#000" style={KakaoLogin.Icon} />
          <Text style={KakaoLogin.ButtonText}>로그인</Text>
        </View>
      </TouchableOpacity>
        
      {/* 하단 회원가입 링크 */}
      <View style={localStyles.registerLinkContainer}>
        <Text style={localStyles.registerLinkTextBase}>Bapple이 처음이신가요? </Text>
        <TouchableOpacity onPress={handleRegisterLink}>
          <Text style={localStyles.registerLinkText}>회원가입</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

// 🎨 스타일 시트
const localStyles = StyleSheet.create({
  // 비밀번호 재설정 링크
  setPasswordLinkContainer: {
    width: '100%',
    alignItems: 'flex-end',
    marginTop: 8
  },
  setPasswordLinkText: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'underline'
  },
  
  // 이메일로 로그인 버튼
  emailLoginButton: {
    width: '100%',
    paddingVertical: 16, 
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000', 
    marginTop: 20
  },

  // '또는' 컨테이너
  orContainer: {
    alignItems: 'center',
    marginVertical: 15
  },
  orDividerText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center'
  },
  
  // 하단 회원가입 링크
  registerLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25
  },
  registerLinkTextBase: {
    fontSize: 14,
    color: '#666'
  },
  registerLinkText: {
    fontSize: 14,
    color: '#666',
    textDecorationLine: 'underline'
  }
});
