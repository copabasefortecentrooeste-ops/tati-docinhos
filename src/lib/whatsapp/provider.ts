import type { SendMessageOptions, SendResult, WhatsAppConnection, ConnectionValidation } from './types';

/**
 * Provider adapter interface.
 * Any WhatsApp provider must implement this contract.
 * To add a new provider: implement this interface and register it in service.ts.
 */
export interface WhatsAppProviderAdapter {
  readonly name: string;

  /** Sends a message. On failure, returns success:false (never throws). */
  sendMessage(
    opts: SendMessageOptions,
    conn: WhatsAppConnection,
  ): Promise<SendResult>;

  /** Validates whether the connection config is usable. */
  validateConnection(conn: WhatsAppConnection): Promise<ConnectionValidation>;

  /** Always returns a wa.me fallback link — works offline. */
  buildFallbackLink(opts: SendMessageOptions, conn: WhatsAppConnection): string;
}
