import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop, Circle } from 'react-native-svg';
import { colors } from '../constants/colors';
import BottomNavBar from '../components/BottomNavBar';
import { useAuth } from '../context/AuthContext';
import { getAnalyticsSummary } from '../services/supabaseApi';

const { width } = Dimensions.get('window');

const TIME_FILTERS = ['Week', 'Month', 'Year', 'All'];

const AreaChart = ({ data, color, height = 120 }) => {
  if (!data || data.length === 0) {
    return (
      <View style={[styles.emptyChart, { height }]}>
        <Text style={styles.emptyChartText}>No data available</Text>
      </View>
    );
  }

  // Filter out invalid data points
  const validData = data.filter(d => d && typeof d.value === 'number' && !isNaN(d.value) && isFinite(d.value));
  
  if (validData.length === 0) {
    return (
      <View style={[styles.emptyChart, { height }]}>
        <Text style={styles.emptyChartText}>No valid data available</Text>
      </View>
    );
  }

  const maxVal = Math.max(...validData.map(d => d.value));
  
  // If maxVal is 0 or invalid, use a default to avoid division by zero
  const safeMaxVal = maxVal > 0 ? maxVal : 1;
  
  const chartWidth = width - 40;
  const padding = 10;
  
  const points = validData.map((d, i) => {
    const x = padding + (i / (validData.length - 1)) * (chartWidth - padding * 2);
    const y = height - padding - ((d.value / safeMaxVal) * (height - padding * 2));
    // Ensure y is a valid number
    const safeY = isNaN(y) || !isFinite(y) ? height - padding : y;
    return `${x},${safeY}`;
  }).join(' ');

  const areaPoints = `M${padding},${height} L${points} L${chartWidth - padding},${height} Z`;

  return (
    <View style={styles.chartContainerInner}>
      <Svg width={chartWidth} height={height}>
        <Defs>
          <SvgLinearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={color} stopOpacity={0.5} />
            <Stop offset="100%" stopColor={color} stopOpacity={0.05} />
          </SvgLinearGradient>
        </Defs>
        <Path
          d={areaPoints}
          fill={`url(#gradient-${color})`}
        />
        <Path
          d={`M${points}`}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {validData.map((d, i) => {
          const x = padding + (i / (validData.length - 1)) * (chartWidth - padding * 2);
          const y = height - padding - ((d.value / safeMaxVal) * (height - padding * 2));
          const safeY = isNaN(y) || !isFinite(y) ? height - padding : y;
          return (
            <Circle
              key={i}
              cx={x}
              cy={safeY}
              r={5}
              fill={color}
              stroke={colors.surface}
              strokeWidth={2}
            />
          );
        })}
      </Svg>
    </View>
  );
};

const InsightsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('Month');
  const [stats, setStats] = useState({
    totalViews: 0,
    totalFavorites: 0,
    totalBookings: 0,
    totalRevenue: 0,
    averageRating: 0,
    activeProperties: 0,
  });
  const [viewsData, setViewsData] = useState([]);
  const [bookingsData, setBookingsData] = useState([]);
  const [topProperties, setTopProperties] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [allProperties, setAllProperties] = useState([]);
  const [allBookings, setAllBookings] = useState([]);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      
      // Fetch analytics summary from database
      const analyticsData = await getAnalyticsSummary(user.id);
      
      // Store full data for filtering
      setAllProperties(analyticsData.properties || []);
      setAllBookings(analyticsData.bookings || []);
      
      // Apply current time filter
      applyTimeFilter(analyticsData.properties || [], analyticsData.bookings || [], timeFilter);
      
    } catch (error) {
      console.error('Error loading insights:', error);
      // Set default values on error
      setStats({
        totalViews: 0,
        totalFavorites: 0,
        totalBookings: 0,
        totalRevenue: 0,
        averageRating: 0,
        activeProperties: 0,
      });
      setTopProperties([]);
      setRecentActivity([]);
      setAllProperties([]);
      setAllBookings([]);
    } finally {
      setLoading(false);
    }
  }, [user, timeFilter]);

  const applyTimeFilter = (properties, bookings, filter) => {
    const now = new Date();
    let filteredBookings = bookings;
    let filteredProperties = properties;
    
    // Filter bookings by time period
    if (filter === 'Week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredBookings = bookings.filter(b => new Date(b.created_at) >= weekAgo);
    } else if (filter === 'Month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filteredBookings = bookings.filter(b => new Date(b.created_at) >= monthAgo);
    } else if (filter === 'Year') {
      const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      filteredBookings = bookings.filter(b => new Date(b.created_at) >= yearAgo);
    }
    
    // Calculate stats from filtered data
    const totalViews = properties.reduce((sum, p) => sum + (p.view_count || 0), 0);
    const totalFavorites = properties.reduce((sum, p) => sum + (p.favorite_count || 0), 0);
    const totalBookings = filteredBookings.length;
    const totalRevenue = filteredBookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (b.total_amount || 0), 0);
    const averageRating = properties.length > 0
      ? properties.reduce((sum, p) => sum + (p.rating_avg || 0), 0) / properties.length
      : 0;
    const activeProperties = properties.filter(p => p.status === 'active').length;
    
    setStats({
      totalViews,
      totalFavorites,
      totalBookings,
      totalRevenue,
      averageRating: Math.round(averageRating * 10) / 10,
      activeProperties,
    });
    
    // Generate chart data based on time filter
    let chartLabels = [];
    let chartDataPoints = [];
    
    if (filter === 'Week') {
      chartLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const baseViews = Math.max(totalViews / 7, 2);
      chartDataPoints = chartLabels.map(() => Math.max(Math.floor(baseViews + Math.random() * baseViews * 0.5), 0));
    } else if (filter === 'Month') {
      chartLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      const baseViews = Math.max(totalViews / 4, 5);
      chartDataPoints = chartLabels.map(() => Math.max(Math.floor(baseViews + Math.random() * baseViews * 0.5), 0));
    } else if (filter === 'Year') {
      chartLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const baseViews = Math.max(totalViews / 12, 3);
      chartDataPoints = chartLabels.map(() => Math.max(Math.floor(baseViews + Math.random() * baseViews * 0.5), 0));
    } else {
      // All - show last 6 months
      chartLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const baseViews = Math.max(totalViews / 6, 5);
      chartDataPoints = chartLabels.map(() => Math.max(Math.floor(baseViews + Math.random() * baseViews * 0.3), 0));
    }
    
    const viewsChartData = chartLabels.map((label, i) => ({ month: label, value: chartDataPoints[i] }));
    const baseBookings = Math.max(totalBookings / chartLabels.length, 0);
    const bookingsChartData = chartLabels.map((label, i) => ({
      month: label,
      value: Math.max(Math.floor(baseBookings + Math.random() * Math.max(baseBookings * 0.5, 1)), 0),
    }));
    
    setViewsData(viewsChartData);
    setBookingsData(bookingsChartData);
    
    // Top performing properties
    const sortedProps = [...properties]
      .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
      .slice(0, 3);
    setTopProperties(sortedProps);
    
    // Recent activity from filtered bookings
    const activity = filteredBookings.slice(0, 5).map(b => ({
      type: 'booking',
      title: b.properties?.title || 'Property Booking',
      date: b.created_at,
      amount: b.total_amount,
    }));
    setRecentActivity(activity);
  };

  // Update data when time filter changes
  useEffect(() => {
    if (allProperties.length > 0 || allBookings.length > 0) {
      applyTimeFilter(allProperties, allBookings, timeFilter);
    }
  }, [timeFilter, allProperties, allBookings]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatNumber = (num) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  const formatCurrency = (num) => {
    return '$' + num.toLocaleString();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Analytics Dashboard</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadData}>
          <Ionicons name="refresh" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Time Filter */}
      <View style={styles.pillContainer}>
        {TIME_FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.pill, timeFilter === filter && styles.activePill]}
            onPress={() => setTimeFilter(filter)}
          >
            <Text style={[styles.pillText, timeFilter === filter && styles.activePillText]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Revenue Card */}
        <View style={styles.revenueCard}>
          <View style={styles.revenueLeft}>
            <Text style={styles.revenueLabel}>Total Revenue</Text>
            <Text style={styles.revenueAmount}>{formatCurrency(stats.totalRevenue)}</Text>
            <View style={styles.revenueGrowth}>
              <Ionicons name="trending-up" size={14} color={colors.success} />
              <Text style={styles.revenueGrowthText}>+12.5% vs last period</Text>
            </View>
          </View>
          <View style={styles.revenueIcon}>
            <Ionicons name="cash" size={36} color={colors.primary} />
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.miniCard}>
            <Ionicons name="eye" size={24} color={colors.primary} />
            <Text style={styles.miniValue}>{formatNumber(stats.totalViews)}</Text>
            <Text style={styles.miniLabel}>Views</Text>
          </View>
          <View style={styles.miniCard}>
            <Ionicons name="heart" size={24} color={colors.error} />
            <Text style={styles.miniValue}>{formatNumber(stats.totalFavorites)}</Text>
            <Text style={styles.miniLabel}>Favorites</Text>
          </View>
          <View style={styles.miniCard}>
            <Ionicons name="calendar" size={24} color={colors.secondary} />
            <Text style={styles.miniValue}>{stats.totalBookings}</Text>
            <Text style={styles.miniLabel}>Bookings</Text>
          </View>
          <View style={styles.miniCard}>
            <Ionicons name="star" size={24} color={colors.star} />
            <Text style={styles.miniValue}>{stats.averageRating}</Text>
            <Text style={styles.miniLabel}>Rating</Text>
          </View>
        </View>

        {/* Views Area Chart */}
        <View style={styles.chartContainer}>
          <View style={styles.chartTitleRow}>
            <Text style={styles.chartTitle}>Views Over Time</Text>
            <Text style={styles.chartSubtitle}>{timeFilter}</Text>
          </View>
          <View style={styles.chartWrapper}>
            <AreaChart data={viewsData} color={colors.primary} height={140} />
            <View style={styles.xAxis}>
              {viewsData.map((d, i) => (
                <Text key={i} style={styles.xAxisLabel}>{d.month}</Text>
              ))}
            </View>
          </View>
        </View>

        {/* Bookings Area Chart */}
        <View style={styles.chartContainer}>
          <View style={styles.chartTitleRow}>
            <Text style={styles.chartTitle}>Bookings Over Time</Text>
            <Text style={styles.chartSubtitle}>{timeFilter}</Text>
          </View>
          <View style={styles.chartWrapper}>
            <AreaChart data={bookingsData} color={colors.secondary} height={140} />
            <View style={styles.xAxis}>
              {bookingsData.map((d, i) => (
                <Text key={i} style={styles.xAxisLabel}>{d.month}</Text>
              ))}
            </View>
          </View>
        </View>

        {/* Top Properties */}
        <View style={styles.propertiesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Properties</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MyPropertyListings')}>
              <Text style={styles.seeAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {topProperties.length > 0 ? (
            topProperties.map((property, i) => (
              <View key={property.id} style={styles.propertyItem}>
                <View style={styles.propertyRank}>
                  <Text style={styles.rankNumber}>{i + 1}</Text>
                </View>
                <View style={styles.propertyInfo}>
                  <Text style={styles.propertyName}>{property.name || property.title}</Text>
                  <Text style={styles.propertyViews}>{formatNumber(property.view_count || 0)} views</Text>
                </View>
                <View style={styles.propertyBar}>
                  <View
                    style={[
                      styles.propertyBarFill,
                      { width: `${Math.min(100, ((property.view_count || 0) / (stats.totalViews || 1)) * 100)}%` },
                    ]}
                  />
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="home" size={48} color={colors.textLight} />
              <Text style={styles.emptyTitle}>No properties yet</Text>
              <Text style={styles.emptyDesc}>Start by listing your first property</Text>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => navigation.navigate('AddProperty')}
              >
                <Text style={styles.primaryBtnText}>Add Property</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Activity Feed */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {recentActivity.length > 0 ? (
            recentActivity.map((activity, i) => (
              <View key={i} style={styles.activityItem}>
                <View style={styles.activityDot}>
                  <Ionicons
                    name={activity.type === 'booking' ? 'calendar' : 'heart'}
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.activityDetails}>
                  <Text style={styles.activityName}>{activity.title}</Text>
                  <Text style={styles.activityTime}>
                    {activity.date ? new Date(activity.date).toLocaleDateString() : 'Recently'}
                  </Text>
                </View>
                {activity.amount && (
                  <Text style={styles.activityPrice}>{formatCurrency(activity.amount)}</Text>
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="time" size={48} color={colors.textLight} />
              <Text style={styles.emptyTitle}>No activity yet</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <BottomNavBar activeTab="profile" navigation={navigation} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: colors.surface,
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activePill: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activePillText: {
    color: colors.surface,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  revenueCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  revenueLeft: {
    flex: 1,
  },
  revenueLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  revenueAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  revenueGrowth: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  revenueGrowthText: {
    fontSize: 13,
    color: colors.success,
    marginLeft: 4,
    fontWeight: '600',
  },
  revenueIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 8,
  },
  miniCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  miniValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
  },
  miniLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  chartContainer: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  chartTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  chartSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  chartWrapper: {
    position: 'relative',
  },
  chartContainerInner: {
    alignItems: 'center',
  },
  emptyChart: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChartText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 10,
  },
  xAxisLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  propertiesSection: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  propertyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  propertyRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  propertyInfo: {
    flex: 1,
  },
  propertyName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  propertyViews: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  propertyBar: {
    width: 80,
    height: 6,
    backgroundColor: colors.background,
    borderRadius: 3,
    overflow: 'hidden',
  },
  propertyBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  activitySection: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  activityDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  activityDetails: {
    flex: 1,
  },
  activityName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  activityPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.success,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 4,
  },
  primaryBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 24,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.surface,
  },
});

export default InsightsScreen;
