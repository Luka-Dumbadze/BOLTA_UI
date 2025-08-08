// app/marketplace.tsx
import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl
} from 'react-native';
import { collection, getDocs, query, where, orderBy, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useSession } from '../../providers/SessionProvider';
import { Reward } from '../../types';
import { Colors } from '../../constants/Colors';

// Constants for optimization
const REWARDS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000;

// Cache interface
interface RewardsCache {
  rewards: Reward[];
  timestamp: number;
}

// Global cache for rewards
let rewardsCache: RewardsCache | null = null;

// Retry utility function
const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxAttempts: number = RETRY_ATTEMPTS,
  delay: number = RETRY_DELAY
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Marketplace operation failed (attempt ${attempt}/${maxAttempts}):`, error);
      
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
  
  throw lastError!;
};

/**
 * Optimized Reward Card Component with memoization
 * Displays individual reward information in a card format
 */
interface RewardCardProps {
  reward: Reward;
  onPress: (reward: Reward) => void;
}

const RewardCard = memo(function RewardCard({ reward, onPress }: RewardCardProps) {
  const { user } = useSession();
  const canAfford = useMemo(() => 
    user && user.boltBalance >= reward.boltCost, 
    [user?.boltBalance, reward.boltCost]
  );

  const handlePress = useCallback(() => {
    onPress(reward);
  }, [reward, onPress]);

  return (
    <TouchableOpacity
      style={[
        styles.rewardCard,
        !canAfford && styles.rewardCardDisabled
      ]}
      onPress={handlePress}
      disabled={!canAfford}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.partnerName}>{reward.partnerName}</Text>
        <View style={styles.boltCostContainer}>
          <Text style={styles.boltCost}>⚡ {reward.boltCost}</Text>
        </View>
      </View>
      
      <Text style={styles.rewardTitle}>{reward.rewardTitle}</Text>
      
      <Text style={styles.rewardDescription} numberOfLines={2}>
        {reward.rewardDescription}
      </Text>
      
      <View style={styles.cardFooter}>
        <Text style={styles.category}>{reward.category}</Text>
        <Text style={[
          styles.stockStatus,
          reward.stockCount > 0 ? styles.inStock : styles.outOfStock
        ]}>
          {reward.stockCount > 0 ? `${reward.stockCount} available` : 'Out of stock'}
        </Text>
      </View>
      
      {!canAfford && (
        <View style={styles.insufficientFundsOverlay}>
          <Text style={styles.insufficientFundsText}>Insufficient Bolts</Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

/**
 * Optimized Marketplace Screen Component
 * Displays all available rewards from Firestore with caching
 */
const Marketplace = memo(function Marketplace() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, updateBoltBalance, refreshUserData, isOnline } = useSession();

  // Check if cache is valid
  const isCacheValid = useCallback((cache: RewardsCache | null): boolean => {
    if (!cache) return false;
    const now = Date.now();
    return (now - cache.timestamp) < REWARDS_CACHE_DURATION;
  }, []);

  /**
   * Optimized fetch rewards function with caching and retry logic
   */
  const fetchRewards = useCallback(async (forceRefresh: boolean = false) => {
    // Check cache first (unless force refresh)
    if (!forceRefresh && isCacheValid(rewardsCache)) {
      console.log('📋 Using cached rewards data');
      setRewards(rewardsCache!.rewards);
      setError(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setError(null);
    if (!refreshing) setLoading(true);
    
    try {
      console.log('🔄 Fetching fresh rewards data...');
      
      const rewardsRef = collection(db, 'rewards');
      
      // Use retry logic for Firestore operations
      const querySnapshot = await retryOperation(() => getDocs(rewardsRef));
      const rewardsData: Reward[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        rewardsData.push({
          rewardId: doc.id,
          ...data
        } as Reward);
      });
      
      // Sort rewards by active status and bolt cost
      const sortedRewards = rewardsData.sort((a, b) => {
        if (a.isActive !== b.isActive) {
          return a.isActive ? -1 : 1; // Active rewards first
        }
        return a.boltCost - b.boltCost; // Then by cost (ascending)
      });
      
      setRewards(sortedRewards);
      
      // Update cache
      rewardsCache = {
        rewards: sortedRewards,
        timestamp: Date.now()
      };
      
      console.log(`✅ Loaded ${sortedRewards.length} rewards successfully`);
      
    } catch (error: any) {
      console.error('❌ Error fetching rewards:', error);
      setError(error.message || 'Failed to load rewards');
      
      // Use cached data as fallback if available
      if (rewardsCache) {
        console.log('📋 Using cached data as fallback');
        setRewards(rewardsCache.rewards);
        setError('Using cached data - connection issues');
      } else {
        // Handle specific error types
        if (error.code === 'permission-denied') {
          setError('Permission denied - check Firestore rules');
        } else if (!isOnline) {
          setError('You are offline');
        } else {
          setError('Failed to load rewards. Please try again.');
        }
        setRewards([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isCacheValid, refreshing, isOnline]);

  /**
   * Optimized reward selection handler
   */
  const handleRewardPress = useCallback((reward: Reward) => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to redeem rewards');
      return;
    }

    if (!isOnline) {
      Alert.alert('Offline', 'You need to be online to redeem rewards');
      return;
    }

    if (user.boltBalance < reward.boltCost) {
      Alert.alert(
        'Insufficient Bolts',
        `You need ${reward.boltCost} bolts to redeem this reward. You currently have ${user.boltBalance} bolts.`
      );
      return;
    }

    if (reward.stockCount <= 0) {
      Alert.alert('Out of Stock', 'This reward is currently out of stock.');
      return;
    }

    if (!reward.isActive) {
      Alert.alert('Unavailable', 'This reward is currently unavailable.');
      return;
    }

    // Show reward details and confirmation
    Alert.alert(
      reward.rewardTitle,
      `${reward.rewardDescription}\n\nCost: ⚡ ${reward.boltCost} bolts\nPartner: ${reward.partnerName}\n\nWould you like to redeem this reward?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Redeem', 
          onPress: () => handleRewardRedemption(reward),
          style: 'default'
        }
      ]
    );
  }, [user, isOnline]);

  /**
   * Optimized reward redemption handler with better error handling
   */
  const handleRewardRedemption = useCallback(async (reward: Reward) => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to redeem rewards');
      return;
    }

    const newBalance = user.boltBalance - reward.boltCost;
    
    try {
      console.log(`💰 Redeeming reward: ${reward.rewardTitle} for ${reward.boltCost} bolts`);
      
      // Create redemption record with retry logic
      const redemptionData = {
        userId: user.uid,
        userName: user.name,
        userEmail: user.email,
        rewardId: reward.rewardId,
        rewardTitle: reward.rewardTitle,
        partnerName: reward.partnerName,
        boltsCost: reward.boltCost, // Match the interface
        status: 'pending',
        redemptionCode: `BOLT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        redeemedAt: serverTimestamp(),
        expiresAt: serverTimestamp() // Will be updated with actual expiry
      };

      await retryOperation(() => addDoc(collection(db, 'redemptions'), redemptionData));
      console.log('✅ Redemption record created');
      
      // Update user's bolt balance (optimistic update)
      await updateBoltBalance(newBalance);
      console.log('✅ Bolt balance updated');
      
      // Update reward stock count
      if (reward.stockCount > 0) {
        const rewardDocRef = doc(db, 'rewards', reward.rewardId);
        await retryOperation(() => updateDoc(rewardDocRef, {
          stockCount: reward.stockCount - 1,
          updatedAt: serverTimestamp()
        }));
        console.log('✅ Reward stock updated');
        
        // Update local cache
        if (rewardsCache) {
          const updatedRewards = rewardsCache.rewards.map(r => 
            r.rewardId === reward.rewardId 
              ? { ...r, stockCount: r.stockCount - 1 }
              : r
          );
          rewardsCache = {
            rewards: updatedRewards,
            timestamp: rewardsCache.timestamp
          };
          setRewards(updatedRewards);
        }
      }
      
      // Show success message
      Alert.alert(
        'Redemption Successful! 🎉',
        `You have successfully redeemed "${reward.rewardTitle}"!\n\nYour new balance: ⚡ ${newBalance} bolts\n\nRedemption code: ${redemptionData.redemptionCode}\n\nDetails will be sent to your email.`,
        [{ text: 'OK', style: 'default' }]
      );
      
      console.log('🎉 Redemption completed successfully');
      
    } catch (error: any) {
      console.error('❌ Error redeeming reward:', error);
      
      // Provide specific error messages
      let errorMessage = 'There was an error processing your redemption. Please try again.';
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please check your account status.';
      } else if (!isOnline) {
        errorMessage = 'You are offline. Please check your connection and try again.';
      }
      
      Alert.alert('Redemption Failed', errorMessage);
      
      // Refresh data to ensure consistency
      await Promise.all([
        fetchRewards(true),
        refreshUserData()
      ]);
    }
  }, [user, updateBoltBalance, fetchRewards, refreshUserData, isOnline]);

  /**
   * Optimized pull-to-refresh handler
   */
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRewards(true); // Force refresh
  }, [fetchRewards]);

  /**
   * Load rewards when component mounts
   */
  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  // Memoized render functions
  const renderRewardCard = useCallback(({ item }: { item: Reward }) => (
    <RewardCard reward={item} onPress={handleRewardPress} />
  ), [handleRewardPress]);

  const keyExtractor = useCallback((item: Reward) => item.rewardId, []);

  // Memoized balance display
  const balanceDisplay = useMemo(() => 
    `⚡ ${user?.boltBalance?.toLocaleString() || 0} bolts`,
    [user?.boltBalance]
  );

  /**
   * Render loading state
   */
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading rewards...</Text>
      </View>
    );
  }

  /**
   * Render empty state
   */
  if (rewards.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No Rewards Available</Text>
        <Text style={styles.emptySubtitle}>
          Check back later for new rewards!
        </Text>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchRewards}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /**
   * Render marketplace with rewards list
   */
  return (
    <View style={styles.container}>
      {/* Optimized Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Marketplace</Text>
        <Text style={styles.subtitle}>Your Balance: {balanceDisplay}</Text>
        {error && (
          <Text style={styles.errorText}>⚠️ {error}</Text>
        )}
      </View>

      {/* Optimized Rewards List */}
      <FlatList
        data={rewards}
        keyExtractor={keyExtractor}
        renderItem={renderRewardCard}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={5}
        windowSize={10}
        getItemLayout={undefined} // Let FlatList handle dynamic sizing
      />
    </View>
  );
});

export default Marketplace;

/**
 * Stylesheet for the Marketplace component
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 20,
    paddingTop: 60, // Account for status bar
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    marginTop: 4,
    fontStyle: 'italic',
  },
  listContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rewardCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    position: 'relative',
  },
  rewardCardDisabled: {
    opacity: 0.6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  partnerName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  boltCostContainer: {
    backgroundColor: Colors.bolt,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  boltCost: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  rewardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  rewardDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  category: {
    fontSize: 12,
    color: Colors.primary,
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  stockStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  inStock: {
    color: Colors.success,
  },
  outOfStock: {
    color: Colors.error,
  },
  insufficientFundsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  insufficientFundsText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});