import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface StoreContextValue {
  storeId: string;
  storeSlug: string;
  storeName: string;
  plan: 'trial' | 'basic' | 'pro';
  storeStatus: 'active' | 'suspended' | 'expired';
  trialEndsAt: string | null;
  isLoading: boolean;
  notFound: boolean;
}

const StoreContext = createContext<StoreContextValue>({
  storeId: '',
  storeSlug: '',
  storeName: '',
  plan: 'trial',
  storeStatus: 'active',
  trialEndsAt: null,
  isLoading: true,
  notFound: false,
});

export function StoreProvider({ slug, children }: { slug: string; children: React.ReactNode }) {
  const [ctx, setCtx] = useState<StoreContextValue>({
    storeId: '',
    storeSlug: slug,
    storeName: '',
    plan: 'trial',
    storeStatus: 'active',
    trialEndsAt: null,
    isLoading: true,
    notFound: false,
  });

  useEffect(() => {
    if (!slug) return;
    supabase.rpc('resolve_store_slug', { p_slug: slug }).then(({ data, error }) => {
      if (error || !data || (Array.isArray(data) && data.length === 0)) {
        setCtx(c => ({ ...c, isLoading: false, notFound: true }));
        return;
      }
      const row = Array.isArray(data) ? data[0] : data;
      setCtx({
        storeId: row.store_id,
        storeSlug: slug,
        storeName: row.store_name,
        plan: row.plan as 'trial' | 'basic' | 'pro',
        storeStatus: row.status as 'active' | 'suspended' | 'expired',
        trialEndsAt: row.trial_ends_at ?? null,
        isLoading: false,
        notFound: false,
      });
    });
  }, [slug]);

  return <StoreContext.Provider value={ctx}>{children}</StoreContext.Provider>;
}

export function useStoreCtx() {
  return useContext(StoreContext);
}
