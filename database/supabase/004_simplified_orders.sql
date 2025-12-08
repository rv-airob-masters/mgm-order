-- =====================================================
-- Simplified Orders Table for MGM Packing App
-- This schema matches the web app's data structure
-- Run this in your NEW Supabase project SQL Editor
-- =====================================================

-- Drop existing tables if they exist (for fresh start)
DROP TABLE IF EXISTS orders CASCADE;

-- Create orders table with JSONB items
CREATE TABLE orders (
    id TEXT PRIMARY KEY,
    order_number TEXT NOT NULL UNIQUE,
    customer_id TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    order_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'completed', 'cancelled')),
    total_boxes INTEGER DEFAULT 0,
    total_weight DECIMAL(10,2) DEFAULT 0,
    total_trays INTEGER DEFAULT 0,
    total_tubs INTEGER DEFAULT 0,
    items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_order_date ON orders(order_date);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER orders_updated_at_trigger
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_orders_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- For now, allow all operations (no auth required)
-- =====================================================

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anonymous users (using anon key)
CREATE POLICY "Allow all operations" ON orders
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Grant permissions to anon role
GRANT ALL ON orders TO anon;
GRANT ALL ON orders TO authenticated;

