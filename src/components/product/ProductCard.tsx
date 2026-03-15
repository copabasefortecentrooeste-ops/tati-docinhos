import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Product } from '@/types';

const formatPrice = (price: number) =>
  price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface ProductCardProps {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <Link to={`/produto/${product.id}`} className="group block">
        <div className="relative overflow-hidden rounded-card bg-card shadow-card transition-shadow duration-300 hover:shadow-elevated">
          <div className="aspect-[4/5] overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          </div>
          {product.bestSeller && (
            <span className="absolute left-3 top-3 rounded-button bg-accent px-2.5 py-1 text-[11px] font-semibold text-accent-foreground">
              Mais Vendido
            </span>
          )}
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
        </div>
      </Link>
    </motion.div>
  );
}
