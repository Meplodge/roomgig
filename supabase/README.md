# Real Estate App - Supabase Setup Guide

This directory contains the Supabase database schema, migrations, and seed data for the Real Estate application.

## 📋 Table of Contents

- [Overview](#overview)
- [Supabase Features](#supabase-features)
- [Setup Instructions](#setup-instructions)
- [Migration Management](#migration-management)
- [Row Level Security (RLS)](#row-level-security-rls)
- [Authentication Integration](#authentication-integration)
- [Real-time Subscriptions](#real-time-subscriptions)
- [Storage Configuration](#storage-configuration)
- [Development Workflow](#development-workflow)
- [Common Queries](#common-queries)

## 🎯 Overview

This Supabase implementation provides:

- **Built-in Authentication**: Using Supabase Auth for user management
- **Row Level Security**: Fine-grained access control policies
- **Real-time Subscriptions**: Live updates for messaging and notifications
- **File Storage**: Property images and user avatars
- **Edge Functions**: Server-side logic when needed
- **Auto-generated APIs**: REST and GraphQL APIs out of the box

## ✨ Supabase Features

### Authentication
- Email/password authentication
- Social login providers (Google, GitHub, etc.)
- Phone authentication
- Magic link authentication
- User sessions and JWT tokens

### Database
- PostgreSQL 15+
- Full-text search
- Geospatial queries
- JSON/JSONB support
- Automatic backups

### Real-time
- PostgreSQL replication
- WebSocket connections
- Change data capture
- Presence tracking

### Storage
- File uploads/downloads
- Image transformations
- CDN integration
- Bucket policies

## 🚀 Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Enter project details:
   - Name: `realestate-app`
   - Database Password: (generate a strong password)
   - Region: Choose closest to your users
4. Wait for project to be created (~2 minutes)

### 2. Install Supabase CLI

```bash
npm install -g supabase
```

### 3. Link to Your Project

```bash
# From your project root
supabase link --project-ref YOUR_PROJECT_REF
```

Your project ref can be found in Supabase dashboard: Settings → API

### 4. Run Migrations

```bash
# Push the initial schema
supabase db push

# Or apply migrations manually
supabase migration up
```

### 5. Load Seed Data

```bash
# Run seed data
supabase db reset
```

This will apply all migrations and run the seed data.

### 6. Configure Environment Variables

Create a `.env.local` file in your project root:

```env
EXPO_PUBLIC_SUPABASE_URL=your-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Get these values from Supabase dashboard: Settings → API

## 📝 Migration Management

### Creating New Migrations

```bash
# Create a new migration
supabase migration new add_new_feature

# Edit the generated migration file
# supabase/migrations/TIMESTAMP_add_new_feature.sql

# Apply the migration
supabase db push
```

### Migration File Structure

```
supabase/migrations/
├── 001_initial_schema.sql
├── 002_add_property_virtual_tours.sql
├── 003_add_user_verification.sql
└── ...
```

### Viewing Migration Status

```bash
# List migrations
supabase migration list

# View migration history
supabase db diff
```

### Rolling Back

```bash
# Reset database (careful!)
supabase db reset

# Or manually revert specific migration
supabase migration down
```

## 🔒 Row Level Security (RLS)

### Overview

All tables have RLS enabled with policies that:

1. **Public Read**: Active properties, facilities, visible reviews
2. **User Data**: Users can only access their own data
3. **Host Data**: Hosts can manage their properties and bookings
4. **Conversations**: Participants can access their conversations

### Key Policies

#### Properties
```sql
-- Anyone can view active properties
CREATE POLICY "Anyone can view active properties" ON public.properties
    FOR SELECT USING (status = 'active' AND deleted_at IS NULL);

-- Hosts can manage their own properties
CREATE POLICY "Hosts can insert properties" ON public.properties
    FOR INSERT WITH CHECK (auth.uid() = host_id);
```

#### Profiles
```sql
-- Users can view all profiles
CREATE POLICY "Users can view all profiles" ON public.profiles
    FOR SELECT USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);
```

#### Messages
```sql
-- Users can only see messages in their conversations
CREATE POLICY "Users can view messages in their conversations" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id 
            AND (user_id = auth.uid() OR other_user_id = auth.uid())
        )
    );
```

### Testing RLS Policies

```sql
-- Test as a specific user
SET LOCAL request.jwt.claim.sub = 'user-uuid';

SELECT * FROM public.properties; -- Should only return active properties
SELECT * FROM public.profiles WHERE id = 'user-uuid'; -- Should return own profile
```

## 🔐 Authentication Integration

### Supabase Auth Setup

The schema uses Supabase's built-in authentication:

1. **Users Table**: Uses `auth.users` from Supabase Auth
2. **Profiles Table**: Extends auth.users with additional user data
3. **Automatic Sync**: Triggers can sync auth.users to public.profiles

### Profile Creation Trigger

Add this to automatically create profiles on signup:

```sql
-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### React Native Integration

Install Supabase client:

```bash
npm install @supabase/supabase-js
```

Initialize Supabase:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Authentication Functions

```javascript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
  options: {
    data: {
      full_name: 'John Doe',
      avatar_url: 'https://...'
    }
  }
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password',
});

// Sign out
await supabase.auth.signOut();

// Get current user
const { data: { user } } = await supabase.auth.getUser();
```

## 📡 Real-time Subscriptions

### Setting Up Real-time

Enable real-time for specific tables:

```sql
-- Enable real-time for tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
```

### React Native Real-time Example

```javascript
// Subscribe to new messages
const channel = supabase
  .channel('messages')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`
    },
    (payload) => {
      console.log('New message:', payload.new);
      // Update UI with new message
    }
  )
  .subscribe();

// Unsubscribe when done
channel.unsubscribe();
```

### Real-time Notifications

```javascript
// Subscribe to user notifications
const notificationsChannel = supabase
  .channel('notifications')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      // Show notification to user
      showNotification(payload.new);
    }
  )
  .subscribe();
```

## 📁 Storage Configuration

### Storage Buckets

The migration `002_storage_buckets.sql` creates the following buckets:

| Bucket | Public | File Size Limit | Allowed MIME Types | Purpose |
|--------|--------|----------------|-------------------|---------|
| `property-images` | Yes | 10MB | JPEG, PNG, WebP, GIF | Property listing photos |
| `avatars` | Yes | 5MB | JPEG, PNG, WebP | User profile pictures |
| `roommate-images` | Yes | 10MB | JPEG, PNG, WebP, GIF | Roommate listing photos |
| `documents` | No | 10MB | PDF, JPEG, PNG | User documents (private) |

### Folder Structure

```
property-images/
  {user_id}/
    {property_id}/
      image1.jpg
      image2.jpg

avatars/
  {user_id}/
    avatar.jpg

roommate-images/
  {user_id}/
    {listing_id}/
      image1.jpg
      image2.jpg

documents/
  {user_id}/
    id_verification.pdf
    contract.pdf
```

### Creating Storage Buckets

Storage buckets must be created via the Supabase Dashboard or CLI, not via SQL migrations.

#### Option 1: Via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"** for each bucket:

**property-images**
- Name: `property-images`
- Public: Yes
- File size limit: 10MB
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`

**avatars**
- Name: `avatars`
- Public: Yes
- File size limit: 5MB
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`

**roommate-images**
- Name: `roommate-images`
- Public: Yes
- File size limit: 10MB
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`

**documents**
- Name: `documents`
- Public: No
- File size limit: 10MB
- Allowed MIME types: `application/pdf`, `image/jpeg`, `image/png`

#### Option 2: Via Supabase CLI

```bash
# Create buckets using Supabase CLI
supabase storage new-buckets property-images avatars roommate-images documents
```

Then configure each bucket's settings in the dashboard.

### Applying Storage Helper Functions Migration

```bash
# Apply the helper functions migration
supabase db push
```

### Setting Up RLS Policies for Storage

After creating buckets, set up RLS policies in the dashboard:

1. Go to **Storage** → Select a bucket
2. Click **"Policies"** tab
3. Add the following policies for each bucket:

#### Property Images Policies
- **SELECT (Public)**: `bucket_id = 'property-images'`
- **INSERT (Authenticated)**: `bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]`
- **UPDATE (Authenticated)**: `bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]`
- **DELETE (Authenticated)**: `bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]`

#### Avatars Policies
- **SELECT (Public)**: `bucket_id = 'avatars'`
- **INSERT (Authenticated)**: `bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]`
- **UPDATE (Authenticated)**: `bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]`
- **DELETE (Authenticated)**: `bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]`

#### Roommate Images Policies
- **SELECT (Public)**: `bucket_id = 'roommate-images'`
- **INSERT (Authenticated)**: `bucket_id = 'roommate-images' AND auth.uid()::text = (storage.foldername(name))[1]`
- **UPDATE (Authenticated)**: `bucket_id = 'roommate-images' AND auth.uid()::text = (storage.foldername(name))[1]`
- **DELETE (Authenticated)**: `bucket_id = 'roommate-images' AND auth.uid()::text = (storage.foldername(name))[1]`

#### Documents Policies
- **SELECT (Authenticated)**: `bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]`
- **INSERT (Authenticated)**: `bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]`
- **UPDATE (Authenticated)**: `bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]`
- **DELETE (Authenticated)**: `bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]`

### RLS Policies

All storage buckets have Row Level Security enabled with the following policies:

#### Property Images
- **Public**: Can view all property images
- **Authenticated**: Can upload/update/delete images in their own user folder

#### Avatars
- **Public**: Can view all avatars
- **Authenticated**: Can upload/update/delete only their own avatar

#### Roommate Images
- **Public**: Can view all roommate images
- **Authenticated**: Can upload/update/delete images in their own user folder

#### Documents
- **Authenticated**: Can only access their own documents (private)

### Upload Examples

#### Upload Property Image

```javascript
import { supabase } from '../utils/supabase';

const uploadPropertyImage = async (userId, propertyId, file) => {
  const fileName = `${Date.now()}_${file.name}`;
  const filePath = `${userId}/${propertyId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('property-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('property-images')
    .getPublicUrl(filePath);

  return { data, publicUrl };
};
```

#### Upload Avatar

```javascript
const uploadAvatar = async (userId, file) => {
  const filePath = `${userId}/avatar`;

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true // Overwrite existing avatar
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  return { data, publicUrl };
};
```

#### Upload Roommate Listing Image

```javascript
const uploadRoommateImage = async (userId, listingId, file) => {
  const fileName = `${Date.now()}_${file.name}`;
  const filePath = `${userId}/${listingId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('roommate-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('roommate-images')
    .getPublicUrl(filePath);

  return { data, publicUrl };
};
```

#### Upload Document (Private)

```javascript
const uploadDocument = async (userId, file) => {
  const fileName = `${Date.now()}_${file.name}`;
  const filePath = `${userId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('documents')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  // For private documents, use signed URL
  const { data: { signedUrl } } = await supabase.storage
    .from('documents')
    .createSignedUrl(filePath, 60); // 60 seconds expiry

  return { data, signedUrl };
};
```

### Delete File

```javascript
const deleteFile = async (bucket, filePath) => {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([filePath]);

  if (error) throw error;
};
```

### List Files

```javascript
const listPropertyImages = async (userId, propertyId) => {
  const { data, error } = await supabase.storage
    .from('property-images')
    .list(`${userId}/${propertyId}`, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'asc' }
    });

  if (error) throw error;
  return data;
};
```

## 🛠️ Development Workflow

### Local Development

```bash
# Start local Supabase
supabase start

# View local logs
supabase logs

# Open local Studio
supabase studio

# Stop local Supabase
supabase stop
```

### Syncing with Remote

```bash
# Push local changes to remote
supabase db push

# Pull remote changes to local
supabase db pull

# Generate types for TypeScript
supabase gen types typescript
```

### Branching Strategy

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and create migration
supabase migration new add_new_feature

# Test locally
supabase start

# Push to remote when ready
supabase db push
```

## 📊 Common Queries

### Get User Profile

```javascript
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();
```

### Search Properties

```javascript
const { data, error } = await supabase
  .from('properties')
  .select(`
    *,
    property_images(image_url, is_primary),
    property_facilities(facilities(name, icon))
  `)
  .eq('status', 'active')
  .eq('type', 'rent')
  .gte('price', minPrice)
  .lte('price', maxPrice)
  .order('listed_at', { ascending: false });
```

### Get User's Bookings

```javascript
const { data, error } = await supabase
  .from('bookings')
  .select(`
    *,
    properties(title, image_url, city),
    payments(status, amount)
  `)
  .eq('user_id', userId)
  .order('created_at', { ascending: false });
```

### Get Conversation Messages

```javascript
const { data, error } = await supabase
  .from('messages')
  .select('*')
  .eq('conversation_id', conversationId)
  .order('created_at', { ascending: true });
```

### Create Booking

```javascript
const { data, error } = await supabase
  .from('bookings')
  .insert({
    reference: generateBookingReference(),
    user_id: userId,
    property_id: propertyId,
    check_in_date: checkInDate,
    check_out_date: checkOutDate,
    guests: guests,
    total_amount: totalAmount,
    status: 'pending'
  })
  .select()
  .single();
```

### Toggle Favorite

```javascript
const { data: existing } = await supabase
  .from('favorites')
  .select('*')
  .eq('user_id', userId)
  .eq('property_id', propertyId)
  .single();

if (existing) {
  // Remove favorite
  await supabase
    .from('favorites')
    .delete()
    .eq('id', existing.id);
} else {
  // Add favorite
  await supabase
    .from('favorites')
    .insert({
      user_id: userId,
      property_id: propertyId
    });
}
```

## 🔧 Troubleshooting

### Common Issues

#### RLS Policy Blocking Access
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- View existing policies
SELECT * FROM pg_policies 
WHERE schemaname = 'public';
```

#### Migration Conflicts
```bash
# Reset local database
supabase db reset

# Pull fresh from remote
supabase db pull
```

#### Real-time Not Working
```sql
-- Check if real-time is enabled
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
```

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Real-time Guide](https://supabase.com/docs/guides/realtime)
- [Storage Guide](https://supabase.com/docs/guides/storage)

## 🤝 Support

For issues specific to this implementation:
1. Check the migration files in `supabase/migrations/`
2. Review RLS policies in the schema
3. Test queries in Supabase SQL Editor
4. Check Supabase logs for errors
