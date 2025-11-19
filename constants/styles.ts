// constants/styles.ts

import { StyleSheet } from 'react-native';

export const authStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 30,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 5,
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
