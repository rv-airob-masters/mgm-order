// =====================================================
// Packing Calculation Engine
// Core business logic for calculating packing requirements
// =====================================================

import type {
  PackagingConfig,
  CalculationInput,
  CalculationResult
} from './types';
import { SYSTEM_DEFAULTS } from './constants';

/**
 * Calculate packing requirements for a single item
 * 
 * @param input - The calculation input with product and quantity info
 * @returns Calculation result with trays/tubs/boxes needed
 */
export function calculatePacking(input: CalculationInput): CalculationResult {
  const { productId, productName, productType, quantityKg, quantityTubs, config } = input;
  
  // Handle zero quantity
  if (quantityKg <= 0 && (!quantityTubs || quantityTubs <= 0)) {
    return createEmptyResult(productId, productName, config);
  }

  // Calculate based on pack type
  if (config.packType === 'tub') {
    return calculateTubPacking(input);
  } else {
    // Tray-based (default)
    if (productType === 'burger') {
      return calculateBurgerTrayPacking(input);
    } else {
      return calculateSausageTrayPacking(input);
    }
  }
}

/**
 * Calculate tub-based packing (sausages only)
 */
function calculateTubPacking(input: CalculationInput): CalculationResult {
  const { productId, productName, quantityKg, quantityTubs, config } = input;
  
  const tubWeight = config.tubWeightKg ?? SYSTEM_DEFAULTS.sausage.tub.weightKg;
  const tubsPerBox = config.tubsPerBox ?? SYSTEM_DEFAULTS.sausage.tub.tubsPerBox;
  
  let tubsNeeded: number;
  let actualQuantityKg = quantityKg;
  
  // If quantity was provided in tubs, convert to kg for consistency
  if (quantityTubs && quantityTubs > 0) {
    tubsNeeded = Math.ceil(quantityTubs);
    actualQuantityKg = quantityTubs * tubWeight;
  } else {
    // Calculate tubs from kg
    tubsNeeded = Math.ceil(quantityKg / tubWeight);
  }
  
  const boxesNeeded = Math.ceil(tubsNeeded / tubsPerBox);
  const remainderTubs = (boxesNeeded * tubsPerBox) - tubsNeeded;
  
  return {
    productId,
    productName,
    inputQuantityKg: actualQuantityKg,
    packType: 'tub',
    traysNeeded: 0,
    tubsNeeded,
    boxesNeeded,
    remainderTrays: 0,
    remainderTubs,
    configUsed: {
      ...config,
      tubWeightKg: tubWeight,
      tubsPerBox,
    },
  };
}

/**
 * Calculate tray-based packing for sausages
 */
function calculateSausageTrayPacking(input: CalculationInput): CalculationResult {
  const { productId, productName, quantityKg, config } = input;
  
  const trayWeight = config.trayWeightKg ?? SYSTEM_DEFAULTS.sausage.tray.weightKg;
  const traysPerBox = config.traysPerBox ?? SYSTEM_DEFAULTS.sausage.tray.traysPerBox;
  
  const traysNeeded = Math.ceil(quantityKg / trayWeight);
  const boxesNeeded = Math.ceil(traysNeeded / traysPerBox);
  const remainderTrays = (boxesNeeded * traysPerBox) - traysNeeded;
  
  return {
    productId,
    productName,
    inputQuantityKg: quantityKg,
    packType: 'tray',
    traysNeeded,
    tubsNeeded: 0,
    boxesNeeded,
    remainderTrays,
    remainderTubs: 0,
    configUsed: {
      ...config,
      trayWeightKg: trayWeight,
      traysPerBox,
    },
  };
}

/**
 * Calculate tray-based packing for burger patties
 */
function calculateBurgerTrayPacking(input: CalculationInput): CalculationResult {
  const { productId, productName, quantityKg, config } = input;
  
  const pattyWeight = config.pattyWeightKg ?? SYSTEM_DEFAULTS.burger.pattyWeightKg;
  const pattiesPerTray = config.pattiesPerTray ?? SYSTEM_DEFAULTS.burger.pattiesPerTray;
  const traysPerBox = config.traysPerBox ?? SYSTEM_DEFAULTS.burger.traysPerBox;
  
  // First calculate number of patties
  const pattiesNeeded = Math.ceil(quantityKg / pattyWeight);
  
  // Then calculate trays needed
  const traysNeeded = Math.ceil(pattiesNeeded / pattiesPerTray);
  
  // Finally calculate boxes
  const boxesNeeded = Math.ceil(traysNeeded / traysPerBox);
  const remainderTrays = (boxesNeeded * traysPerBox) - traysNeeded;
  
  return {
    productId,
    productName,
    inputQuantityKg: quantityKg,
    packType: 'tray',
    traysNeeded,
    tubsNeeded: 0,
    boxesNeeded,
    remainderTrays,
    remainderTubs: 0,
    configUsed: {
      ...config,
      pattyWeightKg: pattyWeight,
      pattiesPerTray,
      traysPerBox,
    },
  };
}

/**
 * Create an empty result (for zero quantity)
 */
function createEmptyResult(
  productId: string, 
  productName: string, 
  config: PackagingConfig
): CalculationResult {
  return {
    productId,
    productName,
    inputQuantityKg: 0,
    packType: config.packType,
    traysNeeded: 0,
    tubsNeeded: 0,
    boxesNeeded: 0,
    remainderTrays: 0,
    remainderTubs: 0,
    configUsed: config,
  };
}

