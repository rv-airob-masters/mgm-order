import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { ApiError } from '../middleware/errorHandler';
import { 
  calculatePacking, 
  calculateOrderItems, 
  buildPackagingConfig,
  SYSTEM_DEFAULTS,
  type PackagingConfig,
  type CalculationInput
} from '@mgm/shared';

const router = Router();

// POST /calculate/single - Calculate packing for single item (no database)
const singleCalcSchema = z.object({
  product_type: z.enum(['sausage', 'burger']),
  pack_type: z.enum(['tray', 'tub']),
  quantity_kg: z.number().positive(),
  quantity_tubs: z.number().int().positive().optional(),
  // Optional custom config
  tray_weight_kg: z.number().positive().optional(),
  trays_per_box: z.number().int().positive().optional(),
  tub_weight_kg: z.number().positive().optional(),
  tubs_per_box: z.number().int().positive().optional(),
  patty_weight_kg: z.number().positive().optional(),
  patties_per_tray: z.number().int().positive().optional(),
});

router.post('/single', async (req: Request, res: Response) => {
  const body = singleCalcSchema.parse(req.body);
  
  const config: PackagingConfig = {
    packType: body.pack_type,
    productType: body.product_type,
    trayWeightKg: body.tray_weight_kg,
    traysPerBox: body.trays_per_box,
    tubWeightKg: body.tub_weight_kg,
    tubsPerBox: body.tubs_per_box,
    pattyWeightKg: body.patty_weight_kg,
    pattiesPerTray: body.patties_per_tray,
  };
  
  const input: CalculationInput = {
    productId: 'manual',
    productName: `${body.product_type} (manual)`,
    productType: body.product_type,
    quantityKg: body.quantity_kg,
    quantityTubs: body.quantity_tubs,
    config,
  };
  
  const result = calculatePacking(input);
  
  res.json({ success: true, data: result });
});

// POST /calculate/preview - Preview calculation for customer order
const previewCalcSchema = z.object({
  customer_id: z.string().uuid(),
  items: z.array(z.object({
    product_id: z.string().uuid(),
    quantity_kg: z.number().positive(),
    quantity_tubs: z.number().int().positive().optional(),
    pack_type_override: z.enum(['tray', 'tub']).optional(),
  })),
});

router.post('/preview', async (req: Request, res: Response) => {
  const body = previewCalcSchema.parse(req.body);
  
  // Get customer with packaging rules
  const { data: customer } = await supabase
    .from('customers')
    .select(`
      *,
      packaging_rules:customer_packaging_rules(*)
    `)
    .eq('id', body.customer_id)
    .single();
  
  if (!customer) {
    throw new ApiError(404, 'Customer not found', 'NOT_FOUND');
  }
  
  // Get all products
  const productIds = body.items.map(i => i.product_id);
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .in('id', productIds);
  
  if (!products || products.length !== productIds.length) {
    throw new ApiError(400, 'One or more products not found', 'INVALID_PRODUCTS');
  }
  
  const productMap = new Map(products.map(p => [p.id, p]));
  const rulesMap = new Map(
    (customer.packaging_rules || []).map((r: { product_id: string }) => [r.product_id, r])
  );
  
  // Build calculation items
  const calcItems = body.items.map(item => {
    const product = productMap.get(item.product_id)!;
    const rule = rulesMap.get(item.product_id);
    
    return {
      product: {
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
      },
      quantityKg: item.quantity_kg,
      quantityTubs: item.quantity_tubs,
      customerRule: rule ? {
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
      } : null,
    };
  });
  
  const defaultPackType = customer.default_sausage_pack_type || 'tray';
  const { results, totals } = calculateOrderItems(calcItems, defaultPackType);
  
  res.json({ 
    success: true, 
    data: {
      customer: { id: customer.id, name: customer.name },
      items: results,
      totals,
    }
  });
});

// GET /calculate/defaults - Get system default values
router.get('/defaults', (_req: Request, res: Response) => {
  res.json({ success: true, data: SYSTEM_DEFAULTS });
});

export default router;

