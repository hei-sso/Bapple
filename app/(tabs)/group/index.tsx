// app/(tabs)/group/index.tsx

import { useNavigation } from '@react-navigation/native';
import { AlertTriangle, Pin, PinOff, Plus } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Style
import { Styles } from '@/constants/styles'; // 공통

interface Group {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  maxMembers: number;
  isPinned: boolean;
  imageUri: string | 'NULL'; // 이미지 URI 또는 'NULL'
}

// Mock Data
const INITIAL_GROUPS: Group[] = [
  {
    id: '1',
    name: '그룹 1',
    description: '그룹 1 입니다.',
    memberCount: 5,
    maxMembers: 6,
    isPinned: true,
    imageUri: 'NULL',
  },
  {
    id: '2',
    name: '그룹 2',
    description: '그룹 2 입니다.',
    memberCount: 7,
    maxMembers: 10,
    isPinned: false,
    imageUri: 'NULL',
  },
  {
    id: '3',
    name: '그룹 3',
    description: '그룹 3 입니다.',
    memberCount: 4,
    maxMembers: 6,
    isPinned: false,
    imageUri: 'NULL',
  },
];

// 그룹 목록 아이템 컴포넌트
const GroupListItem: React.FC<{
  item: Group;
  onPress: (group: Group) => void;
  onPinToggle: (groupId: string) => void;
}> = ({ item, onPress, onPinToggle }) => {
  const PinIcon = item.isPinned ? Pin : PinOff;
  const pinColor = item.isPinned ? '#000' : '#888';

  // 이미지 렌더링 또는 Placeholder 처리
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
    // NULL 또는 로드 실패 시 Placeholder
    return (
      <View style={[styles.groupImage, styles.imagePlaceholder]}>
        <Text style={styles.placeholderText}>B</Text>
      </View>
    );
  };

  return (
    <TouchableOpacity style={styles.listItem} onPress={() => onPress(item)}>
      <View style={styles.groupImageContainer}>
        <GroupImage />
      </View>
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{item.name}</Text>
        {/* 한 줄 소개 (방장만 수정 가능) */}
        <Text style={styles.groupDescription} numberOfLines={1}>
          {item.description}
        </Text>
      </View>
      <View>
        {/* 고정핀 토글 버튼 */}
        <TouchableOpacity
          style={styles.pinButton}
          onPress={(e) => {
            e.stopPropagation(); // 그룹 항목 클릭 이벤트 전파 방지
            onPinToggle(item.id);
          }}
        >
          <PinIcon size={20} color={pinColor} />
          {/* 멤버 수 */}
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
  // NULL 이미지 URI 처리 및 테두리 포함
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

// 메인 컴포넌트
export default function GroupScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  // Pin 토글 기능을 위해 상태 관리
  const [groups, setGroups] = useState(INITIAL_GROUPS);

  // 그룹 상세 화면 이동
  const handleGroupPress = (group: Group) => {
    // ⭐ 'group/detail'로 그룹 정보와 함께 이동
    // @ts-ignore - 'group/detail' 라우트의 타입을 명시적으로 정의하지 않으므로 임시로 사용
    navigation.navigate('group/detail', { groupId: group.id, groupName: group.name });
  };

  // 고정핀 토글 로직
  const handlePinToggle = (groupId: string) => {
    setGroups((prevGroups) => {
      // 해당 그룹의 isPinned 상태를 토글
      const updatedGroups = prevGroups.map((group) =>
        group.id === groupId ? { ...group, isPinned: !group.isPinned } : group
      );

      return updatedGroups;
    });
  };

  // 고정 상태에 따라 목록 정렬 (고정된 그룹이 위로, 나머지는 ID 순으로)
  const sortedGroups = groups.slice().sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return a.id.localeCompare(b.id); // 고정 상태가 같으면 ID 순으로 정렬
  });

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
          />
        )}
        style={styles.list}
      />

      {/* 그룹 추가 버튼 */}
      <TouchableOpacity style={styles.fab} onPress={() => console.log('Add Group')}>
        <Plus size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

// 🎨 스타일 시트
const styles = StyleSheet.create({
  // 광고 배너
  adBanner: {
    margin: 16,
    borderRadius: 12, // 둥근 모서리
    backgroundColor: '#FFEBEE', // 광고 배경색
    borderWidth: 2, // 테두리 추가
    borderColor: '#808080ff' // 테두리 색
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
  adSubText: {
    fontSize: 12,
    color: '#555'
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
    borderRadius: 30, // 원 모양
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
    padding: 5 // 터치 영역 확장
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
    zIndex: 10 // 다른 요소 위에 표시
  }
});
