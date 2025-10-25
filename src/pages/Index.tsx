import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Calendar, Gauge, Users } from 'lucide-react';

const Index = () => {
  const { user, isAdmin } = useAuthStore();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary" />
            <span className="text-xl font-bold">Garage Lane Booking</span>
          </div>
          <nav className="flex items-center gap-4">
            {user ? (
              <Button asChild>
                <Link to={isAdmin ? '/admin' : '/book'}>
                  {isAdmin ? 'Go to Admin' : 'Book Now'}
                </Link>
              </Button>
            ) : (
              <Button asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-16 text-center">
          <h1 className="mb-6 text-5xl font-bold tracking-tight md:text-6xl">
            Professional Garage
            <span className="block text-primary">Service Booking</span>
          </h1>
          <p className="mb-8 max-w-2xl text-xl text-muted-foreground">
            Book your vehicle service with ease. Our advanced lane management system ensures
            efficient scheduling and quality service.
          </p>

          {user ? (
            <Button asChild size="lg" className="text-lg">
              <Link to={isAdmin ? '/admin' : '/book'}>
                {isAdmin ? 'Manage System' : 'Book Service Now'}
              </Link>
            </Button>
          ) : (
            <div className="flex gap-4">
              <Button asChild size="lg" className="text-lg">
                <Link to="/auth">Get Started</Link>
              </Button>
            </div>
          )}

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center gap-3">
              <Calendar className="h-12 w-12 text-primary" />
              <h3 className="text-xl font-semibold">Easy Booking</h3>
              <p className="text-muted-foreground">
                Select your service and preferred time slot in minutes
              </p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Gauge className="h-12 w-12 text-primary" />
              <h3 className="text-xl font-semibold">Smart Capacity</h3>
              <p className="text-muted-foreground">
                Real-time availability based on worker skills and lane capacity
              </p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Users className="h-12 w-12 text-primary" />
              <h3 className="text-xl font-semibold">Expert Workers</h3>
              <p className="text-muted-foreground">
                Skilled technicians matched to your service requirements
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-card py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2025 Garage Lane Booking. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Index;
