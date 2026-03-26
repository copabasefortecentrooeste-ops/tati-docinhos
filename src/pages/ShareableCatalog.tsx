import { useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Copy, Check, Search, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useProductsStore } from '@/store/productsStore';
import { useStoreConfigStore } from '@/store/storeConfigStore';
import ProductCard from '@/components/product/ProductCard';

export default function ShareableCatalog() {
  const { slug } = useParams<{ slug: string }>();
  const { products, categories } = useProductsStore();
  const { config } = useStoreConfigStore();
  const [activeCat, setActiveCat] = useState('');
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const pageUrl = `${window.location.origin}/t/${slug}/cardapio`;

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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(pageUrl)}&bgcolor=ffffff&color=1a1a1a&margin=4`;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur">
        <div className="container flex items-center justify-between py-3">
          <Link to={`/t/${slug}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">{config.name}</span>
          </Link>
          <h1 className="font-display text-base font-semibold text-foreground">Cardápio</h1>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-button border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
            {copied ? 'Copiado!' : 'Copiar link'}
          </button>
        </div>
      </header>

      <div className="container py-6">
        {/* Store + QR banner */}
        <div className="mb-6 flex items-center justify-between rounded-card border border-border bg-card p-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Cardápio de</p>
            <p className="font-display text-lg font-bold text-foreground">{config.name}</p>
            <p className="mt-1 text-xs text-muted-foreground break-all">{pageUrl}</p>
          </div>
          <div className="ml-4 shrink-0 rounded-lg bg-white p-1.5 shadow-sm">
            <img src={qrSrc} alt="QR Code" width={80} height={80} className="block" />
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar doces..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-button border border-border bg-card py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Category filters */}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setActiveCat('')}
            className={`shrink-0 rounded-button px-4 py-1.5 text-xs font-medium transition-colors ${
              !activeCat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(activeCat === cat.slug ? '' : cat.slug)}
              className={`shrink-0 rounded-button px-4 py-1.5 text-xs font-medium transition-colors ${
                activeCat === cat.slug ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products grid */}
        <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>

        {filtered.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
            <p className="text-lg text-muted-foreground">Nenhum doce encontrado 😢</p>
          </motion.div>
        )}

        {/* Order CTA */}
        <div className="mt-10 text-center">
          <Link
            to="/catalogo"
            className="inline-flex items-center gap-2 rounded-button bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <ShoppingBag size={16} />
            Fazer Pedido
          </Link>
          <p className="mt-2 text-xs text-muted-foreground">Encomende pelo nosso site oficial</p>
        </div>
      </div>
    </div>
  );
}
