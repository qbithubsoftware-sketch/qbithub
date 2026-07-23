/**
 * Dr. QBIT Phase 6 — Enterprise Device Lifecycle, Auto Sync & Smart Management Engine
 *
 * Strict TypeScript types for the Device Lifecycle pipeline.
 * These types are the contract between the API routes, the engine,
 * the adapters, and the UI components.
 *
 * Phase 6 receives a DiagnosticResult from Phase 5 plus a CloudLookupResult
 * from Phase 3, builds the complete device lifecycle profile, tracks
 * registration, sync, warranty intelligence, service history, firmware
 * intelligence, resource sync, analytics, engineer activity, dashboard
 * events, smart notifications, security verification, timeline, and
 * produces the enterprise lifecycle output.
 *
 * RULES:
 *   - NO fake/dummy/mock/simulated data anywhere.
 *   - All types must align with real database models and device events.
 *   - Warranty color coding is based on real date calculations.
 *   - Notifications are ONLY generated from real conditions.
 *   - Extensible for all QBIT hardware types.
 *   - Lifecycle stages follow real business process flows.
 *   - Service history entries come from real WorkOrder/Service records.
 *   - Timeline events are sourced from actual database records only.
 *   - Errors show EXACT reason — no generic error messages.
 *   - Security verification checks real auth/customer/engineer data.
 */

import type { DeviceConnection, DeviceType } from "./types";
import type { DiagnosticResult, DiagnosticOverallStatus } from "./diagnostic-types";
import type { CloudLookupResult } from "./cloud-lookup-types";
import type { ConfigurationResult } from "./configuration-types";

// ====================== Step 1 — Lifecycle Action ======================

/**
 * Lifecycle action — what triggers the lifecycle engine.
 *
 * "run_lifecycle" starts the full pipeline (Steps 1-15).
 * Individual actions allow querying or updating specific lifecycle data.
 * Each action maps to a specific engine step or sub-operation.
 */
export type LifecycleAction =
  | "run_lifecycle"            // Full pipeline: Steps 1-15
  | "verify_registration"      // Step 1: Verify device registration only
  | "sync_device"              // Step 2: Sync device state only
  | "get_lifecycle"            // Step 3: Get device lifecycle data only
  | "get_installation_history" // Step 4: Get installation history only
  | "get_service_history"      // Step 5: Get service history only
  | "check_warranty"           // Step 6: Check warranty intelligence only
  | "sync_resources"           // Step 7: Sync resource availability only
  | "check_firmware"           // Step 8: Check firmware intelligence only
  | "get_analytics"            // Step 9: Get device analytics only
  | "get_engineer_activity"    // Step 10: Get engineer activity only
  | "get_dashboard_events"     // Step 11: Get dashboard integration events only
  | "get_notifications"        // Step 12: Get smart notifications only
  | "verify_security"          // Step 13: Verify security only
  | "get_timeline"             // Step 14: Get device timeline only
  | "register_device"          // Register a new device into the lifecycle system
  | "update_lifecycle_stage";  // Update the current lifecycle stage of a device

// ====================== Step 1 — Lifecycle Request ======================

/**
 * Request body for the Phase 6 lifecycle engine.
 *
 * Contains the Phase 5 DiagnosticResult (primary input),
 * the Phase 3 CloudLookupResult (for customer/warranty/resource data),
 * plus passport/engineer identifiers and the desired action.
 *
 * The DiagnosticResult MUST be present for "run_lifecycle".
 * For individual actions, passportId is required for DB reference.
 */
export interface LifecycleRequest {
  /** The DiagnosticResult from Phase 5 — optional; engine can fetch from DB if passportId provided. */
  diagnosticResult?: DiagnosticResult | null;
  /** The CloudLookupResult from Phase 3 — optional; engine can fetch from DB if passportId provided. */
  cloudLookupResult?: CloudLookupResult | null;
  /** The ConfigurationResult from Phase 4 — for connection/config context. */
  configurationResult?: ConfigurationResult | null;
  /** Device Passport ID for DB reference. Required for most actions. */
  passportId: string;
  /** Engineer ID who initiated the lifecycle operation. */
  engineerId?: string | null;
  /** Engineer name for display and audit trail. */
  engineerName?: string | null;
  /** Engineer email (login ID) for audit trail. */
  engineerEmail?: string | null;
  /** Which lifecycle action to perform. */
  action: LifecycleAction;
  /** Custom parameters for specific actions (e.g. registration details). */
  parameters?: Record<string, unknown>;
}

// ====================== Step 1 — Registration Verification ======================

/**
 * Registration verification result — Step 1.
 *
 * Verifies whether the device is registered in the QBIT database.
 * If registered: returns customer, product, warranty, dealer, installation,
 * and assigned engineer info sourced from real DB records.
 * If not registered: returns an unregistered message — no fake data.
 *
 * All data comes from PurchaseRecord, FSMCustomerAsset, DevicePassport,
 * and related tables. Null means "the database has no value", NOT "unknown".
 */
export interface RegistrationVerificationResult {
  /** Whether the device is registered in the QBIT database. */
  registered: boolean;
  /** Customer information from the database. Null if not registered. */
  customer: {
    name: string | null;
    companyName: string | null;
    city: string | null;
    state: string | null;
    customerId: string | null;
  } | null;
  /** Product information from the database. Null if not registered. */
  product: {
    id: string | null;
    name: string | null;
    model: string | null;
    brand: string | null;
    deviceType: string | null;
  } | null;
  /** Warranty information from the database. Null if not registered or no dates. */
  warranty: {
    status: string | null;
    startDate: string | null;
    endDate: string | null;
    remainingDays: number | null;
  } | null;
  /** Dealer/distributor information. Null if not in the record. */
  dealer: {
    name: string | null;
    city: string | null;
  } | null;
  /** Installation information from WorkOrder/PurchaseRecord. Null if not recorded. */
  installation: {
    date: string | null;
    engineerId: string | null;
    engineerName: string | null;
    location: string | null;
  } | null;
  /** Engineer assigned to this device. Null if not assigned. */
  assignedEngineer: {
    engineerId: string | null;
    engineerName: string | null;
  } | null;
  /** Message for unregistered devices. Null if registered. */
  unregisteredMessage: string | null;
  /** Source of registration data. Null if not registered. */
  registrationSource: "purchase_record" | "fsm_asset" | "device_passport" | null;
}

// ====================== Step 2 — Device Sync ======================

/**
 * Device sync result — Step 2.
 *
 * Synchronizes the device's current state with the lifecycle engine.
 * All fields reflect the REAL device state at the time of sync.
 * No cached or simulated values — data is fetched fresh from the DB
 * and the device's last-known state.
 */
export interface DeviceSyncResult {
  /** When the device was last connected (ISO-8601). Null if never connected. */
  lastConnectedTime: string | null;
  /** When the device was last seen online (ISO-8601). Null if never seen. */
  lastSeen: string | null;
  /** Connection type used for the last known session. */
  connectionType: DeviceConnection | null;
  /** Firmware version reported during last sync. Null if not reported. */
  currentFirmware: string | null;
  /** Driver version installed. Null if no driver or version unknown. */
  driverVersion: string | null;
  /** Health status from the most recent diagnostic. Null if never diagnosed. */
  healthStatus: DiagnosticOverallStatus | null;
  /** Last engineer who interacted with this device. Null if no records. */
  lastEngineer: string | null;
  /** Summary of the last scan/diagnostic result. Null if never scanned. */
  lastScanResult: string | null;
  /** Whether the device is currently online. Based on real heartbeat data. */
  currentlyOnline: boolean;
}

// ====================== Step 3 — Device Lifecycle Data ======================

/**
 * Device lifecycle data — Step 3.
 *
 * Complete lifecycle timestamps for the device. Every date is sourced
 * from real database records (PurchaseRecord, WorkOrder, DevicePassport,
 * ConfigurationEvent, DiagnosticSession).
 * Null means "no record exists in the database", NOT "we invented a date".
 */
export interface DeviceLifecycleData {
  /** Manufacturing date from product master or warranty start. Null if not recorded. */
  manufacturingDate: string | null;
  /** Purchase date from PurchaseRecord. Null if not registered or no date. */
  purchaseDate: string | null;
  /** Dealer/distributor info from PurchaseRecord. Null if not in record. */
  dealerInfo: {
    name: string | null;
    city: string | null;
    state: string | null;
  } | null;
  /** Customer assignment from FSMCustomerAsset or PurchaseRecord. Null if unregistered. */
  customerAssignment: {
    customerId: string | null;
    customerName: string | null;
    companyName: string | null;
  } | null;
  /** Installation date from WorkOrder. Null if not installed. */
  installationDate: string | null;
  /** Warranty start date from DeviceWarranty/PurchaseRecord. Null if not recorded. */
  warrantyStart: string | null;
  /** Warranty end date (computed from start + period). Null if no start date. */
  warrantyEnd: string | null;
  /** Date of last service visit from WorkOrder. Null if no service history. */
  lastService: string | null;
  /** Date of last firmware update from FirmwareHistory. Null if never updated. */
  lastFirmwareUpdate: string | null;
  /** Date of last configuration change from ConfigurationEvent. Null if never configured. */
  lastConfiguration: string | null;
  /** Date of last diagnostic run from DiagnosticSession. Null if never diagnosed. */
  lastDiagnostic: string | null;
  /** Current lifecycle stage. Based on real business process state. */
  currentStage: LifecycleStage;
}

// ====================== Step 4 — Installation History ======================

/**
 * Installation history result — Step 4.
 *
 * Array of all installation records for this device, sourced from
 * WorkOrder and PurchaseRecord tables. Empty array means "no installation
 * records exist", NOT "we chose not to show them".
 */
export interface InstallationHistoryResult {
  /** All installation records for this device. Empty if none exist in DB. */
  installations: InstallationRecord[];
  /** Total number of installation records. */
  totalInstallations: number;
}

/**
 * A single installation record — sourced from WorkOrder/PurchaseRecord.
 *
 * Each entry represents a real installation event with verified data.
 * No fabricated or placeholder entries.
 */
export interface InstallationRecord {
  /** Installation sequence number (1-based). */
  installNumber: number;
  /** When the installation was performed (ISO-8601). */
  installationDate: string;
  /** Engineer who performed the installation. Null if not recorded. */
  engineerId: string | null;
  /** Engineer name. Null if not recorded. */
  engineerName: string | null;
  /** Customer location where device was installed. Null if not recorded. */
  customerLocation: string | null;
  /** Connection type used during initial installation. */
  connectionType: DeviceConnection | null;
  /** Firmware version at time of installation. Null if not recorded. */
  initialFirmware: string | null;
  /** Driver version at time of installation. Null if not recorded. */
  initialDriver: string | null;
  /** Installation status: completed, pending, failed. */
  status: "completed" | "pending" | "failed";
}

// ====================== Step 5 — Service History ======================

/**
 * Service history result — Step 5.
 *
 * Array of all service/maintenance records for this device.
 * Sourced from WorkOrder, ConfigurationEvent, FirmwareHistory, and
 * DriverHistory tables. Empty array means "no service records exist".
 */
export interface ServiceHistoryResult {
  /** All service history entries for this device. Empty if none exist. */
  entries: ServiceHistoryEntry[];
  /** Total number of service entries. */
  totalServiceEntries: number;
}

/**
 * Service activity types — matches real WorkOrder/ConfigurationEvent types.
 *
 * Each type corresponds to a specific service action that was performed
 * on the device, sourced from database records.
 */
export type ServiceActivityType =
  | "driver_install"
  | "driver_update"
  | "driver_remove"
  | "firmware_update"
  | "firmware_flash"
  | "configuration_change"
  | "connection_setup"
  | "paper_path_cleaning"
  | "cutter_maintenance"
  | "print_head_alignment"
  | "hardware_repair"
  | "component_replacement"
  | "diagnostic_run"
  | "warranty_renewal"
  | "device_registration"
  | "device_decommission";

/**
 * A single service history entry — sourced from real DB records.
 *
 * Each entry represents an actual service event. No mock entries.
 * previousValue and currentValue track what changed during the service.
 */
export interface ServiceHistoryEntry {
  /** Service sequence number (1-based). */
  serviceNumber: number;
  /** When the service was performed (ISO-8601). */
  serviceDate: string;
  /** Engineer who performed the service. Null if not recorded. */
  engineerId: string | null;
  /** Engineer name. Null if not recorded. */
  engineerName: string | null;
  /** Type of service activity performed. */
  activityType: ServiceActivityType;
  /** Value before the service action (e.g. old firmware version). Null if not applicable. */
  previousValue: string | null;
  /** Value after the service action (e.g. new firmware version). Null if not applicable. */
  currentValue: string | null;
  /** Result of the service action. */
  result: "success" | "failed" | "partial" | "pending";
  /** Status of this service entry. */
  status: "completed" | "in_progress" | "failed" | "cancelled";
}

// ====================== Step 6 — Warranty Intelligence ======================

/**
 * Warranty color — computed from real date calculations.
 *
 * Rules (NO exceptions, NO hardcoded values):
 *   - green:   300+ days remaining until warranty expiry
 *   - yellow:  100-299 days remaining
 *   - orange:  30-99 days remaining (expiring soon)
 *   - red:     0 or fewer days remaining (expired or expiring today)
 *
 * The color is NEVER assigned based on guesswork. It is ALWAYS
 * calculated from warrantyEndDate minus currentDate.
 */
export type WarrantyColor = "green" | "yellow" | "orange" | "red";

/**
 * Warranty intelligence result — Step 6.
 *
 * Provides detailed warranty analysis based on real date calculations.
 * Every field is computed from actual database dates.
 * "unknown" status means the database has no warranty dates for this device.
 */
export interface WarrantyIntelligenceResult {
  /** Warranty status — dynamically calculated from database dates. */
  warrantyStatus: "active" | "expired" | "expiring_soon" | "unknown";
  /** Warranty color — computed from remainingDays using strict rules. */
  warrantyColor: WarrantyColor;
  /** Days remaining until warranty expires. Negative = expired. Null = no dates. */
  remainingDays: number | null;
  /** Warranty expiry date (ISO-8601). Null if no dates in database. */
  expiryDate: string | null;
  /** Whether this device has an extended warranty. From real DB record. */
  extendedWarranty: boolean;
  /** Extended warranty expiry date. Null if no extension. */
  extendedExpiryDate: string | null;
  /** Warranty provider (e.g. "QBIT Technologies"). Null if not set. */
  provider: string | null;
  /** Warranty start date. Null if not recorded. */
  startDate: string | null;
  /** Human-readable recommendation based on warranty color. */
  recommendation: string | null;
}

// ====================== Step 7 — Resource Sync ======================

/**
 * Resource sync result — Step 7.
 *
 * Shows the current availability status of each resource type
 * (driver, firmware, manual, SDK, video, utility) for the device model.
 * Status comes from the real ProductResourceMapping + Resource tables.
 * "unavailable" means "no resource of this type exists in the database
 * for this product model" — NOT "we have it but won't show it".
 */
export interface ResourceSyncResult {
  /** Per-category resource availability status. */
  resourceStatus: {
    driver: ResourceAvailabilityStatus;
    firmware: ResourceAvailabilityStatus;
    manual: ResourceAvailabilityStatus;
    sdk: ResourceAvailabilityStatus;
    video: ResourceAvailabilityStatus;
    utility: ResourceAvailabilityStatus;
  };
}

/**
 * Availability status for a single resource category.
 *
 * Includes whether resources exist, how many, and which is the latest.
 */
export interface ResourceAvailabilityStatus {
  /** Whether at least one resource of this type exists for this model. */
  available: boolean;
  /** Number of resources available in this category. */
  count: number;
  /** Latest version available. Null if no resources or version not set. */
  latestVersion: string | null;
  /** Download URL for the latest resource. Null if not available. */
  downloadUrl: string | null;
  /** Whether the resource is compatible with the current device state. */
  compatible: boolean;
}

// ====================== Step 8 — Firmware Intelligence ======================

/**
 * Firmware intelligence result — Step 8.
 *
 * Compares the device's installed firmware against the latest available
 * firmware from the database. NEVER auto-starts firmware updates.
 * Only reports availability and provides a recommendation message.
 *
 * All data comes from real FirmwareRelease and DeviceFirmwareHistory records.
 */
export interface FirmwareIntelligenceResult {
  /** Firmware version currently installed on the device. Null if unknown. */
  installedFirmware: string | null;
  /** Latest firmware version available from the database. Null if none. */
  latestFirmware: string | null;
  /** Whether a firmware update is available for this device. */
  updateAvailable: boolean;
  /** Whether this is a critical/security update. */
  isCritical: boolean;
  /** Whether the update is a stable release (not beta). */
  isStable: boolean;
  /** Release date of the latest firmware. Null if unknown. */
  latestReleaseDate: string | null;
  /** Download URL for the firmware update. Null if not available. */
  downloadUrl: string | null;
  /** Recommendation message based on firmware comparison. Null if latest. */
  recommendation: string | null;
}

// ====================== Step 9 — Device Analytics ======================

/**
 * Device analytics result — Step 9.
 *
 * Aggregated statistics about the device's history, sourced from
 * DiagnosticSession, ConfigurationEvent, DriverHistory, FirmwareHistory,
 * and WorkOrder tables. All counts are real — no fake numbers.
 */
export interface DeviceAnalyticsResult {
  /** Total number of diagnostic scans performed on this device. */
  totalScans: number;
  /** Date of the most recent scan (ISO-8601). Null if never scanned. */
  lastScan: string | null;
  /** Number of successful diagnostic runs. */
  successfulDiagnostics: number;
  /** Number of failed diagnostic runs. */
  failedDiagnostics: number;
  /** Number of driver installations performed. */
  driverInstallCount: number;
  /** Number of firmware updates performed. */
  firmwareUpdateCount: number;
  /** Number of service visits recorded. */
  serviceCount: number;
  /** Average health score across all diagnostic runs. Null if never diagnosed. */
  averageHealthScore: number | null;
  /** Success rate percentage (0-100). Null if no diagnostics. */
  diagnosticSuccessRate: number | null;
}

// ====================== Step 10 — Engineer Activity ======================

/**
 * Engineer activity result — Step 10.
 *
 * Array of all engineer interactions with this device, sourced from
 * real audit trail records. Empty array means "no engineer activity
 * recorded for this device".
 */
export interface EngineerActivityResult {
  /** All engineer activity entries. Empty if none exist. */
  activities: EngineerActivityEntry[];
  /** Total number of activity entries. */
  totalActivities: number;
}

/**
 * A single engineer activity entry — sourced from real audit records.
 *
 * Each entry tracks what an engineer did, when, and the result.
 */
export interface EngineerActivityEntry {
  /** Engineer who performed the activity. Null if not recorded. */
  engineerId: string | null;
  /** Engineer display name. Null if not recorded. */
  engineerName: string | null;
  /** Login ID of the engineer. Null if not recorded. */
  loginId: string | null;
  /** When the activity occurred (ISO-8601). */
  time: string;
  /** Device identifier involved. */
  device: string | null;
  /** Customer associated with the activity. Null if not applicable. */
  customer: string | null;
  /** What the engineer did. */
  activity: string;
  /** Result of the activity. */
  result: "success" | "failed" | "partial" | "viewed" | "initiated";
}

// ====================== Step 11 — Dashboard Integration ======================

/**
 * Dashboard integration result — Step 11.
 *
 * Recent activities formatted for dashboard display. Each event
 * represents a real action that occurred on this device.
 * Empty array means "no recent activities recorded".
 */
export interface DashboardIntegrationResult {
  /** Recent activity events for dashboard display. */
  recentActivities: DashboardEvent[];
  /** Total number of recent events. */
  totalRecentEvents: number;
}

/**
 * Dashboard event types — matches real actions performed on devices.
 *
 * Each event type corresponds to a specific user/device action that
 * was recorded in the database.
 */
export type DashboardEventType =
  | "printer_scanned"
  | "driver_installed"
  | "firmware_update_recommended"
  | "diagnostic_completed"
  | "device_registered"
  | "service_completed";

/**
 * A single dashboard event — formatted for UI display.
 *
 * Sourced from real database records, formatted for the dashboard.
 */
export interface DashboardEvent {
  /** Type of event. */
  eventType: DashboardEventType;
  /** Human-readable description of the event. */
  description: string;
  /** When the event occurred (ISO-8601). */
  timestamp: string;
  /** Engineer who triggered the event. Null if system-initiated. */
  engineerName: string | null;
  /** Reference ID in the database. Null if not applicable. */
  referenceId: string | null;
}

// ====================== Step 12 — Smart Notifications ======================

/**
 * Smart notification result — Step 12.
 *
 * Notifications are ONLY generated from real conditions detected
 * in the device data. No fake or proactive notifications without
 * evidence. Each notification has a specific type, severity, and
 * actionable message.
 */
export interface SmartNotificationResult {
  /** Condition-driven notifications. Empty if no conditions detected. */
  notifications: SmartNotification[];
  /** Total number of active notifications. */
  totalNotifications: number;
}

/**
 * Notification types — all derived from real device conditions.
 *
 * Each type corresponds to a specific condition that was detected
 * from the device's lifecycle data, diagnostic results, or history.
 * Notifications are NEVER generated without evidence.
 */
export type NotificationType =
  | "warranty_expiring"
  | "warranty_expired"
  | "firmware_update_available"
  | "firmware_critical_update"
  | "device_not_registered"
  | "driver_missing"
  | "driver_outdated"
  | "driver_corrupted"
  | "repeated_communication_failure"
  | "frequent_offline"
  | "device_offline_extended"
  | "service_required"
  | "health_score_degraded"
  | "configuration_drift"
  | "security_alert";

/**
 * A single smart notification — condition-driven, not guesswork.
 *
 * Each notification is backed by real data:
 *   - warranty_expiring: remainingDays < threshold from real date calc
 *   - firmware_update_available: installedFirmware !== latestFirmware from real DB
 *   - device_not_registered: registration check returned false
 *   - driver_missing: diagnostic detected no driver
 *   - repeated_communication_failure: historical pattern detected
 *   - frequent_offline: offline pattern from heartbeat data
 */
export interface SmartNotification {
  /** Notification type — what condition triggered this. */
  type: NotificationType;
  /** Severity of this notification. */
  severity: "info" | "warning" | "error" | "critical";
  /** Human-readable notification title. */
  title: string;
  /** Detailed message explaining the condition. */
  message: string;
  /** Suggested action the engineer should take. */
  suggestedAction: string | null;
  /** Whether this notification is currently active (not dismissed). */
  active: boolean;
  /** When this condition was first detected (ISO-8601). */
  detectedAt: string;
  /** Evidence backing this notification (e.g. "Warranty expires in 45 days"). */
  evidence: string;
}

// ====================== Step 13 — Security Verification ======================

/**
 * Security verification result — Step 13.
 *
 * Verifies the integrity and authenticity of the device, engineer,
 * customer mapping, API auth, and audit logging. Every check is
 * based on real database and auth data — no simulated checks.
 */
export interface SecurityVerificationResult {
  /** Whether the device is genuine (serial number verified in DB). */
  genuineDevice: boolean;
  /** Whether the engineer is authorized (verified in Employee/User table). */
  authorizedEngineer: boolean;
  /** Whether the customer-to-device mapping is valid (verified in DB). */
  validCustomerMapping: boolean;
  /** Whether the API authentication is secure (valid session/token). */
  secureApiAuth: boolean;
  /** Whether audit logging is enabled for this operation. */
  auditLoggingEnabled: boolean;
  /** Overall security status. "verified" only if ALL checks pass. */
  overallSecurityStatus: "verified" | "partial" | "failed";
  /** Security violations detected. Empty if all checks pass. */
  violations: SecurityViolation[];
}

/**
 * A single security violation — records exactly what failed.
 *
 * No generic "security failed" messages. Each violation has a specific
 * reason explaining what check failed and why.
 */
export interface SecurityViolation {
  /** Which security check failed. */
  check: "device_authenticity" | "engineer_authorization" | "customer_mapping" | "api_auth" | "audit_logging";
  /** Why this check failed. */
  reason: string;
  /** Severity of this violation. */
  severity: "warning" | "error" | "critical";
}

// ====================== Step 14 — Device Timeline ======================

/**
 * Device timeline result — Step 14.
 *
 * Chronological sequence of real lifecycle events for the device.
 * Each event is sourced from actual database records (PurchaseRecord,
 * WorkOrder, DeviceWarranty, ConfigurationEvent, DiagnosticSession,
 * FirmwareHistory, DriverHistory).
 *
 * The timeline follows the natural device lifecycle:
 *   manufactured → purchased → registered → installed → configured →
 *   diagnosed → firmware updated → service visit → warranty renewal →
 *   current status
 *
 * Empty timeline means "no lifecycle events recorded for this device".
 */
export interface DeviceTimelineResult {
  /** Chronological lifecycle events. Empty if no history exists. */
  timeline: DeviceTimelineEvent[];
  /** Total number of timeline events. */
  totalEvents: number;
}

/**
 * Timeline event types — maps to real lifecycle milestones.
 *
 * Each type corresponds to a specific stage in the device lifecycle.
 * Events are ordered chronologically and sourced from real DB records.
 */
export type TimelineEventType =
  | "manufactured"
  | "purchased"
  | "registered"
  | "installed"
  | "configured"
  | "diagnosed"
  | "firmware_updated"
  | "driver_updated"
  | "service_visit"
  | "warranty_start"
  | "warranty_expiry"
  | "warranty_renewal"
  | "repair"
  | "decommissioned";

/**
 * A single timeline event — sourced from real database records.
 *
 * Each event represents an actual milestone in the device's lifecycle.
 * No fabricated or placeholder events.
 */
export interface DeviceTimelineEvent {
  /** Type of lifecycle event. */
  eventType: TimelineEventType;
  /** When the event occurred (ISO-8601). */
  date: string;
  /** Human-readable description of the event. */
  description: string;
  /** Actor who triggered this event (engineer name, system, customer). Null if unknown. */
  actor: string | null;
  /** Reference ID in the source database table. Null if not applicable. */
  referenceId: string | null;
  /** Additional details about this event. Null if not applicable. */
  details: Record<string, unknown> | null;
}

// ====================== Step 15 — Enterprise Architecture ======================

/**
 * Enterprise architecture info — Step 15.
 *
 * Documents which device types are supported, what profile entries
 * are required for lifecycle processing, and extensibility notes.
 * This is metadata for the engine's capabilities, not device data.
 */
export interface EnterpriseArchitectureInfo {
  /** All device types supported by the lifecycle engine. */
  supportedDeviceTypes: DeviceType[];
  /** Required profile entries for lifecycle processing to work. */
  requiredProfileEntries: string[];
  /** Note about how to extend the engine for new device types. */
  extensibilityNote: string;
}

// ====================== Lifecycle Stage & Status Types ======================

/**
 * Lifecycle stage — the current stage in the device's business lifecycle.
 *
 * Stages follow the real business process:
 *   - discovered:    Device detected but not yet registered
 *   - registered:    Device registered in QBIT database
 *   - installed:     Device physically installed at customer site
 *   - configured:    Device configured (drivers, network, settings)
 *   - operational:   Device is in normal daily operation
 *   - maintenance:   Device undergoing service/maintenance
 *   - decommissioned: Device removed from service permanently
 *
 * The stage is NEVER guessed — it's determined from real DB state.
 */
export type LifecycleStage =
  | "discovered"
  | "registered"
  | "installed"
  | "configured"
  | "operational"
  | "maintenance"
  | "decommissioned";

/**
 * Status of a single lifecycle pipeline step.
 *
 * Tracks step progress through the lifecycle engine pipeline.
 */
export type LifecycleStepStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "skipped";

// ====================== Error Handling ======================

/**
 * Lifecycle error code — machine-readable error identifiers.
 *
 * Each code maps to a specific failure scenario in the lifecycle engine.
 * No generic "error" codes — every code has a clear, specific meaning.
 */
export type LifecycleErrorCode =
  | "device_not_found"
  | "not_registered"
  | "sync_failed"
  | "db_error"
  | "unauthorized"
  | "invalid_customer"
  | "resource_sync_failed"
  | "firmware_check_failed"
  | "analytics_error"
  | "notification_failed"
  | "security_violation"
  | "timeline_error";

/**
 * Lifecycle error — records what went wrong during a specific step.
 *
 * No step silently fails — every error is recorded.
 * Errors are NEVER hidden from the user.
 */
export interface LifecycleError {
  /** Machine-readable error code. */
  code: LifecycleErrorCode;
  /** Human-readable error message (shown to the user). */
  message: string;
  /** Which lifecycle step failed. */
  step: LifecycleStep;
  /** Additional details about the error. */
  details: Record<string, unknown> | null;
  /** ISO-8601 timestamp of when the error occurred. */
  timestamp: string;
}

/**
 * Lifecycle step names — maps to the 15-step pipeline.
 */
export type LifecycleStep =
  | "verify_registration"
  | "sync_device"
  | "get_lifecycle_data"
  | "get_installation_history"
  | "get_service_history"
  | "check_warranty"
  | "sync_resources"
  | "check_firmware"
  | "get_analytics"
  | "get_engineer_activity"
  | "get_dashboard_events"
  | "get_notifications"
  | "verify_security"
  | "get_timeline"
  | "get_enterprise_architecture";

/**
 * A single pipeline step — tracks name, status, result, and error.
 */
export interface LifecycleStepTracking {
  /** Step name. */
  name: LifecycleStep;
  /** Current status of this step. */
  status: LifecycleStepStatus;
  /** Result data for this step. Null if step not completed or failed. */
  result: unknown;
  /** Error if this step failed. Null if step succeeded or was skipped. */
  error: LifecycleError | null;
}

// ====================== Final Output — Lifecycle Result ======================

/**
 * Lifecycle Result — the complete output of the Phase 6 engine.
 *
 * This is the FINAL output combining all 15 steps into the specified
 * deviceLifecycle format. All data comes from real database records
 * and real device events — no fakes, no mocks.
 *
 * If a step fails:
 *   - The corresponding field will be null
 *   - The errors array will contain the failure details
 *   - NO cached/fake/simulated data fills in for the failed step
 *
 * If a step succeeds:
 *   - The corresponding field contains real, verified data
 *   - Notifications are only present if real conditions triggered them
 *   - Timeline events are only present if real DB records exist
 */
export interface LifecycleResult {
  /** Device lifecycle profile — the main output structure. */
  deviceLifecycle: {
    /** Whether the device is registered in the QBIT database. */
    registered: boolean;
    /** Customer information. Null if not registered. */
    customer: RegistrationVerificationResult["customer"];
    /** Installation information. Null if not installed. */
    installation: RegistrationVerificationResult["installation"];
    /** Warranty intelligence with real color coding. Null if no warranty dates. */
    warranty: WarrantyIntelligenceResult | null;
    /** Service history entries. Empty array if no service records. */
    serviceHistory: ServiceHistoryEntry[];
    /** Resource availability status per category. */
    resourceStatus: ResourceSyncResult["resourceStatus"];
    /** Firmware intelligence comparison. Null if no firmware data. */
    firmwareStatus: FirmwareIntelligenceResult | null;
    /** Device analytics statistics. */
    analytics: DeviceAnalyticsResult;
    /** Chronological lifecycle timeline. Empty if no history. */
    timeline: DeviceTimelineEvent[];
    /** Condition-driven smart notifications. Empty if no conditions. */
    notifications: SmartNotification[];
  };
  /** Step 1: Registration verification result. */
  registrationVerification: RegistrationVerificationResult | null;
  /** Step 2: Device sync result. */
  deviceSync: DeviceSyncResult | null;
  /** Step 3: Device lifecycle data. */
  lifecycleData: DeviceLifecycleData | null;
  /** Step 4: Installation history. */
  installationHistory: InstallationHistoryResult | null;
  /** Step 5: Service history. */
  serviceHistory: ServiceHistoryResult | null;
  /** Step 6: Warranty intelligence. */
  warrantyIntelligence: WarrantyIntelligenceResult | null;
  /** Step 7: Resource sync. */
  resourceSync: ResourceSyncResult | null;
  /** Step 8: Firmware intelligence. */
  firmwareIntelligence: FirmwareIntelligenceResult | null;
  /** Step 9: Device analytics. */
  analytics: DeviceAnalyticsResult | null;
  /** Step 10: Engineer activity. */
  engineerActivity: EngineerActivityResult | null;
  /** Step 11: Dashboard integration. */
  dashboardIntegration: DashboardIntegrationResult | null;
  /** Step 12: Smart notifications. */
  smartNotifications: SmartNotificationResult | null;
  /** Step 13: Security verification. */
  securityVerification: SecurityVerificationResult | null;
  /** Step 14: Device timeline. */
  deviceTimeline: DeviceTimelineResult | null;
  /** Step 15: Enterprise architecture info. */
  enterpriseArchitecture: EnterpriseArchitectureInfo | null;
  /** Pipeline step tracking — which steps completed, failed, or were skipped. */
  steps: LifecycleStepTracking[];
  /** Errors encountered during lifecycle processing. Empty if all steps succeeded. */
  errors: LifecycleError[];
  /** Current lifecycle stage of the device. */
  currentStage: LifecycleStage;
  /** ISO-8601 timestamp of when this result was generated. */
  lifecycleTimestamp: string;
  /** Duration of the entire lifecycle processing in milliseconds. */
  lifecycleDurationMs: number;
}

// ====================== API Response ======================

/**
 * API response wrapper for the Phase 6 lifecycle engine.
 *
 * Wraps the LifecycleResult with success status, errors, and metadata.
 * Used by the POST /api/dr-qbit/lifecycle route.
 */
export interface LifecycleResponse {
  /** Whether the overall lifecycle processing succeeded (at least partially). */
  success: boolean;
  /** The complete lifecycle result data. Null if processing completely failed. */
  data: LifecycleResult | null;
  /** Errors encountered. Empty if all steps succeeded. */
  errors: LifecycleError[];
  /** Metadata about the processing run. */
  metadata: {
    /** ISO-8601 timestamp. */
    timestamp: string;
    /** Processing duration in ms. */
    durationMs: number;
    /** Action that was requested. */
    action: LifecycleAction;
    /** Engineer who initiated. */
    engineerId: string | null;
    /** Passport ID reference. */
    passportId: string | null;
    /** Number of steps completed successfully. */
    completedSteps: number;
    /** Number of steps that failed. */
    failedSteps: number;
    /** Number of steps that were skipped. */
    skippedSteps: number;
  };
  /** Human-readable message for the user. */
  message: string;
}

// ====================== Utility Functions ======================

/**
 * Computes warranty color from remaining days — strict rule-based.
 *
 * Rules (NO exceptions):
 *   - green:   300+ days remaining
 *   - yellow:  100-299 days remaining
 *   - orange:  30-99 days remaining (expiring soon)
 *   - red:     0 or fewer days remaining (expired)
 *
 * If remainingDays is null (no warranty dates), returns "red" as
 * a conservative default — unknown warranty = treat as expired.
 */
export function warrantyColorFromDays(remainingDays: number | null): WarrantyColor {
  if (remainingDays === null) return "red";
  if (remainingDays >= 300) return "green";
  if (remainingDays >= 100) return "yellow";
  if (remainingDays >= 30) return "orange";
  return "red";
}

/**
 * Computes lifecycle stage from available data.
 *
 * Rules:
 *   - discovered:    No registration record exists
 *   - registered:    Registration exists but no installation record
 *   - installed:     Installation record exists but no configuration event
 *   - configured:    Configuration event exists but device not yet operational
 *   - operational:   Device is online and has successful diagnostics
 *   - maintenance:   Device has an active WorkOrder (service in progress)
 *   - decommissioned: Device marked as decommissioned in DB
 *
 * The stage is NEVER guessed — it's derived from real DB state.
 */
export function stageFromData(data: {
  registered: boolean;
  installed: boolean;
  configured: boolean;
  operational: boolean;
  inMaintenance: boolean;
  decommissioned: boolean;
}): LifecycleStage {
  if (data.decommissioned) return "decommissioned";
  if (data.inMaintenance) return "maintenance";
  if (data.operational) return "operational";
  if (data.configured) return "configured";
  if (data.installed) return "installed";
  if (data.registered) return "registered";
  return "discovered";
}

// ====================== Label & Icon Maps ======================

/** Human-readable label per lifecycle stage. */
export const LIFECYCLE_STAGE_LABELS: Record<LifecycleStage, string> = {
  discovered: "Discovered",
  registered: "Registered",
  installed: "Installed",
  configured: "Configured",
  operational: "Operational",
  maintenance: "Under Maintenance",
  decommissioned: "Decommissioned",
};

/** Material Symbol icon per lifecycle stage. */
export const LIFECYCLE_STAGE_ICONS: Record<LifecycleStage, string> = {
  discovered: "search",
  registered: "how_to_reg",
  installed: "build",
  configured: "settings",
  operational: "check_circle",
  maintenance: "handyman",
  decommissioned: "delete",
};

/** Badge variant per lifecycle stage. */
export const LIFECYCLE_STAGE_VARIANTS: Record<
  LifecycleStage,
  "neutral" | "info" | "success" | "warning" | "error"
> = {
  discovered: "neutral",
  registered: "info",
  installed: "info",
  configured: "success",
  operational: "success",
  maintenance: "warning",
  decommissioned: "error",
};

/** Human-readable label per warranty color. */
export const WARRANTY_COLOR_LABELS: Record<WarrantyColor, string> = {
  green: "Warranty Active — 300+ Days Remaining",
  yellow: "Warranty Active — Under 300 Days",
  orange: "Warranty Expiring Soon — Under 100 Days",
  red: "Warranty Expired or Unknown",
};

/** Material Symbol icon per warranty color. */
export const WARRANTY_COLOR_ICONS: Record<WarrantyColor, string> = {
  green: "verified",
  yellow: "info",
  orange: "warning",
  red: "error",
};

/** Badge variant per warranty color. */
export const WARRANTY_COLOR_VARIANTS: Record<
  WarrantyColor,
  "success" | "info" | "warning" | "error"
> = {
  green: "success",
  yellow: "info",
  orange: "warning",
  red: "error",
};

/** Human-readable label per service activity type. */
export const SERVICE_ACTIVITY_LABELS: Record<ServiceActivityType, string> = {
  driver_install: "Driver Installed",
  driver_update: "Driver Updated",
  driver_remove: "Driver Removed",
  firmware_update: "Firmware Updated",
  firmware_flash: "Firmware Flashed",
  configuration_change: "Configuration Changed",
  connection_setup: "Connection Setup",
  paper_path_cleaning: "Paper Path Cleaned",
  cutter_maintenance: "Cutter Maintenance",
  print_head_alignment: "Print Head Aligned",
  hardware_repair: "Hardware Repair",
  component_replacement: "Component Replaced",
  diagnostic_run: "Diagnostic Run",
  warranty_renewal: "Warranty Renewed",
  device_registration: "Device Registered",
  device_decommission: "Device Decommissioned",
};

/** Material Symbol icon per service activity type. */
export const SERVICE_ACTIVITY_ICONS: Record<ServiceActivityType, string> = {
  driver_install: "settings_input_component",
  driver_update: "system_update",
  driver_remove: "delete",
  firmware_update: "upgrade",
  firmware_flash: "flash_on",
  configuration_change: "tune",
  connection_setup: "cable",
  paper_path_cleaning: "cleaning_services",
  cutter_maintenance: "cut",
  print_head_alignment: "align_horizontal_center",
  hardware_repair: "handyman",
  component_replacement: "build_circle",
  diagnostic_run: "medical_services",
  warranty_renewal: "verified_user",
  device_registration: "how_to_reg",
  device_decommission: "no_sim",
};

/** Human-readable label per timeline event type. */
export const TIMELINE_EVENT_LABELS: Record<TimelineEventType, string> = {
  manufactured: "Manufactured",
  purchased: "Purchased",
  registered: "Registered",
  installed: "Installed",
  configured: "Configured",
  diagnosed: "Diagnosed",
  firmware_updated: "Firmware Updated",
  driver_updated: "Driver Updated",
  service_visit: "Service Visit",
  warranty_start: "Warranty Started",
  warranty_expiry: "Warranty Expired",
  warranty_renewal: "Warranty Renewed",
  repair: "Repair",
  decommissioned: "Decommissioned",
};

/** Material Symbol icon per timeline event type. */
export const TIMELINE_EVENT_ICONS: Record<TimelineEventType, string> = {
  manufactured: "factory",
  purchased: "shopping_cart",
  registered: "how_to_reg",
  installed: "build",
  configured: "settings",
  diagnosed: "medical_services",
  firmware_updated: "upgrade",
  driver_updated: "system_update",
  service_visit: "support_agent",
  warranty_start: "verified",
  warranty_expiry: "schedule",
  warranty_renewal: "verified_user",
  repair: "handyman",
  decommissioned: "delete",
};

/** Human-readable label per notification type. */
export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  warranty_expiring: "Warranty Expiring Soon",
  warranty_expired: "Warranty Expired",
  firmware_update_available: "Firmware Update Available",
  firmware_critical_update: "Critical Firmware Update",
  device_not_registered: "Device Not Registered",
  driver_missing: "Driver Missing",
  driver_outdated: "Driver Outdated",
  driver_corrupted: "Driver Corrupted",
  repeated_communication_failure: "Repeated Communication Failures",
  frequent_offline: "Device Frequently Offline",
  device_offline_extended: "Device Offline for Extended Period",
  service_required: "Service Required",
  health_score_degraded: "Health Score Degraded",
  configuration_drift: "Configuration Drift Detected",
  security_alert: "Security Alert",
};

/** Material Symbol icon per notification type. */
export const NOTIFICATION_TYPE_ICONS: Record<NotificationType, string> = {
  warranty_expiring: "schedule",
  warranty_expired: "error",
  firmware_update_available: "system_update",
  firmware_critical_update: "priority_high",
  device_not_registered: "how_to_reg",
  driver_missing: "settings_input_component",
  driver_outdated: "update",
  driver_corrupted: "bug_report",
  repeated_communication_failure: "signal_wifi_off",
  frequent_offline: "cloud_off",
  device_offline_extended: "power_off",
  service_required: "build",
  health_score_degraded: "trending_down",
  configuration_drift: "sync_problem",
  security_alert: "shield",
};

/** Notification severity badge variant. */
export const NOTIFICATION_SEVERITY_VARIANTS: Record<
  "info" | "warning" | "error" | "critical",
  "info" | "warning" | "error" | "critical"
> = {
  info: "info",
  warning: "warning",
  error: "error",
  critical: "critical",
};

/** Human-readable label per dashboard event type. */
export const DASHBOARD_EVENT_LABELS: Record<DashboardEventType, string> = {
  printer_scanned: "Printer Scanned",
  driver_installed: "Driver Installed",
  firmware_update_recommended: "Firmware Update Recommended",
  diagnostic_completed: "Diagnostic Completed",
  device_registered: "Device Registered",
  service_completed: "Service Completed",
};

/** Material Symbol icon per dashboard event type. */
export const DASHBOARD_EVENT_ICONS: Record<DashboardEventType, string> = {
  printer_scanned: "search",
  driver_installed: "settings_input_component",
  firmware_update_recommended: "system_update",
  diagnostic_completed: "medical_services",
  device_registered: "how_to_reg",
  service_completed: "task_alt",
};

/** Human-readable label per lifecycle step status. */
export const LIFECYCLE_STEP_STATUS_LABELS: Record<LifecycleStepStatus, string> = {
  pending: "Pending",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
  skipped: "Skipped",
};

/** Badge variant per lifecycle step status. */
export const LIFECYCLE_STEP_STATUS_VARIANTS: Record<
  LifecycleStepStatus,
  "neutral" | "info" | "success" | "error" | "warning"
> = {
  pending: "neutral",
  running: "info",
  completed: "success",
  failed: "error",
  skipped: "warning",
};

/** Human-readable label per lifecycle error code. */
export const LIFECYCLE_ERROR_LABELS: Record<LifecycleErrorCode, string> = {
  device_not_found: "Device Not Found in Database",
  not_registered: "Device Not Registered in QBIT System",
  sync_failed: "Device Sync Failed — Cannot Retrieve Current State",
  db_error: "Database Error — Cannot Read/Write Lifecycle Data",
  unauthorized: "Unauthorized — Engineer Not Authorized for This Operation",
  invalid_customer: "Invalid Customer Mapping — Customer-Device Link Broken",
  resource_sync_failed: "Resource Sync Failed — Cannot Verify Resource Availability",
  firmware_check_failed: "Firmware Check Failed — Cannot Compare Versions",
  analytics_error: "Analytics Error — Cannot Aggregate Device Statistics",
  notification_failed: "Notification Generation Failed — Cannot Detect Conditions",
  security_violation: "Security Violation — Device/Engineer/Auth Check Failed",
  timeline_error: "Timeline Error — Cannot Build Chronological Events",
};

/** Human-readable label per lifecycle step. */
export const LIFECYCLE_STEP_LABELS: Record<LifecycleStep, string> = {
  verify_registration: "Verify Registration",
  sync_device: "Sync Device State",
  get_lifecycle_data: "Get Lifecycle Data",
  get_installation_history: "Get Installation History",
  get_service_history: "Get Service History",
  check_warranty: "Check Warranty Intelligence",
  sync_resources: "Sync Resource Availability",
  check_firmware: "Check Firmware Intelligence",
  get_analytics: "Get Device Analytics",
  get_engineer_activity: "Get Engineer Activity",
  get_dashboard_events: "Get Dashboard Events",
  get_notifications: "Get Smart Notifications",
  verify_security: "Verify Security",
  get_timeline: "Get Device Timeline",
  get_enterprise_architecture: "Get Enterprise Architecture",
};
