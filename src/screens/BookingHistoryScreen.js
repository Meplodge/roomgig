import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { useAppData } from '../context/AppDataContext';
import EmptyState from '../components/EmptyState';

const BookingHistoryScreen = ({ navigation }) => {
  const { bookings } = useAppData();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <View style={{ width: 42 }} />
      </View>

      {bookings.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title="No Bookings Yet"
          message="When you book a property, it will appear here."
          actionText="Browse Properties"
          onAction={() => navigation.navigate('Home')}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {bookings.map((b) => (
            <View key={b.reference} style={styles.card}>
              <Image source={{ uri: b.propertyImage }} style={styles.image} />
              <View style={styles.info}>
                <View style={styles.cardHeader}>
                  <Text style={styles.name}>{b.propertyName}</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>Confirmed</Text>
                  </View>
                </View>
                <View style={styles.metaRow}>
                  <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
                  <Text style={styles.meta}>{b.date}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
                  <Text style={styles.meta}>
                    {b.months} month{b.months > 1 ? 's' : ''} · {b.guests} guest
                    {b.guests > 1 ? 's' : ''}
                  </Text>
                </View>
                <View style={styles.cardFooter}>
                  <Text style={styles.reference}>{b.reference}</Text>
                  <Text style={styles.total}>${b.total.toLocaleString()}</Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  scroll: { paddingHorizontal: 20, paddingBottom: 24 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    flexDirection: 'row',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  image: { width: 90, height: 100, borderRadius: 12, backgroundColor: colors.border },
  info: { flex: 1, marginLeft: 12 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: { fontSize: 15, fontWeight: '700', color: colors.text, flex: 1 },
  statusBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  meta: { fontSize: 12, color: colors.textSecondary, marginLeft: 5 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  reference: { fontSize: 12, color: colors.textLight, fontWeight: '600' },
  total: { fontSize: 16, fontWeight: '700', color: colors.primary },
});

export default BookingHistoryScreen;
