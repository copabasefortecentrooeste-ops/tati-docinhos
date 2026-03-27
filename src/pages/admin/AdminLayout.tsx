import { Link, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, MapPin, Tag, Layers, Clock, Settings, LogOut, MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { StoreProvider, useStoreCtx } from '@/contexts/StoreContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useStoreConfigStore } from '@/store/storeConfigStore';
import { useProductsStore } from '@/store/productsStore';
import { useNeighborhoodsStore } from '@/store/neighborhoodsStore';
import { useCouponsStore } from '@/store/couponsStore';
import { useHoursStore } from '@/store/hoursStore';
import { useOrderStore } from '@/store/orderStore';

function AdminLayoutInner() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams<{ slug: string }>();
  const { storeId, storeName, storeStatus, isLoading: storeLoading } = useStoreCtx();

  // Título dinâmico: "Taty Docinhos — Painel Admin"
  usePageTitle(storeName ? `${storeName} — Painel Admin` : 'Painel Admin');

  const initConfig = useStoreConfigStore((s) => s.initFromDB);
  const initProducts = useProductsStore((s) => s.initFromDB);
  const initNeighborhoods = useNeighborhoodsStore((s) => s.initFromDB);
  const initCoupons = useCouponsStore((s) => s.initFromDB);
  const initHours = useHoursStore((s) => s.initFromDB);
  const initOrders = useOrderStore((s) => s.initFromDB);

  const navItems = [
    { path: `/${slug}/admin`, icon: LayoutDashboard, label: 'Dashboard' },
    { path: `/${slug}/admin/pedidos`, icon: ShoppingBag, label: 'Pedidos' },
    { path: `/${slug}/admin/produtos`, icon: Package, label: 'Produtos' },
    { path: `/${slug}/admin/categorias`, icon: Layers, label: 'Categorias' },
    { path: `/${slug}/admin/bairros`, icon: MapPin, label: 'Bairros' },
    { path: `/${slug}/admin/cupons`, icon: Tag, label: 'Cupons' },
    { path: `/${slug}/admin/horarios`, icon: Clock, label: 'Horários' },
    { path: `/${slug}/admin/whatsapp`, icon: MessageCircle, label: 'WhatsApp' },
    { path: `/${slug}/admin/config`, icon: Settings, label: 'Config' },
  ];

  useEffect(() => {
    // Get current session on mount
    supabase.auth.getSession().then(async ({ data }) => {
      const sess = data.session;
      const role = sess?.user.app_metadata?.role;
      // Aceita admin de loja OU master_admin (master pode inspecionar qualquer loja)
      if (!sess || (role !== 'admin' && role !== 'master_admin')) {
        if (sess) await supabase.auth.signOut();
        navigate(`/${slug}/admin/login`, { replace: true });
        setIsLoading(false);
        return;
      }
      setSession(sess);
      setIsLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
      const role = s?.user.app_metadata?.role;
      if (!s || (role !== 'admin' && role !== 'master_admin')) {
        if (s) await supabase.auth.signOut();
        navigate(`/${slug}/admin/login`, { replace: true });
      } else {
        setSession(s);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Guard cross-store: impede admin da loja A de acessar painel da loja B
  useEffect(() => {
    if (!session || storeLoading || !storeId) return;
    const role = session.user.app_metadata?.role;
    if (role === 'master_admin') return; // master_admin pode acessar qualquer loja
    const jwtStoreId = session.user.app_metadata?.store_id as string | undefined;
    if (jwtStoreId && jwtStoreId !== storeId) {
      // Conta autenticada não pertence a esta loja — redirecionar sem expor dados
      navigate(`/${slug}/admin/login`, { replace: true });
    }
  }, [session, storeId, storeLoading, slug, navigate]);

  // Initialise stores with storeId once it is resolved
  useEffect(() => {
    if (!storeId || storeLoading) return;
    Promise.all([
      initConfig(storeId),
      initProducts(storeId),
      initNeighborhoods(storeId),
      initCoupons(storeId),
      initHours(storeId),
      initOrders(storeId),
    ]).catch(() => {});
  }, [storeId, storeLoading]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate(`/${slug}/admin/login`);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) return null;

  if (storeStatus === 'suspended') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Loja Suspensa</h1>
          <p className="mt-2 text-muted-foreground">Esta loja foi suspensa. Entre em contato com o suporte.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden w-56 shrink-0 border-r border-border bg-card md:block">
        <div className="p-4">
          <h2 className="font-display text-lg font-semibold text-foreground">{storeName ?? 'Admin'}</h2>
        </div>
        <nav className="mt-2 flex flex-col gap-0.5 px-2">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2.5 rounded-button px-3 py-2 text-sm transition-colors ${
                  active ? 'bg-primary/10 font-medium text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon size={16} /> {item.label}
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            className="mt-4 flex items-center gap-2.5 rounded-button px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LogOut size={16} /> Sair
          </button>
        </nav>
      </aside>

      {/* Mobile nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card md:hidden">
        <div className="flex items-center justify-around py-2">
          {navItems.slice(0, 5).map((item) => {
            const active = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path} className="flex flex-col items-center gap-0.5 px-2 py-1">
                <Icon size={18} className={active ? 'text-primary' : 'text-muted-foreground'} />
                <span className={`text-[9px] ${active ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default function AdminLayout() {
  const { slug } = useParams<{ slug: string }>();
  return (
    <StoreProvider slug={slug ?? ''}>
      <AdminLayoutInner />
    </StoreProvider>
  );
}
