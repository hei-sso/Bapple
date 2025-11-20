// constants/styles.ts

import { StyleSheet } from 'react-native';

export const authStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 30,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 5,
  },
  
  // 기타 스타일
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 5,
    color: '#333',
  },
  input: {
    width: '100%',
    height: 50,
    paddingHorizontal: 15,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16,
  },
  
  // 버튼 스타일
  primaryButton: { 
    width: '100%',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    marginTop: 20,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },

  // 이메일로 로그인
  emailButtonText: {
    color: '#fff', 
  },
  placeholderText: {
    color: '#999',
    fontSize: 12,
  }
});
