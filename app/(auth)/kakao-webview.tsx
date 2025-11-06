// app/(auth)/kakao-webview.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';
import axios from 'axios'; 
import qs from 'qs'; 
import { authStyles } from './styles'; // 공통 스타일 임포트
import { useAuth } from '../../context/authContext'; // Context 사용

// 카카오 로그인 상수
const KAKAO_REST_API_KEY = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY!;

// RAILWAY BASE URL
const RAILWAY_BASE_URL = process.env.EXPO_PUBLIC_RAILWAY_BASE_URL

// 카카오 디벨로퍼에 등록된 전체 Redirect URI (콜백 주소)
const REDIRECT_URI_WEB = `${RAILWAY_BASE_URL}/api/auth/kakao/callback`; 

// 카카오 인가 요청 URL
const KAKAO_AUTH_URL = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${KAKAO_REST_API_KEY}&redirect_uri=${REDIRECT_URI_WEB}&scope=profile_nickname,profile_image,account_email`;

// WebView에서 실행될 JavaScript (URL에 code가 포함되면 메시지 전송)
const INJECTED_JAVASCRIPT = `
  if (window.location.href.includes('code=')) {
    window.ReactNativeWebView.postMessage(window.location.href);
  }
  true;
`;

// 메인 컴포넌트
export default function KakaoWebViewScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { signIn } = useAuth(); // 토큰 저장을 위해 useAuth 사용

    const handleGoBack = () => {
        router.back();
    };

    // WebView에서 받은 URL에서 인가 코드(code)를 추출
    const getCode = (url: string) => {
        const exp = 'code=';
        const condition = url.indexOf(exp);
        
        if (condition !== -1) {
            const requestCode = url.substring(condition + exp.length);
            requestToken(requestCode);
        } else {
            Alert.alert('오류', '카카오 인증 코드 추출 실패.');
            router.back(); // 실패 시 이전 화면으로 돌아감
        }
    };

    // 인가 코드를 이용해 토큰 교환 및 백엔드에 전달 (디버깅 로직 강화)
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
            let KAKAO_ACCESS_TOKEN = '';
            try {
                const tokenResponse = await axios.post(requestTokenUrl, options, {
                    headers: { "Content-Type": "application/x-www-form-urlencoded" }
                });
                KAKAO_ACCESS_TOKEN = tokenResponse.data.access_token;
                console.log("✅ 1단계 성공: 카카오 액세스 토큰 획득.");
            } catch (e: any) {
                console.error("❌ 1단계 실패: 카카오 토큰 획득 오류", e.response?.data || e.message);
                Alert.alert('로그인 실패', '카카오 인증 후 토큰을 받지 못했습니다. (1단계 오류)');
                router.back();
                return;
            }
            
            // 2. Back-end로 KAKAO_ACCESS_TOKEN 전달
            const BACKEND_API_URL = `${RAILWAY_BASE_URL}/api/auth/kakao/token_exchange`; 

            const body = { KAKAO_ACCESS_TOKEN, };
            
            // 3. 백엔드와 통신하여 서비스 JWT 토큰 획득
            let serviceToken = '';
            try {
                console.log("➡ 2단계 요청: 백엔드에 카카오 토큰 전달 중...");
                const response = await axios.post(BACKEND_API_URL, body);
                serviceToken = response.data.token; 
                console.log("✅ 2단계 성공: 서비스 JWT 획득.");
            } catch (e: any) {
                console.error("❌ 2단계 실패: 백엔드 토큰 교환 오류:", e.response?.data || e.message);
                Alert.alert('로그인 실패', `백엔드 처리 중 오류가 발생했습니다. (2단계 오류: ${e.response?.status || '네트워크'})`);
                router.back();
                return;
            }

            // 4. 로그인 완료 처리
            await signIn(serviceToken); // 토큰 저장 및 홈 이동
            router.replace('/(tabs)/home'); // 안전장치!

        } catch (e) {
            // 예상치 못한 오류 처리
            console.error("카카오 로그인 (WebView) 실패:", e);
            Alert.alert('로그인 실패', '알 수 없는 오류가 발생했습니다. 다시 시도해 주세요.');
            router.back();
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            {/* Header 영역*/}
            <View style={authStyles.header}>
                <TouchableOpacity onPress={handleGoBack} style={authStyles.backButtonContainer}>
                    <Text style={authStyles.backButton}>{'<'}</Text>
                </TouchableOpacity>
                <Text style={authStyles.title}>카카오로 로그인</Text>
            </View>

            {/* WebView 컴포넌트 */}
            <WebView
                style={styles.webView}
                source={{ uri: KAKAO_AUTH_URL }}
                injectedJavaScript={INJECTED_JAVASCRIPT}
                javaScriptEnabled
                onMessage={event => {
                    const url = event.nativeEvent.data; 
                    if (url && url.includes('code=')) {
                        getCode(url); // 로그인 처리 시작
                    }
                }}
            />
        </View>
    );
}

// 💡스타일 시트💡
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    webView: {
        flex: 1,
    }
});
