// scripts/addTestDataSimple.js
// Simple script to add test rewards using existing Firebase config
// Usage: node scripts/addTestDataSimple.js

const admin = require('firebase-admin');

// Initialize Firebase Admin (you'll need to set up service account)
// For now, this script shows you the data structure needed

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
    createdAt: new Date(),
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
    createdAt: new Date(),
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
    createdAt: new Date(),
  }
];

console.log('🎯 BOLTA Test Data Structure');
console.log('============================');
console.log('');
console.log('Since Firebase permissions need to be set up first, here\'s the data structure:');
console.log('');
console.log('You can manually add these rewards to your Firestore database:');
console.log('1. Go to Firebase Console > Firestore Database');
console.log('2. Create a collection called "rewards"');
console.log('3. Add documents with this structure:');
console.log('');

rewards.forEach((reward, index) => {
  console.log(`Reward ${index + 1}:`);
  console.log(JSON.stringify(reward, null, 2));
  console.log('---');
});

console.log('');
console.log('⚠️  IMPORTANT: Set up Firestore security rules first!');
console.log('Run: node scripts/setupFirestore.js for instructions.');