// constants/Config.ts
// Centralized configuration for performance and maintainability

// Cache Configuration
export const CACHE_CONFIG = {
  USER_CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  REWARDS_CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  LEADERBOARD_CACHE_DURATION: 2 * 60 * 1000, // 2 minutes
  MAX_CACHE_SIZE: 50, // Maximum number of cached items
} as const;

// Network Configuration
export const NETWORK_CONFIG = {
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  REQUEST_TIMEOUT: 10000, // 10 seconds
  OFFLINE_RETRY_INTERVAL: 30000, // 30 seconds
} as const;

// Performance Configuration
export const PERFORMANCE_CONFIG = {
  FLATLIST_INITIAL_RENDER: 5,
  FLATLIST_MAX_BATCH: 10,
  FLATLIST_WINDOW_SIZE: 10,
  FLATLIST_UPDATE_BATCH_PERIOD: 50,
  LAST_ACTIVE_THROTTLE: 60000, // 1 minute
  DEBOUNCE_DELAY: 300, // 300ms
} as const;

// UI Configuration
export const UI_CONFIG = {
  TAB_BAR_HEIGHT: 60,
  ANIMATION_DURATION: 300,
  LOADING_DELAY: 100,
  ERROR_DISPLAY_DURATION: 5000,
  SUCCESS_DISPLAY_DURATION: 3000,
} as const;

// Business Logic Configuration
export const BUSINESS_CONFIG = {
  STARTING_BOLT_BALANCE: 100,
  MIN_REDEMPTION_AMOUNT: 1,
  MAX_REWARD_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  DEFAULT_EXPIRY_DAYS: 30,
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  USER_DATA: 'bolta_user',
  REWARDS_CACHE: 'bolta_rewards_cache',
  LEADERBOARD_CACHE: 'bolta_leaderboard_cache',
  APP_SETTINGS: 'bolta_app_settings',
  LAST_SYNC: 'bolta_last_sync',
} as const;

// Collection Names
export const COLLECTIONS = {
  USERS: 'users',
  REWARDS: 'rewards',
  TRANSACTIONS: 'transactions',
  REDEMPTIONS: 'redemptions',
  ANALYTICS: 'analytics',
} as const;

// Error Codes
export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  NOT_FOUND: 'NOT_FOUND',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CACHE_ERROR: 'CACHE_ERROR',
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_ANALYTICS: true,
  ENABLE_PERFORMANCE_MONITORING: true,
  ENABLE_OFFLINE_MODE: true,
  ENABLE_PUSH_NOTIFICATIONS: false,
  ENABLE_BIOMETRIC_AUTH: false,
  ENABLE_DARK_MODE: false,
} as const;

// Development Configuration
export const DEV_CONFIG = {
  ENABLE_CONSOLE_LOGS: __DEV__,
  ENABLE_DEBUG_OVERLAY: __DEV__,
  MOCK_DATA_ENABLED: false,
  SKIP_ONBOARDING: __DEV__,
} as const;

// Type exports for better TypeScript support
export type CacheConfig = typeof CACHE_CONFIG;
export type NetworkConfig = typeof NETWORK_CONFIG;
export type PerformanceConfig = typeof PERFORMANCE_CONFIG;
export type UIConfig = typeof UI_CONFIG;
export type BusinessConfig = typeof BUSINESS_CONFIG;
export type StorageKeys = typeof STORAGE_KEYS;
export type Collections = typeof COLLECTIONS;
export type ErrorCodes = typeof ERROR_CODES;
export type FeatureFlags = typeof FEATURE_FLAGS;
export type DevConfig = typeof DEV_CONFIG;