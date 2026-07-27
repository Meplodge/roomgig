# RoomGig — Full Project Generation Prompt

Use this prompt to generate the RoomGig React Native / Expo real-estate application, including the database, backend Supabase migrations, frontend architecture, screens, and components.

---

## 1. Project Overview

Build a cross-platform mobile app called **RoomGig** — a real-estate and roommate-finder marketplace. Users can list properties for rent/sale, search listings on a map or feed, save favorites, book viewings, chat with hosts/roommates, manage profiles, and receive push notifications.

Target stack:
- **Frontend:** React Native (0.81.5) with Expo SDK 54
- **Navigation:** React Navigation v7 (Stack + custom Bottom Nav)
- **State:** React Context (Auth, AppData, Messages, Theme)
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Storage:** AsyncStorage for local cache, Supabase Storage for images
- **Location/Maps:** `react-native-maps` + Expo Location
- **Notifications:** Expo Notifications

---

## 2. Database Requirements (PostgreSQL / Supabase)

Create a full schema with the following tables, enums, views, triggers, and indexes:

### Enums
- `user_role`: user, admin, host, agent
- `property_type`: rent, sale, buy
- `property_category`: apartment, villa, house, duplex, studio, condo, townhouse
- `listing_status`: active, pending, sold, rented, inactive, deleted
- `booking_status`: pending, confirmed, cancelled, completed, expired
- `payment_status`: pending, completed, failed, refunded
- `message_status`: sent, delivered, read
- `notification_type`: booking, message, review, system, promotion
- `gender_preference`, `smoking_preference`, `pet_preference`

### Tables
1. **users** — id, email, password_hash, full_name, avatar_url, phone, role, is_verified, is_active, timestamps, deleted_at.
2. **device_bindings** — links devices to users for security.
3. **user_preferences** — notifications, dark mode, location, language, currency.
4. **properties** — host_id, title, description, type, category, status, address/city/state/country/zip, latitude/longitude, price, bedrooms, bathrooms, square_feet, year_built, host info, rating_avg, review_count, timestamps.
5. **property_images** — property_id, image_url, alt_text, is_primary, display_order.
6. **facilities** — amenity master list.
7. **property_facilities** — many-to-many.
8. **roommate_listings** — user_id, title, description, location, gender/smoking/pet preferences, age/budget range, move_in_date, lease_duration, is_active, timestamps.
9. **roommate_images** — listing_id, image_url, is_primary, display_order.
10. **favorites** — user_id + property_id or roommate_listing_id (mutually exclusive).
11. **bookings** — reference, user_id, property_id or roommate_listing_id, check_in/out, guests, total_amount, status, timestamps.
12. **payment_methods** — user_id, type, provider, last_four, expiry, is_default, is_active.
13. **payments** — booking_id, user_id, payment_method_id, amount, currency, status, transaction metadata.
14. **conversations** — user_id, other_user_id, property_id/roommate_listing_id, last_message, last_message_at, unread_count.
15. **messages** — conversation_id, sender_id, content, status, is_read, read_at.
16. **reviews** — user_id, property_id/roommate_listing_id/booking_id, rating, title, content, visibility flags.
17. **notifications** — user_id, type, title, message, data JSONB, read state, related entity IDs.
18. **search_history** — user_id, query, filters JSONB, results_count.

### Views & Functions
- `property_listings_view` — joins properties, primary image, and host info.
- `user_favorites_view` — favorites with joined property details.
- `conversations_view` — conversations with user avatars and property info.
- Function `update_updated_at_column()` trigger on major tables.
- Function `update_property_rating()` to recalculate rating when reviews change.
- Function `generate_booking_reference()` for unique booking refs.
- Function `search_properties(...)` with filters.
- Indexes on foreign keys, status, price, city, location (lat/lng), timestamps.

### Storage Buckets
- `property-images`
- `roommate-images`
- `avatars`

### Auth
- Use Supabase Auth (email/password) with email confirmation.
- Auto-create profile on `auth.users` insert via trigger.

---

## 3. Project Structure

```
roomgig/
├── App.js                         # Theme hydration + lazy AppShell import
├── index.js                       # Expo entry
├── app.json / eas.json            # Expo + EAS config
├── package.json                   # Dependencies listed below
├── database/
│   ├── schema.sql
│   └── seed_data.sql
├── supabase/
│   ├── migrations/001_initial_schema.sql
│   ├── migrations/002_storage_buckets.sql
│   └── migrations/003_auto_create_profile_trigger.sql
├── scripts/
│   ├── add-property.js
│   ├── add-user.js
│   └── run-seed.js
├── assets/
│   ├── adaptive-icon.png
│   ├── favicon.png
│   ├── google.png
│   ├── icon.png
│   └── splash.png
└── src/
    ├── AppShell.js                # Providers, splash, notification setup
    ├── navigation/
    │   └── AppNavigator.js        # Stack navigator, auth gating
    ├── context/
    │   ├── AuthContext.js
    │   ├── AppDataContext.js
    │   ├── MessagesContext.js
    │   └── ThemeContext.js
    ├── screens/
    │   ├── HomeScreen.js
    │   ├── PropertyDetailsScreen.js
    │   ├── MapScreen.js
    │   ├── SavedScreen.js
    │   ├── InsightsScreen.js
    │   ├── ProfileScreen.js
    │   ├── LoginScreen.js
    │   ├── SignupScreen.js
    │   ├── EmailConfirmationScreen.js
    │   ├── ForgotPasswordScreen.js
    │   ├── BookingScreen.js
    │   ├── BookingConfirmationScreen.js
    │   ├── BookingHistoryScreen.js
    │   ├── AddPropertyScreen.js
    │   ├── MyPropertyListingsScreen.js
    │   ├── RoommateFinderScreen.js
    │   ├── PostRoommateListingScreen.js
    │   ├── MyRoommateListingsScreen.js
    │   ├── RoommateDetailsScreen.js
    │   ├── ViewAllScreen.js
    │   ├── ViewAllRoommatesScreen.js
    │   ├── ChatListScreen.js
    │   ├── ChatScreen.js
    │   ├── NotificationsScreen.js
    │   ├── SettingsScreen.js
    │   ├── PaymentMethodsScreen.js
    │   ├── EditProfileScreen.js
    │   ├── ChangePasswordScreen.js
    │   ├── PrivacySecurityScreen.js
    │   ├── HelpSupportScreen.js
    │   ├── TermsOfServiceScreen.js
    │   ├── UserProfileScreen.js
    │   ├── ImageCropScreen.js
    │   ├── BookWithFriendsScreen.js
    │   ├── OnboardingScreen.js
    │   ├── SplashScreen.js
    │   └── ProfileUpdatePrompt.js
    ├── components/
    │   ├── BottomNavBar.js
    │   ├── SearchBar.js
    │   ├── FilterButton.js
    │   ├── FilterModal.js
    │   ├── PropertyCard.js
    │   ├── PropertyCardSkeleton.js
    │   ├── ChatItemSkeleton.js
    │   ├── EmptyState.js
    │   ├── ErrorState.js
    │   ├── ImageCarousel.js
    │   └── ProfileCompletionModal.js
    ├── services/
    │   ├── supabaseApi.js
    │   └── notificationService.js
    ├── utils/
    │   ├── supabase.js
    │   ├── imageOptimizer.js
    │   ├── imagePreloader.js
    │   └── filterProperties.js
    ├── constants/
    │   └── colors.js
    └── data/
        └── mockData.js
```

---

## 4. Dependencies

```json
{
  "dependencies": {
    "@react-native-async-storage/async-storage": "2.2.0",
    "@react-native-community/datetimepicker": "^8.2.0",
    "@react-navigation/bottom-tabs": "^7.18.2",
    "@react-navigation/native": "^7.3.3",
    "@react-navigation/stack": "^7.10.5",
    "@supabase/supabase-js": "^2.108.2",
    "expo": "~54.0.34",
    "expo-contacts": "~15.0.5",
    "expo-dev-client": "~6.0.21",
    "expo-device": "^56.0.4",
    "expo-file-system": "~19.0.23",
    "expo-image-manipulator": "~14.0.8",
    "expo-image-picker": "~17.0.11",
    "expo-linear-gradient": "~15.0.8",
    "expo-local-authentication": "~17.0.8",
    "expo-location": "~19.0.8",
    "expo-notifications": "^56.0.18",
    "expo-ondevice-ai": "^0.1.3",
    "expo-sms": "~13.0.0",
    "expo-status-bar": "~3.0.9",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "react-native": "0.81.5",
    "react-native-gesture-handler": "~2.28.0",
    "react-native-maps": "^1.20.1",
    "react-native-safe-area-context": "~5.6.0",
    "react-native-screens": "~4.16.0",
    "react-native-svg": "^15.15.5",
    "react-native-vector-icons": "^10.3.0",
    "react-native-web": "^0.21.0"
  }
}
```

---

## 5. Architecture Rules

1. **Theme-first hydration:** `App.js` reads `@realestate_theme_mode` from AsyncStorage and calls `Appearance.setColorScheme()` BEFORE lazy-loading `AppShell`, so screens do not flash the wrong theme.
2. **Provider nesting:** `SafeAreaProvider > ThemeProvider > AuthProvider > AppDataProvider > MessagesProvider`.
3. **Auth gate:** `AppNavigator` renders an auth stack (Onboarding, Login, Signup, EmailConfirmation, ForgotPassword) when `!isAuthenticated`, otherwise the main stack.
4. **Global data cache:** `AppDataContext` holds `propertiesList`, `favorites`, `bookings`, and refetches on `user` change.
5. **API layer:** `src/services/supabaseApi.js` wraps all Supabase calls and transforms nested data into flat screen-friendly objects (e.g., `name`, `beds`, `baths`, `sqft`, `images`, `facilities`, `rating`, `reviews`).
6. **Image optimization:** `imageOptimizer.js` resizes/compresses picked images before upload via `expo-image-manipulator`.
7. **Realtime messaging:** `MessagesContext` subscribes to `messages` table updates for active conversations.
8. **Push notifications:** `notificationService.js` requests permissions, stores push tokens, and sets up response listeners.

---

## 6. Screens Specification

| Screen | Purpose |
|--------|---------|
| `SplashScreen` | Branded launch, decides when to hide via `onFinish` prop |
| `OnboardingScreen` | First-time welcome carousel |
| `LoginScreen` / `SignupScreen` | Supabase email/password auth |
| `EmailConfirmationScreen` | Prompt user to confirm email |
| `ForgotPasswordScreen` | Password reset flow |
| `HomeScreen` | Main feed with search, filters, categories, featured listings |
| `PropertyDetailsScreen` | Full property view with images, host, map, book/save |
| `MapScreen` | Map pins of properties / roommate listings |
| `SavedScreen` | User's favorited properties/roommates |
| `InsightsScreen` | Host analytics / booking stats |
| `ProfileScreen` | Current user profile, settings shortcuts |
| `UserProfileScreen` | Other user profile view |
| `AddPropertyScreen` | Multi-step-ish form to create/edit a property with images + map pin + facilities |
| `MyPropertyListingsScreen` | List of properties owned by host, with edit/delete |
| `RoommateFinderScreen` | Feed of people looking for roommates |
| `PostRoommateListingScreen` | Create/edit roommate listing |
| `MyRoommateListingsScreen` | Manage own roommate listings |
| `RoommateDetailsScreen` | Detailed roommate profile |
| `ViewAllScreen` / `ViewAllRoommatesScreen` | See more of a selected category |
| `BookingScreen` | Booking form with date/guest selection |
| `BookingConfirmationScreen` | Success after booking |
| `BookingHistoryScreen` | Past/current bookings |
| `BookWithFriendsScreen` | Split/share booking flow |
| `ChatListScreen` | Conversations list |
| `ChatScreen` | Messages in a conversation |
| `NotificationsScreen` | In-app notifications |
| `PaymentMethodsScreen` | Saved cards / payment methods |
| `SettingsScreen` | App preferences |
| `EditProfileScreen` | Update profile/avatar |
| `ChangePasswordScreen` | Update password |
| `PrivacySecurityScreen` | Privacy toggles, delete account |
| `HelpSupportScreen` / `TermsOfServiceScreen` | Static/legal screens |
| `ImageCropScreen` | Optional crop for uploaded images |
| `ProfileUpdatePrompt` | Modal overlay when profile is incomplete |

---

## 7. Shared Components Specification

| Component | Role |
|-------------|------|
| `BottomNavBar` | Custom floating bottom bar with 5 tabs: Home, Explore/Map, Roommate, Messages, Profile |
| `SearchBar` | Text input + filter action button |
| `FilterButton` / `FilterModal` | Category/type/budget/beds/baths filters |
| `PropertyCard` | Card for property and roommate listings |
| `PropertyCardSkeleton` / `ChatItemSkeleton` | Loading placeholders |
| `EmptyState` / `ErrorState` | Empty and error UI with optional action |
| `ImageCarousel` | Swipeable property image gallery |
| `ProfileCompletionModal` | Encourages user to finish profile |

---

## 8. Key API Functions (`supabaseApi.js`)

Generate these exported functions:
- `testConnection()`
- `getProperties(filters)`
- `getPropertyById(id)`
- `getUserProperties(userId)`
- `createProperty(data, userId)`
- `updateProperty(id, data, userId)`
- `deleteProperty(id)`
- `getRoommateListings(filters)`
- `getRoommateListingById(id)`
- `createRoommateListing(data, userId)`
- `updateRoommateListing(id, data, userId)`
- `deleteRoommateListing(id)`
- `getFavorites(userId)`
- `toggleFavorite(userId, propertyId, roommateId)`
- `getBookings(userId)`
- `createBooking(bookingData)`
- `updateBookingStatus(id, status)`
- `getConversations(userId)`
- `getMessages(conversationId)`
- `createMessage(message)`
- `markMessagesRead(conversationId, userId)`
- `getNotifications(userId)`
- `markNotificationRead(id)`
- `getUserProfile(userId)`
- `updateUserProfile(userId, data)`
- `uploadImage(file, bucket, path)`

---

## 9. Visual Design Tokens

Create `src/constants/colors.js` with a clean real-estate palette:
- **Primary:** `#1F4D3F` (deep teal)
- **Accent:** `#E07856` (coral)
- **Surface / background / text / error** variants for light and dark mode
- Avoid colored glow/shadows on buttons; use flat solid colors (recent design change).
- Use `borderRadius` 12-28, `gap` based layouts, Ionicons for icons.

---

## 10. Required Config Files

- `app.json` — Expo name, slug, version, splash, icon, adaptive-icon, orientation, scheme, permissions (camera, location, notifications, contacts).
- `eas.json` — Development, preview, and production EAS build profiles.
- `metro.config.js` — Standard Expo / Supabase CJS compatibility if needed.
- `tsconfig.json` — TypeScript base config for React Native.
- `.env` — Supabase URL and anon key.

---

## 11. Development Commands

```bash
npm install
npx expo start                 # Start Expo development server
npm run android                # or expo run:android
npm run ios                    # or expo run:ios
npm run web                    # or expo start --web
npm run build:dev              # EAS development build
npm run build:preview          # EAS preview build
npm run build:prod             # EAS production build
```

---

## 12. Success Criteria

- User can sign up, confirm email, and log in.
- Authenticated user can browse properties on home and map.
- User can favorite, book, and chat with hosts.
- Host can add/edit/delete property listings with images.
- Newly added property appears in the host's `MyPropertyListingsScreen` after upload.
- Roommate listings can be created and browsed independently.
- Push notifications fire for bookings and messages.
- Dark mode works across all screens.
- All DB relations, views, and triggers match the schema.
