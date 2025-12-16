// app/(auth)/kakao-webview.tsx

import axios from 'axios';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';

// Style
import { Header } from '@/components/header'; // 헤더

// Context
import { useAuth } from '@/context/authContext';

// 카카오 로그인 상수
const KAKAO_REST_API_KEY = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY!;

// RAILWAY BASE URL
const RAILWAY_BASE_URL = process.env.EXPO_PUBLIC_RAILWAY_BASE_URL;

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
            console.log("✅ 인가 코드 추출 성공:", requestCode);
            requestToken(requestCode);
        }
    };

    // 인가 코드를 백엔드로 바로 전송 (토큰 교환은 백엔드 담당)
    const requestToken = async (code: string) => {
        const BACKEND_API_URL = `${RAILWAY_BASE_URL}/api/auth/kakao/token_exchange`; 

        try {
            console.log("➡ 백엔드로 로그인 요청 전송 중...");

            const response = await axios.post(BACKEND_API_URL, 
                { 
                    code: code 
                }, 
                {
                    headers: { 
                        "Content-Type": "application/json" 
                    }
                }
            );
            
            // 백엔드에서 주는 변수명과 일치하게 할 것!
            // 백엔드 응답: { accessToken, refreshToken, user, ... }
            const { accessToken, refreshToken, isNewUser } = response.data;

            console.log(`✅ 로그인 성공 (신규 유저: ${isNewUser})`);
            console.log(`🔑 Access Token: ${accessToken.substring(0, 10)}...`);
            console.log(`🔄 Refresh Token: ${refreshToken.substring(0, 10)}...`);

            // authContext.tsx의 signIn 함수에 두 토큰을 모두 넘겨줘야 함
            await signIn(accessToken, refreshToken); 
            
            router.replace('/(tabs)/home'); // 메인 화면으로 이동

        } catch (e: any) {
            console.error("❌ 백엔드 로그인 요청 실패:", e.response?.data || e.message);
            
            Alert.alert(
                '로그인 실패', 
                `서버 메시지: ${e.response?.data?.message || '네트워크 오류가 발생했습니다.'}`
            );
            router.back(); // 실패 시 뒤로 가기
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            {/* Header 영역*/}
            <View style={Header.HeaderAlign}>
                <TouchableOpacity onPress={handleGoBack} style={Header.KakaoLoginBackButton}>
                    <ChevronLeft size={28} color="#000" />
                </TouchableOpacity>
                <Text style={Header.Title}>카카오로 로그인</Text>
            </View>

            {/* WebView 컴포넌트 */}
            <WebView
                style={styles.webView}
                source={{ uri: KAKAO_AUTH_URL }}
                
                // ⭐ 매번 새로운 로그인을 위해 쿠키/캐시 삭제 옵션 추가 (테스트용)
                incognito={false}             
                sharedCookiesEnabled={false}
                cacheEnabled={false}
                
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

// 🎨 스타일 시트
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    webView: {
        flex: 1
    }
});
