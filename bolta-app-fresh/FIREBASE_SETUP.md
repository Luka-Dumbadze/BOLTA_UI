# Firebase Auth Setup and Fixes

## Issues Fixed

### 1. Firebase Auth AsyncStorage Warning
**Problem**: "You are initializing Firebase Auth for React Native without providing AsyncStorage"

**Solution**: 
- ✅ AsyncStorage is properly configured in `firebaseConfig.ts`
- ✅ Using `initializeAuth` with `getReactNativePersistence(ReactNativeAsyncStorage)`
- ✅ Package `@react-native-async-storage/async-storage` is installed

### 2. INTERNAL ASSERTION FAILED Error
**Problem**: "INTERNAL ASSERTION FAILED: Expected a class definition"

**Solution**:
- ✅ Removed conflicting App.tsx that was causing initialization conflicts
- ✅ App now uses Expo Router architecture with proper entry point
- ✅ Added defensive error handling in Firebase initialization

### 3. Firestore Permissions Error
**Problem**: "Missing or insufficient permissions" for leaderboard queries

**Solution**:
- ✅ Leaderboard component now only queries when user is authenticated
- ✅ Added fallback UI for unauthenticated users
- ✅ Improved auth state handling in SessionProvider
- ✅ Added better error logging and user feedback

## Configuration Required

### 1. Environment Variables
Create a `.env` file in the project root with your Firebase configuration:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 2. Firestore Security Rules
The current rules in `firestore.rules` are properly configured:
- Users can read/write their own data
- Authenticated users can read public user data for leaderboards
- Rewards are publicly readable but only authenticated users can modify
- Redemptions require authentication

## Architecture Changes

### 1. Entry Point
- ✅ Uses Expo Router with `index.ts` → `expo-router/entry`
- ✅ Main layout in `app/_layout.tsx` with SessionProvider
- ✅ Removed conflicting `App.tsx` component

### 2. Authentication Flow
- ✅ SessionProvider handles auth state and persistence
- ✅ AsyncStorage integration for offline persistence
- ✅ Automatic user document creation in Firestore
- ✅ Proper cleanup on sign out

### 3. Error Handling
- ✅ Graceful degradation when Firebase config is missing
- ✅ Fallback UI for authentication issues
- ✅ Comprehensive logging for debugging

## Testing

To verify the fixes:

1. Start the development server:
   ```bash
   npm start
   ```

2. Check console logs for:
   - ✅ Firebase app initialized
   - ✅ Firebase Auth initialized with AsyncStorage persistence
   - ✅ Firestore and Storage initialized

3. Test authentication:
   - Sign up/sign in should work without warnings
   - Auth state should persist between app restarts
   - Leaderboard should load for authenticated users

## Troubleshooting

### If you still see AsyncStorage warnings:
- Clear Metro cache: `npx expo start --clear`
- Restart development server
- Check that no other Firebase auth instances are created

### If Firestore permissions fail:
- Ensure user is authenticated before querying
- Check Firebase console for active authentication
- Verify Firestore rules are deployed

### If auth state doesn't persist:
- Check AsyncStorage permissions in app settings
- Verify environment variables are loaded
- Check console logs for initialization errors