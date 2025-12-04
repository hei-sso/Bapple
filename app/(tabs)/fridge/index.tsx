// app/(tabs)/fridge/index.tsx

import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Components
import IngredientModal from '@/components/IngredientModal';

// Context
import { FridgeProvider, useFridge } from '@/context/fridgeContext';

// Type
import type { Category, Ingredient } from '@/types/fridgeTypes';


// 식재료 아이템 컴포넌트
const IngredientItem: React.FC<{ ingredient: Ingredient }> = ({ ingredient }) => {
  const { myFridgeIngredients, addIngredient, removeIngredient, isLoading: isContextLoading } = useFridge();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false); 

  // 1. 이 재료가 내 냉장고에 있는지 확인 (ingredient_id로 비교)
  // 리스트의 아이템이 '전체목록'에서 왔다면 id가 재료ID이고, '내 냉장고'에서 왔다면 ingredient_id가 재료ID임
  const matchedFridgeItem = useMemo(() => {
    const targetIngredientId = (ingredient as any).ingredient_id || ingredient.id;
    return myFridgeIngredients.find(item => (item as any).ingredient_id === targetIngredientId);
  }, [myFridgeIngredients, ingredient]);

  const isInFridge = !!matchedFridgeItem;

  const handleConfirm = async (ing: Ingredient) => {
    setIsActionLoading(true);
    try {
      if (isInFridge && matchedFridgeItem) {
        // 삭제 시: 냉장고 테이블의 PK(id)를 사용하여 삭제
        await removeIngredient(matchedFridgeItem.id);
      } else {
        // 추가 시: 재료 정보 그대로 전달
        await addIngredient(ing);
      }
      setIsModalVisible(false);
    } catch (e) {
      console.error("작업 실패:", e);
    } finally {
      setIsActionLoading(false);
    }
  };
    
  const isDisabled = isActionLoading || isContextLoading;

  return (
    <>
      <TouchableOpacity 
        style={styles.ingredientCard}
        onPress={() => setIsModalVisible(true)} 
        disabled={isDisabled}
      >
        <View style={[
          styles.ingredientImagePlaceholder,
          isInFridge && { borderWidth: 2, borderColor: '#404040ff' } // 냉장고에 있으면 테두리 표시 (옵션)
        ]} />
        <Text style={styles.ingredientName} numberOfLines={1}>
          {ingredient.name}
        </Text>
      </TouchableOpacity>

      <IngredientModal
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        ingredient={ingredient}
        isInFridge={isInFridge}
        onConfirm={handleConfirm}
        isLoading={isActionLoading}
      />
    </>
  );
};

// 재료 그리드를 카테고리별로 그룹화하여 표시하는 컴포넌트
const FridgeIngredientGroup: React.FC<{ ingredients: Ingredient[]; allCategories: Category[] }> = ({ ingredients, allCategories }) => {
    
  const groupedIngredients = useMemo(() => {
    return ingredients.reduce((acc, ingredient) => {
      const categoryName = allCategories.find(cat => cat.id === ingredient.category)?.name || '기타'; 
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(ingredient);
      return acc;
    }, {} as { [key: string]: Ingredient[] });
  }, [ingredients, allCategories]);
  
  const categoryNames = Object.keys(groupedIngredients);
  
  if (ingredients.length === 0) {
    return (
      <Text style={styles.noIngredientText}>
        냉장고에 등록된 재료가 없습니다.
      </Text>
    );
  }

  return (
    <>
      {categoryNames.map(categoryName => (
        <View key={categoryName} style={styles.categoryGroup}>
          <Text style={styles.groupTitle}>{categoryName}</Text>
          <View style={styles.gridRow}>
            {groupedIngredients[categoryName].map((ing) => (
              // key에서 index 제거하고 고유 ID 사용
              <IngredientItem key={ing.id} ingredient={ing} />
            ))}
          </View>
        </View>
      ))}
    </>
  );
};

// 메인 화면 처리
const FridgeScreenContent = () => {
  const { 
    allCategories, 
    myFridgeIngredients, 
    selectedCategory, 
    setSelectedCategory,
    isLoading, 
    isError,   
    refetchData 
  } = useFridge();
    
  const insets = useSafeAreaInsets();

  const currentIngredients = useMemo(() => {
    if (selectedCategory === 'my_fridge') {
      return []; 
    }
    const category = allCategories.find(cat => cat.id === selectedCategory);
    return category ? category.ingredients : [];
  }, [selectedCategory, allCategories]);
    
  // 로딩 UI
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centeredLoading, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#404040ff" />
        <Text style={styles.loadingText}>냉장고 데이터 불러오는 중...</Text>
      </View>
    );
  }

  // 오류 UI
  if (isError) {
    return (
      <View style={[styles.container, styles.centeredLoading, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>데이터 로드에 실패했습니다.</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={refetchData}>
          <Text style={styles.refreshButtonText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderCategoryItem = (category: Category) => {
    const isSelected = category.id === selectedCategory;

    const categoryTextStyle = isSelected
      ? styles.selectedCategoryText
      : styles.categoryText;
    
    const categoryContainerStyle = isSelected
      ? styles.selectedCategoryContainer
      : styles.categoryContainer;

    return (
      <TouchableOpacity
        key={category.id}
        style={categoryContainerStyle}
        onPress={() => setSelectedCategory(category.id)}
      >
        <Text style={categoryTextStyle}>{category.name}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 검색 영역 */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <TextInput
              style={styles.searchInput}
              placeholder="검색"
              placeholderTextColor="#888"
          />
          <Ionicons name="search" size={20} color="#000" style={styles.searchIcon} /> 
        </View>
      </View>

      {/* 카테고리 + 식재료 그리드 */}
      <View style={styles.contentArea}>
        
        {/* 왼쪽: 카테고리 목록 */}
        <View style={styles.categoryListContainer}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.categoryListContent}
          >
            {allCategories.map(renderCategoryItem)}
          </ScrollView>
        </View>

        {/* 오른쪽: 식재료 그리드 */}
        <View style={styles.ingredientGridContainer}>
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.ingredientGridContent}
          >
            <Text style={styles.currentCategoryTitle}>
                {allCategories.find(c => c.id === selectedCategory)?.name || '카테고리'}
            </Text>
              
            {/* '내 냉장고' 카테고리인 경우 */}
            {selectedCategory === 'my_fridge' ? (
              <FridgeIngredientGroup ingredients={myFridgeIngredients} allCategories={allCategories} /> 
            ) : (
              // 일반 카테고리인 경우
              <View style={styles.gridRow}>
                {currentIngredients.length > 0 ? (
                  currentIngredients.map((ing) => (
                    // key에서 index 제거하고 고유 ID 사용
                    <IngredientItem key={ing.id} ingredient={ing} />
                  ))
                ) : (
                  <Text style={styles.noIngredientText}>
                    이 카테고리에 등록된{"\n"}재료가 없습니다.
                  </Text>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

// 메인 컴포넌트: Provider로 감싸기
export default function FridgeScreen() {
  return (
    <FridgeProvider>
      <FridgeScreenContent />
    </FridgeProvider>
  );
}

// 🎨 스타일 시트
const { width } = Dimensions.get('window');
const CATEGORY_WIDTH = width * 0.4; 

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#fff'
  },
  centeredLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666'
  },
  errorText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#D32F2F',
    textAlign: 'center',
    marginBottom: 15
  },
  refreshButton: {
    backgroundColor: '#404040ff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  searchContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff'
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 40
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000'
  },
  searchIcon: {
    marginLeft: 10
  },
  contentArea: {
    flex: 1,
    flexDirection: 'row'
  },
  categoryListContainer: {
    width: CATEGORY_WIDTH,
    backgroundColor: '#f7f7f7',
    borderRightWidth: 1,
    borderRightColor: '#eee'
  },
  categoryListContent: {
    paddingVertical: 10
  },
  categoryContainer: {
    paddingVertical: 15,
    paddingLeft: 20,
    backgroundColor: '#f7f7f7'
  },
  selectedCategoryContainer: {
    paddingVertical: 15,
    paddingLeft: 20,
    backgroundColor: '#fff',
    borderLeftWidth: 5,
    borderLeftColor: '#404040ff'
  },
  categoryText: {
    fontSize: 16,
    color: '#555',
    fontWeight: '400'
  },
  selectedCategoryText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '700'
  },
  ingredientGridContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 15
  },
  ingredientGridContent: {
    paddingVertical: 20
  },
  currentCategoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginRight: -10
  },
  ingredientCard: {
    width: (width - CATEGORY_WIDTH - 30) / 3 - 10, 
    marginRight: 10,
    marginBottom: 15,
    alignItems: 'center'
  },
  ingredientImagePlaceholder: {
    width: '100%',
    aspectRatio: 1, 
    backgroundColor: '#eee',
    borderRadius: 8,
    marginBottom: 5
  },
  ingredientName: {
    fontSize: 13,
    color: '#444',
    textAlign: 'center',
    marginTop: 4
  },
  noIngredientText: {
    fontSize: 16,
    color: '#888',
    marginTop: 20,
    textAlign: 'center',
    width: '100%'
  },
  categoryGroup: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#666',
    marginBottom: 10,
    paddingLeft: 5
  }
});
