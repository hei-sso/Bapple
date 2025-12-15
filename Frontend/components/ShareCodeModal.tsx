// components/ShareCodeModal.tsx

import * as Clipboard from 'expo-clipboard';
import { Copy, X } from 'lucide-react-native';
import React from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

// 초대 코드 공유 모달 컴포넌트
interface ShareCodeModalProps {
    isVisible: boolean;
    onClose: () => void;
    groupName: string;
    inviteCode: string | null;
    isLoading?: boolean; // 로딩 상태 추가 (선택적)
}

const ShareCodeModal: React.FC<ShareCodeModalProps> = ({ 
    isVisible, 
    onClose, 
    groupName, 
    inviteCode,
    isLoading = false // 기본값 false
}) => {
    
    const handleCopy = async () => {
        if (inviteCode) {
            await Clipboard.setStringAsync(inviteCode);
            Alert.alert("복사 완료", `그룹 초대 코드(${inviteCode})가 클립보드에 복사되었습니다.`);
            onClose();
        }
    };
    
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <View style={modalStyles.centeredView}>
                <View style={modalStyles.modalView}>
                    <TouchableOpacity style={modalStyles.closeButton} onPress={onClose}>
                        <X size={24} color="#333" />
                    </TouchableOpacity>

                    <Text style={modalStyles.title}>'{groupName}' 초대하기</Text>
                    
                    {/* 로딩 상태 분기 처리 */}
                    {isLoading ? (
                        <View style={modalStyles.loadingContainer}>
                            <ActivityIndicator size="large" color="#000" />
                            <Text style={modalStyles.loadingText}>초대 코드를 불러오는 중...</Text>
                        </View>
                    ) : !inviteCode ? (
                        <Text style={modalStyles.errorText}>초대 코드를 불러올 수 없습니다.</Text>
                    ) : (
                        <>
                            <Text style={modalStyles.description}>아래 초대 코드를 복사하여 친구에게 전달하고 그룹에 초대하세요.</Text>
                            
                            <View style={modalStyles.codeContainer}>
                                <Text style={modalStyles.codeText}>{inviteCode}</Text>
                                <TouchableOpacity style={modalStyles.copyButton} onPress={handleCopy}>
                                    <Copy size={20} color="#fff" />
                                </TouchableOpacity>
                            </View>
                            
                            <Text style={modalStyles.hintText}>친구는 홈 화면의 그룹 생성/참여 버튼에서 이 코드를 입력하여 참여할 수 있습니다.</Text>
                        </>
                    )}
                </View>
            </View>
        </Modal>
    );
};

// 🎨 스타일 시트
const modalStyles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)'
    },
    modalView: {
        width: '80%',
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 25,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        minHeight: 200 // 모달 높이 고정 (화면 깜빡임 방지)
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        padding: 5
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333'
    },
    description: {
        fontSize: 14,
        textAlign: 'center',
        color: '#666',
        marginBottom: 20
    },
    codeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        padding: 12,
        marginBottom: 20,
        width: '100%',
        justifyContent: 'space-between'
    },
    codeText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
        flex: 1
    },
    copyButton: {
        backgroundColor: '#000',
        padding: 8,
        borderRadius: 6,
        marginLeft: 10
    },
    hintText: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center'
    },
    errorText: {
        fontSize: 16,
        color: '#D32F2F',
        fontWeight: 'bold',
        marginTop: 20
    },
    // 로딩 관련 스타일
    loadingContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center'
    },
    loadingText: {
        marginTop: 15,
        color: '#666',
        fontSize: 14
    }
});

export default ShareCodeModal;
