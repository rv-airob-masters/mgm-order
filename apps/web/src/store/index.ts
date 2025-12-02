import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Customer, PackType } from '@mgm/shared';

export interface OrderItem {
  productId: string;
  productName: string;
  quantityKg: number;
  quantityCount?: number; // For meatballs ordered by count
  trays: number;
  tubs: number;
  boxes: number;
  packType: 'tray' | 'tub';
  tubSize?: '2kg' | '5kg'; // For LMC veal tub size option
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

// Customer-specific product configuration
export interface CustomerProduct {
  productId: string;
  productName: string;
  packType: 'tray' | 'tub';
  orderBy: 'kg' | 'count' | 'trays'; // How customer orders
  tubSize?: '2kg' | '5kg';
  isRegular: boolean; // Show by default
}

// Customer rules configuration
export interface CustomerRules {
  customerId: string;
  customerName: string;
  regularProducts: CustomerProduct[];
  packingRules: {
    traysPerBox?: number;
    tubsPerBox5kg?: number;
    tubsPerBox2kg?: number;
    roundingRule?: 'up' | 'down' | 'nearest' | 'none';
    roundToMultiple?: number; // Round trays to multiple of this
    noBoxes?: boolean; // Saffron doesn't want boxes
    extraTubRule?: 'pack4' | 'none'; // Halalnivore rule for extra tub
  };
}

// All available products in the system
export interface ProductConfig {
  id: string;
  name: string;
  category: 'sausage' | 'burger' | 'meatball';
  trayWeightKg: number;
  traysPerBox: number;
  tubWeightKg5: number; // 5kg tub
  tubWeightKg2: number; // 2kg tub
  tubsPerBox5kg: number;
  tubsPerBox2kg: number;
  countPerTub?: number; // For meatballs
}

export const ALL_PRODUCTS: ProductConfig[] = [
  // Sausages
  { id: 'chicken-sausage', name: 'Chicken Sausage', category: 'sausage', trayWeightKg: 0.4, traysPerBox: 20, tubWeightKg5: 5, tubWeightKg2: 2, tubsPerBox5kg: 3, tubsPerBox2kg: 7 },
  { id: 'chicken-sausage-50g', name: 'Chicken Sausage (50g)', category: 'sausage', trayWeightKg: 0.4, traysPerBox: 20, tubWeightKg5: 5, tubWeightKg2: 2, tubsPerBox5kg: 3, tubsPerBox2kg: 7 },
  { id: 'chicken-sausage-30g', name: 'Chicken Sausage (30g)', category: 'sausage', trayWeightKg: 0.4, traysPerBox: 20, tubWeightKg5: 5, tubWeightKg2: 2, tubsPerBox5kg: 3, tubsPerBox2kg: 7 },
  { id: 'chicken-sausage-60g', name: 'Chicken Sausage (60g)', category: 'sausage', trayWeightKg: 0.4, traysPerBox: 20, tubWeightKg5: 5, tubWeightKg2: 2, tubsPerBox5kg: 3, tubsPerBox2kg: 7 },
  { id: 'beef-sausage', name: 'Beef Sausage', category: 'sausage', trayWeightKg: 0.4, traysPerBox: 20, tubWeightKg5: 5, tubWeightKg2: 2, tubsPerBox5kg: 3, tubsPerBox2kg: 7 },
  { id: 'lamb-sausage', name: 'Lamb Sausage', category: 'sausage', trayWeightKg: 0.4, traysPerBox: 20, tubWeightKg5: 5, tubWeightKg2: 2, tubsPerBox5kg: 3, tubsPerBox2kg: 7 },
  { id: 'veal-sausage', name: 'Veal Sausage', category: 'sausage', trayWeightKg: 0.4, traysPerBox: 20, tubWeightKg5: 5, tubWeightKg2: 2, tubsPerBox5kg: 3, tubsPerBox2kg: 7 },
  // Burgers
  { id: 'beef-burger', name: 'Beef Burger', category: 'burger', trayWeightKg: 1, traysPerBox: 10, tubWeightKg5: 5, tubWeightKg2: 2, tubsPerBox5kg: 3, tubsPerBox2kg: 7 },
  { id: 'lamb-kofte', name: 'Lamb Kofte', category: 'burger', trayWeightKg: 1, traysPerBox: 10, tubWeightKg5: 5, tubWeightKg2: 2, tubsPerBox5kg: 3, tubsPerBox2kg: 7 },
  { id: 'beef-cj', name: 'Beef C&J', category: 'burger', trayWeightKg: 1, traysPerBox: 10, tubWeightKg5: 5, tubWeightKg2: 2, tubsPerBox5kg: 3, tubsPerBox2kg: 7 },
  // Meatballs
  { id: 'beef-meatballs', name: 'Beef Meatballs', category: 'meatball', trayWeightKg: 1, traysPerBox: 10, tubWeightKg5: 5, tubWeightKg2: 2, tubsPerBox5kg: 3, tubsPerBox2kg: 7, countPerTub: 20 },
];

// Customer-specific rules
export const CUSTOMER_RULES: CustomerRules[] = [
  {
    customerId: 'haji-baba',
    customerName: 'Haji Baba',
    regularProducts: [
      { productId: 'chicken-sausage', productName: 'Chicken Sausage', packType: 'tray', orderBy: 'kg', isRegular: true },
      { productId: 'beef-sausage', productName: 'Beef Sausage', packType: 'tray', orderBy: 'kg', isRegular: true },
    ],
    packingRules: {
      traysPerBox: 20,
      roundingRule: 'down',
      roundToMultiple: 20, // Round trays to multiple of 20
    },
  },
  {
    customerId: 'lmc',
    customerName: 'LMC',
    regularProducts: [
      { productId: 'chicken-sausage-50g', productName: 'Chicken Sausage (50g)', packType: 'tub', orderBy: 'kg', tubSize: '5kg', isRegular: true },
      { productId: 'chicken-sausage-30g', productName: 'Chicken Sausage (30g)', packType: 'tub', orderBy: 'kg', tubSize: '5kg', isRegular: true },
      { productId: 'beef-sausage', productName: 'Beef Sausage', packType: 'tub', orderBy: 'kg', tubSize: '5kg', isRegular: true },
      { productId: 'lamb-sausage', productName: 'Lamb Sausage', packType: 'tub', orderBy: 'kg', tubSize: '5kg', isRegular: true },
      { productId: 'veal-sausage', productName: 'Veal Sausage', packType: 'tub', orderBy: 'kg', tubSize: '5kg', isRegular: true }, // Can be 2kg or 5kg
      { productId: 'beef-meatballs', productName: 'Beef Meatballs', packType: 'tub', orderBy: 'count', isRegular: true },
    ],
    packingRules: {
      tubsPerBox5kg: 3,
      tubsPerBox2kg: 7,
      roundingRule: 'up',
    },
  },
  {
    customerId: 'halalnivore',
    customerName: 'Halalnivore',
    regularProducts: [
      { productId: 'chicken-sausage-60g', productName: 'Chicken Sausage (60g)', packType: 'tub', orderBy: 'kg', tubSize: '5kg', isRegular: true },
      { productId: 'chicken-sausage-30g', productName: 'Chicken Sausage (30g)', packType: 'tub', orderBy: 'kg', tubSize: '5kg', isRegular: true },
    ],
    packingRules: {
      tubsPerBox5kg: 3,
      roundingRule: 'up',
      extraTubRule: 'pack4', // If 1 extra tub, pack as box of 4
    },
  },
  {
    customerId: 'saffron',
    customerName: 'Saffron',
    regularProducts: [
      { productId: 'chicken-sausage', productName: 'Chicken Sausage', packType: 'tray', orderBy: 'trays', isRegular: true },
      { productId: 'beef-sausage', productName: 'Beef Sausage', packType: 'tray', orderBy: 'trays', isRegular: true },
      { productId: 'lamb-sausage', productName: 'Lamb Sausage', packType: 'tray', orderBy: 'trays', isRegular: true },
      { productId: 'beef-burger', productName: 'Beef Burger', packType: 'tray', orderBy: 'trays', isRegular: true },
      { productId: 'lamb-kofte', productName: 'Lamb Kofte', packType: 'tray', orderBy: 'trays', isRegular: true },
      { productId: 'beef-cj', productName: 'Beef C&J', packType: 'tray', orderBy: 'trays', isRegular: true },
    ],
    packingRules: {
      noBoxes: true, // They don't want boxes
    },
  },
];

type OrderStatus = 'draft' | 'confirmed' | 'completed' | 'cancelled';

interface AppStore {
  // Customers
  customers: Customer[];
  addCustomer: (customer: Customer) => void;

  // Orders
  orders: Order[];
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  getNextOrderNumber: () => string;
}

// Initial customers - the real ones
const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'haji-baba',
    name: 'Haji Baba',
    contactPhone: '',
    contactEmail: '',
    address: '',
    specialInstructions: 'Trays sealed and bulk of 20 trays in a box. Round DOWN to multiple of 20 trays.',
    defaultSausagePackType: 'tray' as PackType,
    isActive: true,
    syncStatus: 'synced' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'lmc',
    name: 'LMC',
    contactPhone: '',
    contactEmail: '',
    address: '',
    specialInstructions: '5kg tubs (3 per box), 2kg tubs (7 per box). Meatballs: 20 per shallow tub.',
    defaultSausagePackType: 'tub' as PackType,
    isActive: true,
    syncStatus: 'synced' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'halalnivore',
    name: 'Halalnivore',
    contactPhone: '',
    contactEmail: '',
    address: '',
    specialInstructions: '5kg tubs, 3 per box. If 1 extra tub after division, pack as box of 4.',
    defaultSausagePackType: 'tub' as PackType,
    isActive: true,
    syncStatus: 'synced' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'saffron',
    name: 'Saffron',
    contactPhone: '',
    contactEmail: '',
    address: '',
    specialInstructions: 'Orders by trays. NO BOXES - trays only.',
    defaultSausagePackType: 'tray' as PackType,
    isActive: true,
    syncStatus: 'synced' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Customers
      customers: INITIAL_CUSTOMERS,
      addCustomer: (customer) => set((state) => ({
        customers: [customer, ...state.customers]
      })),
      
      // Orders
      orders: [],
      addOrder: (order) => set((state) => ({
        orders: [order, ...state.orders]
      })),
      updateOrderStatus: (orderId, status) => set((state) => ({
        orders: state.orders.map(order =>
          order.id === orderId ? { ...order, status } : order
        )
      })),
      getNextOrderNumber: () => {
        const year = new Date().getFullYear();
        const orders = get().orders;
        const yearOrders = orders.filter(o => o.orderNumber.includes(`${year}`));
        const nextNum = yearOrders.length + 1;
        return `ORD-${year}-${String(nextNum).padStart(4, '0')}`;
      },
    }),
    {
      name: 'mgm-packing-store',
    }
  )
);

