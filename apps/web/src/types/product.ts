// Product types - shared between store and sync service

export interface Product {
  id: string;
  name: string;
  category: 'sausage' | 'burger' | 'meatball';
  trayWeightKg: number;
  traysPerBox: number;
  tubWeightKg5: number;
  tubWeightKg2: number;
  tubsPerBox5kg: number;
  tubsPerBox2kg: number;
  countPerTub?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerProductLink {
  id: string;
  customerId: string;
  productId: string;
  packType: 'tray' | 'tub';
  orderBy: 'kg' | 'count' | 'trays';
  tubSize?: '2kg' | '5kg';
  isRegular: boolean;
  createdAt: Date;
}

// Database row types (snake_case)
export interface DbProduct {
  id: string;
  name: string;
  category: string;
  tray_weight_kg: number;
  trays_per_box: number;
  tub_weight_kg_5: number;
  tub_weight_kg_2: number;
  tubs_per_box_5kg: number;
  tubs_per_box_2kg: number;
  count_per_tub: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbCustomerProduct {
  id: string;
  customer_id: string;
  product_id: string;
  pack_type: string;
  order_by: string;
  tub_size: string | null;
  is_regular: boolean;
  created_at: string;
}

// Convert from database format to app format
export function fromDbProduct(db: DbProduct): Product {
  return {
    id: db.id,
    name: db.name,
    category: db.category as Product['category'],
    trayWeightKg: Number(db.tray_weight_kg),
    traysPerBox: db.trays_per_box,
    tubWeightKg5: Number(db.tub_weight_kg_5),
    tubWeightKg2: Number(db.tub_weight_kg_2),
    tubsPerBox5kg: db.tubs_per_box_5kg,
    tubsPerBox2kg: db.tubs_per_box_2kg,
    countPerTub: db.count_per_tub ?? undefined,
    isActive: db.is_active,
    createdAt: new Date(db.created_at),
    updatedAt: new Date(db.updated_at),
  };
}

// Convert from app format to database format
export function toDbProduct(product: Omit<Product, 'createdAt' | 'updatedAt'>): Omit<DbProduct, 'created_at' | 'updated_at'> {
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    tray_weight_kg: product.trayWeightKg,
    trays_per_box: product.traysPerBox,
    tub_weight_kg_5: product.tubWeightKg5,
    tub_weight_kg_2: product.tubWeightKg2,
    tubs_per_box_5kg: product.tubsPerBox5kg,
    tubs_per_box_2kg: product.tubsPerBox2kg,
    count_per_tub: product.countPerTub ?? null,
    is_active: product.isActive,
  };
}

