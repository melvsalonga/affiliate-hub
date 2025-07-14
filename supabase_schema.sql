-- Create affiliate_links table
CREATE TABLE IF NOT EXISTS affiliate_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_url TEXT NOT NULL,
    affiliate_url TEXT NOT NULL,
    platform VARCHAR(50) NOT NULL,
    tracking_id VARCHAR(255) NOT NULL UNIQUE,
    commission DECIMAL(5,4) NOT NULL DEFAULT 0.0000,
    clicks INTEGER NOT NULL DEFAULT 0,
    conversions INTEGER NOT NULL DEFAULT 0,
    revenue DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT true,
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create link_clicks table
CREATE TABLE IF NOT EXISTS link_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    link_id UUID NOT NULL REFERENCES affiliate_links(id) ON DELETE CASCADE,
    user_id UUID,
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

-- Create link_conversions table
CREATE TABLE IF NOT EXISTS link_conversions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    link_id UUID NOT NULL REFERENCES affiliate_links(id) ON DELETE CASCADE,
    click_id UUID REFERENCES link_clicks(id) ON DELETE SET NULL,
    user_id UUID,
    order_value DECIMAL(10,2) NOT NULL,
    commission DECIMAL(10,2) NOT NULL,
    conversion_type VARCHAR(50) NOT NULL DEFAULT 'purchase',
    order_id VARCHAR(255),
    product_ids TEXT[],
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_affiliate_links_platform ON affiliate_links(platform);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_is_active ON affiliate_links(is_active);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_created_at ON affiliate_links(created_at);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_tracking_id ON affiliate_links(tracking_id);
CREATE INDEX IF NOT EXISTS idx_link_clicks_link_id ON link_clicks(link_id);
CREATE INDEX IF NOT EXISTS idx_link_clicks_timestamp ON link_clicks(timestamp);
CREATE INDEX IF NOT EXISTS idx_link_conversions_link_id ON link_conversions(link_id);
CREATE INDEX IF NOT EXISTS idx_link_conversions_timestamp ON link_conversions(timestamp);

-- Create stored procedures for incrementing counters
CREATE OR REPLACE FUNCTION increment_link_clicks(link_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE affiliate_links 
    SET clicks = clicks + 1, updated_at = NOW()
    WHERE id = link_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_link_conversions(link_id UUID, revenue_amount DECIMAL)
RETURNS VOID AS $$
BEGIN
    UPDATE affiliate_links 
    SET conversions = conversions + 1, 
        revenue = revenue + revenue_amount,
        updated_at = NOW()
    WHERE id = link_id;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (RLS)
ALTER TABLE affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_conversions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for your security requirements)
-- Note: For production, you should implement proper user authentication and authorization
CREATE POLICY "Allow all operations on affiliate_links" ON affiliate_links
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on link_clicks" ON link_clicks
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on link_conversions" ON link_conversions
    FOR ALL USING (true) WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at column
CREATE TRIGGER update_affiliate_links_updated_at
    BEFORE UPDATE ON affiliate_links
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data (optional - you can remove this section)
INSERT INTO affiliate_links (original_url, affiliate_url, platform, tracking_id, commission, tags, notes) VALUES
('https://www.lazada.com.ph/products/sample-product-1', 'https://www.lazada.com.ph/products/sample-product-1?laz_trackid=demo_tracking&laz_vn_id=demo_vn&tracking_id=track_sample_1', 'lazada', 'track_sample_1', 0.05, ARRAY['electronics', 'gadgets'], 'Sample Lazada product link'),
('https://shopee.ph/sample-product-2', 'https://shopee.ph/sample-product-2?af_siteid=demo_site&pid=demo_partner&tracking_id=track_sample_2', 'shopee', 'track_sample_2', 0.04, ARRAY['fashion', 'clothing'], 'Sample Shopee product link'),
('https://shop.tiktok.com/sample-product-3', 'https://shop.tiktok.com/sample-product-3?partner_id=demo_partner&tracking_id=track_sample_3', 'tiktok', 'track_sample_3', 0.08, ARRAY['beauty', 'cosmetics'], 'Sample TikTok Shop product link')
ON CONFLICT (tracking_id) DO NOTHING;
