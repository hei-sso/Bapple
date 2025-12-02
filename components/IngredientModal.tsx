// components/IngredientModal.tsx

import React from 'react';
import { Modal, Text, TouchableOpacity, View, StyleSheet } from 'react-native';

// Context
import { Ingredient } from '@/context/fridgeContext';

interface IngredientModalProps {
  isVisible: boolean;
  onClose: () => void;
  ingredient: Ingredient | null; // 현재 선택된 재료
  isInFridge: boolean; // 냉장고에 있는지 여부
  onConfirm: (ingredient: Ingredient) => void; // 확인 버튼 클릭 시 실행할 함수
}

const IngredientModal: React.FC<IngredientModalProps> = ({
  isVisible,
  onClose,
  ingredient,
  isInFridge,
  onConfirm,
}) => {
  if (!ingredient) return null;

  const actionText = isInFridge ? '삭제' : '추가';
  const message = isInFridge
    ? `'${ingredient.name}'을(를) 내 냉장고에서 삭제하시겠습니까?`
    : `'${ingredient.name}'을(를) 내 냉장고에 추가하시겠습니까?`;
  
  const confirmHandler = () => {
    onConfirm(ingredient);
    onClose();
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
            >
              <Text style={styles.textStyle}>닫기</Text>
            </TouchableOpacity>
            {/* 확인 (추가/삭제) 버튼 */}
            <TouchableOpacity
              style={[styles.button, styles.buttonConfirm]}
              onPress={confirmHandler}
            >
              <Text style={styles.textStyle}>{actionText}</Text>
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
    alignItems: 'center'
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
