import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/colors';

const UserProfileScreen = ({ route, navigation }) => {
  const { user } = route.params || {};

  const mockBio = "I'm a friendly and respectful professional looking for a like-minded roommate. I value cleanliness, open communication, and creating a positive living environment. In my free time, I enjoy hiking, cooking, and exploring the city.";

  const mockInterests = ['Hiking', 'Cooking', 'Music', 'Travel', 'Photography', 'Reading'];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        {/* Header with background image */}
        <View style={styles.header}>
          <Image source={{ uri: user?.avatar }} style={styles.headerBackground} />
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)']}
            style={styles.headerGradient}
          />
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={colors.surface} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.messageButton}>
            <Ionicons name="chatbubble-outline" size={24} color={colors.surface} />
          </TouchableOpacity>
        </View>

        {/* Profile Content */}
        <View style={styles.content}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <Image source={{ uri: user?.avatar }} style={styles.avatar} />
            <View style={styles.onlineIndicator} />
          </View>

          {/* Name and Details */}
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.occupation}>{user?.occupation}</Text>
          <Text style={styles.age}>{user?.age} years old</Text>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>4.8</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>2</Text>
              <Text style={styles.statLabel}>Years</Text>
            </View>
          </View>

          {/* Bio */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bio}>{mockBio}</Text>
          </View>

          {/* Interests */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interests</Text>
            <View style={styles.interestsContainer}>
              {mockInterests.map((interest, index) => (
                <View key={index} style={styles.interestChip}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Verification */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Verification</Text>
            <View style={styles.verificationItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              <Text style={styles.verificationText}>Email Verified</Text>
            </View>
            <View style={styles.verificationItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              <Text style={styles.verificationText}>Phone Verified</Text>
            </View>
            <View style={styles.verificationItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              <Text style={styles.verificationText}>Identity Verified</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={styles.contactButton}
          onPress={() => navigation.navigate('Chat', { userId: user?.id })}
        >
          <Ionicons name="chatbubble-outline" size={20} color={colors.surface} />
          <Text style={styles.contactButtonText}>Send Message</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  header: {
    position: 'relative',
    height: 180,
  },
  headerBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  headerGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 20,
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageButton: {
    position: 'absolute',
    top: 16,
    right: 20,
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  avatarContainer: {
    position: 'relative',
    alignSelf: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: colors.surface,
    backgroundColor: colors.border,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.success,
    borderWidth: 3,
    borderColor: colors.surface,
  },
  name: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  occupation: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  age: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 18,
    marginBottom: 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  bio: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  interestChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  interestText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  verificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  verificationText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 28,
    gap: 8,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.surface,
  },
});

export default UserProfileScreen;
