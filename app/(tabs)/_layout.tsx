// app/(tabs)/_layout.tsx

import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import { Pressable } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue'; 

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  
  return (
    <Tabs
      screenOptions={{
        // 탭 바 색상 설정
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        // 웹에서 헤더 렌더링 방식 설정
        headerShown: useClientOnlyValue(false, true),
        // 탭 바 스타일 (선택 사항)
        tabBarStyle: { height: 100, paddingBottom: 5 }, 
      }}>
      
      {/* 1. 레시피 탭 (recipe 폴더) */}
      <Tabs.Screen
        name="recipe/index"
        options={{
          title: '레시피',
          tabBarIcon: ({ color }) => <TabBarIcon name="book" color={color} />,
        }}
      />
      
      {/* 2. 냉장고 탭 (fridge 폴더) */}
      <Tabs.Screen
        name="fridge/index"
        options={{
          title: '냉장고',
          tabBarIcon: ({ color }) => <TabBarIcon name="archive" color={color} />, 
        }}
      />
      
      {/* 3. 홈 탭 (home 폴더) */}
      <Tabs.Screen
        name="home/index"
        options={{
          title: '홈',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />

      {/* 4. 그룹 탭 (group 폴더) */}
      <Tabs.Screen
        name="group/index"
        options={{
          title: '그룹',
          tabBarIcon: ({ color }) => <TabBarIcon name="users" color={color} />,
        }}
      />

      {/* 5. 마이페이지 탭 (mypage 폴더) */}
      <Tabs.Screen
        name="mypage/index"
        options={{
          title: '마이페이지',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}