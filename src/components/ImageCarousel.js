import React, { useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ImageCarousel = ({ images, height = 200, onImagePress, onImageLoad, onImageError }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [wrapperWidth, setWrapperWidth] = useState(SCREEN_WIDTH);
  const scrollViewRef = useRef(null);

  const handleScroll = (event) => {
    const contentOffset = event.nativeEvent.contentOffset;
    const index = Math.round(contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(index);
  };

  const handlePrev = () => {
    if (activeIndex > 0) {
      scrollViewRef.current?.scrollTo({ x: (activeIndex - 1) * SCREEN_WIDTH, animated: true });
    }
  };

  const handleNext = () => {
    if (activeIndex < images.length - 1) {
      scrollViewRef.current?.scrollTo({ x: (activeIndex + 1) * SCREEN_WIDTH, animated: true });
    }
  };

  if (!images || images.length === 0) {
    return (
      <View style={[styles.container, { height }]} />
    );
  }

  if (images.length === 1) {
    return (
      <TouchableOpacity
        style={[styles.container, { height }]}
        activeOpacity={1}
        onPress={() => onImagePress && onImagePress(0)}
      >
        <View style={[styles.imageWrapper, { height }]} onLayout={(e) => setWrapperWidth(e.nativeEvent.layout.width)}>
          <Image source={{ uri: images[0] }} style={[styles.image, { width: wrapperWidth, height }]} resizeMode="cover" resizeMethod="resize" onLoad={() => { console.log('ImageCarousel single image loaded:', images[0]); onImageLoad && onImageLoad(); }} onError={(e) => { console.log('ImageCarousel single image error:', images[0], e?.nativeEvent?.error); onImageError && onImageError(e); }} />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {images.map((image, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.imageWrapper, { width: SCREEN_WIDTH, height }]}
            activeOpacity={1}
            onPress={() => onImagePress && onImagePress(index)}
            onLayout={(e) => setWrapperWidth(e.nativeEvent.layout.width)}
          >
            <Image source={{ uri: image }} style={[styles.image, { width: wrapperWidth, height }]} resizeMode="cover" resizeMethod="resize" onLoad={index === 0 ? () => { console.log('ImageCarousel first image loaded:', image); onImageLoad && onImageLoad(); } : undefined} onError={index === 0 ? (e) => { console.log('ImageCarousel first image error:', image, e?.nativeEvent?.error); onImageError && onImageError(e); } : undefined} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Navigation Arrows */}
      {activeIndex > 0 && (
        <TouchableOpacity style={[styles.navButton, styles.navButtonLeft]} onPress={handlePrev}>
          <Ionicons name="chevron-back" size={24} color={colors.surface} />
        </TouchableOpacity>
      )}
      {activeIndex < images.length - 1 && (
        <TouchableOpacity style={[styles.navButton, styles.navButtonRight]} onPress={handleNext}>
          <Ionicons name="chevron-forward" size={24} color={colors.surface} />
        </TouchableOpacity>
      )}

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {images.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === activeIndex && styles.dotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  imageWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    borderRadius: 16,
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  navButtonLeft: {
    left: 12,
  },
  navButtonRight: {
    right: 12,
  },
  pagination: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    alignSelf: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  dotActive: {
    width: 20,
    backgroundColor: colors.surface,
  },
});

export default ImageCarousel;
