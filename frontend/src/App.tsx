import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
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
        <Route path="properties" element={<Placeholder title="Properties" />} />
        <Route path="tenants" element={<Placeholder title="Tenants" />} />
        <Route path="inquiries" element={<Placeholder title="Inquiries" />} />
        <Route path="contracts" element={<Placeholder title="Contracts" />} />
        <Route path="maintenance" element={<Placeholder title="Maintenance" />} />
        <Route path="assets" element={<Placeholder title="Assets" />} />
        <Route path="accounting" element={<Placeholder title="Accounting" />} />
        <Route path="petty-cash" element={<Placeholder title="Petty Cash" />} />
        <Route path="reports" element={<Placeholder title="Reports" />} />
        <Route path="users" element={<Placeholder title="Users" />} />
        <Route path="settings" element={<Placeholder title="Settings" />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
