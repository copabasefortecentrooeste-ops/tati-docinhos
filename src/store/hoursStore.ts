import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BusinessHours } from '@/types';
import { businessHours as defaultHours } from '@/data/mockData';
import { supabase } from '@/lib/supabase';

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
  updateHours: (id: string, updates: Partial<BusinessHours>) => Promise<void>;
  initFromDB: () => Promise<void>;
}

export const useHoursStore = create<HoursState>()(
  persist(
    (set, get) => ({
      hours: defaultHours,

      initFromDB: async () => {
        try {
          const { data } = await supabase.from('business_hours').select('*').order('day_of_week');
          if (data && data.length > 0) set({ hours: data.map(fromDB) });
          else await supabase.from('business_hours').upsert(get().hours.map(toDB));
        } catch { console.warn('[hours] offline'); }
      },

      updateHours: async (id, updates) => {
        set((s) => ({ hours: s.hours.map((h) => h.id === id ? { ...h, ...updates } : h) }));
        const updated = get().hours.find((h) => h.id === id);
        if (updated) { try { await supabase.from('business_hours').update(toDB(updated)).eq('id', id); } catch { /**/ } }
      },
    }),
    { name: 'taty-hours' }
  )
);
