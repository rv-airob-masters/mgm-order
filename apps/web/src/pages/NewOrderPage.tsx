import { useState, useCallback, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAppStore, CUSTOMER_RULES, ALL_PRODUCTS, type OrderItem, type CustomerProduct, type ProductConfig } from '../store';

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

export function NewOrderPage() {
  const { customerId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const customer = location.state?.customer;
  const { addOrder, getNextOrderNumber } = useAppStore();

  // Get customer-specific rules - match by ID first, then by name
  const customerRules = useMemo(() => {
    // Try to match by customerId first
    let rules = CUSTOMER_RULES.find(r => r.customerId === customerId);
    // If not found, try to match by customer name (case-insensitive)
    if (!rules && customer?.name) {
      rules = CUSTOMER_RULES.find(r =>
        r.customerName.toLowerCase() === customer.name.toLowerCase()
      );
    }
    return rules;
  }, [customerId, customer?.name]);

  // State for quantities (keyed by productId)
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  // State for tub sizes (for LMC veal)
  const [tubSizes, setTubSizes] = useState<Record<string, '2kg' | '5kg'>>({});
  // State for pack type override per product
  const [packTypeOverrides, setPackTypeOverrides] = useState<Record<string, 'tray' | 'tub'>>({});
  // State for adhoc products added
  const [adhocProducts, setAdhocProducts] = useState<CustomerProduct[]>([]);
  // State for showing adhoc product picker
  const [showAdhocPicker, setShowAdhocPicker] = useState(false);
  // Modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedOrderNumber, setSavedOrderNumber] = useState('');
  // Order date (default to today)
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  // No boxes toggle (customer can override)
  const [noBoxes, setNoBoxes] = useState(customerRules?.packingRules.noBoxes || false);

  // All products to show (regular + adhoc)
  const activeProducts = useMemo(() => {
    const regularProducts = customerRules?.regularProducts.filter(p => p.isRegular) || [];
    return [...regularProducts, ...adhocProducts];
  }, [customerRules, adhocProducts]);

  // Available products for adhoc (not already in activeProducts)
  const availableAdhocProducts = useMemo(() => {
    const activeIds = new Set(activeProducts.map(p => p.productId));
    return ALL_PRODUCTS.filter(p => !activeIds.has(p.id));
  }, [activeProducts]);

  const handleQtyChange = useCallback((productId: string, value: string) => {
    const qty = parseFloat(value) || 0;
    setQuantities(prev => ({ ...prev, [productId]: qty }));
  }, []);

  const handleTubSizeChange = useCallback((productId: string, size: '2kg' | '5kg') => {
    setTubSizes(prev => ({ ...prev, [productId]: size }));
  }, []);

  const handlePackTypeChange = useCallback((productId: string, packType: 'tray' | 'tub') => {
    setPackTypeOverrides(prev => ({ ...prev, [productId]: packType }));
  }, []);

  const addAdhocProduct = (product: ProductConfig) => {
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

  // Calculate packing for each product
  const calculateProduct = (
    custProduct: CustomerProduct,
    qty: number,
    tubSize?: '2kg' | '5kg',
    packTypeOverride?: 'tray' | 'tub'
  ): CalcResult | null => {
    if (qty <= 0) return null;

    const product = ALL_PRODUCTS.find(p => p.id === custProduct.productId);
    if (!product) return null;

    const rules = customerRules?.packingRules || {};
    // Use override if provided, otherwise use product default
    const packType = packTypeOverride || custProduct.packType;
    const orderBy = custProduct.orderBy;
    const effectiveTubSize = tubSize || custProduct.tubSize || '5kg';
    // Use the noBoxes state (which user can toggle)
    const skipBoxes = noBoxes;

    let weightKg = 0;
    let trays = 0;
    let tubs = 0;
    let boxes = 0;

    if (orderBy === 'trays') {
      // Saffron orders by trays
      trays = qty;
      weightKg = trays * product.trayWeightKg;
      boxes = skipBoxes ? 0 : Math.ceil(trays / product.traysPerBox);
    } else if (orderBy === 'count' && product.category === 'meatball') {
      // LMC meatballs - ordered by count, 20 per tub
      const countPerTub = product.countPerTub || 20;
      tubs = Math.ceil(qty / countPerTub);
      weightKg = tubs * product.tubWeightKg5; // Approximate
      const tubsPerBox = rules.tubsPerBox5kg || 3;
      boxes = skipBoxes ? 0 : Math.ceil(tubs / tubsPerBox);
    } else if (packType === 'tub') {
      // Tub packing
      const tubWeight = effectiveTubSize === '2kg' ? 2 : 5;
      tubs = Math.ceil(qty / tubWeight);
      weightKg = qty;

      if (skipBoxes) {
        boxes = 0;
      } else {
        const tubsPerBox = effectiveTubSize === '2kg'
          ? (rules.tubsPerBox2kg || 7)
          : (rules.tubsPerBox5kg || 3);

        // Simple calculation: boxes = tubs / tubsPerBox (rounded up)
        boxes = Math.ceil(tubs / tubsPerBox);
      }
    } else {
      // Tray packing
      const trayWeight = product.trayWeightKg;
      trays = Math.ceil(qty / trayWeight);
      weightKg = qty;

      // Haji Baba special rule: round DOWN to multiple of 20
      if (rules.roundingRule === 'down' && rules.roundToMultiple) {
        trays = Math.floor(trays / rules.roundToMultiple) * rules.roundToMultiple;
        weightKg = trays * trayWeight;
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
      inputUnit: orderBy === 'trays' ? 'trays' : orderBy === 'count' ? 'count' : 'kg',
      weightKg,
      trays,
      tubs,
      boxes,
      tubSize: effectiveTubSize,
    };
  };

  // Calculate all results
  const results = useMemo(() => {
    return activeProducts
      .map(p => calculateProduct(p, quantities[p.productId] || 0, tubSizes[p.productId], packTypeOverrides[p.productId]))
      .filter((r): r is CalcResult => r !== null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProducts, quantities, tubSizes, packTypeOverrides, customerRules, noBoxes]);

  const totals = useMemo(() => results.reduce((acc, r) => ({
    weight: acc.weight + r.weightKg,
    trays: acc.trays + r.trays,
    tubs: acc.tubs + r.tubs,
    boxes: acc.boxes + r.boxes,
  }), { weight: 0, trays: 0, tubs: 0, boxes: 0 }), [results]);

  // Get unit label for product
  const getUnitLabel = (orderBy: string) => {
    switch (orderBy) {
      case 'trays': return 'trays';
      case 'count': return 'pcs';
      default: return 'kg';
    }
  };

  // Get effective pack type for a product (with override)
  const getEffectivePackType = (product: CustomerProduct) =>
    packTypeOverrides[product.productId] || product.packType;

  // Format result display
  const formatResult = (result: CalcResult) => {
    if (noBoxes) {
      // No boxes mode
      return result.packType === 'tub' ? `→ ${result.tubs} tubs` : `→ ${result.trays} trays`;
    }
    if (result.packType === 'tub') {
      return `→ ${result.tubs} tubs (${result.tubSize}) / ${result.boxes} boxes`;
    }
    return `→ ${result.trays} trays / ${result.boxes} boxes`;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">New Order</h1>
          <p className="text-gray-600">{customer?.name || 'Customer'}</p>
          {customer?.specialInstructions && (
            <p className="text-xs text-amber-600 mt-1">📋 {customer.specialInstructions}</p>
          )}
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
        <h2 className="font-semibold text-gray-700">📦 Order Items</h2>
        {activeProducts.map(product => {
          const result = results.find(r => r.productId === product.productId);
          const isLMC = customerId === 'lmc' || customer?.name?.toLowerCase() === 'lmc';
          // Show tub size toggle for LMC Veal and Meatballs
          const showTubSizeToggle = isLMC && (product.productId === 'veal-sausage' || product.productId === 'beef-meatballs');
          const effectivePackType = getEffectivePackType(product);

          return (
            <div key={product.productId} className="card flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[120px]">
                <span className="font-medium">{product.productName}</span>
              </div>

              {/* Tub Size Toggle for LMC Veal & Meatballs */}
              {showTubSizeToggle && (
                <div className="flex gap-1">
                  <button
                    className={`px-2 py-1 text-xs rounded font-medium ${(tubSizes[product.productId] || '5kg') === '2kg' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                    onClick={() => handleTubSizeChange(product.productId, '2kg')}
                  >2kg</button>
                  <button
                    className={`px-2 py-1 text-xs rounded font-medium ${(tubSizes[product.productId] || '5kg') === '5kg' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                    onClick={() => handleTubSizeChange(product.productId, '5kg')}
                  >5kg</button>
                </div>
              )}

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

              {/* Quantity input */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step={product.orderBy === 'count' ? '1' : '0.1'}
                  placeholder="0"
                  className="input w-20 text-right"
                  value={quantities[product.productId] || ''}
                  onChange={(e) => handleQtyChange(product.productId, e.target.value)}
                />
                <span className="text-gray-500 text-sm w-8">{getUnitLabel(product.orderBy)}</span>
              </div>

              {/* Result */}
              {result && (
                <div className="text-sm text-primary-600 font-medium min-w-[180px] text-right">
                  {formatResult(result)}
                  {result.orderBy === 'kg' && customerRules?.packingRules.roundingRule === 'down' && (
                    <div className="text-xs text-gray-500">({result.weightKg.toFixed(1)} kg actual)</div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Add Adhoc Item Button */}
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
        <button onClick={() => navigate(-1)} className="btn-secondary flex-1">Cancel</button>
        <button
          onClick={() => {
            if (results.length === 0) {
              alert('Please add items to the order');
              return;
            }

            const orderNumber = getNextOrderNumber();
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

            addOrder({
              id: crypto.randomUUID(),
              orderNumber,
              customerId: customerId || '',
              customerName: customer?.name || 'Unknown Customer',
              orderDate: orderDate, // Use selected date
              status: 'confirmed',
              totalBoxes: totals.boxes,
              totalWeight: totals.weight,
              totalTrays: totals.trays,
              totalTubs: totals.tubs,
              items: orderItems,
            });

            setSavedOrderNumber(orderNumber);
            setShowSuccessModal(true);
          }}
          className="btn-primary flex-1"
          disabled={results.length === 0}
        >
          💾 Save Order
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
            <button
              onClick={() => setShowAdhocPicker(false)}
              className="btn-secondary w-full mt-4"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Order Saved!</h2>
            <p className="text-gray-600 mb-4">Order <span className="font-semibold">{savedOrderNumber}</span> has been created successfully.</p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/orders')}
                className="btn-secondary flex-1"
              >
                View Orders
              </button>
              <button
                onClick={() => navigate('/customers')}
                className="btn-primary flex-1"
              >
                New Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

