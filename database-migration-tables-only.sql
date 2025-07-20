-- =====================================================
-- LinkVault Pro - Integration & Extensibility Features
-- Database Migration Script for Supabase (Tables Only)
-- =====================================================

-- This script adds ONLY the new tables for:
-- 1. Webhook System
-- 2. Email Marketing Integration  
-- 3. Social Media Integration
-- 4. Plugin Architecture
-- 5. Feature Flags System

-- =====================================================
-- 1. WEBHOOK SYSTEM TABLES
-- =====================================================

-- Create webhook events enum type
DO $$ BEGIN
    CREATE TYPE webhook_event AS ENUM (
        'PRODUCT_CREATED',
        'PRODUCT_UPDATED', 
        'PRODUCT_DELETED',
        'PRODUCT_STATUS_CHANGED',
        'LINK_CLICKED',
        'CONVERSION_TRACKED',
        'USER_REGISTERED',
        'USER_UPDATED',
        'CAMPAIGN_STARTED',
        'CAMPAIGN_ENDED',
        'PRICE_ALERT_TRIGGERED',
        'ANALYTICS_MILESTONE'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create webhook delivery status enum type
DO $$ BEGIN
    CREATE TYPE webhook_delivery_status AS ENUM (
        'PENDING',
        'SUCCESS',
        'FAILED',
        'RETRYING'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create webhooks table
CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    url TEXT NOT NULL,
    secret TEXT,
    events webhook_event[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    retry_attempts INTEGER NOT NULL DEFAULT 3,
    timeout INTEGER NOT NULL DEFAULT 30,
    headers JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Create webhook_deliveries table
CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
    event webhook_event NOT NULL,
    payload JSONB NOT NULL,
    http_status INTEGER,
    response_body TEXT,
    response_time INTEGER,
    attempt INTEGER NOT NULL DEFAULT 1,
    status webhook_delivery_status NOT NULL DEFAULT 'PENDING',
    error_message TEXT,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    next_retry_at TIMESTAMPTZ
);

-- Create indexes for webhook_deliveries
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id_created_at 
    ON webhook_deliveries(webhook_id, created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status_next_retry_at 
    ON webhook_deliveries(status, next_retry_at);

-- =====================================================
-- 2. EMAIL MARKETING TABLES
-- =====================================================

-- Create email campaign types enum
DO $$ BEGIN
    CREATE TYPE email_campaign_type AS ENUM (
        'newsletter',
        'price_alert', 
        'deal_notification',
        'welcome',
        'abandoned_cart'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create email campaign status enum  
DO $$ BEGIN
    CREATE TYPE email_campaign_status AS ENUM (
        'draft',
        'scheduled',
        'sent',
        'failed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Email campaigns table (for tracking purposes)
CREATE TABLE IF NOT EXISTS email_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type email_campaign_type NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    status email_campaign_status NOT NULL DEFAULT 'draft',
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    recipients_count INTEGER DEFAULT 0,
    opens_count INTEGER DEFAULT 0,
    clicks_count INTEGER DEFAULT 0,
    unsubscribes_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Email templates table
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    subject TEXT NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    variables TEXT[] DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Newsletter subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    first_name TEXT,
    last_name TEXT,
    source TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    unsubscribed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 3. SOCIAL MEDIA INTEGRATION TABLES
-- =====================================================

-- Create social media platform enum
DO $$ BEGIN
    CREATE TYPE social_media_platform AS ENUM (
        'twitter',
        'facebook',
        'instagram', 
        'linkedin',
        'pinterest'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create social media post status enum
DO $$ BEGIN
    CREATE TYPE social_media_post_status AS ENUM (
        'draft',
        'scheduled',
        'posted',
        'failed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Social media accounts table
CREATE TABLE IF NOT EXISTS social_media_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform social_media_platform NOT NULL,
    account_name TEXT NOT NULL,
    account_id TEXT,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(platform, account_id)
);

-- Social media posts table
CREATE TABLE IF NOT EXISTS social_media_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES social_media_accounts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    media_urls TEXT[] DEFAULT '{}',
    hashtags TEXT[] DEFAULT '{}',
    status social_media_post_status NOT NULL DEFAULT 'draft',
    scheduled_at TIMESTAMPTZ,
    posted_at TIMESTAMPTZ,
    external_id TEXT,
    engagement_stats JSONB DEFAULT '{}',
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Social media templates table
CREATE TABLE IF NOT EXISTS social_media_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    hashtags TEXT[] DEFAULT '{}',
    variables TEXT[] DEFAULT '{}',
    platforms social_media_platform[] DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- 4. PLUGIN ARCHITECTURE TABLES
-- =====================================================

-- Create plugin status enum
DO $$ BEGIN
    CREATE TYPE plugin_status AS ENUM (
        'active',
        'inactive',
        'error'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create plugin category enum
DO $$ BEGIN
    CREATE TYPE plugin_category AS ENUM (
        'analytics',
        'marketing',
        'integration',
        'ui',
        'utility'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Plugins table
CREATE TABLE IF NOT EXISTS plugins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    description TEXT,
    author TEXT NOT NULL,
    category plugin_category NOT NULL,
    status plugin_status NOT NULL DEFAULT 'inactive',
    config JSONB DEFAULT '{}',
    hooks JSONB DEFAULT '[]',
    dependencies TEXT[] DEFAULT '{}',
    permissions TEXT[] DEFAULT '{}',
    install_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_update TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(name, version)
);

-- Plugin hooks table (for better querying)
CREATE TABLE IF NOT EXISTS plugin_hooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plugin_id UUID NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,
    hook_name TEXT NOT NULL,
    hook_type TEXT NOT NULL, -- 'filter', 'action', 'component'
    priority INTEGER NOT NULL DEFAULT 10,
    callback TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for plugin hooks
CREATE INDEX IF NOT EXISTS idx_plugin_hooks_name_type 
    ON plugin_hooks(hook_name, hook_type, priority);

-- =====================================================
-- 5. FEATURE FLAGS SYSTEM TABLES
-- =====================================================

-- Create feature flag type enum
DO $$ BEGIN
    CREATE TYPE feature_flag_type AS ENUM (
        'boolean',
        'string',
        'number',
        'json'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Feature flags table
CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    key TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    type feature_flag_type NOT NULL DEFAULT 'boolean',
    value JSONB NOT NULL,
    default_value JSONB NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    rollout_percentage INTEGER NOT NULL DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    conditions JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Feature flag evaluations table (for analytics)
CREATE TABLE IF NOT EXISTS feature_flag_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    context JSONB DEFAULT '{}',
    result BOOLEAN NOT NULL,
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for feature flag evaluations
CREATE INDEX IF NOT EXISTS idx_feature_flag_evaluations_flag_user 
    ON feature_flag_evaluations(flag_id, user_id, evaluated_at);

-- =====================================================
-- 6. ADDITIONAL INDEXES AND CONSTRAINTS
-- =====================================================

-- Add updated_at triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
DO $$ 
DECLARE
    table_name TEXT;
    tables_with_updated_at TEXT[] := ARRAY[
        'webhooks',
        'email_campaigns', 
        'email_templates',
        'newsletter_subscribers',
        'social_media_accounts',
        'social_media_posts', 
        'social_media_templates',
        'plugins',
        'feature_flags'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables_with_updated_at
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
            CREATE TRIGGER update_%I_updated_at 
                BEFORE UPDATE ON %I 
                FOR EACH ROW 
                EXECUTE FUNCTION update_updated_at_column();
        ', table_name, table_name, table_name, table_name);
    END LOOP;
END $$;

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all new tables
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE plugins ENABLE ROW LEVEL SECURITY;
ALTER TABLE plugin_hooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flag_evaluations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin access
DO $$ 
DECLARE
    table_name TEXT;
    admin_tables TEXT[] := ARRAY[
        'webhooks',
        'webhook_deliveries',
        'email_campaigns',
        'email_templates', 
        'social_media_accounts',
        'social_media_posts',
        'social_media_templates',
        'plugins',
        'plugin_hooks',
        'feature_flags',
        'feature_flag_evaluations'
    ];
BEGIN
    FOREACH table_name IN ARRAY admin_tables
    LOOP
        -- Allow admins full access
        EXECUTE format('
            DROP POLICY IF EXISTS admin_all_access ON %I;
            CREATE POLICY admin_all_access ON %I
                FOR ALL USING (
                    EXISTS (
                        SELECT 1 FROM users 
                        WHERE users.id = auth.uid() 
                        AND users.role = ''ADMIN''
                    )
                );
        ', table_name, table_name);
        
        -- Allow editors read access (except for sensitive tables)
        IF table_name NOT IN ('webhooks', 'webhook_deliveries', 'plugins', 'plugin_hooks', 'feature_flags') THEN
            EXECUTE format('
                DROP POLICY IF EXISTS editor_read_access ON %I;
                CREATE POLICY editor_read_access ON %I
                    FOR SELECT USING (
                        EXISTS (
                            SELECT 1 FROM users 
                            WHERE users.id = auth.uid() 
                            AND users.role IN (''ADMIN'', ''EDITOR'')
                        )
                    );
            ', table_name, table_name);
        END IF;
    END LOOP;
END $$;

-- Special policy for newsletter subscribers (public insert)
DROP POLICY IF EXISTS public_newsletter_subscribe ON newsletter_subscribers;
CREATE POLICY public_newsletter_subscribe ON newsletter_subscribers
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS admin_newsletter_access ON newsletter_subscribers;
CREATE POLICY admin_newsletter_access ON newsletter_subscribers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'ADMIN'
        )
    );

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Display completion message
DO $$ 
BEGIN 
    RAISE NOTICE 'LinkVault Pro Integration & Extensibility Features migration completed successfully!';
    RAISE NOTICE 'Added tables for: Webhooks, Email Marketing, Social Media, Plugins, and Feature Flags';
    RAISE NOTICE 'You can now add sample data manually through the admin interface.';
END $$;