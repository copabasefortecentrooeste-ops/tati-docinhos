import type { TemplateVariables } from './types';

/** Replaces {{variable}} placeholders in a template string */
export function interpolate(template: string, variables: TemplateVariables): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const val = variables[key];
    return val !== undefined ? String(val) : `{{${key}}}`;
  });
}

/** Returns all unique {{variable}} names found in a template body */
export function extractVariables(body: string): string[] {
  const matches = body.matchAll(/\{\{(\w+)\}\}/g);
  return [...new Set([...matches].map((m) => m[1]))];
}

/**
 * Builds a wa.me deep link.
 * @param phone  Raw phone number (with or without country code)
 * @param message  Pre-filled message text
 * @param countryCode  Default country code if not present (default: '55' = Brazil)
 */
export function buildWaLink(phone: string, message: string, countryCode = '55'): string {
  const normalized = normalizePhone(phone, countryCode);
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${normalized}?text=${encoded}`;
}

/** Normalizes a phone number to E.164 digits (no +, no spaces) */
export function normalizePhone(phone: string, countryCode = '55'): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length >= 12) return digits;
  if (digits.startsWith(countryCode)) return digits;
  return `${countryCode}${digits}`;
}

/** All recognized template variable names with descriptions */
export const TEMPLATE_VARIABLE_DOCS: Record<string, string> = {
  nome:             'Nome do cliente',
  codigo:           'Código do pedido',
  loja:             'Nome da loja',
  status:           'Status atual do pedido',
  produto:          'Nome do produto',
  valor_total:      'Valor total formatado (R$)',
  previsao_entrega: 'Previsão de entrega',
  link_pedido:      'Link para acompanhar o pedido',
  telefone_loja:    'Telefone de contato da loja',
};
