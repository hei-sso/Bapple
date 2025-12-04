// app/(tabs)/recipe/index.tsx

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
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Components
import RecipeModal from '@/components/RecipeModal';

// Context
import { RecipeProvider, useRecipe } from '@/context/recipeContext';

// Type
import type { Category, Recipe } from '@/types/recipeTypes';

// 개별 레시피 컴포넌트
const RecipeItem: React.FC<{ recipe: Recipe }> = ({ recipe }) => {
  const { myFavoriteRecipes, addFavorite, removeFavorite } = useRecipe();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false); // 개별 아이템의 로딩 상태

  // 현재 레시피가 찜 목록에 있는지 확인
  const isFavorite = useMemo(
    () => myFavoriteRecipes.some(item => item.id === recipe.id),
    [myFavoriteRecipes, recipe.id]
  );

  // 모달에서 확인 버튼 클릭 시 (비동기 처리)
  const handleConfirm = useCallback(async (rec: Recipe) => {
    setIsActionLoading(true);
    try {
      if (isFavorite) {
        await removeFavorite(rec.id); 
      } else {
        await addFavorite(rec); 
      }
      setIsModalVisible(false); // 성공 시에만 모달 닫기

    } catch (error) {
      // 에러 처리는 Context에서 이미 Alert으로 진행하지만 혹시 몰라서..
    } finally {
      setIsActionLoading(false);
    }
  }, [isFavorite, addFavorite, removeFavorite]);

  return (
    <>
      <TouchableOpacity 
        style={styles.recipeCard}
        onPress={() => setIsModalVisible(true)}
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
        isLoading={isActionLoading} // 로딩 상태 전달
      />
    </>
  );
};

// 레시피 그리드를 카테고리별로 그룹화하여 표시하는 컴포넌트 (찜 전용)
const FavoriteRecipeGroup: React.FC<{ recipes: Recipe[], allCategories: Category[] }> = ({ recipes, allCategories }) => {
    
  // 카테고리별로 레시피를 그룹화
  const groupedRecipes = useMemo(() => {
    return recipes.reduce((acc, recipe) => {
      // allCategories에서 categoryId에 해당하는 name 찾기
      const categoryName = allCategories.find(cat => cat.id === recipe.category)?.name || '기타';
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(recipe);
      return acc;
    }, {} as { [key: string]: Recipe[] });
  }, [recipes, allCategories]);
    
  // 카테고리 이름 목록 (순서 유지용)
  // 'my_recipe'를 제외한 카테고리 이름만 사용
  const categoryNames = allCategories
    .filter(cat => cat.id !== 'my_recipe' && groupedRecipes[cat.name])
    .map(cat => cat.name);
    
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
    setSelectedCategory,
    isLoading,
    isError,
    refetchData,
  } = useRecipe();
  
  const insets = useSafeAreaInsets();
  
  // 새로고침 핸들러
  const onRefresh = useCallback(() => {
    refetchData();
  }, [refetchData]);

  // 현재 선택된 카테고리의 레시피 목록을 계산
  const currentRecipes = useMemo(() => {
    if (selectedCategory === 'my_recipe') {
      return []; 
    }
    const category = allCategories.find(cat => cat.id === selectedCategory);
    return category ? category.recipes : [];
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
        disabled={isLoading} // 로딩 중 비활성화
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
        <Text style={styles.loadingText}>레시피를 불러오는 중...</Text>
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
            editable={!isLoading} // 로딩 중 비활성화
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
            refreshControl={ // 당겨서 새로고침 추가
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

            {/* '찜' 카테고리인 경우 */}
            {selectedCategory === 'my_recipe' ? (
              <FavoriteRecipeGroup recipes={myFavoriteRecipes} allCategories={allCategories} />
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

// 메인 컴포넌트: Provider로 감싸기
export default function RecipeScreen() {
  return (
    <RecipeProvider> 
      <RecipeScreenContent />
    </RecipeProvider>
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

  // 오른쪽: 레시피 그리드
  recipeGridContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 15
  },
  recipeGridContent: {
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
  recipeCard: {
    width: (width - CATEGORY_WIDTH - 30) / 3 - 10, 
    marginRight: 10,
    marginBottom: 15,
    alignItems: 'center'
  },
  recipeImagePlaceholder: {
    width: '100%',
    aspectRatio: 1, 
    backgroundColor: '#eee',
    borderRadius: 8,
    marginBottom: 5
  },
  recipeName: {
    fontSize: 13,
    color: '#444',
    textAlign: 'center',
    marginTop: 4
  },
  noRecipeText: {
    fontSize: 16,
    color: '#888',
    marginTop: 20,
    textAlign: 'center',
    width: '100%'
  },
  favoriteIcon: {
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
