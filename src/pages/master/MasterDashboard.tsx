import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Store, ShoppingBag, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashStats {
  totalStores: number;
  activeStores: number;
  suspendedStores: number;
  expiredStores: number;
  totalOrders: number;
  newStoresToday: number;
}

export default function MasterDashboard() {
  const [stats, setStats] = useState<DashStats>({ totalStores: 0, activeStores: 0, suspendedStores: 0, expiredStores: 0, totalOrders: 0, newStoresToday: 0 });
  const [stores, setStores] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [storesRes, ordersRes] = await Promise.all([
        supabase.from('stores').select('*').order('created_at', { ascending: false }),
        supabase.from('orders').select('id, store_id, created_at'),
      ]);

      const storeList = (storesRes.data ?? []) as Record<string, unknown>[];
      const orderList = (ordersRes.data ?? []) as Record<string, unknown>[];
      const today = new Date().toISOString().slice(0, 10);

      setStores(storeList);
      setStats({
        totalStores: storeList.length,
        activeStores: storeList.filter(s => s.status === 'active').length,
        suspendedStores: storeList.filter(s => s.status === 'suspended').length,
        expiredStores: storeList.filter(s => s.status === 'expired').length,
        totalOrders: orderList.length,
        newStoresToday: storeList.filter(s => (s.created_at as string)?.slice(0, 10) === today).length,
      });
      setLoading(false);
    };
    load();
  }, []);

  const cards = [
    { label: 'Total de Lojas', value: stats.totalStores, icon: Store, color: 'text-blue-500' },
    { label: 'Lojas Ativas', value: stats.activeStores, icon: Store, color: 'text-green-500' },
    { label: 'Suspensas', value: stats.suspendedStores, icon: AlertCircle, color: 'text-red-500' },
    { label: 'Total Pedidos', value: stats.totalOrders, icon: ShoppingBag, color: 'text-purple-500' },
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Carregando...</p></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral da plataforma</p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">{label}</p>
              <Icon size={16} className={color} />
            </div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="font-semibold text-foreground">Lojas Recentes</h2>
          <Link to="/admin/lojas" className="text-xs text-primary hover:underline">Ver todas →</Link>
        </div>
        <div className="divide-y divide-border">
          {stores.slice(0, 5).map(store => (
            <div key={store.id as string} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">{store.name as string}</p>
                <p className="text-xs text-muted-foreground">/{store.slug as string} · {store.plan as string} · {store.segment as string}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${store.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : store.status === 'suspended' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                {store.status as string}
              </span>
            </div>
          ))}
          {stores.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">Nenhuma loja cadastrada ainda</p>
          )}
        </div>
      </div>
    </div>
  );
}
