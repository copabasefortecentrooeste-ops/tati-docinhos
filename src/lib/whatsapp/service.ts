import { supabase } from '@/lib/supabase';
import type {
  WhatsAppConnection,
  WhatsAppTemplate,
  WhatsAppAutomationRule,
  WhatsAppMessageLog,
  TemplateVariables,
  WhatsAppEventKey,
  SendResult,
  WhatsAppProviderName,
} from './types';
import type { WhatsAppProviderAdapter } from './provider';
import { fallbackProvider } from './fallbackProvider';
import { officialProvider } from './officialProvider';
import { interpolate } from './templateEngine';

// ── Provider registry ────────────────────────────────────────
const PROVIDERS: Record<string, WhatsAppProviderAdapter> = {
  fallback_link:      fallbackProvider,
  official_cloud_api: officialProvider,
};

export const whatsAppService = {
  // ── Provider ──────────────────────────────────────────────
  getProvider(name: string): WhatsAppProviderAdapter {
    return PROVIDERS[name] ?? fallbackProvider;
  },

  // ── DB reads ──────────────────────────────────────────────
  async getConnection(storeId = 'default'): Promise<WhatsAppConnection | null> {
    const { data } = await supabase
      .from('whatsapp_connections')
      .select('*')
      .eq('store_id', storeId)
      .maybeSingle();
    return data ? fromDBConnection(data) : null;
  },

  async getTemplates(storeId = 'default'): Promise<WhatsAppTemplate[]> {
    const { data } = await supabase
      .from('whatsapp_templates')
      .select('*')
      .eq('store_id', storeId)
      .order('event_key');
    return (data ?? []).map(fromDBTemplate);
  },

  async getTemplate(eventKey: WhatsAppEventKey, storeId = 'default'): Promise<WhatsAppTemplate | null> {
    const { data } = await supabase
      .from('whatsapp_templates')
      .select('*')
      .eq('store_id', storeId)
      .eq('event_key', eventKey)
      .eq('is_active', true)
      .maybeSingle();
    return data ? fromDBTemplate(data) : null;
  },

  async getAutomationRules(storeId = 'default'): Promise<WhatsAppAutomationRule[]> {
    const { data } = await supabase
      .from('whatsapp_automation_rules')
      .select('*')
      .eq('store_id', storeId)
      .order('event_key');
    return (data ?? []).map(fromDBRule);
  },

  async isAutomationActive(eventKey: WhatsAppEventKey, storeId = 'default'): Promise<boolean> {
    const { data } = await supabase
      .from('whatsapp_automation_rules')
      .select('is_active, send_mode')
      .eq('store_id', storeId)
      .eq('event_key', eventKey)
      .maybeSingle();
    return data?.is_active === true && data?.send_mode === 'auto';
  },

  async getLogs(storeId = 'default', limit = 50): Promise<WhatsAppMessageLog[]> {
    const { data } = await supabase
      .from('whatsapp_message_logs')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .limit(limit);
    return (data ?? []).map(fromDBLog);
  },

  // ── Connection management ────────────────────────────────
  async saveConnection(conn: Partial<WhatsAppConnection> & { storeId: string }): Promise<void> {
    await supabase.from('whatsapp_connections').upsert({
      store_id:                  conn.storeId,
      provider_name:             conn.providerName ?? 'fallback_link',
      is_enabled:                conn.isEnabled ?? false,
      display_phone:             conn.displayPhone ?? '',
      business_phone_number_id:  conn.businessPhoneNumberId ?? null,
      verify_token:              conn.verifyToken ?? null,
      webhook_url:               conn.webhookUrl ?? null,
      default_country_code:      conn.defaultCountryCode ?? '55',
      use_official_api:          conn.useOfficialApi ?? false,
      fallback_whatsapp_number:  conn.fallbackWhatsappNumber ?? null,
      fallback_message_template: conn.fallbackMessageTemplate ?? null,
    }, { onConflict: 'store_id' });
  },

  // ── Template management ──────────────────────────────────
  async saveTemplate(t: Pick<WhatsAppTemplate, 'id' | 'storeId' | 'eventKey' | 'name' | 'body' | 'isActive'>): Promise<void> {
    await supabase.from('whatsapp_templates').upsert({
      id:         t.id || undefined,
      store_id:   t.storeId,
      event_key:  t.eventKey,
      name:       t.name,
      body:       t.body,
      is_active:  t.isActive,
    }, { onConflict: 'store_id,event_key' });
  },

  // ── Automation rule management ───────────────────────────
  async saveAutomationRule(rule: Pick<WhatsAppAutomationRule, 'storeId' | 'eventKey' | 'templateId' | 'isActive' | 'sendMode'>): Promise<void> {
    await supabase.from('whatsapp_automation_rules').upsert({
      store_id:    rule.storeId,
      event_key:   rule.eventKey,
      template_id: rule.templateId ?? null,
      is_active:   rule.isActive,
      send_mode:   rule.sendMode,
    }, { onConflict: 'store_id,event_key' });
  },

  // ── Core: send notification for an order event ───────────
  async sendForOrder(opts: {
    eventKey: WhatsAppEventKey;
    phone: string;
    variables: TemplateVariables;
    orderId?: string;
    orderCode?: string;
    storeId?: string;
  }): Promise<SendResult & { fallbackUrl?: string }> {
    const storeId = opts.storeId ?? 'default';

    const [conn, template, isAuto] = await Promise.all([
      this.getConnection(storeId),
      this.getTemplate(opts.eventKey, storeId),
      this.isAutomationActive(opts.eventKey, storeId),
    ]);

    if (!template) {
      return { success: false, provider: 'none', error: 'Template não encontrado para este evento' };
    }

    const effectiveConn = conn ?? defaultConnection();
    const provider = this.getProvider(effectiveConn.providerName);

    // Always compute fallback link (works without API)
    const fallbackUrl = provider.buildFallbackLink(
      { to: opts.phone, template, variables: opts.variables, orderId: opts.orderId, orderCode: opts.orderCode, eventKey: opts.eventKey },
      effectiveConn,
    );

    let result: SendResult;

    if (!effectiveConn.isEnabled || !isAuto) {
      // Automation off — provide fallback link, don't attempt API send
      result = {
        success: false,
        provider: 'none' as const,
        fallbackUrl,
        error: 'Automação inativa — use o link de fallback',
      };
    } else {
      result = await provider.sendMessage(
        { to: opts.phone, template, variables: opts.variables, orderId: opts.orderId, orderCode: opts.orderCode, eventKey: opts.eventKey },
        effectiveConn,
      );
      if (!result.fallbackUrl) result = { ...result, fallbackUrl };
    }

    // Log every attempt (fire and forget — don't block the caller)
    this.logMessage({
      storeId,
      orderId:        opts.orderId,
      orderCode:      opts.orderCode,
      recipientPhone: opts.phone,
      eventKey:       opts.eventKey,
      templateId:     template.id,
      messageBody:    interpolate(template.body, opts.variables),
      status:         result.success ? 'sent' : effectiveConn.isEnabled ? 'failed' : 'fallback',
      provider:       result.provider,
      error:          result.error,
    }).catch(console.warn);

    return result;
  },

  // ── Logging ──────────────────────────────────────────────
  async logMessage(entry: {
    storeId: string;
    orderId?: string;
    orderCode?: string;
    recipientPhone: string;
    eventKey?: WhatsAppEventKey;
    templateId?: string;
    messageBody: string;
    status: string;
    provider?: WhatsAppProviderName | 'none';
    error?: string;
  }): Promise<void> {
    await supabase.from('whatsapp_message_logs').insert({
      store_id:        entry.storeId,
      order_id:        entry.orderId ?? null,
      order_code:      entry.orderCode ?? null,
      recipient_phone: entry.recipientPhone,
      event_key:       entry.eventKey ?? null,
      template_id:     entry.templateId ?? null,
      message_body:    entry.messageBody,
      status:          entry.status,
      provider:        entry.provider ?? null,
      error_message:   entry.error ?? null,
      sent_at:         entry.status === 'sent' ? new Date().toISOString() : null,
    });
  },

  // ── Convenience: build a fallback link without full send ─
  buildQuickFallbackLink(phone: string, message: string, countryCode = '55'): string {
    const { buildWaLink } = require('./templateEngine') as typeof import('./templateEngine');
    return buildWaLink(phone, message, countryCode);
  },
};

// ── DB → domain mappers ──────────────────────────────────────
function fromDBConnection(r: Record<string, unknown>): WhatsAppConnection {
  return {
    id:                       r.id as string,
    storeId:                  r.store_id as string,
    providerName:             (r.provider_name as WhatsAppProviderName) ?? 'fallback_link',
    isEnabled:                (r.is_enabled as boolean) ?? false,
    displayPhone:             (r.display_phone as string) ?? '',
    businessPhoneNumberId:    r.business_phone_number_id as string | undefined,
    verifyToken:              r.verify_token as string | undefined,
    webhookUrl:               r.webhook_url as string | undefined,
    defaultCountryCode:       (r.default_country_code as string) ?? '55',
    useOfficialApi:           (r.use_official_api as boolean) ?? false,
    fallbackWhatsappNumber:   r.fallback_whatsapp_number as string | undefined,
    fallbackMessageTemplate:  r.fallback_message_template as string | undefined,
    createdAt:                r.created_at as string,
    updatedAt:                r.updated_at as string,
  };
}

function fromDBTemplate(r: Record<string, unknown>): WhatsAppTemplate {
  return {
    id:        r.id as string,
    storeId:   r.store_id as string,
    eventKey:  r.event_key as WhatsAppEventKey,
    name:      r.name as string,
    body:      r.body as string,
    isActive:  (r.is_active as boolean) ?? true,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

function fromDBRule(r: Record<string, unknown>): WhatsAppAutomationRule {
  return {
    id:         r.id as string,
    storeId:    r.store_id as string,
    eventKey:   r.event_key as WhatsAppEventKey,
    templateId: (r.template_id as string) ?? null,
    isActive:   (r.is_active as boolean) ?? false,
    sendMode:   (r.send_mode as 'auto' | 'manual') ?? 'auto',
    createdAt:  r.created_at as string,
  };
}

function fromDBLog(r: Record<string, unknown>): WhatsAppMessageLog {
  return {
    id:             r.id as string,
    storeId:        r.store_id as string,
    orderId:        r.order_id as string | undefined,
    orderCode:      r.order_code as string | undefined,
    recipientPhone: r.recipient_phone as string,
    eventKey:       r.event_key as string | undefined,
    templateId:     r.template_id as string | undefined,
    messageBody:    r.message_body as string,
    status:         r.status as WhatsAppMessageLog['status'],
    provider:       r.provider as string | undefined,
    errorMessage:   r.error_message as string | undefined,
    sentAt:         r.sent_at as string | undefined,
    createdAt:      r.created_at as string,
  };
}

function defaultConnection(): WhatsAppConnection {
  return {
    id: '', storeId: 'default', providerName: 'fallback_link',
    isEnabled: false, displayPhone: '', defaultCountryCode: '55',
    useOfficialApi: false, createdAt: '', updatedAt: '',
  };
}
