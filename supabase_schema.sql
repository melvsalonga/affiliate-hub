-- LinkVault Pro - Comprehensive Database Schema
-- This schema implements the complete data model for the affiliate marketing platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types/enums
CREATE TYPE user_role AS ENUM ('ADMIN', 'EDITOR', 'VIEWER');
CREATE TYPE theme AS ENUM ('LIGHT', 'DARK', 'SYSTEM');
CREATE TYPE product_status AS ENUM ('ACTIVE', 'INACTIVE', 'DRAFT', 'SCHEDULED');
CREATE TYPE conversion_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- User Management Tables
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'ADMIN',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    avatar TEXT,
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    theme theme NOT NULL DEFAULT 'SYSTEM',
    language VARCHAR(10) NOT NULL DEFAULT 'en'
);

CREATE TABLE IF NOT EXISTS email_notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_profile_id UUID NOT NULL UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
    new_conversions BOOLEAN NOT NULL DEFAULT true,
    weekly_reports BOOLEAN NOT NULL DEFAULT true,
    system_updates BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS push_notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_profile_id UUID NOT NULL UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
    real_time_alerts BOOLEAN NOT NULL DEFAULT false,
    daily_summary BOOLEAN NOT NULL DEFAULT true
);

-- Product Management Tables
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(100),
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    color VARCHAR(7), -- Hex color code
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    short_description VARCHAR(500),
    current_price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    meta_title VARCHAR(60),
    meta_description VARCHAR(160),
    slug VARCHAR(200) NOT NULL UNIQUE,
    status product_status NOT NULL DEFAULT 'DRAFT',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    category_id UUID NOT NULL REFERENCES categories(id),
    created_by UUID NOT NULL REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt VARCHAR(200) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_tags (
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, tag_id)
);

-- Affiliate Link Management Tables
CREATE TABLE IF NOT EXISTS platforms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    base_url TEXT NOT NULL,
    logo_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS affiliate_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    platform_id UUID NOT NULL REFERENCES platforms(id),
    original_url TEXT NOT NULL,
    shortened_url TEXT,
    commission DECIMAL(5,4) NOT NULL DEFAULT 0.0000,
    is_active BOOLEAN NOT NULL DEFAULT true,
    priority INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics and Tracking Tables
CREATE TABLE IF NOT EXISTS link_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    link_id UUID NOT NULL UNIQUE REFERENCES affiliate_links(id) ON DELETE CASCADE,
    total_clicks INTEGER NOT NULL DEFAULT 0,
    total_conversions INTEGER NOT NULL DEFAULT 0,
    total_revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
    conversion_rate DECIMAL(5,4) NOT NULL DEFAULT 0,
    average_order_value DECIMAL(10,2) NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
    views INTEGER NOT NULL DEFAULT 0,
    clicks INTEGER NOT NULL DEFAULT 0,
    conversions INTEGER NOT NULL DEFAULT 0,
    revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS click_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    link_id UUID NOT NULL REFERENCES affiliate_links(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    country VARCHAR(100),
    city VARCHAR(100),
    device VARCHAR(50),
    browser VARCHAR(50),
    os VARCHAR(50),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversion_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    link_id UUID NOT NULL REFERENCES affiliate_links(id) ON DELETE CASCADE,
    click_id UUID UNIQUE REFERENCES click_events(id) ON DELETE SET NULL,
    order_value DECIMAL(10,2) NOT NULL,
    commission DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status conversion_status NOT NULL DEFAULT 'PENDING',
    order_id VARCHAR(255),
    product_ids TEXT[],
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign Management Tables
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    budget DECIMAL(10,2),
    target_revenue DECIMAL(10,2),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);

CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);

CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_created_by ON products(created_by);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
CREATE INDEX IF NOT EXISTS idx_products_published_at ON products(published_at);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_is_primary ON product_images(is_primary);

CREATE INDEX IF NOT EXISTS idx_platforms_name ON platforms(name);
CREATE INDEX IF NOT EXISTS idx_platforms_is_active ON platforms(is_active);

CREATE INDEX IF NOT EXISTS idx_affiliate_links_product_id ON affiliate_links(product_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_platform_id ON affiliate_links(platform_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_is_active ON affiliate_links(is_active);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_created_at ON affiliate_links(created_at);

CREATE INDEX IF NOT EXISTS idx_click_events_link_id ON click_events(link_id);
CREATE INDEX IF NOT EXISTS idx_click_events_timestamp ON click_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_click_events_session_id ON click_events(session_id);

CREATE INDEX IF NOT EXISTS idx_conversion_events_link_id ON conversion_events(link_id);
CREATE INDEX IF NOT EXISTS idx_conversion_events_click_id ON conversion_events(click_id);
CREATE INDEX IF NOT EXISTS idx_conversion_events_timestamp ON conversion_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_conversion_events_status ON conversion_events(status);

CREATE INDEX IF NOT EXISTS idx_campaigns_created_by ON campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_campaigns_is_active ON campaigns(is_active);
CREATE INDEX IF NOT EXISTS idx_campaigns_start_date ON campaigns(start_date);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at columns
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_affiliate_links_updated_at
    BEFORE UPDATE ON affiliate_links
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_link_analytics_updated_at
    BEFORE UPDATE ON link_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_analytics_updated_at
    BEFORE UPDATE ON product_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
    BEFORE UPDATE ON campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create functions for analytics calculations
CREATE OR REPLACE FUNCTION update_link_analytics(p_link_id UUID)
RETURNS VOID AS $$
DECLARE
    v_total_clicks INTEGER;
    v_total_conversions INTEGER;
    v_total_revenue DECIMAL(10,2);
    v_conversion_rate DECIMAL(5,4);
    v_avg_order_value DECIMAL(10,2);
BEGIN
    -- Calculate metrics
    SELECT COUNT(*) INTO v_total_clicks
    FROM click_events
    WHERE link_id = p_link_id;
    
    SELECT COUNT(*), COALESCE(SUM(order_value), 0)
    INTO v_total_conversions, v_total_revenue
    FROM conversion_events
    WHERE link_id = p_link_id AND status = 'CONFIRMED';
    
    -- Calculate rates
    v_conversion_rate := CASE 
        WHEN v_total_clicks > 0 THEN v_total_conversions::DECIMAL / v_total_clicks::DECIMAL
        ELSE 0
    END;
    
    v_avg_order_value := CASE 
        WHEN v_total_conversions > 0 THEN v_total_revenue / v_total_conversions
        ELSE 0
    END;
    
    -- Update or insert analytics
    INSERT INTO link_analytics (
        link_id, total_clicks, total_conversions, total_revenue,
        conversion_rate, average_order_value, last_updated
    ) VALUES (
        p_link_id, v_total_clicks, v_total_conversions, v_total_revenue,
        v_conversion_rate, v_avg_order_value, NOW()
    )
    ON CONFLICT (link_id) DO UPDATE SET
        total_clicks = v_total_clicks,
        total_conversions = v_total_conversions,
        total_revenue = v_total_revenue,
        conversion_rate = v_conversion_rate,
        average_order_value = v_avg_order_value,
        last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_product_analytics(p_product_id UUID)
RETURNS VOID AS $$
DECLARE
    v_total_clicks INTEGER;
    v_total_conversions INTEGER;
    v_total_revenue DECIMAL(10,2);
BEGIN
    -- Calculate aggregated metrics from all affiliate links for this product
    SELECT 
        COALESCE(SUM(la.total_clicks), 0),
        COALESCE(SUM(la.total_conversions), 0),
        COALESCE(SUM(la.total_revenue), 0)
    INTO v_total_clicks, v_total_conversions, v_total_revenue
    FROM affiliate_links al
    LEFT JOIN link_analytics la ON al.id = la.link_id
    WHERE al.product_id = p_product_id;
    
    -- Update or insert product analytics
    INSERT INTO product_analytics (
        product_id, clicks, conversions, revenue, last_updated
    ) VALUES (
        p_product_id, v_total_clicks, v_total_conversions, v_total_revenue, NOW()
    )
    ON CONFLICT (product_id) DO UPDATE SET
        clicks = v_total_clicks,
        conversions = v_total_conversions,
        revenue = v_total_revenue,
        last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update analytics
CREATE OR REPLACE FUNCTION trigger_update_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update link analytics
    PERFORM update_link_analytics(NEW.link_id);
    
    -- Update product analytics
    PERFORM update_product_analytics(
        (SELECT product_id FROM affiliate_links WHERE id = NEW.link_id)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_analytics_on_click
    AFTER INSERT ON click_events
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_analytics();

CREATE TRIGGER update_analytics_on_conversion
    AFTER INSERT OR UPDATE ON conversion_events
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_analytics();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE click_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
-- Users can only access their own data
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "User profiles are viewable by owner" ON user_profiles
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Email notification settings are viewable by owner" ON email_notification_settings
    FOR ALL USING (auth.uid() = (SELECT user_id FROM user_profiles WHERE id = user_profile_id));

CREATE POLICY "Push notification settings are viewable by owner" ON push_notification_settings
    FOR ALL USING (auth.uid() = (SELECT user_id FROM user_profiles WHERE id = user_profile_id));

-- Admin-only policies for content management
CREATE POLICY "Admins can manage categories" ON categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('ADMIN', 'EDITOR')
            AND is_active = true
        )
    );

CREATE POLICY "Admins can manage tags" ON tags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('ADMIN', 'EDITOR')
            AND is_active = true
        )
    );

CREATE POLICY "Admins can manage products" ON products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('ADMIN', 'EDITOR')
            AND is_active = true
        )
    );

CREATE POLICY "Admins can manage product images" ON product_images
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('ADMIN', 'EDITOR')
            AND is_active = true
        )
    );

CREATE POLICY "Admins can manage product tags" ON product_tags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('ADMIN', 'EDITOR')
            AND is_active = true
        )
    );

CREATE POLICY "Admins can manage platforms" ON platforms
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'ADMIN'
            AND is_active = true
        )
    );

CREATE POLICY "Admins can manage affiliate links" ON affiliate_links
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('ADMIN', 'EDITOR')
            AND is_active = true
        )
    );

CREATE POLICY "Admins can view analytics" ON link_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('ADMIN', 'EDITOR', 'VIEWER')
            AND is_active = true
        )
    );

CREATE POLICY "Admins can view product analytics" ON product_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('ADMIN', 'EDITOR', 'VIEWER')
            AND is_active = true
        )
    );

CREATE POLICY "Admins can manage campaigns" ON campaigns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('ADMIN', 'EDITOR')
            AND is_active = true
        )
    );

-- Public read access for published content
CREATE POLICY "Public can view active categories" ON categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view tags" ON tags
    FOR SELECT USING (true);

CREATE POLICY "Public can view published products" ON products
    FOR SELECT USING (status = 'ACTIVE' AND is_active = true);

CREATE POLICY "Public can view product images" ON product_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM products 
            WHERE id = product_id 
            AND status = 'ACTIVE' 
            AND is_active = true
        )
    );

CREATE POLICY "Public can view product tags" ON product_tags
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM products 
            WHERE id = product_id 
            AND status = 'ACTIVE' 
            AND is_active = true
        )
    );

CREATE POLICY "Public can view active platforms" ON platforms
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view active affiliate links" ON affiliate_links
    FOR SELECT USING (
        is_active = true AND
        EXISTS (
            SELECT 1 FROM products 
            WHERE id = product_id 
            AND status = 'ACTIVE' 
            AND is_active = true
        )
    );

-- Allow public tracking (clicks and conversions)
CREATE POLICY "Allow public click tracking" ON click_events
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public conversion tracking" ON conversion_events
    FOR INSERT WITH CHECK (true);

-- Insert default platforms
INSERT INTO platforms (name, display_name, base_url, logo_url) VALUES
('amazon', 'Amazon', 'https://amazon.com', null),
('lazada', 'Lazada', 'https://lazada.com.ph', null),
('shopee', 'Shopee', 'https://shopee.ph', null),
('tiktok', 'TikTok Shop', 'https://shop.tiktok.com', null),
('aliexpress', 'AliExpress', 'https://aliexpress.com', null)
ON CONFLICT (name) DO NOTHING;

-- Push Notification Tables
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_profile_id UUID NOT NULL UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh_key TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL, -- 'push', 'email', 'sms'
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    recipients_count INTEGER NOT NULL DEFAULT 0,
    successful_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    sent_by UUID REFERENCES users(id),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Price Alert Tables
CREATE TABLE IF NOT EXISTS price_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    target_price DECIMAL(10,2) NOT NULL,
    current_price DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    triggered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_profile_id, product_id)
);

CREATE TABLE IF NOT EXISTS price_alert_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    price_alert_id UUID NOT NULL REFERENCES price_alerts(id) ON DELETE CASCADE,
    triggered_price DECIMAL(10,2) NOT NULL,
    target_price DECIMAL(10,2) NOT NULL,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_profile ON push_subscriptions(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_user_product ON price_alerts(user_profile_id, product_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_active ON price_alerts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at DESC);

-- Row Level Security Policies
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_alert_logs ENABLE ROW LEVEL SECURITY;

-- Push subscriptions are viewable/editable by owner
CREATE POLICY "Push subscriptions are viewable by owner" ON push_subscriptions
    FOR ALL USING (auth.uid() = (SELECT user_id FROM user_profiles WHERE id = user_profile_id));

-- Notification logs are viewable by admins only
CREATE POLICY "Notification logs are viewable by admins" ON notification_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'ADMIN'
        )
    );

-- Price alerts are viewable/editable by owner
CREATE POLICY "Price alerts are viewable by owner" ON price_alerts
    FOR ALL USING (auth.uid() = (SELECT user_id FROM user_profiles WHERE id = user_profile_id));

-- Price alert logs are viewable by owner
CREATE POLICY "Price alert logs are viewable by owner" ON price_alert_logs
    FOR SELECT USING (
        auth.uid() = (
            SELECT up.user_id 
            FROM user_profiles up
            JOIN price_alerts pa ON pa.user_profile_id = up.id
            WHERE pa.id = price_alert_logs.price_alert_id
        )
    );