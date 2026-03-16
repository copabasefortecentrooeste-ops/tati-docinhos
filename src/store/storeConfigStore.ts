import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StoreConfig } from '@/types';
import { storeConfig as defaultConfig } from '@/data/mockData';
import { supabase } from '@/lib/supabase';

const fromDB = (r: Record<string, unknown>): StoreConfig => ({
  name: r.name as string,
  phone: r.phone as string,
  instagram: r.instagram as string,
  address: r.address as string,
  pixKey: r.pix_key as string,
  deliveryPolicy: r.delivery_policy as string,
  logo: (r.logo as string) || undefined,
  deliveryMode: (r.delivery_mode as StoreConfig['deliveryMode']) || 'city_only',
  defaultCity: (r.default_city as string) || 'Pitangui',
  defaultState: (r.default_state as string) || 'MG',
  defaultCep: (r.default_cep as string) || '35650-000',
  manualStatus: (r.manual_status as StoreConfig['manualStatus']) ?? null,
  blockOrdersOutsideHours: (r.block_orders_outside_hours as boolean) ?? false,
  closedMessage: (r.closed_message as string) || 'Estamos fechados no momento.',
  operationalMessage: (r.operational_message as string) || '',
});

const toDB = (c: StoreConfig) => ({
  id: 1,
  name: c.name,
  phone: c.phone,
  instagram: c.instagram,
  address: c.address,
  pix_key: c.pixKey,
  delivery_policy: c.deliveryPolicy,
  logo: c.logo ?? null,
  delivery_mode: c.deliveryMode ?? 'city_only',
  default_city: c.defaultCity ?? 'Pitangui',
  default_state: c.defaultState ?? 'MG',
  default_cep: c.defaultCep ?? '35650-000',
  manual_status: c.manualStatus ?? null,
  block_orders_outside_hours: c.blockOrdersOutsideHours ?? false,
  closed_message: c.closedMessage ?? 'Estamos fechados no momento.',
  operational_message: c.operationalMessage ?? '',
});

interface StoreConfigState {
  config: StoreConfig;
  updateConfig: (updates: Partial<StoreConfig>) => Promise<void>;
  initFromDB: () => Promise<void>;
}

export const useStoreConfigStore = create<StoreConfigState>()(
  persist(
    (set, get) => ({
      config: defaultConfig,

      initFromDB: async () => {
        try {
          const { data } = await supabase.from('store_config').select('*').eq('id', 1).maybeSingle();
          if (data) set({ config: fromDB(data) });
          else await supabase.from('store_config').upsert(toDB(get().config));
        } catch {
          console.warn('[storeConfig] offline, using local data');
        }
      },

      updateConfig: async (updates) => {
        const next = { ...get().config, ...updates };
        set({ config: next });
        try {
          await supabase.from('store_config').upsert(toDB(next));
        } catch {
          console.warn('[storeConfig] sync failed, saved locally');
        }
      },
    }),
    { name: 'taty-store-config' }
  )
);
