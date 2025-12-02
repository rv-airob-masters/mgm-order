// =====================================================
// Calculation Engine Types
// =====================================================

import type { PackType, ProductType } from '../types';

/**
 * Configuration for packaging calculation
 */
export interface PackagingConfig {
  packType: PackType;
  productType: ProductType;
  // Tray-based
  trayWeightKg?: number;
  traysPerBox?: number;
  // Tub-based
  tubWeightKg?: number;
  tubsPerBox?: number;
  // Burger-specific
  pattyWeightKg?: number;
  pattiesPerTray?: number;
}

/**
 * Input for a single item calculation
 */
export interface CalculationInput {
  productId: string;
  productName: string;
  productType: ProductType;
  quantityKg: number;
  quantityTubs?: number; // Optional: for tub-based input
  config: PackagingConfig;
}

/**
 * Result of a single item calculation
 */
export interface CalculationResult {
  productId: string;
  productName: string;
  inputQuantityKg: number;
  packType: PackType;
  // Results
  traysNeeded: number;
  tubsNeeded: number;
  boxesNeeded: number;
  // Remainder (spare capacity in last box)
  remainderTrays: number;
  remainderTubs: number;
  // Config used (for audit/snapshot)
  configUsed: PackagingConfig;
}

/**
 * Summary totals for an order
 */
export interface OrderTotals {
  totalWeightKg: number;
  totalTrays: number;
  totalTubs: number;
  totalBoxes: number;
  itemCount: number;
}

/**
 * System default packaging values
 */
export interface SystemDefaults {
  sausage: {
    tray: {
      weightKg: number;
      traysPerBox: number;
    };
    tub: {
      weightKg: number;
      tubsPerBox: number;
    };
  };
  burger: {
    pattyWeightKg: number;
    pattiesPerTray: number;
    traysPerBox: number;
  };
}

