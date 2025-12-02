// =====================================================
// Calculation Engine Constants
// =====================================================

import type { SystemDefaults } from './types';

/**
 * System-wide default packaging values
 * These are used when no customer-specific rules exist
 */
export const SYSTEM_DEFAULTS: SystemDefaults = {
  sausage: {
    tray: {
      weightKg: 0.4,      // 1 tray = 0.4 kg (6 sausages)
      traysPerBox: 20,    // 1 box = 20 trays
    },
    tub: {
      weightKg: 5.0,      // 1 tub = 5 kg
      tubsPerBox: 3,      // 1 box = 3 tubs
    },
  },
  burger: {
    pattyWeightKg: 0.1,   // 1 patty = 100g
    pattiesPerTray: 10,   // 1 tray = 10 patties
    traysPerBox: 10,      // 1 box = 10 trays
  },
};

/**
 * Validation limits
 */
export const VALIDATION_LIMITS = {
  minQuantityKg: 0,
  maxQuantityKg: 10000, // 10 tonnes max per item
  minWeight: 0.01,       // Minimum 10g
  maxWeight: 50,         // Maximum 50kg per unit
  minUnitsPerBox: 1,
  maxUnitsPerBox: 100,
};

