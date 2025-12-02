import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function checkOnlineStatus(): Promise<boolean> {
  if (!navigator.onLine) return false;
  
  try {
    const { error } = await supabase.from('products').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

