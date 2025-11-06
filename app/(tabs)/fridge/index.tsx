// app/(tabs)/fridge/index.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function FridgeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>냉장고 화면 (Fridge)</Text>
    </View>
  );
}

// 💡스타일 시트💡
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
