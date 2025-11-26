// components/RecipeModal.tsx

import React from 'react';
import { Modal, Text, TouchableOpacity, View, StyleSheet } from 'react-native';

// Context 임포트
import { Recipe } from '@/context/recipeContext';

interface RecipeModalProps {
  isVisible: boolean;
  onClose: () => void;
  recipe: Recipe | null; // 현재 선택된 레시피
  isFavorite: boolean; // 찜 목록에 있는지 여부
  onConfirm: (recipe: Recipe) => void; // 확인 버튼 클릭 시 실행할 함수
}

const RecipeModal: React.FC<RecipeModalProps> = ({
  isVisible,
  onClose,
  recipe,
  isFavorite,
  onConfirm,
}) => {
  if (!recipe) return null;

  const actionText = isFavorite ? '삭제' : '찜';
  const message = isFavorite
    ? `'${recipe.name}'을(를) 찜 목록에서 삭제하시겠습니까?`
    : `'${recipe.name}'을(를) 찜 목록에 추가하시겠습니까?`;
  
  const confirmHandler = () => {
    onConfirm(recipe);
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
            {/* 확인 (찜/삭제) 버튼 */}
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
    backgroundColor: 'rgba(0,0,0,0.5)', // 어두운 배경
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
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%', // 모달 너비
  },
  modalText: {
    marginBottom: 25,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    borderRadius: 5,
    padding: 10,
    elevation: 2,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  buttonClose: {
    backgroundColor: '#999',
  },
  buttonConfirm: {
    backgroundColor: '#ff69b4', // 핑크색 (찜 강조 색상)
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 15,
  },
});

export default RecipeModal;
