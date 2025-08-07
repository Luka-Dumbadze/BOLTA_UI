// app/reward/[id].tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useSession } from '../../providers/SessionProvider';
import { Colors } from '../../constants/Colors';
import { Reward } from '../../types';

const { width, height } = Dimensions.get('window');

export default function RewardDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useSession();
  const [reward, setReward] = useState<Reward | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch reward data from Firestore
  useEffect(() => {
    const fetchReward = async () => {
      if (!id || typeof id !== 'string') {
        setError('Invalid reward ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const rewardDocRef = doc(db, 'rewards', id);
        const rewardDoc = await getDoc(rewardDocRef);

        if (rewardDoc.exists()) {
          const rewardData = { ...rewardDoc.data(), rewardId: rewardDoc.id } as Reward;
          setReward(rewardData);
        } else {
          setError('Reward not found');
        }
      } catch (err) {
        console.error('Error fetching reward:', err);
        setError('Failed to load reward details');
      } finally {
        setLoading(false);
      }
    };

    fetchReward();
  }, [id]);

  const handleRedeemNow = () => {
    if (!reward || !user) {
      return;
    }

    // Check if user has enough bolts
    if (user.boltBalance < reward.boltCost) {
      Alert.alert(
        'Insufficient Bolts! ⚡',
        `You need ${reward.boltCost} bolts but only have ${user.boltBalance}. Complete more challenges to earn bolts!`,
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    // Check if reward is still active and in stock
    if (!reward.isActive) {
      Alert.alert(
        'Reward Unavailable',
        'This reward is currently not available.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    if (reward.stockCount <= 0) {
      Alert.alert(
        'Out of Stock',
        'This reward is currently out of stock. Please try again later.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    // Navigate to redemption screen
    router.push(`/redeem/${id}`);
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
        <LinearGradient
          colors={[Colors.primary, Colors.secondary]}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Loading reward details...</Text>
        </LinearGradient>
      </View>
    );
  }

  if (error || !reward) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
        <LinearGradient
          colors={[Colors.primary, Colors.secondary]}
          style={styles.errorGradient}
        >
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.errorContent}>
            <Ionicons name="alert-circle-outline" size={64} color="white" />
            <Text style={styles.errorTitle}>Oops!</Text>
            <Text style={styles.errorMessage}>{error || 'Reward not found'}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleBack}>
              <Text style={styles.retryButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <LinearGradient
        colors={[Colors.primary, Colors.secondary]}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reward Details</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Reward Image */}
          <View style={styles.imageContainer}>
            <View style={styles.imageWrapper}>
              {reward.logoUrl ? (
                <Image
                  source={{ uri: reward.logoUrl }}
                  style={styles.rewardImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <Ionicons name="gift-outline" size={64} color={Colors.primary} />
                </View>
              )}
            </View>
          </View>

          {/* Reward Info */}
          <View style={styles.infoContainer}>
            <View style={styles.partnerContainer}>
              <Text style={styles.partnerName}>{reward.partnerName}</Text>
              <View style={styles.stockIndicator}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                <Text style={styles.stockText}>{reward.stockCount} left</Text>
              </View>
            </View>

            <Text style={styles.rewardTitle}>{reward.rewardTitle}</Text>
            <Text style={styles.rewardDescription}>{reward.rewardDescription}</Text>

            {/* Cost and Category */}
            <View style={styles.detailsRow}>
              <View style={styles.costContainer}>
                <Ionicons name="flash" size={20} color={Colors.bolt} />
                <Text style={styles.costText}>{reward.boltCost} Bolts</Text>
              </View>
              <View style={styles.categoryContainer}>
                <Text style={styles.categoryText}>{reward.category}</Text>
              </View>
            </View>

            {/* User Balance */}
            {user && (
              <View style={styles.balanceContainer}>
                <Text style={styles.balanceLabel}>Your Balance:</Text>
                <View style={styles.balanceAmount}>
                  <Ionicons name="flash" size={16} color={Colors.bolt} />
                  <Text style={styles.balanceText}>{user.boltBalance} Bolts</Text>
                </View>
              </View>
            )}

            {/* Terms and Conditions */}
            {reward.termsAndConditions && (
              <View style={styles.termsContainer}>
                <Text style={styles.termsTitle}>Terms & Conditions</Text>
                <Text style={styles.termsText}>{reward.termsAndConditions}</Text>
              </View>
            )}

            {/* Expiry Info */}
            <View style={styles.expiryContainer}>
              <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.expiryText}>
                Valid for {reward.expiryDays} days after redemption
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Action */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.redeemButton,
              (!reward.isActive || reward.stockCount <= 0 || !user || user.boltBalance < reward.boltCost) 
                && styles.redeemButtonDisabled
            ]}
            onPress={handleRedeemNow}
            disabled={!reward.isActive || reward.stockCount <= 0 || !user || user.boltBalance < reward.boltCost}
          >
            <Ionicons name="flash" size={24} color="white" />
            <Text style={styles.redeemButtonText}>
              {!reward.isActive 
                ? 'Unavailable'
                : reward.stockCount <= 0 
                ? 'Out of Stock'
                : !user || user.boltBalance < reward.boltCost
                ? 'Insufficient Bolts'
                : 'Redeem Now'
              }
            </Text>
          </TouchableOpacity>
        </View>

        {/* Decorative Elements */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 12,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
  },
  errorGradient: {
    flex: 1,
    position: 'relative',
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 12,
  },
  errorMessage: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  retryButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  imageWrapper: {
    width: 120,
    height: 120,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  rewardImage: {
    width: 100,
    height: 100,
    borderRadius: 16,
  },
  placeholderImage: {
    width: 100,
    height: 100,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  partnerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  partnerName: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '600',
  },
  stockIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stockText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  rewardTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    lineHeight: 34,
  },
  rewardDescription: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  costContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  costText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoryContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '500',
  },
  balanceAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  balanceText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  termsContainer: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  termsTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  termsText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    lineHeight: 20,
  },
  expiryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  expiryText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'transparent',
  },
  redeemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    gap: 8,
  },
  redeemButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.2)',
    opacity: 0.6,
  },
  redeemButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  decorativeCircle1: {
    position: 'absolute',
    top: 120,
    right: -40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: 150,
    left: -30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
});