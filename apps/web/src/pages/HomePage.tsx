import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          🌭 Sausage & Burger Packing Assistant 🍔
        </h1>
        <p className="text-xl text-gray-600">
          Calculate packing requirements for your orders quickly and accurately
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-8">
        <Link
          to="/customers"
          className="card hover:shadow-xl transition-all transform hover:-translate-y-1 border-2 border-primary-100 hover:border-primary-400 py-12"
        >
          <div className="text-6xl mb-6 text-center">📝</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3 text-center">New Order</h2>
          <p className="text-gray-600 text-center">
            Create a new packing order for a customer
          </p>
        </Link>

        <Link
          to="/orders"
          className="card hover:shadow-xl transition-all transform hover:-translate-y-1 border-2 border-gray-100 hover:border-gray-300 py-12"
        >
          <div className="text-6xl mb-6 text-center">📋</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3 text-center">Order History</h2>
          <p className="text-gray-600 text-center">
            View and manage past orders
          </p>
        </Link>
      </div>
    </div>
  );
}

