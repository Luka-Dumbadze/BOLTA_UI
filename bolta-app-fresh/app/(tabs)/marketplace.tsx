// app/marketplace.tsx
import React, { useState, useEffect } from 'react';
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

/**
 * Reusable Reward Card Component
 * Displays individual reward information in a card format
 */
interface RewardCardProps {
  reward: Reward;
  onPress: (reward: Reward) => void;
}

function RewardCard({ reward, onPress }: RewardCardProps) {
  const { user } = useSession();
  const canAfford = user && user.boltBalance >= reward.boltCost;

  return (
    <TouchableOpacity
      style={[
        styles.rewardCard,
        !canAfford && styles.rewardCardDisabled
      ]}
      onPress={() => onPress(reward)}
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
}

/**
 * Marketplace Screen Component
 * Displays all available rewards from Firestore
 */
export default function Marketplace() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user, updateBoltBalance, refreshUserData } = useSession();

  /**
   * Fetch rewards from Firestore
   * Only fetches active rewards with stock available
   */
  const fetchRewards = async () => {
    try {
      const rewardsRef = collection(db, 'rewards');
      
      // Try to fetch all documents first (for testing)
      const querySnapshot = await getDocs(rewardsRef);
      const rewardsData: Reward[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        rewardsData.push({
          rewardId: doc.id,
          ...data
        } as Reward);
      });
      
      setRewards(rewardsData);
      
      // If no rewards found, show info message
      if (rewardsData.length === 0) {
        console.log('No rewards found in the collection. You may need to add some test data.');
      }
    } catch (error) {
      console.error('Error fetching rewards:', error);
      
      // Handle permission errors gracefully
      if (error.code === 'permission-denied') {
        Alert.alert(
          'Database Setup Required', 
          'The rewards collection needs to be set up with proper security rules. For now, the marketplace will show as empty.'
        );
      } else {
        Alert.alert('Error', 'Failed to load rewards. Please try again.');
      }
      
      // Set empty array so the app doesn't crash
      setRewards([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Handle reward selection
   * Show reward details and redemption option
   */
  const handleRewardPress = (reward: Reward) => {
    if (!user) {
      Alert.alert('Error', 'Please log in to redeem rewards');
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
  };

  /**
   * Handle reward redemption
   * Deduct bolts from user balance and create redemption record
   */
  const handleRewardRedemption = async (reward: Reward) => {
    if (!user) {
      Alert.alert('Error', 'Please log in to redeem rewards');
      return;
    }

    try {
      // Calculate new balance
      const newBalance = user.boltBalance - reward.boltCost;
      
      // Create redemption record first
      const redemptionData = {
        userId: user.uid,
        userName: user.name,
        userEmail: user.email,
        rewardId: reward.rewardId,
        rewardTitle: reward.rewardTitle,
        partnerName: reward.partnerName,
        boltCost: reward.boltCost,
        status: 'completed',
        redeemedAt: serverTimestamp(),
        expiryDate: new Date(Date.now() + (reward.expiryDays * 24 * 60 * 60 * 1000)).toISOString()
      };

      // Add redemption record to Firestore
      await addDoc(collection(db, 'redemptions'), redemptionData);
      
      // Update user's bolt balance
      await updateBoltBalance(newBalance);
      
      // Update reward stock count (if needed)
      if (reward.stockCount > 0) {
        const rewardDocRef = doc(db, 'rewards', reward.rewardId);
        await updateDoc(rewardDocRef, {
          stockCount: reward.stockCount - 1
        });
      }
      
      // Show success message
      Alert.alert(
        'Redemption Successful! 🎉',
        `You have successfully redeemed "${reward.rewardTitle}"!\n\nYour new balance: ⚡ ${newBalance} bolts\n\nRedemption details will be sent to your email.`,
        [{ text: 'OK', style: 'default' }]
      );
      
      // Refresh rewards list to update stock count and ensure user balance is current
      await Promise.all([
        fetchRewards(),
        refreshUserData()
      ]);
      
    } catch (error) {
      console.error('Error redeeming reward:', error);
      Alert.alert(
        'Redemption Failed',
        'There was an error processing your redemption. Please try again.'
      );
    }
  };

  /**
   * Handle pull-to-refresh
   */
  const onRefresh = () => {
    setRefreshing(true);
    fetchRewards();
  };

  /**
   * Load rewards when component mounts
   */
  useEffect(() => {
    fetchRewards();
  }, []);

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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Marketplace</Text>
        <Text style={styles.subtitle}>
          Your Balance: ⚡ {user?.boltBalance || 0} bolts
        </Text>
      </View>

      {/* Rewards List */}
      <FlatList
        data={rewards}
        keyExtractor={(item) => item.rewardId}
        renderItem={({ item }) => (
          <RewardCard
            reward={item}
            onPress={handleRewardPress}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
          />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

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