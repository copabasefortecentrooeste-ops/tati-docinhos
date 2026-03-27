import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Copy, Check, BookOpen, MapPin, Phone } from 'lucide-react';
import { useStoreConfigStore } from '@/store/storeConfigStore';
import { useHoursStore } from '@/store/hoursStore';
import { getStoreStatus } from '@/lib/storeStatus';
import { usePageTitle } from '@/hooks/usePageTitle';
import { tenantRoutes } from '@/lib/tenantRoutes';

export default function StoreLanding() {
  const { slug } = useParams<{ slug: string }>();
  const { config } = useStoreConfigStore();
  const { hours } = useHoursStore();
  const [copied, setCopied] = useState(false);

  const routes = tenantRoutes(slug ?? '');
  const pageUrl = `${window.location.origin}/${slug}`;
  const status = getStoreStatus(config, hours);

  const statusLabel: Record<string, { label: string; classes: string }> = {
    open:          { label: 'Aberto agora',     classes: 'bg-green-100 text-green-700' },
    closed:        { label: 'Fechado',           classes: 'bg-red-100 text-red-700' },
    paused:        { label: 'Pausado',           classes: 'bg-amber-100 text-amber-700' },
    outside_hours: { label: 'Fora do horário',  classes: 'bg-orange-100 text-orange-700' },
  };

  const badge = statusLabel[status.type] ?? statusLabel.closed;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pageUrl)}&bgcolor=ffffff&color=1a1a1a&margin=6`;

  usePageTitle(
    config.name ? `${config.name} | Delivery Online` : 'Faça Seu Pedido Aqui',
    config.name ? `Faça seu pedido online em ${config.name}.` : undefined,
  );

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-secondary px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
        className="w-full max-w-sm"
      >
        {/* Store identity */}
        <div className="mb-8 flex flex-col items-center text-center">
          {config.logo ? (
            <img src={config.logo} alt={config.name} className="mb-4 h-20 w-20 rounded-full object-cover shadow-md" />
          ) : (
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary text-3xl font-bold text-primary-foreground shadow-md">
              {config.name ? config.name.charAt(0).toUpperCase() : (slug ?? 'L').charAt(0).toUpperCase()}
            </div>
          )}
          <h1 className="font-display text-2xl font-bold text-foreground">{config.name || slug}</h1>
          {config.deliveryPolicy && (
            <p className="mt-1 text-sm text-muted-foreground">{config.deliveryPolicy}</p>
          )}
          <span className={`mt-3 inline-flex items-center rounded-full px-3 py-0.5 text-xs font-medium ${badge.classes}`}>
            {badge.label}
          </span>
        </div>

        {/* QR code */}
        <div className="mb-6 flex flex-col items-center">
          <div className="rounded-card bg-white p-3 shadow-card">
            <img src={qrSrc} alt="QR Code" width={180} height={180} className="block" />
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Aponte a câmera para acessar o cardápio
          </p>
        </div>

        {/* Copy link */}
        <button
          onClick={handleCopy}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-button border border-border bg-card py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          {copied ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}
          {copied ? 'Link copiado!' : 'Copiar link do cardápio'}
        </button>

        {/* CTA */}
        <Link
          to={routes.catalog}
          className="flex w-full items-center justify-center gap-2 rounded-button bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <BookOpen size={16} />
          Ver Cardápio Completo
        </Link>

        {/* Store info */}
        <div className="mt-8 space-y-2 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          {config.address && (
            <p className="flex items-center justify-center gap-1.5">
              <MapPin size={12} /> {config.address}
            </p>
          )}
          {config.phone && (
            <p className="flex items-center justify-center gap-1.5">
              <Phone size={12} /> {config.phone}
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
