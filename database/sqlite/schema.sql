-- =====================================================
-- Sausage & Burger Packing Assistant
-- SQLite Schema for Offline Storage
-- Used by: React Native (expo-sqlite) and Web (sql.js)
-- =====================================================

-- =====================================================
-- PRODUCT CATEGORIES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS product_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('sausage', 'burger')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =====================================================
-- PRODUCTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    category_id TEXT REFERENCES product_categories(id),
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('sausage', 'burger')),
    default_tray_weight_kg REAL DEFAULT 0.4,
    default_trays_per_box INTEGER DEFAULT 20,
    default_tub_weight_kg REAL DEFAULT 5.0,
    default_tubs_per_box INTEGER DEFAULT 3,
    default_patty_weight_kg REAL DEFAULT 0.1,
    default_patties_per_tray INTEGER DEFAULT 10,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =====================================================
-- CUSTOMERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact_phone TEXT,
    contact_email TEXT,
    address TEXT,
    special_instructions TEXT,
    default_sausage_pack_type TEXT DEFAULT 'tray' CHECK (default_sausage_pack_type IN ('tray', 'tub')),
    is_active INTEGER NOT NULL DEFAULT 1,
    sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('pending', 'synced', 'conflict')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =====================================================
-- CUSTOMER PACKAGING RULES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS customer_packaging_rules (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    pack_type TEXT NOT NULL CHECK (pack_type IN ('tray', 'tub')),
    tray_weight_kg REAL,
    trays_per_box INTEGER,
    tub_weight_kg REAL,
    tubs_per_box INTEGER,
    patty_weight_kg REAL,
    patties_per_tray INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(customer_id, product_id)
);

-- =====================================================
-- ORDERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL REFERENCES customers(id),
    created_by_user_id TEXT,
    order_number TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'completed', 'cancelled')),
    order_date TEXT NOT NULL DEFAULT (date('now')),
    notes TEXT,
    total_trays INTEGER DEFAULT 0,
    total_tubs INTEGER DEFAULT 0,
    total_boxes INTEGER DEFAULT 0,
    total_weight_kg REAL DEFAULT 0,
    sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'conflict')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =====================================================
-- ORDER ITEMS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES products(id),
    quantity_kg REAL NOT NULL,
    quantity_tubs INTEGER,
    pack_type_used TEXT NOT NULL CHECK (pack_type_used IN ('tray', 'tub')),
    calculated_trays INTEGER DEFAULT 0,
    calculated_tubs INTEGER DEFAULT 0,
    calculated_boxes INTEGER NOT NULL,
    tray_weight_used REAL,
    tub_weight_used REAL,
    trays_per_box_used INTEGER,
    tubs_per_box_used INTEGER,
    patty_weight_used REAL,
    patties_per_tray_used INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =====================================================
-- SYNC QUEUE TABLE (for offline operations)
-- =====================================================

CREATE TABLE IF NOT EXISTS sync_queue (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
    payload TEXT, -- JSON string
    retry_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'failed', 'completed')),
    error_message TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    processed_at TEXT
);

-- =====================================================
-- APP SETTINGS TABLE (local app config)
-- =====================================================

CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_sync ON customers(sync_status);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_cpr_customer ON customer_packaging_rules(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_sync ON orders(sync_status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);

