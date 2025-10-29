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

// Context 훅 임포트
import { useAuth } from '../../context/authContext'; 

WebBrowser.maybeCompleteAuthSession(); 

// 💡 카카오 로그인 관련 상수 및 로직은 
// 💡 /auth/kakao-webview.tsx로 책임을 이관했으므로 모두 제거합니다.

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // ------------------------- 핸들러 로직 ---------------------------

  // 카카오 로그인 버튼 핸들러: WebView 스택 페이지로 이동만 담당
  const handleKakaoLogin = async () => {
      // 실제 카카오 인증 및 토큰 교환은 kakao-webview.tsx에서 처리
      router.push('/(auth)/kakao-webview' as RedirectProps['href']);
  };
  
  // 기존 핸들러 유지
  const handleGoBack = () => { router.back(); };
  
  // 이메일 로그인 (임시)
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("경고", "이메일과 비밀번호를 입력해주세요.");
      return;
    }
    
    Alert.alert("성공", "이메일 로그인 성공 (임시)");
    const mockToken = "mock_email_login_token"; 
    await signIn(mockToken); 
    router.replace('/(tabs)/home');
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