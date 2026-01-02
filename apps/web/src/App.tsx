import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { CustomersPage } from './pages/CustomersPage';
import { NewOrderPage } from './pages/NewOrderPage';
import { EditOrderPage } from './pages/EditOrderPage';
import { OrdersPage } from './pages/OrdersPage';
import { ProductsPage } from './pages/ProductsPage';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/orders/new/:customerId" element={<NewOrderPage />} />
        <Route path="/orders/edit/:orderId" element={<EditOrderPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/products" element={<ProductsPage />} />
      </Routes>
    </Layout>
  );
}

export default App;

