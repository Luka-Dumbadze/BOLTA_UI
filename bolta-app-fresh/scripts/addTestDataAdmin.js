// scripts/addTestDataAdmin.js
// Run this script to add test rewards to your Firestore database using Admin SDK
// This bypasses security rules and requires a service account key
// Usage: node scripts/addTestDataAdmin.js

const admin = require('firebase-admin');

// Check if service account key exists
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : null;

if (!serviceAccount) {
  console.log('🔧 Firebase Admin SDK not configured.');
  console.log('To use this script, you need to:');
  console.log('1. Download your service account key from Firebase Console');
  console.log('2. Set FIREBASE_SERVICE_ACCOUNT_KEY environment variable');
  console.log('');
  console.log('For development, you can use the regular script with proper Firestore rules instead.');
  console.log('See README.md for Firestore security rules setup.');
  process.exit(0);
}

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = admin.firestore();

// Test rewards data
const testRewards = [
  {
    partnerName: "Starbucks",
    rewardTitle: "$5 Coffee Gift Card",
    rewardDescription: "Enjoy a $5 gift card to use at any Starbucks location. Perfect for your morning coffee!",
    boltCost: 50,
    logoUrl: "https://via.placeholder.com/100x100?text=Starbucks",
    category: "Food & Drinks",
    isActive: true,
    stockCount: 100,
    expiryDays: 365,
    termsAndConditions: "Valid at participating locations. Cannot be combined with other offers.",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    partnerName: "Amazon",
    rewardTitle: "$10 Amazon Gift Card",
    rewardDescription: "Get a $10 Amazon gift card to use on millions of products. Free shipping included!",
    boltCost: 100,
    logoUrl: "https://via.placeholder.com/100x100?text=Amazon",
    category: "Shopping",
    isActive: true,
    stockCount: 50,
    expiryDays: 730,
    termsAndConditions: "Valid for Amazon.com purchases only. Cannot be resold.",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    partnerName: "Netflix",
    rewardTitle: "1 Month Netflix Subscription",
    rewardDescription: "Enjoy one month of Netflix premium streaming. Watch thousands of movies and shows!",
    boltCost: 150,
    logoUrl: "https://via.placeholder.com/100x100?text=Netflix",
    category: "Entertainment",
    isActive: true,
    stockCount: 25,
    expiryDays: 30,
    termsAndConditions: "For new users only. Auto-renewal may apply.",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    partnerName: "McDonald's",
    rewardTitle: "Free Big Mac Meal",
    rewardDescription: "Enjoy a free Big Mac meal including fries and a drink at participating McDonald's locations.",
    boltCost: 75,
    logoUrl: "https://via.placeholder.com/100x100?text=McDonalds",
    category: "Food & Drinks",
    isActive: true,
    stockCount: 200,
    expiryDays: 60,
    termsAndConditions: "Valid at participating locations. Must present coupon code.",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    partnerName: "Spotify",
    rewardTitle: "3 Months Spotify Premium",
    rewardDescription: "Get 3 months of ad-free music streaming with Spotify Premium. Download and listen offline!",
    boltCost: 120,
    logoUrl: "https://via.placeholder.com/100x100?text=Spotify",
    category: "Entertainment",
    isActive: true,
    stockCount: 75,
    expiryDays: 90,
    termsAndConditions: "For new premium users only. Auto-renewal applies after trial.",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }
];

async function addTestData() {
  try {
    console.log('Adding test rewards to Firestore using Admin SDK...');
    
    const batch = db.batch();
    
    testRewards.forEach((reward) => {
      const docRef = db.collection('rewards').doc();
      batch.set(docRef, reward);
    });
    
    await batch.commit();
    
    console.log('✅ All test rewards added successfully!');
    console.log('You can now see rewards in your marketplace.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding test data:', error);
    process.exit(1);
  }
}

addTestData();