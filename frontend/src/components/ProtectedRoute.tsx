import { Navigate } from 'react-router-dom';
import { useAppStore } from '../store';

export function ProtectedRoute({ children }: { children: JSX.Element }) {
  const accessToken = useAppStore((state) => state.accessToken);
  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
