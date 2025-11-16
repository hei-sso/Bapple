// app/(tabs)/recipe/index.tsx

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons'; 

interface Recipe {
  id: string;
  name: string;
  category: string;
}

interface Category {
  id: string;
  name: string;
  recipes: Recipe[];
}

// Mock 데이터
const MOCK_CATEGORIES_DATA: Category[] = [
  {
    id: 'my_recipe',
    name: '♡ 찜',
    recipes: [], // 모든 레시피를 합산할 자리
  },
  {
    id: 'KOR',
    name: '한식',
    recipes: [
      { id: 'bibimbap', name: '비빔밥', category: 'KOR' },
      { id: 'kimchi_jjigae', name: '김치찌개', category: 'KOR' },
      { id: 'bulgogi', name: '불고기', category: 'KOR' },
    ],
  },
  {
    id: 'CHN',
    name: '중식',
    recipes: [
      { id: 'jjajangmyeon', name: '짜장면', category: 'CHN' },
      { id: 'jjamppong', name: '짬뽕', category: 'CHN' },
      { id: 'tangsuyuk', name: '탕수육', category: 'CHN' },
    ],
  },
  { 
    id: 'JPN', 
    name: '일식', 
    recipes: [
      { id: 'sushi', name: '초밥', category: 'JPN' },
      { id: 'ramen', name: '라멘', category: 'JPN' },
    ] 
  },
  {
    id: 'WES',
    name: '양식',
    recipes: [
      { id: 'steak', name: '스테이크', category: 'WES' },
      { id: 'pasta', name: '파스타', category: 'WES' },
      { id: 'pizza', name: '피자', category: 'WES' },
    ],
  },
  {
    id: 'Vegan',
    name: '비건',
    recipes: [
      { id: 'tofu_steak', name: '두부 스테이크', category: 'Vegan' },
      { id: 'lentil_soup', name: '렌틸 콩 수프', category: 'Vegan' },
      { id: 'vegan_burger', name: '비건 버거', category: 'Vegan' },
    ],
  },
];

// '찜' 카테고리에 모든 레시피를 합산하는 로직 (useMemo로 처리)
const calculateInitialData = (): Category[] => {
  const allRecipes: Recipe[] = MOCK_CATEGORIES_DATA.flatMap(
    (cat) => cat.id !== 'my_recipe' ? cat.recipes : []
  );

  return MOCK_CATEGORIES_DATA.map(cat => {
    if (cat.id === 'my_fridge') {
      // '찜'은 다른 모든 카테고리의 레시피를 포함
      return { ...cat, recipes: allRecipes };
    }
    return cat;
  });
};

// 개별 레시피 컴포넌트
const RecipeItem: React.FC<{ recipe: Recipe }> = ({ recipe }) => (
  <TouchableOpacity style={styles.recipeCard}>
    {/* 회색 상자 (이미지/아이콘 자리) */}
    <View style={styles.recipeImagePlaceholder} />
    {/* 레시피 이름 */}
    <Text style={styles.recipeName} numberOfLines={1}>
      {recipe.name}
    </Text>
  </TouchableOpacity>
);

// 여기부터 메인 화면 처리
export default function RecipeScreen() {
  const initialData = useMemo(calculateInitialData, []);
  const [selectedCategory, setSelectedCategory] = useState<string>('my_recipe');

  const insets = useSafeAreaInsets();

  // 현재 선택된 카테고리의 레시피 목록을 계산
  const currentRecipes = useMemo(() => {
    const category = initialData.find(cat => cat.id === selectedCategory);
    return category ? category.recipes : [];
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

      {/* 카테고리 + 레시피 그리드 */}
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

        {/* 오른쪽: 레시피 그리드 */}
        <View style={styles.recipeGridContainer}>
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.recipeGridContent}
          >
            {/* 현재 선택된 카테고리의 레시피를 그리드 형태로 표시 */}
            <Text style={styles.currentCategoryTitle}>
                {initialData.find(c => c.id === selectedCategory)?.name || '카테고리'}
            </Text>
            
            <View style={styles.gridRow}>
              {currentRecipes.length > 0 ? (
                currentRecipes.map((ing, index) => (
                  // 그리드 레이아웃을 위해 key prop을 제공
                  <RecipeItem key={ing.id + index} recipe={ing} />
                ))
              ) : (
                <Text style={styles.noRecipeText}>
                  {selectedCategory === 'my_recipe' 
                    ? '찜에 등록된 레시피가 없습니다.' 
                    : <>이 카테고리에 등록된{"\n"}레시피가 없습니다.</> // 글씨 잘려서
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

  // 오른쪽: 레시피 그리드
  recipeGridContainer: {
    flex: 1,
    backgroundColor: '#fff', // 오른쪽은 흰색 배경
    paddingHorizontal: 15,
  },
  recipeGridContent: {
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
  recipeCard: {
    // 3열 그리드 레이아웃
    width: (width - CATEGORY_WIDTH - 30) / 3 - 10, 
    marginRight: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  recipeImagePlaceholder: {
    width: '100%',
    aspectRatio: 1, // 정사각형
    backgroundColor: '#eee', // 회색 상자
    borderRadius: 8,
    marginBottom: 5,
  },
  recipeName: {
    fontSize: 13, // 작은 글씨
    color: '#444',
    textAlign: 'center',
    marginTop: 4,
  },
  noRecipeText: {
    fontSize: 16,
    color: '#888',
    marginTop: 20,
    textAlign: 'center',
    width: '100%',
  }
});
