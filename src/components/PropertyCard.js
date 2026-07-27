import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Swipeable } from 'react-native-gesture-handler';
import { colors } from '../constants/colors';
import { useAppData } from '../context/AppDataContext';
import ImageCarousel from './ImageCarousel';
import PropertyCardSkeleton from './PropertyCardSkeleton';

const PropertyCard = ({ property, onPress, style }) => {
  const { isFavorite, toggleFavorite } = useAppData();
  const favorite = isFavorite(property.id);
  const images = (property.images || [property.image]).filter(Boolean);
  const [scaleAnim] = useState(new Animated.Value(1));
  const [heartScale] = useState(new Animated.Value(1));
  const [imageLoaded, setImageLoaded] = useState(images.length === 0);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.97,
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

  const handleFavorite = () => {
    Animated.sequence([
      Animated.timing(heartScale, {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(heartScale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    toggleFavorite(property.id);
  };

  const renderRightActions = () => {
    return (
      <View style={styles.swipeActionContainer}>
        <TouchableOpacity
          style={[styles.swipeAction, styles.favoriteAction]}
          onPress={handleFavorite}
        >
          <Ionicons
            name={favorite ? 'heart' : 'heart-outline'}
            size={24}
            color={colors.surface}
          />
        </TouchableOpacity>
      </View>
    );
  };

  const renderLeftActions = () => {
    return (
      <View style={styles.swipeActionContainerLeft}>
        <TouchableOpacity
          style={[styles.swipeAction, styles.shareAction]}
          onPress={() => console.log('Share', property.id)}
        >
          <Ionicons name="share-social" size={24} color={colors.surface} />
        </TouchableOpacity>
      </View>
    );
  };

  const handleImageLoad = () => {
    console.log('PropertyCard image loaded:', property.id, images);
    setImageLoaded(true);
  };

  const handleImageError = (error) => {
    console.log('PropertyCard image error:', property.id, images, error?.nativeEvent?.error);
    setImageLoaded(true);
  };

  return (
    <View style={styles.cardWrapper}>
      <Animated.View
        style={[{ transform: [{ scale: scaleAnim }] }, style, { opacity: imageLoaded ? 1 : 0 }]}
        pointerEvents={imageLoaded ? 'auto' : 'none'}
      >
      <Swipeable
        renderRightActions={renderRightActions}
        renderLeftActions={renderLeftActions}
        friction={2}
        rightThreshold={40}
        leftThreshold={40}
      >
        <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={1}>
          <View style={styles.imageWrapper}>
            <ImageCarousel
              images={images}
              height={180}
              onImageLoad={handleImageLoad}
              onImageError={handleImageError}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.3)']}
              style={styles.imageGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{property.type}</Text>
            </View>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color={colors.star} />
              <Text style={styles.ratingBadgeText}>{property.rating}</Text>
            </View>
            <TouchableOpacity
              style={styles.favoriteBadge}
              onPress={handleFavorite}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                <Ionicons
                  name={favorite ? 'heart' : 'heart-outline'}
                  size={18}
                  color={favorite ? colors.accent : colors.text}
                />
              </Animated.View>
            </TouchableOpacity>
          </View>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.name}>{property.name || property.title}</Text>
              <Text style={styles.price}>${property.price ? property.price.toLocaleString() : '0'}</Text>
            </View>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.location}>{property.location || property.city}</Text>
            </View>
            <View style={styles.specs}>
              <View style={styles.spec}>
                <Ionicons name="bed-outline" size={15} color={colors.textSecondary} />
                <Text style={styles.specText}>{property.beds || property.bedrooms || 0} Beds</Text>
              </View>
              <View style={styles.spec}>
                <Ionicons name="water-outline" size={15} color={colors.textSecondary} />
                <Text style={styles.specText}>{property.baths || property.bathrooms || 0} Baths</Text>
              </View>
              <View style={styles.spec}>
                <Ionicons name="expand-outline" size={15} color={colors.textSecondary} />
                <Text style={styles.specText}>{(property.sqft || property.square_feet || 0).toLocaleString()} Sqft</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Swipeable>
    </Animated.View>
    {!imageLoaded && (
      <View style={styles.skeletonOverlay}>
        <PropertyCardSkeleton />
      </View>
    )}
  </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    position: 'relative',
  },
  skeletonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
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
    resizeMode: 'cover',
  },
  imageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  typeBadge: {
    position: 'absolute',
    top: 18,
    left: 18,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  typeText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  ratingBadge: {
    position: 'absolute',
    top: 18,
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 3,
  },
  favoriteBadge: {
    position: 'absolute',
    bottom: 18,
    right: 18,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 20,
    padding: 8,
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
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    numberOfLines: 1,
    ellipsizeMode: 'tail',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  location: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  specs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  spec: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  specText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    marginLeft: 5,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  swipeActionContainer: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 20,
  },
  swipeActionContainerLeft: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 20,
  },
  swipeAction: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteAction: {
    backgroundColor: colors.accent,
  },
  shareAction: {
    backgroundColor: colors.primary,
  },
});

export default PropertyCard;
