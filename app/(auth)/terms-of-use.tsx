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
          [이용 약관 상세 내용]
          {'\n\n'}
          Bapple 서비스 이용에 대한 기본 약관입니다.
          {'\n\n'}... (약관 내용 생략) ...
        </Text>
      </ScrollView>
    </View>
  );
}

// 💡스타일 시트💡- privacy-policy.tsx와 같음
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  contentText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
  },
});
