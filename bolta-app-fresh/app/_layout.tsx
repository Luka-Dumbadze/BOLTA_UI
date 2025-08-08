// app/_layout.tsx
import React, { memo, useMemo } from 'react';
import { Stack } from 'expo-router';
import { SessionProvider } from '../providers/SessionProvider';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../constants/Colors';
import { FEATURE_FLAGS } from '../constants/Config';
import { logger } from '../utils';
import { ErrorBoundary } from '../components/ErrorBoundary';

// Optimized root layout with performance enhancements
const RootLayout = memo(function RootLayout() {
  // Memoized stack screen options for better performance
  const stackScreenOptions = useMemo(() => ({
    headerShown: false,
    animation: 'slide_from_right' as const,
    gestureEnabled: true,
    gestureDirection: 'horizontal' as const,
  }), []);

  // Log app initialization in development
  React.useEffect(() => {
    logger.info('🚀 Boltha app initialized', {
      features: FEATURE_FLAGS,
      timestamp: new Date().toISOString(),
    });
  }, []);

  return (
    <ErrorBoundary>
      <SessionProvider>
        <StatusBar style="dark" backgroundColor={Colors.background} />
        <Stack screenOptions={stackScreenOptions}>
        <Stack.Screen 
          name="index" 
          options={{
            title: 'Loading',
            gestureEnabled: false, // Disable gesture on splash screen
          }}
        />
        <Stack.Screen 
          name="login" 
          options={{
            title: 'Sign In',
            presentation: 'modal',
          }}
        />
        <Stack.Screen 
          name="signup" 
          options={{
            title: 'Sign Up',
            presentation: 'modal',
          }}
        />
        <Stack.Screen 
          name="(tabs)" 
          options={{
            title: 'Boltha',
            gestureEnabled: false, // Disable gesture on main app
          }}
        />
        <Stack.Screen 
          name="reward-detail" 
          options={{
            title: 'Reward Details',
            presentation: 'modal',
          }}
        />
        <Stack.Screen 
          name="redemption" 
          options={{
            title: 'Redemption',
            presentation: 'modal',
          }}
        />
        <Stack.Screen 
          name="force-logout" 
          options={{
            title: 'Session Expired',
            presentation: 'modal',
            gestureEnabled: false,
          }}
                  />
        </Stack>
      </SessionProvider>
    </ErrorBoundary>
  );
});

export default RootLayout;