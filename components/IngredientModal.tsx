// components/IngredientModal.tsx (수정된 최종 코드)

import React from 'react';
import { 
  Modal, 
  Text, 
  TouchableOpacity, 
  View, 
  StyleSheet, 
  ActivityIndicator
} from 'react-native';

// Type
import type { Ingredient } from '@/types/fridgeTypes';

interface IngredientModalProps {
  isVisible: boolean;
  onClose: () => void;
  ingredient: Ingredient | null; // 현재 선택된 재료
  isInFridge: boolean; // 냉장고에 있는지 여부
  // onConfirm 함수 = 비동기 (Promise를 반환)
  onConfirm: (ingredient: Ingredient) => Promise<void>; 
  isLoading: boolean; 
}

const IngredientModal: React.FC<IngredientModalProps> = ({
  isVisible,
  onClose,
  ingredient,
  isInFridge,
  onConfirm,
  isLoading, // props로 받기
}) => {
  if (!ingredient) return null;

  const actionText = isInFridge ? '삭제' : '추가';
  const message = isInFridge
    ? `'${ingredient.name}'을(를) 내 냉장고에서 삭제하시겠습니까?`
    : `'${ingredient.name}'을(를) 내 냉장고에 추가하시겠습니까?`;
  
  // onConfirm 호출 시 모달을 닫지 않음 (API 호출이 성공해야 닫힘)
  // 모달 닫기 로직 → 호출하는 부모 컴포넌트(IngredientItem)가 담당
  const confirmHandler = () => {
    onConfirm(ingredient);
  };

  return (
    <Modal
        animationType="fade"
        transparent={true}
        visible={isVisible}
        onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalText}>{message}</Text>
          <View style={styles.buttonContainer}>
            {/* 닫기 버튼 */}
            <TouchableOpacity
              style={[styles.button, styles.buttonClose]}
              onPress={onClose}
              disabled={isLoading} // 로딩 중 비활성화
            >
              <Text style={styles.textStyle}>닫기</Text>
            </TouchableOpacity>
              
            {/* 확인 (추가/삭제) 버튼 */}
            <TouchableOpacity
              style={[styles.button, styles.buttonConfirm]}
              onPress={confirmHandler}
              disabled={isLoading} // 로딩 중 비활성화
            >
              {/* 로딩 상태에 따라 텍스트 또는 ActivityIndicator 표시 */}
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.textStyle}>{actionText}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)' // 어두운 배경
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%' // 모달 너비
  },
  modalText: {
    marginBottom: 25,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
    color: '#333'
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%'
  },
  button: {
    borderRadius: 5,
    padding: 10,
    elevation: 2,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
    height: 40, // 높이를 고정하여 로딩 인디케이터가 표시되어도 레이아웃이 깨지지 않도록 함
    justifyContent: 'center'
  },
  buttonClose: {
    backgroundColor: '#999'
  },
  buttonConfirm: {
    backgroundColor: '#404040ff' // 강조 색상
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 15
  }
});

export default IngredientModal;
