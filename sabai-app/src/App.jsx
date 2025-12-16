// ===== src/App.jsx ===== (VERSION AMÉLIORÉE)
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { ServiceStatusProvider } from './context/ServiceStatusContext';
import { Toaster } from "react-hot-toast";
import ScrollToTop from "./components/ScrollToTop";
import ErrorBoundary from "./components/ErrorBoundary";

// Client pages - chargement immédiat (pages principales)
import Home from './pages/client/Home';
import Cart from './pages/client/Cart';
import Checkout from './pages/client/Checkout';
import CheckoutSuccess from './pages/client/CheckoutSuccess';

// ✅ LAZY LOADING - Pages secondaires (CGV, politique, etc.)
const Cgv = lazy(() => import('./pages/client/Cgv'));
const Politique = lazy(() => import('./pages/client/Politique'));
const Mention = lazy(() => import('./pages/client/Mention'));
const NotFound = lazy(() => import('./pages/NotFound'));

// ✅ LAZY LOADING - Admin pages (code splitting)
const AdminLogin = lazy(() => import('./pages/admin/Login'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminOrders = lazy(() => import('./pages/admin/Orders'));
const AdminProducts = lazy(() => import('./pages/admin/Products'));
const AdminServiceHours = lazy(() => import('./pages/admin/AdminServiceHours'));

// Components
import ProtectedRoute from './components/ProtectedRoute';

// Layout
import Navbar from './layout/Navbar';
import Footer from './layout/Footer';

// ✅ Composant de fallback pour le lazy loading
const LoadingFallback = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    fontSize: '1.5rem',
    color: '#666'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ 
        marginBottom: '1rem',
        fontSize: '3rem'
      }}>⏳</div>
      <div>Chargement...</div>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <ServiceStatusProvider>
            <Toaster position="bottom-right" />
            <Router>
              <ScrollToTop />
              <div className="app">
                <Suspense fallback={<LoadingFallback />}>
                  <Routes>
                    {/* Routes Client */}
                    <Route path="/" element={<><Navbar /><Home /><Footer /></>} />
                    <Route path="/cart" element={<><Navbar /><Cart /><Footer /></>} />
                    <Route path="/checkout" element={<><Navbar /><Checkout /><Footer /></>} />
                    <Route path="/checkout/success" element={<><Navbar /><CheckoutSuccess /><Footer /></>} /> 
                    <Route path="/cgv" element={<><Navbar /><Cgv /><Footer /></>}/>
                    <Route path="/politique" element={<><Navbar /><Politique /><Footer /></>} />
                    <Route path="/mention" element={<><Navbar /><Mention /><Footer /></>} />

                    {/* Routes Admin (pas de footer ici) */}
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                    <Route path="/admin/orders" element={<ProtectedRoute><AdminOrders /></ProtectedRoute>} />
                    <Route path="/admin/products" element={<ProtectedRoute><AdminProducts /></ProtectedRoute>} />
                    <Route path="/admin/horaires" element={<ProtectedRoute><AdminServiceHours /></ProtectedRoute>} />

                    {/* 404 - Doit être en dernier */}
                    <Route path="*" element={<><Navbar /><NotFound /><Footer /></>} />
                  </Routes>
                </Suspense>
              </div>
            </Router>
          </ServiceStatusProvider>
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;