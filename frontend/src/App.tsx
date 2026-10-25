import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { RedirectIfAuthenticated, RequireAdmin, RequireAuth } from './auth/routeGuards';
import { CartProvider } from './cart/CartProvider';
import { CartPage } from './pages/CartPage';
import { AllOrdersPage } from './pages/AllOrdersPage';
import { DashboardPage } from './pages/DashboardPage';
import { MyOrdersPage } from './pages/MyOrdersPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

/** Route table, separate from the router so tests can render it in a MemoryRouter. */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<RedirectIfAuthenticated />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/orders" element={<MyOrdersPage />} />
        <Route element={<RequireAdmin />}>
          <Route path="/admin/orders" element={<AllOrdersPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
