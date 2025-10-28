import { useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { DevPanel } from '@/components/DevPanel';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { CustomerLayout } from '@/components/layouts/CustomerLayout';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import Index from './pages/Index';
import Auth from './pages/Auth';
import NotFound from './pages/NotFound';
import BookingWizard from './pages/BookingWizard';
import MyBookings from './pages/MyBookings';
import Profile from './pages/Profile';
import Dashboard from './pages/admin/Dashboard';
import Lanes from './pages/admin/Lanes';
import Workers from './pages/admin/Workers';
import Capacity from './pages/admin/Capacity';
import AdminBookings from './pages/admin/Bookings';
import Analytics from './pages/admin/Analytics';
import Settings from './pages/admin/Settings';
import Skills from './pages/admin/Skills';
import Capabilities from './pages/admin/Capabilities';
import Contributions from './pages/admin/Contributions';
import SeedData from './pages/admin/SeedData';
import Simulation from './pages/admin/Simulation';
import DrivingGates from './pages/admin/DrivingGates';
import Stations from './pages/admin/Stations';
import DrivingGateLayout from './pages/admin/DrivingGateLayout';
import DrivingGateTest from './pages/admin/DrivingGateTest';
import Facilities from './pages/admin/Facilities';
import FacilityLayout from './pages/admin/FacilityLayout';
import FacilityManagement from './pages/admin/FacilityManagement';
import FacilityLayoutBuilderPage from './pages/admin/FacilityLayoutBuilderPage';
import GatesLibrary from './pages/admin/GatesLibrary';
import LanesLibrary from './pages/admin/LanesLibrary';
import StationsLibrary from './pages/admin/StationsLibrary';
import Rooms from './pages/admin/Rooms';

const queryClient = new QueryClient();

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
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="facility-management" element={<FacilityManagement />} />
          <Route path="facility-layout/:facilityId" element={<FacilityLayoutBuilderPage />} />
          <Route path="facilities" element={<Facilities />} />
          <Route path="facilities/:facilityId" element={<FacilityLayout />} />
          <Route path="driving-gates" element={<DrivingGates />} />
          <Route path="driving-gates/:id" element={<DrivingGateLayout />} />
          <Route path="driving-gate-test" element={<DrivingGateTest />} />
          <Route path="stations" element={<Stations />} />
          <Route path="lanes" element={<Lanes />} />
          <Route path="workers" element={<Workers />} />
          <Route path="contributions" element={<Contributions />} />
          <Route path="capacity" element={<Capacity />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="skills" element={<Skills />} />
          <Route path="capabilities" element={<Capabilities />} />
          <Route path="gates-library" element={<GatesLibrary />} />
          <Route path="lanes-library" element={<LanesLibrary />} />
          <Route path="stations-library" element={<StationsLibrary />} />
          <Route path="rooms" element={<Rooms />} />
          <Route path="seed-data" element={<SeedData />} />
          <Route path="simulation" element={<Simulation />} />
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
        <DevPanel />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
