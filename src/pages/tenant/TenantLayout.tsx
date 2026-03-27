import { Outlet, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { StoreProvider, useStoreCtx } from '@/contexts/StoreContext';
import { useStoreConfigStore } from '@/store/storeConfigStore';
import { useProductsStore } from '@/store/productsStore';
import { useNeighborhoodsStore } from '@/store/neighborhoodsStore';
import { useCouponsStore } from '@/store/couponsStore';
import { useHoursStore } from '@/store/hoursStore';
import TenantHeader from '@/components/layout/TenantHeader';
import TenantFooter from '@/components/layout/TenantFooter';
import TenantBottomNav from '@/components/layout/TenantBottomNav';

function TenantLayoutInner() {
  const { storeId, isLoading, notFound } = useStoreCtx();

  const initConfig = useStoreConfigStore((s) => s.initFromDB);
  const initProducts = useProductsStore((s) => s.initFromDB);
  const initNeighborhoods = useNeighborhoodsStore((s) => s.initFromDB);
  const initCoupons = useCouponsStore((s) => s.initFromDB);
  const initHours = useHoursStore((s) => s.initFromDB);

  useEffect(() => {
    if (!storeId || isLoading) return;
    Promise.all([
      initConfig(storeId),
      initProducts(storeId),
      initNeighborhoods(storeId),
      initCoupons(storeId),
      initHours(storeId),
    ]).catch(() => {});
  }, [storeId, isLoading]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Loja não encontrada</h1>
          <p className="mt-2 text-muted-foreground">Esta loja não existe ou foi removida.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <TenantHeader />
      <Outlet />
      <TenantFooter />
      <TenantBottomNav />
    </>
  );
}

export default function TenantLayout() {
  const { slug } = useParams<{ slug: string }>();
  return (
    <StoreProvider slug={slug ?? ''}>
      <TenantLayoutInner />
    </StoreProvider>
  );
}
