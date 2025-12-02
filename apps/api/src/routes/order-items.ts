import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { ApiError } from '../middleware/errorHandler';
import { 
  calculateOrderItem, 
  calculateOrderTotals,
  buildPackagingConfig
} from '@mgm/shared';

const router = Router();

// Helper to recalculate order totals
async function updateOrderTotals(orderId: string): Promise<void> {
  const { data: items } = await supabase
    .from('order_items')
    .select('calculated_trays, calculated_tubs, calculated_boxes, quantity_kg')
    .eq('order_id', orderId);
  
  if (!items) return;
  
  const totals = {
    total_trays: items.reduce((sum, i) => sum + (i.calculated_trays || 0), 0),
    total_tubs: items.reduce((sum, i) => sum + (i.calculated_tubs || 0), 0),
    total_boxes: items.reduce((sum, i) => sum + (i.calculated_boxes || 0), 0),
    total_weight_kg: items.reduce((sum, i) => sum + (i.quantity_kg || 0), 0),
  };
  
  await supabase.from('orders').update(totals).eq('id', orderId);
}

// POST /orders/:orderId/items - Add item to order
const createItemSchema = z.object({
  product_id: z.string().uuid(),
  quantity_kg: z.number().positive(),
  quantity_tubs: z.number().int().positive().optional(),
  pack_type_override: z.enum(['tray', 'tub']).optional(),
});

router.post('/:orderId/items', async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const body = createItemSchema.parse(req.body);
  
  // Get order with customer info
  const { data: order } = await supabase
    .from('orders')
    .select('customer_id, customer:customers(default_sausage_pack_type)')
    .eq('id', orderId)
    .single();
  
  if (!order) {
    throw new ApiError(404, 'Order not found', 'NOT_FOUND');
  }
  
  // Get product
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', body.product_id)
    .single();
  
  if (!product) {
    throw new ApiError(404, 'Product not found', 'NOT_FOUND');
  }
  
  // Get customer packaging rule if exists
  const { data: rule } = await supabase
    .from('customer_packaging_rules')
    .select('*')
    .eq('customer_id', order.customer_id)
    .eq('product_id', body.product_id)
    .single();
  
  // Convert database product to shared type
  const productForCalc = {
    id: product.id,
    categoryId: product.category_id,
    name: product.name,
    type: product.type as 'sausage' | 'burger',
    defaultTrayWeightKg: product.default_tray_weight_kg,
    defaultTraysPerBox: product.default_trays_per_box,
    defaultTubWeightKg: product.default_tub_weight_kg,
    defaultTubsPerBox: product.default_tubs_per_box,
    defaultPattyWeightKg: product.default_patty_weight_kg,
    defaultPattiesPerTray: product.default_patties_per_tray,
    isActive: product.is_active,
    createdAt: new Date(product.created_at),
    updatedAt: new Date(product.updated_at),
  };
  
  // Convert rule if exists
  const ruleForCalc = rule ? {
    id: rule.id,
    customerId: rule.customer_id,
    productId: rule.product_id,
    packType: rule.pack_type as 'tray' | 'tub',
    trayWeightKg: rule.tray_weight_kg,
    traysPerBox: rule.trays_per_box,
    tubWeightKg: rule.tub_weight_kg,
    tubsPerBox: rule.tubs_per_box,
    pattyWeightKg: rule.patty_weight_kg,
    pattiesPerTray: rule.patties_per_tray,
    createdAt: new Date(rule.created_at),
    updatedAt: new Date(rule.updated_at),
  } : null;
  
  // Determine pack type
  const customerData = order.customer as { default_sausage_pack_type: 'tray' | 'tub' } | null;
  const defaultPackType = body.pack_type_override || 
    ruleForCalc?.packType || 
    customerData?.default_sausage_pack_type || 
    'tray';
  
  // Calculate packing requirements
  const result = calculateOrderItem(
    productForCalc,
    body.quantity_kg,
    ruleForCalc,
    defaultPackType,
    body.quantity_tubs
  );
  
  // Create order item
  const itemData = {
    order_id: orderId,
    product_id: body.product_id,
    quantity_kg: body.quantity_kg,
    quantity_tubs: body.quantity_tubs || null,
    pack_type_used: result.packType,
    calculated_trays: result.traysNeeded,
    calculated_tubs: result.tubsNeeded,
    calculated_boxes: result.boxesNeeded,
    tray_weight_used: result.configUsed.trayWeightKg || null,
    tub_weight_used: result.configUsed.tubWeightKg || null,
    trays_per_box_used: result.configUsed.traysPerBox || null,
    tubs_per_box_used: result.configUsed.tubsPerBox || null,
    patty_weight_used: result.configUsed.pattyWeightKg || null,
    patties_per_tray_used: result.configUsed.pattiesPerTray || null,
  };
  
  const { data: item, error } = await supabase
    .from('order_items')
    .insert(itemData)
    .select(`*, product:products(id, name, type)`)
    .single();
  
  if (error) {
    throw new ApiError(500, error.message, 'DATABASE_ERROR');
  }
  
  // Update order totals
  await updateOrderTotals(orderId);
  
  res.status(201).json({ success: true, data: item });
});

// DELETE /orders/:orderId/items/:itemId - Remove item
router.delete('/:orderId/items/:itemId', async (req: Request, res: Response) => {
  const { orderId, itemId } = req.params;
  
  const { error } = await supabase
    .from('order_items')
    .delete()
    .eq('id', itemId)
    .eq('order_id', orderId);
  
  if (error) {
    throw new ApiError(500, error.message, 'DATABASE_ERROR');
  }
  
  await updateOrderTotals(orderId);
  
  res.json({ success: true, message: 'Item removed' });
});

export default router;

