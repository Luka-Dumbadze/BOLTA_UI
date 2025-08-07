// app/force-logout.tsx
import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { Colors } from '../constants/Colors';

export default function ForceLogout() {
  const router = useRouter();

  useEffect(() => {
    const forceSignOut = async () => {
      console.log('🚨 Force logout initiated...');
      
      try {
        // Step 1: Clear AsyncStorage
        await AsyncStorage.clear();
        console.log('✅ AsyncStorage cleared');
        
        // Step 2: Sign out from Firebase
        await signOut(auth);
        console.log('✅ Firebase sign out completed');
        
        // Step 3: Navigate to login
        console.log('🔄 Redirecting to login...');
        router.replace('/login');
        
      } catch (error) {
        console.error('❌ Force logout error:', error);
        
        // Even on error, try to navigate to login
        router.replace('/login');
      }
    };

    forceSignOut();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.text}>Signing out...</Text>
      <Text style={styles.subtext}>Please wait while we clear your session</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 20,
  },
  text: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  subtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});