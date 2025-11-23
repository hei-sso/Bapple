// app/mypage/profile.tsx

import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Style 임포트
import { Header } from '@/components/header'; // 헤더
import { Styles } from '@/constants/styles'; // 공통

const PROFILE_IMAGE_SIZE = 120; // 프로필 사진 크기

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // 폼 상태 (임시)
  const [nickname, setNickname] = useState('apple');
  const [email, setEmail] = useState('apple@imsi.com');
  const [phoneNumber, setPhoneNumber] = useState('010-4568-5678');
  const [birthdate, setBirthdate] = useState('1999/11/17');

  // 이메일 인증 플로우 상태 관리
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verificationCodeSent, setVerificationCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState(''); 

  const handleSaveProfile = () => {
      // 💡[추후 구현] 프로필 변경 사항 저장 로직
      console.log("프로필 저장");
      router.back();
  };

  // 인증번호 발송 핸들러
  const handleSendVerificationCode = async () => {
      if (!email) { Alert.alert("알림", "이메일을 입력해 주세요."); return; }
      setVerificationCodeSent(true); 
      Alert.alert("알림", `${email}로 인증번호가 발송되었습니다.`);
  };

  // 인증번호 확인 핸들러
  const handleVerifyCode = async () => {
      if (!verificationCode) { Alert.alert("알림", "인증번호를 입력해 주세요."); return; }
      setIsEmailVerified(true);
      setVerificationCodeSent(false);
      Alert.alert("인증 완료", "이메일 인증이 성공적으로 완료되었습니다.");
  };

  return (
    <View style={[Styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>

      {/* Header 영역 */}
      <View style={Header.HeaderAlign}>
        <TouchableOpacity onPress={() => router.back()} style={Header.BackButton}>
          <ChevronLeft size={28} color="#000" />
        </TouchableOpacity>
        <Text style={Header.Title}>프로필</Text>
        <TouchableOpacity onPress={handleSaveProfile} style={Header.SaveButton}>
          <Text style={Header.SaveButtonText}>저장</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={Styles.scrollContent}>
              
          {/* 프로필 사진 영역 */}
          <View style={styles.profileImageArea}>
            <View style={styles.profileImagePlaceholder} />
            <TouchableOpacity>
              <Text style={styles.changePhotoButton}>사진 변경하기</Text>
            </TouchableOpacity>
          </View>

          {/* 폼 영역 (회원가입 스타일 재활용) */}

          {/* 닉네임 */}
          <Text style={styles.label}>닉네임</Text>
            <TextInput
                style={styles.input}
                placeholder="Bapple"
                value={nickname}
                onChangeText={setNickname}
                autoCapitalize="none"
            />

          {/* 이메일 입력 및 인증 버튼 컨테이너 */}
          <Text style={styles.label}>이메일</Text>
          <View style={localStyles.inputWithButtonContainer}>
            <TextInput
                style={[styles.input, localStyles.inputField]}
                placeholder="Bapple@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isEmailVerified} // 인증 완료 시 수정 불가
            />
            <TouchableOpacity 
              style={[localStyles.verificationButton, isEmailVerified ? localStyles.verifiedButton : localStyles.unverifiedButton]}
              onPress={handleSendVerificationCode}
              disabled={isEmailVerified}
            >
              <Text style={localStyles.verificationButtonText}>{isEmailVerified ? '인증 완료' : '인증'}</Text>
            </TouchableOpacity>
          </View>

          {/* 인증번호 입력 필드 (발송 후에만 표시) */}
          {verificationCodeSent && !isEmailVerified && (
          <View style={localStyles.verificationInputGroup}>
            <Text style={styles.label}>인증번호</Text>
            <View style={localStyles.inputWithButtonContainer}>
              <TextInput
                style={[styles.input, localStyles.inputField]}
                placeholder="인증번호 6자리 입력"
                value={verificationCode}
                onChangeText={setVerificationCode}
                keyboardType="numeric"
              />
              <TouchableOpacity style={[localStyles.verificationButton, localStyles.unverifiedButton]} onPress={handleVerifyCode}>
                <Text style={localStyles.verificationButtonText}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
          )}

          {/* 전화번호 */}
          <Text style={styles.label}>전화번호</Text>
          <TextInput
            style={styles.input}
            placeholder="010-1234-5678"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />

          {/* 생년월일 */}
          <Text style={styles.label}>생년월일</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY/MM/DD"
            value={birthdate}
            onChangeText={setBirthdate}
            keyboardType="numbers-and-punctuation"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// 💡스타일 시트💡
const styles = StyleSheet.create({
  // 프로필 사진 영역
  profileImageArea: {
    alignItems: 'center',
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderColor: '#eee',
    marginBottom: 20,
  },
  profileImagePlaceholder: {
    width: PROFILE_IMAGE_SIZE,
    height: PROFILE_IMAGE_SIZE,
    borderRadius: PROFILE_IMAGE_SIZE / 2,
    backgroundColor: '#eee', // 회색 배경
    marginBottom: 10,
  },
   changePhotoButton: {
    fontSize: 14,
    color: '#000',
    textDecorationLine: 'underline',
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
});

// 이 아래는 register.tsx의 localStyles 재활용
const localStyles = StyleSheet.create({
  verificationInputGroup: {
    marginTop: -5, 
    marginBottom: 5,
  },
  inputWithButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10, 
  },
  inputField: {
    flex: 1, 
    marginRight: 10,
  },
  verificationButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    height: 50, 
    justifyContent: 'center',
    alignItems: 'center',
    },
    unverifiedButton: {
        backgroundColor: '#000',
    },
    verifiedButton: {
        backgroundColor: '#ccc',
    },
    verificationButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    }
});
