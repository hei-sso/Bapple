// app/_layout.tsx

import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import * as Linking from 'expo-linking';
import { RedirectProps, Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View, Alert } from 'react-native'; // Alert import 확인
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Context
import { AuthProvider, useAuth } from '@/context/authContext';

// ErrorBoundary
export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// 스플래시 스크린 자동 숨김 방지
SplashScreen.preventAutoHideAsync().catch(() => {});

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

  // 3. 초기 로딩 작업 및 인증 체크
  useEffect(() => {
    async function prepare() {
      if (fontsLoaded) {
        try {
          // 최소 대기 시간 확보 (스플래시 유지)
          await new Promise(resolve => setTimeout(resolve, 1500)); 

          // 임시 로그인 로직 (실제 앱에서는 AuthContext나 SecureStore 체크)
          const isUserLoggedIn = false; 
          setIsAuthenticated(isUserLoggedIn);

        } catch (e) {
          setIsAuthenticated(false);
        } finally {
          // 준비 완료 상태로 변경
          setAppReady(true);
        }
      }
    }
    prepare();
  }, [fontsLoaded]);

  // [수정 핵심] onLayout 대신 useEffect로 변경하여 딱 한 번만 실행되도록 함
  useEffect(() => {
    if (appReady) {
      // 스플래시 숨기기
      const hideSplash = async () => {
        try {
          await SplashScreen.hideAsync();
        } catch (e) {
          // 이미 숨겨졌거나 에러가 나도 무시 (앱 크래시 방지)
          // console.warn("Splash hide error:", e);
        }
      };
      hideSplash();
    }
  }, [appReady]);

  // 4. 로딩 중에는 null 반환
  if (!appReady || isAuthenticated === null) {
    return null;
  }

  // 딥링크 핸들러 컴포넌트
  const DeepLinkHandler = () => {
    const { signIn } = useAuth();
    const router = useRouter();
    
    useEffect(() => {
        const handleDeepLink = ({ url }: { url: string }) => {
            const urlObj = Linking.parse(url);
            
            console.log("🔗 DeepLink URL:", url);

            if (urlObj.path === 'auth/kakao/success') {
                // Access Token 추출
                const rawAccess = urlObj.queryParams?.token || urlObj.queryParams?.accessToken;
                // Refresh Token 추출
                const rawRefresh = urlObj.queryParams?.refreshToken || urlObj.queryParams?.refresh_token;
                
                // 문자열 변환 헬퍼
                const getString = (val: string | string[] | undefined): string => {
                    if (typeof val === 'string') return val;
                    if (Array.isArray(val) && val.length > 0) return val[0];
                    return "";
                };

                const finalAccess = getString(rawAccess);
                const finalRefresh = getString(rawRefresh);

                if (finalAccess) { // Refresh Token은 없을 수도 있으므로 Access만 체크해도 됨 (정책에 따라 다름)
                    console.log("✅ Tokens Received. Logging in...");
                    // signIn 함수에 Access, Refresh 전달 (Refresh 없으면 빈 문자열)
                    signIn(finalAccess, finalRefresh || ""); 
                } else {
                    console.error("❌ Token parameter missing");
                }

            } else if (urlObj.path === 'auth/kakao/fail') {
                console.error("❌ DeepLink: Kakao Login Failed");
                Alert.alert("로그인 실패", "카카오 로그인 중 오류가 발생했습니다.");
                router.replace('/(auth)/login'); 
            }
        };

        const subscription = Linking.addEventListener('url', handleDeepLink);
        
        Linking.getInitialURL().then(initialUrl => {
            if (initialUrl) {
                handleDeepLink({ url: initialUrl });
            }
        });

        return () => subscription.remove();
    }, [signIn, router]);

    return null;
  };

  return (
      <AuthProvider> 
        <DeepLinkHandler /> 
        <RootLayoutNav isAuthenticated={isAuthenticated} />
      </AuthProvider>
  );
}

// [수정] onLayout prop 제거됨
function RootLayoutNav({ isAuthenticated }: { isAuthenticated: boolean }) {
  const router = useRouter(); 
  
  useEffect(() => {
    const targetRoute = isAuthenticated ? '/(tabs)/home' : '/welcome';
    // replace를 사용하여 뒤로가기 방지
    router.replace(targetRoute as RedirectProps['href']);
  }, [isAuthenticated]); 

  return (
    <SafeAreaProvider> 
        {/* View에 onLayout 제거 -> useEffect에서 처리하므로 필요 없음 */}
        <View style={{ flex: 1 }}>
              <Stack>
                <Stack.Screen name="welcome" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

                <Stack.Screen name="(auth)/login" options={{ headerShown: false, animation: 'slide_from_right' }} />
                <Stack.Screen name="(auth)/register" options={{ headerShown: false, animation: 'slide_from_right' }} />
                <Stack.Screen name="(auth)/set-password" options={{ headerShown: false, animation: 'slide_from_right' }} />
                <Stack.Screen name="(auth)/privacy-policy" options={{ headerShown: false, presentation: 'modal' }} />
                <Stack.Screen name="(auth)/terms-of-use" options={{ headerShown: false, presentation: 'modal' }} />
                <Stack.Screen name="(auth)/kakao-webview" options={{ headerShown: false, animation: 'slide_from_right' }} />

                <Stack.Screen name="home/detail" options={{ headerShown: false, animation: 'slide_from_right' }} />

                <Stack.Screen name="mypage/profile" options={{ headerShown: false, animation: 'slide_from_right' }} />
                <Stack.Screen name="mypage/friends" options={{ headerShown: false, animation: 'slide_from_right' }} />
                <Stack.Screen name="mypage/setting" options={{ headerShown: false, animation: 'slide_from_right' }} />
                <Stack.Screen name="mypage/health" options={{ headerShown: false, animation: 'slide_from_right' }} />
                <Stack.Screen name="mypage/fridge-setting" options={{ headerShown: false, animation: 'slide_from_right' }} />

                <Stack.Screen name="group/detail" options={{ headerShown: false, animation: 'slide_from_right' }}/>
                <Stack.Screen name="recipe/detail" options={{ headerShown: false, animation: 'slide_from_right'}}/>
            </Stack>
        </View>
    </SafeAreaProvider>
  );
}
