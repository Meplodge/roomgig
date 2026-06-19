import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import PropertyDetailsScreen from '../screens/PropertyDetailsScreen';
import MapScreen from '../screens/MapScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import SavedScreen from '../screens/SavedScreen';
import InsightsScreen from '../screens/InsightsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import BookingScreen from '../screens/BookingScreen';
import BookingConfirmationScreen from '../screens/BookingConfirmationScreen';
import BookingHistoryScreen from '../screens/BookingHistoryScreen';
import AddPropertyScreen from '../screens/AddPropertyScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ChatScreen from '../screens/ChatScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PaymentMethodsScreen from '../screens/PaymentMethodsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import PrivacySecurityScreen from '../screens/PrivacySecurityScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
import TermsOfServiceScreen from '../screens/TermsOfServiceScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ViewAllScreen from '../screens/ViewAllScreen';
import BookWithFriendsScreen from '../screens/BookWithFriendsScreen';
import RoommateFinderScreen from '../screens/RoommateFinderScreen';
import PostRoommateListingScreen from '../screens/PostRoommateListingScreen';
import RoommateDetailsScreen from '../screens/RoommateDetailsScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import ViewAllRoommatesScreen from '../screens/ViewAllRoommatesScreen';
import MyRoommateListingsScreen from '../screens/MyRoommateListingsScreen';
import { useAuth } from '../context/AuthContext';
import { colors } from '../constants/colors';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, loading, onboardingCompleted } = useAuth();

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            {!onboardingCompleted && <Stack.Screen name="Onboarding" component={OnboardingScreen} />}
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="PropertyDetails" component={PropertyDetailsScreen} />
            <Stack.Screen name="MapScreen" component={MapScreen} />
            <Stack.Screen name="Saved" component={SavedScreen} />
            <Stack.Screen name="Insights" component={InsightsScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Booking" component={BookingScreen} />
            <Stack.Screen name="BookingConfirmation" component={BookingConfirmationScreen} />
            <Stack.Screen name="BookingHistory" component={BookingHistoryScreen} />
            <Stack.Screen name="AddProperty" component={AddPropertyScreen} />
            <Stack.Screen name="ChatList" component={ChatListScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="ViewAll" component={ViewAllScreen} />
            <Stack.Screen name="BookWithFriends" component={BookWithFriendsScreen} />
            <Stack.Screen name="RoommateFinder" component={RoommateFinderScreen} />
            <Stack.Screen name="RoommateDetails" component={RoommateDetailsScreen} />
            <Stack.Screen name="PostRoommateListing" component={PostRoommateListingScreen} />
            <Stack.Screen name="UserProfile" component={UserProfileScreen} />
            <Stack.Screen name="ViewAllRoommates" component={ViewAllRoommatesScreen} />
            <Stack.Screen name="MyRoommateListings" component={MyRoommateListingsScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="PrivacySecurity" component={PrivacySecurityScreen} />
            <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
            <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
            <Stack.Screen name="AllProperties" component={HomeScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});

export default AppNavigator;
