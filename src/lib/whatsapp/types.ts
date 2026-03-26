// ── Provider types ───────────────────────────────────────────
export type WhatsAppProviderName = 'official_cloud_api' | 'fallback_link';

// ── Event keys (maps 1:1 to OrderStatus + extras) ───────────
export type WhatsAppEventKey =
  | 'order_created'
  | 'order_confirmed'
  | 'order_in_analysis'
  | 'order_in_production'
  | 'order_ready'
  | 'order_out_for_delivery'
  | 'order_delivered'
  | 'order_cancelled'
  | 'payment_confirmed'
  | 'out_of_stock';

export const WA_EVENT_LABELS: Record<WhatsAppEventKey, string> = {
  order_created:          'Pedido Recebido',
  order_confirmed:        'Pedido Confirmado',
  order_in_analysis:      'Em Análise',
  order_in_production:    'Em Produção',
  order_ready:            'Pronto para Retirada',
  order_out_for_delivery: 'Saiu para Entrega',
  order_delivered:        'Entregue',
  order_cancelled:        'Cancelado',
  payment_confirmed:      'Pagamento Confirmado',
  out_of_stock:           'Produto Indisponível',
};

/** Map from OrderStatus to WhatsAppEventKey */
export const ORDER_STATUS_TO_WA_EVENT: Record<string, WhatsAppEventKey> = {
  received:   'order_created',
  analyzing:  'order_in_analysis',
  production: 'order_in_production',
  delivery:   'order_out_for_delivery',
  delivered:  'order_delivered',
  cancelled:  'order_cancelled',
};

// ── Message status ───────────────────────────────────────────
export type MessageStatus = 'pending' | 'sent' | 'failed' | 'fallback';

// ── Core entities ────────────────────────────────────────────
export interface WhatsAppConnection {
  id: string;
  storeId: string;
  providerName: WhatsAppProviderName;
  isEnabled: boolean;
  displayPhone: string;
  businessPhoneNumberId?: string;
  verifyToken?: string;
  webhookUrl?: string;
  defaultCountryCode: string;
  useOfficialApi: boolean;
  fallbackWhatsappNumber?: string;
  fallbackMessageTemplate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppTemplate {
  id: string;
  storeId: string;
  eventKey: WhatsAppEventKey;
  name: string;
  body: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppAutomationRule {
  id: string;
  storeId: string;
  eventKey: WhatsAppEventKey;
  templateId: string | null;
  isActive: boolean;
  sendMode: 'auto' | 'manual';
  createdAt: string;
}

export interface WhatsAppMessageLog {
  id: string;
  storeId: string;
  orderId?: string;
  orderCode?: string;
  recipientPhone: string;
  eventKey?: string;
  templateId?: string;
  messageBody: string;
  status: MessageStatus;
  provider?: string;
  errorMessage?: string;
  sentAt?: string;
  createdAt: string;
}

// ── Service DTOs ─────────────────────────────────────────────
export interface TemplateVariables {
  nome?: string;
  codigo?: string;
  loja?: string;
  status?: string;
  produto?: string;
  valor_total?: string;
  previsao_entrega?: string;
  link_pedido?: string;
  telefone_loja?: string;
  [key: string]: string | undefined;
}

export interface SendMessageOptions {
  to: string;
  template: WhatsAppTemplate;
  variables: TemplateVariables;
  orderId?: string;
  orderCode?: string;
  eventKey?: WhatsAppEventKey;
}

export interface SendResult {
  success: boolean;
  provider: WhatsAppProviderName | 'none';
  fallbackUrl?: string;
  error?: string;
}

export interface ConnectionValidation {
  ok: boolean;
  error?: string;
}
