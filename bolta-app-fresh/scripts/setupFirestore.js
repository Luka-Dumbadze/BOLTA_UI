// scripts/setupFirestore.js
// Quick setup script for Firestore in development mode
// Usage: node scripts/setupFirestore.js

console.log('🔧 Firestore Setup Guide');
console.log('========================');
console.log('');
console.log('To fix the permission errors, you need to configure Firestore security rules:');
console.log('');
console.log('1. Go to Firebase Console: https://console.firebase.google.com/');
console.log('2. Select your project');
console.log('3. Go to Firestore Database');
console.log('4. Click on "Rules" tab');
console.log('5. Replace the rules with:');
console.log('');
console.log('   rules_version = \'2\';');
console.log('   service cloud.firestore {');
console.log('     match /databases/{database}/documents {');
console.log('       // Allow public read access to rewards (for marketplace)');
console.log('       match /rewards/{document} {');
console.log('         allow read: if true;');
console.log('         allow write: if true; // TEMPORARY: Remove this in production');
console.log('       }');
console.log('       ');
console.log('       // Allow authenticated users to access their own data');
console.log('       match /users/{userId} {');
console.log('         allow read, write: if request.auth != null && request.auth.uid == userId;');
console.log('       }');
console.log('     }');
console.log('   }');
console.log('');
console.log('6. Click "Publish"');
console.log('');
console.log('🚨 IMPORTANT: The "allow write: if true" rule for rewards is for development only!');
console.log('   Remove it in production and use proper authentication.');
console.log('');
console.log('After setting up the rules, run:');
console.log('   node scripts/addTestData.js');
console.log('');
console.log('For production setup with Admin SDK, see:');
console.log('   node scripts/addTestDataAdmin.js');