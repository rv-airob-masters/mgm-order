import * as SQLite from 'expo-sqlite';

const DB_NAME = 'mgm_packing.db';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    await initializeSchema();
  }
  return db;
}

async function initializeSchema(): Promise<void> {
  if (!db) return;
  
  await db.execAsync(`
    -- Product Categories
    CREATE TABLE IF NOT EXISTS product_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('sausage', 'burger')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Products
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      category_id TEXT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('sausage', 'burger')),
      default_tray_weight_kg REAL DEFAULT 0.4,
      default_trays_per_box INTEGER DEFAULT 20,
      default_tub_weight_kg REAL DEFAULT 5.0,
      default_tubs_per_box INTEGER DEFAULT 3,
      default_patty_weight_kg REAL DEFAULT 0.1,
      default_patties_per_tray INTEGER DEFAULT 10,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Customers
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      contact_phone TEXT,
      contact_email TEXT,
      address TEXT,
      special_instructions TEXT,
      default_sausage_pack_type TEXT DEFAULT 'tray',
      is_active INTEGER NOT NULL DEFAULT 1,
      sync_status TEXT DEFAULT 'synced',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Customer Packaging Rules
    CREATE TABLE IF NOT EXISTS customer_packaging_rules (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      pack_type TEXT NOT NULL,
      tray_weight_kg REAL,
      trays_per_box INTEGER,
      tub_weight_kg REAL,
      tubs_per_box INTEGER,
      patty_weight_kg REAL,
      patties_per_tray INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(customer_id, product_id)
    );

    -- Orders
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      order_number TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'draft',
      order_date TEXT NOT NULL,
      notes TEXT,
      total_trays INTEGER DEFAULT 0,
      total_tubs INTEGER DEFAULT 0,
      total_boxes INTEGER DEFAULT 0,
      total_weight_kg REAL DEFAULT 0,
      sync_status TEXT DEFAULT 'pending',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Order Items
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity_kg REAL NOT NULL,
      quantity_tubs INTEGER,
      pack_type_used TEXT NOT NULL,
      calculated_trays INTEGER DEFAULT 0,
      calculated_tubs INTEGER DEFAULT 0,
      calculated_boxes INTEGER NOT NULL,
      tray_weight_used REAL,
      tub_weight_used REAL,
      trays_per_box_used INTEGER,
      tubs_per_box_used INTEGER,
      patty_weight_used REAL,
      patties_per_tray_used INTEGER,
      created_at TEXT NOT NULL
    );

    -- Sync Queue
    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      payload TEXT,
      retry_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      error_message TEXT,
      created_at TEXT NOT NULL,
      processed_at TEXT
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
    CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
    CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date);
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
  `);
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}

