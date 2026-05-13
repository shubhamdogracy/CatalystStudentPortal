import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PublicOnlyRoute() {
  const { student, loading } = useAuth();
  if (loading) return null;
  return !student ? <Outlet /> : <Navigate to="/dashboard" replace />;
}
