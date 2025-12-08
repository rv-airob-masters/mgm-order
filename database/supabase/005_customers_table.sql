-- =====================================================
-- Customers Table for MGM Packing App
-- Run this in your Supabase project SQL Editor
-- =====================================================

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact_phone TEXT,
    contact_email TEXT,
    address TEXT,
    special_instructions TEXT,
    default_sausage_pack_type TEXT DEFAULT 'tray' CHECK (default_sausage_pack_type IN ('tray', 'tub')),
    is_active BOOLEAN DEFAULT TRUE,
    sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('pending', 'synced', 'conflict')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON customers(is_active);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS customers_updated_at_trigger ON customers;
CREATE TRIGGER customers_updated_at_trigger
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_customers_updated_at();

-- Enable RLS and allow all operations
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on customers" ON customers;
CREATE POLICY "Allow all operations on customers" ON customers
    FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON customers TO anon;
GRANT ALL ON customers TO authenticated;

-- Insert default customers (the 4 main customers)
INSERT INTO customers (id, name, contact_phone, contact_email, address, special_instructions, default_sausage_pack_type, is_active, sync_status)
VALUES 
    ('haji-baba', 'Haji Baba', NULL, NULL, NULL, 'All sausages in 400g trays, 20 trays per box. Burgers: 6x113g per tray.', 'tray', true, 'synced'),
    ('lmc', 'LMC', NULL, NULL, NULL, 'Veal sausages in 5kg or 2kg tubs (3 per box for 5kg, 6 per box for 2kg). Meatballs by count.', 'tub', true, 'synced'),
    ('halalnivore', 'Halalnivore', NULL, NULL, NULL, 'All sausages in 5kg tubs, 3 per box. Round to nearest 4 tubs. Pack of 4 for extras.', 'tub', true, 'synced'),
    ('saffron', 'Saffron', NULL, NULL, NULL, 'Orders by trays. NO BOXES - trays only.', 'tray', true, 'synced')
ON CONFLICT (id) DO NOTHING;

