import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useProductsStore } from '@/store/productsStore';
import ProductCard from '@/components/product/ProductCard';
import { motion } from 'framer-motion';

export default function Catalog() {
  const { products, categories: allCategories } = useProductsStore();
  const categories = allCategories
    .filter((c) => c.active !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCat = searchParams.get('cat') || '';
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    let list = products;
    if (activeCat) {
      const cat = categories.find((c) => c.slug === activeCat);
      if (cat) list = list.filter((p) => p.categoryId === cat.id);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    return list;
  }, [activeCat, query, products, categories]);

  return (
    <div className="min-h-screen py-6">
      <div className="container">
        <h1 className="font-display text-3xl font-bold text-foreground">Cardápio</h1>
        <p className="mt-1 text-sm text-muted-foreground">Escolha seus doces favoritos</p>

        {/* Search */}
        <div className="relative mt-5">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar doces..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-button border border-border bg-card py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Category filters */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSearchParams({})}
            className={`shrink-0 rounded-button px-4 py-1.5 text-xs font-medium transition-colors ${
              !activeCat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSearchParams({ cat: cat.slug })}
              className={`shrink-0 rounded-button px-4 py-1.5 text-xs font-medium transition-colors ${
                activeCat === cat.slug ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products grid */}
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>

        {filtered.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
            <p className="text-lg text-muted-foreground">Nenhum doce encontrado 😢</p>
            <p className="mt-1 text-sm text-muted-foreground">Tente outra busca ou categoria</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
