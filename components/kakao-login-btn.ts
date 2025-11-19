// components/kakao-login-btn.ts

import { StyleSheet } from "react-native";

export const KakaoLogin = StyleSheet.create({
  ButtonBackground: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: '#FFD100',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10, // 회원가입 버튼과의 간격
  },
  ButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  Icon: {
    position: 'absolute', 
    left: 15,
  },
  ButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
});
