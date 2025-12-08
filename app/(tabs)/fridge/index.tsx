// app/(tabs)/fridge/index.tsx

import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
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
  const { myFridgeIngredients, addIngredient, removeIngredient } = useFridge();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false); 

  // 1. 이 재료가 내 냉장고에 있는지 확인 (ingredient.id로 비교)
  const isInFridge = useMemo(
    () => myFridgeIngredients.some(item => item.id === ingredient.id),
    [myFridgeIngredients, ingredient.id]
  );

  // 2. 모달에서 확인 버튼 클릭 시 (비동기 처리)
  const handleConfirm = useCallback(async (ing: Ingredient) => {
    setIsActionLoading(true);
    try {
      if (isInFridge) {
        await removeIngredient(ing.id); // Context의 removeIngredient는 ingredientId를 받음
      } else {
        await addIngredient(ing);
      }
      setIsModalVisible(false); // 성공 시에만 모달 닫기

    } catch (error) {
      // Alert 처리는 Context에서 진행됨
    } finally {
      setIsActionLoading(false);
    }
  }, [isInFridge, addIngredient, removeIngredient]);

  return (
    <>
      <TouchableOpacity 
        style={styles.ingredientCard}
        onPress={() => setIsModalVisible(true)}
      >
        {/* 회색 상자 (이미지/아이콘 자리) */}
        <View style={styles.ingredientImagePlaceholder} />
        {/* 냉장고 아이콘 (옵션) */}
        {isInFridge && (
          <View style={styles.fridgeIcon}>
            <Ionicons name="leaf" size={20} color="#60c04f" /> 
          </View>
        )}
        {/* 재료 이름 */}
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

// 내 냉장고 재료를 카테고리별로 그룹화하여 표시하는 컴포넌트
const MyFridgeGroup: React.FC<{ ingredients: Ingredient[], allCategories: Category[] }> = ({ ingredients, allCategories }) => {
    
  // 카테고리별로 재료를 그룹화
  const groupedIngredients = useMemo(() => {
    // ingredients는 (id, name, category) 속성을 가진 Ingredient 객체여야 함
    return ingredients.reduce((acc, ingredient) => {
      // ingredient.category (카테고리 ID)를 사용하여 카테고리 이름 찾기
      const categoryName = allCategories.find(cat => cat.id === ingredient.category)?.name || '기타';
      
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(ingredient);
      return acc;
    }, {} as { [key: string]: Ingredient[] });
  }, [ingredients, allCategories]);
    
  // 카테고리 이름 목록
  const categoryNames = allCategories
    .filter(cat => cat.id !== 'my_fridge' && groupedIngredients[cat.name])
    .map(cat => cat.name);
    
  if (ingredients.length === 0) {
    return (
      <Text style={styles.noIngredientText}>
        냉장고에 등록된 재료가{"\n"}없습니다.
      </Text>
    );
  }

  return (
    // Key 오류 방지를 위해 최상위 View 사용
    <View> 
      {categoryNames.map(categoryName => (
        <View key={categoryName} style={styles.categoryGroup}>
          <Text style={styles.groupTitle}>{categoryName}</Text>
          <View style={styles.gridRow}>
            {groupedIngredients[categoryName].map((ing) => (
              <IngredientItem key={ing.id} ingredient={ing} />
            ))}
          </View>
        </View>
      ))}
    </View>
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
    refetchData,
  } = useFridge();
  
  const insets = useSafeAreaInsets();
  
  // 새로고침 핸들러
  const onRefresh = useCallback(() => {
    refetchData();
  }, [refetchData]);

  // 현재 선택된 카테고리의 재료 목록을 계산
  const currentIngredients = useMemo(() => {
    if (selectedCategory === 'my_fridge') {
      return []; 
    }
    const category = allCategories.find(cat => cat.id === selectedCategory);
    return category ? category.ingredients : [];
  }, [selectedCategory, allCategories]);

  // 카테고리 목록 렌더링 함수
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
        disabled={isLoading} 
      >
        <Text style={categoryTextStyle}>{category.name}</Text>
      </TouchableOpacity>
    );
  };

  // 로딩 및 에러 UI 처리
  if (isError) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={50} color="#ff3b30" />
        <Text style={styles.errorText}>데이터 로드에 실패했습니다.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetchData}>
          <Text style={styles.retryButtonText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading && allCategories.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#404040ff" />
        <Text style={styles.loadingText}>식재료를 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 검색 영역 */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <TextInput
            style={styles.searchInput}
            placeholder="검색"
            placeholderTextColor="#888"
            editable={!isLoading} 
          />
          <Ionicons name="search" size={20} color="#000" style={styles.searchIcon} /> 
        </View>
      </View>

      {/* 카테고리 + 재료 그리드 */}
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

        {/* 오른쪽: 재료 그리드 */}
        <View style={styles.ingredientGridContainer}>
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.ingredientGridContent}
            refreshControl={ 
              <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
            }
          >
            <Text style={styles.currentCategoryTitle}>
              {allCategories.find(c => c.id === selectedCategory)?.name || '카테고리'}
            </Text>
              
            {/* 로딩 인디케이터 (데이터 로드 후 새로고침 시) */}
            {isLoading && allCategories.length > 0 && (
                <ActivityIndicator size="small" color="#404040ff" style={{ marginVertical: 10 }} />
            )}

            {/* '내 냉장고' 카테고리인 경우 */}
            {selectedCategory === 'my_fridge' ? (
              <MyFridgeGroup ingredients={myFridgeIngredients} allCategories={allCategories} />
            ) : (
              // 일반 카테고리인 경우
              <View style={styles.gridRow}>
                {currentIngredients.length > 0 ? (
                  currentIngredients.map((ing) => (
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666'
  },
  errorText: {
    marginTop: 10,
    fontSize: 18,
    color: '#ff3b30',
    fontWeight: '600'
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#404040ff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },

  // 검색 바
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

  // 메인 컨텐츠
  contentArea: {
    flex: 1,
    flexDirection: 'row'
  },

  // 왼쪽: 카테고리 목록
  categoryListContainer: {
    width: CATEGORY_WIDTH,
    backgroundColor: '#f7f7f7',
    borderRightWidth: 1,
    borderRightColor: '#eee'
  },
  categoryListContent: {
    paddingVertical: 10,
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

  // 오른쪽: 재료 그리드
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
  fridgeIcon: {
    position: 'absolute',
    top: 5,
    right: 5,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 15,
    padding: 2
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
