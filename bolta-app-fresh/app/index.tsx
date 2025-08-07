// app/index.tsx
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useSession } from '../providers/SessionProvider';
import { Colors } from '../constants/Colors';

export default function Index() {
  const { user, loading } = useSession();
  const router = useRouter();

  useEffect(() => {
    console.log('Index: loading =', loading, 'user =', user ? user.email : 'null');
    
    if (!loading) {
      if (user) {
        console.log('Index: Redirecting to tabs');
        // @ts-ignore
        router.replace('/(tabs)');
      } else {
        console.log('Index: Redirecting to login');
        // @ts-ignore
        router.replace('/login');
      }
    }
  }, [user, loading]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}