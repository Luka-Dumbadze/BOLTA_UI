// app/reward-detail.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  StatusBar,
  Dimensions
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSession } from '../providers/SessionProvider';
import { Colors } from '../constants/Colors';

const { width, height } = Dimensions.get('window');

export default function RewardDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useSession();
  const [loading, setLoading] = useState(false);

  // Mock reward data - in real app, this would come from params or API
  const reward = {
    rewardId: params.id || '1',
    rewardTitle: params.title || '$5 Coffee Gift Card',
    rewardDescription: params.description || 'Enjoy a $5 gift card to use at any Starbucks location. Perfect for your morning coffee! Valid at all participating locations nationwide.',
    partnerName: params.partner || 'Starbucks',
    boltCost: parseInt(params.cost as string) || 50,
    category: params.category || 'Food & Drink',
    stockCount: parseInt(params.stock as string) || 100,
    imageUrl: params.image || 'https://via.placeholder.com/400x300?text=Starbucks+Gift+Card',
    expiryDays: 365,
    termsAndConditions: 'Valid at participating locations. Cannot be combined with other offers. Gift card expires 12 months from issue date.',
    features: [
      'Valid at 15,000+ locations',
      'No expiration date',
      'Mobile & in-store use',
      'Instant digital delivery'
    ]
  };

  const canAfford = user && user.boltBalance >= reward.boltCost;

  const handleRedeem = () => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to redeem rewards');
      return;
    }

    if (!canAfford) {
      Alert.alert(
        'Insufficient Bolts',
        `You need ${reward.boltCost} bolts to redeem this reward. You currently have ${user.boltBalance} bolts.`
      );
      return;
    }

    setLoading(true);
    // Navigate to redemption screen
    router.push({
      pathname: '/redemption',
      params: {
        rewardTitle: reward.rewardTitle,
        partnerName: reward.partnerName,
        boltCost: reward.boltCost.toString(),
        userName: user.name
      }
    });
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Hero Image Section */}
        <View style={styles.heroSection}>
          <Image source={{ uri: reward.imageUrl }} style={styles.heroImage} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.imageOverlay}
          />
          
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          {/* Category Badge */}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{reward.category}</Text>
          </View>

          {/* Hero Content */}
          <View style={styles.heroContent}>
            <Text style={styles.partnerName}>{reward.partnerName}</Text>
            <Text style={styles.rewardTitle}>{reward.rewardTitle}</Text>
            
            <View style={styles.boltContainer}>
              <Ionicons name="flash" size={20} color={Colors.bolt} />
              <Text style={styles.boltCost}>{reward.boltCost} Bolts</Text>
            </View>
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          {/* User Balance Card */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceInfo}>
              <Text style={styles.balanceLabel}>Your Balance</Text>
              <View style={styles.balanceAmount}>
                <Ionicons name="flash" size={16} color={Colors.bolt} />
                <Text style={styles.balanceText}>{user?.boltBalance || 0}</Text>
              </View>
            </View>
            <View style={[styles.affordabilityIndicator, canAfford ? styles.canAfford : styles.cannotAfford]}>
              <Ionicons 
                name={canAfford ? "checkmark-circle" : "close-circle"} 
                size={20} 
                color="white" 
              />
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About This Reward</Text>
            <Text style={styles.description}>{reward.rewardDescription}</Text>
          </View>

          {/* Features */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What's Included</Text>
            {reward.features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          {/* Stock & Expiry Info */}
          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <Ionicons name="cube" size={24} color={Colors.primary} />
              <Text style={styles.infoValue}>{reward.stockCount}</Text>
              <Text style={styles.infoLabel}>Available</Text>
            </View>
            <View style={styles.infoCard}>
              <Ionicons name="time" size={24} color={Colors.primary} />
              <Text style={styles.infoValue}>{reward.expiryDays}d</Text>
              <Text style={styles.infoLabel}>Valid For</Text>
            </View>
          </View>

          {/* Terms */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Terms & Conditions</Text>
            <Text style={styles.termsText}>{reward.termsAndConditions}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Redeem Button */}
      <View style={styles.redeemSection}>
        <LinearGradient
          colors={canAfford ? [Colors.primary, Colors.secondary] : [Colors.textSecondary, Colors.textSecondary]}
          style={[styles.redeemButton, !canAfford && styles.redeemButtonDisabled]}
        >
          <TouchableOpacity
            style={styles.redeemButtonContent}
            onPress={handleRedeem}
            disabled={!canAfford || loading}
          >
            {loading ? (
              <Text style={styles.redeemButtonText}>Processing...</Text>
            ) : (
              <>
                <Ionicons name="gift" size={24} color="white" />
                <Text style={styles.redeemButtonText}>
                  {canAfford ? 'Redeem Now' : `Need ${reward.boltCost - (user?.boltBalance || 0)} More Bolts`}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  heroSection: {
    height: height * 0.5,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryBadge: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  heroContent: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
  partnerName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.9,
    marginBottom: 4,
  },
  rewardTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    lineHeight: 34,
  },
  boltContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  boltCost: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  contentSection: {
    padding: 20,
    paddingBottom: 100, // Space for fixed button
  },
  balanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  balanceAmount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginLeft: 4,
  },
  affordabilityIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  canAfford: {
    backgroundColor: Colors.success,
  },
  cannotAfford: {
    backgroundColor: Colors.error,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textSecondary,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 16,
    color: Colors.text,
    marginLeft: 12,
    flex: 1,
  },
  infoGrid: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  infoCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  termsText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  redeemSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  redeemButton: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  redeemButtonDisabled: {
    opacity: 0.6,
  },
  redeemButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 8,
  },
  redeemButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});