import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Settings, Users, Calendar, Gauge, LogOut, User, Award, Zap, Clock, Database, BarChart3, TestTube, Building2 } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const menuItems = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
  { title: 'Bookings', url: '/admin/bookings', icon: Calendar },
  { title: 'Analytics', url: '/admin/analytics', icon: BarChart3 },
  { title: 'Facilities', url: '/admin/facilities', icon: Building2 },
  { title: 'Driving Gates', url: '/admin/driving-gates', icon: Building2 },
  { title: 'Capacity', url: '/admin/capacity', icon: Gauge },
  { title: 'Lanes', url: '/admin/lanes', icon: Gauge },
  { title: 'Workers', url: '/admin/workers', icon: Users },
  { title: 'Shifts', url: '/admin/contributions', icon: Clock },
  { title: 'Skills', url: '/admin/skills', icon: Award },
  { title: 'Capabilities', url: '/admin/capabilities', icon: Zap },
  { title: 'Seed Data', url: '/admin/seed-data', icon: Database },
  { title: 'Simulation', url: '/admin/simulation', icon: Zap },
  { title: 'Test Data', url: '/admin/driving-gate-test', icon: TestTube },
  { title: 'Settings', url: '/admin/settings', icon: Settings },
];

export function AdminLayout() {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarContent>
            <div className="p-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary" />
                <span className="text-lg font-bold">Admin Panel</span>
              </div>
            </div>

            <SidebarGroup>
              <SidebarGroupLabel>Management</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end={item.url === '/admin'}
                          className={({ isActive }) =>
                            isActive ? 'bg-accent text-accent-foreground' : ''
                          }
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <div className="flex-1">
          <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
            <SidebarTrigger />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          <main className="p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
