import { Link } from 'react-router-dom';
import { Instagram, Phone, MapPin } from 'lucide-react';
import { useStoreConfigStore } from '@/store/storeConfigStore';
import { useTenantSlug } from '@/hooks/useTenantSlug';
import { tenantRoutes } from '@/lib/tenantRoutes';

export default function TenantFooter() {
  const slug = useTenantSlug();
  const routes = tenantRoutes(slug);
  const { config } = useStoreConfigStore();

  return (
    <footer className="border-t border-border bg-card pb-20 md:pb-0">
      <div className="container py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">{config.name || slug}</h3>
            <p className="mt-2 text-sm text-muted-foreground text-pretty">{config.deliveryPolicy}</p>
          </div>
          <div className="flex flex-col gap-2">
            <span className="label-caps text-muted-foreground">Contato</span>
            {config.phone && (
              <a href={`tel:${config.phone}`} className="flex items-center gap-2 text-sm text-foreground">
                <Phone size={14} /> {config.phone}
              </a>
            )}
            {config.instagram && (
              <a href={`https://instagram.com/${config.instagram.replace('@', '')}`} target="_blank" rel="noopener" className="flex items-center gap-2 text-sm text-foreground">
                <Instagram size={14} /> {config.instagram}
              </a>
            )}
            {config.address && (
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin size={14} /> {config.address}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <span className="label-caps text-muted-foreground">Links</span>
            <Link to={routes.catalog} className="text-sm text-foreground hover:text-primary">Cardápio</Link>
            <Link to={routes.tracking} className="text-sm text-foreground hover:text-primary">Acompanhar Pedido</Link>
            <Link to={routes.admin} className="text-sm text-muted-foreground hover:text-foreground">Área Admin</Link>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-4 text-center">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} {config.name || slug}. Feito com amor e açúcar.</p>
        </div>
      </div>
    </footer>
  );
}
