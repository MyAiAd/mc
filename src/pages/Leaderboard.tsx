import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Crown, TrendingUp, Users, DollarSign, Calendar, Filter } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../hooks/useAuth';
import { AffiliateAggregationService } from '../services/affiliateAggregationService';

interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  avatar?: string;
  level: number;
  referrals: number;
  earnings: number;
  growth: number;
  tier: 'Sovereign' | 'Oracle' | 'Visionary' | 'Luminary' | 'Magnetic' | 'Ascended' | 'Activated' | 'Aligned';
  isCurrentUser?: boolean;
}

const Leaderboard: React.FC = () => {
  const { affiliates, orders, isLoading: dataLoading } = useData();
  const { supabase, isAdmin } = useAuth();
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [categoryFilter, setCategoryFilter] = useState<'earnings' | 'referrals' | 'growth'>('earnings');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const aggregationService = useMemo(() => new AffiliateAggregationService(supabase), [supabase]);

  useEffect(() => {
    loadLeaderboardData();
  }, [isAdmin, affiliates, orders, timeFilter, categoryFilter, aggregationService]);

  const loadLeaderboardData = async () => {
    setIsLoading(true);
    try {
      if (isAdmin) {
        // Admin: Load all affiliates from all sources using aggregation service
        console.log('🔄 Leaderboard: Loading all affiliates for admin...');
        const allAffiliates = await aggregationService.getAllAffiliates();
        transformAggregatedData(allAffiliates);
      } else {
        // Regular user: Use filtered data from DataContext
        console.log('🔄 Leaderboard: Loading user-specific data...');
        processRegularUserData();
      }
    } catch (error) {
      console.error('Error loading leaderboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const transformAggregatedData = (aggregatedAffiliates: any[]) => {
    console.log(`🔄 Leaderboard: Processing ${aggregatedAffiliates.length} aggregated affiliates for admin`);
    
    // Transform aggregated affiliate data into LeaderboardEntry format
    const transformedData: LeaderboardEntry[] = aggregatedAffiliates.map((affiliate) => {
      // Extract earnings from commission string (e.g. "$123.45" -> 123.45)
      const totalEarnings = parseFloat(affiliate.commission.replace('$', '')) || 0;

      // Calculate growth (mock for now, would need historical data)
      const growth = Math.random() * 30; // Mock growth percentage

      // Determine rank based on total earnings using new tier system
      const getRankFromEarnings = (earnings: number): LeaderboardEntry['tier'] => {
        if (earnings >= 1000000) return 'Sovereign';
        if (earnings >= 500000) return 'Oracle';
        if (earnings >= 100000) return 'Visionary';
        if (earnings >= 50000) return 'Luminary';
        if (earnings >= 25000) return 'Magnetic';
        if (earnings >= 5000) return 'Ascended';
        if (earnings >= 1000) return 'Activated';
        return 'Aligned';
      };

      return {
        id: affiliate.id,
        rank: 0, // Will be set after sorting
        name: affiliate.name || 'Unknown',
        level: 1, // Could be enhanced with referral structure
        referrals: affiliate.referrals || 0,
        earnings: totalEarnings,
        growth: growth,
        tier: getRankFromEarnings(totalEarnings),
        isCurrentUser: false // Would need current user comparison
      };
    });

    // Sort by the selected category
    const sortedData = transformedData.sort((a, b) => {
      switch (categoryFilter) {
        case 'earnings':
          return b.earnings - a.earnings;
        case 'referrals':
          return b.referrals - a.referrals;
        case 'growth':
          return b.growth - a.growth;
        default:
          return b.earnings - a.earnings;
      }
    });

    // Assign ranks after sorting
    const rankedData = sortedData.map((item, index) => ({
      ...item,
      rank: index + 1
    }));

    setLeaderboardData(rankedData);
  };

  const processRegularUserData = () => {
    if (!affiliates || affiliates.length === 0) {
      setLeaderboardData([]);
      return;
    }

    // Transform regular user affiliate data into LeaderboardEntry format
    const transformedData: LeaderboardEntry[] = affiliates.map((affiliate) => {
      // Calculate earnings from orders for this affiliate
      const affiliateOrders = orders.filter(order => 
        order.affiliate_id === affiliate.id || 
        order.customer_email === affiliate.email
      );
      const totalEarnings = affiliateOrders.reduce((sum, order) => 
        sum + (order.commission_amount || order.commission || 0), 0
      );

      // Calculate referrals count
      const referralsCount = affiliate.total_orders || affiliateOrders.length || 0;

      // Calculate growth (mock for now, would need historical data)
      const growth = Math.random() * 30; // Mock growth percentage

      // Determine rank based on total earnings using new tier system
      const getRankFromEarnings = (earnings: number): LeaderboardEntry['tier'] => {
        if (earnings >= 1000000) return 'Sovereign';
        if (earnings >= 500000) return 'Oracle';
        if (earnings >= 100000) return 'Visionary';
        if (earnings >= 50000) return 'Luminary';
        if (earnings >= 25000) return 'Magnetic';
        if (earnings >= 5000) return 'Ascended';
        if (earnings >= 1000) return 'Activated';
        return 'Aligned';
      };

      return {
        id: affiliate.id,
        rank: 0, // Will be set after sorting
        name: `${affiliate.first_name || ''} ${affiliate.last_name || ''}`.trim() || 'Unknown',
        level: 1,
        referrals: referralsCount,
        earnings: totalEarnings || affiliate.total_earnings || 0,
        growth: growth,
        tier: getRankFromEarnings(totalEarnings || affiliate.total_earnings || 0),
        isCurrentUser: false
      };
    });

    // Sort by the selected category
    const sortedData = transformedData.sort((a, b) => {
      switch (categoryFilter) {
        case 'earnings':
          return b.earnings - a.earnings;
        case 'referrals':
          return b.referrals - a.referrals;
        case 'growth':
          return b.growth - a.growth;
        default:
          return b.earnings - a.earnings;
      }
    });

    // Assign ranks after sorting
    const rankedData = sortedData.map((item, index) => ({
      ...item,
      rank: index + 1
    }));

    setLeaderboardData(rankedData);
  };



  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Sovereign': return 'text-purple-400';
      case 'Oracle': return 'text-indigo-400';
      case 'Visionary': return 'text-blue-400';
      case 'Luminary': return 'text-cyan-400';
      case 'Magnetic': return 'text-green-400';
      case 'Ascended': return 'text-yellow-400';
      case 'Activated': return 'text-orange-400';
      case 'Aligned': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'Sovereign': return '👑';
      case 'Oracle': return '🔮';
      case 'Visionary': return '✨';
      case 'Luminary': return '💫';
      case 'Magnetic': return '🧲';
      case 'Ascended': return '🚀';
      case 'Activated': return '⚡';
      case 'Aligned': return '🎯';
      default: return '🎯';
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500 text-black';
    if (rank === 2) return 'bg-gray-400 text-black';
    if (rank === 3) return 'bg-amber-600 text-black';
    return 'bg-rise-gold text-white';
  };

  const topThree = leaderboardData.slice(0, 3);
  const restOfLeaderboard = leaderboardData.slice(3);

  return (
    <div className="pb-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-semibold text-white mb-2 flex items-center">
          <Trophy className="mr-3 h-8 w-8 text-rise-gold" />
          Leaderboard
        </h1>
        <p className="text-gray-400">See how you stack up against the top performers in our network</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as any)}
            className="input-field"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="input-field"
          >
            <option value="earnings">By Earnings</option>
            <option value="referrals">By Referrals</option>
            <option value="growth">By Growth</option>
          </select>
        </div>
      </div>

      {/* Top 3 Podium */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h2 className="text-xl font-serif text-white mb-6 text-center">Top Performers</h2>
        <div className="flex justify-center items-end space-x-4">
          {/* 2nd Place */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="text-center"
          >
            <div className="bg-gray-400 rounded-lg p-6 mb-4 h-32 flex flex-col justify-end">
              <div className="w-16 h-16 rounded-full bg-rise-gold text-rise-dark flex items-center justify-center font-bold text-xl mx-auto mb-2">
                {topThree[1]?.name.charAt(0)}
              </div>
              <div className="text-black font-bold">2nd</div>
            </div>
            <h3 className="text-white font-semibold">{topThree[1]?.name}</h3>
            <p className="text-gray-400 text-sm">${topThree[1]?.earnings.toLocaleString()}</p>
            <div className="flex items-center justify-center mt-1">
              <span className="mr-1">{getTierIcon(topThree[1]?.tier)}</span>
              <span className={`text-xs ${getTierColor(topThree[1]?.tier)}`}>{topThree[1]?.tier}</span>
            </div>
          </motion.div>

          {/* 1st Place */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <div className="bg-yellow-500 rounded-lg p-6 mb-4 h-40 flex flex-col justify-end relative">
              <Crown className="absolute top-2 left-1/2 transform -translate-x-1/2 w-6 h-6 text-yellow-700" />
              <div className="w-20 h-20 rounded-full bg-rise-gold text-rise-dark flex items-center justify-center font-bold text-2xl mx-auto mb-2">
                {topThree[0]?.name.charAt(0)}
              </div>
              <div className="text-black font-bold text-lg">1st</div>
            </div>
            <h3 className="text-white font-semibold text-lg">{topThree[0]?.name}</h3>
            <p className="text-gray-400">${topThree[0]?.earnings.toLocaleString()}</p>
            <div className="flex items-center justify-center mt-1">
              <span className="mr-1">{getTierIcon(topThree[0]?.tier)}</span>
              <span className={`text-sm ${getTierColor(topThree[0]?.tier)}`}>{topThree[0]?.tier}</span>
            </div>
          </motion.div>

          {/* 3rd Place */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <div className="bg-amber-600 rounded-lg p-6 mb-4 h-24 flex flex-col justify-end">
              <div className="w-14 h-14 rounded-full bg-rise-gold text-rise-dark flex items-center justify-center font-bold mx-auto mb-2">
                {topThree[2]?.name.charAt(0)}
              </div>
              <div className="text-black font-bold">3rd</div>
            </div>
            <h3 className="text-white font-semibold">{topThree[2]?.name}</h3>
            <p className="text-gray-400 text-sm">${topThree[2]?.earnings.toLocaleString()}</p>
            <div className="flex items-center justify-center mt-1">
              <span className="mr-1">{getTierIcon(topThree[2]?.tier)}</span>
              <span className={`text-xs ${getTierColor(topThree[2]?.tier)}`}>{topThree[2]?.tier}</span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Full Leaderboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-serif text-xl text-white">Full Rankings</h2>
          <span className="text-gray-400 text-sm">{leaderboardData.length} total members</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-rise-gold divide-opacity-20">
            <thead>
              <tr>
                <th className="table-header text-left">Rank</th>
                <th className="table-header text-left">Member</th>
                <th className="table-header text-left">Level</th>
                <th className="table-header text-left">Referrals</th>
                <th className="table-header text-left">Earnings</th>
                <th className="table-header text-left">Growth</th>
                <th className="table-header text-left">Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rise-gold divide-opacity-10">
              {leaderboardData.map((entry, index) => (
                <motion.tr
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`hover:bg-rise-dark-light transition-colors ${
                    entry.isCurrentUser ? 'bg-rise-gold/10 border-l-4 border-rise-gold' : ''
                  }`}
                >
                  <td className="table-cell">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${getRankBadge(entry.rank)}`}>
                      {entry.rank}
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-rise-gold text-rise-dark flex items-center justify-center font-medium mr-3">
                        {entry.name.charAt(0)}
                      </div>
                      <div>
                        <div className={`text-sm font-medium ${entry.isCurrentUser ? 'text-rise-gold' : 'text-white'}`}>
                          {entry.name}
                          {entry.isCurrentUser && <span className="ml-2 text-xs">(You)</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-900/30 text-blue-400">
                      Level {entry.level}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 text-gray-400 mr-1" />
                      <span className="text-white">{entry.referrals}</span>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 text-green-400 mr-1" />
                      <span className="text-rise-gold font-semibold">${entry.earnings.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center">
                      <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                      <span className="text-green-400">+{entry.growth}%</span>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center">
                      <span className="mr-1">{getTierIcon(entry.tier)}</span>
                      <span className={getTierColor(entry.tier)}>{entry.tier}</span>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Your Performance Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-8 card bg-gradient-to-r from-rise-gold/10 to-rise-purple/10 border-rise-gold/20"
      >
        <div className="text-center">
          <h3 className="text-xl font-serif text-white mb-4">Your Performance Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-gray-400 text-sm">Current Rank</p>
              <p className="text-2xl font-bold text-rise-gold">#5</p>
              <p className="text-xs text-gray-500">out of {leaderboardData.length} members</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Points to Next Rank</p>
              <p className="text-2xl font-bold text-white">700</p>
              <p className="text-xs text-gray-500">earnings needed</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">This Month's Growth</p>
              <p className="text-2xl font-bold text-green-400">+12.3%</p>
              <p className="text-xs text-gray-500">keep it up!</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Leaderboard; 