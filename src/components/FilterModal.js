import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { propertyTypes } from '../data/mockData';

export const defaultFilters = {
  type: 'All',
  priceRange: null, // [min, max]
  minBeds: 0,
  minBaths: 0,
};

const PRICE_RANGES = [
  { label: 'Any', value: null },
  { label: '< $35k', value: [0, 35000] },
  { label: '$35k - $60k', value: [35000, 60000] },
  { label: '$60k - $80k', value: [60000, 80000] },
  { label: '$80k +', value: [80000, Infinity] },
];

const COUNTS = [0, 1, 2, 3, 4, 5];

const Chip = ({ label, selected, onPress }) => (
  <TouchableOpacity
    style={[styles.chip, selected && styles.chipSelected]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
  </TouchableOpacity>
);

const FilterModal = ({ visible, onClose, onApply, initialFilters }) => {
  const [filters, setFilters] = useState(initialFilters || defaultFilters);

  useEffect(() => {
    if (visible) setFilters(initialFilters || defaultFilters);
  }, [visible]);

  const update = (patch) => setFilters((f) => ({ ...f, ...patch }));

  const priceLabel = (value) =>
    PRICE_RANGES.find(
      (r) =>
        (r.value === null && value === null) ||
        (r.value && value && r.value[0] === value[0] && r.value[1] === value[1])
    )?.label;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Filters</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Type */}
            <Text style={styles.label}>Property Type</Text>
            <View style={styles.chipRow}>
              {propertyTypes.map((t) => (
                <Chip
                  key={t}
                  label={t}
                  selected={filters.type === t}
                  onPress={() => update({ type: t })}
                />
              ))}
            </View>

            {/* Price */}
            <Text style={styles.label}>Price Range</Text>
            <View style={styles.chipRow}>
              {PRICE_RANGES.map((r) => (
                <Chip
                  key={r.label}
                  label={r.label}
                  selected={priceLabel(filters.priceRange) === r.label}
                  onPress={() => update({ priceRange: r.value })}
                />
              ))}
            </View>

            {/* Beds */}
            <Text style={styles.label}>Bedrooms (min)</Text>
            <View style={styles.chipRow}>
              {COUNTS.map((c) => (
                <Chip
                  key={`bed-${c}`}
                  label={c === 0 ? 'Any' : `${c}+`}
                  selected={filters.minBeds === c}
                  onPress={() => update({ minBeds: c })}
                />
              ))}
            </View>

            {/* Baths */}
            <Text style={styles.label}>Bathrooms (min)</Text>
            <View style={styles.chipRow}>
              {COUNTS.map((c) => (
                <Chip
                  key={`bath-${c}`}
                  label={c === 0 ? 'Any' : `${c}+`}
                  selected={filters.minBaths === c}
                  onPress={() => update({ minBaths: c })}
                />
              ))}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => setFilters(defaultFilters)}
            >
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={() => onApply(filters)}
            >
              <Text style={styles.applyText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
    maxHeight: '85%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 10,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 10,
    marginBottom: 10,
  },
  chipSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryLight,
  },
  chipText: { fontSize: 14, color: colors.textSecondary, fontWeight: '600' },
  chipTextSelected: { color: colors.primary, fontWeight: '700' },
  footer: {
    flexDirection: 'row',
    marginTop: 16,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 12,
  },
  resetText: { fontSize: 16, fontWeight: '700', color: colors.text },
  applyBtn: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  applyText: { fontSize: 16, fontWeight: '700', color: colors.surface },
});

export default FilterModal;
