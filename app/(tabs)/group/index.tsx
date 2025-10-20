// app/(tabs)/group/index.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function GroupScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>그룹 화면 (Group)</Text>
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