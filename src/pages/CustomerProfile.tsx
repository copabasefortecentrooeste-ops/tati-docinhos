import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, LogOut, User, Package } from 'lucide-react';
import { useCustomerStore } from '@/store/customerStore';
import { useOrderStore } from '@/store/orderStore';
import { useStoreConfigStore } from '@/store/storeConfigStore';
import { formatPrice } from '@/lib/format';
import { ORDER_STATUS_LABELS } from '@/lib/orderStatus';
import { toast } from '@/hooks/use-toast';

export default function CustomerProfile() {
  const navigate = useNavigate();
  const { customer, session, signOut, updateProfile } = useCustomerStore();
  const { config } = useStoreConfigStore();
  const deliveryMode = config.deliveryMode ?? 'city_only';
  const { orders } = useOrderStore();

  if (!session || !customer) {
    return (
      <div className="min-h-screen py-16 text-center">
        <p className="text-muted-foreground">Você não está logado.</p>
        <Link to="/login" className="mt-4 inline-block text-primary hover:underline">
          Fazer login
        </Link>
      </div>
    );
  }

  const myOrders = orders.filter((o) => o.customerId === customer.id);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    fullName: customer.fullName,
    phone: customer.phone,
    city: customer.city,
    state: customer.state,
    cep: customer.cep,
    neighborhood: customer.neighborhood,
    street: customer.street,
    number: customer.number,
    complement: customer.complement || '',
  });
  const [saving, setSaving] = useState(false);

  const inputCls =
    'w-full rounded-button border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring';

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateProfile(form);
    setSaving(false);
    if (error) {
      toast({ title: error, variant: 'destructive' });
    } else {
      setEditing(false);
      toast({ title: 'Perfil atualizado!' });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    toast({ title: 'Você saiu da conta.' });
  };

  return (
    <div className="min-h-screen py-6 pb-24">
      <div className="container max-w-lg">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={16} /> Voltar
        </button>

        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl font-bold text-foreground">Minha Conta</h1>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-sm text-destructive hover:text-destructive/80"
          >
            <LogOut size={14} /> Sair
          </button>
        </div>

        {/* Profile card */}
        <div className="mt-6 rounded-card border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User size={18} />
              </div>
              <div>
                <p className="font-medium text-foreground">{customer.fullName}</p>
                <p className="text-xs text-muted-foreground">{customer.email}</p>
              </div>
            </div>
            <button onClick={() => setEditing(!editing)} className="text-xs text-primary hover:underline">
              {editing ? 'Cancelar' : 'Editar'}
            </button>
          </div>

          {editing ? (
            <div className="mt-4 space-y-3">
              <input type="text" placeholder="Nome completo" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} className={inputCls} />
              <input type="tel" placeholder="Telefone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className={inputCls} />
              {deliveryMode === 'city_only' ? (
                <div className="rounded-button border border-border bg-muted/30 px-4 py-2.5 text-sm text-muted-foreground">
                  📍 Cidade: {config.defaultCity}/{config.defaultState} (entrega somente local)
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="Cidade" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} className={inputCls} />
                    <input type="text" placeholder="Estado" value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} className={inputCls} />
                  </div>
                  <input type="text" placeholder="CEP" value={form.cep} onChange={(e) => setForm((f) => ({ ...f, cep: e.target.value }))} className={inputCls} />
                </>
              )}
              <input type="text" placeholder="Bairro" value={form.neighborhood} onChange={(e) => setForm((f) => ({ ...f, neighborhood: e.target.value }))} className={inputCls} />
              <input type="text" placeholder="Rua" value={form.street} onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))} className={inputCls} />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Número" value={form.number} onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))} className={inputCls} />
                <input type="text" placeholder="Complemento" value={form.complement} onChange={(e) => setForm((f) => ({ ...f, complement: e.target.value }))} className={inputCls} />
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-button bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {saving ? 'Salvando…' : 'Salvar'}
              </motion.button>
            </div>
          ) : (
            <div className="mt-3 space-y-1 text-sm text-muted-foreground">
              <p>📞 {customer.phone}</p>
              <p>
                🏠 {customer.street}, {customer.number}
                {customer.complement ? ` — ${customer.complement}` : ''}
              </p>
              <p>
                📍 {customer.neighborhood} — {customer.city}/{customer.state} — {customer.cep}
              </p>
            </div>
          )}
        </div>

        {/* My orders */}
        <div className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <Package size={16} className="text-muted-foreground" />
            <h2 className="font-medium text-foreground">Meus Pedidos ({myOrders.length})</h2>
          </div>

          {myOrders.length === 0 ? (
            <div className="rounded-card border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              Nenhum pedido ainda.{' '}
              <Link to="/catalogo" className="text-primary hover:underline">
                Ver cardápio
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {myOrders.map((order) => (
                <div key={order.id} className="rounded-card border border-border bg-card p-4 shadow-soft">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="tabular-nums text-sm font-bold text-foreground">{order.code}</span>
                        <span
                          className={`rounded-button px-2 py-0.5 text-[10px] font-medium ${ORDER_STATUS_LABELS[order.status]?.color}`}
                        >
                          {ORDER_STATUS_LABELS[order.status]?.label}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                        {order.city ? ` • ${order.city}` : ''}
                      </p>
                    </div>
                    <span className="tabular-nums text-sm font-bold text-foreground">
                      {formatPrice(order.total)}
                    </span>
                  </div>
                  <div className="mt-2 space-y-0.5">
                    {order.items.map((item) => (
                      <p key={item.id} className="text-xs text-muted-foreground">
                        {item.quantity}x {item.product.name}
                      </p>
                    ))}
                  </div>
                  <Link
                    to={`/acompanhar?code=${order.code}&phone=${order.customer.phone}`}
                    className="mt-3 inline-block text-xs text-primary hover:underline"
                  >
                    Acompanhar pedido →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
