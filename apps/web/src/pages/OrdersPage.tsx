import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore, type Order, CUSTOMER_RULES } from '../store';

const statusColors: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  confirmed: 'bg-blue-100 text-blue-700',
  draft: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-red-100 text-red-700',
};

type OrderStatus = 'draft' | 'confirmed' | 'completed' | 'cancelled';

export function OrdersPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { orders, updateOrderStatus, customers } = useAppStore();

  // Calculate label count for an order (1 label per tray + 1 label per tub + 1 label per box)
  const getLabelCount = (order: Order) => order.totalTrays + order.totalTubs + order.totalBoxes;

  // Get unique dates from orders for the date picker
  const uniqueDates = useMemo(() => {
    const dates = [...new Set(orders.map(o => o.orderDate))];
    return dates.sort((a, b) => b.localeCompare(a)); // Most recent first
  }, [orders]);

  const filteredOrders = useMemo(() => {
    let result = orders;

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter(o => o.status === statusFilter);
    }

    // Filter by date
    if (dateFilter) {
      result = result.filter(o => o.orderDate === dateFilter);
    }

    return result;
  }, [orders, statusFilter, dateFilter]);

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
        <div className="flex gap-3">
          {/* Date Filter */}
          <select
            className="input w-40"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="">All Dates</option>
            {uniqueDates.map(date => (
              <option key={date} value={date}>{date}</option>
            ))}
          </select>
          {/* Status Filter */}
          <select
            className="input w-40"
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

      <div className="space-y-4">
        {filteredOrders.map(order => (
          <div
            key={order.id}
            className="card hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleOrderClick(order)}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold text-gray-800">{order.orderNumber}</h3>
                <p className="text-gray-600">{order.customerName}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status]}`}>
                {order.status.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-500 mt-4 pt-4 border-t">
              <span>📅 {order.orderDate}</span>
              <div className="flex gap-4">
                <span>📦 {order.totalBoxes} boxes</span>
                <span>🏷️ {getLabelCount(order)} labels</span>
                <span>⚖️ {order.totalWeight} kg</span>
              </div>
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
                <h2 className="text-xl font-bold text-gray-800">{selectedOrder.orderNumber}</h2>
                <p className="text-gray-600">{selectedOrder.customerName}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[selectedOrder.status]}`}>
                {selectedOrder.status.toUpperCase()}
              </span>
            </div>

            <div className="text-sm text-gray-500 mb-4">
              📅 Order Date: {selectedOrder.orderDate}
            </div>

            {/* Order Items */}
            <div className="mb-4">
              <h3 className="font-semibold text-gray-700 mb-3">Order Items</h3>
              <div className="space-y-3">
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-medium text-gray-800">{item.productName}</span>
                        <span className="ml-2 text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-600">
                          {item.packType.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-gray-600 font-medium">{item.quantityKg} kg</span>
                    </div>
                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                      {item.packType === 'tray' ? (
                        <span>🗄️ {item.trays} trays</span>
                      ) : (
                        <span>🪣 {item.tubs} tubs</span>
                      )}
                      <span>📦 {item.boxes} boxes</span>
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

