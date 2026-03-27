import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BusinessHours } from '@/types';
import { businessHours as defaultHours } from '@/data/mockData';
import { supabase } from '@/lib/supabase';

const TATY_STORE_ID = 'aaaaaaaa-0000-0000-0000-000000000001';

const fromDB = (r: Record<string, unknown>): BusinessHours => ({
  id: r.id as string,
  dayOfWeek: r.day_of_week as number,
  openTime: r.open_time as string,
  closeTime: r.close_time as string,
  active: r.active as boolean,
});

const toDB = (h: BusinessHours) => ({
  id: h.id, day_of_week: h.dayOfWeek, open_time: h.openTime, close_time: h.closeTime, active: h.active,
});

interface HoursState {
  hours: BusinessHours[];
  /** True while initFromDB is in flight. Never persisted. */
  loading: boolean;
  loadError: boolean;
  updateHours: (id: string, updates: Partial<BusinessHours>, storeId?: string) => Promise<void>;
  initFromDB: (storeId?: string) => Promise<void>;
}

export const useHoursStore = create<HoursState>()(
  persist(
    (set, get) => ({
      hours: defaultHours,
      loading: true,
      loadError: false,

      initFromDB: async (storeId?: string) => {
        const sid = storeId || TATY_STORE_ID;
        set({ loading: true, loadError: false });
        try {
          const { data } = await supabase.from('business_hours').select('*').eq('store_id', sid).order('day_of_week');
          if (data && data.length > 0) {
            set({ hours: data.map(fromDB), loading: false });
          } else {
            await supabase.from('business_hours').upsert(get().hours.map(h => ({ ...toDB(h), store_id: sid })));
            set({ loading: false });
          }
        } catch (err) {
          console.warn('[hours] offline', err);
          set({ loading: false, loadError: true });
        }
      },

      updateHours: async (id, updates, storeId?: string) => {
        const sid = storeId || TATY_STORE_ID;
        const prev = get().hours;
        set((s) => ({ hours: s.hours.map((h) => h.id === id ? { ...h, ...updates } : h) }));
        const updated = get().hours.find((h) => h.id === id);
        if (updated) {
          try {
            await supabase.from('business_hours').update({ ...toDB(updated), store_id: sid }).eq('id', id);
          } catch (err) {
            set({ hours: prev });
            throw err;
          }
        }
      },
    }),
    {
      name: 'taty-hours',
      partialize: (s) => ({ hours: s.hours }),
    },
  ),
);
