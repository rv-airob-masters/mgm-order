import { supabase } from './supabase';
import type { Order, OrderItem } from '../types/order';
import type { Customer } from '../types/customer';

// Re-export types for consumers
export type { Order, OrderItem } from '../types/order';
export type { Customer } from '../types/customer';

// Database table types (matching Supabase schema)
interface DbOrder {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  order_date: string;
  status: 'draft' | 'confirmed' | 'completed' | 'cancelled';
  total_boxes: number;
  total_weight: number;
  total_trays: number;
  total_tubs: number;
  items: OrderItem[]; // JSONB column
  created_at?: string;
  updated_at?: string;
}

// Connection status
export interface ConnectionStatus {
  isOnline: boolean;
  isConnected: boolean;
  lastError: string | null;
  lastSyncTime: Date | null;
}

let connectionStatus: ConnectionStatus = {
  isOnline: navigator.onLine,
  isConnected: false,
  lastError: null,
  lastSyncTime: null,
};

// Listeners for connection status changes
type StatusListener = (status: ConnectionStatus) => void;
const statusListeners: StatusListener[] = [];

export function subscribeToConnectionStatus(listener: StatusListener): () => void {
  statusListeners.push(listener);
  listener(connectionStatus); // Initial call
  return () => {
    const index = statusListeners.indexOf(listener);
    if (index > -1) statusListeners.splice(index, 1);
  };
}

function updateConnectionStatus(updates: Partial<ConnectionStatus>) {
  connectionStatus = { ...connectionStatus, ...updates };
  statusListeners.forEach(listener => listener(connectionStatus));
}

// Listen for online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => updateConnectionStatus({ isOnline: true }));
  window.addEventListener('offline', () => updateConnectionStatus({ isOnline: false, isConnected: false }));
}

// Convert app Order to database format
function toDbOrder(order: Order): DbOrder {
  return {
    id: order.id,
    order_number: order.orderNumber,
    customer_id: order.customerId,
    customer_name: order.customerName,
    order_date: order.orderDate,
    status: order.status,
    total_boxes: order.totalBoxes,
    total_weight: order.totalWeight,
    total_trays: order.totalTrays,
    total_tubs: order.totalTubs,
    items: order.items,
  };
}

// Convert database format to app Order
function fromDbOrder(dbOrder: DbOrder): Order {
  return {
    id: dbOrder.id,
    orderNumber: dbOrder.order_number,
    customerId: dbOrder.customer_id,
    customerName: dbOrder.customer_name,
    orderDate: dbOrder.order_date,
    status: dbOrder.status,
    totalBoxes: dbOrder.total_boxes,
    totalWeight: dbOrder.total_weight,
    totalTrays: dbOrder.total_trays,
    totalTubs: dbOrder.total_tubs,
    items: dbOrder.items || [],
  };
}

// Check database connection
export async function checkConnection(): Promise<boolean> {
  if (!navigator.onLine) {
    updateConnectionStatus({ isOnline: false, isConnected: false });
    return false;
  }

  try {
    const { error } = await supabase.from('orders').select('id').limit(1);
    if (error) {
      updateConnectionStatus({ isConnected: false, lastError: error.message });
      return false;
    }
    updateConnectionStatus({ isOnline: true, isConnected: true, lastError: null });
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Connection failed';
    updateConnectionStatus({ isConnected: false, lastError: message });
    return false;
  }
}

// Fetch all orders from Supabase
export async function fetchOrders(): Promise<{ orders: Order[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      updateConnectionStatus({ lastError: error.message });
      return { orders: [], error: error.message };
    }

    updateConnectionStatus({ isConnected: true, lastError: null, lastSyncTime: new Date() });
    return { orders: (data || []).map(fromDbOrder), error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch orders';
    updateConnectionStatus({ lastError: message });
    return { orders: [], error: message };
  }
}

// Save order to Supabase (upsert)
export async function saveOrder(order: Order): Promise<{ success: boolean; error: string | null }> {
  try {
    const dbOrder = toDbOrder(order);
    const { error } = await supabase.from('orders').upsert(dbOrder, { onConflict: 'id' });

    if (error) {
      updateConnectionStatus({ lastError: error.message });
      return { success: false, error: error.message };
    }

    updateConnectionStatus({ isConnected: true, lastError: null, lastSyncTime: new Date() });
    return { success: true, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save order';
    updateConnectionStatus({ lastError: message });
    return { success: false, error: message };
  }
}

// Delete order from Supabase
export async function deleteOrderFromDb(orderId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase.from('orders').delete().eq('id', orderId);

    if (error) {
      updateConnectionStatus({ lastError: error.message });
      return { success: false, error: error.message };
    }

    updateConnectionStatus({ isConnected: true, lastError: null });
    return { success: true, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete order';
    updateConnectionStatus({ lastError: message });
    return { success: false, error: message };
  }
}

// =====================================================
// CUSTOMER SYNC FUNCTIONS
// =====================================================

interface DbCustomer {
  id: string;
  name: string;
  contact_phone: string | null;
  contact_email: string | null;
  address: string | null;
  special_instructions: string | null;
  default_sausage_pack_type: 'tray' | 'tub';
  is_active: boolean;
  sync_status: 'pending' | 'synced' | 'conflict';
  created_at?: string;
  updated_at?: string;
}

function toDbCustomer(customer: Customer): DbCustomer {
  return {
    id: customer.id,
    name: customer.name,
    contact_phone: customer.contactPhone,
    contact_email: customer.contactEmail,
    address: customer.address,
    special_instructions: customer.specialInstructions,
    default_sausage_pack_type: customer.defaultSausagePackType,
    is_active: customer.isActive,
    sync_status: customer.syncStatus,
  };
}

function fromDbCustomer(db: DbCustomer): Customer {
  return {
    id: db.id,
    name: db.name,
    contactPhone: db.contact_phone ?? '',
    contactEmail: db.contact_email ?? '',
    address: db.address ?? '',
    specialInstructions: db.special_instructions ?? '',
    defaultSausagePackType: db.default_sausage_pack_type ?? 'tray',
    isActive: db.is_active ?? true,
    syncStatus: db.sync_status ?? 'synced',
    createdAt: db.created_at ? new Date(db.created_at) : new Date(),
    updatedAt: db.updated_at ? new Date(db.updated_at) : new Date(),
  };
}

// Fetch all customers from Supabase
export async function fetchCustomers(): Promise<{ customers: Customer[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      updateConnectionStatus({ lastError: error.message });
      return { customers: [], error: error.message };
    }

    updateConnectionStatus({ isConnected: true, lastError: null, lastSyncTime: new Date() });
    return { customers: (data || []).map(fromDbCustomer), error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch customers';
    updateConnectionStatus({ lastError: message });
    return { customers: [], error: message };
  }
}

// Save customer to Supabase (upsert)
export async function saveCustomer(customer: Customer): Promise<{ success: boolean; error: string | null }> {
  try {
    const dbCustomer = toDbCustomer(customer);
    const { error } = await supabase.from('customers').upsert(dbCustomer, { onConflict: 'id' });

    if (error) {
      updateConnectionStatus({ lastError: error.message });
      return { success: false, error: error.message };
    }

    updateConnectionStatus({ isConnected: true, lastError: null, lastSyncTime: new Date() });
    return { success: true, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save customer';
    updateConnectionStatus({ lastError: message });
    return { success: false, error: message };
  }
}

// Delete customer from Supabase
export async function deleteCustomerFromDb(customerId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase.from('customers').delete().eq('id', customerId);

    if (error) {
      updateConnectionStatus({ lastError: error.message });
      return { success: false, error: error.message };
    }

    updateConnectionStatus({ isConnected: true, lastError: null });
    return { success: true, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete customer';
    updateConnectionStatus({ lastError: message });
    return { success: false, error: message };
  }
}

