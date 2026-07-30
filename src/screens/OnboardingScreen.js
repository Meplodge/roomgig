import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
  StatusBar,
  Appearance,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, surfaceGradient } from '../constants/colors';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Find Your\nDream Home',
    subtitle: 'Discover verified listings, modern spaces,\nand flexible rentals tailored to your lifestyle\nall in one simple app.',
    subtitleIcon: null,
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
  },
  {
    id: '2',
    title: 'Book Viewings\nInstantly',
    subtitle: 'Schedule tours with just a few taps,\nchoose times that work for you,\nand visit spaces without the hassle.',
    subtitleIcon: null,
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
  },
  {
    id: '3',
    title: 'Smart Search\n& AI Matching',
    subtitle: 'Set your filters and let smart tools\nsurface listings that match your needs,\nbudget, and neighborhood.',
    subtitleIcon: null,
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
  },
  {
    id: '4',
    title: 'Move In\nWith Ease',
    subtitle: 'From application to approval, manage\nevery step in the app and get\nready to call your new place home.',
    subtitleIcon: null,
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
  },
  {
    id: '5',
    title: 'Find Roommates\nTo Share With',
    subtitle: 'Browse like-minded people looking for\nshared spaces, split the rent, and\nturn a house into a home together.',
    subtitleIcon: null,
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800',
  },
];

const OnboardingScreen = ({ navigation }) => {
  const { completeOnboarding } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const insets = useSafeAreaInsets();

  const handleSkip = () => {
    completeOnboarding();
    navigation.navigate('Login');
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      completeOnboarding();
      navigation.navigate('Login');
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const isLastSlide = currentIndex === slides.length - 1;

  const renderProgressBar = () => (
    <View style={[styles.progressContainer, { top: insets.top + 12 }]}>
      {slides.map((_, index) => (
        <View
          key={index}
          style={[
            styles.progressSegment,
            index <= currentIndex && styles.progressSegmentActive,
          ]}
        />
      ))}
    </View>
  );

  const renderSlide = ({ item }) => (
    <View style={styles.slide}>
      {/* Full-width image with gradient overlay */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
        
        {/* Gradient starting from middle */}
        <LinearGradient
          colors={surfaceGradient}
          locations={[0, 0.4, 0.7, 1]}
          style={styles.gradient}
        />
        
        {/* Skip button */}
        {!isLastSlide && (
          <TouchableOpacity style={[styles.skipButton, { top: insets.top + 50 }]} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Bottom content area */}
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{item.title}</Text>
        
        <View style={styles.subtitleRow}>
          {item.subtitleIcon && (
            <Ionicons name={item.subtitleIcon} size={16} color={colors.accent} />
          )}
          <Text style={styles.subtitle}>{item.subtitle}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle={Appearance.getColorScheme() === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Progress bar at top */}
      {renderProgressBar()}
      
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        bounces={false}
      />

      {/* Bottom section with button */}
      <SafeAreaView edges={['bottom']} style={styles.bottomSection}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleNext}
          activeOpacity={0.9}
        >
          <Text style={styles.buttonText}>
            {isLastSlide ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  progressContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    gap: 6,
    zIndex: 20,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  progressSegmentActive: {
    backgroundColor: '#FFFFFF',
  },
  slide: {
    width,
    flex: 1,
  },
  imageContainer: {
    flex: 0.65,
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
  },
  skipButton: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderRadius: 20,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  contentContainer: {
    flex: 0.35,
    paddingHorizontal: 28,
    paddingTop: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 6,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
    flexShrink: 1,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: colors.surface,
  },
  button: {
    backgroundColor: '#2E8B57',
    paddingVertical: 18,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default OnboardingScreen;
