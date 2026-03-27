/**
 * usePlatformConfig
 * -----------------
 * Hook que mescla os valores editáveis (vindos do Supabase / localStorage)
 * com os padrões definidos em src/config/platform.ts.
 *
 * Fluxo de leitura:
 *   1. Renderização inicial  → lê localStorage (instantâneo, sem flash)
 *   2. useEffect             → busca config real do Supabase e atualiza estado
 *
 * Fluxo de escrita (usado pelo MasterConfig):
 *   1. savePlatformOverrides() salva no localStorage imediatamente
 *   2. MasterConfig também salva na tabela `platform_settings` do Supabase
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { PLATFORM, LANDING_CONTENT } from '@/config/platform';

export const LS_KEY = 'fspa_platform_config';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface PlanOverride {
  name: string;
  tag: string | null;
  desc: string;
  features: string[];
  ctaLabel: string;
  highlight: boolean;
}

export interface FaqOverride {
  q: string;
  a: string;
}

export interface PlatformOverrides {
  whatsapp?: string;
  whatsappMessage?: string;
  hero_badge?: string;
  hero_headline?: string;
  hero_headlineHighlight?: string;
  hero_subheadline?: string;
  segments?: string[];
  plans?: PlanOverride[];
  plansCta?: string;
  faqs?: FaqOverride[];
  finalCta_headline?: string;
  finalCta_sub?: string;
}

// ─── Helpers de storage ───────────────────────────────────────────────────────

export function loadPlatformOverrides(): PlatformOverrides {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as PlatformOverrides) : {};
  } catch {
    return {};
  }
}

export function savePlatformOverrides(overrides: PlatformOverrides): void {
  localStorage.setItem(LS_KEY, JSON.stringify(overrides));
}

export function clearPlatformOverrides(): void {
  localStorage.removeItem(LS_KEY);
}

// ─── Fetch do Supabase ────────────────────────────────────────────────────────

async function fetchFromSupabase(): Promise<PlatformOverrides> {
  try {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('config')
      .eq('id', 1)
      .single();
    if (error || !data) return {};
    const cfg = data.config as PlatformOverrides;
    return cfg && typeof cfg === 'object' ? cfg : {};
  } catch {
    return {};
  }
}

// ─── Hook principal ───────────────────────────────────────────────────────────

export function usePlatformConfig() {
  // Renderização inicial com localStorage (sem flash de conteúdo padrão)
  const [ov, setOv] = useState<PlatformOverrides>(() => loadPlatformOverrides());

  useEffect(() => {
    // Sincroniza com Supabase e atualiza cache local
    fetchFromSupabase().then(remote => {
      if (Object.keys(remote).length > 0) {
        setOv(remote);
        savePlatformOverrides(remote);
      }
    });

    // Escuta mudanças de outras abas (localStorage)
    const handler = () => setOv(loadPlatformOverrides());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  // ── Valores mesclados ──────────────────────────────────────────────────────
  const whatsapp = ov.whatsapp ?? PLATFORM.whatsapp;
  const whatsappMessage = ov.whatsappMessage ?? PLATFORM.whatsappMessage;

  /** Gera link wa.me com número e mensagem dinâmicos */
  const wlink = (msg?: string): string => {
    const text = encodeURIComponent(msg ?? whatsappMessage);
    return `https://wa.me/${whatsapp}?text=${text}`;
  };

  return {
    whatsapp,
    wlink,
    hero: {
      ...LANDING_CONTENT.hero,
      badge: ov.hero_badge ?? LANDING_CONTENT.hero.badge,
      headline: ov.hero_headline ?? LANDING_CONTENT.hero.headline,
      headlineHighlight: ov.hero_headlineHighlight ?? LANDING_CONTENT.hero.headlineHighlight,
      subheadline: ov.hero_subheadline ?? LANDING_CONTENT.hero.subheadline,
    },
    benefits: LANDING_CONTENT.benefits,
    features: LANDING_CONTENT.features,
    segments: (ov.segments ?? [...LANDING_CONTENT.segments]) as string[],
    plans: (ov.plans ?? LANDING_CONTENT.plans.map(p => ({
      name: p.name,
      tag: p.tag,
      desc: p.desc,
      features: [...p.features],
      ctaLabel: p.ctaLabel,
      highlight: p.highlight,
    }))) as PlanOverride[],
    plansCta: ov.plansCta ?? LANDING_CONTENT.plansCta,
    faqs: (ov.faqs ?? LANDING_CONTENT.faqs.map(f => ({ ...f }))) as FaqOverride[],
    finalCta: {
      ...LANDING_CONTENT.finalCta,
      headline: ov.finalCta_headline ?? LANDING_CONTENT.finalCta.headline,
      sub: ov.finalCta_sub ?? LANDING_CONTENT.finalCta.sub,
    },
  };
}
