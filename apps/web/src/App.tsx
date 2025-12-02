import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { CustomersPage } from './pages/CustomersPage';
import { NewOrderPage } from './pages/NewOrderPage';
import { OrdersPage } from './pages/OrdersPage';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/orders/new/:customerId" element={<NewOrderPage />} />
        <Route path="/orders" element={<OrdersPage />} />
      </Routes>
    </Layout>
  );
}

export default App;

