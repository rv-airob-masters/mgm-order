import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { ApiError } from '../middleware/errorHandler';

const router = Router();

// GET /customers - List all customers
router.get('/', async (req: Request, res: Response) => {
  const { active, search } = req.query;
  
  let query = supabase
    .from('customers')
    .select('*')
    .order('name');
  
  if (active !== undefined) {
    query = query.eq('is_active', active === 'true');
  }
  
  if (search && typeof search === 'string') {
    query = query.ilike('name', `%${search}%`);
  }
  
  const { data, error } = await query;
  
  if (error) {
    throw new ApiError(500, error.message, 'DATABASE_ERROR');
  }
  
  res.json({ success: true, data });
});

// GET /customers/:id - Get single customer with packaging rules
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const { data, error } = await supabase
    .from('customers')
    .select(`
      *,
      packaging_rules:customer_packaging_rules(
        *,
        product:products(id, name, type)
      )
    `)
    .eq('id', id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      throw new ApiError(404, 'Customer not found', 'NOT_FOUND');
    }
    throw new ApiError(500, error.message, 'DATABASE_ERROR');
  }
  
  res.json({ success: true, data });
});

// POST /customers - Create customer
const createCustomerSchema = z.object({
  name: z.string().min(1).max(255),
  contact_phone: z.string().max(50).optional(),
  contact_email: z.string().email().optional(),
  address: z.string().optional(),
  special_instructions: z.string().optional(),
  default_sausage_pack_type: z.enum(['tray', 'tub']).default('tray'),
});

router.post('/', async (req: Request, res: Response) => {
  const body = createCustomerSchema.parse(req.body);
  
  const { data, error } = await supabase
    .from('customers')
    .insert(body)
    .select()
    .single();
  
  if (error) {
    throw new ApiError(500, error.message, 'DATABASE_ERROR');
  }
  
  res.status(201).json({ success: true, data });
});

// PUT /customers/:id - Update customer
const updateCustomerSchema = createCustomerSchema.partial();

router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const body = updateCustomerSchema.parse(req.body);
  
  const { data, error } = await supabase
    .from('customers')
    .update(body)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    throw new ApiError(500, error.message, 'DATABASE_ERROR');
  }
  
  res.json({ success: true, data });
});

// DELETE /customers/:id - Soft delete
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const { error } = await supabase
    .from('customers')
    .update({ is_active: false })
    .eq('id', id);
  
  if (error) {
    throw new ApiError(500, error.message, 'DATABASE_ERROR');
  }
  
  res.json({ success: true, message: 'Customer deactivated' });
});

// POST /customers/:id/packaging-rules - Add packaging rule
const packagingRuleSchema = z.object({
  product_id: z.string().uuid(),
  pack_type: z.enum(['tray', 'tub']),
  tray_weight_kg: z.number().positive().optional(),
  trays_per_box: z.number().int().positive().optional(),
  tub_weight_kg: z.number().positive().optional(),
  tubs_per_box: z.number().int().positive().optional(),
  patty_weight_kg: z.number().positive().optional(),
  patties_per_tray: z.number().int().positive().optional(),
});

router.post('/:id/packaging-rules', async (req: Request, res: Response) => {
  const { id } = req.params;
  const body = packagingRuleSchema.parse(req.body);
  
  const { data, error } = await supabase
    .from('customer_packaging_rules')
    .upsert({ customer_id: id, ...body }, { onConflict: 'customer_id,product_id' })
    .select()
    .single();
  
  if (error) {
    throw new ApiError(500, error.message, 'DATABASE_ERROR');
  }
  
  res.status(201).json({ success: true, data });
});

// DELETE /customers/:id/packaging-rules/:productId - Remove packaging rule
router.delete('/:id/packaging-rules/:productId', async (req: Request, res: Response) => {
  const { id, productId } = req.params;
  
  const { error } = await supabase
    .from('customer_packaging_rules')
    .delete()
    .eq('customer_id', id)
    .eq('product_id', productId);
  
  if (error) {
    throw new ApiError(500, error.message, 'DATABASE_ERROR');
  }
  
  res.json({ success: true, message: 'Packaging rule removed' });
});

export default router;

