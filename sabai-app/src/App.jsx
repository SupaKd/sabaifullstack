// ===== src/App.jsx ===== (MISE À JOUR)
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { ServiceStatusProvider } from './context/ServiceStatusContext';
import { Toaster } from "react-hot-toast";

// Client pages
import Home from './pages/client/Home';
import Cart from './pages/client/Cart';
import Checkout from './pages/client/Checkout';
import CheckoutSuccess from './pages/client/CheckoutSuccess';
import Cgv from './pages/client/Cgv';
import Politique from './pages/client/Politique';
import Mention from './pages/client/Mention';
import NotFound from './pages/NotFound'; // ✅ AJOUTÉ

// Admin pages
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminOrders from './pages/admin/Orders';
import AdminProducts from './pages/admin/Products';
import AdminServiceHours from './pages/admin/AdminServiceHours'; 

// Components
import ProtectedRoute from './components/ProtectedRoute';

// Layout
import Navbar from './layout/Navbar';
import Footer from './layout/Footer';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ServiceStatusProvider>
          <Toaster position="bottom-right" />
          <Router>
            <div className="app">

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

            </div>
          </Router>
        </ServiceStatusProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;