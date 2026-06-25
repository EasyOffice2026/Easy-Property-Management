import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Properties } from './pages/Properties';
import { Tenants } from './pages/Tenants';
import { Inquiries } from './pages/Inquiries';
import { Contracts } from './pages/Contracts';
import { WorkOrders } from './pages/WorkOrders';
import { Assets } from './pages/Assets';
import { PettyCash } from './pages/PettyCash';
import { Placeholder } from './pages/Placeholder';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="properties" element={<Properties />} />
        <Route path="tenants" element={<Tenants />} />
        <Route path="inquiries" element={<Inquiries />} />
        <Route path="contracts" element={<Contracts />} />
        <Route path="maintenance" element={<WorkOrders />} />
        <Route path="assets" element={<Assets />} />
        <Route path="accounting" element={<Placeholder title="Accounting" />} />
        <Route path="petty-cash" element={<PettyCash />} />
        <Route path="reports" element={<Placeholder title="Reports" />} />
        <Route path="users" element={<Placeholder title="Users" />} />
        <Route path="settings" element={<Placeholder title="Settings" />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
