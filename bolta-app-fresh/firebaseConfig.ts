// firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Validate environment variables
const requiredEnvVars = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Check for missing environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.warn(
    `Missing Firebase environment variables: ${missingVars.join(", ")}`
  );
  // Don't throw error in development, just warn
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
  }
}

// Firebase configuration
const firebaseConfig = {
  apiKey: requiredEnvVars.apiKey!,
  authDomain: requiredEnvVars.authDomain!,
  projectId: requiredEnvVars.projectId!,
  storageBucket: requiredEnvVars.storageBucket!,
  messagingSenderId: requiredEnvVars.messagingSenderId!,
  appId: requiredEnvVars.appId!,
  measurementId: requiredEnvVars.measurementId!,
};

console.log('🔥 Firebase Config - Project ID:', firebaseConfig.projectId);
console.log('🔥 Firebase Config - Auth Domain:', firebaseConfig.authDomain);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log('✅ Firebase app initialized');

// Initialize Auth with AsyncStorage persistence
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
  console.log('✅ Firebase Auth initialized with AsyncStorage persistence');
} catch (error) {
  console.error('❌ Error initializing Firebase Auth:', error);
  throw error;
}

// Initialize other services
const db = getFirestore(app);
const storage = getStorage(app);
console.log('✅ Firestore and Storage initialized');

export { auth, db, storage };
export default app;