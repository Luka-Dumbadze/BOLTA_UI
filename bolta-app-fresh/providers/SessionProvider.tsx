// providers/SessionProvider.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
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

interface SessionContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateBoltBalance: (newBalance: number) => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  updateBoltBalance: async () => {},
  refreshUserData: async () => {},
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

  // Load persisted user data on app start
  useEffect(() => {
    const loadPersistedUser = async () => {
      try {
        const persistedUser = await AsyncStorage.getItem('bolta_user');
        if (persistedUser) {
          const userData = JSON.parse(persistedUser);
          setUser(userData);
          console.log('Loaded persisted user:', userData.email);
        }
      } catch (error) {
        console.error('Error loading persisted user:', error);
      } finally {
        // Only set loading to false if no persisted user was found
        // If we have a persisted user, let Firebase auth state handle the loading state
        const persistedUser = await AsyncStorage.getItem('bolta_user');
        if (!persistedUser) {
          setLoading(false);
        }
      }
    };

    loadPersistedUser();
  }, []);

  // Helper function to persist user data
  const persistUser = async (userData: User | null) => {
    try {
      if (userData) {
        await AsyncStorage.setItem('bolta_user', JSON.stringify(userData));
      } else {
        await AsyncStorage.removeItem('bolta_user');
      }
    } catch (error) {
      console.error('Error persisting user data:', error);
    }
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(
      auth,
      async (firebaseUser: FirebaseUser | null) => {
        console.log('Auth state changed:', firebaseUser ? firebaseUser.email : 'null');
        
        if (firebaseUser) {
          try {
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
              const userData = userDoc.data() as User;
              
              const now: FirebaseTimestamp = {
                seconds: Math.floor(Date.now() / 1000),
                nanoseconds: 0
              };
              
              await updateDoc(userDocRef, {
                lastActive: now
              });

              const updatedUser = {
                ...userData,
                lastActive: now
              };

              console.log('Setting user from Firestore:', updatedUser.email, 'Balance:', updatedUser.boltBalance);
              setUser(updatedUser);
              await persistUser(updatedUser); // Persist to AsyncStorage
            } else {
              // User document doesn't exist - create it for existing authenticated users
              console.log('User document not found, creating one...');
              
              const now: FirebaseTimestamp = {
                seconds: Math.floor(Date.now() / 1000),
                nanoseconds: 0
              };

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
                await setDoc(userDocRef, newUser);
                setUser(newUser);
                await persistUser(newUser);
                console.log('User document created successfully');
              } catch (createError) {
                console.error('Error creating user document:', createError);
                // If we can't create the document, still set a basic user object
                setUser({
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
                });
              }
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
            setUser(null);
            await persistUser(null);
          }
        } else {
          console.log('🔥 Auth state: No authenticated user, clearing user state');
          setUser(null);
          await persistUser(null);
          console.log('🔥 Auth state: User state and storage cleared');
        }
        console.log('🔥 Auth state: Setting loading to false');
        setLoading(false);
      },
      (error) => {
        console.error('Auth state change error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribeAuth();
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string): Promise<void> => {
    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
      
      const now: FirebaseTimestamp = {
        seconds: Math.floor(Date.now() / 1000),
        nanoseconds: 0
      };

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

      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    console.log('🚪 Starting regular sign out process...');
    
    try {
      // Step 1: Sign out from Firebase first (this will trigger auth state change)
      await firebaseSignOut(auth);
      console.log('✅ Firebase sign out successful');
      
      // Step 2: Clear local state immediately after Firebase signout
      setUser(null);
      console.log('✅ User state cleared');
      
      // Step 3: Clear persisted storage
      await persistUser(null);
      console.log('✅ Persisted data cleared');
      
    } catch (error) {
      console.error('⚠️ Firebase sign out error, clearing local state anyway:', error);
      
      // If Firebase fails, still clear local state
      setUser(null);
      try {
        await persistUser(null);
        console.log('✅ Local data cleared despite Firebase error');
      } catch (storageError) {
        console.error('⚠️ Storage clear error:', storageError);
      }
    }
    
    console.log('🎉 Regular sign out process completed');
  };

  const updateBoltBalance = async (newBalance: number): Promise<void> => {
    if (!user) {
      throw new Error('No user logged in');
    }

    try {
      console.log('Updating bolt balance from', user.boltBalance, 'to', newBalance);
      
      // Update local state immediately for instant UI feedback
      const updatedUser = { ...user, boltBalance: newBalance };
      setUser(updatedUser);
      await persistUser(updatedUser); // Persist updated data immediately
      
      // Then update Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        boltBalance: newBalance
      });
      
      console.log('Bolt balance updated successfully');
    } catch (error) {
      console.error('Error updating bolt balance:', error);
      // Revert local state if Firestore update fails
      setUser(user);
      await persistUser(user);
      throw error;
    }
  };

  const refreshUserData = async (): Promise<void> => {
    if (!user) {
      return;
    }

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        setUser(userData);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
      throw error;
    }
  };

  return (
    <SessionContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        updateBoltBalance,
        refreshUserData
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}