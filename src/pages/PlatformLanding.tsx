import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag, MessageCircle, BarChart2, Clock, Tag, Package,
  Smartphone, CheckCircle2, ChevronDown, ChevronUp, ArrowRight,
  Menu, X,
} from 'lucide-react';
import { PLATFORM } from '@/config/platform';
import { usePlatformConfig } from '@/hooks/usePlatformConfig';

const featureIcons = [ShoppingBag, Package, Tag, Clock, MessageCircle, Smartphone, BarChart2, ShoppingBag];

export default function PlatformLanding() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const cfg = usePlatformConfig();
  const c = cfg;
  const wlink = cfg.wlink;

  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* ── HEADER ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 shrink-0">
            <img src={PLATFORM.logoFull} alt={PLATFORM.name}
              className="h-9 w-auto object-contain"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#recursos" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Recursos</a>
            <a href="#segmentos" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Segmentos</a>
            <a href="#planos" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Planos</a>
            <a href="#faq" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">FAQ</a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/admin/login"
              className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Entrar
            </Link>
            <a href={wlink()} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-1.5 text-sm font-bold text-white hover:bg-red-700 transition-colors">
              <MessageCircle size={15} /> Falar no WhatsApp
            </a>
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-1" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <div className="md:hidden border-t border-gray-200 bg-white px-4 py-3 space-y-2">
            {['#recursos', '#segmentos', '#planos', '#faq'].map((href, i) => (
              <a key={href} href={href} onClick={() => setMobileMenu(false)}
                className="block py-2 text-sm text-gray-700">
                {['Recursos', 'Segmentos', 'Planos', 'FAQ'][i]}
              </a>
            ))}
            <div className="pt-2 flex flex-col gap-2">
              <Link to="/admin/login" onClick={() => setMobileMenu(false)}
                className="block rounded-lg border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700">
                Entrar
              </Link>
              <a href={wlink()} target="_blank" rel="noopener noreferrer"
                className="block rounded-lg bg-red-600 px-4 py-2 text-center text-sm font-bold text-white">
                Falar no WhatsApp
              </a>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-red-50 via-white to-white py-20 md:py-32">
        {/* Decorative bg shape */}
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-red-100/60 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-red-50 blur-2xl" />

        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-xs font-semibold text-red-700">
            {c.hero.badge}
          </div>

          <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-gray-900 md:text-6xl">
            {c.hero.headline}<br />
            <span className="text-red-600">{c.hero.headlineHighlight}</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-gray-600">
            {c.hero.subheadline}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href={wlink()} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-8 py-4 text-base font-bold text-white hover:bg-red-700 transition-colors shadow-lg shadow-red-200">
              <MessageCircle size={20} /> {c.hero.cta1.label}
            </a>
            <a href={c.hero.cta2.anchor}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-8 py-4 text-base font-semibold text-gray-800 hover:border-red-300 hover:bg-red-50 transition-colors">
              {c.hero.cta2.label} <ArrowRight size={18} />
            </a>
          </div>

          {/* Social proof */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-green-500" /> Sem taxa por pedido</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-green-500" /> Painel 100% em português</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-green-500" /> Suporte via WhatsApp</span>
          </div>
        </div>
      </section>

      {/* ── SEGMENTOS ──────────────────────────────────────── */}
      <section id="segmentos" className="border-y border-gray-100 bg-gray-50 py-10">
        <div className="mx-auto max-w-5xl px-4">
          <p className="mb-6 text-center text-sm font-semibold uppercase tracking-widest text-gray-400">
            Para quem é
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {c.segments.map(seg => (
              <span key={seg}
                className="rounded-full border border-gray-200 bg-white px-5 py-2 text-sm font-medium text-gray-700 shadow-sm hover:border-red-300 hover:text-red-700 transition-colors cursor-default">
                {seg}
              </span>
            ))}
            <span className="rounded-full border border-dashed border-gray-300 px-5 py-2 text-sm text-gray-400">
              e muito mais...
            </span>
          </div>
        </div>
      </section>

      {/* ── BENEFÍCIOS ─────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 md:text-4xl">
              Por que usar o <span className="text-red-600">Faça Seu Pedido Aqui</span>?
            </h2>
            <p className="mt-3 text-gray-500">Tudo o que seu negócio precisa em um só sistema</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {c.benefits.map(({ title, desc }) => (
              <div key={title}
                className="rounded-2xl border border-gray-100 bg-white p-7 shadow-sm hover:shadow-md hover:border-red-100 transition-all group">
                <div className="mb-4 h-1 w-10 rounded-full bg-red-600 group-hover:w-16 transition-all" />
                <h3 className="mb-2 text-lg font-bold text-gray-900">{title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RECURSOS ───────────────────────────────────────── */}
      <section id="recursos" className="bg-gray-950 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold text-white md:text-4xl">
              Tudo que você precisa para <span className="text-red-500">vender mais</span>
            </h2>
            <p className="mt-3 text-gray-400">Do cardápio ao painel de controle, sem complicação</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {c.features.map(({ title, desc }, i) => {
              const Icon = featureIcons[i % featureIcons.length];
              return (
                <div key={title}
                  className="rounded-xl border border-gray-800 bg-gray-900 p-5 hover:border-red-800 hover:bg-gray-800 transition-all group">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-red-600/10 group-hover:bg-red-600/20 transition-colors">
                    <Icon size={18} className="text-red-500" />
                  </div>
                  <h3 className="mb-1.5 text-sm font-bold text-white">{title}</h3>
                  <p className="text-xs leading-relaxed text-gray-400">{desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ──────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 md:text-4xl">Como funciona</h2>
            <p className="mt-3 text-gray-500">Em 3 passos simples você já está recebendo pedidos</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { step: '01', title: 'Cadastre sua loja', desc: 'Configure nome, cardápio, categorias, fotos e formas de entrega em poucos minutos.' },
              { step: '02', title: 'Compartilhe o link', desc: 'Envie o link do seu cardápio pelos grupos, WhatsApp, Instagram e onde quiser.' },
              { step: '03', title: 'Gerencie os pedidos', desc: 'Receba, confirme e atualize os pedidos pelo painel. Cliente recebe notificação automática.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="relative text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-2xl font-extrabold text-white shadow-lg shadow-red-100">
                  {step}
                </div>
                <h3 className="mb-2 text-base font-bold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANOS ─────────────────────────────────────────── */}
      <section id="planos" className="bg-gray-50 py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-4 text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 md:text-4xl">Planos</h2>
            <p className="mt-3 text-gray-500 max-w-xl mx-auto">{c.plansCta}</p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {c.plans.map(plan => (
              <div key={plan.name}
                className={`relative flex flex-col rounded-2xl border p-7 transition-all ${
                  plan.highlight
                    ? 'border-red-500 bg-white shadow-xl shadow-red-100 ring-2 ring-red-500/20'
                    : 'border-gray-200 bg-white shadow-sm hover:shadow-md'
                }`}>
                {plan.tag && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-red-600 px-4 py-1 text-xs font-bold text-white whitespace-nowrap">
                    {plan.tag}
                  </div>
                )}
                <div className="mb-5">
                  <h3 className="text-xl font-extrabold text-gray-900">{plan.name}</h3>
                  <p className="mt-2 text-sm text-gray-500 leading-relaxed">{plan.desc}</p>
                </div>
                <ul className="mb-7 flex-1 space-y-2.5">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 size={15} className="mt-0.5 text-red-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a href={wlink(`Olá! Tenho interesse no plano ${plan.name}. Pode me enviar uma proposta?`)}
                  target="_blank" rel="noopener noreferrer"
                  className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all ${
                    plan.highlight
                      ? 'bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-200'
                      : 'border-2 border-gray-200 text-gray-800 hover:border-red-400 hover:text-red-700'
                  }`}>
                  <MessageCircle size={15} /> {plan.ctaLabel}
                </a>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-gray-400">
            Sem taxa por pedido · Sem surpresas na fatura · Cancele quando quiser
          </p>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────── */}
      <section id="faq" className="py-20">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="mb-10 text-center text-3xl font-extrabold text-gray-900">Perguntas frequentes</h2>
          <div className="space-y-3">
            {c.faqs.map((faq, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors">
                  {faq.q}
                  {openFaq === i
                    ? <ChevronUp size={16} className="shrink-0 text-red-500" />
                    : <ChevronDown size={16} className="shrink-0 text-gray-400" />}
                </button>
                {openFaq === i && (
                  <div className="border-t border-gray-100 px-5 py-4 text-sm leading-relaxed text-gray-600">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ──────────────────────────────────────── */}
      <section className="bg-gray-950 py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="mb-4 text-3xl font-extrabold text-white md:text-4xl">
            {c.finalCta.headline}
          </h2>
          <p className="mb-10 text-lg text-gray-400">{c.finalCta.sub}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href={wlink()} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-8 py-4 text-base font-bold text-white hover:bg-red-700 transition-colors shadow-lg shadow-red-900/30">
              <MessageCircle size={20} /> {c.finalCta.cta1.label}
            </a>
            <a href={wlink(c.finalCta.cta2.msg)} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-700 px-8 py-4 text-base font-semibold text-white hover:border-red-500 hover:bg-red-600/10 transition-colors">
              {c.finalCta.cta2.label} <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer className="border-t border-gray-800 bg-gray-950 py-10">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <a href="/" className="flex items-center gap-2">
              <img src={PLATFORM.logoFull} alt={PLATFORM.name}
                className="h-8 w-auto object-contain brightness-200"
                onError={e => {
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent) parent.innerHTML = `<span class="font-bold text-white text-sm">${PLATFORM.name}</span>`;
                }} />
            </a>
            <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-gray-500">
              <a href="#" className="hover:text-gray-300 transition-colors">Termos de uso</a>
              <a href="#" className="hover:text-gray-300 transition-colors">Privacidade</a>
              <a href={`mailto:${PLATFORM.email}`} className="hover:text-gray-300 transition-colors">Contato</a>
              <Link to="/admin/login" className="hover:text-gray-300 transition-colors">Painel</Link>
            </div>
          </div>
          <p className="mt-8 text-center text-xs text-gray-600">
            © {new Date().getFullYear()} {PLATFORM.name}. Todos os direitos reservados.
          </p>
        </div>
      </footer>

      {/* ── BOTÃO WHATSAPP FLUTUANTE ────────────────────────── */}
      <a href={wlink()} target="_blank" rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg shadow-green-900/30 hover:bg-green-600 hover:scale-110 transition-all"
        title="Falar no WhatsApp">
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.558 4.117 1.535 5.845L.057 23.554a.5.5 0 00.613.613l5.71-1.478A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.956 0-3.78-.574-5.31-1.557l-.38-.232-3.388.876.892-3.263-.247-.4A9.952 9.952 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
        </svg>
      </a>
    </div>
  );
}
