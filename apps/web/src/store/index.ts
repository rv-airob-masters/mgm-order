import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  fetchOrders, saveOrder, deleteOrderFromDb, checkConnection,
  fetchCustomers, saveCustomer, deleteCustomerFromDb,
  fetchProducts, saveProduct, deleteProductFromDb
} from '../lib/supabaseSync';
import type { Order, OrderItem } from '../types/order';
import type { Customer, PackType, SyncStatus } from '../types/customer';
import type { Product } from '../types/product';

// Re-export types for consumers
export type { Order, OrderItem } from '../types/order';
export type { Customer, PackType, SyncStatus } from '../types/customer';
export type { Product } from '../types/product';

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

// Meat and spice types for grouping
export type MeatType = 'chicken' | 'beef' | 'lamb' | 'veal' | 'mixed';
export type SpiceType = 'mild' | 'normal' | 'none';

// All available products in the system
export interface ProductConfig {
  id: string;
  name: string;
  category: 'sausage' | 'burger' | 'meatball';
  meatType: MeatType;
  spiceType: SpiceType;
  trayWeightKg: number;
  traysPerBox: number;
  tubWeightKg5: number; // 5kg tub
  tubWeightKg2: number; // 2kg tub
  tubsPerBox5kg: number;
  tubsPerBox2kg: number;
  countPerTub?: number; // For meatballs
}

export const ALL_PRODUCTS: ProductConfig[] = [
  // Chicken Sausages - Normal spice
  { id: 'chicken-sausage', name: 'Chicken Sausage', category: 'sausage', meatType: 'chicken', spiceType: 'normal', trayWeightKg: 0.4, traysPerBox: 20, tubWeightKg5: 5, tubWeightKg2: 2, tubsPerBox5kg: 3, tubsPerBox2kg: 7 },
  { id: 'chicken-sausage-50g', name: 'Chicken Sausage (50g)', category: 'sausage', meatType: 'chicken', spiceType: 'normal', trayWeightKg: 0.4, traysPerBox: 20, tubWeightKg5: 5, tubWeightKg2: 2, tubsPerBox5kg: 3, tubsPerBox2kg: 7 },
  { id: 'chicken-sausage-30g', name: 'Chicken Sausage (30g)', category: 'sausage', meatType: 'chicken', spiceType: 'normal', trayWeightKg: 0.4, traysPerBox: 20, tubWeightKg5: 5, tubWeightKg2: 2, tubsPerBox5kg: 3, tubsPerBox2kg: 7 },
  { id: 'chicken-sausage-60g', name: 'Chicken Sausage (60g)', category: 'sausage', meatType: 'chicken', spiceType: 'normal', trayWeightKg: 0.4, traysPerBox: 20, tubWeightKg5: 5, tubWeightKg2: 2, tubsPerBox5kg: 3, tubsPerBox2kg: 7 },
  // Chicken Sausages - Mild spice
  { id: 'chicken-sausage-mild', name: 'Chicken Sausage (Mild)', category: 'sausage', meatType: 'chicken', spiceType: 'mild', trayWeightKg: 0.4, traysPerBox: 20, tubWeightKg5: 5, tubWeightKg2: 2, tubsPerBox5kg: 3, tubsPerBox2kg: 7 },
  // Beef Sausages
  { id: 'beef-sausage', name: 'Beef Sausage', category: 'sausage', meatType: 'beef', spiceType: 'normal', trayWeightKg: 0.4, traysPerBox: 20, tubWeightKg5: 5, tubWeightKg2: 2, tubsPerBox5kg: 3, tubsPerBox2kg: 7 },
  { id: 'beef-sausage-mild', name: 'Beef Sausage (Mild)', category: 'sausage', meatType: 'beef', spiceType: 'mild', trayWeightKg: 0.4, traysPerBox: 20, tubWeightKg5: 5, tubWeightKg2: 2, tubsPerBox5kg: 3, tubsPerBox2kg: 7 },
  // Lamb Sausages
  { id: 'lamb-sausage', name: 'Lamb Sausage', category: 'sausage', meatType: 'lamb', spiceType: 'normal', trayWeightKg: 0.4, traysPerBox: 20, tubWeightKg5: 5, tubWeightKg2: 2, tubsPerBox5kg: 3, tubsPerBox2kg: 7 },
  { id: 'lamb-sausage-mild', name: 'Lamb Sausage (Mild)', category: 'sausage', meatType: 'lamb', spiceType: 'mild', trayWeightKg: 0.4, traysPerBox: 20, tubWeightKg5: 5, tubWeightKg2: 2, tubsPerBox5kg: 3, tubsPerBox2kg: 7 },
  // Veal Sausages
  { id: 'veal-sausage', name: 'Veal Sausage', category: 'sausage', meatType: 'veal', spiceType: 'normal', trayWeightKg: 0.4, traysPerBox: 20, tubWeightKg5: 5, tubWeightKg2: 2, tubsPerBox5kg: 3, tubsPerBox2kg: 7 },
  { id: 'veal-sausage-mild', name: 'Veal Sausage (Mild)', category: 'sausage', meatType: 'veal', spiceType: 'mild', trayWeightKg: 0.4, traysPerBox: 20, tubWeightKg5: 5, tubWeightKg2: 2, tubsPerBox5kg: 3, tubsPerBox2kg: 7 },
  // Burgers (no spice variation)
  { id: 'beef-burger', name: 'Beef Burger', category: 'burger', meatType: 'beef', spiceType: 'none', trayWeightKg: 1, traysPerBox: 10, tubWeightKg5: 5, tubWeightKg2: 2, tubsPerBox5kg: 3, tubsPerBox2kg: 7 },
  { id: 'lamb-kofte', name: 'Lamb Kofte', category: 'burger', meatType: 'lamb', spiceType: 'none', trayWeightKg: 1, traysPerBox: 10, tubWeightKg5: 5, tubWeightKg2: 2, tubsPerBox5kg: 3, tubsPerBox2kg: 7 },
  { id: 'beef-cj', name: 'Beef C&J', category: 'burger', meatType: 'beef', spiceType: 'none', trayWeightKg: 1, traysPerBox: 10, tubWeightKg5: 5, tubWeightKg2: 2, tubsPerBox5kg: 3, tubsPerBox2kg: 7 },
  // Meatballs
  { id: 'beef-meatballs', name: 'Beef Meatballs', category: 'meatball', meatType: 'beef', spiceType: 'none', trayWeightKg: 1, traysPerBox: 10, tubWeightKg5: 5, tubWeightKg2: 2, tubsPerBox5kg: 3, tubsPerBox2kg: 7, countPerTub: 20 },
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
      roundingRule: 'none', // No rounding - just divide kg by tray weight
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
      // No longer using pack4 rule - just divide tubs by 3
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

interface SyncState {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncError: string | null;
}

interface AppStore {
  // Customers
  customers: Customer[];
  addCustomer: (customer: Customer) => void;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (customerId: string) => void;

  // Products
  products: Product[];
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;

  // Orders
  orders: Order[];
  addOrder: (order: Order) => void;
  updateOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  deleteOrder: (orderId: string) => void;
  getNextOrderNumber: () => string;

  // Sync
  syncState: SyncState;
  syncWithSupabase: () => Promise<void>;
  setSyncError: (error: string | null) => void;
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
    spicePreference: 'normal' as const,
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
    spicePreference: 'mild' as const,
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
    specialInstructions: '5kg tubs, 3 tubs per box. Boxes = tubs ÷ 3 (rounded up).',
    defaultSausagePackType: 'tub' as PackType,
    spicePreference: 'normal' as const,
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
    spicePreference: 'normal' as const,
    isActive: true,
    syncStatus: 'synced' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'aldens',
    name: 'Aldens',
    contactPhone: '',
    contactEmail: '',
    address: '',
    specialInstructions: '',
    defaultSausagePackType: 'tray' as PackType,
    spicePreference: 'mild' as const,
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
      addCustomer: async (customer: Customer) => {
        // Add to local state immediately
        set((state: AppStore) => ({
          customers: [customer, ...state.customers]
        }));
        // Sync to Supabase in background
        const { error } = await saveCustomer(customer);
        if (error) {
          set({ syncState: { ...get().syncState, syncError: `Failed to save customer: ${error}` } });
        } else {
          set({ syncState: { ...get().syncState, syncError: null, lastSyncTime: new Date() } });
        }
      },
      updateCustomer: async (updatedCustomer: Customer) => {
        // Update local state immediately
        set((state: AppStore) => ({
          customers: state.customers.map((c: Customer) =>
            c.id === updatedCustomer.id ? updatedCustomer : c
          )
        }));
        // Sync to Supabase in background
        const { error } = await saveCustomer(updatedCustomer);
        if (error) {
          set({ syncState: { ...get().syncState, syncError: `Failed to update customer: ${error}` } });
        } else {
          set({ syncState: { ...get().syncState, syncError: null, lastSyncTime: new Date() } });
        }
      },
      deleteCustomer: async (customerId: string) => {
        // Delete from local state immediately
        set((state: AppStore) => ({
          customers: state.customers.filter((c: Customer) => c.id !== customerId)
        }));
        // Delete from Supabase in background
        const { error } = await deleteCustomerFromDb(customerId);
        if (error) {
          set({ syncState: { ...get().syncState, syncError: `Failed to delete customer: ${error}` } });
        } else {
          set({ syncState: { ...get().syncState, syncError: null, lastSyncTime: new Date() } });
        }
      },

      // Products
      products: [],
      addProduct: async (product: Product) => {
        set((state: AppStore) => ({
          products: [...state.products, product]
        }));
        const { error } = await saveProduct(product);
        if (error) {
          set({ syncState: { ...get().syncState, syncError: `Failed to save product: ${error}` } });
        } else {
          set({ syncState: { ...get().syncState, syncError: null, lastSyncTime: new Date() } });
        }
      },
      updateProduct: async (updatedProduct: Product) => {
        set((state: AppStore) => ({
          products: state.products.map((p: Product) =>
            p.id === updatedProduct.id ? updatedProduct : p
          )
        }));
        const { error } = await saveProduct(updatedProduct);
        if (error) {
          set({ syncState: { ...get().syncState, syncError: `Failed to update product: ${error}` } });
        } else {
          set({ syncState: { ...get().syncState, syncError: null, lastSyncTime: new Date() } });
        }
      },
      deleteProduct: async (productId: string) => {
        set((state: AppStore) => ({
          products: state.products.filter((p: Product) => p.id !== productId)
        }));
        const { error } = await deleteProductFromDb(productId);
        if (error) {
          set({ syncState: { ...get().syncState, syncError: `Failed to delete product: ${error}` } });
        } else {
          set({ syncState: { ...get().syncState, syncError: null, lastSyncTime: new Date() } });
        }
      },

      // Orders
      orders: [],
      addOrder: async (order: Order) => {
        // Add to local state immediately
        set((state: AppStore) => ({
          orders: [order, ...state.orders]
        }));
        // Sync to Supabase in background
        const { error } = await saveOrder(order);
        if (error) {
          set({ syncState: { ...get().syncState, syncError: `Failed to save: ${error}` } });
        } else {
          set({ syncState: { ...get().syncState, syncError: null, lastSyncTime: new Date() } });
        }
      },
      updateOrder: async (updatedOrder: Order) => {
        // Update local state immediately
        set((state: AppStore) => ({
          orders: state.orders.map((order: Order) =>
            order.id === updatedOrder.id ? updatedOrder : order
          )
        }));
        // Sync to Supabase in background
        const { error } = await saveOrder(updatedOrder);
        if (error) {
          set({ syncState: { ...get().syncState, syncError: `Failed to update: ${error}` } });
        } else {
          set({ syncState: { ...get().syncState, syncError: null, lastSyncTime: new Date() } });
        }
      },
      updateOrderStatus: async (orderId: string, status: OrderStatus) => {
        const order = get().orders.find((o: Order) => o.id === orderId);
        if (!order) return;

        const updatedOrder = { ...order, status };
        // Update local state immediately
        set((state: AppStore) => ({
          orders: state.orders.map((o: Order) =>
            o.id === orderId ? updatedOrder : o
          )
        }));
        // Sync to Supabase in background
        const { error } = await saveOrder(updatedOrder);
        if (error) {
          set({ syncState: { ...get().syncState, syncError: `Failed to update status: ${error}` } });
        } else {
          set({ syncState: { ...get().syncState, syncError: null, lastSyncTime: new Date() } });
        }
      },
      deleteOrder: async (orderId: string) => {
        // Delete from local state immediately
        set((state: AppStore) => ({
          orders: state.orders.filter((order: Order) => order.id !== orderId)
        }));
        // Delete from Supabase in background
        const { error } = await deleteOrderFromDb(orderId);
        if (error) {
          set({ syncState: { ...get().syncState, syncError: `Failed to delete: ${error}` } });
        } else {
          set({ syncState: { ...get().syncState, syncError: null, lastSyncTime: new Date() } });
        }
      },
      getNextOrderNumber: () => {
        const year = new Date().getFullYear();
        const orders = get().orders;
        const yearOrders = orders.filter((o: Order) => o.orderNumber.includes(`${year}`));
        const nextNum = yearOrders.length + 1;
        return `ORD-${year}-${String(nextNum).padStart(4, '0')}`;
      },

      // Sync state
      syncState: {
        isSyncing: false,
        lastSyncTime: null,
        syncError: null,
      },
      setSyncError: (error: string | null) => set((state: AppStore) => ({
        syncState: { ...state.syncState, syncError: error }
      })),
      syncWithSupabase: async () => {
        const isConnected = await checkConnection();
        if (!isConnected) {
          set({ syncState: { ...get().syncState, syncError: 'No database connection', isSyncing: false } });
          return;
        }

        set({ syncState: { ...get().syncState, isSyncing: true, syncError: null } });

        try {
          // Sync Orders
          const { orders: remoteOrders, error: ordersError } = await fetchOrders();
          if (ordersError) {
            set({ syncState: { ...get().syncState, syncError: ordersError, isSyncing: false } });
            return;
          }

          // Merge orders: remote take precedence, upload local-only
          const localOrders = get().orders;
          const remoteOrderIds = new Set(remoteOrders.map(o => o.id));
          const localOnlyOrders = localOrders.filter(o => !remoteOrderIds.has(o.id));
          for (const order of localOnlyOrders) {
            await saveOrder(order);
          }

          // Sync Customers
          const { customers: remoteCustomers, error: customersError } = await fetchCustomers();
          if (customersError) {
            set({ syncState: { ...get().syncState, syncError: customersError, isSyncing: false } });
            return;
          }

          // Merge customers: remote take precedence, upload local-only
          const localCustomers = get().customers;
          const remoteCustomerIds = new Set(remoteCustomers.map(c => c.id));
          const localOnlyCustomers = localCustomers.filter(c => !remoteCustomerIds.has(c.id));
          for (const customer of localOnlyCustomers) {
            await saveCustomer(customer);
          }

          // Sync Products
          const { data: remoteProducts, error: productsError } = await fetchProducts();
          if (productsError) {
            console.warn('Products sync warning:', productsError);
            // Don't fail sync for products - they have defaults
          }

          // Merge products: remote take precedence, upload local-only
          const localProducts = get().products;
          const remoteProductIds = new Set(remoteProducts.map(p => p.id));
          const localOnlyProducts = localProducts.filter(p => !remoteProductIds.has(p.id));
          for (const product of localOnlyProducts) {
            await saveProduct(product);
          }

          // Fetch final state from Supabase
          const { orders: finalOrders } = await fetchOrders();
          const { customers: finalCustomers } = await fetchCustomers();
          const { data: finalProducts } = await fetchProducts();

          set({
            orders: finalOrders.length > 0 ? finalOrders : localOrders,
            customers: finalCustomers.length > 0 ? finalCustomers : localCustomers,
            products: finalProducts.length > 0 ? finalProducts : localProducts,
            syncState: {
              isSyncing: false,
              lastSyncTime: new Date(),
              syncError: null,
            }
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Sync failed';
          set({ syncState: { ...get().syncState, syncError: message, isSyncing: false } });
        }
      },
    }),
    {
      name: 'mgm-packing-store',
    }
  )
);

