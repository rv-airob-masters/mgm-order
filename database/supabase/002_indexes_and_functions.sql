-- =====================================================
-- Sausage & Burger Packing Assistant
-- PostgreSQL Indexes and Functions
-- Migration: 002_indexes_and_functions
-- =====================================================

-- =====================================================
-- INDEXES
-- =====================================================

-- Customers
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_sync_status ON customers(sync_status);
CREATE INDEX idx_customers_active ON customers(is_active);

-- Products
CREATE INDEX idx_products_type ON products(type);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);

-- Customer Packaging Rules
CREATE INDEX idx_cpr_customer ON customer_packaging_rules(customer_id);
CREATE INDEX idx_cpr_product ON customer_packaging_rules(product_id);

-- Orders
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_sync_status ON orders(sync_status);
CREATE INDEX idx_orders_number ON orders(order_number);

-- Order Items
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- Sync Log
CREATE INDEX idx_sync_log_entity ON sync_log(entity_type, entity_id);
CREATE INDEX idx_sync_log_status ON sync_log(status);
CREATE INDEX idx_sync_log_created ON sync_log(created_at);

-- =====================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to relevant tables
CREATE TRIGGER update_product_categories_updated_at
    BEFORE UPDATE ON product_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_packaging_rules_updated_at
    BEFORE UPDATE ON customer_packaging_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ORDER NUMBER GENERATION FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
    year_part TEXT;
    sequence_num INTEGER;
    new_order_number TEXT;
BEGIN
    year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
    
    -- Get the next sequence number for this year
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(order_number FROM 10) AS INTEGER)
    ), 0) + 1
    INTO sequence_num
    FROM orders
    WHERE order_number LIKE 'ORD-' || year_part || '-%';
    
    -- Format: ORD-YYYY-NNNN
    new_order_number := 'ORD-' || year_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
    
    NEW.order_number := new_order_number;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_order_number_trigger
    BEFORE INSERT ON orders
    FOR EACH ROW
    WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
    EXECUTE FUNCTION generate_order_number();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_packaging_rules ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all data
CREATE POLICY "Allow authenticated read access" ON customers
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read access" ON orders
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read access" ON order_items
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read access" ON products
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read access" ON product_categories
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read access" ON customer_packaging_rules
    FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to insert/update/delete
CREATE POLICY "Allow authenticated write access" ON customers
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated write access" ON orders
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated write access" ON order_items
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated write access" ON customer_packaging_rules
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

