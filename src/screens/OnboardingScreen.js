import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';

const slides = [
  {
    id: 1,
    title: 'Find Your Dream Home',
    subtitle: 'Browse thousands of properties with advanced filters to find exactly what you\'re looking for.',
    icon: 'home',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=900',
  },
  {
    id: 2,
    title: 'Virtual Tours',
    subtitle: 'Experience properties from anywhere with immersive 3D virtual tours and high-quality photos.',
    icon: 'camera',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=900',
  },
  {
    id: 3,
    title: 'Smart Search',
    subtitle: 'Use AI-powered search to discover properties that match your preferences perfectly.',
    icon: 'search',
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=900',
  },
  {
    id: 4,
    title: 'Easy Booking',
    subtitle: 'Schedule viewings and book properties seamlessly with our secure payment system.',
    icon: 'calendar',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=900',
  },
];

const OnboardingScreen = ({ navigation }) => {
  const { completeOnboarding } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  React.useEffect(() => {
    animateIn();
  }, [currentSlide]);

  const animateIn = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = () => {
    completeOnboarding();
    navigation.navigate('Login');
  };

  const handleGetStarted = () => {
    completeOnboarding();
    navigation.navigate('Login');
  };

  const slide = slides[currentSlide];

  return (
    <ImageBackground
      source={{ uri: slide.image }}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.logoRow}>
              <View style={styles.logoBadge}>
                <Ionicons name="home" size={20} color={colors.surface} />
              </View>
              <Text style={styles.logoText}>Estatery</Text>
            </View>
            {currentSlide < slides.length - 1 && (
              <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.slideContent}>
            <Animated.View
              style={[
                styles.iconContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <Ionicons name={slide.icon} size={100} color={colors.surface} />
            </Animated.View>

            <Animated.Text
              style={[
                styles.title,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {slide.title}
            </Animated.Text>

            <Animated.Text
              style={[
                styles.subtitle,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {slide.subtitle}
            </Animated.Text>
          </View>

          <View style={styles.bottomContent}>
            <View style={styles.dots}>
              {slides.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    index === currentSlide && styles.dotActive,
                  ]}
                />
              ))}
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleNext}
              activeOpacity={0.9}
            >
              <Text style={styles.buttonText}>
                {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
              </Text>
              <Ionicons 
                name={currentSlide === slides.length - 1 ? 'arrow-forward' : 'chevron-forward'} 
                size={20} 
                color={colors.primary} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20, 35, 30, 0.45)',
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingVertical: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.surface,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.surface,
  },
  slideContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.surface,
    lineHeight: 40,
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  bottomContent: {
    marginBottom: 12,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 28,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginRight: 8,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.surface,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 18,
    borderRadius: 30,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 8,
  },
});

export default OnboardingScreen;
