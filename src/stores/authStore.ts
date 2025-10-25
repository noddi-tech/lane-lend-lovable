import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  role: 'admin' | 'customer' | null;
  isAdmin: boolean;
  loading: boolean;
  setAuth: (user: User | null, session: Session | null, role: 'admin' | 'customer' | null) => void;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  role: null,
  isAdmin: false,
  loading: true,

  setAuth: (user, session, role) => {
    set({ user, session, role, isAdmin: role === 'admin', loading: false });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, role: null, isAdmin: false });
  },

  initialize: async () => {
    set({ loading: true });

    // Set up auth state listener
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Fetch user role from user_roles table
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();

        const role = roleData?.role as 'admin' | 'customer' | null;
        set({ user: session.user, session, role, isAdmin: role === 'admin', loading: false });
      } else {
        set({ user: null, session: null, role: null, isAdmin: false, loading: false });
      }
    });

    // Check for existing session
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();

      const role = roleData?.role as 'admin' | 'customer' | null;
      set({ user: session.user, session, role, isAdmin: role === 'admin', loading: false });
    } else {
      set({ loading: false });
    }
  },
}));
