import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore, type Order } from '../store';
import type { OrderItem } from '../types/order';
import { useAuth } from '../lib/auth';

const statusColors: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  confirmed: 'bg-blue-100 text-blue-700',
  draft: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-red-100 text-red-700',
  in_progress: 'bg-purple-100 text-purple-700',
};

type OrderStatus = 'draft' | 'confirmed' | 'completed' | 'cancelled';
type GroupBy = 'date' | 'status' | 'customer';

export function OrdersPage() {
  const navigate = useNavigate();
  const { isOwner } = useAuth();
  const [statusFilter, setStatusFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [groupBy, setGroupBy] = useState<GroupBy>('date');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { orders, updateOrderStatus, updateOrder, deleteOrder, customers } = useAppStore();

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
    } else if (someCompleted && selectedOrder.status !== 'cancelled') {
      newStatus = 'confirmed'; // Use confirmed as "in progress"
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

  // Calculate label count for an order (1 label per tray + 1 label per tub + 1 label per box)
  const getLabelCount = (order: Order) => order.totalTrays + order.totalTubs + order.totalBoxes;

  // Get unique customers from orders
  const uniqueCustomers = useMemo(() => {
    const customerMap = new Map<string, string>();
    orders.forEach(o => customerMap.set(o.customerId, o.customerName));
    return Array.from(customerMap.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [orders]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter(o => o.status === statusFilter);
    }

    // Filter by customer
    if (customerFilter !== 'all') {
      result = result.filter(o => o.customerId === customerFilter);
    }

    return result;
  }, [orders, statusFilter, customerFilter]);

  // Group orders based on selected grouping
  const groupedOrders = useMemo(() => {
    const groups: Record<string, { label: string; orders: Order[] }> = {};

    // Sort all orders by date descending first
    const sortedOrders = [...filteredOrders].sort((a, b) => b.orderDate.localeCompare(a.orderDate));

    sortedOrders.forEach(order => {
      let groupKey: string;
      let groupLabel: string;

      switch (groupBy) {
        case 'date':
          groupKey = order.orderDate;
          groupLabel = order.orderDate;
          break;
        case 'status':
          groupKey = order.status;
          groupLabel = order.status.charAt(0).toUpperCase() + order.status.slice(1);
          break;
        case 'customer':
          groupKey = order.customerId;
          groupLabel = order.customerName;
          break;
      }

      if (!groups[groupKey]) {
        groups[groupKey] = { label: groupLabel, orders: [] };
      }
      groups[groupKey].orders.push(order);
    });

    // Convert to array and sort groups
    let groupArray = Object.entries(groups).map(([key, value]) => ({
      key,
      label: value.label,
      orders: value.orders,
    }));

    // Sort groups appropriately
    if (groupBy === 'date') {
      groupArray.sort((a, b) => b.key.localeCompare(a.key)); // Latest first
    } else if (groupBy === 'status') {
      const statusOrder = ['confirmed', 'draft', 'completed', 'cancelled'];
      groupArray.sort((a, b) => statusOrder.indexOf(a.key) - statusOrder.indexOf(b.key));
    } else {
      groupArray.sort((a, b) => a.label.localeCompare(b.label)); // Alphabetical
    }

    return groupArray;
  }, [filteredOrders, groupBy]);

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
  };

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateOrderStatus(orderId, newStatus);
    // Update local selected order state to reflect the change
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Order History</h1>
        <div className="flex flex-wrap gap-2">
          {/* Group By Selector */}
          <select
            className="input w-36"
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupBy)}
          >
            <option value="date">Group by Date</option>
            <option value="status">Group by Status</option>
            <option value="customer">Group by Customer</option>
          </select>
          {/* Customer Filter */}
          <select
            className="input w-36"
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
          >
            <option value="all">All Customers</option>
            {uniqueCustomers.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
          {/* Status Filter */}
          <select
            className="input w-36"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="space-y-6">
        {groupedOrders.map(group => (
          <div key={group.key}>
            {/* Group Header */}
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-lg font-semibold text-gray-700">{group.label}</h2>
              <span className="text-sm text-gray-400">({group.orders.length} orders)</span>
            </div>

            {/* Orders in this group */}
            <div className="space-y-3">
              {group.orders.map(order => (
                <div
                  key={order.id}
                  className="card hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleOrderClick(order)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-800">{order.customerName}</h3>
                      <p className="text-gray-500 text-sm">{order.orderNumber}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status]}`}>
                      {order.status.toUpperCase()}
                    </span>
                  </div>
                  {/* Progress Bar */}
                  {order.items.length > 0 && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{getCompletionProgress(order).completed}/{getCompletionProgress(order).total} items</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            getCompletionProgress(order).completed === getCompletionProgress(order).total
                              ? 'bg-green-500'
                              : 'bg-blue-500'
                          }`}
                          style={{
                            width: `${(getCompletionProgress(order).completed / getCompletionProgress(order).total) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm text-gray-500 mt-3 pt-3 border-t">
                    <span>📅 {order.orderDate}</span>
                    <div className="flex gap-3">
                      <span>📦 {order.totalBoxes}</span>
                      <span>🏷️ {getLabelCount(order)}</span>
                      <span>⚖️ {order.totalWeight}kg</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {filteredOrders.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">📋</div>
            <p>No orders found</p>
          </div>
        )}
      </div>

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
                        : 'bg-gray-50 border-transparent hover:border-gray-300'
                    }`}
                    onClick={() => handleToggleItemComplete(index)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        {/* Toggle Button */}
                        <button
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            item.isCompleted
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'border-gray-400 hover:border-green-500'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleItemComplete(index);
                          }}
                        >
                          {item.isCompleted && <span className="text-sm">✓</span>}
                        </button>
                        <div>
                          <span className={`font-medium ${item.isCompleted ? 'text-green-700 line-through' : 'text-gray-800'}`}>
                            {item.productName}
                          </span>
                          <span className="ml-2 text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-600">
                            {item.packType.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <span className={`font-medium ${item.isCompleted ? 'text-green-600' : 'text-gray-600'}`}>
                        {item.quantityKg} kg
                      </span>
                    </div>
                    <div className="flex gap-4 mt-2 text-sm text-gray-500 ml-9">
                      {item.packType === 'tray' ? (
                        <span>🗄️ {item.trays} trays</span>
                      ) : (
                        <span>🪣 {item.tubs} tubs</span>
                      )}
                      <span>📦 {item.boxes} boxes</span>
                      {item.isCompleted && <span className="text-green-600 font-medium">✅ Done</span>}
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
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleStatusChange(selectedOrder.id, 'confirmed')}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    selectedOrder.status === 'confirmed'
                      ? 'bg-blue-500 text-white'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                  disabled={selectedOrder.status === 'confirmed'}
                >
                  ✓ Confirmed
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
                <button
                  onClick={() => handleStatusChange(selectedOrder.id, 'draft')}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    selectedOrder.status === 'draft'
                      ? 'bg-amber-500 text-white'
                      : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  }`}
                  disabled={selectedOrder.status === 'draft'}
                >
                  📝 Draft
                </button>
                <button
                  onClick={() => handleStatusChange(selectedOrder.id, 'cancelled')}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    selectedOrder.status === 'cancelled'
                      ? 'bg-red-500 text-white'
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                  disabled={selectedOrder.status === 'cancelled'}
                >
                  ❌ Cancelled
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

