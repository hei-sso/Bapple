// components/GroupCreationModal.tsx

import { AlertCircle, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

// Context
import { useGroups } from '@/context/groupContext';

// Type
import type { GroupCreationData } from '@/types/groupTypes';

interface GroupCreationModalProps {
    isVisible: boolean;
    onClose: () => void;
    initialMode: 'create' | 'join'; // 초기 모드 설정
}

const MAX_NAME_LENGTH = 15;
const MAX_DESC_LENGTH = 30;

const GroupCreationModal: React.FC<GroupCreationModalProps> = ({
    isVisible,
    onClose,
    initialMode,
}) => {
    const { createGroup, joinGroup, isLoading: contextLoading } = useGroups();
    const [mode, setMode] = useState(initialMode);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isFridgeShared, setIsFridgeShared] = useState<'all' | 'owner_only'>('all'); // 기본: 모두 공개
    const [inviteCode, setInviteCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isLoading = isSubmitting || contextLoading;

    // 모드 변경 시 상태 초기화
    React.useEffect(() => {
        setMode(initialMode);
        setName('');
        setDescription('');
        setInviteCode('');
        setIsFridgeShared('all');
        setIsSubmitting(false);
    }, [initialMode, isVisible]);

    // 그룹 생성 핸들러
    const handleCreate = async () => {
        if (!name.trim() || !description.trim()) {
            Alert.alert('경고', '그룹 이름과 소개를 입력해주세요.');
            return;
        }

        setIsSubmitting(true);
        try {
            const data: GroupCreationData = {
                name: name.trim(),
                description: description.trim(),
                isFridgeShared,
            };
            await createGroup(data);
            onClose(); // 성공 시 모달 닫기
        } catch (error) {
            // Context에서 Alert 처리됨
        } finally {
            setIsSubmitting(false);
        }
    };

    // 그룹 가입 핸들러
    const handleJoin = async () => {
        if (!inviteCode.trim()) {
            Alert.alert('경고', '초대 코드를 입력해주세요.');
            return;
        }

        setIsSubmitting(true);
        try {
            await joinGroup(inviteCode.trim());
            onClose(); // 성공 시 모달 닫기
        } catch (error) {
            // Context에서 Alert 처리됨
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderModeToggle = (current: 'create' | 'join', label: string) => (
        <TouchableOpacity
            style={[styles.modeButton, mode === current && styles.modeButtonActive]}
            onPress={() => setMode(current)}
            disabled={isLoading}
        >
            <Text style={[styles.modeButtonText, mode === current && styles.modeButtonTextActive]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    
                    {/* 닫기 버튼 */}
                    <TouchableOpacity style={styles.closeButton} onPress={onClose} disabled={isLoading}>
                        <X size={24} color="#000" />
                    </TouchableOpacity>

                    {/* 모드 토글 */}
                    <View style={styles.modeToggleContainer}>
                        {renderModeToggle('create', '새 그룹 생성')}
                        {renderModeToggle('join', '그룹 초대 코드 입력')}
                    </View>
                    
                    <ScrollView contentContainerStyle={{paddingVertical: 10}}>

                    {/* 그룹 생성 모드 */}
                    {mode === 'create' && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>그룹 정보 설정</Text>
                            
                            <TextInput
                                style={styles.input}
                                placeholder="그룹 이름 (최대 15자)"
                                placeholderTextColor={"#A9A9A9"}
                                value={name}
                                onChangeText={(text) => setName(text.slice(0, MAX_NAME_LENGTH))}
                                maxLength={MAX_NAME_LENGTH}
                                editable={!isLoading} // 로딩 중이 아닐 때만 편집 가능
                            />
                             <TextInput
                                style={styles.input}
                                placeholder="한 줄 소개 (최대 30자)"
                                placeholderTextColor={"#A9A9A9"}
                                value={description}
                                onChangeText={(text) => setDescription(text.slice(0, MAX_DESC_LENGTH))}
                                maxLength={MAX_DESC_LENGTH}
                                editable={!isLoading} // 로딩 중이 아닐 때만 편집 가능
                            />
                            
                            <Text style={styles.settingLabel}>냉장고 공유 설정:</Text>
                            <View style={styles.radioContainer}>
                                <TouchableOpacity 
                                    style={[styles.radioOption, isFridgeShared === 'all' && styles.radioOptionActive]}
                                    onPress={() => setIsFridgeShared('all')}
                                    disabled={isLoading}
                                >
                                    <Text style={styles.radioText}>전체 멤버 냉장고 공개</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.radioOption, isFridgeShared === 'owner_only' && styles.radioOptionActive]}
                                    onPress={() => setIsFridgeShared('owner_only')}
                                    disabled={isLoading}
                                >
                                    <Text style={styles.radioText}>방장 냉장고만 공개</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.infoBox}>
                                <AlertCircle size={16} color="#333" />
                                <Text style={styles.infoText}>그룹 인원은 최소 2명, 최대 10명입니다.</Text>
                            </View>

                            <TouchableOpacity 
                                style={[styles.confirmButton, isLoading && styles.confirmButtonDisabled]}
                                onPress={handleCreate}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.confirmButtonText}>그룹 생성하기</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* 그룹 가입 모드 */}
                    {mode === 'join' && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>초대 코드로 그룹 가입</Text>
                            
                            <TextInput
                                style={styles.input}
                                placeholder="그룹 초대 코드 입력"
                                placeholderTextColor={"#A9A9A9"}
                                value={inviteCode}
                                onChangeText={setInviteCode}
                                autoCapitalize="characters"
                                editable={!isLoading} // 로딩 중이 아닐 때만 편집 가능
                            />
                            
                            <TouchableOpacity 
                                style={[styles.confirmButton, isLoading && styles.confirmButtonDisabled]}
                                onPress={handleJoin}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.confirmButtonText}>그룹 가입하기</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

// 🎨 스타일 시트
const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)'
    },
    modalView: {
        width: '90%',
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        maxHeight: '80%'
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 10,
        padding: 5
    },
    modeToggleContainer: {
        flexDirection: 'row',
        width: '100%',
        marginTop: 35,
        marginBottom: 20,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
        padding: 3
    },
    modeButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 6,
        alignItems: 'center'
    },
    modeButtonActive: {
        backgroundColor: '#404040ff'
    },
    modeButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666'
    },
    modeButtonTextActive: {
        color: 'white'
    },
    section: {
        width: '100%',
        paddingTop: 10
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
        textAlign: 'center'
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
        fontSize: 16,
        backgroundColor: '#fff'
    },
    settingLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 10,
        marginBottom: 8,
        color: '#444'
    },
    radioContainer: {
        marginBottom: 15
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        marginBottom: 8,
        backgroundColor: '#f9f9f9'
    },
    radioOptionActive: {
        backgroundColor: '#e6ffe6', // 밝은 녹색 계열
        borderColor: '#4CAF50'
    },
    radioText: {
        fontSize: 14,
        color: '#333'
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff3cd',
        padding: 10,
        borderRadius: 8,
        marginBottom: 20
    },
    infoText: {
        fontSize: 14,
        color: '#856404',
        marginLeft: 8
    },
    confirmButton: {
        backgroundColor: '#404040ff',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center'
    },
    confirmButtonDisabled: {
        backgroundColor: '#aaa'
    },
    confirmButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold'
    }
});

export default GroupCreationModal;
