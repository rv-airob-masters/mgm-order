// Order types - shared between store and sync service to avoid circular dependency

// Tub sizes: 1kg and 2kg use shallow tubs, 5kg uses deep tubs
export type TubSize = '1kg' | '2kg' | '5kg';

export interface OrderItem {
  productId: string;
  productName: string;
  quantityKg: number;
  quantityCount?: number; // For meatballs ordered by count
  trays: number;
  tubs: number;
  boxes: number;
  packType: 'tray' | 'tub';
  tubSize?: TubSize; // 1kg, 2kg (shallow tubs) or 5kg (deep tubs)
  trayWeight?: number;
  tubWeight?: number;
  traysPerBox?: number;
  tubsPerBox?: number;
  isCompleted?: boolean; // Track if this item is packed/done
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  orderDate: string;
  status: 'draft' | 'confirmed' | 'completed' | 'cancelled';
  totalBoxes: number;
  totalWeight: number;
  totalTrays: number;
  totalTubs: number;
  items: OrderItem[];
}

