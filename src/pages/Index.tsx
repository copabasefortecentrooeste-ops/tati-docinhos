import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin, Clock } from 'lucide-react';
import { useProductsStore } from '@/store/productsStore';
import { useStoreConfigStore } from '@/store/storeConfigStore';
import ProductCard from '@/components/product/ProductCard';
import heroBrigadeiros from '@/assets/hero-brigadeiros.jpg';

const Index = () => {
  const { products, categories } = useProductsStore();
  const { config: storeConfig } = useStoreConfigStore();
  const featuredProducts = products.filter((p) => p.featured);
  const bestSellers = products.filter((p) => p.bestSeller);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-secondary">
        <div className="container grid items-center gap-8 py-12 md:grid-cols-2 md:py-20">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <span className="label-caps text-primary">Confeitaria Artesanal</span>
            <h1 className="mt-3 font-display text-4xl font-bold leading-[1.1] text-foreground md:text-5xl lg:text-6xl">
              Onde o afeto <br />vira doce.
            </h1>
            <p className="mt-4 max-w-md text-base text-muted-foreground text-pretty">
              Brigadeiros gourmet, bolos decorados e doces finos feitos à mão com ingredientes premium. Peça online e receba com carinho.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/catalogo">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 rounded-button bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Ver Cardápio <ArrowRight size={16} />
                </motion.button>
              </Link>
              <Link to="/acompanhar">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className="rounded-button border border-border bg-card px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Acompanhar Pedido
                </motion.button>
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin size={13} /> {storeConfig.address}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={13} /> Seg–Sex 9h–18h
              </span>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1], delay: 0.15 }}
            className="relative"
          >
            <div className="overflow-hidden rounded-container shadow-elevated">
              <img
                src={heroBrigadeiros}
                alt="Brigadeiros gourmet artesanais da Taty Docinhos"
                className="aspect-[4/3] w-full object-cover md:aspect-[4/5]"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-14">
        <div className="container">
          <h2 className="font-display text-2xl font-semibold text-foreground">Categorias</h2>
          <p className="mt-1 text-sm text-muted-foreground">Encontre o doce perfeito para cada ocasião</p>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <Link
                  to={`/catalogo?cat=${cat.slug}`}
                  className="group block overflow-hidden rounded-card bg-card shadow-card transition-shadow hover:shadow-elevated"
                >
                  <div className="aspect-[3/2] overflow-hidden">
                    <img src={cat.image} alt={cat.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  </div>
                  <div className="p-3">
                    <h3 className="font-display text-sm font-semibold text-foreground">{cat.name}</h3>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{cat.description}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="bg-secondary/50 py-14">
        <div className="container">
          <h2 className="font-display text-2xl font-semibold text-foreground">Mais Vendidos</h2>
          <p className="mt-1 text-sm text-muted-foreground">Os queridinhos dos nossos clientes</p>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {bestSellers.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="py-14">
        <div className="container">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-display text-2xl font-semibold text-foreground">Destaques</h2>
              <p className="mt-1 text-sm text-muted-foreground">Selecionados com carinho para você</p>
            </div>
            <Link to="/catalogo" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Ver todos <ArrowRight size={14} />
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {featuredProducts.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-14">
        <div className="container text-center">
          <h2 className="font-display text-2xl font-semibold text-primary-foreground md:text-3xl">
            Pronto para adoçar o seu dia?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-primary-foreground/80">
            Faça seu pedido agora e receba doces artesanais fresquinhos na sua porta.
          </p>
          <Link to="/catalogo">
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="mt-6 rounded-button bg-card px-8 py-3 text-sm font-semibold text-foreground shadow-elevated transition-colors hover:bg-card/90"
            >
              Quero meus doces
            </motion.button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Index;
