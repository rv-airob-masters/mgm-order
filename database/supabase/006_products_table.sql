-- =====================================================
-- PRODUCTS TABLE FOR MGM PACKING
-- =====================================================
-- Run this in your Supabase SQL Editor

-- Drop existing table if needed (be careful in production!)
-- DROP TABLE IF EXISTS products CASCADE;

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('sausage', 'burger', 'meatball')),
    tray_weight_kg DECIMAL(5,3) DEFAULT 0.4,
    trays_per_box INTEGER DEFAULT 20,
    tub_weight_kg_5 DECIMAL(5,2) DEFAULT 5,
    tub_weight_kg_2 DECIMAL(5,2) DEFAULT 2,
    tubs_per_box_5kg INTEGER DEFAULT 3,
    tubs_per_box_2kg INTEGER DEFAULT 7,
    count_per_tub INTEGER,  -- For meatballs
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create customer_products junction table (which products are defaults for which customers)
CREATE TABLE IF NOT EXISTS customer_products (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    pack_type TEXT NOT NULL CHECK (pack_type IN ('tray', 'tub')),
    order_by TEXT NOT NULL DEFAULT 'kg' CHECK (order_by IN ('kg', 'count', 'trays')),
    tub_size TEXT CHECK (tub_size IN ('2kg', '5kg')),
    is_regular BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(customer_id, product_id)
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_products ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products
DROP POLICY IF EXISTS "Allow all operations on products" ON products;
CREATE POLICY "Allow all operations on products" ON products
    FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for customer_products
DROP POLICY IF EXISTS "Allow all operations on customer_products" ON customer_products;
CREATE POLICY "Allow all operations on customer_products" ON customer_products
    FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON products TO anon;
GRANT ALL ON products TO authenticated;
GRANT ALL ON customer_products TO anon;
GRANT ALL ON customer_products TO authenticated;

-- Insert default products (matching ALL_PRODUCTS in store)
INSERT INTO products (id, name, category, tray_weight_kg, trays_per_box, tub_weight_kg_5, tub_weight_kg_2, tubs_per_box_5kg, tubs_per_box_2kg, count_per_tub)
VALUES 
    ('chicken-sausage', 'Chicken Sausage', 'sausage', 0.4, 20, 5, 2, 3, 7, NULL),
    ('chicken-sausage-50g', 'Chicken Sausage (50g)', 'sausage', 0.4, 20, 5, 2, 3, 7, NULL),
    ('chicken-sausage-30g', 'Chicken Sausage (30g)', 'sausage', 0.4, 20, 5, 2, 3, 7, NULL),
    ('chicken-sausage-60g', 'Chicken Sausage (60g)', 'sausage', 0.4, 20, 5, 2, 3, 7, NULL),
    ('beef-sausage', 'Beef Sausage', 'sausage', 0.4, 20, 5, 2, 3, 7, NULL),
    ('lamb-sausage', 'Lamb Sausage', 'sausage', 0.4, 20, 5, 2, 3, 7, NULL),
    ('veal-sausage', 'Veal Sausage', 'sausage', 0.4, 20, 5, 2, 3, 7, NULL),
    ('beef-meatballs', 'Beef Meatballs', 'meatball', 0.4, 20, 5, 2, 3, 7, 20),
    ('beef-burger', 'Beef Burger', 'burger', 0.68, 10, 5, 2, 3, 7, NULL),
    ('lamb-burger', 'Lamb Burger', 'burger', 0.68, 10, 5, 2, 3, 7, NULL)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    updated_at = NOW();

