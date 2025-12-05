import React, { useContext, useEffect } from 'react';
import { CssBaseline, ThemeProvider, createTheme, Box, CircularProgress } from '@mui/material';
import Navigation from './components/Navigation';
import ResponsiveGrid from './components/ResponsiveGrid';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import ProductsPage from './pages/ProductsPage';
import CustomersPage from './pages/CustomersPage';
import WalletPage from './pages/WalletPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminSettingsPage from './pages/AdminSettingsPage';
import WalletOnboardingPage from './pages/WalletOnboardingPage';
import ProductCatalogPage from './pages/ProductCatalogPage';
import DistributorDashboard from './pages/DistributorDashboard';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import BranchDashboard from './pages/BranchDashboard';
import AdminProductManager from './pages/AdminProductManager';
import CheckoutPage from './pages/CheckoutPage';
import AdminWithdrawalsPage from './pages/AdminWithdrawalsPage';
import AdminDepositManager from './pages/AdminDepositManager';
import AdminDashboard from './pages/AdminDashboard';
import CommissionSettingsPage from './pages/CommissionSettingsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import OrderDetailPage from './pages/OrderDetailPage';
import WishlistPage from './pages/WishlistPage';
import UserSettingsPage from './pages/UserSettingsPage';
import { CartProvider } from './context/CartContext';
import AuthContext from './context/AuthContext';

// Create a custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
});

function App() {
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/app/config');
        if (res.ok) {
          const config = await res.json();
          if (config.siteName) document.title = config.siteName;
          if (config.siteIconUrl) {
            let link = document.querySelector("link[rel~='icon']");
            if (!link) {
              link = document.createElement('link');
              link.rel = 'icon';
              document.getElementsByTagName('head')[0].appendChild(link);
            }
            link.href = config.siteIconUrl;
          }
        }
      } catch (err) {
        console.error('Failed to load app config', err);
      }
    };
    fetchConfig();
  }, []);

  const { loading } = useContext(AuthContext);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <CartProvider>
        <BrowserRouter>
          <Navigation>
            <Routes>
              <Route path="/" element={<ProtectedRoute><ResponsiveGrid /></ProtectedRoute>} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
              <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><UserSettingsPage /></ProtectedRoute>} />
              <Route path="/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />
              <Route path="/products" element={<ProtectedRoute allowedRoles={['admin', 'distributor']}><ProductsPage /></ProtectedRoute>} />
              <Route path="/customers" element={<ProtectedRoute allowedRoles={['admin', 'distributor']}><CustomersPage /></ProtectedRoute>} />
              <Route path="/onboarding" element={<ProtectedRoute><WalletOnboardingPage /></ProtectedRoute>} />
              <Route path="/catalog" element={<ProtectedRoute allowedRoles={['customer']}><ProductCatalogPage /></ProtectedRoute>} />
              <Route path="/product/:id" element={<ProtectedRoute><ProductDetailPage /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><OrderHistoryPage /></ProtectedRoute>} />
              <Route path="/order/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
              <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
              <Route path="/checkout" element={<ProtectedRoute allowedRoles={['customer']}><CheckoutPage /></ProtectedRoute>} />
              <Route path="/distributor" element={<ProtectedRoute allowedRoles={['distributor']}><DistributorDashboard /></ProtectedRoute>} />
              <Route path="/branch" element={<ProtectedRoute allowedRoles={['branch']}><BranchDashboard /></ProtectedRoute>} />
              <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><AdminSettingsPage /></ProtectedRoute>} />
              <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/commissions" element={<ProtectedRoute allowedRoles={['admin']}><CommissionSettingsPage /></ProtectedRoute>} />
              <Route path="/admin/products" element={<ProtectedRoute allowedRoles={['admin', 'distributor']}><AdminProductManager /></ProtectedRoute>} />
              <Route path="/admin/withdrawals" element={<ProtectedRoute allowedRoles={['admin']}><AdminWithdrawalsPage /></ProtectedRoute>} />
              <Route path="/admin/deposits" element={<ProtectedRoute allowedRoles={['admin']}><AdminDepositManager /></ProtectedRoute>} />
            </Routes>
          </Navigation>
        </BrowserRouter>
      </CartProvider>
    </ThemeProvider>
  );
}

export default App;
