/**
 * Meta Cloud API provider.
 *
 * STATUS: Scaffolded — ready for production wiring.
 *
 * To activate in production:
 *   1. Deploy a server-side proxy (Edge Function, Next.js API, etc.)
 *   2. Set VITE_WA_API_URL to your proxy endpoint
 *   3. Store WHATSAPP_ACCESS_TOKEN in server-side env (NEVER in frontend)
 *   4. Set connection.useOfficialApi = true and businessPhoneNumberId in the admin panel
 *
 * Local behavior: gracefully degrades to fallback_link when VITE_WA_API_URL is not set.
 */
import type { WhatsAppProviderAdapter } from './provider';
import type { SendMessageOptions, SendResult, WhatsAppConnection, ConnectionValidation } from './types';
import { interpolate, buildWaLink } from './templateEngine';

export const officialProvider: WhatsAppProviderAdapter = {
  name: 'official_cloud_api',

  buildFallbackLink(opts: SendMessageOptions, conn: WhatsAppConnection): string {
    const message = interpolate(opts.template.body, opts.variables);
    const phone = opts.to || conn.displayPhone || '';
    return buildWaLink(phone, message, conn.defaultCountryCode);
  },

  async sendMessage(
    opts: SendMessageOptions,
    conn: WhatsAppConnection,
  ): Promise<SendResult> {
    const apiUrl = import.meta.env.VITE_WA_API_URL as string | undefined;

    // Graceful degradation when proxy URL is not configured
    if (!apiUrl || !conn.businessPhoneNumberId) {
      const url = this.buildFallbackLink(opts, conn);
      return {
        success: true,
        provider: 'fallback_link',
        fallbackUrl: url,
      };
    }

    try {
      const message = interpolate(opts.template.body, opts.variables);
      const res = await fetch(`${apiUrl}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: opts.to,
          message,
          phoneNumberId: conn.businessPhoneNumberId,
          eventKey: opts.eventKey,
          orderCode: opts.orderCode,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        return { success: false, provider: 'official_cloud_api', error: errText };
      }

      return { success: true, provider: 'official_cloud_api' };
    } catch (err) {
      return {
        success: false,
        provider: 'official_cloud_api',
        error: String(err),
      };
    }
  },

  async validateConnection(conn: WhatsAppConnection): Promise<ConnectionValidation> {
    const apiUrl = import.meta.env.VITE_WA_API_URL as string | undefined;
    if (!apiUrl) {
      return { ok: false, error: 'VITE_WA_API_URL não configurada (necessário em produção)' };
    }
    if (!conn.businessPhoneNumberId) {
      return { ok: false, error: 'Business Phone Number ID não preenchido' };
    }
    try {
      const res = await fetch(`${apiUrl}/health`);
      return res.ok ? { ok: true } : { ok: false, error: `Proxy retornou ${res.status}` };
    } catch (err) {
      return { ok: false, error: `Sem conexão com proxy: ${String(err)}` };
    }
  },
};
