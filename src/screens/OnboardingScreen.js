import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import * as Location from 'expo-location';

const slides = [
  {
    id: 1,
    title: 'Find Your Dream Home',
    subtitle: 'Browse thousands of properties with advanced filters to find exactly what you\'re looking for.',
    icon: 'home',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=900',
    type: 'tutorial',
  },
  {
    id: 2,
    title: 'Virtual Tours',
    subtitle: 'Experience properties from anywhere with immersive 3D virtual tours and high-quality photos.',
    icon: 'camera',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=900',
    type: 'tutorial',
  },
  {
    id: 3,
    title: 'Smart Search',
    subtitle: 'Use AI-powered search to discover properties that match your preferences perfectly.',
    icon: 'search',
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=900',
    type: 'tutorial',
  },
  {
    id: 4,
    title: 'Easy Booking',
    subtitle: 'Schedule viewings and book properties seamlessly with our secure payment system.',
    icon: 'calendar',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=900',
    type: 'tutorial',
  },
  {
    id: 5,
    title: 'Set Your Preferences',
    subtitle: 'Tell us what you\'re looking for so we can show you the best properties.',
    icon: 'options',
    image: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=900',
    type: 'preferences',
  },
  {
    id: 6,
    title: 'Enable Location',
    subtitle: 'Allow us to show properties near you and provide personalized recommendations.',
    icon: 'location',
    image: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=900',
    type: 'location',
  },
];

const OnboardingScreen = ({ navigation }) => {
  const { completeOnboarding } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [preferences, setPreferences] = useState({
    propertyType: 'Any',
    priceRange: 'Any',
    bedrooms: 'Any',
  });
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [requestingLocation, setRequestingLocation] = useState(false);

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

  const handleRequestLocation = async () => {
    setRequestingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationEnabled(true);
        setTimeout(() => handleNext(), 500);
      } else {
        setLocationEnabled(false);
      }
    } catch (error) {
      console.error('Location permission error:', error);
      setLocationEnabled(false);
    } finally {
      setRequestingLocation(false);
    }
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
            {slide.type === 'tutorial' && (
              <>
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
              </>
            )}

            {slide.type === 'preferences' && (
              <Animated.View
                style={[
                  styles.preferencesContainer,
                  {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
                ]}
              >
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

                <View style={styles.preferenceSection}>
                  <Text style={styles.preferenceLabel}>Property Type</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.preferenceScroll}>
                    {['Any', 'Apartment', 'House', 'Villa', 'Studio'].map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.preferenceChip,
                          preferences.propertyType === type && styles.preferenceChipActive,
                        ]}
                        onPress={() => setPreferences({ ...preferences, propertyType: type })}
                      >
                        <Text style={[
                          styles.preferenceChipText,
                          preferences.propertyType === type && styles.preferenceChipTextActive,
                        ]}>
                          {type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.preferenceSection}>
                  <Text style={styles.preferenceLabel}>Price Range</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.preferenceScroll}>
                    {['Any', '$500-$1k', '$1k-$2k', '$2k-$5k', '$5k+'].map((range) => (
                      <TouchableOpacity
                        key={range}
                        style={[
                          styles.preferenceChip,
                          preferences.priceRange === range && styles.preferenceChipActive,
                        ]}
                        onPress={() => setPreferences({ ...preferences, priceRange: range })}
                      >
                        <Text style={[
                          styles.preferenceChipText,
                          preferences.priceRange === range && styles.preferenceChipTextActive,
                        ]}>
                          {range}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.preferenceSection}>
                  <Text style={styles.preferenceLabel}>Bedrooms</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.preferenceScroll}>
                    {['Any', '1', '2', '3', '4+'].map((bed) => (
                      <TouchableOpacity
                        key={bed}
                        style={[
                          styles.preferenceChip,
                          preferences.bedrooms === bed && styles.preferenceChipActive,
                        ]}
                        onPress={() => setPreferences({ ...preferences, bedrooms: bed })}
                      >
                        <Text style={[
                          styles.preferenceChipText,
                          preferences.bedrooms === bed && styles.preferenceChipTextActive,
                        ]}>
                          {bed}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </Animated.View>
            )}

            {slide.type === 'location' && (
              <Animated.View
                style={[
                  styles.locationContainer,
                  {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
                ]}
              >
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

                <TouchableOpacity
                  style={[
                    styles.locationButton,
                    locationEnabled && styles.locationButtonEnabled,
                  ]}
                  onPress={handleRequestLocation}
                  disabled={requestingLocation || locationEnabled}
                >
                  {requestingLocation ? (
                    <Text style={styles.locationButtonText}>Requesting...</Text>
                  ) : locationEnabled ? (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color={colors.surface} />
                      <Text style={styles.locationButtonText}>Location Enabled</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="location" size={20} color={colors.surface} />
                      <Text style={styles.locationButtonText}>Enable Location</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.skipLocationButton}
                  onPress={handleNext}
                >
                  <Text style={styles.skipLocationText}>Skip for now</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
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
  preferencesContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  preferenceSection: {
    marginTop: 24,
  },
  preferenceLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.surface,
    marginBottom: 12,
  },
  preferenceScroll: {
    flexDirection: 'row',
  },
  preferenceChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  preferenceChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  preferenceChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.surface,
  },
  preferenceChipTextActive: {
    color: colors.surface,
  },
  locationContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 28,
    marginTop: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    gap: 8,
  },
  locationButtonEnabled: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  locationButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.surface,
  },
  skipLocationButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  skipLocationText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
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
