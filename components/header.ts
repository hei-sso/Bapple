// components/header.ts

import { StyleSheet } from 'react-native';

export const Header = StyleSheet.create ({
    HeaderAlign: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingVertical: 15,
        marginBottom: 5,
    },
    Title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
    },
    BackButton: {
        position: 'absolute',
        left: 0,
        top: 18,
    },
    KakaoLoginBackButton: {
        position: 'absolute',
        left: 25,
        top: 10,
    },
    BackText: {
        fontSize: 28,
        fontWeight: '300',
        color: '#000',
    },

    // 프로필 수정 - 저장
    SaveButton: {
        left: 100,
        top: 4
    },
    SaveButtonText: {
        position: 'absolute',
        fontSize: 18,
        color: '#000', 
        fontWeight: 'bold',
    }
});
