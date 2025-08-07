# 🔒 Boltha App Security Guide

## Table of Contents
1. [Environment Variables Setup](#environment-variables-setup)
2. [Firestore Security Rules](#firestore-security-rules)
3. [Deployment Guide](#deployment-guide)
4. [Security Best Practices](#security-best-practices)
5. [Testing Security Rules](#testing-security-rules)

---

## 🌍 Environment Variables Setup

### Step 1: Create Your Environment File

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Get your Firebase configuration:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Go to **Project Settings** > **General** > **Your apps**
   - Click on your web app or create one
   - Copy the configuration values

3. Fill in your `.env` file:
   ```env
   EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyC...
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
   EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-ABC123DEF
   EXPO_PUBLIC_ENV=development
   ```

### Step 2: Environment-Specific Configuration

For different environments, create separate files:
- `.env.development` - Development environment
- `.env.staging` - Staging environment  
- `.env.production` - Production environment

### Step 3: Verify Configuration

Start your app and check the console logs:
```bash
expo start
```

Look for these success messages:
```
🔥 Firebase Config Status:
  📱 Project ID: ✅ Set
  🔐 Auth Domain: ✅ Set
  📊 Analytics: ✅ Enabled
  🌍 Environment: development
✅ Firebase app initialized
✅ Firebase Auth initialized with AsyncStorage persistence
✅ Firestore and Storage initialized
```

---

## 🛡️ Firestore Security Rules

### Overview of Rules Structure

Our security rules implement a **zero-trust model** with the following principles:

1. **Authentication Required**: Most operations require authentication
2. **Data Ownership**: Users can only access their own data
3. **Field-Level Protection**: Critical fields like `boltBalance` are protected
4. **Immutable Records**: Transactions cannot be modified once created
5. **Validation**: All data inputs are validated for type and constraints

### Key Security Features

#### 🔐 User Data Protection
- Users can only read/write their own profile data
- Financial data (`boltBalance`, `totalEarned`, `totalSpent`) is protected from direct user modification
- Leaderboard access is limited to public fields only
- Account deletion is prevented to avoid data loss

#### 💰 Financial Integrity
- Transactions are immutable once created
- Bolt balances can only be modified through proper transaction flows
- All financial operations are logged and auditable

#### 🎁 Reward System Security
- Public read access for marketplace browsing
- Stock counts can only decrease (preventing artificial inflation)
- Reward creation requires authentication (admin-level in production)

#### 🎫 Redemption Protection
- Users can only access their own redemptions
- Status updates are restricted to valid transitions
- All redemption data is preserved (no deletion allowed)

---

## 🚀 Deployment Guide

### Step 1: Install Firebase CLI

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login
```

### Step 2: Initialize Firebase in Your Project

```bash
# Navigate to your project directory
cd bolta-app-fresh

# Initialize Firebase (if not already done)
firebase init

# Select:
# - Firestore: Configure security rules and indexes files
# - Functions (optional): Configure and deploy Cloud Functions
# - Storage: Configure security rules for Cloud Storage
```

### Step 3: Deploy Security Rules

```bash
# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Deploy everything (rules, indexes, functions)
firebase deploy

# Deploy to specific environment
firebase use staging  # or production
firebase deploy --only firestore:rules
```

### Step 4: Verify Deployment

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database** > **Rules**
4. Verify your rules are deployed and active

### Step 5: Test Your Rules

```bash
# Install Firebase emulator suite
firebase init emulators

# Start emulators for testing
firebase emulators:start --only firestore

# Run your app against local emulator
# Add this to your firebaseConfig.ts for testing:
# if (__DEV__) {
#   connectFirestoreEmulator(db, 'localhost', 8080);
# }
```

---

## 🔒 Security Best Practices

### 1. Environment Variables Security

#### ✅ DO:
- Use `EXPO_PUBLIC_` prefix for client-side variables
- Keep sensitive server-side keys in separate files
- Use different Firebase projects for dev/staging/production
- Regularly rotate API keys

#### ❌ DON'T:
- Commit `.env` files to version control
- Use production keys in development
- Share environment files via insecure channels
- Hard-code sensitive values in source code

### 2. Authentication Security

#### ✅ DO:
```typescript
// Implement proper error handling
const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    // Handle specific error codes
    switch (error.code) {
      case 'auth/user-not-found':
        throw new Error('No account found with this email');
      case 'auth/wrong-password':
        throw new Error('Incorrect password');
      case 'auth/too-many-requests':
        throw new Error('Too many failed attempts. Please try again later');
      default:
        throw new Error('Authentication failed');
    }
  }
};
```

#### ❌ DON'T:
- Store passwords in plain text
- Ignore authentication errors
- Allow unlimited login attempts
- Skip email verification in production

### 3. Data Validation

#### ✅ DO:
```typescript
// Client-side validation with Yup
const userSchema = yup.object().shape({
  email: yup.string().email().required(),
  name: yup.string().min(2).max(50).required(),
  boltBalance: yup.number().min(0).integer(),
});

// Server-side validation in Firestore rules
allow create: if request.resource.data.boltBalance is int &&
                 request.resource.data.boltBalance >= 0;
```

### 4. Network Security

#### ✅ DO:
- Use HTTPS for all API calls
- Implement request timeouts
- Add retry logic with exponential backoff
- Validate all server responses

```typescript
// Axios configuration with security
const apiClient = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for auth tokens
apiClient.interceptors.request.use(async (config) => {
  const token = await auth.currentUser?.getIdToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 5. Error Handling

#### ✅ DO:
```typescript
// Comprehensive error handling
const handleFirestoreError = (error: any) => {
  console.error('Firestore error:', error);
  
  switch (error.code) {
    case 'permission-denied':
      return 'You don\'t have permission to access this data';
    case 'not-found':
      return 'The requested data was not found';
    case 'unavailable':
      return 'Service temporarily unavailable. Please try again';
    default:
      return 'An unexpected error occurred';
  }
};
```

### 6. Logging and Monitoring

#### ✅ DO:
- Log security events (failed logins, permission denials)
- Monitor unusual patterns (rapid requests, failed transactions)
- Set up alerts for critical errors
- Use Firebase Analytics for user behavior insights

```typescript
// Security event logging
const logSecurityEvent = (event: string, details: any) => {
  console.warn(`🔒 Security Event: ${event}`, details);
  // In production, send to monitoring service
};
```

---

## 🧪 Testing Security Rules

### Local Testing with Emulator

1. **Set up test environment:**
   ```bash
   firebase emulators:start --only firestore
   ```

2. **Create test cases:**
   ```typescript
   // Example test
   describe('User Data Security', () => {
     it('should allow users to read their own data', async () => {
       const alice = testEnv.authenticatedContext('alice-uid');
       const aliceDoc = alice.firestore().doc('users/alice-uid');
       await firebase.assertSucceeds(aliceDoc.get());
     });

     it('should deny users from reading others data', async () => {
       const alice = testEnv.authenticatedContext('alice-uid');
       const bobDoc = alice.firestore().doc('users/bob-uid');
       await firebase.assertFails(bobDoc.get());
     });
   });
   ```

### Production Testing

1. **Monitor Firebase Console:**
   - Check **Authentication** > **Users** for unusual activity
   - Review **Firestore** > **Usage** for access patterns
   - Monitor **Functions** logs for errors

2. **Set up alerts:**
   - Failed authentication attempts
   - Permission denied errors
   - Unusual data access patterns

---

## 📋 Security Checklist

Before deploying to production:

- [ ] Environment variables are properly configured
- [ ] `.env` files are in `.gitignore`
- [ ] Firestore rules are deployed and tested
- [ ] Authentication error handling is implemented
- [ ] Data validation is in place (client and server)
- [ ] Logging and monitoring are configured
- [ ] Security rules are tested with emulator
- [ ] Different environments use separate Firebase projects
- [ ] API keys are rotated regularly
- [ ] Error messages don't expose sensitive information

---

## 🆘 Troubleshooting

### Common Issues

#### 1. "Missing environment variables" error
**Solution:** Ensure your `.env` file is in the project root and contains all required variables.

#### 2. "Permission denied" in Firestore
**Solution:** Check your security rules and ensure the user is authenticated and accessing their own data.

#### 3. "Firebase app already initialized" error
**Solution:** This usually happens in development. The updated `firebaseConfig.ts` handles this gracefully.

#### 4. Emulator connection issues
**Solution:** Make sure emulators are running and your app is configured to connect to them in development mode.

### Getting Help

- **Firebase Documentation:** https://firebase.google.com/docs
- **Expo Documentation:** https://docs.expo.dev/
- **Security Rules Reference:** https://firebase.google.com/docs/firestore/security/rules-conditions

---

## 🔄 Regular Security Maintenance

### Monthly Tasks:
- [ ] Review authentication logs for suspicious activity
- [ ] Update dependencies to latest versions
- [ ] Rotate API keys if needed
- [ ] Review and test security rules

### Quarterly Tasks:
- [ ] Security audit of codebase
- [ ] Performance review of security rules
- [ ] Update security documentation
- [ ] Review user permissions and access patterns

---

*Last updated: [Current Date]*
*Version: 1.0*