import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

// Create Supabase client
export const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false,
    },
  }
);

// Admin client with service role (for server-side operations)
export const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey || config.supabase.anonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Database types helper
export type Tables = {
  customers: {
    id: string;
    name: string;
    contact_phone: string | null;
    contact_email: string | null;
    address: string | null;
    special_instructions: string | null;
    default_sausage_pack_type: 'tray' | 'tub';
    is_active: boolean;
    sync_status: 'pending' | 'synced' | 'conflict';
    created_at: string;
    updated_at: string;
  };
  products: {
    id: string;
    category_id: string | null;
    name: string;
    type: 'sausage' | 'burger';
    default_tray_weight_kg: number;
    default_trays_per_box: number;
    default_tub_weight_kg: number;
    default_tubs_per_box: number;
    default_patty_weight_kg: number;
    default_patties_per_tray: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
  product_categories: {
    id: string;
    name: string;
    type: 'sausage' | 'burger';
    created_at: string;
    updated_at: string;
  };
  customer_packaging_rules: {
    id: string;
    customer_id: string;
    product_id: string;
    pack_type: 'tray' | 'tub';
    tray_weight_kg: number | null;
    trays_per_box: number | null;
    tub_weight_kg: number | null;
    tubs_per_box: number | null;
    patty_weight_kg: number | null;
    patties_per_tray: number | null;
    created_at: string;
    updated_at: string;
  };
  orders: {
    id: string;
    customer_id: string;
    created_by_user_id: string | null;
    order_number: string;
    status: 'draft' | 'confirmed' | 'completed' | 'cancelled';
    order_date: string;
    notes: string | null;
    total_trays: number;
    total_tubs: number;
    total_boxes: number;
    total_weight_kg: number;
    sync_status: 'pending' | 'synced' | 'conflict';
    created_at: string;
    updated_at: string;
  };
  order_items: {
    id: string;
    order_id: string;
    product_id: string;
    quantity_kg: number;
    quantity_tubs: number | null;
    pack_type_used: 'tray' | 'tub';
    calculated_trays: number;
    calculated_tubs: number;
    calculated_boxes: number;
    tray_weight_used: number | null;
    tub_weight_used: number | null;
    trays_per_box_used: number | null;
    tubs_per_box_used: number | null;
    patty_weight_used: number | null;
    patties_per_tray_used: number | null;
    created_at: string;
  };
};

