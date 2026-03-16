import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Menu, X, User, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import { useCustomerStore } from '@/store/customerStore';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const itemCount = useCartStore((s) => s.getItemCount());
  const { session, customer } = useCustomerStore();

  if (location.pathname.startsWith('/admin')) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="font-display text-xl font-semibold text-foreground">
          Taty Docinhos
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link to="/" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Início
          </Link>
          <Link to="/catalogo" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Cardápio
          </Link>
          <Link to="/acompanhar" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Pedidos
          </Link>
          <Link to={session ? '/minha-conta' : '/login'} className="relative text-sm text-muted-foreground transition-colors hover:text-foreground flex items-center gap-1.5">
            {session ? <User size={16} /> : <LogIn size={16} />}
            {session ? (customer?.fullName?.split(' ')[0] ?? 'Conta') : 'Entrar'}
          </Link>
          <Link to="/carrinho" className="relative">
            <ShoppingBag size={20} className="text-foreground" />
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {itemCount}
              </span>
            )}
          </Link>
        </nav>

        <div className="flex items-center gap-3 md:hidden">
          <Link to={session ? '/minha-conta' : '/login'}>
            {session ? <User size={20} className="text-foreground" /> : <LogIn size={20} className="text-muted-foreground" />}
          </Link>
          <button onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border md:hidden"
          >
            <div className="container flex flex-col gap-3 py-4">
              <Link to="/" onClick={() => setMenuOpen(false)} className="text-sm text-foreground">
                Início
              </Link>
              <Link to="/catalogo" onClick={() => setMenuOpen(false)} className="text-sm text-foreground">
                Cardápio
              </Link>
              <Link to="/acompanhar" onClick={() => setMenuOpen(false)} className="text-sm text-foreground">
                Acompanhar Pedido
              </Link>
              <Link
                to={session ? '/minha-conta' : '/login'}
                onClick={() => setMenuOpen(false)}
                className="text-sm text-foreground"
              >
                {session ? `👤 ${customer?.fullName?.split(' ')[0] ?? 'Minha Conta'}` : 'Entrar / Criar Conta'}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
