import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Truck, Store } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useOrderStore } from '@/store/orderStore';
import { useNeighborhoodsStore } from '@/store/neighborhoodsStore';
import { useCouponsStore } from '@/store/couponsStore';
import { formatPrice } from '@/data/mockData';
import { toast } from '@/hooks/use-toast';
import type { Order, Coupon } from '@/types';

export default function Checkout() {
  const navigate = useNavigate();
  const { items, getSubtotal, clearCart } = useCartStore();
  const addOrder = useOrderStore((s) => s.addOrder);
  const { neighborhoods } = useNeighborhoodsStore();
  const { coupons } = useCouponsStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isPickup, setIsPickup] = useState(false);
  const [neighborhoodId, setNeighborhoodId] = useState('');
  const [address, setAddress] = useState('');
  const [reference, setReference] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [changeFor, setChangeFor] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState<Coupon | null>(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  const activeNeighborhoods = neighborhoods.filter((n) => n.active);
  const selectedNeighborhood = activeNeighborhoods.find((n) => n.id === neighborhoodId);
  const deliveryFee = isPickup ? 0 : (selectedNeighborhood?.fee || 0);
  const subtotal = getSubtotal();

  const discount = useMemo(() => {
    if (!couponApplied) return 0;
    if (couponApplied.minOrder && subtotal < couponApplied.minOrder) return 0;
    if (couponApplied.type === 'percentage') return subtotal * (couponApplied.value / 100);
    return couponApplied.value;
  }, [couponApplied, subtotal]);

  const total = subtotal + deliveryFee - discount;

  const applyCoupon = () => {
    const found = coupons.find((c) => c.code.toUpperCase() === couponCode.toUpperCase() && c.active);
    if (found) {
      setCouponApplied(found);
      toast({ title: 'Cupom aplicado! 🎉' });
    } else {
      toast({ title: 'Cupom inválido', variant: 'destructive' });
    }
  };

  const canSubmit = name.trim() && phone.trim() && (isPickup || (neighborhoodId && address.trim()));

  const handleSubmit = () => {
    if (!canSubmit) return;
    const code = `TD${Date.now().toString(36).toUpperCase().slice(-6)}`;
    const order: Order = {
      id: crypto.randomUUID(),
      code,
      status: 'received',
      items,
      customer: {
        name: name.trim(),
        phone: phone.trim(),
        address: isPickup ? undefined : address.trim(),
        neighborhood: selectedNeighborhood?.name,
        reference: reference.trim() || undefined,
      },
      isPickup,
      deliveryFee,
      subtotal,
      discount,
      total,
      paymentMethod,
      changeFor: paymentMethod === 'dinheiro' && changeFor ? Number(changeFor) : undefined,
      couponCode: couponApplied?.code,
      scheduledDate: scheduledDate || undefined,
      scheduledTime: scheduledTime || undefined,
      createdAt: new Date().toISOString(),
    };
    addOrder(order);
    clearCart();
    navigate(`/confirmacao/${code}`);
  };

  if (items.length === 0) {
    navigate('/carrinho');
    return null;
  }

  const inputClasses = "w-full rounded-button border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="min-h-screen py-6 pb-24">
      <div className="container max-w-2xl">
        <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} /> Voltar
        </button>
        <h1 className="font-display text-3xl font-bold text-foreground">Finalizar Pedido</h1>

        {/* Identification */}
        <section className="mt-6">
          <h2 className="label-caps text-muted-foreground">Seus dados</h2>
          <div className="mt-3 space-y-3">
            <input type="text" placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} className={inputClasses} />
            <input type="tel" placeholder="WhatsApp (11) 99999-9999" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClasses} />
          </div>
        </section>

        {/* Delivery method */}
        <section className="mt-6">
          <h2 className="label-caps text-muted-foreground">Forma de entrega</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsPickup(false)}
              className={`flex items-center justify-center gap-2 rounded-card border p-4 text-sm font-medium transition-colors ${
                !isPickup ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-card text-muted-foreground'
              }`}
            >
              <Truck size={18} /> Delivery
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsPickup(true)}
              className={`flex items-center justify-center gap-2 rounded-card border p-4 text-sm font-medium transition-colors ${
                isPickup ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-card text-muted-foreground'
              }`}
            >
              <Store size={18} /> Retirada
            </motion.button>
          </div>

          {!isPickup && (
            <div className="mt-4 space-y-3">
              <select
                value={neighborhoodId}
                onChange={(e) => setNeighborhoodId(e.target.value)}
                className={inputClasses}
              >
                <option value="">Selecione o bairro</option>
                {activeNeighborhoods.map((n) => (
                  <option key={n.id} value={n.id}>{n.name} — {formatPrice(n.fee)}</option>
                ))}
              </select>
              <input type="text" placeholder="Endereço completo" value={address} onChange={(e) => setAddress(e.target.value)} className={inputClasses} />
              <input type="text" placeholder="Referência (opcional)" value={reference} onChange={(e) => setReference(e.target.value)} className={inputClasses} />
            </div>
          )}
        </section>

        {/* Schedule */}
        <section className="mt-6">
          <h2 className="label-caps text-muted-foreground">Agendar (opcional)</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className={inputClasses} />
            <input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className={inputClasses} />
          </div>
        </section>

        {/* Payment */}
        <section className="mt-6">
          <h2 className="label-caps text-muted-foreground">Pagamento</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { id: 'pix', label: 'PIX' },
              { id: 'cartao', label: 'Cartão na entrega' },
              { id: 'dinheiro', label: 'Dinheiro' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setPaymentMethod(m.id)}
                className={`rounded-button border px-4 py-2 text-sm transition-colors ${
                  paymentMethod === m.id ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-card text-muted-foreground'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          {paymentMethod === 'dinheiro' && (
            <input
              type="number"
              placeholder="Troco para quanto? (R$)"
              value={changeFor}
              onChange={(e) => setChangeFor(e.target.value)}
              className={`mt-3 ${inputClasses}`}
            />
          )}
        </section>

        {/* Coupon */}
        <section className="mt-6">
          <h2 className="label-caps text-muted-foreground">Cupom</h2>
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              placeholder="Código do cupom"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className={`flex-1 ${inputClasses}`}
            />
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={applyCoupon}
              className="shrink-0 rounded-button bg-muted px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/80"
            >
              Aplicar
            </motion.button>
          </div>
          {couponApplied && (
            <p className="mt-2 text-xs text-primary">
              ✓ {couponApplied.code} — {couponApplied.type === 'percentage' ? `${couponApplied.value}% off` : `${formatPrice(couponApplied.value)} off`}
            </p>
          )}
        </section>

        {/* Summary */}
        <section className="mt-8 rounded-container bg-secondary p-5">
          <h2 className="label-caps text-muted-foreground">Resumo</h2>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">{formatPrice(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Entrega</span><span className="tabular-nums">{isPickup ? 'Grátis' : formatPrice(deliveryFee)}</span></div>
            {discount > 0 && (
              <div className="flex justify-between text-primary"><span>Desconto</span><span className="tabular-nums">-{formatPrice(discount)}</span></div>
            )}
            <div className="border-t border-border pt-2" />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span><span className="tabular-nums">{formatPrice(total)}</span>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="mt-5 w-full rounded-button bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-card transition-opacity disabled:opacity-50"
          >
            Confirmar Pedido
          </motion.button>
        </section>
      </div>
    </div>
  );
}
