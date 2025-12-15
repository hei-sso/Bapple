import { Link, Stack } from 'expo-router';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: '404 Not Found' }} />
      <View style={styles.container}>
        <Text style={styles.title}>존재하지 않는 페이지입니다.</Text>

        <Link href="/(tabs)/home" style={styles.link}>
          <Text style={styles.linkText}>홈 화면으로 이동</Text>
        </Link>
      </View>
    </>
  );
}

// 🎨 스타일 시트
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  link: {
    marginTop: 15,
    paddingVertical: 15
  },
  linkText: {
    fontSize: 14,
    color: '#2e78b7'
  }
});
