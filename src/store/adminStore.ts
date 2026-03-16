import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AdminState {
  isAuthenticated: boolean;
  isLoading: boolean;
  session: Session | null;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
}

export const useAdminStore = create<AdminState>((set) => ({
  isAuthenticated: false,
  isLoading: true,
  session: null,

  setSession: (session) =>
    set({ session, isAuthenticated: !!session, isLoading: false }),

  setLoading: (loading) => set({ isLoading: loading }),

  logout: async () => {
    await supabase.auth.signOut();
    set({ session: null, isAuthenticated: false });
  },
}));
