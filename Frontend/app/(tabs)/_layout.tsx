// app/(tabs)/_layout.tsx

import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import React from 'react';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  
  return (
    <Tabs
      screenOptions={{
        // 탭 바 활성화 아이콘 색상
        tabBarActiveTintColor: '#fff',
        // 탭 바 스타일
        tabBarStyle: { backgroundColor: '#000',height: 100, paddingBottom: 5 }, 
      }}>
      
      {/* 1. 레시피 탭 (recipe 폴더) */}
      <Tabs.Screen
        name="recipe/index"
        options={{
          title: '레시피',
          tabBarIcon: ({ color }) => <TabBarIcon name="book" color={color} />,
          headerShown: false,
        }}
      />
      
      {/* 2. 냉장고 탭 (fridge 폴더) */}
      <Tabs.Screen
        name="fridge/index"
        options={{
          title: '냉장고',
          tabBarIcon: ({ color }) => <TabBarIcon name="archive" color={color} />, 
          headerShown: false,
        }}
      />
      
      {/* 3. 홈 탭 (home 폴더) */}
      <Tabs.Screen
        name="home/index"
        options={{
          title: '홈',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          headerShown: false,
        }}
      />

      {/* 4. 그룹 탭 (group 폴더) */}
      <Tabs.Screen
        name="group/index"
        options={{
          title: '그룹',
          tabBarIcon: ({ color }) => <TabBarIcon name="users" color={color} />,
          headerShown: false,
        }}
      />

      {/* 5. 마이페이지 탭 (mypage 폴더) */}
      <Tabs.Screen
        name="mypage/index"
        options={{
          title: '마이페이지',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
