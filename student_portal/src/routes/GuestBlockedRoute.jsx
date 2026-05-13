import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function GuestBlockedRoute() {
  const { isGuest } = useAuth();
  return isGuest ? <Navigate to="/dashboard" replace /> : <Outlet />;
}
