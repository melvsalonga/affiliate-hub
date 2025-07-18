# Database Setup Guide - LinkVault Pro

This guide covers the complete database setup for the LinkVault Pro affiliate marketing platform.

## Overview

The database schema includes:

- **User Management**: Users, profiles, and notification settings
- **Product Management**: Products, categories, tags, and images
- **Affiliate Links**: Platform management and link tracking
- **Analytics**: Click events, conversions, and performance metrics
- **Campaigns**: Marketing campaign management

## Prerequisites

- PostgreSQL 14+ or Supabase account
- Node.js 18+
- npm or yarn

## Setup Options

### Option 1: Using Supabase (Recommended)

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Update your `.env` file:
   ```env
   DATABASE_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
   NEXT_PUBLIC_SUPABASE_URL="https://[project-ref].supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
   ```
4. Run the schema setup:
   ```bash
   # Execute the SQL schema in Supabase SQL Editor
   # Copy and paste the contents of supabase_schema.sql
   ```

### Option 2: Local PostgreSQL

1. Install PostgreSQL locally
2. Create a new database:
   ```sql
   CREATE DATABASE linkvault_pro;
   ```
3. Update your `.env` file:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/linkvault_pro"
   ```

## Database Schema Setup

### 1. Generate Prisma Client

```bash
npm run db:generate
```

### 2. Push Schema to Database

```bash
npm run db:push
```

### 3. Seed Initial Data

```bash
npm run db:seed
```

## Schema Overview

### Core Tables

#### Users & Authentication

- `users` - User accounts with roles (ADMIN, EDITOR, VIEWER)
- `user_profiles` - Extended user information and preferences
- `email_notification_settings` - Email notification preferences
- `push_notification_settings` - Push notification preferences

#### Product Management

- `categories` - Hierarchical product categories
- `tags` - Product tags for organization
- `products` - Main product information
- `product_images` - Product image gallery
- `product_tags` - Many-to-many relationship between products and tags

#### Affiliate System

- `platforms` - Affiliate platforms (Amazon, Shopee, etc.)
- `affiliate_links` - Product affiliate links with commission tracking
- `link_analytics` - Aggregated link performance metrics
- `product_analytics` - Aggregated product performance metrics

#### Tracking & Analytics

- `click_events` - Individual click tracking
- `conversion_events` - Conversion tracking with order details
- `campaigns` - Marketing campaign management

### Key Features

#### Row Level Security (RLS)

- Comprehensive RLS policies for data protection
- Role-based access control (ADMIN, EDITOR, VIEWER)
- Public read access for published content
- Secure user data isolation

#### Automatic Analytics

- Real-time analytics calculation via database triggers
- Automatic aggregation of clicks, conversions, and revenue
- Performance metrics calculation (conversion rates, AOV)

#### Hierarchical Categories

- Self-referential category structure
- Support for unlimited nesting levels
- Efficient querying with proper indexing

#### Comprehensive Indexing

- Optimized indexes for common query patterns
- Performance-focused database design
- Efficient full-text search capabilities

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Database
DATABASE_URL="your-database-connection-string"

# Supabase (if using)
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="LinkVault Pro"
```

## Development Commands

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes to database
npm run db:push

# Seed database with initial data
npm run db:seed

# Open Prisma Studio (database GUI)
npm run db:studio

# Reset database (development only)
npm run db:reset
```

## Data Models

### User Management

```typescript
interface User {
  id: string;
  email: string;
  role: "ADMIN" | "EDITOR" | "VIEWER";
  isActive: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
  profile?: UserProfile;
}
```

### Product Management

```typescript
interface Product {
  id: string;
  title: string;
  description: string;
  currentPrice: number;
  originalPrice?: number;
  currency: string;
  slug: string;
  status: "ACTIVE" | "INACTIVE" | "DRAFT" | "SCHEDULED";
  category: Category;
  images: ProductImage[];
  affiliateLinks: AffiliateLink[];
  tags: Tag[];
}
```

### Analytics

```typescript
interface ClickEvent {
  id: string;
  linkId: string;
  sessionId: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  country?: string;
  device?: string;
  timestamp: Date;
}

interface ConversionEvent {
  id: string;
  linkId: string;
  clickId?: string;
  orderValue: number;
  commission: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  timestamp: Date;
}
```

## Security Considerations

### Row Level Security Policies

- Users can only access their own profile data
- Admins and editors can manage content
- Viewers have read-only access to analytics
- Public users can only see published content

### Data Protection

- All sensitive operations require authentication
- Input validation at database and application level
- Audit logging for admin actions
- Secure session management

## Performance Optimization

### Database Indexes

- Composite indexes for common query patterns
- Full-text search indexes for product search
- Time-based indexes for analytics queries

### Query Optimization

- Efficient pagination with cursor-based navigation
- Aggregated analytics tables for fast reporting
- Materialized views for complex calculations

## Backup and Recovery

### Automated Backups (Supabase)

- Daily automated backups
- Point-in-time recovery
- Cross-region replication

### Manual Backup (Local PostgreSQL)

```bash
# Create backup
pg_dump linkvault_pro > backup.sql

# Restore backup
psql linkvault_pro < backup.sql
```

## Monitoring and Maintenance

### Database Health Checks

- Connection pool monitoring
- Query performance analysis
- Storage usage tracking
- Index usage statistics

### Regular Maintenance

- Analyze query performance
- Update table statistics
- Monitor slow queries
- Review and optimize indexes

## Troubleshooting

### Common Issues

1. **Connection Issues**

   - Verify DATABASE_URL format
   - Check network connectivity
   - Validate credentials

2. **Migration Errors**

   - Ensure database is accessible
   - Check for conflicting data
   - Review schema changes

3. **Performance Issues**
   - Analyze slow queries
   - Check index usage
   - Monitor connection pool

### Getting Help

- Check Prisma documentation: [prisma.io/docs](https://prisma.io/docs)
- Supabase documentation: [supabase.com/docs](https://supabase.com/docs)
- PostgreSQL documentation: [postgresql.org/docs](https://postgresql.org/docs)

## Next Steps

After setting up the database:

1. Configure authentication system
2. Set up API routes for data access
3. Implement frontend components
4. Configure analytics tracking
5. Set up monitoring and alerts
