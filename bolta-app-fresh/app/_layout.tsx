// app/_layout.tsx
import { Stack } from 'expo-router';
import { SessionProvider } from '../providers/SessionProvider';

export default function RootLayout() {
  return (
    <SessionProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </SessionProvider>
  );
}