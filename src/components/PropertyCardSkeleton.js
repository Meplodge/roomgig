import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/colors';

const PropertyCardSkeleton = () => {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 850, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 850, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <View style={styles.container}>
      <View style={styles.imageWrapper}>
        <Animated.View style={[styles.image, { opacity }]} />
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
          style={styles.shimmer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Animated.View style={[styles.skeleton, styles.name, { opacity }]} />
          <Animated.View style={[styles.skeleton, styles.price, { opacity }]} />
        </View>
        <Animated.View style={[styles.skeleton, styles.location, { opacity }]} />
        <View style={styles.specs}>
          <Animated.View style={[styles.skeleton, styles.spec, { opacity }]} />
          <Animated.View style={[styles.skeleton, styles.spec, { opacity }]} />
          <Animated.View style={[styles.skeleton, styles.spec, { opacity }]} />
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
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
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
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
  },
});

export default PropertyCardSkeleton;
