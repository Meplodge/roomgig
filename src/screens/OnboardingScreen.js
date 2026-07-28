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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Find Your\nDream Home',
    subtitle: '2500+ Properties available',
    subtitleIcon: 'home',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
  },
  {
    id: '2',
    title: 'Book Viewings\nInstantly',
    subtitle: 'Trusted by 2500+ happy tenants',
    subtitleIcon: 'shield-checkmark',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
  },
  {
    id: '3',
    title: 'Smart Search\n& AI Matching',
    subtitle: 'AI-powered recommendations just for you',
    subtitleIcon: 'sparkles',
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
  },
  {
    id: '4',
    title: 'Move In\nWith Ease',
    subtitle: 'Find and rent properties anytime, anywhere',
    subtitleIcon: 'key',
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
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
          colors={['transparent', 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0.85)', '#FFFFFF']}
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
          <Ionicons name={item.subtitleIcon} size={16} color={colors.accent} />
          <Text style={styles.subtitle}>{item.subtitle}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
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
    backgroundColor: '#FFFFFF',
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
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
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
    color: '#1A1A1A',
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
    color: '#7A7A7A',
    fontWeight: '500',
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
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
