// app/(tabs)/_layout.tsx
import React, { memo, useCallback, useMemo } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { UI_CONFIG } from '../../constants/Config';
import { Platform } from 'react-native';

// Optimized tab layout with memoized components and better performance
const TabLayout = memo(function TabLayout() {
  // Memoized tab bar style for better performance
  const tabBarStyle = useMemo(() => ({
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    height: UI_CONFIG.TAB_BAR_HEIGHT,
    paddingBottom: Platform.OS === 'ios' ? 8 : 12,
    paddingTop: 8,
    elevation: 8, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  }), []);

  // Memoized label and icon styles
  const tabBarLabelStyle = useMemo(() => ({
    fontSize: 12,
    fontWeight: '600' as const,
    marginTop: 2,
  }), []);

  const tabBarIconStyle = useMemo(() => ({
    marginBottom: 4,
  }), []);

  // Memoized screen options for better performance
  const screenOptions = useMemo(() => ({
    tabBarActiveTintColor: Colors.primary,
    tabBarInactiveTintColor: Colors.textSecondary,
    headerShown: false,
    tabBarStyle,
    tabBarLabelStyle,
    tabBarIconStyle,
    tabBarHideOnKeyboard: Platform.OS === 'android',
    lazy: true, // Enable lazy loading for better performance
  }), [tabBarStyle, tabBarLabelStyle, tabBarIconStyle]);

  // Memoized icon components for better performance
  const HomeIcon = useCallback(({ color, focused }: { color: string; focused: boolean }) => (
    <Ionicons 
      name={focused ? 'home' : 'home-outline'} 
      size={24} 
      color={color} 
    />
  ), []);

  const MarketplaceIcon = useCallback(({ color, focused }: { color: string; focused: boolean }) => (
    <Ionicons 
      name={focused ? 'storefront' : 'storefront-outline'} 
      size={24} 
      color={color} 
    />
  ), []);

  const ProfileIcon = useCallback(({ color, focused }: { color: string; focused: boolean }) => (
    <Ionicons 
      name={focused ? 'person' : 'person-outline'} 
      size={24} 
      color={color} 
    />
  ), []);

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: HomeIcon,
          tabBarTestID: 'home-tab',
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: 'Marketplace',
          tabBarIcon: MarketplaceIcon,
          tabBarTestID: 'marketplace-tab',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ProfileIcon,
          tabBarTestID: 'profile-tab',
        }}
      />
    </Tabs>
  );
});

export default TabLayout;