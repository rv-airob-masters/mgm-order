import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore, ALL_PRODUCTS, type MeatType, type SpiceType } from '../store';
import { useAuth } from '../lib/auth';
import type { SpicePreference } from '@mgm/shared';
import type { Order, OrderItem } from '../types/order';

type OrderStatus = 'pending' | 'in-progress' | 'completed';

// Status colors for the modal
const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  'in-progress': 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
};

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
  const navigate = useNavigate();
  const { isOwner } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { orders, customers, updateOrder, updateOrderStatus, deleteOrder } = useAppStore();

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  // Delete order (owner only)
  const handleDeleteOrder = (order: Order) => {
    if (confirm(`Delete order #${order.orderNumber} for ${order.customerName}? This cannot be undone.`)) {
      deleteOrder(order.id);
      setSelectedOrder(null);
    }
  };

  // Toggle item completion and auto-update order status
  const handleToggleItemComplete = (itemIndex: number) => {
    if (!selectedOrder) return;

    const updatedItems: OrderItem[] = selectedOrder.items.map((item, idx) =>
      idx === itemIndex ? { ...item, isCompleted: !item.isCompleted } : item
    );

    // Check if all items are completed
    const allCompleted = updatedItems.every(item => item.isCompleted);
    const someCompleted = updatedItems.some(item => item.isCompleted);

    // Auto-update status based on completion
    let newStatus: OrderStatus = selectedOrder.status;
    if (allCompleted) {
      newStatus = 'completed';
    } else if (someCompleted) {
      newStatus = 'in-progress';
    } else {
      newStatus = 'pending'; // No items completed = pending
    }

    const updatedOrder: Order = {
      ...selectedOrder,
      items: updatedItems,
      status: newStatus,
    };

    updateOrder(updatedOrder);
    setSelectedOrder(updatedOrder);
  };

  // Get completion progress
  const getCompletionProgress = (order: Order) => {
    const completed = order.items.filter(item => item.isCompleted).length;
    return { completed, total: order.items.length };
  };

  // Get label count (trays + tubs + boxes)
  const getLabelCount = (order: Order) => {
    return order.totalTrays + order.totalTubs + order.totalBoxes;
  };

  // Handle status change
  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateOrderStatus(orderId, newStatus);
    // Update local selected order state to reflect the change
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
  };

  // Get all non-completed orders (regardless of date) - sorted by order date
  const pendingOrders = useMemo(() => {
    return orders
      .filter(o => o.status !== 'completed')
      .sort((a, b) => new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime());
  }, [orders]);

  // Calculate today's order statistics
  const todayStats = useMemo(() => {
    const todayOrders = orders.filter(o => o.orderDate === today);

    return {
      orderCount: todayOrders.length,
      totalWeight: todayOrders.reduce((sum, o) => sum + o.totalWeight, 0),
      totalTrays: todayOrders.reduce((sum, o) => sum + o.totalTrays, 0),
      totalTubs: todayOrders.reduce((sum, o) => sum + o.totalTubs, 0),
      totalBoxes: todayOrders.reduce((sum, o) => sum + o.totalBoxes, 0),
      // Labels = trays + tubs + boxes (1 label per each)
      totalLabels: todayOrders.reduce((sum, o) => sum + o.totalTrays + o.totalTubs + o.totalBoxes, 0),
      pendingCount: todayOrders.filter(o => o.status === 'pending').length,
      inProgressCount: todayOrders.filter(o => o.status === 'in-progress').length,
      completedCount: todayOrders.filter(o => o.status === 'completed').length,
    };
  }, [orders, today]);

  // Calculate breakdown by MEAT TYPE + CUSTOMER'S SPICE PREFERENCE for today
  const meatBreakdown = useMemo(() => {
    const todayOrders = orders.filter(o => o.orderDate === today);

    // Group by meatType + spicePreference (from customer) + category
    const breakdown: Record<string, {
      meatType: MeatType;
      spiceType: SpiceType;
      category: string;
      totalKg: number;
      totalTrays: number;
      totalTubs: number;
      totalBoxes: number;
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
          breakdown[key] = { meatType, spiceType, category, totalKg: 0, totalTrays: 0, totalTubs: 0, totalBoxes: 0 };
        }

        breakdown[key].totalKg += item.quantityKg;
        breakdown[key].totalTrays += item.trays;
        breakdown[key].totalTubs += item.tubs;
        breakdown[key].totalBoxes += item.boxes;
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

      {/* Pending Orders Section - All non-completed orders regardless of date */}
      {pendingOrders.length > 0 && (
        <div className="card bg-amber-50 border-2 border-amber-200 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">⏳ Orders To Complete ({pendingOrders.length})</h2>
          <div className="space-y-3">
            {pendingOrders.map(order => {
              const customer = customers.find(c => c.id === order.customerId);
              const isToday = order.orderDate === today;
              const isPast = order.orderDate < today;
              const isFuture = order.orderDate > today;
              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="block bg-white rounded-lg p-4 hover:shadow-md transition-shadow border border-amber-100 cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-800">{customer?.name || 'Unknown Customer'}</span>
                        <span className="text-sm text-gray-500">#{order.orderNumber}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                          {order.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''} • {order.totalWeight.toFixed(1)}kg
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${isPast ? 'text-red-600' : isFuture ? 'text-blue-600' : 'text-green-600'}`}>
                        {isPast && '⚠️ '}
                        {order.orderDate}
                      </div>
                      <div className="text-xs text-gray-500">
                        {isToday && '📅 Today'}
                        {isPast && '📅 Past'}
                        {isFuture && '📅 Future'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                <div className="text-3xl font-bold text-gray-800">{todayStats.orderCount}</div>
                <div className="text-sm text-gray-600">Total Orders</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                <div className="text-3xl font-bold text-amber-600">{todayStats.pendingCount}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                <div className="text-3xl font-bold text-purple-600">{todayStats.inProgressCount}</div>
                <div className="text-sm text-gray-600">In Progress</div>
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
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Boxes</th>
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
                    <td className="py-3 px-4 text-right text-green-600">{item.totalBoxes > 0 ? item.totalBoxes : '-'}</td>
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
                  <td className="py-3 px-4 text-right text-green-700">
                    {meatBreakdown.reduce((sum, p) => sum + p.totalBoxes, 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{selectedOrder.customerName}</h2>
                <p className="text-gray-500 text-sm">{selectedOrder.orderNumber}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[selectedOrder.status]}`}>
                {selectedOrder.status.toUpperCase()}
              </span>
            </div>

            <div className="text-sm text-gray-500 mb-4">
              📅 Order Date: {selectedOrder.orderDate}
            </div>

            {/* Order Items with Toggle */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-700">Order Items</h3>
                <span className="text-sm text-gray-500">
                  {getCompletionProgress(selectedOrder).completed}/{getCompletionProgress(selectedOrder).total} done
                </span>
              </div>
              <div className="space-y-3">
                {selectedOrder.items.map((item, index) => (
                  <div
                    key={index}
                    className={`rounded-lg p-3 border-2 transition-all cursor-pointer ${
                      item.isCompleted
                        ? 'bg-green-50 border-green-300'
                        : 'bg-white border-gray-200 hover:border-primary-300'
                    }`}
                    onClick={() => handleToggleItemComplete(index)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          item.isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200'
                        }`}>
                          {item.isCompleted ? '✓' : ''}
                        </div>
                        <div>
                          <div className={`font-medium ${item.isCompleted ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                            {item.productName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.quantityKg}kg • {item.trays > 0 ? `${item.trays} trays` : ''}{item.tubs > 0 ? ` ${item.tubs} tubs` : ''}
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="text-gray-600">{item.boxes} boxes</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-primary-50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-700 mb-3">Order Summary</h3>
              <div className="grid grid-cols-5 gap-3 text-center">
                <div>
                  <div className="text-xl font-bold text-gray-800">{selectedOrder.totalWeight}</div>
                  <div className="text-xs text-gray-600">kg</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-800">{selectedOrder.totalTrays}</div>
                  <div className="text-xs text-gray-600">Trays</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-800">{selectedOrder.totalTubs}</div>
                  <div className="text-xs text-gray-600">Tubs</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-primary-600">{selectedOrder.totalBoxes}</div>
                  <div className="text-xs text-gray-600">Boxes</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-purple-600">{getLabelCount(selectedOrder)}</div>
                  <div className="text-xs text-gray-600">Labels</div>
                </div>
              </div>
            </div>

            {/* Status Change */}
            <div className="mb-4">
              <h3 className="font-semibold text-gray-700 mb-3">Change Status</h3>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleStatusChange(selectedOrder.id, 'pending')}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    selectedOrder.status === 'pending'
                      ? 'bg-amber-500 text-white'
                      : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  }`}
                  disabled={selectedOrder.status === 'pending'}
                >
                  ⏳ Pending
                </button>
                <button
                  onClick={() => handleStatusChange(selectedOrder.id, 'in-progress')}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    selectedOrder.status === 'in-progress'
                      ? 'bg-purple-500 text-white'
                      : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                  }`}
                  disabled={selectedOrder.status === 'in-progress'}
                >
                  🔄 In Progress
                </button>
                <button
                  onClick={() => handleStatusChange(selectedOrder.id, 'completed')}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    selectedOrder.status === 'completed'
                      ? 'bg-green-500 text-white'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                  disabled={selectedOrder.status === 'completed'}
                >
                  ✅ Completed
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              {isOwner && (
                <button
                  onClick={() => handleDeleteOrder(selectedOrder)}
                  className="py-2 px-4 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                  title="Delete order (Owner only)"
                >
                  🗑️
                </button>
              )}
              <button
                onClick={() => {
                  // Find the customer to pass state
                  const customer = customers.find(c => c.id === selectedOrder.customerId);
                  setSelectedOrder(null);
                  navigate(`/orders/edit/${selectedOrder.id}`, {
                    state: { customer, order: selectedOrder }
                  });
                }}
                className="btn-secondary flex-1"
              >
                ✏️ Edit Order
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="btn-primary flex-1"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

