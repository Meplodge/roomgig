import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { useAppData } from '../context/AppDataContext';

const Row = ({ icon, label, value }) => (
  <View style={styles.row}>
    <View style={styles.rowLeft}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={styles.rowLabel}>{label}</Text>
    </View>
    <Text style={styles.rowValue}>{value}</Text>
  </View>
);

const BookingConfirmationScreen = ({ route, navigation }) => {
  const { property, booking } = route.params;
  const { addBooking } = useAppData();
  const referenceRef = useRef(`EST-${Math.floor(100000 + Math.random() * 900000)}`);
  const reference = referenceRef.current;

  useEffect(() => {
    // Calculate check_out_date from check_in_date and months
    // booking.date is in format like "Jun 23, 2026"
    const [monthStr, dayStr, yearStr] = booking.date.split(' ');
    const monthMap = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
    const month = monthMap[monthStr];
    const day = parseInt(dayStr.replace(',', ''));
    const year = parseInt(yearStr);

    const checkInDate = new Date(year, month, day);
    const checkOutDate = new Date(checkInDate);
    checkOutDate.setMonth(checkOutDate.getMonth() + booking.months);

    // Format dates as YYYY-MM-DD for database
    const formatDate = (date) => {
      return date.toISOString().split('T')[0];
    };

    addBooking({
      reference,
      property_id: property.id,
      check_in_date: formatDate(checkInDate),
      check_out_date: formatDate(checkOutDate),
      guests: booking.guests,
      total_amount: booking.total,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.successCircle}>
          <Ionicons name="checkmark" size={48} color={colors.surface} />
        </View>
        <Text style={styles.title}>Booking Confirmed!</Text>
        <Text style={styles.subtitle}>
          Your booking request for {property.name} has been received.
        </Text>

        <View style={styles.card}>
          <View style={styles.propertyRow}>
            <Image source={{ uri: property.image }} style={styles.propertyImage} />
            <View style={styles.propertyInfo}>
              <Text style={styles.propertyName}>{property.name}</Text>
              <Text style={styles.propertyLocation}>{property.location}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Row icon="pricetag-outline" label="Reference" value={reference} />
          <Row icon="calendar-outline" label="Move-in" value={booking.date} />
          <Row
            icon="time-outline"
            label="Duration"
            value={`${booking.months} month${booking.months > 1 ? 's' : ''}`}
          />
          <Row icon="people-outline" label="Guests" value={`${booking.guests}`} />

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.totalLabel}>Total Paid</Text>
            <Text style={styles.totalValue}>${booking.total.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Home')}
          activeOpacity={0.9}
        >
          <Text style={styles.primaryButtonText}>Back to Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('BookingHistory')}
          activeOpacity={0.9}
        >
          <Text style={styles.secondaryButtonText}>View My Bookings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 28, paddingTop: 40 },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: 10 },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  propertyRow: { flexDirection: 'row', alignItems: 'center' },
  propertyImage: { width: 60, height: 60, borderRadius: 12, backgroundColor: colors.border },
  propertyInfo: { marginLeft: 12, flex: 1 },
  propertyName: { fontSize: 16, fontWeight: '700', color: colors.text },
  propertyLocation: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 16 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  rowLabel: { fontSize: 14, color: colors.textSecondary, marginLeft: 10 },
  rowValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  totalLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
  totalValue: { fontSize: 20, fontWeight: '700', color: colors.primary },
  footer: { paddingHorizontal: 28, paddingBottom: 16 },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 17,
    borderRadius: 28,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: { color: colors.surface, fontSize: 16, fontWeight: '700' },
  secondaryButton: {
    paddingVertical: 17,
    borderRadius: 28,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: { color: colors.text, fontSize: 16, fontWeight: '600' },
});

export default BookingConfirmationScreen;
