import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Consumer Pages
import LandingPage from './pages/consumer/LandingPage';
import ConsumerChat from './pages/consumer/ConsumerChat';
import MyBookings from './pages/consumer/MyBookings';
import PromotionsPage from './pages/consumer/PromotionsPage';

// Business Components & Pages
import BusinessLayout from './components/business/BusinessLayout';
import BusinessHome from './pages/business/BusinessHome';
import BusinessCalendar from './pages/business/BusinessCalendar';
import BusinessAppointments from './pages/business/BusinessAppointments';
import BusinessClients from './pages/business/BusinessClients';
import BusinessServices from './pages/business/BusinessServices';
import BusinessInbox from './pages/business/BusinessInbox';
import BusinessSettings from './pages/business/BusinessSettings';
import BusinessTeam from './pages/business/BusinessTeam';
import BusinessPromotions from './pages/business/BusinessPromotions';
import BusinessRegister from './pages/business/BusinessRegister';
import BusinessLogin from './pages/business/BusinessLogin';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';

// Layout wrapper for Consumer
function ConsumerLayout() {
  useEffect(() => {
    document.documentElement.removeAttribute('data-theme');
  }, []);

  return <Outlet />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Consumer Routes */}
          <Route element={<ConsumerLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/promotions" element={<PromotionsPage />} />
          </Route>
          <Route path="/chat" element={<ConsumerChat />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />

          {/* Business Auth Routes (Standalone Layout) */}
          <Route path="/business/register" element={<BusinessRegister />} />
          <Route path="/business/login" element={<BusinessLogin />} />

          {/* Business Dashboard Routes (Protected + Nested in BusinessLayout) */}
          <Route path="/business" element={
            <ProtectedRoute>
              <BusinessLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/business/dashboard" replace />} />
            <Route path="dashboard" element={<BusinessHome />} />
            <Route path="calendar" element={<BusinessCalendar />} />
            <Route path="appointments" element={<BusinessAppointments />} />
            <Route path="clients" element={<BusinessClients />} />
            <Route path="services" element={<BusinessServices />} />
            <Route path="team" element={<BusinessTeam />} />
            <Route path="promotions" element={<BusinessPromotions />} />
            <Route path="inbox" element={<BusinessInbox />} />
            <Route path="settings" element={<BusinessSettings />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
