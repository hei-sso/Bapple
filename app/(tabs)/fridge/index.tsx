// app/(tabs)/fridge/index.tsx

import { Ionicons } from '@expo/vector-icons';
import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Modal 임포트
import IngredientModal from '@/components/IngredientModal';

// Context 임포트
import { Ingredient, Category, FridgeContextType } from '@/context/fridgeContext';

// Mock 데이터
const MOCK_CATEGORIES_DATA = [
  {
    id: 'my_fridge',
    name: '내 냉장고',
    ingredients: [], // 모든 재료를 합산할 자리
  },
  {
    id: 'grains',
    name: '곡물',
    ingredients: [
      { id: 'rice', name: '쌀', category: 'grains' },
      { id: 'flour', name: '밀가루', category: 'grains' },
      { id: 'barley', name: '보리', category: 'grains' },
    ],
  },
  {
    id: 'fruits',
    name: '과일',
    ingredients: [
      { id: 'banana', name: '바나나', category: 'fruits' },
      { id: 'apple', name: '사과', category: 'fruits' },
      { id: 'grape', name: '포도', category: 'fruits' },
    ],
  },
  { id: 'nuts', name: '견과류', ingredients: [] },
  {
    id: 'vegetables',
    name: '채소',
    ingredients: [
      { id: 'cabbage', name: '양배추', category: 'vegetables' },
      { id: 'onion', name: '양파', category: 'vegetables' },
    ],
  },
  {
    id: 'meat_egg',
    name: '정육/가공육/계란',
    ingredients: [
      { id: 'beef', name: '소고기', category: 'meat_egg' },
      { id: 'egg', name: '계란', category: 'meat_egg' },
    ],
  },
  { id: 'milk', name: '유제품/아이스크림', ingredients: [] },
  { id: 'seafood', name: '수산/해산/건어물', ingredients: [] },
  { id: 'seasoning', name: '식용유/조미료', ingredients: [] },
  { id: 'bakery', name: '베이커리', ingredients: [] },
  { id: 'beverages', name: '생수/음료', ingredients: [] },
  { id: 'coffee', name: '커피/차', ingredients: [] },
  { id: 'snack', name: '간식/과자/떡', ingredients: [] },
];

// Fridge Context 생성
const FridgeContext = createContext<FridgeContextType | undefined>(undefined);

// Fridge Context를 사용하는 커스텀 훅
const useFridge = () => {
  const context = useContext(FridgeContext);
  if (!context) {
    throw new Error('useFridge must be used within a FridgeProvider');
  }
  return context;
};

// 냉장고 상태 관리 Provider
const FridgeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('my_fridge');
  // 초기 냉장고 재료 상태 (현재는 빈 배열로 시작)
  const [myFridgeIngredients, setMyFridgeIngredients] = useState<Ingredient[]>([]);

  // 'my_fridge'를 제외한 모든 카테고리 (UI용)
  const allCategories = useMemo(() => {
    // 나중에 DB 적용할 예정 (initialData 계산 로직 제거 -> MOCK_CATEGORIES_DATA 직접 사용)
    return MOCK_CATEGORIES_DATA;
  }, []);

  // 재료 추가 함수
  const addIngredient = useCallback((ingredient: Ingredient) => {
    setMyFridgeIngredients(prev => {
      // 중복 추가 방지
      if (!prev.find(item => item.id === ingredient.id)) {
        return [...prev, ingredient];
      }
      return prev;
    });
  }, []);

  // 재료 삭제 함수
  const removeIngredient = useCallback((ingredientId: string) => {
    setMyFridgeIngredients(prev => prev.filter(item => item.id !== ingredientId));
  }, []);

  const contextValue = useMemo(() => ({
    allCategories,
    myFridgeIngredients,
    addIngredient,
    removeIngredient,
    selectedCategory,
    setSelectedCategory,
  }), [allCategories, myFridgeIngredients, addIngredient, removeIngredient, selectedCategory]);

  return (
    <FridgeContext.Provider value={contextValue}>
      {children}
    </FridgeContext.Provider>
  );
};

// 개별 식재료 컴포넌트
const IngredientItem: React.FC<{ ingredient: Ingredient }> = ({ ingredient }) => {
  const { myFridgeIngredients, addIngredient, removeIngredient } = useFridge();
  const [isModalVisible, setIsModalVisible] = useState(false);

  // 현재 재료가 냉장고에 있는지 확인
  const isInFridge = useMemo(
    () => myFridgeIngredients.some(item => item.id === ingredient.id),
    [myFridgeIngredients, ingredient.id]
  );

  // 모달에서 확인 버튼 클릭 시
  const handleConfirm = (ing: Ingredient) => {
    if (isInFridge) {
      removeIngredient(ing.id); // 냉장고에 있으면 삭제
    } else {
      addIngredient(ing); // 없으면 추가
    }
  };

  return (
    <>
      <TouchableOpacity 
        style={styles.ingredientCard}
        onPress={() => setIsModalVisible(true)} // 클릭 시 모달 열기
      >
        {/* 회색 상자 (이미지/아이콘 자리) */}
        <View style={styles.ingredientImagePlaceholder} />
        {/* 식재료 이름 */}
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
      />
    </>
  );
};

// 재료 그리드를 카테고리별로 그룹화하여 표시하는 컴포넌트 (내 냉장고 전용)
const FridgeIngredientGroup: React.FC<{ ingredients: Ingredient[] }> = ({ ingredients }) => {
    
    // 카테고리별로 재료를 그룹화
    const groupedIngredients = useMemo(() => {
        return ingredients.reduce((acc, ingredient) => {
            const categoryName = MOCK_CATEGORIES_DATA.find(cat => cat.id === ingredient.category)?.name || '기타';
            if (!acc[categoryName]) {
                acc[categoryName] = [];
            }
            acc[categoryName].push(ingredient);
            return acc;
        }, {} as { [key: string]: Ingredient[] });
    }, [ingredients]);
    
    // 카테고리 이름 목록 (순서 유지를 위해)
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
                        {groupedIngredients[categoryName].map((ing, index) => (
                            <IngredientItem key={ing.id + index} ingredient={ing} />
                        ))}
                    </View>
                </View>
            ))}
        </>
    );
};

// 여기부터 메인 화면 처리
const FridgeScreenContent = () => {
    const { 
        allCategories, 
        myFridgeIngredients, 
        selectedCategory, 
        setSelectedCategory 
    } = useFridge();
    
    const insets = useSafeAreaInsets();

    // 현재 선택된 카테고리의 식재료 목록을 계산 (내 냉장고가 아닌 경우에만)
    const currentIngredients = useMemo(() => {
        if (selectedCategory === 'my_fridge') {
            // '내 냉장고'는 그룹화된 뷰를 별도로 사용
            return []; 
        }
        const category = allCategories.find(cat => cat.id === selectedCategory);
        return category ? category.ingredients : [];
    }, [selectedCategory, allCategories]);

    // 카테고리 목록 렌더링 함수
    const renderCategoryItem = (category: Category) => {
        const isSelected = category.id === selectedCategory;
        
        // ... (스타일 로직은 동일) ...
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
                            <FridgeIngredientGroup ingredients={myFridgeIngredients} />
                        ) : (
                            // 일반 카테고리인 경우
                            <View style={styles.gridRow}>
                                {currentIngredients.length > 0 ? (
                                    currentIngredients.map((ing, index) => (
                                        <IngredientItem key={ing.id + index} ingredient={ing} />
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

// 메인 Export 컴포넌트: Provider로 감싸기
export default function FridgeScreen() {
    return (
        <FridgeProvider>
            <FridgeScreenContent />
        </FridgeProvider>
    );
}

// 💡스타일 시트💡
const { width } = Dimensions.get('window');
const CATEGORY_WIDTH = width * 0.4; // 왼쪽 카테고리 영역 너비

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#fff',
  },
  searchContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  searchIcon: {
    marginLeft: 10,
  },
  contentArea: {
    flex: 1,
    flexDirection: 'row',
  },
  categoryListContainer: {
    width: CATEGORY_WIDTH,
    backgroundColor: '#f7f7f7',
    borderRightWidth: 1,
    borderRightColor: '#eee',
  },
  categoryListContent: {
    paddingVertical: 10,
  },
  categoryContainer: {
    paddingVertical: 15,
    paddingLeft: 20,
    backgroundColor: '#f7f7f7',
  },
  selectedCategoryContainer: {
    paddingVertical: 15,
    paddingLeft: 20,
    backgroundColor: '#fff',
    borderLeftWidth: 5,
    borderLeftColor: '#404040ff',
  },
  categoryText: {
    fontSize: 16,
    color: '#555',
    fontWeight: '400',
  },
  selectedCategoryText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '700',
  },
  ingredientGridContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 15,
  },
  ingredientGridContent: {
    paddingVertical: 20,
  },
  currentCategoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginRight: -10,
  },
  ingredientCard: {
    // 3열 그리드 레이아웃
    width: (width - CATEGORY_WIDTH - 30) / 3 - 10, 
    marginRight: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  ingredientImagePlaceholder: {
    width: '100%',
    aspectRatio: 1, 
    backgroundColor: '#eee',
    borderRadius: 8,
    marginBottom: 5,
  },
  ingredientName: {
    fontSize: 13,
    color: '#444',
    textAlign: 'center',
    marginTop: 4,
  },
  noIngredientText: {
    fontSize: 16,
    color: '#888',
    marginTop: 20,
    textAlign: 'center',
    width: '100%',
  },
  // --- '내 냉장고' 카테고리 그룹화 관련 스타일 ---
  categoryGroup: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#666',
    marginBottom: 10,
    paddingLeft: 5, // 그리드와 시각적 정렬
  }
});
