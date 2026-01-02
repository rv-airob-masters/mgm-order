import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { CustomersPage } from './pages/CustomersPage';
import { NewOrderPage } from './pages/NewOrderPage';
import { EditOrderPage } from './pages/EditOrderPage';
import { OrdersPage } from './pages/OrdersPage';
import { ProductsPage } from './pages/ProductsPage';
import { LoginPage } from './pages/LoginPage';
import { useAuth } from './lib/auth';

// Protected route wrapper for admin-only pages
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/products" replace />;
  }

  return <>{children}</>;
}

function App() {
  const { user, isLoading } = useAuth();

  // Show login page if not authenticated
  if (!isLoading && !user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="text-4xl mb-4">🌭</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<AdminRoute><HomePage /></AdminRoute>} />
        <Route path="/customers" element={<AdminRoute><CustomersPage /></AdminRoute>} />
        <Route path="/orders/new/:customerId" element={<AdminRoute><NewOrderPage /></AdminRoute>} />
        <Route path="/orders/edit/:orderId" element={<AdminRoute><EditOrderPage /></AdminRoute>} />
        <Route path="/orders" element={<AdminRoute><OrdersPage /></AdminRoute>} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;

