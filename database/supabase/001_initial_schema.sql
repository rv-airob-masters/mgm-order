-- =====================================================
-- Sausage & Burger Packing Assistant
-- PostgreSQL Schema for Supabase
-- Migration: 001_initial_schema
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUM TYPES
-- =====================================================

CREATE TYPE pack_type AS ENUM ('tray', 'tub');
CREATE TYPE product_type AS ENUM ('sausage', 'burger');
CREATE TYPE order_status AS ENUM ('draft', 'confirmed', 'completed', 'cancelled');
CREATE TYPE sync_status AS ENUM ('pending', 'synced', 'conflict');
CREATE TYPE user_role AS ENUM ('admin', 'operator', 'viewer');

-- =====================================================
-- PRODUCT CATEGORIES TABLE
-- =====================================================

CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    type product_type NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- PRODUCTS TABLE
-- =====================================================

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL UNIQUE,
    type product_type NOT NULL,
    -- Default tray-based packaging
    default_tray_weight_kg DECIMAL(5,3) DEFAULT 0.4,
    default_trays_per_box INTEGER DEFAULT 20,
    -- Default tub-based packaging
    default_tub_weight_kg DECIMAL(5,2) DEFAULT 5.0,
    default_tubs_per_box INTEGER DEFAULT 3,
    -- Burger-specific defaults
    default_patty_weight_kg DECIMAL(5,3) DEFAULT 0.1,
    default_patties_per_tray INTEGER DEFAULT 10,
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- CUSTOMERS TABLE
-- =====================================================

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    address TEXT,
    special_instructions TEXT,
    default_sausage_pack_type pack_type DEFAULT 'tray',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sync_status sync_status DEFAULT 'synced',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- CUSTOMER PACKAGING RULES TABLE
-- =====================================================

CREATE TABLE customer_packaging_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    pack_type pack_type NOT NULL,
    -- Tray-based settings
    tray_weight_kg DECIMAL(5,3),
    trays_per_box INTEGER,
    -- Tub-based settings
    tub_weight_kg DECIMAL(5,2),
    tubs_per_box INTEGER,
    -- Burger-specific settings
    patty_weight_kg DECIMAL(5,3),
    patties_per_tray INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Ensure one rule per customer-product combination
    UNIQUE(customer_id, product_id)
);

-- =====================================================
-- USERS TABLE (Optional - for multi-user support)
-- =====================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'operator',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- =====================================================
-- ORDERS TABLE
-- =====================================================

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    order_number VARCHAR(20) NOT NULL UNIQUE,
    status order_status NOT NULL DEFAULT 'draft',
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    -- Calculated totals (stored for quick access)
    total_trays INTEGER DEFAULT 0,
    total_tubs INTEGER DEFAULT 0,
    total_boxes INTEGER DEFAULT 0,
    total_weight_kg DECIMAL(10,2) DEFAULT 0,
    sync_status sync_status DEFAULT 'synced',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- ORDER ITEMS TABLE
-- =====================================================

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    -- Input values
    quantity_kg DECIMAL(10,2) NOT NULL,
    quantity_tubs INTEGER, -- For tub-based input
    -- Pack type used for this item
    pack_type_used pack_type NOT NULL,
    -- Calculated results
    calculated_trays INTEGER DEFAULT 0,
    calculated_tubs INTEGER DEFAULT 0,
    calculated_boxes INTEGER NOT NULL,
    -- Packaging config snapshot (what was used at order time)
    tray_weight_used DECIMAL(5,3),
    tub_weight_used DECIMAL(5,2),
    trays_per_box_used INTEGER,
    tubs_per_box_used INTEGER,
    patty_weight_used DECIMAL(5,3),
    patties_per_tray_used INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- SYNC LOG TABLE (for offline sync tracking)
-- =====================================================

CREATE TABLE sync_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    operation VARCHAR(20) NOT NULL, -- 'create', 'update', 'delete'
    payload JSONB,
    device_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    synced_at TIMESTAMPTZ
);
