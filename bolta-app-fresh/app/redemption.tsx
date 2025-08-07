// app/redemption.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Alert,
  Share
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { useSession } from '../providers/SessionProvider';
import { Colors } from '../constants/Colors';

const { width, height } = Dimensions.get('window');

export default function Redemption() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, updateBoltBalance } = useSession();
  const [redemptionCode, setRedemptionCode] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Generate redemption code on mount
  useEffect(() => {
    const code = `BOLT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    setRedemptionCode(code);
    
    // Simulate redemption process
    setTimeout(() => {
      setShowSuccess(true);
      // Update user's bolt balance
      if (user && params.boltCost) {
        const newBalance = user.boltBalance - parseInt(params.boltCost as string);
        updateBoltBalance(newBalance).catch(console.error);
      }
    }, 1500);
  }, []);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I just redeemed a ${params.rewardTitle} with Boltha! 🎉\n\nRedemption Code: ${redemptionCode}`,
        title: 'Boltha Redemption'
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleDone = () => {
    Alert.alert(
      'Redemption Complete! 🎉',
      'Your reward has been successfully redeemed. Check your email for redemption details.',
      [
        {
          text: 'Back to Marketplace',
          onPress: () => router.replace('/(tabs)/marketplace')
        }
      ]
    );
  };

  const qrData = JSON.stringify({
    code: redemptionCode,
    reward: params.rewardTitle,
    partner: params.partnerName,
    user: params.userName,
    timestamp: Date.now(),
    bolts: params.boltCost
  });

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
          <Text style={styles.headerTitle}>Redemption</Text>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Success Animation Area */}
        {showSuccess && (
          <View style={styles.successIndicator}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={60} color={Colors.success} />
            </View>
            <Text style={styles.successText}>Redemption Successful!</Text>
          </View>
        )}

        {/* Main Content */}
        <View style={styles.content}>
          {/* User Info */}
          <View style={styles.userSection}>
            <View style={styles.userAvatar}>
              <Ionicons name="person" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.userName}>{params.userName || user?.name}</Text>
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
                  logo={require('../assets/icon.png')} // Add your app icon
                  logoSize={40}
                  logoBackgroundColor="white"
                  logoBorderRadius={20}
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
              <Text style={styles.detailValue}>{params.rewardTitle}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Partner</Text>
              <Text style={styles.detailValue}>{params.partnerName}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Bolts Used</Text>
              <View style={styles.boltValue}>
                <Ionicons name="flash" size={16} color={Colors.bolt} />
                <Text style={styles.detailValue}>{params.boltCost}</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Code</Text>
              <Text style={styles.codeValue}>{redemptionCode}</Text>
            </View>
          </View>
        </View>

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
  successIndicator: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  userSection: {
    alignItems: 'center',
    marginBottom: 30,
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
  },
  detailValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  boltValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  codeValue: {
    color: Colors.bolt,
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  bottomActions: {
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