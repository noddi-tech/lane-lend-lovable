import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface ProtectedRouteProps {
  role?: 'admin' | 'customer';
}

export function ProtectedRoute({ role }: ProtectedRouteProps) {
  const { user, role: userRole, loading } = useAuthStore();
  const isDevMode = import.meta.env.VITE_DEV_MODE === 'true';

  if (loading && !isDevMode) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // In dev mode, allow access if dev auth is set
  if (!user && !isDevMode) {
    return <Navigate to="/auth" replace />;
  }

  if (role && userRole !== role && !isDevMode) {
    return <Navigate to="/" replace />;
  }

  // In dev mode, allow role-based access with dev auth
  if (isDevMode && role && userRole !== role) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
