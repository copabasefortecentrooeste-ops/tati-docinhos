import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag, MessageCircle, BarChart2, Clock, Tag, Package,
  Smartphone, CheckCircle2, ChevronDown, ChevronUp, ArrowRight,
  Utensils, Coffee, Pizza, Store, BookOpen,
} from 'lucide-react';

const features = [
  { icon: ShoppingBag, title: 'Pedidos online', desc: 'Receba pedidos 24h direto no painel, com notificação em tempo real.' },
  { icon: Package, title: 'Controle de estoque', desc: 'Gerencie estoque por produto, com alerta de baixo nível.' },
  { icon: Tag, title: 'Cupons de desconto', desc: 'Crie cupons percentuais ou fixos para atrair mais clientes.' },
  { icon: Clock, title: 'Horários de funcionamento', desc: 'Configure seus horários de abertura e bloqueie pedidos fora do horário.' },
  { icon: MessageCircle, title: 'WhatsApp integrado', desc: 'Notifique clientes automaticamente por WhatsApp ao atualizar pedidos.' },
  { icon: BarChart2, title: 'Dashboard de métricas', desc: 'Acompanhe vendas, ticket médio e status dos pedidos em tempo real.' },
  { icon: Smartphone, title: 'Cardápio mobile', desc: 'Cardápio 100% responsivo para seus clientes acessarem no celular.' },
  { icon: Store, title: 'Multi-lojas', desc: 'Gerencie múltiplas lojas com painéis administrativos separados.' },
];

const benefits = [
  { icon: CheckCircle2, title: 'Sem mensalidade de plataforma', desc: 'Você paga apenas pelo seu plano. Nenhuma taxa por pedido ou venda realizada.' },
  { icon: BookOpen, title: 'Cardápio online completo', desc: 'Monte seu cardápio com fotos, categorias, variações e opções de entrega ou retirada.' },
  { icon: MessageCircle, title: 'WhatsApp integrado', desc: 'Notifique clientes automaticamente a cada atualização do pedido, sem trabalho extra.' },
];

const segments = [
  { icon: Coffee, label: 'Confeitaria' },
  { icon: Utensils, label: 'Restaurante' },
  { icon: ShoppingBag, label: 'Lanchonete' },
  { icon: Package, label: 'Marmitaria' },
  { icon: Pizza, label: 'Pizzaria' },
];

const plans = [
  {
    name: 'Trial',
    price: 'Grátis',
    period: '14 dias',
    highlight: false,
    features: ['Até 10 produtos', 'Pedidos online', 'Cardápio público', 'Dashboard básico'],
    cta: 'Começar grátis',
  },
  {
    name: 'Básico',
    price: 'R$97',
    period: '/mês',
    highlight: false,
    features: ['Até 50 produtos', 'Pedidos online', 'Cupons de desconto', 'Controle de estoque', 'Horários configuráveis'],
    cta: 'Assinar Básico',
  },
  {
    name: 'Pro',
    price: 'R$197',
    period: '/mês',
    highlight: true,
    features: ['Produtos ilimitados', 'Tudo do Básico', 'WhatsApp integrado', 'Domínio personalizado', 'Suporte prioritário'],
    cta: 'Assinar Pro',
  },
];

const faqs = [
  {
    q: 'Preciso de conhecimento técnico para usar?',
    a: 'Não! A plataforma é pensada para donos de negócio, não desenvolvedores. Configure tudo pelo painel administrativo em poucos minutos.',
  },
  {
    q: 'Posso testar antes de pagar?',
    a: 'Sim! O plano Trial é gratuito por 14 dias com até 10 produtos. Nenhum cartão de crédito necessário.',
  },
  {
    q: 'Como funciona o WhatsApp integrado?',
    a: 'Conectamos sua conta WhatsApp Business ao sistema. Quando você atualiza o status de um pedido, o cliente é notificado automaticamente.',
  },
  {
    q: 'Posso ter mais de uma loja?',
    a: 'Sim! Cada loja tem seu próprio cardápio, painel admin e configurações. Entre em contato para planos multi-loja.',
  },
];

export default function PlatformLanding() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShoppingBag size={16} />
            </div>
            <span className="font-bold text-foreground">Faça Seu Pedido Aqui</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="#planos" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors">Planos</a>
            <Link to="/admin/login"
              className="rounded-lg border border-border bg-card px-4 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
              Entrar
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-background py-20 md:py-32">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
            Plataforma de pedidos online para food service
          </div>
          <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-foreground md:text-6xl">
            Seu cardápio online,<br />
            <span className="text-primary">do seu jeito</span>
          </h1>
          <p className="mb-10 mx-auto max-w-2xl text-lg text-muted-foreground">
            Lance seu cardápio digital, receba pedidos, gerencie estoque e notifique clientes via WhatsApp.
            Tudo em um só lugar, sem comissão por venda.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#planos"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-bold text-primary-foreground hover:opacity-90 transition-opacity shadow-lg">
              Começar grátis <ArrowRight size={18} />
            </a>
            <a href="#recursos"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-8 py-4 text-base font-semibold text-foreground hover:bg-muted transition-colors">
              Ver recursos
            </a>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-muted/30">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-12 text-center text-3xl font-bold text-foreground">Por que escolher nossa plataforma?</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {benefits.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Icon size={22} className="text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="recursos" className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-4 text-center text-3xl font-bold text-foreground">Tudo que você precisa</h2>
          <p className="mb-12 text-center text-muted-foreground">De A a Z para vender mais pela internet</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow">
                <Icon size={20} className="mb-3 text-primary" />
                <h3 className="mb-1.5 font-semibold text-foreground text-sm">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Segments */}
      <section className="py-16 bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground">Para todo tipo de negócio</h2>
          <p className="mb-10 text-muted-foreground">Nossa plataforma atende diferentes segmentos do food service</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {segments.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-default">
                <Icon size={16} className="text-primary" />
                {label}
              </div>
            ))}
            <div className="flex items-center gap-2 rounded-full border border-dashed border-border px-5 py-2.5 text-sm text-muted-foreground">
              e muito mais...
            </div>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section id="planos" className="py-20">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="mb-4 text-center text-3xl font-bold text-foreground">Planos e preços</h2>
          <p className="mb-12 text-center text-muted-foreground">Sem taxa por pedido. Sem surpresas na fatura.</p>
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map(plan => (
              <div key={plan.name} className={`relative rounded-2xl border p-6 ${plan.highlight ? 'border-primary bg-primary/5 shadow-lg ring-1 ring-primary/20' : 'border-border bg-card'}`}>
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground">
                    Mais popular
                  </div>
                )}
                <div className="mb-5">
                  <h3 className="mb-1 text-lg font-bold text-foreground">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-foreground">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>
                </div>
                <ul className="mb-6 space-y-2">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                      <CheckCircle2 size={14} className="text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/admin/login"
                  className={`block w-full rounded-xl py-3 text-center text-sm font-bold transition-opacity ${plan.highlight ? 'bg-primary text-primary-foreground hover:opacity-90' : 'border border-border bg-card text-foreground hover:bg-muted'}`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-muted/30">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="mb-10 text-center text-3xl font-bold text-foreground">Perguntas frequentes</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                >
                  {faq.q}
                  {openFaq === i ? <ChevronUp size={16} className="shrink-0 text-muted-foreground" /> : <ChevronDown size={16} className="shrink-0 text-muted-foreground" />}
                </button>
                {openFaq === i && (
                  <div className="border-t border-border px-5 py-4 text-sm text-muted-foreground leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-10">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <ShoppingBag size={14} />
              </div>
              <span className="font-bold text-foreground text-sm">Faça Seu Pedido Aqui</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Termos de uso</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacidade</a>
              <a href="#" className="hover:text-foreground transition-colors">Suporte</a>
              <Link to="/admin/login" className="hover:text-foreground transition-colors">Painel</Link>
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Faça Seu Pedido Aqui. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
