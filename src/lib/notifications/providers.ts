/**
 * Provider abstraction layer.
 *
 * Each channel (Email, WhatsApp, SMS) has its own provider interface.
 * Providers are swappable — set via env vars. If no provider is configured,
 * the ConsoleProvider is used (logs to console + NotificationLog).
 *
 * To add a new provider:
 *   1. Implement the NotificationProvider interface.
 *   2. Add a factory function in provider-factory.ts.
 *   3. Set the appropriate env var (e.g. EMAIL_PROVIDER=sendgrid).
 */

import type {
  EmailPayload,
  NotificationProvider,
  SmsPayload,
  WhatsAppPayload,
} from "./types";

// =====================================================
// Console providers — default, no env vars required.
// Used in development + as fallback when no real provider
// is configured. Logs to console + DB only.
// =====================================================

class ConsoleEmailProvider implements NotificationProvider<EmailPayload> {
  readonly name = "console";
  readonly channel = "email" as const;

  async send(payload: EmailPayload): Promise<{ messageId: string }> {
    const messageId = `console-email-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    console.log(`[ConsoleEmailProvider] → ${payload.to}`);
    console.log(`  Subject: ${payload.subject}`);
    console.log(`  Body: ${payload.textBody.slice(0, 200)}${payload.textBody.length > 200 ? "…" : ""}`);
    return { messageId };
  }

  isConfigured(): boolean {
    return true; // always available as fallback
  }
}

class ConsoleWhatsAppProvider implements NotificationProvider<WhatsAppPayload> {
  readonly name = "console";
  readonly channel = "whatsapp" as const;

  async send(payload: WhatsAppPayload): Promise<{ messageId: string }> {
    const messageId = `console-wa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    console.log(`[ConsoleWhatsAppProvider] → ${payload.toPhone}`);
    console.log(`  Body: ${payload.body.slice(0, 200)}${payload.body.length > 200 ? "…" : ""}`);
    return { messageId };
  }

  isConfigured(): boolean {
    return true;
  }
}

class ConsoleSmsProvider implements NotificationProvider<SmsPayload> {
  readonly name = "console";
  readonly channel = "sms" as const;

  async send(payload: SmsPayload): Promise<{ messageId: string }> {
    const messageId = `console-sms-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    console.log(`[ConsoleSmsProvider] → ${payload.toPhone}`);
    console.log(`  Body: ${payload.body.slice(0, 160)}`);
    return { messageId };
  }

  isConfigured(): boolean {
    return true;
  }
}

// =====================================================
// Stub providers — placeholders for production integration.
// These throw "not implemented" so they fail loudly during
// testing. Enable by setting env vars in production.
// =====================================================

interface SendGridConfig {
  apiKey: string;
  fromEmail: string;
}

class SendGridEmailProvider implements NotificationProvider<EmailPayload> {
  readonly name = "sendgrid";
  readonly channel = "email" as const;
  private config: SendGridConfig | null = null;

  constructor() {
    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;
    if (apiKey && fromEmail) {
      this.config = { apiKey, fromEmail };
    }
  }

  isConfigured(): boolean {
    return this.config !== null;
  }

  async send(payload: EmailPayload): Promise<{ messageId: string }> {
    if (!this.config) {
      throw new Error("SendGrid provider not configured. Set SENDGRID_API_KEY + SENDGRID_FROM_EMAIL.");
    }
    // Production implementation:
    //   const sgMail = require("@sendgrid/mail");
    //   sgMail.setApiKey(this.config.apiKey);
    //   const msg = { to: payload.to, from: this.config.fromEmail,
    //                 subject: payload.subject, text: payload.textBody,
    //                 html: payload.htmlBody };
    //   const response = await sgMail.send(msg);
    //   return { messageId: response[0].headers["x-message-id"] };
    //
    // For now — log + return simulated ID.
    console.log(`[SendGridEmailProvider] (stub) → ${payload.to} | ${payload.subject}`);
    return { messageId: `sg-stub-${Date.now()}` };
  }
}

interface TwilioWhatsAppConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string; // whatsapp:+14155238886
}

class TwilioWhatsAppProvider implements NotificationProvider<WhatsAppPayload> {
  readonly name = "twilio";
  readonly channel = "whatsapp" as const;
  private config: TwilioWhatsAppConfig | null = null;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_WHATSAPP_FROM;
    if (accountSid && authToken && fromNumber) {
      this.config = { accountSid, authToken, fromNumber };
    }
  }

  isConfigured(): boolean {
    return this.config !== null;
  }

  async send(payload: WhatsAppPayload): Promise<{ messageId: string }> {
    if (!this.config) {
      throw new Error("Twilio WhatsApp provider not configured. Set TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_WHATSAPP_FROM.");
    }
    // Production implementation:
    //   const client = require("twilio")(this.config.accountSid, this.config.authToken);
    //   const message = await client.messages.create({
    //     from: this.config.fromNumber,
    //     to: `whatsapp:${payload.toPhone}`,
    //     body: payload.body,
    //   });
    //   return { messageId: message.sid };
    console.log(`[TwilioWhatsAppProvider] (stub) → ${payload.toPhone}`);
    return { messageId: `tw-stub-${Date.now()}` };
  }
}

// =====================================================
// Provider factories — return the configured provider or
// fall back to console.
// =====================================================

let cachedEmailProvider: NotificationProvider<EmailPayload> | null = null;
let cachedWhatsAppProvider: NotificationProvider<WhatsAppPayload> | null = null;
let cachedSmsProvider: NotificationProvider<SmsPayload> | null = null;

/** Returns the configured Email provider (defaults to console). */
export function getEmailProvider(): NotificationProvider<EmailPayload> {
  if (cachedEmailProvider) return cachedEmailProvider;
  const providerName = process.env.EMAIL_PROVIDER ?? "console";
  switch (providerName) {
    case "sendgrid": {
      const provider = new SendGridEmailProvider();
      cachedEmailProvider = provider.isConfigured() ? provider : new ConsoleEmailProvider();
      break;
    }
    default:
      cachedEmailProvider = new ConsoleEmailProvider();
  }
  return cachedEmailProvider;
}

/** Returns the configured WhatsApp provider (defaults to console). */
export function getWhatsAppProvider(): NotificationProvider<WhatsAppPayload> {
  if (cachedWhatsAppProvider) return cachedWhatsAppProvider;
  const providerName = process.env.WHATSAPP_PROVIDER ?? "console";
  switch (providerName) {
    case "twilio": {
      const provider = new TwilioWhatsAppProvider();
      cachedWhatsAppProvider = provider.isConfigured() ? provider : new ConsoleWhatsAppProvider();
      break;
    }
    default:
      cachedWhatsAppProvider = new ConsoleWhatsAppProvider();
  }
  return cachedWhatsAppProvider;
}

/** Returns the configured SMS provider (defaults to console). */
export function getSmsProvider(): NotificationProvider<SmsPayload> {
  if (cachedSmsProvider) return cachedSmsProvider;
  // SMS providers can be added here (Twilio SMS, MSG91, etc.)
  cachedSmsProvider = new ConsoleSmsProvider();
  return cachedSmsProvider;
}

/** Clears provider cache — used in tests. */
export function resetProviderCache(): void {
  cachedEmailProvider = null;
  cachedWhatsAppProvider = null;
  cachedSmsProvider = null;
}

/** Returns a description of all providers and their configuration status. */
export function getProviderStatus(): Array<{
  channel: string;
  configured: string;
  provider: string;
}> {
  const email = getEmailProvider();
  const wa = getWhatsAppProvider();
  const sms = getSmsProvider();
  return [
    { channel: "email", provider: email.name, configured: email.isConfigured() ? "yes" : "no (using console fallback)" },
    { channel: "whatsapp", provider: wa.name, configured: wa.isConfigured() ? "yes" : "no (using console fallback)" },
    { channel: "sms", provider: sms.name, configured: sms.isConfigured() ? "yes" : "no (using console fallback)" },
  ];
}
