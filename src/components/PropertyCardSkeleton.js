import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/colors';

const PropertyCardSkeleton = () => {
  return (
    <View style={styles.container}>
      <View style={styles.imageWrapper}>
        <View style={styles.image} />
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
          style={styles.shimmer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.skeleton, styles.name]} />
          <View style={[styles.skeleton, styles.price]} />
        </View>
        <View style={[styles.skeleton, styles.location]} />
        <View style={styles.specs}>
          <View style={[styles.skeleton, styles.spec]} />
          <View style={[styles.skeleton, styles.spec]} />
          <View style={[styles.skeleton, styles.spec]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  imageWrapper: {
    padding: 8,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    backgroundColor: colors.border,
  },
  shimmer: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    height: 180,
    borderRadius: 16,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: {
    flex: 1,
    height: 20,
    marginRight: 12,
  },
  price: {
    width: 80,
    height: 20,
  },
  location: {
    width: '60%',
    height: 14,
    marginBottom: 12,
  },
  specs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  spec: {
    flex: 1,
    height: 32,
    marginHorizontal: 4,
  },
  skeleton: {
    backgroundColor: colors.border,
    borderRadius: 8,
  },
});

export default PropertyCardSkeleton;
