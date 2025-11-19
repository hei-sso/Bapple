// app/(auth)/kakao-webview.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';
import axios from 'axios';
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

    // URL에서 인가 코드(code)를 추출
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

    // 인가 코드를 백엔드로 바로 전달
    const requestToken = async (code: string) => {

        try {
            // 바로 백엔드로 직행!
            const BACKEND_API_URL = `${RAILWAY_BASE_URL}/api/auth/kakao/token_exchange`; 

            // 백엔드가 req.body.code를 기다리므로 키 이름을 'code'로 백엔드랑 맞춤
            const body = { code: code };
            
            console.log("백엔드로 인가 코드 전송 중...", BACKEND_API_URL);

            // 백엔드와 통신하여 서비스 JWT 토큰 획득
            const response = await axios.post(BACKEND_API_URL, body);
            
            const serviceToken = response.data.token; 
            const isNewUser = response.data.isNewUser; // 신규 유저 여부 (필요 시 사용)

            console.log("✅ 로그인 성공: JWT 획득 완료.");

            // 로그인 완료 처리
            await signIn(serviceToken); // 토큰 저장 및 Context 업데이트
            router.replace('/(tabs)/home'); // 홈으로 이동

        } catch (e: any) {
            // 에러 처리 강화
            console.error("❌ 로그인 실패 (백엔드 통신 오류):", e.response?.data || e.message);
            
            // 400 or 401 오류: 백엔드 측의 통신 거부
            if (e.response && (e.response.status === 400 || e.response.status === 401)) {
                 Alert.alert('로그인 실패', e.response.data.message || '인증 정보가 올바르지 않습니다.');
            } else {
                 Alert.alert('서버 오류', '로그인 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.');
            }
            router.back();
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            {/* Header 영역*/}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleGoBack} style={styles.backButtonContainer}>
                    <Text style={styles.backButton}>{'<'}</Text>
                </TouchableOpacity>
                <Text style={styles.title}>카카오로 로그인</Text>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 20,
        marginBottom: 10,
    },
    backButtonContainer: {
        paddingHorizontal: 30,
    },
    backButton: {
        fontSize: 28,
        fontWeight: '300',
        color: '#000',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        flex: 1, 
        marginRight: 75, // backButtonContainer 패딩만큼 상쇄
    },
    webView: {
        flex: 1,
    }
});
