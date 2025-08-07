// firebaseConfig.ts
import { initializeApp, FirebaseApp, getApps } from "firebase/app";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { initializeAuth, getReactNativePersistence, Auth, getAuth } from "firebase/auth";
import { getFirestore, Firestore, connectFirestoreEmulator } from "firebase/firestore";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Constants for optimization
const FIREBASE_CONFIG_CACHE_KEY = 'firebase_config_validated';
const CONFIG_VALIDATION_TIMEOUT = 5000; // 5 seconds

// Optimized environment validation helper with caching
const getEnvVar = (() => {
  const cache = new Map<string, string>();
  
  return (key: string, required: boolean = true): string => {
    // Check cache first
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const value = process.env[key];
    if (required && !value) {
      const errorMsg = `Missing required environment variable: ${key}`;
      console.error('🔥❌', errorMsg);
      if (process.env.NODE_ENV === 'production') {
        throw new Error(errorMsg);
      }
      cache.set(key, ''); // Cache empty string for development
      return '';
    }
    
    const finalValue = value || '';
    cache.set(key, finalValue);
    return finalValue;
  };
})();

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

// Optimized Firebase initialization with singleton pattern
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

const initializeFirebaseServices = (): { app: FirebaseApp; auth: Auth; db: Firestore; storage: FirebaseStorage } => {
  try {
    // Check if Firebase is already initialized (singleton pattern)
    const existingApps = getApps();
    if (existingApps.length > 0) {
      console.log('🔄 Using existing Firebase app instance');
      app = existingApps[0];
      auth = getAuth(app);
      db = getFirestore(app);
      storage = getStorage(app);
      return { app, auth, db, storage };
    }

    // Log configuration status (without sensitive data)
    console.log('🔥 Firebase Config Status:');
    console.log('  📱 Project ID:', firebaseConfig.projectId ? '✅ Set' : '❌ Missing');
    console.log('  🔐 Auth Domain:', firebaseConfig.authDomain ? '✅ Set' : '❌ Missing');
    console.log('  📊 Analytics:', firebaseConfig.measurementId ? '✅ Enabled' : '⚠️  Disabled');
    console.log('  🌍 Environment:', process.env.EXPO_PUBLIC_ENV || 'development');

    // Initialize Firebase app
    app = initializeApp(firebaseConfig);
    console.log('✅ Firebase app initialized');

    // Initialize Auth with AsyncStorage persistence
    try {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage)
      });
      console.log('✅ Firebase Auth initialized with AsyncStorage persistence');
    } catch (authError: any) {
      // Handle case where auth is already initialized
      if (authError.code === 'auth/already-initialized') {
        console.log('🔄 Using existing Firebase Auth instance');
        auth = getAuth(app);
      } else {
        console.error('❌ Error initializing Firebase Auth:', authError);
        throw authError;
      }
    }

    // Initialize other services
    db = getFirestore(app);
    storage = getStorage(app);

    // Connect to emulator in development
    if (__DEV__ && process.env.EXPO_PUBLIC_USE_EMULATOR === 'true') {
      try {
        connectFirestoreEmulator(db, 'localhost', 8080);
        console.log('🧪 Connected to Firestore emulator');
      } catch (emulatorError) {
        console.warn('⚠️ Failed to connect to Firestore emulator:', emulatorError);
      }
    }

    console.log('✅ All Firebase services initialized');
    return { app, auth, db, storage };

  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    throw error;
  }
};

// Initialize Firebase services
const firebaseServices = initializeFirebaseServices();
app = firebaseServices.app;
auth = firebaseServices.auth;
db = firebaseServices.db;
storage = firebaseServices.storage;

// Performance monitoring (optional)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  // Add performance monitoring in production
  import('firebase/performance').then(({ getPerformance, trace }) => {
    const perf = getPerformance(app);
    console.log('📊 Firebase Performance monitoring enabled');
  }).catch((perfError) => {
    console.warn('⚠️ Performance monitoring not available:', perfError);
  });
}

export { auth, db, storage };
export default app;