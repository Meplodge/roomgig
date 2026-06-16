import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { colors } from '../constants/colors';

const FilterButton = ({ label, isSelected, onPress }) => {
  const [scaleAnim] = React.useState(new Animated.Value(1));

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.container, isSelected && styles.selected]}
        onPress={handlePress}
        activeOpacity={1}
      >
        <Text style={[styles.label, isSelected && styles.selectedLabel]}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 25,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 10,
  },
  selected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryLight,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  selectedLabel: {
    color: colors.primary,
    fontWeight: '700',
  },
});

export default FilterButton;
