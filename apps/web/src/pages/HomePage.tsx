import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store';

export function HomePage() {
  const { orders } = useAppStore();

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

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          🌭 Sausage & Burger Packing Assistant 🍔
        </h1>
        <p className="text-lg text-gray-600">
          Calculate packing requirements for your orders quickly and accurately
        </p>
      </div>

      {/* Today's Dashboard */}
      <div className="card bg-gradient-to-r from-primary-50 to-blue-50 border-2 border-primary-200 mb-8">
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

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <Link
          to="/customers"
          className="card hover:shadow-xl transition-all transform hover:-translate-y-1 border-2 border-primary-100 hover:border-primary-400 py-10"
        >
          <div className="text-5xl mb-4 text-center">📝</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">New Order</h2>
          <p className="text-gray-600 text-center text-sm">
            Create a new packing order for a customer
          </p>
        </Link>

        <Link
          to="/orders"
          className="card hover:shadow-xl transition-all transform hover:-translate-y-1 border-2 border-gray-100 hover:border-gray-300 py-10"
        >
          <div className="text-5xl mb-4 text-center">📋</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">Order History</h2>
          <p className="text-gray-600 text-center text-sm">
            View and manage past orders
          </p>
        </Link>
      </div>
    </div>
  );
}

