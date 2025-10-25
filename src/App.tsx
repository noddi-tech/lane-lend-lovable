import { useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { CustomerLayout } from '@/components/layouts/CustomerLayout';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import Index from './pages/Index';
import Auth from './pages/Auth';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

// Placeholder pages
const BookingWizard = () => <div className="text-center"><h1 className="text-3xl font-bold">Booking Wizard</h1><p className="mt-4 text-muted-foreground">Coming soon...</p></div>;
const MyBookings = () => <div className="text-center"><h1 className="text-3xl font-bold">My Bookings</h1><p className="mt-4 text-muted-foreground">Coming soon...</p></div>;
const Profile = () => <div className="text-center"><h1 className="text-3xl font-bold">Profile</h1><p className="mt-4 text-muted-foreground">Coming soon...</p></div>;
const Dashboard = () => <div className="text-center"><h1 className="text-3xl font-bold">Admin Dashboard</h1><p className="mt-4 text-muted-foreground">Coming soon...</p></div>;
const LanesManagement = () => <div className="text-center"><h1 className="text-3xl font-bold">Lanes Management</h1><p className="mt-4 text-muted-foreground">Coming soon...</p></div>;
const WorkersManagement = () => <div className="text-center"><h1 className="text-3xl font-bold">Workers Management</h1><p className="mt-4 text-muted-foreground">Coming soon...</p></div>;
const CapacityView = () => <div className="text-center"><h1 className="text-3xl font-bold">Capacity View</h1><p className="mt-4 text-muted-foreground">Coming soon...</p></div>;
const Settings = () => <div className="text-center"><h1 className="text-3xl font-bold">Settings</h1><p className="mt-4 text-muted-foreground">Coming soon...</p></div>;

function AppContent() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />

      {/* Customer Protected Routes */}
      <Route element={<ProtectedRoute role="customer" />}>
        <Route element={<CustomerLayout />}>
          <Route path="/book" element={<BookingWizard />} />
          <Route path="/bookings" element={<MyBookings />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>

      {/* Admin Protected Routes */}
      <Route element={<ProtectedRoute role="admin" />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="lanes" element={<LanesManagement />} />
          <Route path="workers" element={<WorkersManagement />} />
          <Route path="capacity" element={<CapacityView />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
