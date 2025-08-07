// app/redeem/[id].tsx
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
  Share,
  ScrollView
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { doc, getDoc, addDoc, collection, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useSession } from '../../providers/SessionProvider';
import { Colors } from '../../constants/Colors';
import { Reward, Redemption, FirebaseTimestamp } from '../../types';

const { width, height } = Dimensions.get('window');

export default function RedeemReward() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user, updateBoltBalance } = useSession();
  const [reward, setReward] = useState<Reward | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redemptionCode, setRedemptionCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemed, setRedeemed] = useState(false);

  // Fetch reward data and process redemption
  useEffect(() => {
    const processRedemption = async () => {
      if (!id || typeof id !== 'string' || !user) {
        setError('Invalid request');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Fetch reward details
        const rewardDocRef = doc(db, 'rewards', id);
        const rewardDoc = await getDoc(rewardDocRef);

        if (!rewardDoc.exists()) {
          setError('Reward not found');
          setLoading(false);
          return;
        }

        const rewardData = { ...rewardDoc.data(), rewardId: rewardDoc.id } as Reward;
        setReward(rewardData);

        // Validate redemption conditions
        if (!rewardData.isActive) {
          setError('This reward is no longer available');
          setLoading(false);
          return;
        }

        if (rewardData.stockCount <= 0) {
          setError('This reward is out of stock');
          setLoading(false);
          return;
        }

        if (user.boltBalance < rewardData.boltCost) {
          setError('Insufficient bolts to redeem this reward');
          setLoading(false);
          return;
        }

        // Start redemption process
        await performRedemption(rewardData);
        
      } catch (err) {
        console.error('Error processing redemption:', err);
        setError('Failed to process redemption');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      processRedemption();
    }
  }, [id, user]);

  const performRedemption = async (rewardData: Reward) => {
    if (!user) return;

    try {
      setIsRedeeming(true);
      
      // Generate unique redemption code
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substr(2, 6).toUpperCase();
      const code = `BOLT-${timestamp}-${randomSuffix}`;
      setRedemptionCode(code);

      const now: FirebaseTimestamp = {
        seconds: Math.floor(timestamp / 1000),
        nanoseconds: (timestamp % 1000) * 1000000
      };

      const expiryTime: FirebaseTimestamp = {
        seconds: Math.floor((timestamp + (rewardData.expiryDays * 24 * 60 * 60 * 1000)) / 1000),
        nanoseconds: 0
      };

      // Create redemption record
      const redemptionData: Omit<Redemption, 'redemptionId'> = {
        userId: user.uid,
        rewardId: rewardData.rewardId,
        boltsCost: rewardData.boltCost,
        status: 'pending',
        redemptionCode: code,
        redeemedAt: now,
        expiresAt: expiryTime
      };

      // Add to Firestore
      await addDoc(collection(db, 'redemptions'), redemptionData);

      // Update user's bolt balance
      const newBalance = user.boltBalance - rewardData.boltCost;
      await updateBoltBalance(newBalance);

      // Update reward stock count
      await updateDoc(doc(db, 'rewards', rewardData.rewardId), {
        stockCount: rewardData.stockCount - 1
      });

      setRedeemed(true);
      
    } catch (error) {
      console.error('Redemption error:', error);
      Alert.alert(
        'Redemption Failed',
        'Something went wrong while processing your redemption. Please try again.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleShare = async () => {
    if (!reward || !redemptionCode) return;

    try {
      await Share.share({
        message: `I just redeemed "${reward.rewardTitle}" from ${reward.partnerName} using Boltha! 🎉\n\nRedemption Code: ${redemptionCode}`,
        title: 'Boltha Redemption Success'
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleDone = () => {
    Alert.alert(
      'Redemption Complete! 🎉',
      'Your reward has been successfully redeemed. Show the QR code to the merchant to claim your reward.',
      [
        {
          text: 'Back to Marketplace',
          onPress: () => router.replace('/(tabs)/marketplace')
        }
      ]
    );
  };

  const qrData = JSON.stringify({
    redemptionId: redemptionCode,
    rewardId: id,
    userId: user?.uid,
    userName: user?.name,
    rewardTitle: reward?.rewardTitle,
    partnerName: reward?.partnerName,
    boltsCost: reward?.boltCost,
    timestamp: Date.now(),
    status: 'pending'
  });

  if (loading || isRedeeming) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
        <LinearGradient
          colors={[Colors.primary, Colors.secondary]}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>
            {loading ? 'Loading...' : 'Processing redemption...'}
          </Text>
        </LinearGradient>
      </View>
    );
  }

  if (error || !reward || !user) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
        <LinearGradient
          colors={[Colors.primary, Colors.secondary]}
          style={styles.errorGradient}
        >
          <View style={styles.errorContent}>
            <Ionicons name="alert-circle-outline" size={64} color="white" />
            <Text style={styles.errorTitle}>Redemption Failed</Text>
            <Text style={styles.errorMessage}>{error || 'Something went wrong'}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
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
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Redemption Success</Text>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Success Animation */}
          {redeemed && (
            <View style={styles.successIndicator}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={60} color={Colors.success} />
              </View>
              <Text style={styles.successText}>Redemption Successful!</Text>
            </View>
          )}

          {/* User Info */}
          <View style={styles.userSection}>
            <View style={styles.userAvatar}>
              <Ionicons name="person" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userSubtext}>Redeemed by</Text>
          </View>

          {/* QR Code Section */}
          <View style={styles.qrSection}>
            <View style={styles.qrContainer}>
              <View style={styles.qrBackground}>
                <QRCode
                  value={qrData}
                  size={200}
                  color={Colors.text}
                  backgroundColor="white"
                  logoBackgroundColor="white"
                />
              </View>
            </View>
            
            <Text style={styles.qrInstructions}>
              Show this QR code to the merchant to complete your redemption
            </Text>
          </View>

          {/* Reward Details */}
          <View style={styles.rewardDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Reward</Text>
              <Text style={styles.detailValue}>{reward.rewardTitle}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Partner</Text>
              <Text style={styles.detailValue}>{reward.partnerName}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Bolts Used</Text>
              <View style={styles.boltValue}>
                <Ionicons name="flash" size={16} color={Colors.bolt} />
                <Text style={styles.detailValue}>{reward.boltCost}</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Redemption Code</Text>
              <Text style={styles.codeValue}>{redemptionCode}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Valid Until</Text>
              <Text style={styles.detailValue}>
                {new Date(Date.now() + (reward.expiryDays * 24 * 60 * 60 * 1000)).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {/* Updated Balance */}
          <View style={styles.balanceUpdate}>
            <Text style={styles.balanceUpdateTitle}>Updated Balance</Text>
            <View style={styles.balanceContainer}>
              <Ionicons name="flash" size={20} color={Colors.bolt} />
              <Text style={styles.balanceText}>{user.boltBalance} Bolts</Text>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color={Colors.primary} />
            <Text style={styles.secondaryButtonText}>Share</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.primaryButton} onPress={handleDone}>
            <Ionicons name="checkmark" size={20} color="white" />
            <Text style={styles.primaryButtonText}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* Decorative Elements */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        <View style={styles.decorativeCircle3} />
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
  closeButton: {
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
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  successIndicator: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  successIcon: {
    backgroundColor: 'white',
    borderRadius: 40,
    padding: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  successText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  userSection: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  userName: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  qrSection: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrBackground: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  qrInstructions: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  rewardDetails: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  boltValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  codeValue: {
    color: Colors.bolt,
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flex: 2,
    textAlign: 'right',
  },
  balanceUpdate: {
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 100,
  },
  balanceUpdateTitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  balanceText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
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
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  decorativeCircle1: {
    position: 'absolute',
    top: 100,
    right: -50,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: 200,
    left: -30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  decorativeCircle3: {
    position: 'absolute',
    top: 300,
    left: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});