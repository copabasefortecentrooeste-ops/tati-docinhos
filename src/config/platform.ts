// ============================================================
// CONFIGURAÇÃO CENTRAL DA PLATAFORMA "Faça Seu Pedido Aqui"
// Edite aqui para atualizar textos, CTAs, FAQ, etc. da landing.
// No futuro, esses valores podem vir de uma tabela no Supabase.
// ============================================================

export const PLATFORM = {
  name: 'Faça Seu Pedido Aqui',
  tagline: 'Sistema de pedidos online para delivery e restaurantes',
  logoIcon: '/logo-fspa.jpg',              // ícone quadrado (favicon, avatar)
  logoFull: '/LOGO FAÇA SEU PEDIDO AQUI.jpg', // logo horizontal com texto
  whatsapp: '5565999999999',               // número no formato internacional sem +
  whatsappMessage: 'Olá! Quero conhecer o sistema Faça Seu Pedido Aqui.',
  instagram: '@facaseupedidoaqui',
  email: 'contato@facaseupedidoaqui.com',
} as const;

// Gera link do WhatsApp com mensagem pré-preenchida
export function whatsappLink(msg?: string) {
  const text = encodeURIComponent(msg ?? PLATFORM.whatsappMessage);
  return `https://wa.me/${PLATFORM.whatsapp}?text=${text}`;
}

export const LANDING_CONTENT = {
  hero: {
    badge: '🚀 Plataforma brasileira de pedidos online',
    headline: 'Venda mais com seu cardápio online',
    headlineHighlight: 'organizado e profissional',
    subheadline:
      'Centralize pedidos, catálogo e operação em um só lugar. Seu negócio com mais controle, seus clientes com mais facilidade.',
    cta1: { label: 'Falar no WhatsApp', type: 'whatsapp' as const },
    cta2: { label: 'Conhecer os planos', type: 'anchor' as const, anchor: '#planos' },
  },

  benefits: [
    {
      title: 'Cardápio online completo',
      desc: 'Monte seu catálogo com fotos, categorias, opções de sabor e variações. Tudo pelo painel, sem precisar de programador.',
    },
    {
      title: 'Pedidos organizados em tempo real',
      desc: 'Receba, gerencie e acompanhe cada pedido direto no painel. Sem WhatsApp bagunçado, sem anotação em papel.',
    },
    {
      title: 'Mais controle da operação',
      desc: 'Estoque, horários, cupons, taxa de entrega e configurações da loja — tudo no mesmo lugar, fácil de ajustar.',
    },
  ],

  features: [
    { title: 'Pedidos em tempo real', desc: 'Receba pedidos 24h com notificação imediata no painel.' },
    { title: 'Controle de estoque', desc: 'Gerencie disponibilidade por produto, com alerta de baixo estoque.' },
    { title: 'Cupons de desconto', desc: 'Crie promoções com cupons percentuais ou de valor fixo.' },
    { title: 'Horários configuráveis', desc: 'Defina quando sua loja aceita pedidos, com bloqueio automático.' },
    { title: 'WhatsApp integrado', desc: 'Notifique clientes automaticamente ao atualizar o status do pedido.' },
    { title: 'Cardápio mobile', desc: 'Cardápio responsivo, rápido e elegante para seus clientes acessarem no celular.' },
    { title: 'Dashboard completo', desc: 'Acompanhe vendas, ticket médio e pedidos por período.' },
    { title: 'Multi-lojas', desc: 'Gerencie mais de uma unidade com painéis separados por loja.' },
  ],

  segments: [
    'Docerias',
    'Hamburguerias',
    'Pizzarias',
    'Marmitarias',
    'Lanchonetes',
    'Açaí',
    'Restaurantes',
    'Padarias',
  ],

  plans: [
    {
      name: 'Mensal',
      tag: null,
      desc: 'Ideal para quem está começando e quer testar o sistema sem compromisso de longo prazo.',
      features: [
        'Cardápio online completo',
        'Pedidos em tempo real',
        'Painel administrativo',
        'Suporte por WhatsApp',
      ],
      ctaLabel: 'Solicitar proposta',
      ctaType: 'whatsapp' as const,
      highlight: false,
    },
    {
      name: 'Trimestral',
      tag: 'Mais escolhido',
      desc: 'Para negócios em crescimento que querem consistência e uma condição mais vantajosa.',
      features: [
        'Tudo do plano Mensal',
        'Cupons de desconto',
        'Controle de estoque',
        'Horários configuráveis',
      ],
      ctaLabel: 'Quero este plano',
      ctaType: 'whatsapp' as const,
      highlight: true,
    },
    {
      name: 'Anual',
      tag: 'Melhor custo-benefício',
      desc: 'Para operações consolidadas que querem o melhor valor e todos os recursos disponíveis.',
      features: [
        'Tudo do plano Trimestral',
        'WhatsApp integrado',
        'Domínio personalizado',
        'Suporte prioritário',
      ],
      ctaLabel: 'Quero uma demonstração',
      ctaType: 'whatsapp' as const,
      highlight: false,
    },
  ],

  plansCta: 'Escolha o formato ideal para o seu negócio e fale com a gente para receber a proposta.',

  faqs: [
    {
      q: 'O sistema serve para quais tipos de negócio?',
      a: 'Para qualquer negócio de alimentação: docerias, hamburguerias, pizzarias, marmitarias, açaí, lanchonetes, padarias e restaurantes em geral.',
    },
    {
      q: 'Consigo receber pedidos direto pelo celular?',
      a: 'Sim. O painel funciona perfeitamente no celular, tablet ou computador. Você gerencia tudo de onde estiver.',
    },
    {
      q: 'O cliente faz o pedido de forma simples?',
      a: 'Com certeza. O cardápio é intuitivo, rápido e pensado para quem não tem costume com tecnologia. Seu cliente entra, escolhe e finaliza em poucos cliques.',
    },
    {
      q: 'O sistema ajuda a organizar os pedidos?',
      a: 'Sim. Todos os pedidos chegam no painel em tempo real, com nome do cliente, itens, endereço e forma de pagamento. Sem confusão, sem perda de informação.',
    },
    {
      q: 'Posso escolher o plano ideal para o meu momento?',
      a: 'Sim. Temos planos mensal, trimestral e anual, cada um pensado para uma fase do negócio. Fale com a gente e vamos indicar o melhor para você.',
    },
    {
      q: 'Como faço para ver uma demonstração?',
      a: 'É só falar com a gente pelo WhatsApp! Agendamos uma apresentação gratuita e mostramos o sistema funcionando na prática.',
    },
  ],

  finalCta: {
    headline: 'Pronto para organizar seus pedidos?',
    sub: 'Fale com a gente agora e veja como funciona na prática.',
    cta1: { label: 'Falar no WhatsApp', type: 'whatsapp' as const },
    cta2: { label: 'Solicitar demonstração', type: 'whatsapp' as const, msg: 'Olá! Quero agendar uma demonstração do sistema Faça Seu Pedido Aqui.' },
  },
};
