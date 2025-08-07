// types/index.ts

// Base timestamp interface for Firebase
export interface FirebaseTimestamp {
  readonly seconds: number;
  readonly nanoseconds: number;
}

// User preferences with strict typing
export interface UserPreferences {
  readonly notifications: boolean;
  readonly theme: 'light' | 'dark';
}

// Achievement types for better type safety
export type Achievement = 
  | 'first_redemption'
  | 'big_spender'
  | 'saver'
  | 'early_adopter'
  | 'loyal_customer'
  | string; // Allow custom achievements

// Optimized User interface with readonly fields where appropriate
export interface User {
  readonly uid: string;
  readonly name: string;
  readonly email: string;
  readonly profilePictureUrl?: string;
  readonly boltBalance: number;
  readonly createdAt: FirebaseTimestamp;
  readonly lastActive: FirebaseTimestamp;
  readonly preferences: UserPreferences;
  readonly achievements: Achievement[];
  readonly totalEarned: number;
  readonly totalSpent: number;
}

// Reward category types for better type safety
export type RewardCategory = 
  | 'Food & Drink'
  | 'Shopping'
  | 'Entertainment'
  | 'Travel'
  | 'Health & Fitness'
  | 'Technology'
  | string; // Allow custom categories

// Optimized Reward interface
export interface Reward {
  readonly rewardId: string;
  readonly partnerName: string;
  readonly rewardTitle: string;
  readonly rewardDescription: string;
  readonly boltCost: number;
  readonly logoUrl?: string; // Optional since some rewards might not have logos
  readonly category: RewardCategory;
  readonly isActive: boolean;
  readonly stockCount: number;
  readonly expiryDays: number;
  readonly termsAndConditions: string;
  readonly createdAt: FirebaseTimestamp;
  readonly updatedAt: FirebaseTimestamp;
}

// Transaction types for better type safety
export type TransactionType = 'earn' | 'spend' | 'bonus';

export type TransactionSource = 
  | 'daily_checkin'
  | 'reward_redemption'
  | 'referral'
  | 'challenge'
  | 'signup_bonus'
  | 'admin_adjustment';

// Transaction metadata interface
export interface TransactionMetadata {
  readonly challengeId?: string;
  readonly rewardId?: string;
  readonly referralUserId?: string;
  readonly adminNote?: string;
}

// Optimized Transaction interface
export interface Transaction {
  readonly transactionId: string;
  readonly userId: string;
  readonly type: TransactionType;
  readonly amount: number;
  readonly description: string;
  readonly source: TransactionSource;
  readonly metadata: TransactionMetadata;
  readonly timestamp: FirebaseTimestamp;
}

// Redemption status types for better type safety
export type RedemptionStatus = 
  | 'pending'
  | 'completed'
  | 'expired'
  | 'cancelled'
  | 'processing';

// Optimized Redemption interface
export interface Redemption {
  readonly redemptionId: string;
  readonly userId: string;
  readonly rewardId: string;
  readonly boltsCost: number;
  readonly status: RedemptionStatus;
  readonly redemptionCode: string;
  readonly redeemedAt: FirebaseTimestamp;
  readonly expiresAt: FirebaseTimestamp;
}

// Additional utility types for better development experience
export type UserUpdate = Partial<Pick<User, 'name' | 'profilePictureUrl' | 'preferences'>>;
export type RewardUpdate = Partial<Pick<Reward, 'isActive' | 'stockCount' | 'boltCost'>>;

// API Response types
export interface ApiResponse<T = any> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
  readonly timestamp: number;
}

// Cache types for optimization
export interface CacheItem<T> {
  readonly data: T;
  readonly timestamp: number;
  readonly ttl: number;
}

// Error types for better error handling
export interface AppError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, any>;
}
