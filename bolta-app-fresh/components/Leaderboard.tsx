// components/Leaderboard.tsx
import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useSession } from '../providers/SessionProvider';
import { Colors } from '../constants/Colors';
import { User } from '../types';

// Constants for optimization
const LEADERBOARD_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes
const TOP_USERS_LIMIT = 3;
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000;

interface LeaderboardUser {
  id: string;
  name: string;
  boltBalance: number;
  avatar?: string;
  rank: number;
  isCurrentUser?: boolean;
}

interface LeaderboardProps {
  onViewAll?: () => void;
  style?: any;
}

// Cache interface for leaderboard data
interface LeaderboardCache {
  topUsers: LeaderboardUser[];
  userRank: number | null;
  timestamp: number;
  userId: string;
}

// Global cache for leaderboard data
let leaderboardCache: LeaderboardCache | null = null;

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
      console.warn(`Leaderboard operation failed (attempt ${attempt}/${maxAttempts}):`, error);
      
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
  
  throw lastError!;
};

const Leaderboard = memo(function Leaderboard({ onViewAll, style }: LeaderboardProps) {
  const { user, isOnline } = useSession();
  const [loading, setLoading] = useState(true);
  const [topUsers, setTopUsers] = useState<LeaderboardUser[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if cache is valid
  const isCacheValid = useCallback((cache: LeaderboardCache | null, currentUserId: string | undefined): boolean => {
    if (!cache || !currentUserId) return false;
    
    const now = Date.now();
    const isWithinTimeLimit = (now - cache.timestamp) < LEADERBOARD_CACHE_DURATION;
    const isForCurrentUser = cache.userId === currentUserId;
    
    return isWithinTimeLimit && isForCurrentUser;
  }, []);

  // Optimized fetch function with caching
  const fetchLeaderboard = useCallback(async (forceRefresh: boolean = false) => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Check cache first (unless force refresh)
    if (!forceRefresh && isCacheValid(leaderboardCache, user.uid)) {
      console.log('📋 Using cached leaderboard data');
      setTopUsers(leaderboardCache!.topUsers);
      setUserRank(leaderboardCache!.userRank);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Fetching fresh leaderboard data...');
      
      // Fetch top users with retry logic
      const usersQuery = query(
        collection(db, 'users'),
        orderBy('boltBalance', 'desc'),
        limit(TOP_USERS_LIMIT)
      );

      const querySnapshot = await retryOperation(() => getDocs(usersQuery));
      const firestoreUsers: LeaderboardUser[] = [];

      querySnapshot.forEach((doc, index) => {
        const userData = doc.data() as User;
        firestoreUsers.push({
          id: doc.id,
          name: userData.name,
          boltBalance: userData.boltBalance,
          rank: index + 1,
          avatar: userData.profilePictureUrl,
          isCurrentUser: doc.id === user.uid
        });
      });

      // Calculate current user rank if not in top users
      let currentUserRank: number | null = null;
      const userInTop = firestoreUsers.some(u => u.isCurrentUser);
      
      if (!userInTop) {
        try {
          // Optimized rank calculation - only count users with higher balance
          const higherUsersQuery = query(
            collection(db, 'users'),
            orderBy('boltBalance', 'desc')
          );
          
          const higherUsersSnapshot = await retryOperation(() => getDocs(higherUsersQuery));
          currentUserRank = 1;
          
          higherUsersSnapshot.forEach((doc) => {
            const userData = doc.data() as User;
            if (userData.boltBalance > user.boltBalance) {
              currentUserRank!++;
            }
          });
        } catch (rankError) {
          console.warn('⚠️ Error fetching user rank:', rankError);
          currentUserRank = null;
        }
      }

      // Update state
      setTopUsers(firestoreUsers);
      setUserRank(currentUserRank);
      
      // Update cache
      leaderboardCache = {
        topUsers: firestoreUsers,
        userRank: currentUserRank,
        timestamp: Date.now(),
        userId: user.uid
      };
      
      console.log('✅ Leaderboard data updated successfully');
    } catch (error: any) {
      console.error('❌ Error fetching leaderboard:', error);
      setError(error.message || 'Failed to load leaderboard');
      
      // Use cached data as fallback if available
      if (leaderboardCache && leaderboardCache.userId === user.uid) {
        console.log('📋 Using cached data as fallback');
        setTopUsers(leaderboardCache.topUsers);
        setUserRank(leaderboardCache.userRank);
        setError('Using cached data - connection issues');
      } else {
        // Handle specific error types
        if (error.code === 'permission-denied') {
          const permissionErrorUsers: LeaderboardUser[] = [
            { id: '1', name: 'Permission Required', boltBalance: 0, rank: 1 },
            { id: '2', name: 'Check Firestore Rules', boltBalance: 0, rank: 2 },
            { id: '3', name: 'Deploy Updated Rules', boltBalance: 0, rank: 3 }
          ];
          setTopUsers(permissionErrorUsers);
          setError('Permission denied - check Firestore rules');
        } else if (!isOnline) {
          // Offline fallback
          const offlineUsers: LeaderboardUser[] = [
            { id: '1', name: 'Offline Mode', boltBalance: 0, rank: 1 },
            { id: '2', name: 'Connect to Internet', boltBalance: 0, rank: 2 },
            { id: '3', name: 'To View Leaderboard', boltBalance: 0, rank: 3 }
          ];
          setTopUsers(offlineUsers);
          setError('You are offline');
        } else {
          // Generic fallback
          const fallbackUsers: LeaderboardUser[] = [
            { id: '1', name: 'Sarah Chen', boltBalance: 2450, rank: 1 },
            { id: '2', name: 'Alex Rivera', boltBalance: 2180, rank: 2 },
            { id: '3', name: 'Jordan Kim', boltBalance: 1950, rank: 3 }
          ];
          setTopUsers(fallbackUsers);
          setError('Using sample data - connection issues');
        }
      }
    } finally {
      setLoading(false);
    }
  }, [user, isOnline, isCacheValid]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setTopUsers([]);
      setUserRank(null);
      setError(null);
      return;
    }

    fetchLeaderboard();
  }, [user, fetchLeaderboard]);

  // Memoized rank icon function
  const getRankIcon = useCallback((rank: number) => {
    switch (rank) {
      case 1:
        return { name: 'trophy' as const, color: '#FFD700', size: 24 };
      case 2:
        return { name: 'medal' as const, color: '#C0C0C0', size: 22 };
      case 3:
        return { name: 'medal' as const, color: '#CD7F32', size: 20 };
      default:
        return { name: 'person' as const, color: Colors.textSecondary, size: 18 };
    }
  }, []);

  // Memoized rank style function
  const getRankStyle = useCallback((rank: number) => {
    switch (rank) {
      case 1:
        return {
          container: styles.firstPlace,
          gradient: ['#FFD700', '#FFA500'] as const,
          height: 80
        };
      case 2:
        return {
          container: styles.secondPlace,
          gradient: ['#C0C0C0', '#A8A8A8'] as const,
          height: 70
        };
      case 3:
        return {
          container: styles.thirdPlace,
          gradient: ['#CD7F32', '#B8860B'] as const,
          height: 60
        };
      default:
        return {
          container: styles.defaultPlace,
          gradient: [Colors.surface, Colors.surface] as const,
          height: 60
        };
    }
  }, []);

  // Memoized refresh handler
  const handleRefresh = useCallback(() => {
    if (user) {
      fetchLeaderboard(true); // Force refresh
    }
  }, [user, fetchLeaderboard]);

  // Memoized PodiumItem component
  const PodiumItem = memo(({ userData, getRankIcon, getRankStyle }: {
    userData: LeaderboardUser;
    getRankIcon: (rank: number) => { name: any; color: string; size: number };
    getRankStyle: (rank: number) => any;
  }) => {
    const rankIcon = getRankIcon(userData.rank);
    const rankStyle = getRankStyle(userData.rank);
    
    return (
      <View style={[styles.podiumItem, { flex: userData.rank === 1 ? 1.2 : 1 }]}>
        <LinearGradient
          colors={rankStyle.gradient}
          style={[styles.podiumBar, { height: rankStyle.height }]}
        >
          <View style={styles.podiumContent}>
            <View style={[styles.rankBadge, userData.isCurrentUser && styles.currentUserBadge]}>
              <Ionicons 
                name={rankIcon.name} 
                size={rankIcon.size} 
                color={rankIcon.color} 
              />
            </View>
            <View style={styles.userInfo}>
              <View style={[styles.avatar, userData.isCurrentUser && styles.currentUserAvatar]}>
                {userData.avatar ? (
                  <Image source={{ uri: userData.avatar }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="person" size={20} color={Colors.primary} />
                )}
              </View>
              <Text style={[styles.userName, userData.rank === 1 && styles.firstPlaceName]} numberOfLines={1}>
                {userData.isCurrentUser ? 'You' : userData.name}
              </Text>
              <View style={styles.boltContainer}>
                <Ionicons name="flash" size={12} color={Colors.bolt} />
                <Text style={[styles.boltBalance, userData.rank === 1 && styles.firstPlaceBalance]}>
                  {userData.boltBalance.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>
        <Text style={[styles.positionNumber, userData.isCurrentUser && styles.currentUserPosition]}>
          #{userData.rank}
        </Text>
      </View>
    );
  });

  // Memoized motivation message
  const motivationMessage = useMemo(() => {
    if (!user) return "🔐 Sign in to view the leaderboard and compete with other users!";
    if (error) return `⚠️ ${error}`;
    if (topUsers.some(u => u.isCurrentUser)) {
      return "🎉 You're in the top 3! Keep it up!";
    }
    return "💪 Keep earning Bolts to climb the leaderboard!";
  }, [user, error, topUsers]);

  if (loading) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.header}>
          <Text style={styles.title}>🏆 Leaderboard</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading top performers...</Text>
        </View>
      </View>
    );
  }

  // Show message when user is not authenticated
  if (!user) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Ionicons name="trophy" size={20} color={Colors.primary} />
            <Text style={styles.title}>Leaderboard</Text>
          </View>
        </View>
        <View style={styles.motivationContainer}>
          <Text style={styles.motivationText}>
            🔐 Sign in to view the leaderboard and compete with other users!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="trophy" size={20} color={Colors.primary} />
          <Text style={styles.title}>Leaderboard</Text>
        </View>
        {onViewAll && (
          <TouchableOpacity onPress={onViewAll} style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Optimized Podium Style Display */}
      <View style={styles.podiumContainer}>
        {topUsers.map((userData) => (
          <PodiumItem
            key={userData.id}
            userData={userData}
            getRankIcon={getRankIcon}
            getRankStyle={getRankStyle}
          />
        ))}
      </View>

      {/* Current User Status (if not in top 3) */}
      {user && !topUsers.some(u => u.isCurrentUser) && (
        <View style={styles.currentUserStatus}>
          <View style={styles.currentUserCard}>
            <View style={styles.currentUserInfo}>
              <View style={styles.currentUserAvatar}>
                <Ionicons name="person" size={16} color={Colors.primary} />
              </View>
              <Text style={styles.currentUserName}>Your Rank</Text>
            </View>
            <View style={styles.currentUserStats}>
              <Text style={styles.currentUserRank}>#{userRank || '?'}</Text>
              <View style={styles.currentUserBolts}>
                <Ionicons name="flash" size={12} color={Colors.bolt} />
                <Text style={styles.currentUserBalance}>{user.boltBalance}</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Optimized Motivational Message */}
      <View style={styles.motivationContainer}>
        <Text style={styles.motivationText}>{motivationMessage}</Text>
        {error && (
          <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
            <Ionicons name="refresh" size={16} color={Colors.primary} />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

export default Leaderboard;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  podiumContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  podiumItem: {
    alignItems: 'center',
  },
  podiumBar: {
    borderRadius: 12,
    width: '100%',
    minWidth: 60,
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  podiumContent: {
    alignItems: 'center',
  },
  rankBadge: {
    position: 'absolute',
    top: -12,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  currentUserBadge: {
    backgroundColor: Colors.primary,
  },
  userInfo: {
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  currentUserAvatar: {
    borderColor: Colors.primary,
  },
  avatarImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  userName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
    textAlign: 'center',
  },
  firstPlaceName: {
    color: '#8B4513',
    fontWeight: 'bold',
  },
  boltContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  boltBalance: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.textSecondary,
  },
  firstPlaceBalance: {
    color: '#8B4513',
  },
  positionNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    marginTop: 4,
  },
  currentUserPosition: {
    color: Colors.primary,
  },
  firstPlace: {},
  secondPlace: {},
  thirdPlace: {},
  defaultPlace: {},
  currentUserStatus: {
    marginBottom: 12,
  },
  currentUserCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  currentUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentUserAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentUserName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  currentUserStats: {
    alignItems: 'flex-end',
  },
  currentUserRank: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  currentUserBolts: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  currentUserBalance: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.text,
  },
  motivationContainer: {
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  motivationText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  retryText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
});