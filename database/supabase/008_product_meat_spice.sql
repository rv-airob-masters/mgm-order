-- =====================================================
-- Migration: Add meat_type and spice_type to products
-- =====================================================
-- This migration adds columns for grouping products by meat type and spice level
-- Used for dashboard breakdown by meat type (e.g., Chicken Sausages Mild: 450kg)

-- Add meat_type column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS meat_type TEXT DEFAULT 'mixed'
CHECK (meat_type IN ('chicken', 'beef', 'lamb', 'veal', 'mixed'));

-- Add spice_type column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS spice_type TEXT DEFAULT 'normal'
CHECK (spice_type IN ('mild', 'normal', 'none'));

-- Update existing products with appropriate meat types based on their names
UPDATE products SET meat_type = 'chicken' WHERE name ILIKE '%chicken%';
UPDATE products SET meat_type = 'beef' WHERE name ILIKE '%beef%';
UPDATE products SET meat_type = 'lamb' WHERE name ILIKE '%lamb%';
UPDATE products SET meat_type = 'veal' WHERE name ILIKE '%veal%';

-- Set spice_type to 'none' for burgers and meatballs
UPDATE products SET spice_type = 'none' WHERE category IN ('burger', 'meatball');

-- Set spice_type to 'mild' for products with 'mild' in the name
UPDATE products SET spice_type = 'mild' WHERE name ILIKE '%mild%';

-- Add new mild spice product variants if they don't exist
INSERT INTO products (id, name, category, meat_type, spice_type, tray_weight_kg, trays_per_box, tub_weight_kg_5, tub_weight_kg_2, tubs_per_box_5kg, tubs_per_box_2kg)
VALUES 
    ('chicken-sausage-mild', 'Chicken Sausage (Mild)', 'sausage', 'chicken', 'mild', 0.4, 20, 5, 2, 3, 7),
    ('beef-sausage-mild', 'Beef Sausage (Mild)', 'sausage', 'beef', 'mild', 0.4, 20, 5, 2, 3, 7),
    ('lamb-sausage-mild', 'Lamb Sausage (Mild)', 'sausage', 'lamb', 'mild', 0.4, 20, 5, 2, 3, 7),
    ('veal-sausage-mild', 'Veal Sausage (Mild)', 'sausage', 'veal', 'mild', 0.4, 20, 5, 2, 3, 7)
ON CONFLICT (id) DO UPDATE SET
    meat_type = EXCLUDED.meat_type,
    spice_type = EXCLUDED.spice_type;

-- Create index for efficient grouping by meat type and spice
CREATE INDEX IF NOT EXISTS idx_products_meat_spice ON products(meat_type, spice_type);

-- Verify the changes
SELECT id, name, category, meat_type, spice_type FROM products ORDER BY category, meat_type, spice_type, name;

