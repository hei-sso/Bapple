// app/_layout.tsx

import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
// Redirect는 JSX에서 사용하지 않지만, 타입 RedirectProps는 유지 (오류 방지)
import { Stack, RedirectProps, useRouter } from 'expo-router'; 
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, useCallback } from 'react';
import 'react-native-reanimated';
import { View } from 'react-native';
import * as Linking from 'expo-linking';

import { useColorScheme } from '@/components/useColorScheme';
import { AuthProvider, useAuth } from '../context/authContext';

// ErrorBoundary를 사용하여 상위 컴포넌트(_layout.tsx)에서 발생하는 렌더링 오류 등을 처리
export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// 필요한 리소스(폰트, 인증 데이터 등) 로드가 완료될 때까지 Splash 화면 유지
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // 1. 폰트 로드
  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // 2. 에러 처리
  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  // 3. 초기 로딩 작업 및 인증 체크 (인증 Context가 로드된 후에 실행될 로직)
  useEffect(() => {
    async function prepare() {
      if (fontsLoaded) {
         try {
          // =========================================================
          // 1. 최소 대기 시간을 먼저 확보 (옵션)
          await new Promise(resolve => setTimeout(resolve, 1500)); 

          //  여기서 AuthProvider 내부의 토큰 로딩을 기다려야 하지만, AuthProvider가 감싸고 있으므로 로직 단순화
          const isUserLoggedIn = false; 

          setIsAuthenticated(isUserLoggedIn);
          // =========================================================
        } catch (e) {
          setIsAuthenticated(false);
        } finally {
          setAppReady(true);
        }
      }
    }

    prepare();
  }, [fontsLoaded]);

  // 4. 앱 준비 완료 시 Splash 화면 숨기기
  const onLayoutRootView = useCallback(async () => {
    if (appReady) {
      await new Promise(resolve => setTimeout(resolve, 100)); 
      await SplashScreen.hideAsync();
    }
  }, [appReady]);

  // 5. 로딩 중에는 null 반환하여 Splash 화면을 유지
  if (!appReady || isAuthenticated === null) {
    return null;
  }

  // 딥링크 수신 처리 컴포넌트
  const DeepLinkHandler = () => {
    const { signIn } = useAuth();
    const router = useRouter();
    
    useEffect(() => {
        const handleDeepLink = ({ url }: { url: string }) => {
            const urlObj = Linking.parse(url);
            
            // 백엔드가 토큰을 성공적으로 반환했을 때의 경로 확인
            if (urlObj.path === 'auth/kakao/success') {
                const token = urlObj.queryParams?.token as string | undefined;
                
                if (token) {
                    console.log("✅ DeepLink: Final Access Token Received.");
                    signIn(token); // 토큰 저장 및 홈으로 이동
                }
            } else if (urlObj.path === 'auth/kakao/fail') {
                console.error("❌ DeepLink: Kakao Login Failed by Backend.");
                // 실패 시 로그인 화면으로 리디렉션
                router.replace('/(auth)/login'); 
            }
        };

        const subscription = Linking.addEventListener('url', handleDeepLink);
        
        // 앱이 완전히 종료되었다가 실행될 때 초기 URL 처리
        Linking.getInitialURL().then(initialUrl => {
            if (initialUrl) {
                handleDeepLink({ url: initialUrl });
            }
        });

        return () => subscription.remove();
    }, [signIn]);

    return null;
  };
    
  // 6. 모든 준비가 완료되면 메인 라우터 컴포넌트 렌더링
  return (
      <AuthProvider> 
          {/* DeepLink 핸들러를 AuthProvider 내부에 배치 */}
          <DeepLinkHandler /> 
        <RootLayoutNav isAuthenticated={isAuthenticated} onLayout={onLayoutRootView} />
      </AuthProvider>
  );
}

// RootLayoutNav 컴포넌트를 분리하여 onLayout prop과 isAuthenticated prop을 받도록 수정
function RootLayoutNav({ isAuthenticated, onLayout }: { isAuthenticated: boolean, onLayout: () => Promise<void> }) {
  const colorScheme = useColorScheme();
  const router = useRouter(); 
  
  // useEffect로 네비게이션 강제
  useEffect(() => {
    // AuthProvider 내부의 isAuthenticated 대신 초기 로직에서 설정된 isAuthenticated 사용
    const targetRoute = isAuthenticated ? '/(tabs)/home' : '/welcome';
    
    router.replace(targetRoute as RedirectProps['href']);
    
  }, [isAuthenticated]); 

  return (
    <SafeAreaProvider> 
        <View style={{ flex: 1 }} onLayout={onLayout}>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <Stack>

                {/* Redirect가 동작하면 아래의 스크린 정의 중 해당 경로로 이동함 */}
                <Stack.Screen name="welcome" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="modal" options={{ presentation: 'modal' }} />

                {/* 그룹 내 개별 파일을 Stack.Screen으로 등록 */}
                <Stack.Screen name="(auth)/login" options={{ headerShown: false, animation: 'slide_from_right' }} />
                <Stack.Screen name="(auth)/register" options={{ headerShown: false, animation: 'slide_from_right' }} />
                <Stack.Screen name="(auth)/set-password" options={{ headerShown: false, animation: 'slide_from_right' }} />
                <Stack.Screen name="(auth)/privacy-policy" options={{ headerShown: false, presentation: 'modal' }} />
                <Stack.Screen name="(auth)/terms-of-use" options={{ headerShown: false, presentation: 'modal' }} />
                <Stack.Screen name="(auth)/kakao-webview" options={{ headerShown: false, animation: 'slide_from_right' }} />

                {/* home */}
                <Stack.Screen name="home/detail" options={{ headerShown: false, animation: 'slide_from_right' }} />

                {/* mypage - friends, setting 구현 중*/}
                <Stack.Screen name="mypage/profile" options={{ headerShown: false, animation: 'slide_from_right' }} />
                <Stack.Screen name="mypage/friends" options={{ headerShown: false, animation: 'slide_from_right' }} />
                <Stack.Screen name="mypage/setting" options={{ headerShown: false, animation: 'slide_from_right' }} />
                
                <Stack.Screen name="mypage/allergy" options={{ headerShown: false, animation: 'slide_from_right' }} />
                <Stack.Screen name="mypage/health" options={{ headerShown: false, animation: 'slide_from_right' }} />
                <Stack.Screen name="mypage/dislikes" options={{ headerShown: false, animation: 'slide_from_right' }} />
                <Stack.Screen name="mypage/fridge-setting" options={{ headerShown: false, animation: 'slide_from_right' }} />

              </Stack>
            </ThemeProvider>
        </View>
    </SafeAreaProvider>
  );
}
