/**
 * Desktop Agent authentication.
 *
 * The Desktop Agent (Windows .exe / Electron app) communicates with QBIT Hub
 * via a shared secret. The secret is set via DESKTOP_AGENT_SECRET env var
 * and must be configured in both the agent and the server.
 *
 * Every request from the agent includes the secret in the request body
 * (agentSecret field) or as a Bearer token in the Authorization header.
 *
 * The browser NEVER directly accesses hardware — all hardware data comes
 * through this authenticated agent channel.
 */

/** Returns true if the provided secret matches the configured DESKTOP_AGENT_SECRET. */
export function validateAgentSecret(secret: string | undefined | null): boolean {
  if (!secret) return false;
  const configured = process.env.DESKTOP_AGENT_SECRET;
  if (!configured) {
    // In development, allow a default secret for testing
    if (process.env.NODE_ENV !== "production") {
      return secret === "dev-agent-secret";
    }
    return false;
  }
  // Constant-time comparison to prevent timing attacks
  if (secret.length !== configured.length) return false;
  let diff = 0;
  for (let i = 0; i < secret.length; i++) {
    diff |= secret.charCodeAt(i) ^ configured.charCodeAt(i);
  }
  return diff === 0;
}

/** Extracts the agent secret from either the request body or Authorization header. */
export function extractAgentSecret(authHeader: string | null, bodySecret?: string): string | null {
  if (bodySecret) return bodySecret;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
}

/** Returns true if the DESKTOP_AGENT_SECRET is configured. */
export function isAgentSecretConfigured(): boolean {
  return !!process.env.DESKTOP_AGENT_SECRET || process.env.NODE_ENV !== "production";
}
