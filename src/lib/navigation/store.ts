/**
 * In-app navigation store for QBIT Hub.
 *
 * The environment only exposes the `/` route, so we use a Zustand store
 * to switch between the 21 design screens client-side.  Every screen has
 * a stable string id so deep-linking / state restoration is trivial.
 */

import { create } from "zustand";

export type ScreenId =
  // Auth & marketing
  | "login"
  | "home"
  | "product-overview"
  // Engineer portal
  | "engineer-dashboard"
  | "product-library"
  | "product-details-t800"
  | "driver-download-center"
  | "installation-center"
  | "customer-handover-report"
  | "video-training-center"
  | "t800-installation-guide"
  // Field engineer
  | "field-engineer-workspace"
  | "job-details-inst-550-a"
  | "job-completion-handover"
  // Admin
  | "admin-dashboard"
  | "user-role-management"
  | "product-master"
  | "product-master-create"
  | "upload-master"
  | "upload-driver"
  | "upload-manual"
  | "upload-firmware"
  | "upload-sdk"
  | "upload-brochure"
  | "upload-datasheet"
  | "upload-warranty"
  | "upload-video"
  | "upload-guide"
  | "upload-certificate"
  | "upload-resource-center"
  | "product-resource-manager"
  | "product-master-edit"
  | "resource-library"
  | "system-settings"
  | "ai-purchase-center"
  | "device-register"
  // Search
  | "universal-search-command-center"
  | "universal-search-mobile"
  // Public portal
  | "public-search"
  // Field Service Management (FSM) — Version 2
  | "fsm-dashboard"
  | "fsm-work-order-detail"
  | "fsm-work-order-completion"
  | "fsm-customer-asset-history"
  | "fsm-customer-tracking"
  // Customer Live Tracking Portal — Version 2
  | "customer-tracking-portal"
  // Engineer Mobile Portal (PWA) — Version 2
  | "mobile-engineer"
  // Dr. QBIT Device Detection Engine — Version 2
  | "dr-qbit-detection"
  // Dr. QBIT Device Passport & Driver Intelligence — Version 2
  | "dr-qbit-passport"
  // Dr. QBIT Firmware Intelligence — Version 2
  | "dr-qbit-firmware"
  // Dr. QBIT AI Diagnostics Engine — Version 2
  | "dr-qbit-diagnostics"
  // Dr. QBIT Test Center — Version 2
  | "dr-qbit-test-center"
  // Enterprise Fleet Manager — Version 2
  | "fleet-manager"
  // Enterprise Analytics — Version 2
  | "analytics"
  // Notification Automation Engine — Version 2
  | "notification-center"
  | "notification-template-manager"
  | "notification-history"
  | "notification-reminders"
  // AI Diagnostic Center
  | "ai-diagnostic-center"
  // Engineering Module — Super Admin
  | "engineering-dashboard"
  | "engineering-installations"
  | "engineering-assign"
  // Engineer Portal — Simplified Desktop (V3)
  | "engineer-portal"
  | "engineer-jobs"
  | "engineer-knowledge"
  | "engineer-downloads"
  | "engineer-troubleshooting"
  // Support Module — Built into Engineer Portal
  | "support-tickets"
  | "support-customer"
  | "support-kb"
  | "support-resources"
  | "support-communication"
  | "support-remote"
  | "support-escalation"
  | "support-analytics";

interface NavigationState {
  current: ScreenId;
  /** Optional context payload (e.g. job id) for screens that need an argument. */
  params: Record<string, string>;
  navigate: (screen: ScreenId, params?: Record<string, string>) => void;
  /** Convenience helper that updates a single param without changing screen. */
  setParam: (key: string, value: string) => void;
}

export const useNavigation = create<NavigationState>((set) => ({
  current: "login",
  params: {},
  navigate: (screen, params = {}) =>
    set({ current: screen, params }),
  setParam: (key, value) =>
    set((state) => ({ params: { ...state.params, [key]: value } })),
}));

/** Helper for non-React modules. */
export function navigateTo(screen: ScreenId, params?: Record<string, string>) {
  useNavigation.getState().navigate(screen, params);
}
