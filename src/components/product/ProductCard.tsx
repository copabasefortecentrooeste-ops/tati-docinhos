import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import type { Product } from '@/types';
import { useStoreConfigStore } from '@/store/storeConfigStore';
import { buildWaLink } from '@/lib/whatsapp/templateEngine';

const formatPrice = (price: number) =>
  price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface ProductCardProps {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { config } = useStoreConfigStore();
  const inStock = product.inStock !== false; // defaults to true

  const waFallbackUrl = !inStock
    ? buildWaLink(
        config.phone || '',
        `Olá! Tenho interesse no produto *${product.name}* e gostaria de verificar a disponibilidade.`,
      )
    : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <div className={`relative overflow-hidden rounded-card bg-card shadow-card transition-shadow duration-300 ${inStock ? 'hover:shadow-elevated' : ''}`}>
        {/* Card body — only links when in stock */}
        {inStock ? (
          <Link to={`/produto/${product.id}`} className="group block">
            <ProductImage product={product} inStock />
            <ProductInfo product={product} />
          </Link>
        ) : (
          <>
            <ProductImage product={product} inStock={false} />
            <ProductInfo product={product} />
            {/* Out-of-stock CTA */}
            <div className="border-t border-border bg-muted/40 px-4 py-3">
              <a
                href={waFallbackUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-button bg-green-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-green-700"
              >
                <MessageCircle size={13} />
                Verificar disponibilidade
              </a>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

// ── Sub-components ───────────────────────────────────────────

function ProductImage({ product, inStock }: { product: Product; inStock: boolean }) {
  return (
    <div className="relative aspect-[4/5] overflow-hidden">
      <img
        src={product.image}
        alt={product.name}
        className={`h-full w-full object-cover transition-transform duration-500 ${inStock ? 'group-hover:scale-105' : 'grayscale opacity-60'}`}
        loading="lazy"
      />
      {product.bestSeller && inStock && (
        <span className="absolute left-3 top-3 rounded-button bg-accent px-2.5 py-1 text-[11px] font-semibold text-accent-foreground">
          Mais Vendido
        </span>
      )}
      {!inStock && (
        <span className="absolute left-3 top-3 rounded-button bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
          Indisponível
        </span>
      )}
    </div>
  );
}

function ProductInfo({ product }: { product: Product }) {
  return (
    <div className="p-4 pb-5">
      <h3 className="font-display text-base font-semibold leading-tight text-foreground">
        {product.name}
      </h3>
      <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground text-pretty">
        {product.description}
      </p>
      <div className="mt-3 flex items-center justify-between">
        <span className="tabular-nums text-sm font-semibold text-primary">
          {product.minQuantity > 1
            ? `${formatPrice(product.basePrice)} /un`
            : formatPrice(product.basePrice)}
        </span>
        {product.minQuantity > 1 && (
          <span className="text-[10px] text-muted-foreground">
            Mín. {product.minQuantity} un
          </span>
        )}
      </div>
    </div>
  );
}
