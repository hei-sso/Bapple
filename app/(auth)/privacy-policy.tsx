// app/(auth)/privacy-policy.tsx

import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
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
          [개인정보 처리방침 상세 내용]
          {'\n\n'}
          Bapple은 사용자 개인정보 보호를 최우선으로 합니다.
          본 약관은 2024년 10월 17일부터 시행됩니다.
          {'\n\n'}... (약관 내용 생략) ...
        </Text>
      </ScrollView>
    </View>
  );
}

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
    color: '#007AFF', // iOS 기본 버튼 색상
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