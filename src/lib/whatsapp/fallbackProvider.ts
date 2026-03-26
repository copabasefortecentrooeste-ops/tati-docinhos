import type { WhatsAppProviderAdapter } from './provider';
import type { SendMessageOptions, SendResult, WhatsAppConnection } from './types';
import { interpolate, buildWaLink } from './templateEngine';

/**
 * Fallback link provider.
 * Does NOT send messages via API — generates a wa.me deep link instead.
 * Works 100% locally without any external API configuration.
 */
export const fallbackProvider: WhatsAppProviderAdapter = {
  name: 'fallback_link',

  buildFallbackLink(opts: SendMessageOptions, conn: WhatsAppConnection): string {
    const message = interpolate(opts.template.body, opts.variables);
    const phone =
      opts.to ||
      conn.fallbackWhatsappNumber ||
      conn.displayPhone ||
      '';
    return buildWaLink(phone, message, conn.defaultCountryCode);
  },

  async sendMessage(
    opts: SendMessageOptions,
    conn: WhatsAppConnection,
  ): Promise<SendResult> {
    const url = this.buildFallbackLink(opts, conn);
    return { success: true, provider: 'fallback_link', fallbackUrl: url };
  },

  async validateConnection(_conn: WhatsAppConnection) {
    return { ok: true };
  },
};
