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

  init: () => {
    // Check current session on load
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      set({ session, loading: false });
      if (session?.user) {
        const customer = await loadProfile(session.user.id);
        if (customer) set({ customer });
      }
    });

    // Listen for auth changes (login / logout)
    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ session });
      if (!session) {
        set({ customer: null });
      } else if (session.user) {
        const customer = await loadProfile(session.user.id);
        if (customer) set({ customer });
      }
    });
  },

  signUp: async (email, password, profile) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return { error: error.message };
      if (!data.user) return { error: 'Erro ao criar conta. Tente novamente.' };

      const customer: Customer = { id: data.user.id, email, ...profile };
      const { error: profileError } = await supabase.from('customers').insert(toDB(customer));
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

      set({ session: data.session });
      const customer = await loadProfile(data.user.id);
      if (customer) set({ customer });
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
