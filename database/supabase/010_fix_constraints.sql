-- =====================================================
-- Migration: Fix Constraint Errors for Orders and Customers
-- =====================================================
-- This migration fixes mismatches between app code and database schema:
-- 1. Orders status: app uses 'pending', 'in-progress', 'completed' but DB had 'draft', 'confirmed', 'completed', 'cancelled'
-- 2. Customers: missing 'no_boxes' column that app tries to insert

-- =====================================================
-- FIX 1: Update Orders status CHECK constraint
-- =====================================================

-- Drop the existing constraint first
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add the new constraint matching app values
ALTER TABLE orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'in-progress', 'completed', 'draft', 'confirmed', 'cancelled'));

-- Update any existing 'draft' status to 'pending' for consistency
UPDATE orders SET status = 'pending' WHERE status = 'draft';

-- Update any existing 'confirmed' status to 'in-progress' for consistency  
UPDATE orders SET status = 'in-progress' WHERE status = 'confirmed';

-- =====================================================
-- FIX 2: Add missing columns to customers
-- =====================================================

-- Add spice_preference column if it doesn't exist
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS spice_preference TEXT DEFAULT 'normal'
CHECK (spice_preference IN ('mild', 'normal'));

-- Add no_boxes column if it doesn't exist
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS no_boxes BOOLEAN DEFAULT FALSE;

-- Update existing customers based on their known preferences
-- Normal spice customers
UPDATE customers SET spice_preference = 'normal' WHERE name ILIKE '%haji%';
UPDATE customers SET spice_preference = 'normal' WHERE name ILIKE '%saffron%';
UPDATE customers SET spice_preference = 'normal' WHERE name ILIKE '%halalnivore%';

-- Mild spice customers
UPDATE customers SET spice_preference = 'mild' WHERE name ILIKE '%lmc%';
UPDATE customers SET spice_preference = 'mild' WHERE name ILIKE '%aldens%';

-- Set no_boxes = true for Saffron (they don't want boxes)
UPDATE customers SET no_boxes = TRUE WHERE name ILIKE '%saffron%';

-- =====================================================
-- VERIFY: Check the constraints are correct
-- =====================================================

-- Show orders status values
SELECT DISTINCT status FROM orders;

-- Show customers with columns
SELECT id, name, spice_preference, no_boxes FROM customers ORDER BY name;

