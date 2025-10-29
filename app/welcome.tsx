// app/welcome.tsx

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useRouter, RedirectProps } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
// import { COLORS } from '../constants/colors';

export default function WelcomeScreen() {
  const router = useRouter();
  // SafeArea 여백 값(top, bottom, left, right) 가져오기
  const insets = useSafeAreaInsets(); 

  const handleLoginPress = () => {
    router.push('/(auth)/login' as RedirectProps['href']); 
  };

  const handleRegisterPress = () => {
    router.push('/(auth)/register' as RedirectProps['href']);
  };

  return (
    // SafeAreaView 대신 일반 View 사용
    <View style={[
        styles.container, 
        // 가져온 inset 값을 View의 paddingStyle에 적용
        { paddingTop: insets.top, paddingBottom: insets.bottom } 
    ]}>
        
        {/* 중앙 로고 */}
        <View style={styles.logoContainer}>
          {/* 💡 로고 텍스트 대신 Image 컴포넌트 사용 */}
          <Image 
            source={require('../assets/images/splash-icon.png')} // 로고 이미지 경로 설정
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* 하단 버튼 영역 */}
        <View style={styles.buttonGroup}>
            {/* 로그인 버튼 */}
            <TouchableOpacity 
                style={[styles.button, styles.primaryButton]} 
                onPress={handleLoginPress}
            >
                <Text style={[styles.buttonText, styles.primaryButtonText]}>로그인</Text>
            </TouchableOpacity>

            {/* 회원가입 버튼 */}
            <TouchableOpacity 
                style={[styles.button, styles.secondaryButton]} 
                onPress={handleRegisterPress}
            >
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>회원가입</Text>
            </TouchableOpacity>
        </View>
        
    </View>
  );
}

const styles = StyleSheet.create({
    // 💡 safeArea 대신 전체 화면을 덮도록 container 스타일 조정
    container: { 
        flex: 1,
        backgroundColor: '#fff',
        paddingHorizontal: 24,
        justifyContent: 'space-between', 
        alignItems: 'center',
        // paddingTop/paddingBottom은 useSafeAreaInsets에서 동적으로 처리
    },
    logoContainer: {
        flex: 1, 
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoImage: {
        width: 300,
        height: 200,
    },
    buttonGroup: {
        width: '100%',
        gap: 12,
    },
    button: {
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    primaryButton: {
        backgroundColor: '#000',
    },
    primaryButtonText: {
        color: '#fff',
    },
    secondaryButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ccc',
    },
    secondaryButtonText: {
        color: '#000',
    },
});