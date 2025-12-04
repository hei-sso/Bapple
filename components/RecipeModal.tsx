// components/RecipeModal.tsx

import React from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// Context
import { Recipe } from '@/types/recipeTypes';

interface RecipeModalProps {
  isVisible: boolean;
  onClose: () => void;
  recipe: Recipe | null; 
  isFavorite: boolean; 
  // onConfirm 함수: 비동기(Promise 반환)
  onConfirm: (recipe: Recipe) => Promise<void>; 
  isLoading: boolean; // 로딩 상태 추가
}

const RecipeModal: React.FC<RecipeModalProps> = ({
  isVisible,
  onClose,
  recipe,
  isFavorite,
  onConfirm, 
  isLoading, // props로 받기
}) => {
  if (!recipe) return null;

  const actionText = isFavorite ? '삭제' : '찜';
  const message = isFavorite
    ? `'${recipe.name}'을(를) 찜 목록에서 삭제하시겠습니까?`
    : `'${recipe.name}'을(를) 찜 목록에 추가하시겠습니까?`;
  
  // 모달을 즉시 닫지 않음 → 로딩이 끝나고 RecipeItem에서 닫음
  const confirmHandler = () => {
    onConfirm(recipe);
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
            {/* 확인 (찜/삭제) 버튼 */}
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

// 🎨 스타일 시트
const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
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
    width: '80%'
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
    height: 40,
    justifyContent: 'center'
  },
  buttonClose: {
    backgroundColor: '#999'
  },
  buttonConfirm: {
    backgroundColor: '#ff69b4' 
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 15
  }
});

export default RecipeModal;
