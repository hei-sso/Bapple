// app/_layout.tsx

import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
// Redirect는 JSX에서 사용하지 않지만, 타입 RedirectProps는 유지
import { Stack, RedirectProps, useRouter } from 'expo-router'; 
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, useCallback } from 'react';
import 'react-native-reanimated';
import { View } from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';

// ErrorBoundary를 사용하여 상위 컴포넌트(여기서는 _layout.tsx)에서 발생하는 렌더링 오류 등을 처리
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

  // 3. 초기 로딩 작업 및 인증 체크
  useEffect(() => {
    async function prepare() {
      if (fontsLoaded) {
         try {
          // =========================================================
          // 💡 [추후 백엔드 연동] 이 부분을 실제 로직으로 교체
          // =========================================================
          // 1. 최소 대기 시간을 먼저 확보 (옵션)
          await new Promise(resolve => setTimeout(resolve, 1500)); 

          // 2. [주요 작업] 사용자 토큰을 확인하고 인증 상태를 가져오기
          // import { checkAuthStatus } from '../services/authService';
          // const isUserLoggedIn = await checkAuthStatus(); 

          // 💡 현재는 임의의 값
          const isUserLoggedIn = false; 

          setIsAuthenticated(isUserLoggedIn);
          // =========================================================
        } catch (e) {
          // ... (오류 처리)
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
      // 리디렉션이 시작될 시간을 확보하기 위해 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 100)); 
      await SplashScreen.hideAsync();
    }
  }, [appReady]);

  // 5. 로딩 중에는 null 반환하여 Splash 화면을 유지
  if (!appReady || isAuthenticated === null) {
    return null;
  }

  // 6. 모든 준비가 완료되면 메인 라우터 컴포넌트 렌더링
  return <RootLayoutNav isAuthenticated={isAuthenticated} onLayout={onLayoutRootView} />;
}

// RootLayoutNav 컴포넌트를 분리하여 onLayout prop과 isAuthenticated prop을 받도록 수정
function RootLayoutNav({ isAuthenticated, onLayout }: { isAuthenticated: boolean, onLayout: () => Promise<void> }) {
  const colorScheme = useColorScheme();
  const router = useRouter(); // useRouter 훅을 사용
  
  // useEffect로 네비게이션 강제
  useEffect(() => {
    // appReady 상태가 true임을 전제함
    const targetRoute = isAuthenticated ? '/(tabs)/home' : '/welcome';
    
    // 불필요한 히스토리를 남기지 않고 목표 경로로 이동
    // 💡 라우팅 스택 충돌을 피하고 바로 원하는 화면으로 진입
    router.replace(targetRoute as RedirectProps['href']);
    
    // 이펙트는 컴포넌트 마운트 시 한 번만 실행
  }, [isAuthenticated]); // isAuthenticated가 변경될 때마다 실행되도록 설정 (실제 로그인/로그아웃 로직 대비)

  return (
    <SafeAreaProvider> 
        <View style={{ flex: 1 }} onLayout={onLayout}>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <Stack>

                {/* Redirect가 동작하면 아래의 스크린 정의 중 해당 경로로 이동함 */}
                <Stack.Screen name="welcome" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="modal" options={{ presentation: 'modal' }} />

                {/* 그룹 내 개별 파일을 Stack.Screen으로 등록 + 탭 바에 안나오게 따로 분리한 애들 등록 */}
                <Stack.Screen name="(auth)/login" options={{ headerShown: false, animation: 'slide_from_right' }} />
                <Stack.Screen name="(auth)/register" options={{ headerShown: false, animation: 'slide_from_right' }} />
                <Stack.Screen name="(auth)/set-password" options={{ headerShown: false, animation: 'slide_from_right' }} />
                <Stack.Screen name="(auth)/privacy-policy" options={{ headerShown: false, presentation: 'modal' }} />
                <Stack.Screen name="(auth)/terms-of-use" options={{ headerShown: false, presentation: 'modal' }} />

                <Stack.Screen name="home/detail" options={{ headerShown: false, animation: 'slide_from_right' }} />

              </Stack>
            </ThemeProvider>
        </View>
    </SafeAreaProvider>
  );
}