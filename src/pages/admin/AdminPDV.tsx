import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Search, Plus, Minus, Trash2, UserCircle, CreditCard,
  ShoppingBag, CheckCircle2, Store, Users, Truck, X,
} from 'lucide-react';
import { useProductsStore } from '@/store/productsStore';
import { useNeighborhoodsStore } from '@/store/neighborhoodsStore';
import { useOrderStore } from '@/store/orderStore';
import { useStoreCtx } from '@/contexts/StoreContext';
import { formatPrice } from '@/lib/format';
import { toast } from '@/hooks/use-toast';
import type { Order, CartItem, OrderOrigin } from '@/types';

// ── Types ──────────────────────────────────────────────────
type PdvOrderType = 'balcao' | 'local' | 'manual_delivery';
type PaymentMethod = 'pix' | 'dinheiro' | 'cartao' | 'pendente';

function generateOrderCode(): string {
  const ts = Date.now().toString(36).toUpperCase().slice(-5);
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `BAL-${ts}${rand}`;
}

const ORDER_TYPE_CONFIG: Record<PdvOrderType, { label: string; icon: typeof Store; origin: OrderOrigin; isPickup: boolean }> = {
  balcao:          { label: 'Balcão / Retirada', icon: Store,  origin: 'balcao',          isPickup: true  },
  local:           { label: 'Consumo Local',     icon: Users,  origin: 'local',            isPickup: true  },
  manual_delivery: { label: 'Delivery Manual',   icon: Truck,  origin: 'manual_delivery',  isPickup: false },
};

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'dinheiro', label: '💵 Dinheiro'  },
  { value: 'pix',      label: '📲 PIX'       },
  { value: 'cartao',   label: '💳 Cartão'    },
  { value: 'pendente', label: '⏳ Pendente'  },
];

// ── Main Component ─────────────────────────────────────────
export default function AdminPDV() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { storeId } = useStoreCtx();
  const { products, categories } = useProductsStore();
  const { neighborhoods } = useNeighborhoodsStore();
  const addOrder = useOrderStore((s) => s.addOrder);

  // ── Product list state ─────────────────────────────────
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');

  // ── Cart ───────────────────────────────────────────────
  const [cart, setCart] = useState<CartItem[]>([]);

  // ── Order form ─────────────────────────────────────────
  const [orderType, setOrderType] = useState<PdvOrderType>('balcao');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [tableNumber, setTableNumber]     = useState('');
  const [address, setAddress]             = useState('');
  const [neighborhoodInput, setNeighborhoodInput] = useState('');
  const [obs, setObs]                     = useState('');

  // ── Payment & adjustments ──────────────────────────────
  const [payment, setPayment]             = useState<PaymentMethod>('dinheiro');
  const [discountType, setDiscountType]   = useState<'value' | 'percent'>('value');
  const [discountInput, setDiscountInput] = useState('');
  const [deliveryFeeInput, setDeliveryFeeInput] = useState('');

  // ── Submission state ───────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [lastCode, setLastCode]     = useState<string | null>(null);

  // ── Filtered products ──────────────────────────────────
  const activeProducts = useMemo(
    () => products.filter((p) => p.active !== false),
    [products],
  );

  const filteredProducts = useMemo(() => {
    return activeProducts.filter((p) => {
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
      const matchCat    = catFilter === 'all' || p.categoryId === catFilter;
      return matchSearch && matchCat;
    });
  }, [activeProducts, search, catFilter]);

  const activeCategories = useMemo(
    () => categories.filter((c) => c.active !== false && activeProducts.some((p) => p.categoryId === c.id)),
    [categories, activeProducts],
  );

  // ── Cart helpers ───────────────────────────────────────
  const addToCart = (product: typeof products[0]) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [
        ...prev,
        { id: crypto.randomUUID(), product, quantity: 1, selectedOptions: {}, unitPrice: product.basePrice },
      ];
    });
  };

  const updateQty = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => i.id === itemId ? { ...i, quantity: i.quantity + delta } : i)
        .filter((i) => i.quantity > 0),
    );
  };

  const removeItem = (itemId: string) => setCart((prev) => prev.filter((i) => i.id !== itemId));
  const clearCart  = () => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setTableNumber('');
    setAddress('');
    setNeighborhoodInput('');
    setObs('');
    setDiscountInput('');
    setDeliveryFeeInput('');
    setPayment('dinheiro');
    setLastCode(null);
  };

  // ── Calculations ───────────────────────────────────────
  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  const discount = useMemo(() => {
    const val = parseFloat(discountInput) || 0;
    if (!val) return 0;
    if (discountType === 'percent') return Math.min(subtotal * (val / 100), subtotal);
    return Math.min(val, subtotal);
  }, [discountInput, discountType, subtotal]);

  const deliveryFee = orderType === 'manual_delivery' ? (parseFloat(deliveryFeeInput) || 0) : 0;
  const total       = Math.max(0, subtotal - discount + deliveryFee);
  const canFinalize = cart.length > 0 && customerName.trim().length >= 2;

  // ── Finalize ───────────────────────────────────────────
  const handleFinalize = async () => {
    if (!canFinalize) {
      toast({ title: 'Informe o nome do cliente e adicione pelo menos 1 item', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    const code = generateOrderCode();
    const cfg  = ORDER_TYPE_CONFIG[orderType];

    const order: Order = {
      id:            crypto.randomUUID(),
      code,
      status:        'received',
      items:         cart,
      customer: {
        name:         customerName.trim(),
        phone:        customerPhone.trim(),
        address:      orderType === 'manual_delivery' ? address.trim() || undefined : undefined,
        neighborhood: orderType === 'manual_delivery' ? neighborhoodInput.trim() || undefined : undefined,
        reference:    obs.trim() || undefined,
      },
      isPickup:      cfg.isPickup,
      deliveryFee,
      subtotal,
      discount,
      total,
      paymentMethod: payment,
      origin:        cfg.origin,
      tableNumber:   orderType === 'local' ? tableNumber.trim() || undefined : undefined,
      requestId:     crypto.randomUUID(),
      createdAt:     new Date().toISOString(),
    };

    try {
      await addOrder(order, storeId || undefined);
      setLastCode(code);
      toast({ title: `✅ Pedido ${code} criado!`, description: `Total: ${formatPrice(total)}` });
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro ao criar pedido', description: String(err), variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">PDV — Pedido Balcão</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Crie pedidos manuais direto no painel</p>
        </div>
        {cart.length > 0 && (
          <button
            onClick={clearCart}
            className="flex items-center gap-1.5 rounded-button border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
          >
            <X size={12} /> Limpar tudo
          </button>
        )}
      </div>

      {/* Success banner */}
      {lastCode && (
        <div className="flex items-center gap-3 rounded-card border border-green-200 bg-green-50 p-4">
          <CheckCircle2 size={20} className="shrink-0 text-green-600" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-green-800">Pedido criado com sucesso!</p>
            <p className="text-xs text-green-700">Código: <strong>{lastCode}</strong> — aparece em Pedidos agora.</p>
          </div>
          <button
            onClick={clearCart}
            className="rounded-button bg-green-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-green-700"
          >
            Novo pedido
          </button>
          <button
            onClick={() => navigate(`/${slug}/admin/pedidos`)}
            className="rounded-button border border-green-300 px-4 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100"
          >
            Ver pedidos
          </button>
        </div>
      )}

      {/* Main 2-column layout */}
      <div className="flex gap-4 items-start">

        {/* ── LEFT: Product catalog ─────────────────────── */}
        <div className="flex-1 min-w-0">
          {/* Search */}
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar produto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-button border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X size={12} />
              </button>
            )}
          </div>

          {/* Category tabs */}
          <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setCatFilter('all')}
              className={`shrink-0 rounded-button px-3 py-1 text-xs font-medium transition-colors ${
                catFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Todos
            </button>
            {activeCategories.map((c) => (
              <button
                key={c.id}
                onClick={() => setCatFilter(c.id)}
                className={`shrink-0 rounded-button px-3 py-1 text-xs font-medium transition-colors ${
                  catFilter === c.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Product grid */}
          {filteredProducts.length === 0 ? (
            <div className="rounded-card border border-border p-10 text-center text-sm text-muted-foreground">
              {search ? `Nenhum produto encontrado para "${search}"` : 'Nenhum produto cadastrado'}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 xl:grid-cols-3">
              {filteredProducts.map((product) => {
                const inCart = cart.find((i) => i.product.id === product.id);
                return (
                  <div
                    key={product.id}
                    className="flex flex-col rounded-card border border-border bg-card overflow-hidden hover:border-primary/30 transition-colors"
                  >
                    {product.image && (
                      <div className="h-24 overflow-hidden bg-muted">
                        <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-2.5">
                      <p className="text-xs font-semibold text-foreground leading-tight line-clamp-2">{product.name}</p>
                      <p className="mt-1 text-xs font-bold text-primary">{formatPrice(product.basePrice)}</p>
                      {product.manageStock && product.stockQty !== null && product.stockQty !== undefined && (
                        <p className={`mt-0.5 text-[10px] ${product.stockQty <= 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                          Estoque: {product.stockQty}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-1">
                        {inCart ? (
                          <>
                            <button
                              onClick={() => updateQty(inCart.id, -1)}
                              className="flex h-7 w-7 items-center justify-center rounded-button border border-border hover:bg-muted"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="flex-1 text-center text-xs font-bold tabular-nums">{inCart.quantity}</span>
                            <button
                              onClick={() => addToCart(product)}
                              className="flex h-7 w-7 items-center justify-center rounded-button bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                              <Plus size={12} />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => addToCart(product)}
                            className="flex w-full items-center justify-center gap-1 rounded-button bg-primary py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                          >
                            <Plus size={12} /> Adicionar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── RIGHT: Order panel ────────────────────────── */}
        <div className="w-80 xl:w-96 shrink-0 sticky top-4 flex flex-col gap-3">

          {/* Order type */}
          <div className="rounded-card border border-border bg-card p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tipo de pedido</p>
            <div className="flex flex-col gap-1.5">
              {(Object.entries(ORDER_TYPE_CONFIG) as [PdvOrderType, typeof ORDER_TYPE_CONFIG[PdvOrderType]][]).map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setOrderType(key)}
                    className={`flex items-center gap-2 rounded-button px-3 py-2 text-sm font-medium transition-colors ${
                      orderType === key
                        ? 'bg-primary/10 text-primary border border-primary/30'
                        : 'border border-transparent text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon size={14} /> {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Customer info */}
          <div className="rounded-card border border-border bg-card p-3">
            <div className="mb-2 flex items-center gap-1.5">
              <UserCircle size={14} className="text-muted-foreground" />
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cliente</p>
            </div>
            <div className="flex flex-col gap-2">
              <input
                type="text"
                placeholder="Nome do cliente *"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full rounded-button border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <input
                type="tel"
                placeholder="Telefone / WhatsApp"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full rounded-button border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {orderType === 'local' && (
                <input
                  type="text"
                  placeholder="Mesa / Comanda"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full rounded-button border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              )}
              {orderType === 'manual_delivery' && (
                <>
                  <input
                    type="text"
                    placeholder="Bairro"
                    value={neighborhoodInput}
                    onChange={(e) => setNeighborhoodInput(e.target.value)}
                    list="pdv-neighborhoods"
                    className="w-full rounded-button border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <datalist id="pdv-neighborhoods">
                    {neighborhoods.filter((n) => n.active).map((n) => (
                      <option key={n.id} value={n.name} />
                    ))}
                  </datalist>
                  <input
                    type="text"
                    placeholder="Endereço / Rua"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full rounded-button border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </>
              )}
              <input
                type="text"
                placeholder="Observações internas"
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                className="w-full rounded-button border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Cart items */}
          <div className="rounded-card border border-border bg-card p-3">
            <div className="mb-2 flex items-center gap-1.5">
              <ShoppingBag size={14} className="text-muted-foreground" />
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Itens ({cart.reduce((s, i) => s + i.quantity, 0)})
              </p>
            </div>
            {cart.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">Adicione produtos ao pedido</p>
            ) : (
              <div className="flex flex-col gap-2">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs font-medium text-foreground">{item.product.name}</p>
                      <p className="text-[10px] text-muted-foreground">{formatPrice(item.unitPrice)} / un.</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        className="flex h-6 w-6 items-center justify-center rounded border border-border hover:bg-muted"
                      >
                        <Minus size={10} />
                      </button>
                      <span className="w-6 text-center text-xs font-bold tabular-nums">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        className="flex h-6 w-6 items-center justify-center rounded border border-border hover:bg-muted"
                      >
                        <Plus size={10} />
                      </button>
                      <button onClick={() => removeItem(item.id)} className="ml-1 text-muted-foreground hover:text-destructive">
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <span className="w-16 text-right text-xs font-semibold tabular-nums text-foreground">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="rounded-card border border-border bg-card p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resumo</p>

            {/* Subtotal */}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums font-medium">{formatPrice(subtotal)}</span>
            </div>

            {/* Discount */}
            <div className="mt-2 flex items-center gap-2">
              <span className="shrink-0 text-xs text-muted-foreground">Desconto</span>
              <div className="flex flex-1 items-center gap-1">
                <button
                  onClick={() => setDiscountType('value')}
                  className={`rounded px-2 py-0.5 text-[10px] font-medium ${discountType === 'value' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                >
                  R$
                </button>
                <button
                  onClick={() => setDiscountType('percent')}
                  className={`rounded px-2 py-0.5 text-[10px] font-medium ${discountType === 'percent' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                >
                  %
                </button>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  className="w-20 rounded border border-border bg-background px-2 py-0.5 text-right text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
              {discount > 0 && (
                <span className="tabular-nums text-xs font-medium text-green-600">-{formatPrice(discount)}</span>
              )}
            </div>

            {/* Delivery fee (manual delivery only) */}
            {orderType === 'manual_delivery' && (
              <div className="mt-2 flex items-center gap-2">
                <span className="shrink-0 text-xs text-muted-foreground">Taxa entrega</span>
                <input
                  type="number"
                  min="0"
                  step="0.50"
                  placeholder="0,00"
                  value={deliveryFeeInput}
                  onChange={(e) => setDeliveryFeeInput(e.target.value)}
                  className="w-24 rounded border border-border bg-background px-2 py-0.5 text-right text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                {deliveryFee > 0 && (
                  <span className="tabular-nums text-xs font-medium text-foreground">{formatPrice(deliveryFee)}</span>
                )}
              </div>
            )}

            {/* Total */}
            <div className="mt-3 flex justify-between border-t border-border pt-2">
              <span className="font-semibold text-foreground">Total</span>
              <span className="tabular-nums text-lg font-bold text-primary">{formatPrice(total)}</span>
            </div>
          </div>

          {/* Payment */}
          <div className="rounded-card border border-border bg-card p-3">
            <div className="mb-2 flex items-center gap-1.5">
              <CreditCard size={14} className="text-muted-foreground" />
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pagamento</p>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {PAYMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPayment(opt.value)}
                  className={`rounded-button px-3 py-2 text-xs font-medium transition-colors ${
                    payment === opt.value
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Finalize button */}
          <button
            onClick={handleFinalize}
            disabled={!canFinalize || submitting}
            className="w-full rounded-button bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Criando pedido...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <CheckCircle2 size={16} />
                Finalizar Pedido — {formatPrice(total)}
              </span>
            )}
          </button>

          {!canFinalize && cart.length === 0 && (
            <p className="text-center text-[10px] text-muted-foreground">Adicione produtos e informe o nome do cliente</p>
          )}
          {!canFinalize && cart.length > 0 && !customerName.trim() && (
            <p className="text-center text-[10px] text-muted-foreground">Informe o nome do cliente para continuar</p>
          )}
        </div>
      </div>
    </div>
  );
}
