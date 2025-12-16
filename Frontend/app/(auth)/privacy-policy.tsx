// app/(auth)/privacy-policy.tsx

import { useRouter } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      
      {/* 닫기 버튼 */}
      <View style={styles.header}>
        <Text style={styles.title}>개인정보 처리방침</Text>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>닫기</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.contentText}>
{`1. 개인정보 수집 목적 및 성격 고지
본 개인정보 처리방침은 대학교 프로젝트 결과물에 포함되는 형식적 문서이며, 실제 상업적 개인정보 처리 행위를 목적으로 하지 않습니다.

2. 수집하는 개인정보 항목
본 서비스는 카카오 로그인 API를 통해 다음 정보를 수집할 수 있습니다.

  ① 필수 항목
  카카오 계정 고유 식별자
  닉네임(카카오 제공 정보)

  ② 선택 항목
  프로필 사진

3. 개인정보 수집 방법
카카오 로그인 API 연동을 통한 자동 수집

4. 개인정보의 이용 목적
로그인 및 사용자 식별
프로젝트 기능 구현 및 시연

5. 개인정보 보유 및 이용 기간
프로젝트 시연 종료 후 지체 없이 파기
별도의 데이터베이스에 장기 저장하지 않음

6. 개인정보의 제3자 제공
본 서비스는 이용자의 개인정보를 제3자에게 제공하지 않습니다.
단, 로그인 기능 제공을 위해 카카오 API와의 연동은 예외로 합니다.

7. 개인정보 처리 위탁
본 서비스는 개인정보 처리 업무를 외부에 위탁하지 않습니다.

8. 이용자의 권리
이용자는 언제든지 개인정보 삭제를 요청할 수 있으며, 프로젝트 특성상 즉시 반영됩니다.

9. 개인정보 보호 관련 문의
문의처: Bappleproject2025@gmail.com`}
          {'\n\n'}
        </Text>
      </ScrollView>
    </View>
  );
}

// 🎨 스타일 시트
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  closeButton: {
    padding: 5
  },
  closeButtonText: {
    fontSize: 16,
    color: '#007AFF' // iOS 기본 버튼 색상
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 10
  },
  contentText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333'
  }
});
