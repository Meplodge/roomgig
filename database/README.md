# Real Estate App - PostgreSQL Database

This directory contains the comprehensive PostgreSQL database schema and seed data for the Real Estate application.

## 📋 Table of Contents

- [Overview](#overview)
- [Database Schema](#database-schema)
- [Tables](#tables)
- [Relationships](#relationships)
- [Installation](#installation)
- [Usage](#usage)
- [Migration Strategy](#migration-strategy)
- [Performance Considerations](#performance-considerations)

## 🎯 Overview

The database is designed to support a full-featured real estate application with:

- **User Management**: Authentication, roles, device binding, and preferences
- **Property Listings**: Rent, sale, and buy properties with detailed information
- **Roommate Finder**: Dedicated roommate matching system
- **Booking System**: Property and roommate booking management
- **Messaging**: Real-time messaging between users
- **Reviews & Ratings**: User feedback system
- **Payment Processing**: Payment methods and transaction tracking
- **Notifications**: In-app notification system
- **Search & Discovery**: Advanced search with filters

## 🗄️ Database Schema

### Core Tables

#### Users & Authentication
- **users**: User accounts with authentication and profile information
- **device_bindings**: Device-to-account bindings for security
- **user_preferences**: User application preferences and settings

#### Properties
- **properties**: Real estate property listings
- **property_images**: Images associated with properties
- **facilities**: Available property facilities/amenities
- **property_facilities**: Many-to-many relationship between properties and facilities

#### Roommate Finder
- **roommate_listings**: Roommate finder listings
- **roommate_images**: Images for roommate listings

#### Bookings & Payments
- **bookings**: Property and roommate booking records
- **payment_methods**: User payment methods
- **payments**: Payment transaction records

#### Messaging
- **conversations**: Message conversations between users
- **messages**: Individual messages within conversations

#### Reviews & Ratings
- **reviews**: User reviews and ratings for properties and roommates

#### Notifications
- **notifications**: User notifications

#### Favorites & Search
- **favorites**: User favorites for properties and roommate listings
- **search_history**: User search query history

## 📊 Tables

### users
Stores user account information including authentication data, profile details, and role-based access control.

**Key Fields:**
- `id`: UUID primary key
- `email`: Unique email address
- `password_hash`: Bcrypt hashed password
- `role`: User role (user, admin, host, agent)
- `is_verified`: Email verification status
- `is_active`: Account active status

### device_bindings
Manages device-to-account bindings for security, preventing multiple accounts on the same device.

**Key Fields:**
- `user_id`: Reference to user
- `device_id`: Unique device identifier
- `device_name/mode/model`: Device information
- `is_active`: Binding active status

### properties
Core table for property listings with comprehensive property details.

**Key Fields:**
- `id`: UUID primary key
- `host_id`: Property owner reference
- `type`: Property type (rent, sale, buy)
- `category`: Property category (apartment, villa, etc.)
- `status`: Listing status (active, sold, rented, etc.)
- `price`: Property price
- `bedrooms/bathrooms/square_feet`: Property specifications
- `latitude/longitude`: Geographic location
- `rating_avg/review_count`: Aggregated ratings

### conversations
Manages messaging conversations between users, optionally linked to properties.

**Key Fields:**
- `user_id`: Conversation initiator
- `other_user_id`: Conversation participant
- `property_id`: Related property (optional)
- `last_message`: Most recent message preview
- `unread_count`: Unread message count

### bookings
Handles property and roommate bookings with status tracking.

**Key Fields:**
- `reference`: Unique booking reference
- `user_id`: Booking user
- `property_id/roommate_listing_id`: Target booking
- `check_in_date/check_out_date`: Booking dates
- `status`: Booking status (pending, confirmed, etc.)

## 🔗 Relationships

### Primary Relationships

```
users (1) ─────── (N) device_bindings
users (1) ─────── (N) user_preferences
users (1) ─────── (N) properties (as host)
users (1) ─────── (N) roommate_listings
users (1) ─────── (N) bookings
users (1) ─────── (N) payment_methods
users (1) ─────── (N) favorites
users (1) ─────── (N) reviews
users (1) ─────── (N) notifications
users (1) ─────── (N) search_history

properties (1) ──── (N) property_images
properties (1) ──── (N) property_facilities
properties (1) ──── (N) bookings
properties (1) ──── (N) reviews
properties (1) ──── (N) conversations
properties (1) ──── (N) favorites

roommate_listings (1) ── (N) roommate_images
roommate_listings (1) ── (N) bookings
roommate_listings (1) ── (N) conversations
roommate_listings (1) ── (N) favorites

conversations (1) ── (N) messages
bookings (1) ─────── (N) payments
```

### Many-to-Many Relationships

```
properties (N) ── (N) facilities (via property_facilities)
```

## 🚀 Installation

### Prerequisites

- PostgreSQL 14 or higher
- psql command-line tool or GUI client (pgAdmin, DBeaver, etc.)

### Setup Steps

1. **Create Database**
```bash
createdb realestate_app
```

2. **Run Schema**
```bash
psql -d realestate_app -f schema.sql
```

3. **Load Seed Data** (optional)
```bash
psql -d realestate_app -f seed_data.sql
```

### Using Docker

```bash
# Start PostgreSQL container
docker run --name realestate-db \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=realestate_app \
  -p 5432:5432 \
  -d postgres:15

# Copy and run schema
docker cp schema.sql realestate-db:/tmp/
docker exec -i realestate-db psql -U postgres -d realestate_app -f /tmp/schema.sql

# Copy and run seed data
docker cp seed_data.sql realestate-db:/tmp/
docker exec -i realestate-db psql -U postgres -d realestate_app -f /tmp/seed_data.sql
```

## 📖 Usage

### Common Queries

#### Get User with Device Bindings
```sql
SELECT u.*, db.device_id, db.device_name, db.is_active
FROM users u
LEFT JOIN device_bindings db ON u.id = db.user_id
WHERE u.email = 'user@example.com';
```

#### Search Properties with Filters
```sql
SELECT * FROM search_properties(
    p_type := 'rent',
    p_city := 'Manhattan',
    p_min_price := 1000,
    p_max_price := 5000,
    p_limit := 20
);
```

#### Get User's Unread Notifications
```sql
SELECT * FROM get_unread_notifications_count('user-uuid');
```

#### Get Conversation with Messages
```sql
SELECT c.*, m.*
FROM conversations c
JOIN messages m ON c.id = m.conversation_id
WHERE c.user_id = 'user-uuid'
ORDER BY m.created_at ASC;
```

### Database Functions

#### `generate_booking_reference()`
Generates a unique booking reference code.

#### `get_unread_notifications_count(user_id)`
Returns the count of unread notifications for a user.

#### `search_properties(filters)`
Searches properties with various filter parameters.

## 🔄 Migration Strategy

### Version Control

1. **Create migration files** for each schema change:
```
database/migrations/
├── 001_initial_schema.sql
├── 002_add_user_verification.sql
├── 003_add_property_virtual_tours.sql
└── ...
```

2. **Track migrations** in a migrations table:
```sql
CREATE TABLE schema_migrations (
    version VARCHAR(14) PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

3. **Apply migrations** in order:
```bash
for migration in migrations/*.sql; do
    psql -d realestate_app -f "$migration"
done
```

### Rollback Strategy

Each migration should include a rollback section:
```sql
-- Migration: 002_add_user_verification.sql

-- UP
ALTER TABLE users ADD COLUMN verification_token VARCHAR(255);

-- DOWN
ALTER TABLE users DROP COLUMN verification_token;
```

## ⚡ Performance Considerations

### Indexes

The schema includes comprehensive indexes on:
- Foreign key columns
- Frequently queried columns (status, type, city, price)
- Timestamp columns (created_at, updated_at)
- Composite indexes for common query patterns

### Query Optimization

1. **Use views** for complex joins (property_listings_view, conversations_view)
2. **Leverage functions** for common operations (search_properties)
3. **Monitor slow queries** with `pg_stat_statements`
4. **Regular vacuuming** to maintain performance

### Scaling Considerations

1. **Read Replicas**: For read-heavy operations
2. **Connection Pooling**: Use PgBouncer for high concurrency
3. **Partitioning**: Consider partitioning large tables (messages, notifications) by date
4. **Caching**: Implement Redis caching for frequently accessed data

## 🔒 Security

### Best Practices

1. **Use parameterized queries** to prevent SQL injection
2. **Implement row-level security** (RLS) for multi-tenant access
3. **Regular backups** with point-in-time recovery
4. **Encrypt sensitive data** at rest (consider pgcrypto extension)
5. **Audit logging** for sensitive operations

### Row-Level Security Example

```sql
-- Enable RLS on properties
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see active properties
CREATE POLICY properties_active_policy ON properties
    FOR SELECT USING (status = 'active');

-- Policy: Hosts can only update their own properties
CREATE POLICY properties_update_policy ON properties
    FOR UPDATE USING (host_id = current_user_id());
```

## 📝 Notes

- All IDs use UUIDs for distributed system compatibility
- Timestamps use UTC timezone
- Soft deletes implemented with `deleted_at` columns
- Enum types ensure data integrity for status fields
- JSONB columns used for flexible data storage (filters, notification data)

## 🤝 Support

For database-related issues or questions, please refer to the PostgreSQL documentation or contact the development team.
