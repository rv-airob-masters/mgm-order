import { Router } from 'express';
import productsRouter from './products';
import customersRouter from './customers';
import ordersRouter from './orders';
import orderItemsRouter from './order-items';
import calculateRouter from './calculate';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Mount routes
router.use('/products', productsRouter);
router.use('/customers', customersRouter);
router.use('/orders', ordersRouter);
router.use('/orders', orderItemsRouter); // /orders/:id/items
router.use('/calculate', calculateRouter);

export default router;

