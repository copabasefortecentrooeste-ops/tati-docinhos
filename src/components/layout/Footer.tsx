import { Link, useLocation } from 'react-router-dom';
import { Instagram, Phone, MapPin } from 'lucide-react';
import { useStoreConfigStore } from '@/store/storeConfigStore';

export default function Footer() {
  const location = useLocation();
  const { config: storeConfig } = useStoreConfigStore();
  if (location.pathname.startsWith('/admin')) return null;

  return (
    <footer className="border-t border-border bg-card pb-20 md:pb-0">
      <div className="container py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">{storeConfig.name}</h3>
            <p className="mt-2 text-sm text-muted-foreground text-pretty">{storeConfig.deliveryPolicy}</p>
          </div>
          <div className="flex flex-col gap-2">
            <span className="label-caps text-muted-foreground">Contato</span>
            <a href={`tel:${storeConfig.phone}`} className="flex items-center gap-2 text-sm text-foreground">
              <Phone size={14} /> {storeConfig.phone}
            </a>
            <a href={`https://instagram.com/${storeConfig.instagram.replace('@', '')}`} target="_blank" rel="noopener" className="flex items-center gap-2 text-sm text-foreground">
              <Instagram size={14} /> {storeConfig.instagram}
            </a>
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin size={14} /> {storeConfig.address}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="label-caps text-muted-foreground">Links</span>
            <Link to="/catalogo" className="text-sm text-foreground hover:text-primary">Cardápio</Link>
            <Link to="/acompanhar" className="text-sm text-foreground hover:text-primary">Acompanhar Pedido</Link>
            <Link to="/admin/login" className="text-sm text-muted-foreground hover:text-foreground">Área Admin</Link>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-4 text-center">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} {storeConfig.name}. Feito com amor e açúcar.</p>
        </div>
      </div>
    </footer>
  );
}
