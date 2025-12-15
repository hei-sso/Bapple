// app/_layout.tsx

import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import * as Linking from 'expo-linking';
import { RedirectProps, Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Context
import { AuthProvider, useAuth } from '@/context/authContext';

// ErrorBoundary
export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// [수정 1] preventAutoHideAsync 호출 시 에러가 발생해도 무시하도록 catch 추가
SplashScreen.preventAutoHideAsync().catch(() => {
  // 이미 숨겨졌거나 네이티브 설정 문제로 인한 에러 무시
});

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
          // 최소 대기 시간
          await new Promise(resolve => setTimeout(resolve, 1500)); 

          // 임시 로그인 로직
          const isUserLoggedIn = false; 
          setIsAuthenticated(isUserLoggedIn);

        } catch (e) {
          setIsAuthenticated(false);
        } finally {
          setAppReady(true);
        }
      }
    }

    prepare();
  }, [fontsLoaded]);

  // [수정 2] hideAsync 호출 시 try-catch로 감싸서 크래시 방지
  const onLayoutRootView = useCallback(async () => {
    if (appReady) {
      try {
        await new Promise(resolve => setTimeout(resolve, 100)); 
        await SplashScreen.hideAsync();
      } catch (e) {
        // "No native splash screen registered" 에러가 발생해도 앱이 꺼지지 않도록 무시
        console.warn("Splash hide error (safe to ignore):", e);
      }
    }
  }, [appReady]);

  // 5. 로딩 중에는 null 반환
  if (!appReady || isAuthenticated === null) {
    return null;
  }

  // 딥링크 핸들러
  const DeepLinkHandler = () => {
    const { signIn } = useAuth();
    const router = useRouter();
    
    useEffect(() => {
        const handleDeepLink = ({ url }: { url: string }) => {
            const urlObj = Linking.parse(url);
            
            if (urlObj.path === 'auth/kakao/success') {
                const token = urlObj.queryParams?.token as string | undefined;
                if (token) {
                    console.log("✅ DeepLink: Final Access Token Received.");
                    signIn(token, "");
                }
            } else if (urlObj.path === 'auth/kakao/fail') {
                console.error("❌ DeepLink: Kakao Login Failed by Backend.");
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
    }, [signIn]);

    return null;
  };
    
  // 6. 메인 렌더링
  return (
      <AuthProvider> 
          <DeepLinkHandler /> 
        <RootLayoutNav isAuthenticated={isAuthenticated} onLayout={onLayoutRootView} />
      </AuthProvider>
  );
}

// 네비게이션 컴포넌트
function RootLayoutNav({ isAuthenticated, onLayout }: { isAuthenticated: boolean, onLayout: () => Promise<void> }) {
  const router = useRouter(); 
  
  useEffect(() => {
    const targetRoute = isAuthenticated ? '/(tabs)/home' : '/welcome';
    router.replace(targetRoute as RedirectProps['href']);
  }, [isAuthenticated]); 

  return (
    <SafeAreaProvider> 
        <View style={{ flex: 1 }} onLayout={onLayout}>
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
