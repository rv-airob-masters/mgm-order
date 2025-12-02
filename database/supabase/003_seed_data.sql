-- =====================================================
-- Sausage & Burger Packing Assistant
-- Seed Data
-- Migration: 003_seed_data
-- =====================================================

-- =====================================================
-- PRODUCT CATEGORIES
-- =====================================================

INSERT INTO product_categories (id, name, type) VALUES
    ('a1000000-0000-0000-0000-000000000001', 'Sausages', 'sausage'),
    ('a2000000-0000-0000-0000-000000000002', 'Burgers', 'burger');

-- =====================================================
-- PRODUCTS - SAUSAGES
-- =====================================================

INSERT INTO products (id, category_id, name, type, default_tray_weight_kg, default_trays_per_box, default_tub_weight_kg, default_tubs_per_box) VALUES
    -- Sausages
    ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Chicken Sausage', 'sausage', 0.400, 20, 5.00, 3),
    ('b2000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Beef Sausage', 'sausage', 0.400, 20, 5.00, 3),
    ('b3000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'Lamb Sausage', 'sausage', 0.400, 20, 5.00, 3),
    ('b4000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 'Veal Sausage', 'sausage', 0.400, 20, 5.00, 3);

-- =====================================================
-- PRODUCTS - BURGERS
-- =====================================================

INSERT INTO products (id, category_id, name, type, default_patty_weight_kg, default_patties_per_tray, default_trays_per_box) VALUES
    -- Burgers
    ('c1000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Beef Burger Patty', 'burger', 0.100, 10, 10),
    ('c2000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000002', 'Lamb Burger Patty', 'burger', 0.100, 10, 10);

-- =====================================================
-- SAMPLE CUSTOMERS
-- =====================================================

INSERT INTO customers (id, name, contact_phone, contact_email, address, special_instructions, default_sausage_pack_type) VALUES
    ('d1000000-0000-0000-0000-000000000001', 'ABC Butchers', '+61 400 111 222', 'orders@abcbutchers.com.au', '123 Main Street, Melbourne VIC 3000', 'Deliver before 6am. Use side entrance.', 'tray'),
    ('d2000000-0000-0000-0000-000000000002', 'XYZ Meats', '+61 400 333 444', 'purchasing@xyzmeats.com.au', '456 Smith Road, Sydney NSW 2000', 'Call 30 minutes before delivery.', 'tub'),
    ('d3000000-0000-0000-0000-000000000003', 'Fresh Foods Co', '+61 400 555 666', 'orders@freshfoods.com.au', '789 Queen Street, Brisbane QLD 4000', 'Mixed packing required. See individual product settings.', 'tray');

-- =====================================================
-- SAMPLE CUSTOMER PACKAGING RULES (for Mixed customer)
-- =====================================================

-- Fresh Foods Co - Custom rules (mixed packing)
INSERT INTO customer_packaging_rules (customer_id, product_id, pack_type, tray_weight_kg, trays_per_box) VALUES
    -- Chicken in trays
    ('d3000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001', 'tray', 0.400, 20);

INSERT INTO customer_packaging_rules (customer_id, product_id, pack_type, tub_weight_kg, tubs_per_box) VALUES
    -- Lamb in tubs
    ('d3000000-0000-0000-0000-000000000003', 'b3000000-0000-0000-0000-000000000003', 'tub', 5.00, 3);

-- XYZ Meats - All sausages in tubs
INSERT INTO customer_packaging_rules (customer_id, product_id, pack_type, tub_weight_kg, tubs_per_box) VALUES
    ('d2000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'tub', 5.00, 3),
    ('d2000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000002', 'tub', 5.00, 3),
    ('d2000000-0000-0000-0000-000000000002', 'b3000000-0000-0000-0000-000000000003', 'tub', 5.00, 3),
    ('d2000000-0000-0000-0000-000000000002', 'b4000000-0000-0000-0000-000000000004', 'tub', 5.00, 3);

-- ABC Butchers - All sausages in trays (using defaults, but adding custom burger config)
INSERT INTO customer_packaging_rules (customer_id, product_id, pack_type, patty_weight_kg, patties_per_tray, trays_per_box) VALUES
    ('d1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'tray', 0.150, 8, 12);

-- =====================================================
-- SAMPLE DEFAULT USER
-- =====================================================

INSERT INTO users (id, email, name, role) VALUES
    ('e1000000-0000-0000-0000-000000000001', 'operator@mgmpacking.com', 'Default Operator', 'operator');

