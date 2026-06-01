import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AdminLayout from './components/admin/AdminLayout.jsx';
import Footer from './components/layout/Footer.jsx';
import Header from './components/layout/Header.jsx';
import BlogPage from './pages/BlogPage.jsx';
import CartPage from './pages/CartPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import OrderHistoryPage from './pages/OrderHistoryPage.jsx';
import ProductDetailPage from './pages/ProductDetailPage.jsx';
import ProductListPage from './pages/ProductListPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import AdminCategories from './pages/admin/AdminCategories.jsx';
import AdminCustomers from './pages/admin/AdminCustomers.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminOrders from './pages/admin/AdminOrders.jsx';
import AdminProducts from './pages/admin/AdminProducts.jsx';
import CleaningServicePage from './pages/services/CleaningServicePage.jsx';
import TradeInServicePage from './pages/services/TradeInServicePage.jsx';
import WarrantyServicePage from './pages/services/WarrantyServicePage.jsx';

function ProtectedRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

function AdminRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}

function RootLayout() {
  const location = useLocation();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/register';

  if (isAuthenticated && user?.role === 'admin' && !location.pathname.startsWith('/admin')) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="app-shell">
      {!isAuthRoute && <Header />}
      <Outlet />
      {!isAuthRoute && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootLayout />}>
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductListPage />} />
          <Route path="products/:productId" element={<ProductDetailPage />} />
          <Route path="blog" element={<BlogPage />} />
          <Route path="services/warranty" element={<WarrantyServicePage />} />
          <Route path="services/trade-in" element={<TradeInServicePage />} />
          <Route path="services/cleaning" element={<CleaningServicePage />} />
          <Route path="cart" element={<CartPage />} />
          <Route
            path="checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="orders"
            element={
              <ProtectedRoute>
                <OrderHistoryPage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="customers" element={<AdminCustomers />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
