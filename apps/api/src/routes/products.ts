import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { ApiError } from '../middleware/errorHandler';

const router = Router();

// GET /products - List all products
router.get('/', async (req: Request, res: Response) => {
  const { type, active } = req.query;
  
  let query = supabase
    .from('products')
    .select(`
      *,
      category:product_categories(id, name, type)
    `)
    .order('name');
  
  if (type) {
    query = query.eq('type', type);
  }
  
  if (active !== undefined) {
    query = query.eq('is_active', active === 'true');
  }
  
  const { data, error } = await query;
  
  if (error) {
    throw new ApiError(500, error.message, 'DATABASE_ERROR');
  }
  
  res.json({ success: true, data });
});

// GET /products/:id - Get single product
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:product_categories(id, name, type)
    `)
    .eq('id', id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      throw new ApiError(404, 'Product not found', 'NOT_FOUND');
    }
    throw new ApiError(500, error.message, 'DATABASE_ERROR');
  }
  
  res.json({ success: true, data });
});

// POST /products - Create product
const createProductSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['sausage', 'burger']),
  category_id: z.string().uuid().optional(),
  default_tray_weight_kg: z.number().positive().optional(),
  default_trays_per_box: z.number().int().positive().optional(),
  default_tub_weight_kg: z.number().positive().optional(),
  default_tubs_per_box: z.number().int().positive().optional(),
  default_patty_weight_kg: z.number().positive().optional(),
  default_patties_per_tray: z.number().int().positive().optional(),
});

router.post('/', async (req: Request, res: Response) => {
  const body = createProductSchema.parse(req.body);
  
  const { data, error } = await supabase
    .from('products')
    .insert(body)
    .select()
    .single();
  
  if (error) {
    throw new ApiError(500, error.message, 'DATABASE_ERROR');
  }
  
  res.status(201).json({ success: true, data });
});

// PUT /products/:id - Update product
const updateProductSchema = createProductSchema.partial();

router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const body = updateProductSchema.parse(req.body);
  
  const { data, error } = await supabase
    .from('products')
    .update(body)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    throw new ApiError(500, error.message, 'DATABASE_ERROR');
  }
  
  res.json({ success: true, data });
});

// DELETE /products/:id - Soft delete (deactivate)
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const { error } = await supabase
    .from('products')
    .update({ is_active: false })
    .eq('id', id);
  
  if (error) {
    throw new ApiError(500, error.message, 'DATABASE_ERROR');
  }
  
  res.json({ success: true, message: 'Product deactivated' });
});

// GET /products/categories - List all categories
router.get('/categories/list', async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('product_categories')
    .select('*')
    .order('name');
  
  if (error) {
    throw new ApiError(500, error.message, 'DATABASE_ERROR');
  }
  
  res.json({ success: true, data });
});

export default router;

