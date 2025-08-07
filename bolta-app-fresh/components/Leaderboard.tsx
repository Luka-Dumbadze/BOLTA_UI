// components/Leaderboard.tsx
import React, { useState, useEffect } from 'react';
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
import { useSession } from '../providers/SessionProvider';
import { Colors } from '../constants/Colors';

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

export default function Leaderboard({ onViewAll, style }: LeaderboardProps) {
  const { user } = useSession();
  const [loading, setLoading] = useState(true);
  const [topUsers, setTopUsers] = useState<LeaderboardUser[]>([]);

  useEffect(() => {
    // Simulate fetching leaderboard data
    // In real app, this would fetch from Firestore
    const fetchLeaderboard = async () => {
      setLoading(true);
      
      // Mock data - replace with actual Firestore query
      const mockUsers: LeaderboardUser[] = [
        {
          id: '1',
          name: 'Sarah Chen',
          boltBalance: 2450,
          rank: 1,
          avatar: 'https://via.placeholder.com/60x60?text=SC'
        },
        {
          id: '2', 
          name: 'Alex Rivera',
          boltBalance: 2180,
          rank: 2,
          avatar: 'https://via.placeholder.com/60x60?text=AR'
        },
        {
          id: '3',
          name: 'Jordan Kim',
          boltBalance: 1950,
          rank: 3,
          avatar: 'https://via.placeholder.com/60x60?text=JK'
        }
      ];

      // Add current user if they're in top 3
      if (user && user.boltBalance >= 1950) {
        const currentUserRank = mockUsers.findIndex(u => u.boltBalance <= user.boltBalance) + 1;
        if (currentUserRank <= 3) {
          mockUsers.splice(currentUserRank - 1, 0, {
            id: user.uid,
            name: user.name,
            boltBalance: user.boltBalance,
            rank: currentUserRank,
            isCurrentUser: true
          });
          // Update ranks
          mockUsers.forEach((u, index) => {
            u.rank = index + 1;
          });
        }
      }

      setTimeout(() => {
        setTopUsers(mockUsers.slice(0, 3));
        setLoading(false);
      }, 1000);
    };

    fetchLeaderboard();
  }, [user]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return { name: 'trophy', color: '#FFD700', size: 24 }; // Gold
      case 2:
        return { name: 'medal', color: '#C0C0C0', size: 22 }; // Silver
      case 3:
        return { name: 'medal', color: '#CD7F32', size: 20 }; // Bronze
      default:
        return { name: 'person', color: Colors.textSecondary, size: 18 };
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          container: styles.firstPlace,
          gradient: ['#FFD700', '#FFA500'],
          height: 80
        };
      case 2:
        return {
          container: styles.secondPlace,
          gradient: ['#C0C0C0', '#A8A8A8'],
          height: 70
        };
      case 3:
        return {
          container: styles.thirdPlace,
          gradient: ['#CD7F32', '#B8860B'],
          height: 60
        };
      default:
        return {
          container: styles.defaultPlace,
          gradient: [Colors.surface, Colors.surface],
          height: 60
        };
    }
  };

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

      {/* Podium Style Display */}
      <View style={styles.podiumContainer}>
        {topUsers.map((userData, index) => {
          const rankIcon = getRankIcon(userData.rank);
          const rankStyle = getRankStyle(userData.rank);
          
          return (
            <View key={userData.id} style={[styles.podiumItem, { flex: userData.rank === 1 ? 1.2 : 1 }]}>
              {/* Podium Bar */}
              <LinearGradient
                colors={rankStyle.gradient}
                style={[styles.podiumBar, { height: rankStyle.height }]}
              >
                <View style={styles.podiumContent}>
                  {/* Rank Badge */}
                  <View style={[styles.rankBadge, userData.isCurrentUser && styles.currentUserBadge]}>
                    <Ionicons 
                      name={rankIcon.name as any} 
                      size={rankIcon.size} 
                      color={rankIcon.color} 
                    />
                  </View>

                  {/* User Info */}
                  <View style={styles.userInfo}>
                    {/* Avatar */}
                    <View style={[styles.avatar, userData.isCurrentUser && styles.currentUserAvatar]}>
                      {userData.avatar ? (
                        <Image source={{ uri: userData.avatar }} style={styles.avatarImage} />
                      ) : (
                        <Ionicons name="person" size={20} color={Colors.primary} />
                      )}
                    </View>

                    {/* Name */}
                    <Text style={[styles.userName, userData.rank === 1 && styles.firstPlaceName]} numberOfLines={1}>
                      {userData.isCurrentUser ? 'You' : userData.name}
                    </Text>

                    {/* Bolt Balance */}
                    <View style={styles.boltContainer}>
                      <Ionicons name="flash" size={12} color={Colors.bolt} />
                      <Text style={[styles.boltBalance, userData.rank === 1 && styles.firstPlaceBalance]}>
                        {userData.boltBalance.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>

              {/* Position Number */}
              <Text style={[styles.positionNumber, userData.isCurrentUser && styles.currentUserPosition]}>
                #{userData.rank}
              </Text>
            </View>
          );
        })}
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
              <Text style={styles.currentUserRank}>#?</Text>
              <View style={styles.currentUserBolts}>
                <Ionicons name="flash" size={12} color={Colors.bolt} />
                <Text style={styles.currentUserBalance}>{user.boltBalance}</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Motivational Message */}
      <View style={styles.motivationContainer}>
        <Text style={styles.motivationText}>
          {user && topUsers.some(u => u.isCurrentUser) 
            ? "🎉 You're in the top 3! Keep it up!" 
            : "💪 Keep earning Bolts to climb the leaderboard!"
          }
        </Text>
      </View>
    </View>
  );
}

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
  },
});