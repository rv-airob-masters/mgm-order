import { create } from 'zustand';
import type { Customer, Product, Order } from '@mgm/shared';

interface AppState {
  // Data
  customers: Customer[];
  products: Product[];
  orders: Order[];
  
  // Current selections
  selectedCustomerId: string | null;
  
  // UI state
  isLoading: boolean;
  isOnline: boolean;
  pendingSyncCount: number;
  
  // Actions
  setCustomers: (customers: Customer[]) => void;
  setProducts: (products: Product[]) => void;
  setOrders: (orders: Order[]) => void;
  selectCustomer: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setOnline: (online: boolean) => void;
  setPendingSyncCount: (count: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial data
  customers: [],
  products: [],
  orders: [],
  
  // Initial selections
  selectedCustomerId: null,
  
  // Initial UI state
  isLoading: false,
  isOnline: true,
  pendingSyncCount: 0,
  
  // Actions
  setCustomers: (customers) => set({ customers }),
  setProducts: (products) => set({ products }),
  setOrders: (orders) => set({ orders }),
  selectCustomer: (id) => set({ selectedCustomerId: id }),
  setLoading: (loading) => set({ isLoading: loading }),
  setOnline: (online) => set({ isOnline: online }),
  setPendingSyncCount: (count) => set({ pendingSyncCount: count }),
}));

