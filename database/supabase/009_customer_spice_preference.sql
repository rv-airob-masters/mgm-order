-- =====================================================
-- Migration: Add spice_preference to customers
-- =====================================================
-- Each customer has a preferred spice level for sausages:
-- - 'normal' = Haji Baba, Saffron, Halalnivore
-- - 'mild' = LMC, Aldens

-- Add spice_preference column
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS spice_preference TEXT DEFAULT 'normal'
CHECK (spice_preference IN ('mild', 'normal'));

-- Update existing customers based on their known preferences
-- Normal spice customers
UPDATE customers SET spice_preference = 'normal' WHERE name ILIKE '%haji%';
UPDATE customers SET spice_preference = 'normal' WHERE name ILIKE '%saffron%';
UPDATE customers SET spice_preference = 'normal' WHERE name ILIKE '%halalnivore%';

-- Mild spice customers
UPDATE customers SET spice_preference = 'mild' WHERE name ILIKE '%lmc%';
UPDATE customers SET spice_preference = 'mild' WHERE name ILIKE '%aldens%';

-- Verify the changes
SELECT id, name, default_sausage_pack_type, spice_preference FROM customers ORDER BY name;

