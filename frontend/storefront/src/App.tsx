import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { useDocumentLanguage } from './hooks/useDocumentLanguage';
import DeployConfigGuard from './components/DeployConfigGuard';
import CustomerNotificationToasts from './components/CustomerNotificationToasts';
import WishlistSync from './components/WishlistSync';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import WishlistPage from './pages/WishlistPage';
import AccountPage from './pages/AccountPage';
import OrdersPage from './pages/OrdersPage';
import CategoryPage from './pages/CategoryPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';

function I18nShell({ children }: { children: React.ReactNode }) {
  useDocumentLanguage();
  return (
    <>
      <WishlistSync />
      <CustomerNotificationToasts />
      {children}
    </>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-bg min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <DeployConfigGuard>
      <Provider store={store}>
      <BrowserRouter>
        <I18nShell>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/category/:slug" element={<CategoryPage />} />
              <Route path="/product/:slug" element={<ProductDetailPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/wishlist" element={<WishlistPage />} />
              <Route path="/account" element={<AccountPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
            </Routes>
          </Layout>
        </I18nShell>
      </BrowserRouter>
    </Provider>
    </DeployConfigGuard>
  );
}
