// =====================================================
// Sausage & Burger Packing Assistant
// Shared Type Definitions
// =====================================================

// =====================================================
// ENUMS
// =====================================================

export type PackType = 'tray' | 'tub';
export type ProductType = 'sausage' | 'burger';
export type OrderStatus = 'pending' | 'in-progress' | 'completed';
export type SyncStatus = 'pending' | 'synced' | 'conflict';
export type UserRole = 'admin' | 'operator' | 'viewer';
export type SpicePreference = 'mild' | 'normal';

// =====================================================
// PRODUCT CATEGORY
// =====================================================

export interface ProductCategory {
  id: string;
  name: string;
  type: ProductType;
  createdAt: Date;
  updatedAt: Date;
}

// =====================================================
// PRODUCT
// =====================================================

export interface Product {
  id: string;
  categoryId: string | null;
  name: string;
  type: ProductType;
  // Default tray-based packaging
  defaultTrayWeightKg: number;
  defaultTraysPerBox: number;
  // Default tub-based packaging
  defaultTubWeightKg: number;
  defaultTubsPerBox: number;
  // Burger-specific defaults
  defaultPattyWeightKg: number;
  defaultPattiesPerTray: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// =====================================================
// CUSTOMER
// =====================================================

export interface Customer {
  id: string;
  name: string;
  contactPhone: string | null;
  contactEmail: string | null;
  address: string | null;
  specialInstructions: string | null;
  defaultSausagePackType: PackType;
  spicePreference: SpicePreference;  // Customer's preferred spice level for sausages
  noBoxes?: boolean;  // If true, orders for this customer default to no boxes
  isActive: boolean;
  syncStatus: SyncStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerWithRules extends Customer {
  packagingRules: CustomerPackagingRule[];
}

// =====================================================
// CUSTOMER PACKAGING RULE
// =====================================================

export interface CustomerPackagingRule {
  id: string;
  customerId: string;
  productId: string;
  packType: PackType;
  // Tray-based settings
  trayWeightKg: number | null;
  traysPerBox: number | null;
  // Tub-based settings
  tubWeightKg: number | null;
  tubsPerBox: number | null;
  // Burger-specific settings
  pattyWeightKg: number | null;
  pattiesPerTray: number | null;
  createdAt: Date;
  updatedAt: Date;
}

// =====================================================
// ORDER
// =====================================================

export interface Order {
  id: string;
  customerId: string;
  createdByUserId: string | null;
  orderNumber: string;
  status: OrderStatus;
  orderDate: Date;
  notes: string | null;
  totalTrays: number;
  totalTubs: number;
  totalBoxes: number;
  totalWeightKg: number;
  syncStatus: SyncStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderWithDetails extends Order {
  customer: Customer;
  items: OrderItem[];
}

// =====================================================
// ORDER ITEM
// =====================================================

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantityKg: number;
  quantityTubs: number | null;
  packTypeUsed: PackType;
  calculatedTrays: number;
  calculatedTubs: number;
  calculatedBoxes: number;
  // Snapshot of config used
  trayWeightUsed: number | null;
  tubWeightUsed: number | null;
  traysPerBoxUsed: number | null;
  tubsPerBoxUsed: number | null;
  pattyWeightUsed: number | null;
  pattiesPerTrayUsed: number | null;
  createdAt: Date;
}

export interface OrderItemWithProduct extends OrderItem {
  product: Product;
}

// =====================================================
// USER
// =====================================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date | null;
}

// =====================================================
// SYNC
// =====================================================

export interface SyncOperation {
  id: string;
  entityType: 'customer' | 'order' | 'order_item';
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  payload: Record<string, unknown>;
  retryCount: number;
  status: 'pending' | 'in_progress' | 'failed' | 'completed';
  errorMessage: string | null;
  createdAt: Date;
  processedAt: Date | null;
}

