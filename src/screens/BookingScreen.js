import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const Stepper = ({ label, value, onDecrement, onIncrement, min }) => (
  <View style={styles.stepperRow}>
    <Text style={styles.stepperLabel}>{label}</Text>
    <View style={styles.stepperControls}>
      <TouchableOpacity
        style={[styles.stepBtn, value <= min && styles.stepBtnDisabled]}
        onPress={onDecrement}
        disabled={value <= min}
      >
        <Ionicons name="remove" size={18} color={value <= min ? colors.textLight : colors.primary} />
      </TouchableOpacity>
      <Text style={styles.stepValue}>{value}</Text>
      <TouchableOpacity style={styles.stepBtn} onPress={onIncrement}>
        <Ionicons name="add" size={18} color={colors.primary} />
      </TouchableOpacity>
    </View>
  </View>
);

const BookingScreen = ({ route, navigation }) => {
  const { property } = route.params;
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [months, setMonths] = useState(1);
  const [guests, setGuests] = useState(1);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  const calendarCells = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [viewMonth, viewYear]);

  const isPast = (day) => {
    if (!day) return false;
    const date = new Date(viewYear, viewMonth, day);
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return date < start;
  };

  const changeMonth = (dir) => {
    let m = viewMonth + dir;
    let y = viewYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setViewMonth(m);
    setViewYear(y);
  };

  const serviceFee = Math.round(property.price * 0.05);
  const subtotal = property.price * months;
  const total = subtotal + serviceFee;

  const formattedDate = selectedDate
    ? `${MONTHS[viewMonth].slice(0, 3)} ${selectedDate}, ${viewYear}`
    : 'Select a date';

  const handleConfirm = () => {
    if (!selectedDate) return;
    setPaymentModalVisible(true);
  };

  const handlePayment = () => {
    if (selectedPaymentMethod === 'card') {
      if (!cardNumber || !cardExpiry || !cardCvv || !cardName) {
        Alert.alert('Error', 'Please fill in all card details');
        return;
      }
      if (cardNumber.length < 16) {
        Alert.alert('Error', 'Please enter a valid card number');
        return;
      }
    }

    setProcessingPayment(true);

    // Simulate payment processing
    setTimeout(() => {
      setProcessingPayment(false);
      setPaymentModalVisible(false);
      navigation.navigate('BookingConfirmation', {
        property,
        booking: {
          date: formattedDate,
          months,
          guests,
          total,
          paymentMethod: selectedPaymentMethod,
        },
      });
    }, 2000);
  };

  const formatCardNumber = (text) => {
    const cleaned = text.replace(/\s/g, '').replace(/\D/g, '');
    const formatted = cleaned.replace(/(.{4})/g, '$1 ').trim();
    return formatted.substring(0, 19);
  };

  const formatExpiry = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Property</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Property summary */}
        <View style={styles.propertyCard}>
          <Image source={{ uri: property.image }} style={styles.propertyImage} />
          <View style={styles.propertyInfo}>
            <Text style={styles.propertyName}>{property.name}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
              <Text style={styles.propertyLocation}>{property.location}</Text>
            </View>
            <Text style={styles.propertyPrice}>${property.price.toLocaleString()}/mo</Text>
          </View>
        </View>

        {/* Calendar */}
        <View style={styles.sectionCard}>
          <View style={styles.calendarHeader}>
            <Text style={styles.sectionTitle}>Move-in date</Text>
            <View style={styles.monthNav}>
              <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navArrow}>
                <Ionicons name="chevron-back" size={18} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.monthLabel}>{MONTHS[viewMonth]} {viewYear}</Text>
              <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navArrow}>
                <Ionicons name="chevron-forward" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.weekRow}>
            {WEEKDAYS.map((w) => (
              <Text key={w} style={styles.weekday}>{w}</Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {calendarCells.map((day, idx) => {
              const disabled = isPast(day);
              const selected = day === selectedDate;
              return (
                <TouchableOpacity
                  key={idx}
                  style={styles.dayCell}
                  disabled={!day || disabled}
                  onPress={() => setSelectedDate(day)}
                  activeOpacity={0.7}
                >
                  {day ? (
                    <View style={[styles.dayInner, selected && styles.daySelected]}>
                      <Text
                        style={[
                          styles.dayText,
                          disabled && styles.dayDisabled,
                          selected && styles.daySelectedText,
                        ]}
                      >
                        {day}
                      </Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Steppers */}
        <View style={styles.sectionCard}>
          <Stepper
            label="Duration (months)"
            value={months}
            min={1}
            onDecrement={() => setMonths((m) => Math.max(1, m - 1))}
            onIncrement={() => setMonths((m) => m + 1)}
          />
          <View style={styles.divider} />
          <Stepper
            label="Guests"
            value={guests}
            min={1}
            onDecrement={() => setGuests((g) => Math.max(1, g - 1))}
            onIncrement={() => setGuests((g) => g + 1)}
          />
        </View>

        {/* Price summary */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Price Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              ${property.price.toLocaleString()} x {months} month{months > 1 ? 's' : ''}
            </Text>
            <Text style={styles.summaryValue}>${subtotal.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service fee</Text>
            <Text style={styles.summaryValue}>${serviceFee.toLocaleString()}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${total.toLocaleString()}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomDate}>{formattedDate}</Text>
          <Text style={styles.bottomTotal}>${total.toLocaleString()}</Text>
        </View>
        <TouchableOpacity
          style={[styles.confirmButton, !selectedDate && styles.confirmDisabled]}
          onPress={handleConfirm}
          disabled={!selectedDate}
          activeOpacity={0.9}
        >
          <Text style={styles.confirmText}>Confirm Booking</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.surface} />
        </TouchableOpacity>
      </View>

      {/* Payment Modal */}
      <Modal
        visible={paymentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Payment</Text>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Payment Methods */}
              <Text style={styles.modalSectionTitle}>Payment Method</Text>
              <View style={styles.paymentMethods}>
                <TouchableOpacity
                  style={[
                    styles.paymentMethod,
                    selectedPaymentMethod === 'card' && styles.paymentMethodActive,
                  ]}
                  onPress={() => setSelectedPaymentMethod('card')}
                >
                  <Ionicons
                    name="card-outline"
                    size={24}
                    color={selectedPaymentMethod === 'card' ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.paymentMethodText,
                      selectedPaymentMethod === 'card' && styles.paymentMethodTextActive,
                    ]}
                  >
                    Credit Card
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.paymentMethod,
                    selectedPaymentMethod === 'paypal' && styles.paymentMethodActive,
                  ]}
                  onPress={() => setSelectedPaymentMethod('paypal')}
                >
                  <Ionicons
                    name="logo-paypal"
                    size={24}
                    color={selectedPaymentMethod === 'paypal' ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.paymentMethodText,
                      selectedPaymentMethod === 'paypal' && styles.paymentMethodTextActive,
                    ]}
                  >
                    PayPal
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Card Details */}
              {selectedPaymentMethod === 'card' && (
                <View style={styles.cardDetails}>
                  <Text style={styles.modalSectionTitle}>Card Details</Text>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Card Number</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                      keyboardType="numeric"
                      maxLength={19}
                    />
                  </View>
                  <View style={styles.row}>
                    <View style={[styles.inputGroup, styles.flex1]}>
                      <Text style={styles.inputLabel}>Expiry Date</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChangeText={(text) => setCardExpiry(formatExpiry(text))}
                        keyboardType="numeric"
                        maxLength={5}
                      />
                    </View>
                    <View style={[styles.inputGroup, styles.flex1]}>
                      <Text style={styles.inputLabel}>CVV</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="123"
                        value={cardCvv}
                        onChangeText={setCardCvv}
                        keyboardType="numeric"
                        maxLength={4}
                        secureTextEntry
                      />
                    </View>
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Cardholder Name</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="John Doe"
                      value={cardName}
                      onChangeText={setCardName}
                    />
                  </View>
                </View>
              )}

              {/* Order Summary */}
              <View style={styles.orderSummary}>
                <Text style={styles.modalSectionTitle}>Order Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Property</Text>
                  <Text style={styles.summaryValue}>{property.name}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Duration</Text>
                  <Text style={styles.summaryValue}>{months} month(s)</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Guests</Text>
                  <Text style={styles.summaryValue}>{guests}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>${total.toLocaleString()}</Text>
                </View>
              </View>
            </ScrollView>

            {/* Pay Button */}
            <TouchableOpacity
              style={styles.payButton}
              onPress={handlePayment}
              disabled={processingPayment}
            >
              {processingPayment ? (
                <Text style={styles.payButtonText}>Processing...</Text>
              ) : (
                <Text style={styles.payButtonText}>Pay ${total.toLocaleString()}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  propertyCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  propertyImage: { width: 80, height: 80, borderRadius: 12, backgroundColor: colors.border },
  propertyInfo: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  propertyName: { fontSize: 16, fontWeight: '700', color: colors.text },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  propertyLocation: { fontSize: 12, color: colors.textSecondary, marginLeft: 4 },
  propertyPrice: { fontSize: 15, fontWeight: '700', color: colors.primary, marginTop: 6 },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 14 },
  calendarHeader: { marginBottom: 12 },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  navArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  weekRow: { flexDirection: 'row', marginBottom: 8 },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  daySelected: { backgroundColor: colors.primary },
  dayText: { fontSize: 14, color: colors.text, fontWeight: '500' },
  dayDisabled: { color: colors.textLight },
  daySelectedText: { color: colors.surface, fontWeight: '700' },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  stepperControls: { flexDirection: 'row', alignItems: 'center' },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBtnDisabled: { backgroundColor: colors.background },
  stepValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    minWidth: 36,
    textAlign: 'center',
  },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 14 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: { fontSize: 14, color: colors.textSecondary },
  summaryValue: { fontSize: 14, color: colors.text, fontWeight: '500' },
  totalLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
  totalValue: { fontSize: 18, fontWeight: '700', color: colors.primary },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bottomDate: { fontSize: 12, color: colors.textSecondary },
  bottomTotal: { fontSize: 22, fontWeight: '700', color: colors.primary },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 15,
    borderRadius: 28,
  },
  confirmDisabled: { opacity: 0.5 },
  confirmText: { color: colors.surface, fontSize: 15, fontWeight: '700', marginRight: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  modalBody: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  paymentMethods: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  paymentMethod: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  paymentMethodActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  paymentMethodTextActive: {
    color: colors.primary,
  },
  cardDetails: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  flex1: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  orderSummary: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  payButton: {
    backgroundColor: colors.primary,
    marginHorizontal: 24,
    marginBottom: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  payButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default BookingScreen;
