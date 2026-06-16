import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import BottomNavBar from '../components/BottomNavBar';

const stats = [
  { id: '1', label: 'Total Views', value: '12.4k', icon: 'eye-outline', change: '+12%' },
  { id: '2', label: 'Saved', value: '328', icon: 'heart-outline', change: '+8%' },
  { id: '3', label: 'Inquiries', value: '94', icon: 'chatbubble-outline', change: '+24%' },
  { id: '4', label: 'Booked', value: '17', icon: 'checkmark-done-outline', change: '+5%' },
];

const chartData = [
  { month: 'Jan', value: 45 },
  { month: 'Feb', value: 60 },
  { month: 'Mar', value: 38 },
  { month: 'Apr', value: 80 },
  { month: 'May', value: 65 },
  { month: 'Jun', value: 92 },
];

const InsightsScreen = ({ navigation }) => {
  const maxValue = Math.max(...chartData.map((d) => d.value));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Insights</Text>
        <Text style={styles.subtitle}>Your activity overview</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Stat Cards */}
        <View style={styles.statsGrid}>
          {stats.map((stat) => (
            <View key={stat.id} style={styles.statCard}>
              <View style={styles.statIconWrapper}>
                <Ionicons name={stat.icon} size={20} color={colors.primary} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <View style={styles.changeBadge}>
                <Ionicons name="trending-up" size={12} color={colors.success} />
                <Text style={styles.changeText}>{stat.change}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Bar Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Monthly Views</Text>
            <Text style={styles.chartPeriod}>Last 6 months</Text>
          </View>
          <View style={styles.chart}>
            {chartData.map((d) => (
              <View key={d.month} style={styles.barColumn}>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { height: `${(d.value / maxValue) * 100}%` },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{d.month}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Performance List */}
        <View style={styles.listCard}>
          <Text style={styles.chartTitle}>Top Performing</Text>
          {[
            { name: 'Suncrest Manor', views: '4.2k', pct: 85 },
            { name: 'Luxury 3BHK', views: '3.1k', pct: 64 },
            { name: 'Green Valley Villa', views: '2.8k', pct: 52 },
          ].map((item, i) => (
            <View key={i} style={styles.perfRow}>
              <View style={styles.perfInfo}>
                <Text style={styles.perfName}>{item.name}</Text>
                <Text style={styles.perfViews}>{item.views} views</Text>
              </View>
              <View style={styles.perfBarTrack}>
                <View style={[styles.perfBarFill, { width: `${item.pct}%` }]} />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <BottomNavBar activeTab="charts" navigation={navigation} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 110,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
    marginLeft: 3,
  },
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginTop: 6,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  chartPeriod: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barTrack: {
    width: 24,
    height: 130,
    justifyContent: 'flex-end',
    backgroundColor: colors.background,
    borderRadius: 12,
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  barLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
  },
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  perfRow: {
    marginTop: 16,
  },
  perfInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  perfName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  perfViews: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  perfBarTrack: {
    height: 8,
    backgroundColor: colors.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  perfBarFill: {
    height: '100%',
    backgroundColor: colors.secondary,
    borderRadius: 4,
  },
});

export default InsightsScreen;
