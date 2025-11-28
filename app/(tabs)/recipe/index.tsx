// app/(tabs)/recipe/index.tsx

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
import RecipeModal from '@/components/RecipeModal';

// Context 임포트
import { Recipe, Category, RecipeContextType } from '@/context/recipeContext';

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

// Recipe Context 생성
const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

// Recipe Context를 사용하는 커스텀 훅
const useRecipe = () => {
  const context = useContext(RecipeContext);
  if (!context) {
    throw new Error('useRecipe must be used within a RecipeProvider');
  }
  return context;
};

// 레시피 찜 상태 관리 Provider
const RecipeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('my_recipe');
  // '찜' 레시피 목록 상태
  const [myFavoriteRecipes, setMyFavoriteRecipes] = useState<Recipe[]>([]);

  // 모든 카테고리 (UI용)
  const allCategories = useMemo(() => {
    return MOCK_CATEGORIES_DATA;
  }, []);

  // 찜 추가 함수
  const addFavorite = useCallback((recipe: Recipe) => {
    setMyFavoriteRecipes(prev => {
      // 중복 추가 방지
      if (!prev.find(item => item.id === recipe.id)) {
        return [...prev, recipe];
      }
      return prev;
    });
  }, []);

  // 찜 삭제 함수
  const removeFavorite = useCallback((recipeId: string) => {
    setMyFavoriteRecipes(prev => prev.filter(item => item.id !== recipeId));
  }, []);

  const contextValue = useMemo(() => ({
    allCategories,
    myFavoriteRecipes,
    addFavorite,
    removeFavorite,
    selectedCategory,
    setSelectedCategory,
  }), [allCategories, myFavoriteRecipes, addFavorite, removeFavorite, selectedCategory]);

  return (
    <RecipeContext.Provider value={contextValue}>
      {children}
    </RecipeContext.Provider>
  );
};

// 개별 레시피 컴포넌트
const RecipeItem: React.FC<{ recipe: Recipe }> = ({ recipe }) => {
  const { myFavoriteRecipes, addFavorite, removeFavorite } = useRecipe();
  const [isModalVisible, setIsModalVisible] = useState(false);

  // 현재 레시피가 찜 목록에 있는지 확인
  const isFavorite = useMemo(
    () => myFavoriteRecipes.some(item => item.id === recipe.id),
    [myFavoriteRecipes, recipe.id]
  );

  // 모달에서 확인 버튼 클릭 시
  const handleConfirm = (rec: Recipe) => {
    if (isFavorite) {
      removeFavorite(rec.id); // 찜 목록에 있으면 삭제
    } else {
      addFavorite(rec); // 없으면 찜 추가
    }
  };

  return (
    <>
      <TouchableOpacity 
        style={styles.recipeCard}
        onPress={() => setIsModalVisible(true)} // 클릭 시 모달 열기
      >
        {/* 회색 상자 (이미지/아이콘 자리) */}
        <View style={styles.recipeImagePlaceholder} />
        {/* 찜 아이콘 (옵션) */}
        {isFavorite && (
          <View style={styles.favoriteIcon}>
            <Ionicons name="heart" size={20} color="#ff69b4" /> 
          </View>
        )}
        {/* 레시피 이름 */}
        <Text style={styles.recipeName} numberOfLines={1}>
          {recipe.name}
        </Text>
      </TouchableOpacity>

      <RecipeModal
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        recipe={recipe}
        isFavorite={isFavorite}
        onConfirm={handleConfirm}
      />
    </>
  );
};

// 레시피 그리드를 카테고리별로 그룹화하여 표시하는 컴포넌트 (찜 전용)
const FavoriteRecipeGroup: React.FC<{ recipes: Recipe[] }> = ({ recipes }) => {
    
    // 카테고리별로 레시피를 그룹화
    const groupedRecipes = useMemo(() => {
        return recipes.reduce((acc, recipe) => {
            const categoryName = MOCK_CATEGORIES_DATA.find(cat => cat.id === recipe.category)?.name || '기타';
            if (!acc[categoryName]) {
                acc[categoryName] = [];
            }
            acc[categoryName].push(recipe);
            return acc;
        }, {} as { [key: string]: Recipe[] });
    }, [recipes]);
    
    // 카테고리 이름 목록 (순서 유지를 위해)
    const categoryNames = Object.keys(groupedRecipes);
    
    if (recipes.length === 0) {
        return (
            <Text style={styles.noRecipeText}>
                찜 목록에 등록된 레시피가 없습니다.
            </Text>
        );
    }

    return (
        <>
            {categoryNames.map(categoryName => (
                <View key={categoryName} style={styles.categoryGroup}>
                    <Text style={styles.groupTitle}>{categoryName}</Text>
                    <View style={styles.gridRow}>
                        {groupedRecipes[categoryName].map((rec, index) => (
                            <RecipeItem key={rec.id + index} recipe={rec} />
                        ))}
                    </View>
                </View>
            ))}
        </>
    );
};


// 메인 화면 처리
const RecipeScreenContent = () => {
    const { 
        allCategories, 
        myFavoriteRecipes, 
        selectedCategory, 
        setSelectedCategory 
    } = useRecipe();
    
    const insets = useSafeAreaInsets();

    // 현재 선택된 카테고리의 레시피 목록을 계산 (찜 목록이 아닌 경우에만)
    const currentRecipes = useMemo(() => {
        if (selectedCategory === 'my_recipe') {
            // '찜'은 그룹화된 뷰를 별도로 사용
            return []; 
        }
        const category = allCategories.find(cat => cat.id === selectedCategory);
        return category ? category.recipes : [];
    }, [selectedCategory, allCategories]);

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
                      {allCategories.map(renderCategoryItem)}
                  </ScrollView>
              </View>

              {/* 오른쪽: 레시피 그리드 */}
              <View style={styles.recipeGridContainer}>
                  <ScrollView 
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={styles.recipeGridContent}
                  >
                      <Text style={styles.currentCategoryTitle}>
                          {allCategories.find(c => c.id === selectedCategory)?.name || '카테고리'}
                      </Text>
                      
                      {/* '찜' 카테고리인 경우 */}
                      {selectedCategory === 'my_recipe' ? (
                          <FavoriteRecipeGroup recipes={myFavoriteRecipes} />
                      ) : (
                          // 일반 카테고리인 경우
                          <View style={styles.gridRow}>
                              {currentRecipes.length > 0 ? (
                                  currentRecipes.map((rec, index) => (
                                      <RecipeItem key={rec.id + index} recipe={rec} />
                                  ))
                              ) : (
                                  <Text style={styles.noRecipeText}>
                                      이 카테고리에 등록된{"\n"}레시피가 없습니다.
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
export default function RecipeScreen() {
    return (
        <RecipeProvider>
            <RecipeScreenContent />
        </RecipeProvider>
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

  // 오른쪽: 레시피 그리드
  recipeGridContainer: {
    flex: 1,
    backgroundColor: '#fff',
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
    marginRight: -10,
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
    aspectRatio: 1, 
    backgroundColor: '#eee',
    borderRadius: 8,
    marginBottom: 5,
  },
  recipeName: {
    fontSize: 13,
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
  },
  // --- 찜 아이콘 및 그룹화 관련 스타일 ---
  favoriteIcon: {
    position: 'absolute',
    top: 5,
    right: 5,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 15,
    padding: 2,
  },
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
    paddingLeft: 5, 
  }
});
