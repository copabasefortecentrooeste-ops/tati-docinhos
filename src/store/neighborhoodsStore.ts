import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DeliveryNeighborhood } from '@/types';
import { neighborhoods as defaultNeighborhoods } from '@/data/mockData';
import { supabase } from '@/lib/supabase';

interface NeighborhoodsState {
  neighborhoods: DeliveryNeighborhood[];
  addNeighborhood: (n: DeliveryNeighborhood) => Promise<void>;
  updateNeighborhood: (id: string, updates: Partial<DeliveryNeighborhood>) => Promise<void>;
  deleteNeighborhood: (id: string) => Promise<void>;
  toggleActive: (id: string) => Promise<void>;
  initFromDB: () => Promise<void>;
}

export const useNeighborhoodsStore = create<NeighborhoodsState>()(
  persist(
    (set, get) => ({
      neighborhoods: defaultNeighborhoods,

      initFromDB: async () => {
        try {
          const { data } = await supabase.from('neighborhoods').select('*');
          if (data && data.length > 0) set({ neighborhoods: data as DeliveryNeighborhood[] });
          else await supabase.from('neighborhoods').upsert(get().neighborhoods);
        } catch { console.warn('[neighborhoods] offline'); }
      },

      addNeighborhood: async (n) => {
        const prev = get().neighborhoods;
        set((s) => ({ neighborhoods: [...s.neighborhoods, n] }));
        try {
          await supabase.from('neighborhoods').insert(n);
        } catch (err) {
          set({ neighborhoods: prev });
          throw err;
        }
      },

      updateNeighborhood: async (id, updates) => {
        const prev = get().neighborhoods;
        set((s) => ({ neighborhoods: s.neighborhoods.map((n) => n.id === id ? { ...n, ...updates } : n) }));
        try {
          await supabase.from('neighborhoods').update(updates).eq('id', id);
        } catch (err) {
          set({ neighborhoods: prev });
          throw err;
        }
      },

      deleteNeighborhood: async (id) => {
        const prev = get().neighborhoods;
        set((s) => ({ neighborhoods: s.neighborhoods.filter((n) => n.id !== id) }));
        try {
          await supabase.from('neighborhoods').delete().eq('id', id);
        } catch (err) {
          set({ neighborhoods: prev });
          throw err;
        }
      },

      toggleActive: async (id) => {
        const n = get().neighborhoods.find((x) => x.id === id);
        if (!n) return;
        const prev = get().neighborhoods;
        const next = !n.active;
        set((s) => ({ neighborhoods: s.neighborhoods.map((x) => x.id === id ? { ...x, active: next } : x) }));
        try {
          await supabase.from('neighborhoods').update({ active: next }).eq('id', id);
        } catch (err) {
          set({ neighborhoods: prev });
          throw err;
        }
      },
    }),
    { name: 'taty-neighborhoods' }
  )
);
