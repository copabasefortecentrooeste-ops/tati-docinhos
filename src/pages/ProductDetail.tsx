import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useProductsStore } from '@/store/productsStore';
import { formatPrice } from '@/data/mockData';
import { useCartStore } from '@/store/cartStore';
import { toast } from '@/hooks/use-toast';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, categories } = useProductsStore();
  const product = products.find((p) => p.id === id);
  const addItem = useCartStore((s) => s.addItem);

  const [quantity, setQuantity] = useState(product?.minQuantity || 1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    product?.options.forEach((opt) => {
      if (opt.choices.length) defaults[opt.id] = opt.choices[0].id;
    });
    return defaults;
  });
  const [notes, setNotes] = useState('');

  if (!product) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Produto não encontrado</p>
      </div>
    );
  }

  const category = categories.find((c) => c.id === product.categoryId);

  const optionsPrice = product.options.reduce((sum, opt) => {
    const selectedId = selectedOptions[opt.id];
    const choice = opt.choices.find((c) => c.id === selectedId);
    return sum + (choice?.priceAdd || 0);
  }, 0);
  const unitPrice = product.basePrice + optionsPrice;
  const total = unitPrice * quantity;

  const handleAdd = () => {
    addItem(product, quantity, selectedOptions, notes || undefined);
    toast({ title: 'Adicionado à cesta! 🎉', description: `${quantity}x ${product.name}` });
    navigate('/carrinho');
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Back button */}
      <div className="container py-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} /> Voltar
        </button>
      </div>

      <div className="container grid gap-8 md:grid-cols-2">
        {/* Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
          className="overflow-hidden rounded-container shadow-elevated"
        >
          <img src={product.image} alt={product.name} className="aspect-[4/5] w-full object-cover" />
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
        >
          {category && <span className="label-caps text-primary">{category.name}</span>}
          <h1 className="mt-2 font-display text-3xl font-bold text-foreground">{product.name}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">{product.description}</p>

          {product.bestSeller && (
            <span className="mt-3 inline-block rounded-button bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
              ⭐ Mais Vendido
            </span>
          )}

          {/* Options */}
          {product.options.map((opt) => (
            <div key={opt.id} className="mt-5">
              <label className="label-caps text-muted-foreground">{opt.name}</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {opt.choices.map((choice) => (
                  <button
                    key={choice.id}
                    onClick={() => setSelectedOptions((prev) => ({ ...prev, [opt.id]: choice.id }))}
                    className={`rounded-button border px-4 py-2 text-sm transition-colors ${
                      selectedOptions[opt.id] === choice.id
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border bg-card text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    {choice.name}
                    {choice.priceAdd > 0 && (
                      <span className="ml-1.5 text-xs text-primary">+{formatPrice(choice.priceAdd)}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Notes */}
          <div className="mt-5">
            <label className="label-caps text-muted-foreground">Observações</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: sem glúten, mensagem no bolo..."
              className="mt-2 w-full rounded-card border border-border bg-card p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              rows={2}
            />
          </div>

          {/* Quantity */}
          <div className="mt-5">
            <label className="label-caps text-muted-foreground">
              Quantidade {product.minQuantity > 1 && `(mín. ${product.minQuantity})`}
            </label>
            <div className="mt-2 flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setQuantity((q) => Math.max(product.minQuantity, q - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-button border border-border bg-card text-foreground hover:bg-muted"
              >
                <Minus size={16} />
              </motion.button>
              <span className="tabular-nums text-lg font-semibold text-foreground">{quantity}</span>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setQuantity((q) => q + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-button border border-border bg-card text-foreground hover:bg-muted"
              >
                <Plus size={16} />
              </motion.button>
            </div>
          </div>

          {/* Price & Add */}
          <div className="mt-8 flex items-center justify-between rounded-container bg-secondary p-5">
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="tabular-nums text-2xl font-bold text-foreground">{formatPrice(total)}</p>
              {quantity > 1 && (
                <p className="text-xs text-muted-foreground">{formatPrice(unitPrice)} cada</p>
              )}
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleAdd}
              className="flex items-center gap-2 rounded-button bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-card transition-colors hover:bg-primary/90"
            >
              <ShoppingBag size={16} /> Quero este doce
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
