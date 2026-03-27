import { useEffect, useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { LayoutDashboard, Store, Settings, LogOut, Menu, X } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';

const navItems = [
  { path: '/admin',        icon: LayoutDashboard, label: 'Dashboard',       exact: true },
  { path: '/admin/lojas',  icon: Store,           label: 'Lojas' },
  { path: '/admin/config', icon: Settings,        label: 'Configurações' },
];

export default function MasterAdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  usePageTitle('Painel Master | Faça Seu Pedido Aqui');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate('/admin/login'); return; }
      const role = session.user.app_metadata?.role;
      if (role !== 'master_admin') { supabase.auth.signOut(); navigate('/admin/login'); return; }
      setChecking(false);
    });
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  if (checking) return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Verificando acesso...</p>
    </div>
  );

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-60 flex-col border-r border-border bg-card">
        <div className="border-b border-border p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Faça Seu Pedido Aqui</p>
          <p className="mt-1 text-sm font-bold text-foreground">Painel Master</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ path, icon: Icon, label, exact }) => (
            <Link key={path} to={path}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive(path, exact) ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
              <Icon size={18} />{label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-border p-4">
          <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
            <LogOut size={16} /> Sair
          </button>
        </div>
      </aside>
      {/* Mobile header */}
      <div className="flex flex-1 flex-col">
        <header className="flex md:hidden items-center justify-between border-b border-border bg-card px-4 py-3">
          <p className="font-bold text-sm">Painel Master</p>
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </header>
        {sidebarOpen && (
          <div className="md:hidden border-b border-border bg-card px-4 py-2 space-y-1">
            {navItems.map(({ path, icon: Icon, label, exact }) => (
              <Link key={path} to={path} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${isActive(path, exact) ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
                <Icon size={16} />{label}
              </Link>
            ))}
            <button onClick={handleLogout} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
              <LogOut size={14} /> Sair
            </button>
          </div>
        )}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
