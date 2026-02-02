import { useState, useCallback, useMemo, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAppStore, CUSTOMER_RULES, ALL_PRODUCTS, type OrderItem, type CustomerProduct, type Order, type ProductConfig } from '../store';

// Calculation result interface
interface CalcResult {
  productId: string;
  productName: string;
  packType: 'tray' | 'tub';
  orderBy: 'kg' | 'count' | 'trays';
  inputQty: number;
  inputUnit: string;
  weightKg: number;
  trays: number;
  tubs: number;
  boxes: number;
  tubSize?: '2kg' | '5kg';
}

export function EditOrderPage() {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order as Order | undefined;
  const customer = location.state?.customer;
  const { updateOrder, orders, products: storeProducts } = useAppStore();

  // Combine hardcoded ALL_PRODUCTS with dynamic store products
  const allAvailableProducts = useMemo(() => {
    const productMap = new Map<string, ProductConfig>();

    // First, add all hardcoded products
    ALL_PRODUCTS.forEach(p => productMap.set(p.id, p));

    // Then, add/override with store products
    storeProducts.forEach(p => {
      const config: ProductConfig = {
        id: p.id,
        name: p.name,
        category: p.category,
        meatType: p.meatType,
        spiceType: p.spiceType,
        trayWeightKg: p.trayWeightKg,
        traysPerBox: p.traysPerBox,
        tubWeightKg5: p.tubWeightKg5,
        tubWeightKg2: p.tubWeightKg2,
        tubsPerBox5kg: p.tubsPerBox5kg,
        tubsPerBox2kg: p.tubsPerBox2kg,
        countPerTub: p.countPerTub,
      };
      productMap.set(p.id, config);
    });

    return Array.from(productMap.values());
  }, [storeProducts]);

  // If no order in state, try to find it in store
  const currentOrder = order || orders.find(o => o.id === orderId);

  // Get customer-specific rules
  const customerRules = useMemo(() => {
    if (!currentOrder) return undefined;
    let rules = CUSTOMER_RULES.find(r => r.customerId === currentOrder.customerId);
    if (!rules) {
      rules = CUSTOMER_RULES.find(r =>
        r.customerName.toLowerCase() === currentOrder.customerName.toLowerCase()
      );
    }
    return rules;
  }, [currentOrder]);

  // Initialize quantities from existing order items
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [tubSizes, setTubSizes] = useState<Record<string, '1kg' | '2kg' | '5kg'>>({});
  const [packTypeOverrides, setPackTypeOverrides] = useState<Record<string, 'tray' | 'tub'>>({});
  // State for order-by override per product (kg vs trays vs count/packets)
  const [orderByOverrides, setOrderByOverrides] = useState<Record<string, 'kg' | 'trays' | 'count'>>({});
  const [adhocProducts, setAdhocProducts] = useState<CustomerProduct[]>([]);
  const [showAdhocPicker, setShowAdhocPicker] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  // Order date
  const [orderDate, setOrderDate] = useState(currentOrder?.orderDate || new Date().toISOString().split('T')[0]);
  // No boxes toggle
  const [noBoxes, setNoBoxes] = useState(customerRules?.packingRules.noBoxes || false);

  // Initialize state from existing order
  useEffect(() => {
    if (currentOrder?.items) {
      const initialQtys: Record<string, number> = {};
      const initialTubSizes: Record<string, '1kg' | '2kg' | '5kg'> = {};
      const initialPackTypes: Record<string, 'tray' | 'tub'> = {};

      currentOrder.items.forEach(item => {
        // Determine input quantity based on order type
        if (item.quantityCount) {
          initialQtys[item.productId] = item.quantityCount;
        } else if (item.packType === 'tray' && customerRules?.packingRules.noBoxes) {
          initialQtys[item.productId] = item.trays;
        } else {
          initialQtys[item.productId] = item.quantityKg;
        }
        if (item.tubSize) {
          initialTubSizes[item.productId] = item.tubSize;
        }
        initialPackTypes[item.productId] = item.packType;
      });

      setQuantities(initialQtys);
      setTubSizes(initialTubSizes);
      setPackTypeOverrides(initialPackTypes);
      setOrderDate(currentOrder.orderDate);
    }
  }, [currentOrder, customerRules]);

  // All products to show (regular + adhoc)
  const activeProducts = useMemo(() => {
    const regularProducts = customerRules?.regularProducts.filter(p => p.isRegular) || [];
    // Add products from order that aren't in regular products
    const orderProductIds = new Set(currentOrder?.items.map(i => i.productId) || []);
    const regularIds = new Set(regularProducts.map(p => p.productId));
    
    const additionalProducts: CustomerProduct[] = [];
    currentOrder?.items.forEach(item => {
      if (!regularIds.has(item.productId)) {
        additionalProducts.push({
          productId: item.productId,
          productName: item.productName,
          packType: item.packType,
          orderBy: item.quantityCount ? 'count' : 'kg',
          tubSize: item.tubSize,
          isRegular: false,
        });
      }
    });
    
    return [...regularProducts, ...additionalProducts, ...adhocProducts];
  }, [customerRules, adhocProducts, currentOrder]);

  const availableAdhocProducts = useMemo(() => {
    const activeIds = new Set(activeProducts.map(p => p.productId));
    return allAvailableProducts.filter(p => !activeIds.has(p.id));
  }, [activeProducts, allAvailableProducts]);

  const handleQtyChange = useCallback((productId: string, value: string) => {
    const qty = parseFloat(value) || 0;
    setQuantities(prev => ({ ...prev, [productId]: qty }));
  }, []);

  const handleTubSizeChange = useCallback((productId: string, size: '1kg' | '2kg' | '5kg') => {
    setTubSizes(prev => ({ ...prev, [productId]: size }));
  }, []);

  const handlePackTypeChange = useCallback((productId: string, packType: 'tray' | 'tub') => {
    setPackTypeOverrides(prev => ({ ...prev, [productId]: packType }));
  }, []);

  const handleOrderByChange = useCallback((productId: string, orderBy: 'kg' | 'trays' | 'count') => {
    setOrderByOverrides(prev => ({ ...prev, [productId]: orderBy }));
  }, []);

  const addAdhocProduct = (product: { id: string; name: string }) => {
    const newProduct: CustomerProduct = {
      productId: product.id,
      productName: product.name,
      packType: customer?.defaultSausagePackType || 'tray',
      orderBy: 'kg',
      isRegular: false,
    };
    setAdhocProducts(prev => [...prev, newProduct]);
    setShowAdhocPicker(false);
  };

  // Remove item from order (clear quantity and remove from adhoc if applicable)
  const handleRemoveItem = useCallback((productId: string) => {
    // Clear the quantity
    setQuantities(prev => {
      const newQty = { ...prev };
      delete newQty[productId];
      return newQty;
    });
    // Remove from adhoc products if it's an adhoc item
    setAdhocProducts(prev => prev.filter(p => p.productId !== productId));
    // Clear any overrides
    setPackTypeOverrides(prev => {
      const newOverrides = { ...prev };
      delete newOverrides[productId];
      return newOverrides;
    });
    setOrderByOverrides(prev => {
      const newOverrides = { ...prev };
      delete newOverrides[productId];
      return newOverrides;
    });
    setTubSizes(prev => {
      const newSizes = { ...prev };
      delete newSizes[productId];
      return newSizes;
    });
  }, []);

  // Calculate packing for each product
  const calculateProduct = (
    custProduct: CustomerProduct,
    qty: number,
    tubSize?: '2kg' | '5kg',
    packTypeOverride?: 'tray' | 'tub',
    orderByOverride?: 'kg' | 'trays' | 'count'
  ): CalcResult | null => {
    if (qty <= 0) return null;

    const product = allAvailableProducts.find(p => p.id === custProduct.productId);
    if (!product) return null;

    const rules = customerRules?.packingRules || {};
    const packType = packTypeOverride || custProduct.packType;
    const orderBy = orderByOverride || custProduct.orderBy;
    const effectiveTubSize = tubSize || custProduct.tubSize || '5kg';
    const skipBoxes = noBoxes;

    let weightKg = 0;
    let trays = 0;
    let tubs = 0;
    let boxes = 0;

    if (orderBy === 'trays') {
      trays = qty;
      weightKg = trays * product.trayWeightKg;
      boxes = skipBoxes ? 0 : Math.ceil(trays / product.traysPerBox);
    } else if (orderBy === 'count') {
      // Order by count/packets
      if (product.category === 'meatball') {
        // Meatballs: count = individual meatball count (e.g., 20 meatballs)
        // Divide by countPerTub to get number of tubs needed
        const countPerTub = product.countPerTub || 20;
        tubs = Math.ceil(qty / countPerTub);
        weightKg = tubs * product.tubWeightKg5; // Approximate weight
        const tubsPerBox = rules.tubsPerBox5kg || 3;
        boxes = skipBoxes ? 0 : Math.ceil(tubs / tubsPerBox);
      } else {
        // Sausages/Burgers: count = number of trays/packets
        // e.g., 10 chicken sausage = 10 trays (each tray ~400g with 6 sausages)
        trays = qty;
        weightKg = trays * product.trayWeightKg;
        const traysPerBox = rules.traysPerBox || product.traysPerBox;
        boxes = skipBoxes ? 0 : Math.ceil(trays / traysPerBox);
      }
    } else if (packType === 'tub') {
      // Tub packing: 1kg and 2kg use shallow tubs, 5kg uses deep tubs
      const tubWeight = effectiveTubSize === '1kg' ? 1 : effectiveTubSize === '2kg' ? 2 : 5;
      tubs = Math.ceil(qty / tubWeight);
      weightKg = qty;

      if (skipBoxes) {
        boxes = 0;
      } else {
        // 1kg and 2kg both use shallow tubs (same tubs per box)
        const tubsPerBox = effectiveTubSize === '5kg'
          ? (rules.tubsPerBox5kg || 3)
          : (rules.tubsPerBox2kg || 7);

        // Simple calculation: boxes = tubs / tubsPerBox (rounded up)
        boxes = Math.ceil(tubs / tubsPerBox);
      }
    } else {
      // Tray packing
      const trayWeight = product.trayWeightKg;
      weightKg = qty;

      // Check rounding rule
      if (rules.roundingRule === 'none') {
        // No rounding - exact division (e.g., Haji Baba: 210kg / 0.4kg = 525 trays)
        trays = qty / trayWeight;
      } else if (rules.roundingRule === 'down' && rules.roundToMultiple) {
        // Round DOWN to multiple
        trays = Math.ceil(qty / trayWeight);
        trays = Math.floor(trays / rules.roundToMultiple) * rules.roundToMultiple;
        weightKg = trays * trayWeight;
      } else {
        // Default: round up
        trays = Math.ceil(qty / trayWeight);
      }

      const traysPerBox = rules.traysPerBox || product.traysPerBox;
      boxes = skipBoxes ? 0 : Math.ceil(trays / traysPerBox);
    }

    return {
      productId: custProduct.productId,
      productName: custProduct.productName,
      packType,
      orderBy,
      inputQty: qty,
      inputUnit: orderBy === 'trays' ? 'trays' : orderBy === 'count' ? 'pcs' : 'kg',
      weightKg,
      trays,
      tubs,
      boxes,
      tubSize: effectiveTubSize,
    };
  };

  const results = useMemo(() => {
    return activeProducts
      .map(p => calculateProduct(p, quantities[p.productId] || 0, tubSizes[p.productId], packTypeOverrides[p.productId], orderByOverrides[p.productId]))
      .filter((r): r is CalcResult => r !== null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProducts, quantities, tubSizes, packTypeOverrides, orderByOverrides, customerRules, noBoxes, allAvailableProducts]);

  const totals = useMemo(() => results.reduce((acc, r) => ({
    weight: acc.weight + r.weightKg,
    trays: acc.trays + r.trays,
    tubs: acc.tubs + r.tubs,
    boxes: acc.boxes + r.boxes,
  }), { weight: 0, trays: 0, tubs: 0, boxes: 0 }), [results]);

  const getUnitLabel = (orderBy: string) => {
    switch (orderBy) {
      case 'trays': return 'trays';
      case 'count': return 'pcs';
      default: return 'kg';
    }
  };

  const getEffectivePackType = (product: CustomerProduct) =>
    packTypeOverrides[product.productId] || product.packType;

  const formatResult = (result: CalcResult) => {
    if (noBoxes) {
      return result.packType === 'tub' ? `→ ${result.tubs} tubs` : `→ ${result.trays} trays`;
    }
    if (result.packType === 'tub') {
      return `→ ${result.tubs} tubs (${result.tubSize}) / ${result.boxes} boxes`;
    }
    return `→ ${result.trays} trays / ${result.boxes} boxes`;
  };

  if (!currentOrder) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-gray-500">Order not found</p>
        <button onClick={() => navigate('/orders')} className="btn-primary mt-4">
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Edit Order</h1>
          <p className="text-gray-600">{currentOrder.customerName} - {currentOrder.orderNumber}</p>
        </div>
      </div>

      {/* Order Settings */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Date Picker */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">📅 Order Date:</label>
            <input
              type="date"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              className="input py-1 px-2"
            />
          </div>

          {/* No Boxes Toggle */}
          <div className="flex items-center gap-2 ml-auto">
            <label className="text-sm font-medium text-gray-700">📦 Use Boxes:</label>
            <button
              onClick={() => setNoBoxes(!noBoxes)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                noBoxes ? 'bg-gray-300' : 'bg-green-500'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  noBoxes ? 'translate-x-1' : 'translate-x-6'
                }`}
              />
            </button>
            <span className="text-xs text-gray-500">{noBoxes ? 'No' : 'Yes'}</span>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="space-y-3 mb-6">
        <h2 className="font-semibold text-gray-700">Order Items</h2>
        {activeProducts.map(product => {
          const result = results.find(r => r.productId === product.productId);
          const effectivePackType = getEffectivePackType(product);
          // Show tub size toggle when tub pack type is selected
          const showTubSizeToggle = effectivePackType === 'tub';
          const currentTubSize = tubSizes[product.productId] || '5kg';
          // Get effective order-by (kg or trays) - only for tray pack type
          const effectiveOrderBy = orderByOverrides[product.productId] || product.orderBy;
          // Check if product is a meatball (only meatballs can order by count)
          const productConfig = allAvailableProducts.find(p => p.id === product.productId);
          const isMeatball = productConfig?.category === 'meatball';

          return (
            <div key={product.productId} className="card flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[120px]">
                <span className="font-medium">{product.productName}</span>
              </div>

              {/* Pack type toggle (Tray/Tub) */}
              <div className="flex gap-1">
                <button
                  className={`px-2 py-1 text-xs rounded font-medium ${effectivePackType === 'tray' ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                  onClick={() => handlePackTypeChange(product.productId, 'tray')}
                >TRAY</button>
                <button
                  className={`px-2 py-1 text-xs rounded font-medium ${effectivePackType === 'tub' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                  onClick={() => handlePackTypeChange(product.productId, 'tub')}
                >TUB</button>
              </div>

              {/* Order-by Toggle (kg vs trays) - show count only for meatballs */}
              <div className="flex gap-1">
                <button
                  className={`px-2 py-1 text-xs rounded font-medium ${effectiveOrderBy === 'kg' ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                  onClick={() => handleOrderByChange(product.productId, 'kg')}
                  title="Order by kilograms"
                >by kg</button>
                {effectivePackType === 'tray' && (
                  <button
                    className={`px-2 py-1 text-xs rounded font-medium ${effectiveOrderBy === 'trays' ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                    onClick={() => handleOrderByChange(product.productId, 'trays')}
                    title="Order by number of trays"
                  >by trays</button>
                )}
                {isMeatball && (
                  <button
                    className={`px-2 py-1 text-xs rounded font-medium ${effectiveOrderBy === 'count' ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                    onClick={() => handleOrderByChange(product.productId, 'count')}
                    title="Order by count (e.g., 100 meatballs = 5 tubs of 20)"
                  >by count</button>
                )}
              </div>

              {/* Tub Size Toggle - shows when TUB is selected */}
              {showTubSizeToggle && (
                <div className="flex gap-1">
                  <button
                    className={`px-2 py-1 text-xs rounded font-medium ${currentTubSize === '1kg' ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                    onClick={() => handleTubSizeChange(product.productId, '1kg')}
                    title="1kg shallow tub"
                  >1kg</button>
                  <button
                    className={`px-2 py-1 text-xs rounded font-medium ${currentTubSize === '2kg' ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                    onClick={() => handleTubSizeChange(product.productId, '2kg')}
                    title="2kg shallow tub"
                  >2kg</button>
                  <button
                    className={`px-2 py-1 text-xs rounded font-medium ${currentTubSize === '5kg' ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                    onClick={() => handleTubSizeChange(product.productId, '5kg')}
                    title="5kg deep tub"
                  >5kg</button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step={effectiveOrderBy === 'count' ? '1' : effectiveOrderBy === 'trays' ? '1' : '0.1'}
                  placeholder="0"
                  className="input w-20 text-right"
                  value={quantities[product.productId] || ''}
                  onChange={(e) => handleQtyChange(product.productId, e.target.value)}
                />
                <span className="text-gray-500 text-sm w-8">{getUnitLabel(effectiveOrderBy)}</span>
              </div>

              {result && (
                <div className="text-sm text-primary-600 font-medium min-w-[160px] text-right">
                  {formatResult(result)}
                </div>
              )}

              {/* Delete button */}
              <button
                onClick={() => handleRemoveItem(product.productId)}
                className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Remove item"
              >
                🗑️
              </button>
            </div>
          );
        })}

        <button
          onClick={() => setShowAdhocPicker(true)}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors"
        >
          ➕ Add Other Item
        </button>
      </div>

      {/* Summary */}
      {results.length > 0 && (
        <div className="card bg-primary-50 border-2 border-primary-200 mb-6">
          <h3 className="font-bold text-lg mb-4">Order Summary</h3>
          <div className="grid grid-cols-5 gap-3 text-center">
            <div><div className="text-xl font-bold">{totals.weight.toFixed(1)}</div><div className="text-xs text-gray-600">kg</div></div>
            <div><div className="text-xl font-bold">{totals.trays}</div><div className="text-xs text-gray-600">Trays</div></div>
            <div><div className="text-xl font-bold">{totals.tubs}</div><div className="text-xs text-gray-600">Tubs</div></div>
            <div><div className="text-xl font-bold text-primary-600">{totals.boxes}</div><div className="text-xs text-gray-600">Boxes</div></div>
            <div><div className="text-xl font-bold text-purple-600">{totals.trays + totals.tubs + totals.boxes}</div><div className="text-xs text-gray-600">Labels</div></div>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <button onClick={() => navigate('/orders')} className="btn-secondary flex-1">Cancel</button>
        <button
          onClick={() => {
            if (results.length === 0) {
              alert('Please add items to the order');
              return;
            }

            const orderItems: OrderItem[] = results.map(r => ({
              productId: r.productId,
              productName: r.productName,
              quantityKg: r.weightKg,
              quantityCount: r.orderBy === 'count' ? r.inputQty : undefined,
              trays: r.trays,
              tubs: r.tubs,
              boxes: r.boxes,
              packType: r.packType,
              tubSize: r.tubSize,
            }));

            updateOrder({
              ...currentOrder,
              orderDate: orderDate, // Use selected date
              totalBoxes: totals.boxes,
              totalWeight: totals.weight,
              totalTrays: totals.trays,
              totalTubs: totals.tubs,
              items: orderItems,
            });

            setShowSuccessModal(true);
          }}
          className="btn-primary flex-1"
          disabled={results.length === 0}
        >
          💾 Update Order
        </button>
      </div>

      {/* Adhoc Product Picker Modal */}
      {showAdhocPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Add Item</h2>
            <div className="space-y-2">
              {availableAdhocProducts.length === 0 ? (
                <p className="text-gray-500 text-center py-4">All products already added</p>
              ) : (
                availableAdhocProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => addAdhocProduct(product)}
                    className="w-full text-left p-3 rounded-lg border hover:bg-primary-50 hover:border-primary-300 transition-colors"
                  >
                    <span className="font-medium">{product.name}</span>
                    <span className="ml-2 text-xs text-gray-500">{product.category}</span>
                  </button>
                ))
              )}
            </div>
            <button onClick={() => setShowAdhocPicker(false)} className="btn-secondary w-full mt-4">Cancel</button>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Order Updated!</h2>
            <p className="text-gray-600 mb-4">Order <span className="font-semibold">{currentOrder.orderNumber}</span> has been updated.</p>
            <button onClick={() => navigate('/orders')} className="btn-primary w-full">Back to Orders</button>
          </div>
        </div>
      )}
    </div>
  );
}

