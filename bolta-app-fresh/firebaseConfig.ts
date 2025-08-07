// firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Environment validation helper
const getEnvVar = (key: string, required: boolean = true): string => {
  const value = process.env[key];
  if (required && !value) {
    const errorMsg = `Missing required environment variable: ${key}`;
    console.error('🔥❌', errorMsg);
    if (process.env.NODE_ENV === 'production') {
      throw new Error(errorMsg);
    }
    return ''; // Return empty string for development
  }
  return value || '';
};

// Validate and extract environment variables
const requiredEnvVars = {
  apiKey: getEnvVar('EXPO_PUBLIC_FIREBASE_API_KEY'),
  authDomain: getEnvVar('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('EXPO_PUBLIC_FIREBASE_APP_ID'),
  measurementId: getEnvVar('EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID', false), // Optional for Analytics
};

// Check for missing environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => key !== 'measurementId' && !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.warn(
    `🔥⚠️  Missing Firebase environment variables: ${missingVars.join(", ")}`
  );
  console.warn('📋 Please check your .env file and ensure all required variables are set.');
  
  // Only throw in production
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
  }
}

// Firebase configuration object
const firebaseConfig = {
  apiKey: requiredEnvVars.apiKey,
  authDomain: requiredEnvVars.authDomain,
  projectId: requiredEnvVars.projectId,
  storageBucket: requiredEnvVars.storageBucket,
  messagingSenderId: requiredEnvVars.messagingSenderId,
  appId: requiredEnvVars.appId,
  ...(requiredEnvVars.measurementId && { measurementId: requiredEnvVars.measurementId }),
};

// Log configuration status (without sensitive data)
console.log('🔥 Firebase Config Status:');
console.log('  📱 Project ID:', firebaseConfig.projectId ? '✅ Set' : '❌ Missing');
console.log('  🔐 Auth Domain:', firebaseConfig.authDomain ? '✅ Set' : '❌ Missing');
console.log('  📊 Analytics:', firebaseConfig.measurementId ? '✅ Enabled' : '⚠️  Disabled');
console.log('  🌍 Environment:', process.env.EXPO_PUBLIC_ENV || 'development');

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