// app/(tabs)/profile.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSession } from '../../providers/SessionProvider';
import { Colors } from '../../constants/Colors';

export default function Profile() {
  const { user, signOut, refreshUserData, loading } = useSession();
  const [refreshing, setRefreshing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();

  // Watch for user state changes and redirect if user becomes null
  useEffect(() => {
    console.log('🔴 Profile: User state changed, user =', user ? user.email : 'null', 'loading =', loading, 'signingOut =', signingOut);
    
    if (!loading && !user) {
      console.log('🔴 Profile: No user detected, redirecting to login...');
      router.replace('/login');
    }
  }, [user, loading, router]);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            setSigningOut(true);
            console.log('🔴 Profile: User confirmed regular sign out');
            
            try {
              await signOut();
              console.log('🔴 Profile: Regular sign out completed');
              
              // Force navigation to login after sign out
              console.log('🔴 Profile: Forcing navigation to login...');
              // Try multiple navigation approaches
              router.replace('/login');
              // Also try navigating to root index which should handle the redirect
              setTimeout(() => {
                console.log('🔴 Profile: Backup navigation to root index...');
                router.replace('/');
              }, 100);
              
            } catch (error) {
              console.error('🔴 Profile: Regular sign out error:', error);
              Alert.alert('Sign Out Error', 'There was an issue signing out. Please try the Emergency Sign Out button below.');
              setSigningOut(false);
            }
          }
        }
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshUserData();
    } catch (error) {
      console.error('Error refreshing user data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Show signing out state
  if (signingOut) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Signing out...</Text>
      </View>
    );
  }

  // Show loading state only if we're still loading and not signing out
  if (!user && loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  // If no user and not loading, we should be redirected to login
  // This is a fallback that shouldn't normally be reached
  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Redirecting...</Text>
      </View>
    );
  }

  // Calculate user statistics
  const totalTransactions = (user.totalEarned || 0) + (user.totalSpent || 0);
  const memberSince = user.createdAt 
    ? new Date(user.createdAt.seconds * 1000).toLocaleDateString()
    : 'Unknown';

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[Colors.primary]}
        />
      }
    >
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={48} color={Colors.primary} />
        </View>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <Ionicons name="flash" size={24} color={Colors.bolt} />
          <Text style={styles.balanceLabel}>Current Balance</Text>
        </View>
        <Text style={styles.balanceAmount}>{user.boltBalance || 0}</Text>
        <Text style={styles.balanceSubtext}>Bolts Available</Text>
      </View>

      {/* Statistics Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statistics</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="trending-up" size={24} color={Colors.success} />
            <Text style={styles.statValue}>{user.totalEarned || 0}</Text>
            <Text style={styles.statLabel}>Total Earned</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="trending-down" size={24} color={Colors.error} />
            <Text style={styles.statValue}>{user.totalSpent || 0}</Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="swap-horizontal" size={24} color={Colors.primary} />
            <Text style={styles.statValue}>{totalTransactions}</Text>
            <Text style={styles.statLabel}>Transactions</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="calendar" size={24} color={Colors.textSecondary} />
            <Text style={styles.statValue}>{memberSince}</Text>
            <Text style={styles.statLabel}>Member Since</Text>
          </View>
        </View>
      </View>

      {/* Achievements Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        
        {user.achievements && user.achievements.length > 0 ? (
          <View style={styles.achievementsList}>
            {user.achievements.map((achievement, index) => (
              <View key={index} style={styles.achievementCard}>
                <Ionicons name="trophy" size={20} color={Colors.bolt} />
                <Text style={styles.achievementText}>{achievement}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyAchievements}>
            <Ionicons name="trophy-outline" size={32} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No achievements yet</Text>
            <Text style={styles.emptySubtext}>Start redeeming rewards to unlock achievements!</Text>
          </View>
        )}
      </View>

      {/* Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        
        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="notifications-outline" size={24} color={Colors.text} />
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Notifications</Text>
            <Text style={styles.settingValue}>
              {user.preferences?.notifications ? 'Enabled' : 'Disabled'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="color-palette-outline" size={24} color={Colors.text} />
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Theme</Text>
            <Text style={styles.settingValue}>
              {user.preferences?.theme || 'Light'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={20} color="white" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      {/* Emergency Sign Out Button (backup option) */}
      <TouchableOpacity 
        style={[styles.signOutButton, { backgroundColor: Colors.textSecondary, marginTop: 10, opacity: 0.7 }]} 
        onPress={async () => {
          Alert.alert(
            'Emergency Sign Out',
            'Use this only if regular sign out is not working. This will force close the session.',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Emergency Sign Out', 
                style: 'destructive',
                onPress: async () => {
                  console.log('🚨 Emergency sign out triggered');
                  try {
                    setSigningOut(true);
                    // Clear AsyncStorage directly
                    await AsyncStorage.removeItem('bolta_user');
                    console.log('🚨 AsyncStorage cleared');
                    // Force reload the app by clearing everything
                    window.location?.reload?.() || console.log('🚨 Manual app restart needed');
                  } catch (error) {
                    console.error('🚨 Emergency sign out error:', error);
                  }
                }
              }
            ]
          );
        }}
      >
        <Ionicons name="warning-outline" size={16} color="white" />
        <Text style={[styles.signOutText, { fontSize: 14 }]}>Emergency Sign Out</Text>
      </TouchableOpacity>

      {/* Footer Spacing */}
      <View style={styles.footer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: Colors.surface,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  balanceCard: {
    backgroundColor: Colors.surface,
    margin: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  balanceSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: Colors.surface,
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  achievementsList: {
    gap: 8,
  },
  achievementCard: {
    backgroundColor: Colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  achievementText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 12,
    flex: 1,
  },
  emptyAchievements: {
    backgroundColor: Colors.surface,
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  settingItem: {
    backgroundColor: Colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  settingContent: {
    flex: 1,
    marginLeft: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 2,
  },
  settingValue: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  signOutButton: {
    backgroundColor: Colors.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  signOutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  footer: {
    height: 20,
  },
});