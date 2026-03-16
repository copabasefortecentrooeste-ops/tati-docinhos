import { useEffect } from 'react';
import { useStoreConfigStore } from '@/store/storeConfigStore';
import { useProductsStore } from '@/store/productsStore';
import { useNeighborhoodsStore } from '@/store/neighborhoodsStore';
import { useCouponsStore } from '@/store/couponsStore';
import { useHoursStore } from '@/store/hoursStore';
import { useOrderStore } from '@/store/orderStore';
import { useCustomerStore } from '@/store/customerStore';

/** Initialises all Supabase stores once on app mount. */
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
    ]).catch(() => {/* offline — stores fall back to localStorage */});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
