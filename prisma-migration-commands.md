# Prisma Migration Commands for LinkVault Pro Integration Features

## Prerequisites

Ensure your `.env` file has the correct DATABASE_URL:
```bash
DATABASE_URL="postgresql://postgres:TjpgBImWt9wq0WOS@db.wrtlsaivhxmzymbmtkrf.supabase.co:5432/postgres"
```

## Option 1: Generate and Apply Migration (Recommended)

```bash
# Generate a new migration from your Prisma schema changes
npx prisma migrate dev --name add-integration-extensibility-features

# This will:
# 1. Generate SQL migration files in prisma/migrations/
# 2. Apply the migration to your database
# 3. Generate the Prisma client with new types
```

## Option 2: Push Schema Directly (Development Only)

```bash
# Push schema changes directly to database (no migration files)
npx prisma db push

# Generate the updated Prisma client
npx prisma generate
```

## Option 3: Reset and Seed (If needed)

```bash
# Reset database and apply all migrations
npx prisma migrate reset

# Seed the database with initial data
npx prisma db seed
```

## Verify Migration

```bash
# Check database status
npx prisma migrate status

# View your database in Prisma Studio
npx prisma studio
```

## Troubleshooting

### Connection Issues
If you get connection errors:

1. **Check your internet connection**
2. **Verify DATABASE_URL** in `.env` file
3. **Check Supabase project status** in dashboard
4. **Ensure database is not paused** (free tier auto-pauses)

### Migration Conflicts
If you get migration conflicts:

```bash
# Mark migration as applied (if you ran SQL manually)
npx prisma migrate resolve --applied "20240119000000_add_integration_extensibility_features"

# Or reset and reapply all migrations
npx prisma migrate reset
```

### Schema Drift
If Prisma detects schema drift:

```bash
# Generate migration to fix drift
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > fix-drift.sql

# Review the SQL file and apply manually, then mark as resolved
npx prisma migrate resolve --applied "migration_name"
```

## Post-Migration Steps

1. **Update Prisma Client**:
   ```bash
   npx prisma generate
   ```

2. **Restart your development server**:
   ```bash
   npm run dev
   ```

3. **Test the new features**:
   - Visit `/admin/webhooks` to test webhook management
   - Visit `/admin/email-marketing` to test email campaigns
   - Visit `/admin/social-media` to test social media integration
   - Visit `/admin/plugins` to test plugin management
   - Visit `/admin/feature-flags` to test feature flags

## Environment Variables

Add these optional environment variables for full functionality:

```bash
# Email Marketing
MAILCHIMP_API_KEY=your_mailchimp_api_key
MAILCHIMP_LIST_ID=your_list_id
CONVERTKIT_API_KEY=your_convertkit_api_key
CONVERTKIT_FORM_ID=your_form_id

# Social Media
TWITTER_ACCESS_TOKEN=your_twitter_token
FACEBOOK_ACCESS_TOKEN=your_facebook_token
FACEBOOK_PAGE_ID=your_page_id
LINKEDIN_ACCESS_TOKEN=your_linkedin_token

# Auto-sharing (comma-separated platforms)
AUTO_SHARE_PLATFORMS=twitter,facebook

# Webhook Security
WEBHOOK_SECRET=your_webhook_secret

# Cron Jobs
CRON_SECRET=your_cron_secret_for_automated_tasks
```

## Success Indicators

After successful migration, you should see:

✅ New tables in your Supabase dashboard:
- `webhooks` and `webhook_deliveries`
- `email_campaigns`, `email_templates`, `newsletter_subscribers`
- `social_media_accounts`, `social_media_posts`, `social_media_templates`
- `plugins` and `plugin_hooks`
- `feature_flags` and `feature_flag_evaluations`

✅ New admin pages accessible:
- `/admin/webhooks`
- `/admin/email-marketing`
- `/admin/social-media`
- `/admin/plugins`
- `/admin/feature-flags`

✅ No TypeScript errors in your IDE

✅ Prisma Client generates without errors