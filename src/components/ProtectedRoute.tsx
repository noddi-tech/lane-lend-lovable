import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface ProtectedRouteProps {
  role?: 'admin' | 'customer';
}

export function ProtectedRoute({ role }: ProtectedRouteProps) {
  const { user, role: userRole, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (role && userRole !== role) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
