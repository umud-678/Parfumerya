import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DeployConfigGuard from './components/DeployConfigGuard';
import AdminLayout from './components/layout/AdminLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import CategoriesPage from './pages/CategoriesPage';
import BrandsPage from './pages/BrandsPage';
import OrdersPage from './pages/OrdersPage';
import UsersPage from './pages/UsersPage';
import ReviewsPage from './pages/ReviewsPage';
import ReportsPage from './pages/ReportsPage';
import CouponsPage from './pages/CouponsPage';
import ShippingPage from './pages/ShippingPage';
import PaymentsPage from './pages/PaymentsPage';
import NotificationsPage from './pages/NotificationsPage';
import HeroVideoPage from './pages/HeroVideoPage';
import StockPage from './pages/StockPage';
import WishlistAdminPage from './pages/WishlistAdminPage';
import EmailPage from './pages/EmailPage';
import SettingsPage from './pages/SettingsPage';
import SecurityPage from './pages/SecurityPage';

export default function App() {
  return (
    <DeployConfigGuard>
      <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AdminLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/brands" element={<BrandsPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/coupons" element={<CouponsPage />} />
          <Route path="/campaigns" element={<CouponsPage />} />
          <Route path="/shipping" element={<ShippingPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/hero-video" element={<HeroVideoPage />} />
          <Route path="/banners" element={<Navigate to="/hero-video" replace />} />
          <Route path="/stock" element={<StockPage />} />
          <Route path="/wishlist" element={<WishlistAdminPage />} />
          <Route path="/email" element={<EmailPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/security" element={<SecurityPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </DeployConfigGuard>
  );
}
