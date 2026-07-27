# RoomGig App — Technical Diagrams

This document contains high-level diagrams for the RoomGig React Native / Expo real-estate application.

---

## 1. Architecture Overview

```mermaid
graph TB
    subgraph Mobile App
        A[App.js] --> B[AppShell.js]
        B --> C[Providers]
        C --> D[AppNavigator.js]
        D --> E[Screens]
        E --> F[Components]
        E --> G[Services / API]
        G --> H[(Supabase PostgreSQL)]
    end

    subgraph Providers
        C1[ThemeProvider]
        C2[AuthProvider]
        C3[AppDataProvider]
        C4[MessagesProvider]
    end

    C --> C1
    C --> C2
    C --> C3
    C --> C4

    subgraph External Services
        H
        I[Expo Notifications]
        J[Expo Location]
        K[Expo Image Picker]
    end

    B --> I
    E --> J
    E --> K
    G --> H
```

---

## 2. App Bootstrap Flow

```mermaid
sequenceDiagram
    participant U as User
    participant A as App.js
    participant AS as AppShell.js
    participant SP as SplashScreen
    participant AN as AppNavigator

    U->>A: Launch app
    A->>A: Load saved theme (AsyncStorage)
    A->>AS: Lazy-load after theme applied
    AS->>AS: Request notification permissions
    AS->>AS: Setup notification listeners
    AS->>SP: Show splash
    SP->>AS: onFinish()
    AS->>AN: Render navigation
    AN->>AN: Determine auth state
```

---

## 3. Provider Hierarchy

```mermaid
graph TD
    SafeAreaProvider --> ThemeProvider
    ThemeProvider --> AuthProvider
    AuthProvider --> AppDataProvider
    AppDataProvider --> MessagesProvider
    MessagesProvider --> SplashScreen/AppNavigator
```

---

## 4. Navigation Structure

```mermaid
graph LR
    AppNavigator --> AuthStack[Auth Stack]
    AppNavigator --> MainStack[Main Stack]

    AuthStack --> Onboarding
    AuthStack --> Login
    AuthStack --> Signup
    AuthStack --> EmailConfirmation
    AuthStack --> ForgotPassword

    MainStack --> Home
    MainStack --> PropertyDetails
    MainStack --> MapScreen
    MainStack --> Saved
    MainStack --> Insights
    MainStack --> Profile
    MainStack --> Booking
    MainStack --> BookingConfirmation
    MainStack --> BookingHistory
    MainStack --> AddProperty
    MainStack --> ChatList
    MainStack --> Chat
    MainStack --> Notifications
    MainStack --> ViewAll
    MainStack --> BookWithFriends
    MainStack --> RoommateFinder
    MainStack --> RoommateDetails
    MainStack --> PostRoommateListing
    MainStack --> ImageCrop
    MainStack --> UserProfile
    MainStack --> ViewAllRoommates
    MainStack --> MyRoommateListings
    MainStack --> MyPropertyListings
    MainStack --> Settings
    MainStack --> PaymentMethods
    MainStack --> EditProfile
    MainStack --> PrivacySecurity
    MainStack --> HelpSupport
    MainStack --> TermsOfService
    MainStack --> ChangePassword
```

---

## 5. React Context Data Flow

```mermaid
graph LR
    subgraph Context
        AC[AuthContext]
        AD[AppDataContext]
        AM[MessagesContext]
        AT[ThemeContext]
    end

    AC -- user, isAuthenticated --> AD
    AC -- user --> AM
    AT -- theme --> Screens
    AD -- propertiesList, favorites, bookings --> HomeScreen
    AD -- propertiesList --> SavedScreen
    AD -- favorites, toggleFavorite --> PropertyCard
    AM -- conversations, messages --> ChatListScreen
    AM -- messages --> ChatScreen
```

---

## 6. Database Entity Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ DEVICE_BINDINGS : has
    USERS ||--o| USER_PREFERENCES : has
    USERS ||--o{ PROPERTIES : hosts
    USERS ||--o{ ROOMMATE_LISTINGS : posts
    USERS ||--o{ FAVORITES : makes
    USERS ||--o{ BOOKINGS : places
    USERS ||--o{ PAYMENT_METHODS : owns
    USERS ||--o{ CONVERSATIONS : participates
    USERS ||--o{ MESSAGES : sends
    USERS ||--o{ REVIEWS : writes
    USERS ||--o{ NOTIFICATIONS : receives
    USERS ||--o{ SEARCH_HISTORY : has

    PROPERTIES ||--o{ PROPERTY_IMAGES : contains
    PROPERTIES ||--o{ PROPERTY_FACILITIES : has
    PROPERTIES ||--o{ FAVORITES : favorited
    PROPERTIES ||--o{ BOOKINGS : booked
    PROPERTIES ||--o{ CONVERSATIONS : discussed
    PROPERTIES ||--o{ REVIEWS : reviewed
    PROPERTIES ||--o{ NOTIFICATIONS : mentioned

    ROOMMATE_LISTINGS ||--o{ ROOMMATE_IMAGES : contains
    ROOMMATE_LISTINGS ||--o{ FAVORITES : favorited
    ROOMMATE_LISTINGS ||--o{ BOOKINGS : booked
    ROOMMATE_LISTINGS ||--o{ CONVERSATIONS : discussed
    ROOMMATE_LISTINGS ||--o{ REVIEWS : reviewed

    FACILITIES ||--o{ PROPERTY_FACILITIES : linked

    BOOKINGS ||--o{ PAYMENTS : has
    PAYMENT_METHODS ||--o{ PAYMENTS : used

    CONVERSATIONS ||--o{ MESSAGES : contains
```

---

## 7. Property Listing Flow

```mermaid
sequenceDiagram
    participant H as Host
    participant A as AddPropertyScreen
    participant O as imageOptimizer
    participant S as supabaseApi
    participant SB as Supabase
    participant M as MyPropertyListingsScreen

    H->>A: Fill form, pick images
    A->>O: optimizeImage(uri)
    O-->>A: optimized uri
    A->>S: createProperty(data, userId)
    S->>SB: Insert property + images
    SB-->>S: new property
    S-->>A: success
    A->>A: refreshProperties()
    A->>H: Alert success
    A->>M: navigation.goBack()
    M->>S: getUserProperties(userId)
    S->>SB: Query host properties
    SB-->>S: updated list
    S-->>M: render new property
```

---

ALTER TABLE public.roommate_listings
ADD COLUMN IF NOT EXISTS preferences TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS amenities TEXT[] DEFAULT '{}';
```

---

## 9. Messaging Flow

```mermaid
sequenceDiagram
    participant U1 as User A
    participant U2 as User B
    participant C as ChatScreen
    participant M as MessagesContext
    participant S as supabaseApi
    participant SB as Supabase

    U1->>C: Open conversation
    C->>M: load messages
    M->>S: subscribe to messages
    S->>SB: Realtime / query
    SB-->>S: messages
    S-->>M: messages
    M-->>C: render
    U1->>C: Send message
    C->>M: sendMessage(content)
    M->>S: createMessage(...)
    S->>SB: Insert message
    SB-->>S: new message
    S-->>M: broadcast
    M-->>U2: update UI
```

---

## 10. Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant L as LoginScreen
    participant A as AuthContext
    participant SB as Supabase Auth
    participant AN as AppNavigator

    U->>L: Enter credentials
    L->>A: signIn(email, password)
    A->>SB: supabase.auth.signInWithPassword()
    SB-->>A: session / user
    A->>A: set user, isAuthenticated=true
    A-->>AN: re-render
    AN->>AN: Show Main Stack
```

---

## 11. Screen-to-Component Hierarchy

```mermaid
graph TD
    HomeScreen --> SearchBar
    HomeScreen --> PropertyCard
    HomeScreen --> FilterButton
    HomeScreen --> FilterModal
    HomeScreen --> BottomNavBar

    PropertyDetailsScreen --> ImageCarousel
    PropertyDetailsScreen --> PropertyCard

    RoommateFinderScreen --> PropertyCard
    RoommateFinderScreen --> FilterButton
    RoommateFinderScreen --> SearchBar
    RoommateFinderScreen --> BottomNavBar

    ChatListScreen --> ChatItemSkeleton
    ChatListScreen --> EmptyState
    ChatListScreen --> BottomNavBar

    MyPropertyListingsScreen --> PropertyCard
    MyPropertyListingsScreen --> EmptyState

    AddPropertyScreen --> ErrorState
    AddPropertyScreen --> MapView

    ProfileScreen --> ProfileCompletionModal
```

---

## 12. Directory Structure

```
roomgig/
├── App.js                     # Entry point, theme hydration
├── index.js                   # Expo entry
├── app.json / eas.json        # Expo config
├── package.json
├── database/
│   ├── schema.sql             # Full PostgreSQL schema
│   └── seed_data.sql
├── supabase/
│   └── migrations/              # Supabase migrations
├── scripts/
│   ├── add-property.js
│   ├── add-user.js
│   └── run-seed.js
├── assets/
│   └── images & icons
└── src/
    ├── AppShell.js            # Providers + splash + navigator
    ├── navigation/
    │   └── AppNavigator.js    # React Navigation stack
    ├── context/
    │   ├── AuthContext.js
    │   ├── AppDataContext.js
    │   ├── MessagesContext.js
    │   └── ThemeContext.js
    ├── screens/               # 37 screens
    ├── components/            # Shared UI components
    ├── services/
    │   ├── supabaseApi.js     # API wrappers
    │   └── notificationService.js
    ├── utils/
    │   ├── supabase.js        # Supabase client
    │   ├── imageOptimizer.js
    │   ├── imagePreloader.js
    │   └── filterProperties.js
    ├── constants/
    │   └── colors.js
    └── data/
        └── mockData.js
```

---

## 13. Data Sync Pattern

```mermaid
graph LR
    Screen --> Context
    Context --> API[supabaseApi.js]
    API --> Supabase
    Supabase --> API
    API --> Context
    Context --> Screen
    Supabase -. Realtime .-> Context
```

---

## 14. State Management Summary

| Layer | Responsibility |
|-------|--------------|
| `AuthContext` | Authentication state, user, onboarding status |
| `AppDataContext` | Properties, favorites, bookings global cache |
| `MessagesContext` | Conversations and messages |
| `ThemeContext` | Light / dark / system theme |
| Screen state | Form inputs, modals, local UI state |

