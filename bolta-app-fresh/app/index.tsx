// app/index.tsx
import React, { useEffect, useMemo, memo } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useSession } from '../providers/SessionProvider';
import { Colors } from '../constants/Colors';
import { UI_CONFIG } from '../constants/Config';
import { logger } from '../utils';

// Optimized splash/loading screen with better performance and UX
const Index = memo(function Index() {
  const { user, loading } = useSession();
  const router = useRouter();

  // Memoized styles for better performance
  const containerStyle = useMemo(() => ({
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.background,
  }), []);

  useEffect(() => {
    logger.debug('Index screen: Navigation check', {
      loading,
      hasUser: !!user,
      userEmail: user?.email,
    });
    
    if (!loading) {
      // Add a small delay for better UX (prevents flash)
      const navigationTimeout = setTimeout(() => {
        if (user) {
          logger.info('Index: Authenticated user, redirecting to main app');
          router.replace('/(tabs)');
        } else {
          logger.info('Index: No user, redirecting to login');
          router.replace('/login');
        }
      }, UI_CONFIG.LOADING_DELAY);

      return () => clearTimeout(navigationTimeout);
    }
  }, [user, loading, router]);

  return (
    <View style={containerStyle}>
      <ActivityIndicator 
        size="large" 
        color={Colors.primary} 
        testID="splash-loading-indicator"
      />
    </View>
  );
});

export default Index;