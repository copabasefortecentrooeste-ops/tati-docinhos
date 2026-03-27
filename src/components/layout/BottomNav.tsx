import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Search, ShoppingBag, User } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

const tabs = [
  { path: '/', icon: Home, label: 'Início' },
  { path: '/catalogo', icon: Search, label: 'Buscar' },
  { path: '/carrinho', icon: ShoppingBag, label: 'Cesta' },
];

export default function BottomNav() {
  const location = useLocation();
  const itemCount = useCartStore((s) => s.getItemCount());

  if (location.pathname.includes('/admin')) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md md:hidden">
      <div className="flex items-center justify-around py-2">
        {tabs.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path;
          return (
            <Link key={path} to={path} className="relative flex flex-col items-center gap-0.5 px-4 py-1">
              <motion.div whileTap={{ scale: 0.9 }}>
                <Icon
                  size={22}
                  className={active ? 'text-primary' : 'text-muted-foreground'}
                  strokeWidth={active ? 2.5 : 1.5}
                />
                {path === '/carrinho' && itemCount > 0 && (
                  <span className="absolute -top-1 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {itemCount}
                  </span>
                )}
              </motion.div>
              <span className={`text-[10px] ${active ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
