import { Route, Routes, Link } from 'react-router-dom';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import HomePage from '@/pages/customer/HomePage';
import ProductsPage from '@/pages/customer/ProductsPage';
import CategoriesPage from '@/pages/customer/CategoriesPage';
import CategoryPage from '@/pages/customer/CategoryPage';
import ProductDetailPage from '@/pages/customer/ProductDetailPage';
import SearchPage from '@/pages/customer/SearchPage';
import CartPage from '@/pages/customer/CartPage';
import CheckoutPage from '@/pages/customer/CheckoutPage';
import LoginPage from '@/pages/customer/LoginPage';
import RegisterPage from '@/pages/customer/RegisterPage';
import ForgotPasswordPage from '@/pages/customer/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/customer/ResetPasswordPage';
import ProfilePage from '@/pages/customer/ProfilePage';
import AddressesPage from '@/pages/customer/AddressesPage';
import OrdersPage from '@/pages/customer/OrdersPage';
import OrderDetailPage from '@/pages/customer/OrderDetailPage';
import ContactPage from '@/pages/customer/ContactPage';
import AboutPage from '@/pages/customer/AboutPage';
import PrivacyPage from '@/pages/customer/PrivacyPage';
import TermsPage from '@/pages/customer/TermsPage';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminProducts from '@/pages/admin/AdminProducts';
import AdminProductForm from '@/pages/admin/AdminProductForm';
import AdminCategories from '@/pages/admin/AdminCategories';
import AdminOrders from '@/pages/admin/AdminOrders';
import AdminOrderDetail from '@/pages/admin/AdminOrderDetail';
import AdminCustomers from '@/pages/admin/AdminCustomers';

function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <p className="font-display text-7xl text-forest-600">404</p>
      <h1 className="mt-4 font-display text-3xl text-ink-900">Page not found</h1>
      <p className="mt-3 text-sm text-ink-500">The page you're looking for doesn't exist or has moved.</p>
      <Link to="/" className="mt-6 rounded-lg bg-forest-700 px-6 py-3 text-sm font-semibold text-white hover:bg-forest-800">Back to home</Link>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<CustomerLayout />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/:slug" element={<ProductDetailPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="categories/:slug" element={<CategoryPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="terms" element={<TermsPage />} />
        <Route path="checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
        <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="addresses" element={<ProtectedRoute><AddressesPage /></ProtectedRoute>} />
        <Route path="orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
        <Route path="orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="products/new" element={<AdminProductForm />} />
        <Route path="products/:id" element={<AdminProductForm />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="orders/:id" element={<AdminOrderDetail />} />
        <Route path="customers" element={<AdminCustomers />} />
      </Route>
    </Routes>
  );
}
