// app/(tabs)/index.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSession } from '../../providers/SessionProvider';
import { Colors } from '../../constants/Colors';
import Leaderboard from '../../components/Leaderboard';

export default function HomeIndex() {
  const { user } = useSession();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back!</Text>
        <Text style={styles.userName}>{user?.name || 'User'}</Text>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Your Bolt Balance</Text>
        <Text style={styles.balanceAmount}>⚡ {user?.boltBalance || 0}</Text>
      </View>

      {/* Leaderboard Component */}
      <Leaderboard 
        onViewAll={() => {
          // Navigate to full leaderboard screen
          console.log('View all leaderboard');
        }}
        style={styles.leaderboard}
      />

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{user?.totalEarned || 0}</Text>
          <Text style={styles.statLabel}>Total Earned</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{user?.totalSpent || 0}</Text>
          <Text style={styles.statLabel}>Total Spent</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  greeting: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
  },
  balanceCard: {
    backgroundColor: Colors.primary,
    margin: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  leaderboard: {
    marginHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});