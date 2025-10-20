// app/(auth)/login.tsx

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
import { authStyles } from './styles';
// 💡 FontAwesome 아이콘을 추가하여 버튼에 사용
import FontAwesome from '@expo/vector-icons/FontAwesome'; 

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleGoBack = () => {
    router.back(); 
  };

  const handleLogin = async () => {
    console.log("로그인 시도:", { email, password });
    
    if (!email || !password) {
      Alert.alert("알림", "이메일과 비밀번호를 모두 입력해 주세요.");
      return;
    }
    
    // ... (인증 로직 생략)
    
    Alert.alert("성공", "로그인 성공 (임시)");
    router.replace('/(tabs)/home' as RedirectProps['href']); 
  };

  const handleSetPassword = () => {
    router.push('/(auth)/set-password' as RedirectProps['href']);
  };

  // 💡 카카오 로그인 버튼 핸들러 (임시)
  const handleKakaoLogin = () => {
    Alert.alert("알림", "카카오 로그인 연동 준비 중입니다.");
    // 💡 [추후 연동] 여기에 카카오 SDK 호출 로직을 구현
  };

  // 회원가입 링크 핸들러
  const handleRegisterLink = () => {
    router.replace('/(auth)/register' as RedirectProps['href']);
  };

  return (
    <KeyboardAvoidingView
      style={[authStyles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={authStyles.scrollContent}>
        
        {/* authStyles의 헤더 스타일 적용 */}
        <View style={authStyles.header}>
          <TouchableOpacity onPress={handleGoBack} style={authStyles.backButtonContainer}>
             <Text style={authStyles.backButton}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={authStyles.title}>로그인</Text>
        </View>

        <View style={authStyles.form}>
          
          <Text style={authStyles.label}>이메일</Text>
          <TextInput
            style={authStyles.input}
            placeholder="bapple@bapple.com"
            placeholderTextColor="#A9A9A9"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={authStyles.label}>비밀번호</Text>
          <TextInput
            style={authStyles.input}
            placeholder="***********"
            placeholderTextColor="#A9A9A9"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
        {/* 비밀번호 재설정 링크 */}
          <TouchableOpacity style={localStyles.setPasswordLinkContainer} onPress={handleSetPassword}>
            <Text style={localStyles.setPasswordLinkText}>비밀번호 재설정</Text>
          </TouchableOpacity>
        </View>
        
        {/* 이메일 로그인 버튼 */}
        <TouchableOpacity style={localStyles.emailLoginButton} onPress={handleLogin}>
          <Text style={authStyles.secondaryButtonText}>이메일로 로그인</Text>
        </TouchableOpacity>

        {/* '또는' 구분선 영역 */}
        <View style={authStyles.socialLoginPlaceholder}>
          <Text style={localStyles.orDividerText}>또는</Text>
        </View>

        {/*  카카오 로그인 버튼 */}
        <TouchableOpacity style={authStyles.kakaoButton} onPress={handleKakaoLogin}>
          <View style={localStyles.kakaoButtonContent}>
            {/* 💡 카카오 로고 대신 임시 아이콘 사용 */}
            <FontAwesome name="comment" size={20} color="#000" style={localStyles.kakaoIcon} />
            <Text style={authStyles.kakaoButtonText}>로그인</Text>
          </View>
        </TouchableOpacity>

        {/*  Bapple이 처음이신가요? 회원가입 링크 */}
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
  emailLoginButton: {
    width: '100%',
    paddingVertical: 16, // 높이 확보
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000', // 검은색 배경
    marginTop: 20,
  },

  // 카카오 버튼 내부 아이콘/텍스트 배치
  kakaoButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%', // 내부 컨텐츠 너비 확보
  },
  kakaoIcon: {
    position: 'absolute', 
    left: 15,
  },
  
  // '또는' 텍스트 중앙 정렬 및 스타일
  orDividerText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },

  // 하단 회원가입 링크 스타일
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
    textDecorationLine: 'underline', // 회원가입에만 밑줄
  }
});