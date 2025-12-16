// app/(auth)/terms-of-use.tsx

import { useRouter } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TermsOfUseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      
      {/* 닫기 버튼 */}
      <View style={styles.header}>
        <Text style={styles.title}>이용 약관</Text>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>닫기</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.contentText}>
{`제1조 (목적)
본 약관은 Bapple(이하 “본 서비스”)이 제공하는 AI 기반 레시피 추천 앱 서비스의 이용과 관련하여 이용자와 서비스 제공자 간의 기본적인 사항을 규정함을 목적으로 합니다.

제2조 (서비스 성격 및 고지)
본 서비스는 대학교 프로젝트 결과물로 제작된 비상업적·연구 목적의 애플리케이션입니다.
본 서비스는 실제 상업적 운영을 목적으로 하지 않으며, 서비스의 지속성, 정확성, 완전성을 보장하지 않습니다.
본 약관은 저작권 등록 및 프로젝트 산출물의 형식적 완결성 확보를 목적으로 포함됩니다.

제3조 (용어의 정의)
“이용자”란 본 서비스를 설치·실행하는 모든 자를 의미합니다.
“AI 추천 결과”란 알고리즘에 의해 자동 생성된 레시피 제안 결과를 의미하며, 참고용 정보입니다.
“콘텐츠”란 텍스트, 이미지, 데이터, 알고리즘 결과 등을 포함합니다.

제4조 (약관의 효력)
본 약관은 앱 내 화면 또는 연결된 문서를 통해 고지됨으로써 효력을 가집니다.

제5조 (서비스 내용)
본 서비스는 다음 기능을 제공합니다.
  - AI 기반 레시피 추천 기능
  - 재료 및 선호도 입력 기능
  - 카카오 계정을 통한 로그인 기능

제6조 (AI 추천 결과의 한계)
본 서비스가 제공하는 레시피 추천 결과는 의료·영양·건강상 조언이 아닌 참고 정보입니다.
이용자는 개인의 건강 상태, 알레르기 등을 고려하여 스스로 판단하여 이용해야 합니다.
본 서비스는 AI 추천 결과의 정확성 또는 적합성에 대해 어떠한 법적 책임도 부담하지 않습니다.

제7조 (청소년 이용)
본 서비스는 청소년 이용이 가능합니다.
별도의 유해 콘텐츠를 포함하지 않으며, 보호자의 관리 하에 이용을 권장합니다.

제8조 (지식재산권)
본 서비스 및 그 구성 요소에 대한 저작권은 프로젝트 제작자에게 귀속됩니다.
이용자는 비상업적 목적에 한하여 서비스를 이용할 수 있습니다.
서비스의 무단 복제, 배포, 변형, 상업적 이용을 금지합니다.

제9조 (책임의 제한)
본 서비스는 무료로 제공되며, 서비스 이용과 관련하여 발생하는 모든 결과에 대한 책임은 이용자 본인에게 있습니다.
본 서비스는 데이터 손실, 서비스 중단, 오류 등에 대해 책임을 지지 않습니다.

제10조 (준거법)
본 약관은 대한민국 법령을 준거법으로 합니다.

본 약관은 2025년 12월 16일부터 시행됩니다.`}
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
    color: '#007AFF'
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
