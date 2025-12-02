// =====================================================
// Order Calculation Utilities
// Calculate totals for entire orders
// =====================================================

import type { 
  CalculationInput, 
  CalculationResult, 
  OrderTotals,
  PackagingConfig 
} from './types';
import type {
  Product,
  CustomerPackagingRule,
  PackType
} from '../types';
import { calculatePacking } from './calculator';
import { SYSTEM_DEFAULTS } from './constants';

/**
 * Calculate order totals from an array of calculation results
 */
export function calculateOrderTotals(results: CalculationResult[]): OrderTotals {
  return results.reduce(
    (totals, result) => ({
      totalWeightKg: totals.totalWeightKg + result.inputQuantityKg,
      totalTrays: totals.totalTrays + result.traysNeeded,
      totalTubs: totals.totalTubs + result.tubsNeeded,
      totalBoxes: totals.totalBoxes + result.boxesNeeded,
      itemCount: totals.itemCount + 1,
    }),
    {
      totalWeightKg: 0,
      totalTrays: 0,
      totalTubs: 0,
      totalBoxes: 0,
      itemCount: 0,
    }
  );
}

/**
 * Build packaging config from customer rule and product defaults
 */
export function buildPackagingConfig(
  product: Product,
  customerRule: CustomerPackagingRule | null,
  defaultPackType: PackType = 'tray'
): PackagingConfig {
  // Determine pack type
  const packType = customerRule?.packType ?? defaultPackType;
  
  const config: PackagingConfig = {
    packType,
    productType: product.type,
  };

  if (packType === 'tub') {
    // Tub-based config
    config.tubWeightKg = customerRule?.tubWeightKg ?? product.defaultTubWeightKg;
    config.tubsPerBox = customerRule?.tubsPerBox ?? product.defaultTubsPerBox;
  } else {
    // Tray-based config
    if (product.type === 'burger') {
      config.pattyWeightKg = customerRule?.pattyWeightKg ?? product.defaultPattyWeightKg;
      config.pattiesPerTray = customerRule?.pattiesPerTray ?? product.defaultPattiesPerTray;
      config.traysPerBox = customerRule?.traysPerBox ?? product.defaultTraysPerBox;
    } else {
      config.trayWeightKg = customerRule?.trayWeightKg ?? product.defaultTrayWeightKg;
      config.traysPerBox = customerRule?.traysPerBox ?? product.defaultTraysPerBox;
    }
  }

  return config;
}

/**
 * Calculate packing for a single order item with product and customer context
 */
export function calculateOrderItem(
  product: Product,
  quantityKg: number,
  customerRule: CustomerPackagingRule | null,
  defaultPackType: PackType = 'tray',
  quantityTubs?: number
): CalculationResult {
  const config = buildPackagingConfig(product, customerRule, defaultPackType);
  
  const input: CalculationInput = {
    productId: product.id,
    productName: product.name,
    productType: product.type,
    quantityKg,
    quantityTubs,
    config,
  };

  return calculatePacking(input);
}

/**
 * Batch calculate multiple order items
 */
export function calculateOrderItems(
  items: Array<{
    product: Product;
    quantityKg: number;
    customerRule: CustomerPackagingRule | null;
    quantityTubs?: number;
  }>,
  defaultPackType: PackType = 'tray'
): {
  results: CalculationResult[];
  totals: OrderTotals;
} {
  const results = items.map(item => 
    calculateOrderItem(
      item.product,
      item.quantityKg,
      item.customerRule,
      defaultPackType,
      item.quantityTubs
    )
  );

  const totals = calculateOrderTotals(results);

  return { results, totals };
}

/**
 * Get effective weight for display (converts tubs to kg if needed)
 */
export function getEffectiveWeight(
  quantityKg: number,
  quantityTubs: number | undefined,
  config: PackagingConfig
): number {
  if (config.packType === 'tub' && quantityTubs && quantityTubs > 0) {
    const tubWeight = config.tubWeightKg ?? SYSTEM_DEFAULTS.sausage.tub.weightKg;
    return quantityTubs * tubWeight;
  }
  return quantityKg;
}

