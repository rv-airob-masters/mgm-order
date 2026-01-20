import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore, ALL_PRODUCTS, type MeatType, type SpiceType } from '../store';
import type { SpicePreference } from '@mgm/shared';

// Labels for meat types
const meatLabels: Record<MeatType, string> = {
  chicken: 'Chicken',
  beef: 'Beef',
  lamb: 'Lamb',
  veal: 'Veal',
  mixed: 'Mixed',
};

// Labels for spice types
const spiceLabels: Record<SpiceType, string> = {
  mild: 'Mild',
  normal: 'Normal',
  none: '',
};

export function HomePage() {
  const { orders, customers } = useAppStore();

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  // Calculate today's order statistics
  const todayStats = useMemo(() => {
    const todayOrders = orders.filter(o => o.orderDate === today && o.status !== 'cancelled');

    return {
      orderCount: todayOrders.length,
      totalWeight: todayOrders.reduce((sum, o) => sum + o.totalWeight, 0),
      totalTrays: todayOrders.reduce((sum, o) => sum + o.totalTrays, 0),
      totalTubs: todayOrders.reduce((sum, o) => sum + o.totalTubs, 0),
      totalBoxes: todayOrders.reduce((sum, o) => sum + o.totalBoxes, 0),
      // Labels = trays + tubs + boxes (1 label per each)
      totalLabels: todayOrders.reduce((sum, o) => sum + o.totalTrays + o.totalTubs + o.totalBoxes, 0),
      confirmedCount: todayOrders.filter(o => o.status === 'confirmed').length,
      completedCount: todayOrders.filter(o => o.status === 'completed').length,
    };
  }, [orders, today]);

  // Calculate breakdown by MEAT TYPE + CUSTOMER'S SPICE PREFERENCE for today
  const meatBreakdown = useMemo(() => {
    const todayOrders = orders.filter(o => o.orderDate === today && o.status !== 'cancelled');

    // Group by meatType + spicePreference (from customer) + category
    const breakdown: Record<string, {
      meatType: MeatType;
      spiceType: SpiceType;
      category: string;
      totalKg: number;
      totalTrays: number;
      totalTubs: number
    }> = {};

    todayOrders.forEach(order => {
      // Get customer's spice preference
      const customer = customers.find(c => c.id === order.customerId);
      const customerSpice: SpicePreference = customer?.spicePreference || 'normal';

      order.items.forEach(item => {
        // Find product config to get meat type and category
        const productConfig = ALL_PRODUCTS.find(p => p.id === item.productId);
        if (!productConfig) return;

        const { meatType, category } = productConfig;
        // Use customer's spice preference for sausages, 'none' for burgers/meatballs
        const spiceType: SpiceType = category === 'sausage' ? customerSpice : 'none';
        // Create key: e.g., "chicken-normal-sausage", "beef-mild-sausage"
        const key = `${meatType}-${spiceType}-${category}`;

        if (!breakdown[key]) {
          breakdown[key] = { meatType, spiceType, category, totalKg: 0, totalTrays: 0, totalTubs: 0 };
        }

        breakdown[key].totalKg += item.quantityKg;
        breakdown[key].totalTrays += item.trays;
        breakdown[key].totalTubs += item.tubs;
      });
    });

    // Convert to sorted array (by meat type, then spice, then category)
    return Object.entries(breakdown)
      .map(([key, data]) => ({ key, ...data }))
      .sort((a, b) => {
        const meatOrder = ['chicken', 'beef', 'lamb', 'veal', 'mixed'];
        const meatDiff = meatOrder.indexOf(a.meatType) - meatOrder.indexOf(b.meatType);
        if (meatDiff !== 0) return meatDiff;
        const spiceDiff = a.spiceType.localeCompare(b.spiceType);
        if (spiceDiff !== 0) return spiceDiff;
        return a.category.localeCompare(b.category);
      });
  }, [orders, customers, today]);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center py-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          🌭 MGM Packing Assistant 🍔
        </h1>
      </div>

      {/* Quick Actions - NEW ORDER & ORDER HISTORY AT TOP */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <Link
          to="/customers"
          className="card hover:shadow-xl transition-all transform hover:-translate-y-1 border-2 border-primary-100 hover:border-primary-400 py-8"
        >
          <div className="text-4xl mb-3 text-center">📝</div>
          <h2 className="text-xl font-bold text-gray-800 mb-1 text-center">New Order</h2>
          <p className="text-gray-600 text-center text-sm">
            Create a new packing order
          </p>
        </Link>

        <Link
          to="/orders"
          className="card hover:shadow-xl transition-all transform hover:-translate-y-1 border-2 border-gray-100 hover:border-gray-300 py-8"
        >
          <div className="text-4xl mb-3 text-center">📋</div>
          <h2 className="text-xl font-bold text-gray-800 mb-1 text-center">Order History</h2>
          <p className="text-gray-600 text-center text-sm">
            View and manage past orders
          </p>
        </Link>
      </div>

      {/* Today's Dashboard - NOW BELOW QUICK ACTIONS */}
      <div className="card bg-gradient-to-r from-primary-50 to-blue-50 border-2 border-primary-200 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">📊 Today's Dashboard</h2>
          <span className="text-sm text-gray-500">{today}</span>
        </div>

        {todayStats.orderCount === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <p>No orders for today yet</p>
          </div>
        ) : (
          <>
            {/* Order count row */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                <div className="text-3xl font-bold text-gray-800">{todayStats.orderCount}</div>
                <div className="text-sm text-gray-600">Total Orders</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                <div className="text-3xl font-bold text-blue-600">{todayStats.confirmedCount}</div>
                <div className="text-sm text-gray-600">Confirmed</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                <div className="text-3xl font-bold text-green-600">{todayStats.completedCount}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
            </div>

            {/* Packing totals row */}
            <div className="grid grid-cols-5 gap-2">
              <div className="bg-white rounded-lg p-2 text-center shadow-sm overflow-hidden">
                <div className="text-lg sm:text-xl font-bold text-gray-800 truncate">{todayStats.totalWeight.toFixed(1)}</div>
                <div className="text-xs text-gray-600">kg</div>
              </div>
              <div className="bg-white rounded-lg p-2 text-center shadow-sm overflow-hidden">
                <div className="text-lg sm:text-xl font-bold text-amber-600 truncate">{todayStats.totalTrays}</div>
                <div className="text-xs text-gray-600">Trays</div>
              </div>
              <div className="bg-white rounded-lg p-2 text-center shadow-sm overflow-hidden">
                <div className="text-lg sm:text-xl font-bold text-blue-600 truncate">{todayStats.totalTubs}</div>
                <div className="text-xs text-gray-600">Tubs</div>
              </div>
              <div className="bg-white rounded-lg p-2 text-center shadow-sm overflow-hidden">
                <div className="text-lg sm:text-xl font-bold text-primary-600 truncate">{todayStats.totalBoxes}</div>
                <div className="text-xs text-gray-600">Boxes</div>
              </div>
              <div className="bg-white rounded-lg p-2 text-center shadow-sm overflow-hidden">
                <div className="text-lg sm:text-xl font-bold text-purple-600 truncate">{todayStats.totalLabels}</div>
                <div className="text-xs text-gray-600">Labels</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Order Breakdown by Meat Type + Spice */}
      {meatBreakdown.length > 0 && (
        <div className="card bg-white border-2 border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 mb-4">🥩 Order Breakdown by Meat</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Meat Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Spice</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Total (kg)</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Trays</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Tubs</th>
                </tr>
              </thead>
              <tbody>
                {meatBreakdown.map((item, idx) => (
                  <tr key={item.key} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="py-3 px-4 font-medium text-gray-800">{meatLabels[item.meatType]}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {item.spiceType !== 'none' && (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${item.spiceType === 'mild' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {spiceLabels[item.spiceType]}
                        </span>
                      )}
                      {item.spiceType === 'none' && '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-600 capitalize">{item.category}</td>
                    <td className="py-3 px-4 text-right font-bold text-primary-600">{item.totalKg.toFixed(1)}</td>
                    <td className="py-3 px-4 text-right text-amber-600">{item.totalTrays > 0 ? item.totalTrays : '-'}</td>
                    <td className="py-3 px-4 text-right text-blue-600">{item.totalTubs > 0 ? item.totalTubs : '-'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-200 border-t-2 border-gray-300 font-bold">
                  <td colSpan={3} className="py-3 px-4 text-gray-800">TOTAL</td>
                  <td className="py-3 px-4 text-right text-primary-700">
                    {meatBreakdown.reduce((sum, p) => sum + p.totalKg, 0).toFixed(1)} kg
                  </td>
                  <td className="py-3 px-4 text-right text-amber-700">
                    {meatBreakdown.reduce((sum, p) => sum + p.totalTrays, 0)}
                  </td>
                  <td className="py-3 px-4 text-right text-blue-700">
                    {meatBreakdown.reduce((sum, p) => sum + p.totalTubs, 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

