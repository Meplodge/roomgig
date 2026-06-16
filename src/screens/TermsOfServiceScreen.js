import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

const TermsOfServiceScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Terms of Service</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.lastUpdated}>Last updated: June 16, 2026</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.content}>
            By accessing and using the Real Estate App, you accept and agree to be bound by the terms and provisions of this agreement.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. User Accounts</Text>
          <Text style={styles.content}>
            You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Property Listings</Text>
          <Text style={styles.content}>
            Users may list properties for rent or sale. All listings must be accurate and truthful. We reserve the right to remove any listing that violates our policies.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Bookings and Payments</Text>
          <Text style={styles.content}>
            All bookings are subject to availability and confirmation. Payment processing is handled securely through our platform. Cancellation policies vary by property.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Privacy Policy</Text>
          <Text style={styles.content}>
            Your privacy is important to us. Please review our Privacy Policy, which also governs the app and explains how we collect, use, and protect your data.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Prohibited Activities</Text>
          <Text style={styles.content}>
            You may not use the app for any illegal purpose, to solicit others to perform unlawful acts, or to violate any international, federal, provincial, or state regulations.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Limitation of Liability</Text>
          <Text style={styles.content}>
            In no event shall we be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your access to or use of the app.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Contact Information</Text>
          <Text style={styles.content}>
            If you have any questions about these Terms of Service, please contact our support team.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  lastUpdated: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  content: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});

export default TermsOfServiceScreen;
