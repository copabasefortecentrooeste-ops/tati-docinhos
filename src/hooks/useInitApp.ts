import { useEffect } from 'react';
import { useStoreConfigStore } from '@/store/storeConfigStore';
import { useProductsStore } from '@/store/productsStore';
import { useNeighborhoodsStore } from '@/store/neighborhoodsStore';
import { useCouponsStore } from '@/store/couponsStore';
import { useHoursStore } from '@/store/hoursStore';
import { useOrderStore } from '@/store/orderStore';
import { useCustomerStore } from '@/store/customerStore';

/**
 * Initialises all Supabase stores once on app mount.
 *
 * Stores run their own try/catch and set loadError=true on failure.
 * The catch-all here only guards against unexpected thrown exceptions —
 * it does NOT silence store-level errors (those are handled individually).
 */
export function useInitApp() {
  const initConfig = useStoreConfigStore((s) => s.initFromDB);
  const initProducts = useProductsStore((s) => s.initFromDB);
  const initNeighborhoods = useNeighborhoodsStore((s) => s.initFromDB);
  const initCoupons = useCouponsStore((s) => s.initFromDB);
  const initHours = useHoursStore((s) => s.initFromDB);
  const initOrders = useOrderStore((s) => s.initFromDB);
  const initCustomer = useCustomerStore((s) => s.init);

  useEffect(() => {
    // Init customer auth listener immediately (synchronous)
    initCustomer();

    // Init all data stores in parallel
    Promise.all([
      initConfig(),
      initProducts(),
      initNeighborhoods(),
      initCoupons(),
      initHours(),
      initOrders(),
    ]).catch(() => { /* unexpected error — individual stores handle their own loadError */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
