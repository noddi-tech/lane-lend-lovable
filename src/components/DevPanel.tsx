import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Shield, User, LogOut, X } from 'lucide-react';
import { useState } from 'react';

export function DevPanel() {
  const { user, role, setDevAuth, signOut } = useAuthStore();
  const [isOpen, setIsOpen] = useState(true);

  if (import.meta.env.VITE_DEV_MODE !== 'true') {
    return null;
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-destructive text-destructive-foreground hover:bg-destructive/90"
        size="sm"
      >
        DEV
      </Button>
    );
  }

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 bg-destructive text-destructive-foreground text-center py-1 text-xs font-bold">
        ⚠️ DEV MODE ACTIVE - Authentication Bypassed
      </div>
      
      <Card className="fixed bottom-4 right-4 z-50 p-4 w-72 bg-card border-destructive border-2">
      <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground">Dev Panel</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2 mb-3">
          <div className="text-xs text-muted-foreground">
            Current: {user ? `${role} (${user.email})` : 'Not logged in'}
          </div>
          <div className="text-xs text-muted-foreground/70">
            Dev users seeded in database with UUIDs ending in ...001 (admin) and ...002 (customer)
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            onClick={() => setDevAuth('customer')}
            variant={role === 'customer' ? 'default' : 'outline'}
            size="sm"
            className="w-full"
          >
            <User className="mr-2 h-4 w-4" />
            Login as Customer
          </Button>

          <Button
            onClick={() => setDevAuth('admin')}
            variant={role === 'admin' ? 'default' : 'outline'}
            size="sm"
            className="w-full"
          >
            <Shield className="mr-2 h-4 w-4" />
            Login as Admin
          </Button>

          {user && (
            <Button
              onClick={() => signOut()}
              variant="destructive"
              size="sm"
              className="w-full"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          )}
        </div>
      </Card>
    </>
  );
}
