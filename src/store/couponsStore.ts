import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Coupon } from '@/types';
import { coupons as defaultCoupons } from '@/data/mockData';
import { supabase } from '@/lib/supabase';

const TATY_STORE_ID = 'aaaaaaaa-0000-0000-0000-000000000001';

const fromDB = (r: Record<string, unknown>): Coupon => ({
  id: r.id as string,
  code: r.code as string,
  type: r.type as 'percentage' | 'fixed',
  value: r.value as number,
  active: r.active as boolean,
  minOrder: (r.min_order as number) ?? undefined,
});

const toDB = (c: Coupon) => ({
  id: c.id, code: c.code, type: c.type, value: c.value, active: c.active,
  min_order: c.minOrder ?? null,
});

interface CouponsState {
  coupons: Coupon[];
  /** True while initFromDB is in flight. Never persisted. */
  loading: boolean;
  loadError: boolean;
  addCoupon: (c: Coupon, storeId?: string) => Promise<void>;
  updateCoupon: (id: string, updates: Partial<Coupon>) => Promise<void>;
  deleteCoupon: (id: string) => Promise<void>;
  toggleActive: (id: string) => Promise<void>;
  initFromDB: (storeId?: string) => Promise<void>;
}

export const useCouponsStore = create<CouponsState>()(
  persist(
    (set, get) => ({
      coupons: defaultCoupons,
      loading: true,
      loadError: false,

      initFromDB: async (storeId?: string) => {
        const sid = storeId || TATY_STORE_ID;
        set({ loading: true, loadError: false });
        try {
          const { data } = await supabase.from('coupons').select('*').eq('store_id', sid);
          if (data && data.length > 0) {
            set({ coupons: data.map(fromDB), loading: false });
          } else {
            await supabase.from('coupons').upsert(get().coupons.map(c => ({ ...toDB(c), store_id: sid })));
            set({ loading: false });
          }
        } catch (err) {
          console.warn('[coupons] offline', err);
          set({ loading: false, loadError: true });
        }
      },

      addCoupon: async (c, storeId?: string) => {
        const sid = storeId || TATY_STORE_ID;
        const prev = get().coupons;
        set((s) => ({ coupons: [...s.coupons, c] }));
        try {
          await supabase.from('coupons').insert({ ...toDB(c), store_id: sid });
        } catch (err) {
          set({ coupons: prev });
          throw err;
        }
      },

      updateCoupon: async (id, updates) => {
        const prev = get().coupons;
        set((s) => ({ coupons: s.coupons.map((c) => c.id === id ? { ...c, ...updates } : c) }));
        const updated = get().coupons.find((c) => c.id === id);
        if (updated) {
          try {
            await supabase.from('coupons').update(toDB(updated)).eq('id', id);
          } catch (err) {
            set({ coupons: prev });
            throw err;
          }
        }
      },

      deleteCoupon: async (id) => {
        const prev = get().coupons;
        set((s) => ({ coupons: s.coupons.filter((c) => c.id !== id) }));
        try {
          await supabase.from('coupons').delete().eq('id', id);
        } catch (err) {
          set({ coupons: prev });
          throw err;
        }
      },

      toggleActive: async (id) => {
        const c = get().coupons.find((x) => x.id === id);
        if (!c) return;
        const prev = get().coupons;
        const next = !c.active;
        set((s) => ({ coupons: s.coupons.map((x) => x.id === id ? { ...x, active: next } : x) }));
        try {
          await supabase.from('coupons').update({ active: next }).eq('id', id);
        } catch (err) {
          set({ coupons: prev });
          throw err;
        }
      },
    }),
    {
      name: 'taty-coupons',
      partialize: (s) => ({ coupons: s.coupons }),
    },
  ),
);
