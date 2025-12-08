// app/(tabs)/group/index.tsx

import { useNavigation } from '@react-navigation/native';
import { AlertTriangle, Pin, PinOff, Plus } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Style
import { Styles } from '@/constants/styles';

// Components
import GroupCreationModal from '@/components/GroupCreationModal';

// Context & Type
import { GroupProvider, useGroups } from '@/context/groupContext';

// Type
import type { Group } from '@/types/groupTypes';

// 그룹 목록 아이템 컴포넌트
const GroupListItem: React.FC<{
  item: Group;
  onPress: (group: Group) => void;
  onPinToggle: (groupId: string) => void;
  isLoading: boolean;
}> = ({ item, onPress, onPinToggle, isLoading }) => {
  const PinIcon = item.isPinned ? Pin : PinOff;
  const pinColor = item.isPinned ? '#000' : '#888';

  const GroupImage = () => {
    if (item.imageUri && item.imageUri !== 'NULL') {
      return (
        <Image
          source={{ uri: item.imageUri }}
          style={styles.groupImage}
          onError={(e) => console.log('Image Load Error:', e.nativeEvent.error)}
        />
      );
    }
    return (
      <View style={[styles.groupImage, styles.imagePlaceholder]}>
        <Text style={styles.placeholderText}>{item.name ? item.name[0] : 'B'}</Text> 
      </View>
    );
  };

  return (
    <TouchableOpacity 
      style={[styles.listItem, isLoading && { opacity: 0.6 }]} 
      onPress={() => onPress(item)}
      disabled={isLoading}
    >
      <View style={styles.groupImageContainer}>
        <GroupImage />
      </View>
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{item.name}</Text>
        <Text style={styles.groupDescription} numberOfLines={1}>
          {item.description}
        </Text>
      </View>
      <View>
        <TouchableOpacity
          style={styles.pinButton}
          onPress={(e) => {
            e.stopPropagation(); 
            onPinToggle(item.id);
          }}
          disabled={isLoading}
        >
          <PinIcon size={20} color={pinColor} />
          <Text style={styles.memberCount}>
            {item.memberCount}/{item.maxMembers}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

// 광고 배너 컴포넌트
const AdBanner: React.FC = () => {
  const AdContent = () => (
    <View style={styles.adContent}>
      <AlertTriangle size={32} color="#D35400" />
      <Text style={styles.adText}>광고 배너 영역</Text>
    </View>
  );
  return (
    <View style={styles.adBanner}>
      <AdContent />
    </View>
  );
};

// 메인 컨텐츠 컴포넌트
const GroupScreenContent = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  const { 
    myGroups, 
    isLoading, 
    togglePin, 
  } = useGroups();

  // 그룹 상세 화면 이동
  const handleGroupPress = (group: Group) => {
    // @ts-ignore: groupId, groupName을 필수적으로 전달
    navigation.navigate('group/detail', { groupId: group.id, groupName: group.name });
  };

  // 고정핀 토글 로직
  const handlePinToggle = (groupId: string) => {
    togglePin(groupId);
  };
  
  // 그룹 추가 FAB 핸들러
  const handleFabPress = () => {
      setModalMode('create');
      setIsModalVisible(true);
  }

  // 모달 상태
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'join'>('create');


  // 고정 상태에 따라 목록 정렬
  const sortedGroups = myGroups.slice().sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return a.id.localeCompare(b.id); 
  });
  
  // 로딩 UI (빈 목록일 때만 표시)
  if (isLoading && myGroups.length === 0) {
    return (
      <View style={[Styles.indexContainer, styles.centerContent, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#404040ff" />
        <Text style={styles.statusText}>그룹 목록을 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={[Styles.indexContainer, { paddingTop: insets.top }]}>
      {/* 광고 배너 */}
      <AdBanner />

      <FlatList
        data={sortedGroups}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <GroupListItem
            item={item}
            onPress={handleGroupPress}
            onPinToggle={handlePinToggle}
            isLoading={isLoading}
          />
        )}
        style={styles.list}
        // 그룹이 없을 때
        ListEmptyComponent={!isLoading ? (
          <Text style={styles.emptyText}>현재 참여 중인 그룹이 없습니다.</Text>
        ) : null}
      />

      {/* 그룹 추가 버튼 (생성/가입 모달 트리거) */}
      <TouchableOpacity style={styles.fab} onPress={handleFabPress} disabled={isLoading}>
        <Plus size={28} color="#fff" /> 
      </TouchableOpacity>
      
      {/* 그룹 생성/가입 모달 */}
      <GroupCreationModal 
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        initialMode={modalMode}
      />
    </View>
  );
}

// 메인 컴포넌트: Provider로 감싸기
export default function GroupScreen() {
  return (
    <GroupProvider>
      <GroupScreenContent />
    </GroupProvider>
  );
}

// 🎨 스타일 시트
const styles = StyleSheet.create({
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  statusText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666'
  },
  retryText: {
    marginTop: 5,
    color: '#404040ff',
    fontWeight: 'bold'
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#888'
  },

  // 광고 배너
  adBanner: {
    margin: 16,
    borderRadius: 12, 
    backgroundColor: '#FFEBEE',
    borderWidth: 2, 
    borderColor: '#808080ff'
  },
  adContent: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10
  },
  adText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },

  // 그룹 리스트
  list: {
    flex: 1
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d1d1ff'
  },
  groupImageContainer: {
    marginLeft: 8,
    marginRight: 15
  },
  groupImage: {
    width: 55,
    height: 55,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  imagePlaceholder: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center'
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000'
  },
  groupInfo: {
    flex: 1,
    justifyContent: 'center'
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333'
  },
  groupDescription: {
    fontSize: 15,
    color: '#666',
    marginTop: 5
  },
  memberCount: {
    fontSize: 12,
    color: '#999',
    marginTop: 20
  },
  pinButton: {
    marginRight: 8,
    padding: 5
  },
  
  // 그룹 추가 버튼
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    zIndex: 10
  }
});
