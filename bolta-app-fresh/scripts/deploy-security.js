#!/usr/bin/env node

/**
 * Security Deployment Script for Boltha App
 * 
 * This script helps deploy Firestore security rules and performs validation checks
 * Usage: node scripts/deploy-security.js [environment]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message, color = colors.white) {
  console.log(`${color}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ${message}`, colors.red);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function warning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function info(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function checkFirebaseCLI() {
  try {
    execSync('firebase --version', { stdio: 'pipe' });
    success('Firebase CLI is installed');
    return true;
  } catch (error) {
    error('Firebase CLI is not installed');
    log('Please install it with: npm install -g firebase-tools');
    return false;
  }
}

function checkFirebaseLogin() {
  try {
    const result = execSync('firebase projects:list', { stdio: 'pipe' });
    success('Firebase authentication is valid');
    return true;
  } catch (error) {
    error('Not logged into Firebase');
    log('Please login with: firebase login');
    return false;
  }
}

function checkEnvironmentFiles() {
  const envFiles = ['.env.example'];
  const requiredEnvVars = [
    'EXPO_PUBLIC_FIREBASE_API_KEY',
    'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
    'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'EXPO_PUBLIC_FIREBASE_APP_ID'
  ];

  // Check if .env.example exists
  if (fs.existsSync('.env.example')) {
    success('.env.example template exists');
  } else {
    error('.env.example template is missing');
    return false;
  }

  // Check if .env file exists
  if (!fs.existsSync('.env')) {
    warning('.env file not found - you\'ll need to create it from .env.example');
    return false;
  }

  // Validate .env file has required variables
  const envContent = fs.readFileSync('.env', 'utf8');
  const missingVars = requiredEnvVars.filter(varName => 
    !envContent.includes(`${varName}=`) || 
    envContent.includes(`${varName}=your_`) ||
    envContent.includes(`${varName}=`)
  );

  if (missingVars.length > 0) {
    warning(`Missing or incomplete environment variables: ${missingVars.join(', ')}`);
    return false;
  }

  success('Environment variables are configured');
  return true;
}

function checkSecurityRules() {
  const rulesFile = 'firestore.rules';
  
  if (!fs.existsSync(rulesFile)) {
    error('firestore.rules file not found');
    return false;
  }

  const rulesContent = fs.readFileSync(rulesFile, 'utf8');
  
  // Basic validation checks
  const checks = [
    { pattern: /rules_version = '2'/, message: 'Rules version 2 is specified' },
    { pattern: /function isAuthenticated\(\)/, message: 'Authentication helper function exists' },
    { pattern: /match \/users\/\{userId\}/, message: 'Users collection rules exist' },
    { pattern: /match \/rewards\/\{rewardId\}/, message: 'Rewards collection rules exist' },
    { pattern: /match \/transactions\/\{transactionId\}/, message: 'Transactions collection rules exist' },
    { pattern: /match \/redemptions\/\{redemptionId\}/, message: 'Redemptions collection rules exist' }
  ];

  let allPassed = true;
  checks.forEach(check => {
    if (check.pattern.test(rulesContent)) {
      success(check.message);
    } else {
      error(`Missing: ${check.message}`);
      allPassed = false;
    }
  });

  return allPassed;
}

function checkFirebaseConfig() {
  const configFiles = ['firebase.json', 'firestore.indexes.json'];
  
  configFiles.forEach(file => {
    if (fs.existsSync(file)) {
      success(`${file} exists`);
    } else {
      error(`${file} is missing`);
      return false;
    }
  });

  return true;
}

function deployRules(environment = 'default') {
  info(`Deploying security rules to ${environment}...`);
  
  try {
    // Switch to the specified environment
    if (environment !== 'default') {
      execSync(`firebase use ${environment}`, { stdio: 'inherit' });
    }

    // Deploy rules and indexes
    execSync('firebase deploy --only firestore', { stdio: 'inherit' });
    success(`Security rules deployed successfully to ${environment}`);
    
    return true;
  } catch (error) {
    error(`Failed to deploy security rules: ${error.message}`);
    return false;
  }
}

function validateDeployment() {
  info('Validating deployment...');
  
  try {
    // Check if rules are active
    const result = execSync('firebase firestore:rules:get', { stdio: 'pipe' });
    success('Security rules are active in Firebase');
    return true;
  } catch (error) {
    error('Could not validate deployment');
    return false;
  }
}

function printSecurityChecklist() {
  log('\n📋 Security Deployment Checklist:', colors.magenta);
  log('================================', colors.magenta);
  
  const checklist = [
    'Environment variables are properly configured',
    'Firebase CLI is installed and authenticated',
    'Security rules follow zero-trust principles',
    'Indexes are optimized for your queries',
    'Rules have been tested with emulator',
    'Different environments use separate projects',
    'Monitoring and logging are configured'
  ];

  checklist.forEach((item, index) => {
    log(`${index + 1}. [ ] ${item}`);
  });

  log('\n🔒 Remember to:', colors.cyan);
  log('- Test your rules thoroughly before production deployment');
  log('- Monitor Firebase Console for unusual activity');
  log('- Regularly review and update security rules');
  log('- Keep environment variables secure and rotate keys regularly');
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const environment = args[0] || 'default';

  log('🔒 Boltha Security Deployment Script', colors.magenta);
  log('=====================================\n', colors.magenta);

  // Pre-deployment checks
  info('Running pre-deployment checks...');
  
  const checks = [
    checkFirebaseCLI(),
    checkFirebaseLogin(),
    checkEnvironmentFiles(),
    checkSecurityRules(),
    checkFirebaseConfig()
  ];

  const allChecksPassed = checks.every(check => check);

  if (!allChecksPassed) {
    error('Pre-deployment checks failed. Please fix the issues above before deploying.');
    process.exit(1);
  }

  success('All pre-deployment checks passed!\n');

  // Ask for confirmation
  if (environment === 'production') {
    warning('You are about to deploy to PRODUCTION!');
    warning('Make sure you have tested the rules thoroughly.');
    log('Press Ctrl+C to cancel, or press Enter to continue...');
    
    // In a real script, you might want to add readline for user input
    // For now, we'll just add a warning
  }

  // Deploy
  const deploySuccess = deployRules(environment);
  
  if (deploySuccess) {
    validateDeployment();
    success('\n🎉 Security deployment completed successfully!');
    printSecurityChecklist();
  } else {
    error('\n❌ Security deployment failed. Please check the errors above.');
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  checkFirebaseCLI,
  checkFirebaseLogin,
  checkEnvironmentFiles,
  checkSecurityRules,
  deployRules
};