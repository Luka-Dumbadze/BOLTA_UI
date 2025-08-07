// types/index.ts
export interface User {
  uid: string;
  name: string;
  email: string;
  profilePictureUrl?: string;
  boltBalance: number;
  createdAt: FirebaseTimestamp;
  lastActive: FirebaseTimestamp;
  preferences: {
    notifications: boolean;
    theme: 'light' | 'dark';
  };
  achievements: string[];
  totalEarned: number;
  totalSpent: number;
}

export interface Reward {
  rewardId: string;
  partnerName: string;
  rewardTitle: string;
  rewardDescription: string;
  boltCost: number;
  logoUrl: string;
  category: string;
  isActive: boolean;
  stockCount: number;
  expiryDays: number;
  termsAndConditions: string;
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
}

export interface Transaction {
  transactionId: string;
  userId: string;
  type: 'earn' | 'spend' | 'bonus';
  amount: number;
  description: string;
  source: 'daily_checkin' | 'reward_redemption' | 'referral' | 'challenge';
  metadata: {
    challengeId?: string;
    rewardId?: string;
  };
  timestamp: FirebaseTimestamp;
}

export interface Redemption {
  redemptionId: string;
  userId: string;
  rewardId: string;
  boltsCost: number;
  status: 'pending' | 'completed' | 'expired' | 'cancelled';
  redemptionCode: string;
  redeemedAt: FirebaseTimestamp;
  expiresAt: FirebaseTimestamp;
}

export interface FirebaseTimestamp {
  seconds: number;
  nanoseconds: number;
}
