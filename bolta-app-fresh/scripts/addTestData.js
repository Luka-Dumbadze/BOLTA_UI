// scripts/addTestData.js
// Run this script to add test rewards to your Firestore database
// Usage: node scripts/addTestData.js

// Import Firebase v9+ SDK with CommonJS
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Check if Firebase config exists
if (!process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID) {
  console.error('❌ Firebase configuration not found!');
  console.log('Make sure you have created a .env.local file with your Firebase config.');
  console.log('See README.md for setup instructions.');
  process.exit(1);
}

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
console.log('🔥 Initializing Firebase...');
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Test rewards data
const rewards = [
  {
    rewardTitle: "$5 Coffee Gift Card",
    rewardDescription: "Enjoy a $5 gift card to use at any Starbucks location. Perfect for your morning coffee!",
    partnerName: "Starbucks",
    boltCost: 50,
    category: "Food & Drink",
    stockCount: 100,
    isActive: true,
    expiryDays: 365,
    imageUrl: "https://via.placeholder.com/300x200?text=Starbucks+Gift+Card",
    termsAndConditions: "Valid at participating locations. Cannot be combined with other offers.",
    createdAt: serverTimestamp(),
  },
  {
    rewardTitle: "$10 Amazon Gift Card",
    rewardDescription: "Get a $10 Amazon gift card to use on millions of products. Free shipping included!",
    partnerName: "Amazon",
    boltCost: 100,
    category: "Shopping",
    stockCount: 50,
    isActive: true,
    expiryDays: 365,
    imageUrl: "https://via.placeholder.com/300x200?text=Amazon+Gift+Card",
    termsAndConditions: "Valid on Amazon.com. Cannot be resold or transferred.",
    createdAt: serverTimestamp(),
  },
  {
    rewardTitle: "$15 Movie Theater Voucher",
    rewardDescription: "Experience the latest blockbusters with a $15 movie theater voucher. Includes one standard ticket.",
    partnerName: "AMC Theaters",
    boltCost: 150,
    category: "Entertainment",
    stockCount: 25,
    isActive: true,
    expiryDays: 180,
    imageUrl: "https://via.placeholder.com/300x200?text=Movie+Voucher",
    termsAndConditions: "Valid at participating AMC locations. Subject to availability and showtimes.",
    createdAt: serverTimestamp(),
  },
  {
    rewardTitle: "$25 Restaurant Gift Card",
    rewardDescription: "Treat yourself to a delicious meal with a $25 gift card to popular restaurant chains.",
    partnerName: "Various Restaurants",
    boltCost: 250,
    category: "Food & Drink",
    stockCount: 30,
    isActive: true,
    expiryDays: 365,
    imageUrl: "https://via.placeholder.com/300x200?text=Restaurant+Gift+Card",
    termsAndConditions: "Valid at participating restaurant locations. Cannot be combined with other promotions.",
    createdAt: serverTimestamp(),
  },
  {
    rewardTitle: "$50 Shopping Spree",
    rewardDescription: "Go on a shopping spree with a $50 gift card to major retail stores. Fashion, electronics, and more!",
    partnerName: "Target",
    boltCost: 500,
    category: "Shopping",
    stockCount: 15,
    isActive: true,
    expiryDays: 365,
    imageUrl: "https://via.placeholder.com/300x200?text=Shopping+Spree",
    termsAndConditions: "Valid at Target stores and online. Some restrictions may apply.",
    createdAt: serverTimestamp(),
  }
];

// Function to add rewards to Firestore
async function addTestRewards() {
  console.log('📝 Adding test rewards to Firestore...');
  
  try {
    const rewardsRef = collection(db, 'rewards');
    
    for (let i = 0; i < rewards.length; i++) {
      const reward = rewards[i];
      console.log(`   Adding reward ${i + 1}/${rewards.length}: ${reward.rewardTitle}`);
      
      const docRef = await addDoc(rewardsRef, reward);
      console.log(`   ✅ Added with ID: ${docRef.id}`);
    }
    
    console.log('');
    console.log('🎉 Success! All test rewards have been added to Firestore.');
    console.log('');
    console.log('You can now see rewards in your marketplace.');
    console.log('');
    console.log('Next steps:');
    console.log('1. Start your app: npm start');
    console.log('2. Navigate to the Marketplace tab');
    console.log('3. Try redeeming a reward!');
    
  } catch (error) {
    console.error('❌ Error adding test rewards:', error);
    
    if (error.code === 'permission-denied') {
      console.log('');
      console.log('🔧 This looks like a Firestore rules issue.');
      console.log('Make sure you have set up the Firestore security rules as described in the README.');
      console.log('Run: node scripts/setupFirestore.js for instructions.');
    }
  }
}

// Run the script
console.log('🚀 BOLTA Test Data Setup');
console.log('========================');
console.log(`📡 Project ID: ${firebaseConfig.projectId}`);
console.log('');

addTestRewards();