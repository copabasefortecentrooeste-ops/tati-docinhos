import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Customer } from '@/types';
import type { Session } from '@supabase/supabase-js';

// ── Mappers ────────────────────────────────────────────────
const fromDB = (r: Record<string, unknown>): Customer => ({
  id: r.id as string,
  fullName: r.full_name as string,
  phone: r.phone as string,
  email: r.email as string,
  city: r.city as string,
  state: r.state as string,
  cep: r.cep as string,
  neighborhood: r.neighborhood as string,
  street: r.street as string,
  number: r.number as string,
  complement: (r.complement as string) || undefined,
});

const toDB = (c: Customer) => ({
  id: c.id,
  full_name: c.fullName,
  phone: c.phone,
  email: c.email,
  city: c.city,
  state: c.state,
  cep: c.cep,
  neighborhood: c.neighborhood,
  street: c.street,
  number: c.number,
  complement: c.complement ?? null,
});

// ── Store ──────────────────────────────────────────────────
interface CustomerState {
  customer: Customer | null;
  session: Session | null;
  loading: boolean;
  /** true after the first loadProfile attempt completes (even if profile is null) */
  profileLoaded: boolean;
  signUp: (
    email: string,
    password: string,
    profile: Omit<Customer, 'id' | 'email'>
  ) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Omit<Customer, 'id' | 'email'>>) => Promise<{ error?: string }>;
  init: () => void;
}

const loadProfile = async (userId: string) => {
  const { data } = await supabase
    .from('customers')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  return data ? fromDB(data) : null;
};

export const useCustomerStore = create<CustomerState>()((set, get) => ({
  customer: null,
  session: null,
  loading: true,
  profileLoaded: false,

  init: () => {
    // onAuthStateChange fires immediately with INITIAL_SESSION/SIGNED_IN on page load,
    // so we don't need a separate getSession() call. Just set loading:false as fallback.
    setTimeout(() => {
      // If onAuthStateChange hasn't fired within 3s, clear loading state
      const { loading } = get();
      if (loading) set({ loading: false, profileLoaded: true });
    }, 3000);

    // Listen for auth changes (login / logout)
    // NOTE: loadProfile is called via setTimeout to avoid Supabase v2 internal auth-lock deadlock
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, loading: false });
      if (!session) {
        set({ customer: null, profileLoaded: true });
      } else if (session.user) {
        const uid = session.user.id;
        setTimeout(async () => {
          const customer = await loadProfile(uid);
          set({ customer: customer ?? null, profileLoaded: true });
        }, 0);
      }
    });
  },

  signUp: async (email, password, profile) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return { error: error.message };
      if (!data.user) return { error: 'Erro ao criar conta. Tente novamente.' };

      const customer: Customer = { id: data.user.id, email, ...profile };

      // Use SECURITY DEFINER RPC to bypass RLS (works even without email confirmation session)
      const { error: profileError } = await supabase.rpc('create_customer_profile', {
        p_id: customer.id,
        p_full_name: customer.fullName,
        p_phone: customer.phone,
        p_email: customer.email,
        p_city: customer.city,
        p_state: customer.state,
        p_cep: customer.cep,
        p_neighborhood: customer.neighborhood,
        p_street: customer.street,
        p_number: customer.number,
        p_complement: customer.complement ?? null,
      });
      if (profileError) return { error: 'Conta criada, mas erro ao salvar perfil: ' + profileError.message };

      set({ customer, session: data.session });
      return {};
    } catch {
      return { error: 'Erro inesperado. Tente novamente.' };
    }
  },

  signIn: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: 'Email ou senha incorretos.' };

      const customer = await loadProfile(data.user.id);
      if (!customer) {
        // Auth OK but no customer profile — sign out so session isn't left dangling
        await supabase.auth.signOut();
        set({ session: null, customer: null, profileLoaded: true });
        return { error: 'Conta encontrada, mas sem perfil de cliente. Use "Criar Conta" para se cadastrar.' };
      }

      set({ session: data.session, customer, profileLoaded: true });
      return {};
    } catch {
      return { error: 'Erro ao fazer login. Tente novamente.' };
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ customer: null, session: null });
  },

  updateProfile: async (updates) => {
    const { customer } = get();
    if (!customer) return { error: 'Não autenticado' };
    const next = { ...customer, ...updates };
    set({ customer: next });
    try {
      const { error } = await supabase.from('customers').update(toDB(next)).eq('id', customer.id);
      if (error) return { error: error.message };
      return {};
    } catch {
      return { error: 'Erro ao salvar perfil.' };
    }
  },
}));
