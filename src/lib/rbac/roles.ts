/**
 * RBAC — Role-Based Access Control for QBIT Hub.
 *
 * Seven roles are supported, each with a distinct set of permitted screens.
 * The permission map is the single source of truth: any new screen must be
 * added here, otherwise the AuthGuard will deny access by default.
 */

import type { ScreenId } from "@/lib/navigation/store";

/** The eight roles recognised by QBIT Hub V3. */
export type Role =
  | "super_administrator"
  | "administrator"
  | "installation_engineer"
  | "support_engineer"
  | "sales_executive"
  | "dealer"
  | "viewer"
  | "public_customer";

/** Human-readable label for each role, used in profile menus and audit logs. */
export const ROLE_LABELS: Record<Role, string> = {
  super_administrator: "Super Administrator",
  administrator: "Administrator",
  installation_engineer: "Installation Engineer",
  support_engineer: "Support Engineer",
  sales_executive: "Sales Executive",
  dealer: "Dealer",
  viewer: "Viewer",
  public_customer: "Public Customer",
};

/** Short description shown on the role picker / login helper. */
export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  super_administrator: "Enterprise control center — full system access including product ingestion, user management, and audit logs.",
  administrator: "Full access to every module, user, and system setting.",
  installation_engineer:
    "Installation workflows, drivers, products, knowledge base, and support.",
  support_engineer:
    "AI support center, knowledge base, troubleshooting, and support tickets.",
  sales_executive: "Product catalog and marketing pages (read-only).",
  dealer: "Products, drivers, manuals, and training videos.",
  viewer: "Read-only access across all non-administrative modules.",
  public_customer: "Public product pages only.",
};

/** Material Symbol icon used to represent each role in the UI. */
export const ROLE_ICONS: Record<Role, string> = {
  super_administrator: "verified_user",
  administrator: "admin_panel_settings",
  installation_engineer: "engineering",
  support_engineer: "support_agent",
  sales_executive: "storefront",
  dealer: "handshake",
  viewer: "visibility",
  public_customer: "public",
};

/**
 * V3 Portal Routing — maps each role to its dedicated portal URL.
 *
 * After login, users are auto-redirected to their role's portal.
 * No user may manually access another role's portal — server-side
 * guards enforce this on every portal route.
 */
export function portalRouteForRole(role: Role): string {
  switch (role) {
    case "super_administrator":
      return "/super-admin";
    case "administrator":
      return "/admin";
    case "installation_engineer":
      return "/engineer";
    case "support_engineer":
      return "/support-portal";
    case "sales_executive":
    case "dealer":
    case "viewer":
      return "/portal";
    case "public_customer":
      return "/customer";
  }
}

/**
 * Screen-level permission matrix.
 *
 * Each entry lists the roles that are allowed to view that screen.
 * An empty array means the screen is public (no auth required).
 */
export const SCREEN_PERMISSIONS: Record<ScreenId, Role[]> = {
  // Public
  login: [],
  "product-overview": [],

  // Admin-only (+ super_administrator)
  home: ["super_administrator", "administrator"],
  "admin-dashboard": ["super_administrator", "administrator"],
  "user-role-management": ["super_administrator", "administrator"],
  "product-management": ["super_administrator", "administrator"],
  "system-settings": ["super_administrator", "administrator"],
  "ai-purchase-center": ["super_administrator", "administrator"],

  // Installation engineer + admin
  "engineer-dashboard": ["administrator", "installation_engineer"],
  "installation-center": ["administrator", "installation_engineer", "dealer"],
  "customer-handover-report": ["administrator", "installation_engineer"],
  "t800-installation-guide": ["administrator", "installation_engineer", "dealer"],
  "field-engineer-workspace": ["administrator", "installation_engineer"],
  "job-details-inst-550-a": ["administrator", "installation_engineer"],
  "job-completion-handover": ["administrator", "installation_engineer"],

  // Products — engineer, dealer, sales, viewer (read), admin
  "product-library": [
    "administrator",
    "installation_engineer",
    "sales_executive",
    "dealer",
    "viewer",
  ],
  "product-details-t800": [
    "administrator",
    "installation_engineer",
    "sales_executive",
    "dealer",
    "viewer",
  ],

  // Drivers — engineer, dealer, admin
  "driver-download-center": [
    "administrator",
    "installation_engineer",
    "dealer",
    "viewer",
  ],

  // Knowledge base / support — all authenticated staff
  "ai-support-center": [
    "administrator",
    "installation_engineer",
    "support_engineer",
    "dealer",
    "viewer",
  ],
  "universal-search-command-center": [
    "administrator",
    "installation_engineer",
    "support_engineer",
    "dealer",
    "viewer",
  ],

  // Videos — engineer, dealer, admin, viewer
  "video-training-center": [
    "administrator",
    "installation_engineer",
    "dealer",
    "viewer",
  ],

  // Mobile search — all authenticated users
  "universal-search-mobile": [
    "administrator",
    "installation_engineer",
    "support_engineer",
    "sales_executive",
    "dealer",
    "viewer",
  ],

  // Public portal — no auth required
  "public-search": [],

  // Field Service Management (FSM) — installation & service team only.
  // NEVER accessible to sales_executive / dealer / viewer.
  "fsm-dashboard": ["administrator", "installation_engineer", "support_engineer"],
  "fsm-work-order-detail": ["administrator", "installation_engineer", "support_engineer"],
  "fsm-work-order-completion": ["administrator", "installation_engineer"],
  "fsm-customer-asset-history": ["administrator", "installation_engineer", "support_engineer"],

  // Public customer tracking — no auth required.
  "fsm-customer-tracking": [],

  // Customer Live Tracking Portal — public, no auth (uses secure token in URL)
  "customer-tracking-portal": [],

  // Engineer Mobile Portal (PWA) — installation engineers + admin
  "mobile-engineer": ["administrator", "installation_engineer", "support_engineer"],

  // Dr. QBIT Device Detection Engine — engineers + admin (no sales access)
  "dr-qbit-detection": ["administrator", "installation_engineer", "support_engineer"],

  // Dr. QBIT Device Passport & Driver Intelligence — engineers + admin
  "dr-qbit-passport": ["administrator", "installation_engineer", "support_engineer"],

  // Dr. QBIT Firmware Intelligence — engineers + admin (no sales access)
  "dr-qbit-firmware": ["administrator", "installation_engineer", "support_engineer"],

  // Dr. QBIT AI Diagnostics Engine — engineers + admin (no sales access)
  "dr-qbit-diagnostics": ["administrator", "installation_engineer", "support_engineer"],

  // Dr. QBIT Test Center — engineers + admin only (no sales access)
  "dr-qbit-test-center": ["administrator", "installation_engineer"],

  // Enterprise Fleet Manager — admin only (full fleet visibility)
  "fleet-manager": ["super_administrator", "administrator"],

  // Enterprise Analytics — admin only (full business intelligence)
  "analytics": ["super_administrator", "administrator"],

  // Notification Automation Engine — admin-only management screens.
  "notification-center": ["super_administrator", "administrator", "installation_engineer", "support_engineer"],
  "notification-template-manager": ["super_administrator", "administrator"],
  "notification-history": ["super_administrator", "administrator"],
  "notification-reminders": ["super_administrator", "administrator"],
};

/**
 * Returns the list of roles permitted to view a screen.
 * Screens not listed in the matrix default to admin-only.
 */
export function permittedRolesForScreen(screen: ScreenId): Role[] {
  return SCREEN_PERMISSIONS[screen] ?? ["administrator"];
}

/**
 * Returns true if a role may access a screen.
 * Public screens (empty role array) are always accessible.
 */
export function canAccessScreen(role: Role | undefined | null, screen: ScreenId): boolean {
  const allowed = permittedRolesForScreen(screen);
  if (allowed.length === 0) return true; // public
  if (!role) return false; // authenticated screen but no role
  return allowed.includes(role);
}

/**
 * Returns the home screen for a given role (post-login landing page).
 */
export function homeScreenForRole(role: Role): ScreenId {
  switch (role) {
    case "super_administrator":
      return "home";
    case "administrator":
      return "home";
    case "installation_engineer":
      return "mobile-engineer";
    case "support_engineer":
      return "ai-support-center";
    case "sales_executive":
      return "product-library";
    case "dealer":
      return "product-library";
    case "viewer":
      return "product-library";
    case "public_customer":
      return "product-overview";
  }
}

/**
 * Returns the sidebar navigation items a role is allowed to see.
 * Items whose target screen the role cannot access are filtered out.
 */
export function filterNavItemsByRole<T extends { screen?: ScreenId }>(
  items: T[],
  role: Role | undefined | null,
): T[] {
  if (!role) return [];
  return items.filter((item) => {
    if (!item.screen) return true; // non-navigating items always visible
    return canAccessScreen(role, item.screen);
  });
}
