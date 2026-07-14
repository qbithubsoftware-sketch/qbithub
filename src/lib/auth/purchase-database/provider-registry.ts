/**
 * Purchase Database provider registry — factory that returns the active
 * provider based on the `PURCHASE_DB_PROVIDER` env var.
 *
 * Currently only the placeholder provider is registered. When the real
 * ERP/CRM integration is built, add it here:
 *
 *   registry.register("erp", () => new ErpPurchaseProvider());
 *   registry.register("crm", () => new CrmPurchaseProvider());
 *
 * Then set `PURCHASE_DB_PROVIDER=erp` in production env vars to switch.
 */

import type { PurchaseDatabaseProvider } from "./PurchaseDatabaseProvider";
import { PlaceholderPurchaseProvider } from "./PlaceholderProvider";

type ProviderFactory = () => PurchaseDatabaseProvider;

class ProviderRegistry {
  private factories = new Map<string, ProviderFactory>();
  private cached: PurchaseDatabaseProvider | null = null;

  /** Register a provider factory by name. */
  register(name: string, factory: ProviderFactory): void {
    this.factories.set(name, factory);
    // Invalidate cache so the next get() picks up the new provider.
    this.cached = null;
  }

  /** Get the active provider (singleton — same instance returned on every call). */
  get(): PurchaseDatabaseProvider {
    if (this.cached) return this.cached;

    const name = process.env.PURCHASE_DB_PROVIDER ?? "placeholder";
    const factory = this.factories.get(name);
    if (!factory) {
      // Unknown provider name — fall back to placeholder so the app never crashes.
      console.warn(
        `[purchase-database] Unknown provider "${name}" — falling back to placeholder. ` +
          `Set PURCHASE_DB_PROVIDER to a registered provider name.`,
      );
      this.cached = new PlaceholderPurchaseProvider();
      return this.cached;
    }

    this.cached = factory();
    return this.cached;
  }

  /** Get the active provider's name (for logging / health checks). */
  getActiveProviderName(): string {
    return process.env.PURCHASE_DB_PROVIDER ?? "placeholder";
  }
}

/** Singleton registry instance. */
export const purchaseDbRegistry = new ProviderRegistry();

// Always register the placeholder as the default.
purchaseDbRegistry.register("placeholder", () => new PlaceholderPurchaseProvider());

// Future ERP/CRM providers will be registered here:
// purchaseDbRegistry.register("erp", () => new ErpPurchaseProvider());
// purchaseDbRegistry.register("crm", () => new CrmPurchaseProvider());
