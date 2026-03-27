import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DeliveryNeighborhood } from '@/types';
import { neighborhoods as defaultNeighborhoods } from '@/data/mockData';
import { supabase } from '@/lib/supabase';

const TATY_STORE_ID = 'aaaaaaaa-0000-0000-0000-000000000001';

interface NeighborhoodsState {
  neighborhoods: DeliveryNeighborhood[];
  /** True while initFromDB is in flight. Never persisted. */
  loading: boolean;
  loadError: boolean;
  addNeighborhood: (n: DeliveryNeighborhood, storeId?: string) => Promise<void>;
  updateNeighborhood: (id: string, updates: Partial<DeliveryNeighborhood>) => Promise<void>;
  deleteNeighborhood: (id: string) => Promise<void>;
  toggleActive: (id: string) => Promise<void>;
  initFromDB: (storeId?: string) => Promise<void>;
}

export const useNeighborhoodsStore = create<NeighborhoodsState>()(
  persist(
    (set, get) => ({
      neighborhoods: defaultNeighborhoods,
      loading: true,
      loadError: false,

      initFromDB: async (storeId?: string) => {
        const sid = storeId || TATY_STORE_ID;
        set({ loading: true, loadError: false });
        try {
          const { data } = await supabase.from('neighborhoods').select('*').eq('store_id', sid);
          if (data && data.length > 0) {
            set({ neighborhoods: data as DeliveryNeighborhood[], loading: false });
          } else {
            await supabase.from('neighborhoods').upsert(get().neighborhoods.map(n => ({ ...n, store_id: sid })));
            set({ loading: false });
          }
        } catch (err) {
          console.warn('[neighborhoods] offline', err);
          set({ loading: false, loadError: true });
        }
      },

      addNeighborhood: async (n, storeId?: string) => {
        const sid = storeId || TATY_STORE_ID;
        const prev = get().neighborhoods;
        set((s) => ({ neighborhoods: [...s.neighborhoods, n] }));
        try {
          await supabase.from('neighborhoods').insert({ ...n, store_id: sid });
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
    {
      name: 'taty-neighborhoods',
      partialize: (s) => ({ neighborhoods: s.neighborhoods }),
    },
  ),
);
