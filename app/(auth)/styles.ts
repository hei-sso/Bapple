// app/(auth)/styles.ts

import { StyleSheet } from 'react-native';

export const authStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  
  // 공통 헤더 (뒤로 가기 버튼, 제목)
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 10,
  },
  backButtonContainer: {
    paddingHorizontal: 10,
  },
  backButton: {
    fontSize: 28,
    fontWeight: '300',
    color: '#000',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1, 
    marginRight: 38, // backButtonContainer 패딩만큼 상쇄
  },
  
  // 폼 및 기타 스타일
  form: {
    width: '100%',
    marginBottom: 30,
  },
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
  
  // 카카오 버튼 스타일
  kakaoButton: { 
    width: '100%',
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: '#FFD100', 
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10, // 회원가입 버튼과의 간격
  },
  kakaoButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  secondaryButton: {
    backgroundColor: '#000', 
    marginTop: 20,
  },
  secondaryButtonText: {
    color: '#fff', 
  },
  socialLoginPlaceholder: {
    marginTop: 20,
    alignItems: 'center',
  },
  placeholderText: {
    color: '#999',
    fontSize: 12,
  }
});
