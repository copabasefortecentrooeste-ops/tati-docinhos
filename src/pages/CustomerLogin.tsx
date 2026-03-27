import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useCustomerStore } from '@/store/customerStore';
import { useStoreConfigStore } from '@/store/storeConfigStore';
import { toast } from '@/hooks/use-toast';
import { useTenantSlug } from '@/hooks/useTenantSlug';
import { tenantRoutes } from '@/lib/tenantRoutes';

type Tab = 'login' | 'register';

export default function CustomerLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const slug = useTenantSlug();
  const routes = tenantRoutes(slug);
  const returnTo = searchParams.get('returnTo') || routes.account;

  const { signIn, signUp, session, customer, loading: authLoading } = useCustomerStore();
  const { config } = useStoreConfigStore();
  const deliveryMode = config.deliveryMode ?? 'city_only';
  const defaultCity = config.defaultCity ?? 'Pitangui';
  const defaultState = config.defaultState ?? 'MG';
  const defaultCep = config.defaultCep ?? '35650-000';

  const [tab, setTab] = useState<Tab>('login');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  // Redirect if already logged in — wait for customer profile to load too,
  // otherwise navigating while customer=null causes a "not logged in" flash loop
  useEffect(() => {
    if (!authLoading && session && customer) navigate(returnTo, { replace: true });
  }, [session, customer, authLoading, navigate, returnTo]);

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form
  const [reg, setReg] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    city: deliveryMode === 'city_only' ? defaultCity : '',
    state: deliveryMode === 'city_only' ? defaultState : '',
    cep: deliveryMode === 'city_only' ? defaultCep : '',
    neighborhood: '',
    street: '',
    number: '',
    complement: '',
  });

  const inputCls =
    'w-full rounded-button border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring';

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      toast({ title: 'Preencha email e senha', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setLoading(false);
    if (error) {
      toast({ title: error, variant: 'destructive' });
    } else {
      toast({ title: 'Login realizado! 🎉' });
    }
  };

  const handleRegister = async () => {
    if (!reg.fullName || !reg.email || !reg.phone || !reg.password || !reg.city || !reg.neighborhood || !reg.street || !reg.number) {
      toast({ title: 'Preencha todos os campos obrigatórios (*)', variant: 'destructive' });
      return;
    }
    if (deliveryMode === 'city_only' && reg.city.toLowerCase().trim() !== defaultCity.toLowerCase().trim()) {
      toast({
        title: `Entrega somente em ${defaultCity}/${defaultState}`,
        description: 'A loja está em modo cidade única. Altere sua cidade para continuar.',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    const { error } = await signUp(reg.email, reg.password, {
      fullName: reg.fullName,
      phone: reg.phone,
      city: reg.city,
      state: reg.state,
      cep: reg.cep,
      neighborhood: reg.neighborhood,
      street: reg.street,
      number: reg.number,
      complement: reg.complement || undefined,
    });
    setLoading(false);
    if (error) {
      toast({ title: error, variant: 'destructive' });
    } else {
      toast({ title: 'Conta criada com sucesso! 🎉' });
    }
  };

  return (
    <div className="min-h-screen py-8 pb-24">
      <div className="container max-w-md">
        <Link
          to={routes.home}
          className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={16} /> Voltar
        </Link>

        <h1 className="font-display text-3xl font-bold text-foreground">Minha Conta</h1>

        {/* Tabs */}
        <div className="mt-6 flex overflow-hidden rounded-card border border-border bg-card">
          {(['login', 'register'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                tab === t
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'login' ? 'Entrar' : 'Criar Conta'}
            </button>
          ))}
        </div>

        {tab === 'login' ? (
          <div className="mt-6 space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              className={inputCls}
            />
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                placeholder="Senha"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleLogin}
              disabled={loading}
              className="w-full rounded-button bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {loading ? 'Entrando…' : 'Entrar'}
            </motion.button>
            <p className="text-center text-sm text-muted-foreground">
              Não tem conta?{' '}
              <button onClick={() => setTab('register')} className="text-primary hover:underline">
                Criar agora
              </button>
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            <p className="label-caps text-muted-foreground">Dados pessoais</p>
            <input type="text" placeholder="Nome completo *" value={reg.fullName} onChange={(e) => setReg((r) => ({ ...r, fullName: e.target.value }))} className={inputCls} />
            <input type="email" placeholder="Email *" value={reg.email} onChange={(e) => setReg((r) => ({ ...r, email: e.target.value }))} className={inputCls} />
            <input type="tel" placeholder="Telefone/WhatsApp *" value={reg.phone} onChange={(e) => setReg((r) => ({ ...r, phone: e.target.value }))} className={inputCls} />
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                placeholder="Senha *"
                value={reg.password}
                onChange={(e) => setReg((r) => ({ ...r, password: e.target.value }))}
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <p className="label-caps pt-2 text-muted-foreground">Endereço de entrega</p>

            {deliveryMode === 'city_only' && (
              <div className="rounded-card border border-border bg-muted/30 px-4 py-2.5 text-sm text-muted-foreground">
                📍 Entregamos somente em{' '}
                <strong>
                  {defaultCity}/{defaultState}
                </strong>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Cidade *"
                value={reg.city}
                onChange={(e) => setReg((r) => ({ ...r, city: e.target.value }))}
                readOnly={deliveryMode === 'city_only'}
                className={`${inputCls} ${deliveryMode === 'city_only' ? 'cursor-not-allowed opacity-60' : ''}`}
              />
              <input
                type="text"
                placeholder="Estado *"
                value={reg.state}
                onChange={(e) => setReg((r) => ({ ...r, state: e.target.value }))}
                readOnly={deliveryMode === 'city_only'}
                className={`${inputCls} ${deliveryMode === 'city_only' ? 'cursor-not-allowed opacity-60' : ''}`}
              />
            </div>
            <input
              type="text"
              placeholder="CEP *"
              value={reg.cep}
              onChange={(e) => setReg((r) => ({ ...r, cep: e.target.value }))}
              readOnly={deliveryMode === 'city_only'}
              className={`${inputCls} ${deliveryMode === 'city_only' ? 'cursor-not-allowed opacity-60' : ''}`}
            />
            <input type="text" placeholder="Bairro *" value={reg.neighborhood} onChange={(e) => setReg((r) => ({ ...r, neighborhood: e.target.value }))} className={inputCls} />
            <input type="text" placeholder="Rua *" value={reg.street} onChange={(e) => setReg((r) => ({ ...r, street: e.target.value }))} className={inputCls} />
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Número *" value={reg.number} onChange={(e) => setReg((r) => ({ ...r, number: e.target.value }))} className={inputCls} />
              <input type="text" placeholder="Complemento" value={reg.complement} onChange={(e) => setReg((r) => ({ ...r, complement: e.target.value }))} className={inputCls} />
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleRegister}
              disabled={loading}
              className="mt-2 w-full rounded-button bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {loading ? 'Criando conta…' : 'Criar Conta'}
            </motion.button>
            <p className="text-center text-sm text-muted-foreground">
              Já tem conta?{' '}
              <button onClick={() => setTab('login')} className="text-primary hover:underline">
                Entrar
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
