// providers/SessionProvider.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../firebaseConfig';
import { User, FirebaseTimestamp } from '../types';

// Constants for performance optimization
const STORAGE_KEY = 'bolta_user';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

// Helper function for retry logic
const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxAttempts: number = MAX_RETRY_ATTEMPTS,
  delay: number = RETRY_DELAY
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Operation failed (attempt ${attempt}/${maxAttempts}):`, error);
      
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
  
  throw lastError!;
};

interface SessionContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateBoltBalance: (newBalance: number) => Promise<void>;
  refreshUserData: () => Promise<void>;
  clearCache: () => void;
  isOnline: boolean;
}

// Cache interface for user data
interface UserCache {
  data: User;
  timestamp: number;
}

const SessionContext = createContext<SessionContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  updateBoltBalance: async () => {},
  refreshUserData: async () => {},
  clearCache: () => {},
  isOnline: true,
});

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  
  // Refs for caching and optimization
  const userCacheRef = useRef<UserCache | null>(null);
  const lastActiveUpdateRef = useRef<number>(0);
  const authUnsubscribeRef = useRef<(() => void) | null>(null);
  
  // Memoized timestamp creation function
  const createTimestamp = useCallback((): FirebaseTimestamp => ({
    seconds: Math.floor(Date.now() / 1000),
    nanoseconds: 0
  }), []);

  // Optimized persistent storage functions
  const loadPersistedUser = useCallback(async (): Promise<User | null> => {
    try {
      const persistedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (persistedData) {
        const cacheData: UserCache = JSON.parse(persistedData);
        
        // Check if cache is still valid
        if (Date.now() - cacheData.timestamp < CACHE_DURATION) {
          userCacheRef.current = cacheData;
          console.log('✅ Loaded valid cached user:', cacheData.data.email);
          return cacheData.data;
        } else {
          console.log('⚠️ User cache expired, will refresh from server');
        }
      }
    } catch (error) {
      console.error('❌ Error loading persisted user:', error);
      // Clear corrupted cache
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
    return null;
  }, []);

  // Load persisted user data on app start
  useEffect(() => {
    const initializeUser = async () => {
      const cachedUser = await loadPersistedUser();
      if (cachedUser) {
        setUser(cachedUser);
      } else {
        setLoading(false);
      }
    };

    initializeUser();
  }, [loadPersistedUser]);

  // Optimized helper function to persist user data with caching
  const persistUser = useCallback(async (userData: User | null) => {
    try {
      if (userData) {
        const cacheData: UserCache = {
          data: userData,
          timestamp: Date.now()
        };
        userCacheRef.current = cacheData;
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData));
        console.log('💾 User data cached successfully');
      } else {
        userCacheRef.current = null;
        await AsyncStorage.removeItem(STORAGE_KEY);
        console.log('🗑️ User cache cleared');
      }
    } catch (error) {
      console.error('❌ Error persisting user data:', error);
    }
  }, []);

  // Optimized function to check if lastActive should be updated (throttled)
  const shouldUpdateLastActive = useCallback(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastActiveUpdateRef.current;
    return timeSinceLastUpdate > 60000; // Only update every minute
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(
      auth,
      async (firebaseUser: FirebaseUser | null) => {
        console.log('🔄 Auth state changed:', firebaseUser ? firebaseUser.email : 'null');
        
        if (firebaseUser) {
          try {
            // Check cache first to avoid unnecessary Firestore reads
            const cachedUser = userCacheRef.current;
            if (cachedUser && 
                cachedUser.data.uid === firebaseUser.uid && 
                Date.now() - cachedUser.timestamp < CACHE_DURATION) {
              console.log('📋 Using cached user data:', cachedUser.data.email);
              setUser(cachedUser.data);
              setLoading(false);
              return;
            }

            const userDocRef = doc(db, 'users', firebaseUser.uid);
            
            // Use retry logic for Firestore operations
            const userDoc = await retryOperation(() => getDoc(userDocRef));

            if (userDoc.exists()) {
              const userData = userDoc.data() as User;
              
              // Only update lastActive if enough time has passed (throttling)
              let updatedUser = userData;
              if (shouldUpdateLastActive()) {
                const now = createTimestamp();
                
                try {
                  await updateDoc(userDocRef, { lastActive: now });
                  updatedUser = { ...userData, lastActive: now };
                  lastActiveUpdateRef.current = Date.now();
                  console.log('⏰ Updated lastActive timestamp');
                } catch (updateError) {
                  console.warn('⚠️ Failed to update lastActive, using cached data:', updateError);
                  // Continue with existing user data if lastActive update fails
                }
              }

              console.log('✅ Setting user from Firestore:', updatedUser.email, 'Balance:', updatedUser.boltBalance);
              setUser(updatedUser);
              await persistUser(updatedUser);
            } else {
              // User document doesn't exist - create it for existing authenticated users
              console.log('👤 User document not found, creating one...');
              
              const now = createTimestamp();
              const newUser: User = {
                uid: firebaseUser.uid,
                name: firebaseUser.displayName || 'User',
                email: firebaseUser.email || '',
                boltBalance: 100, // Starting balance
                createdAt: now,
                lastActive: now,
                preferences: {
                  notifications: true,
                  theme: 'light'
                },
                achievements: [],
                totalEarned: 100,
                totalSpent: 0
              };

              try {
                await retryOperation(() => setDoc(userDocRef, newUser));
                setUser(newUser);
                await persistUser(newUser);
                console.log('✅ User document created successfully');
              } catch (createError) {
                console.error('❌ Error creating user document:', createError);
                // If we can't create the document, still set a basic user object
                const fallbackUser: User = {
                  uid: firebaseUser.uid,
                  name: firebaseUser.displayName || 'User',
                  email: firebaseUser.email || '',
                  boltBalance: 0,
                  createdAt: now,
                  lastActive: now,
                  preferences: { notifications: true, theme: 'light' },
                  achievements: [],
                  totalEarned: 0,
                  totalSpent: 0
                };
                setUser(fallbackUser);
                await persistUser(fallbackUser);
              }
            }
          } catch (error) {
            console.error('❌ Error fetching user data:', error);
            setIsOnline(false);
            
            // Try to use cached data as fallback
            const cachedUser = userCacheRef.current;
            if (cachedUser && cachedUser.data.uid === firebaseUser.uid) {
              console.log('📋 Using cached data as fallback');
              setUser(cachedUser.data);
            } else {
              // Create minimal user object from Firebase Auth
              const fallbackUser: User = {
                uid: firebaseUser.uid,
                name: firebaseUser.displayName || 'User',
                email: firebaseUser.email || '',
                boltBalance: 0,
                createdAt: createTimestamp(),
                lastActive: createTimestamp(),
                preferences: { notifications: true, theme: 'light' },
                achievements: [],
                totalEarned: 0,
                totalSpent: 0
              };
              setUser(fallbackUser);
              await persistUser(fallbackUser);
            }
          }
        } else {
          console.log('🚪 Auth state: No authenticated user, clearing user state');
          setUser(null);
          await persistUser(null);
          setIsOnline(true); // Reset online status
        }
        setLoading(false);
      },
      (error) => {
        console.error('❌ Auth state change error:', error);
        setLoading(false);
        setIsOnline(false);
      }
    );

    authUnsubscribeRef.current = unsubscribeAuth;
    return () => {
      if (authUnsubscribeRef.current) {
        authUnsubscribeRef.current();
        authUnsubscribeRef.current = null;
      }
    };
  }, [createTimestamp, shouldUpdateLastActive, persistUser]);

  // Optimized sign-in with better error handling
  const signIn = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      setIsOnline(true);
      await retryOperation(() => signInWithEmailAndPassword(auth, email, password));
      console.log('✅ Sign in successful');
    } catch (error: any) {
      console.error('❌ Error signing in:', error);
      setIsOnline(false);
      
      // Provide more specific error messages
      const errorMessage = error.code === 'auth/network-request-failed' 
        ? 'Network error. Please check your connection and try again.'
        : error.message || 'Sign in failed. Please try again.';
      
      throw new Error(errorMessage);
    }
  }, []);

  // Optimized sign-up with better error handling
  const signUp = useCallback(async (email: string, password: string, name: string): Promise<void> => {
    try {
      setIsOnline(true);
      const { user: firebaseUser } = await retryOperation(() => 
        createUserWithEmailAndPassword(auth, email, password)
      );
      
      const now = createTimestamp();
      const newUser: User = {
        uid: firebaseUser.uid,
        name,
        email,
        boltBalance: 100,
        createdAt: now,
        lastActive: now,
        preferences: {
          notifications: true,
          theme: 'light'
        },
        achievements: [],
        totalEarned: 100,
        totalSpent: 0
      };

      await retryOperation(() => setDoc(doc(db, 'users', firebaseUser.uid), newUser));
      console.log('✅ Sign up successful');
    } catch (error: any) {
      console.error('❌ Error signing up:', error);
      setIsOnline(false);
      
      const errorMessage = error.code === 'auth/network-request-failed'
        ? 'Network error. Please check your connection and try again.'
        : error.message || 'Sign up failed. Please try again.';
      
      throw new Error(errorMessage);
    }
  }, [createTimestamp]);

  // Optimized sign-out with cleanup
  const signOut = useCallback(async (): Promise<void> => {
    console.log('🚪 Starting sign out process...');
    
    try {
      // Clear cache first
      userCacheRef.current = null;
      lastActiveUpdateRef.current = 0;
      
      // Sign out from Firebase (this will trigger auth state change)
      await firebaseSignOut(auth);
      console.log('✅ Firebase sign out successful');
      
      // Clear local state
      setUser(null);
      await persistUser(null);
      setIsOnline(true); // Reset online status
      console.log('✅ Local state cleared');
      
    } catch (error) {
      console.error('⚠️ Firebase sign out error, clearing local state anyway:', error);
      
      // Force clear local state even if Firebase fails
      userCacheRef.current = null;
      lastActiveUpdateRef.current = 0;
      setUser(null);
      setIsOnline(true);
      
      try {
        await persistUser(null);
        console.log('✅ Local data cleared despite Firebase error');
      } catch (storageError) {
        console.error('❌ Storage clear error:', storageError);
      }
    }
    
    console.log('🎉 Sign out process completed');
  }, [persistUser]);

  // Optimized bolt balance update with optimistic updates
  const updateBoltBalance = useCallback(async (newBalance: number): Promise<void> => {
    if (!user) {
      throw new Error('No user logged in');
    }

    const previousBalance = user.boltBalance;
    console.log('💰 Updating bolt balance from', previousBalance, 'to', newBalance);
    
    try {
      // Optimistic update - update UI immediately
      const updatedUser = { ...user, boltBalance: newBalance };
      setUser(updatedUser);
      await persistUser(updatedUser);
      
      // Then update Firestore with retry logic
      const userDocRef = doc(db, 'users', user.uid);
      await retryOperation(() => updateDoc(userDocRef, { boltBalance: newBalance }));
      
      console.log('✅ Bolt balance updated successfully');
      setIsOnline(true);
    } catch (error) {
      console.error('❌ Error updating bolt balance:', error);
      setIsOnline(false);
      
      // Revert optimistic update on failure
      const revertedUser = { ...user, boltBalance: previousBalance };
      setUser(revertedUser);
      await persistUser(revertedUser);
      
      throw new Error('Failed to update balance. Please try again.');
    }
  }, [user, persistUser]);

  // Optimized refresh with cache invalidation
  const refreshUserData = useCallback(async (): Promise<void> => {
    if (!user) {
      console.warn('⚠️ No user to refresh');
      return;
    }

    try {
      console.log('🔄 Refreshing user data...');
      
      // Invalidate cache
      userCacheRef.current = null;
      
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await retryOperation(() => getDoc(userDocRef));

      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        setUser(userData);
        await persistUser(userData);
        console.log('✅ User data refreshed successfully');
        setIsOnline(true);
      } else {
        console.warn('⚠️ User document not found during refresh');
      }
    } catch (error) {
      console.error('❌ Error refreshing user data:', error);
      setIsOnline(false);
      throw new Error('Failed to refresh user data. Please try again.');
    }
  }, [user, persistUser]);

  // Cache clearing function
  const clearCache = useCallback(() => {
    console.log('🗑️ Clearing user cache...');
    userCacheRef.current = null;
    lastActiveUpdateRef.current = 0;
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateBoltBalance,
    refreshUserData,
    clearCache,
    isOnline
  }), [
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateBoltBalance,
    refreshUserData,
    clearCache,
    isOnline
  ]);

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
}