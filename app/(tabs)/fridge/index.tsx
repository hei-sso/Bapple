// app/(tabs)/fridge/index.tsx

import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
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

interface Ingredient {
  id: string;
  name: string;
  category: string;
}

interface Category {
  id: string;
  name: string;
  ingredients: Ingredient[];
}

// Mock 데이터
const MOCK_CATEGORIES_DATA: Category[] = [
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
      { id: 'banana', name: '바나나', category: 'fruits_nuts' },
      { id: 'apple', name: '사과', category: 'fruits_nuts' },
      { id: 'grape', name: '포도', category: 'fruits_nuts' },
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

// '내 냉장고' 카테고리에 모든 재료를 합산하는 로직 (useMemo로 처리)
const calculateInitialData = (): Category[] => {
  const allIngredients: Ingredient[] = MOCK_CATEGORIES_DATA.flatMap(
    (cat) => cat.id !== 'my_fridge' ? cat.ingredients : []
  );

  return MOCK_CATEGORIES_DATA.map(cat => {
    if (cat.id === 'my_fridge') {
      // '내 냉장고'는 다른 모든 카테고리의 재료를 포함
      return { ...cat, ingredients: allIngredients };
    }
    return cat;
  });
};

// 개별 식재료 컴포넌트
const IngredientItem: React.FC<{ ingredient: Ingredient }> = ({ ingredient }) => (
  <TouchableOpacity style={styles.ingredientCard}>
    {/* 회색 상자 (이미지/아이콘 자리) */}
    <View style={styles.ingredientImagePlaceholder} />
    {/* 식재료 이름 */}
    <Text style={styles.ingredientName} numberOfLines={1}>
      {ingredient.name}
    </Text>
  </TouchableOpacity>
);

// 여기부터 메인 화면 처리
export default function FridgeScreen() {
  const initialData = useMemo(calculateInitialData, []);
  const [selectedCategory, setSelectedCategory] = useState<string>('my_fridge');

  const insets = useSafeAreaInsets();

  // 현재 선택된 카테고리의 식재료 목록을 계산
  const currentIngredients = useMemo(() => {
    const category = initialData.find(cat => cat.id === selectedCategory);
    return category ? category.ingredients : [];
  }, [selectedCategory, initialData]);

  // 카테고리 목록 렌더링 함수
  const renderCategoryItem = (category: Category) => {
    const isSelected = category.id === selectedCategory;
    
    // 선택된 카테고리 스타일
    const categoryTextStyle = isSelected
      ? styles.selectedCategoryText
      : styles.categoryText;
    
    // 선택된 카테고리 컨테이너 스타일 (흰색 바탕)
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
          {/* Ionicons 사용 */}
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
            {initialData.map(renderCategoryItem)}
          </ScrollView>
        </View>

        {/* 오른쪽: 식재료 그리드 */}
        <View style={styles.ingredientGridContainer}>
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.ingredientGridContent}
          >
            {/* 현재 선택된 카테고리의 재료를 그리드 형태로 표시 */}
            <Text style={styles.currentCategoryTitle}>
                {initialData.find(c => c.id === selectedCategory)?.name || '카테고리'}
            </Text>
            
            <View style={styles.gridRow}>
              {currentIngredients.length > 0 ? (
                currentIngredients.map((ing, index) => (
                  // 그리드 레이아웃을 위해 key prop을 제공
                  <IngredientItem key={ing.id + index} ingredient={ing} />
                ))
              ) : (
                <Text style={styles.noIngredientText}>
                  {selectedCategory === 'my_fridge' 
                    ? '냉장고에 등록된 재료가 없습니다.' 
                    : <>이 카테고리에 등록된{"\n"}재료가 없습니다.</> // 글씨 잘려서
                  }
                </Text>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </View>
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
  // 검색 바
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

  // 메인 컨텐츠
  contentArea: {
    flex: 1,
    flexDirection: 'row',
  },

  // 왼쪽: 카테고리 목록
  categoryListContainer: {
    width: CATEGORY_WIDTH,
    backgroundColor: '#f7f7f7', // 비선택 카테고리의 배경색 (밝은 회색)
    borderRightWidth: 1,
    borderRightColor: '#eee',
  },
  categoryListContent: {
    paddingVertical: 10,
  },
  categoryContainer: {
    paddingVertical: 15,
    paddingLeft: 20,
    backgroundColor: '#f7f7f7', // 비선택 배경색
  },
  selectedCategoryContainer: {
    paddingVertical: 15,
    paddingLeft: 20,
    backgroundColor: '#fff', // 선택된 카테고리 배경색 (흰색)
    borderLeftWidth: 5, // 선택 표시를 위한 왼쪽 바
    borderLeftColor: '#404040ff', // 선택된 카테고리 강조 색상
  },
  categoryText: {
    fontSize: 16,
    color: '#555',
    fontWeight: '400',
  },
  selectedCategoryText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '700', // 볼드체
  },

  // 오른쪽: 식재료 그리드
  ingredientGridContainer: {
    flex: 1,
    backgroundColor: '#fff', // 오른쪽은 흰색 배경
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
    marginRight: -10, // 카드 사이의 간격 상쇄
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
    aspectRatio: 1, // 정사각형
    backgroundColor: '#eee', // 회색 상자
    borderRadius: 8,
    marginBottom: 5,
  },
  ingredientName: {
    fontSize: 13, // 작은 글씨
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
  }
});
