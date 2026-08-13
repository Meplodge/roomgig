import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';

import Login from './pages/Login';
import Overview from './pages/Overview';
import Users from './pages/Users';
import UserDetail from './pages/UserDetail';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import RoommateListings from './pages/RoommateListings';
import Moderation from './pages/Moderation';
import Bookings from './pages/Bookings';
import Payments from './pages/Payments';
import Reviews from './pages/Reviews';
import Messaging from './pages/Messaging';
import Notifications from './pages/Notifications';
import Analytics from './pages/Analytics';
import Admins from './pages/Admins';
import AuditLog from './pages/AuditLog';
import SettingsPage from './pages/Settings';
import NotFound from './pages/NotFound';

const FullPageLoader = () => (
  <div className="login-page">
    <div className="col" style={{ alignItems: 'center', gap: 12 }}>
      <span className="spinner" style={{ width: 24, height: 24 }} />
      <span className="muted">Checking your access...</span>
    </div>
  </div>
);

/** Requires both a Supabase session and an active admin_users row. */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

/** Hides a route from admins whose role is not permitted. */
const RoleRoute = ({ roles, children }) => {
  const { can } = useAuth();
  if (!can(...roles)) return <Navigate to="/" replace />;
  return children;
};

const App = () => {
  const { isAuthenticated, loading } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          loading ? (
            <FullPageLoader />
          ) : isAuthenticated ? (
            <Navigate to="/" replace />
          ) : (
            <Login />
          )
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Overview />} />
        <Route path="/users" element={<Users />} />
        <Route path="/users/:id" element={<UserDetail />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/properties/:id" element={<PropertyDetail />} />
        <Route path="/roommate-listings" element={<RoommateListings />} />
        <Route path="/moderation" element={<Moderation />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/messaging" element={<Messaging />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route
          path="/admins"
          element={
            <RoleRoute roles={['super_admin']}>
              <Admins />
            </RoleRoute>
          }
        />
        <Route
          path="/audit-log"
          element={
            <RoleRoute roles={['super_admin', 'admin']}>
              <AuditLog />
            </RoleRoute>
          }
        />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

export default App;
