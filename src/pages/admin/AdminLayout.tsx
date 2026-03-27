import { Link, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, MapPin, Tag, Clock, Settings, LogOut, MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export default function AdminLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams<{ slug: string }>();

  const navItems = [
    { path: `/${slug}/admin`, icon: LayoutDashboard, label: 'Dashboard' },
    { path: `/${slug}/admin/pedidos`, icon: ShoppingBag, label: 'Pedidos' },
    { path: `/${slug}/admin/produtos`, icon: Package, label: 'Produtos' },
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
      if (!sess || sess.user.app_metadata?.role !== 'admin') {
        if (sess) await supabase.auth.signOut(); // sign out non-admin user
        navigate(`/${slug}/admin/login`, { replace: true });
        setIsLoading(false);
        return;
      }
      setSession(sess);
      setIsLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
      if (!s || s.user.app_metadata?.role !== 'admin') {
        if (s) await supabase.auth.signOut();
        navigate(`/${slug}/admin/login`, { replace: true });
      } else {
        setSession(s);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

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

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden w-56 shrink-0 border-r border-border bg-card md:block">
        <div className="p-4">
          <h2 className="font-display text-lg font-semibold text-foreground">Taty Admin</h2>
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
