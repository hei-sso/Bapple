// app/(tabs)/mypage/index.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MyPageScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>마이페이지 화면 (MyPage)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
});