# Task: Create Phase 6 Lifecycle Engine

## Task ID: lifecycle-engine-task

## Agent: Code Agent

## Summary

Created `/home/z/my-project/src/lib/drqbit/lifecycle-engine.ts` — the complete Dr. QBIT Phase 6: Enterprise Device Lifecycle, Auto Sync & Smart Management Engine.

### What was done:

1. **Studied existing patterns**: Analyzed `diagnostic-engine.ts`, `configuration-engine.ts`, `resource-engine.ts`, and `lifecycle-types.ts` to understand the codebase patterns for engine structure, step execution, error handling, and Prisma database access.

2. **Studied Prisma schema**: Reviewed all 20+ relevant models including DevicePassport, DriverInformation, FirmwareInformation, DeviceWarranty, DeviceConfiguration, ConfigurationEvent, LiveDiagnosticSession, DriverHistory, FirmwareHistory, QbitProduct, PurchaseRecord, CustomerAccount, FSMCustomerAsset, AuditLog, ActivityFeed, Notification, ProductResourceMapping, Resource, DeviceMetric, and the 6 new Phase 6 models (InstallationRecord, ServiceHistoryEntry, EngineerActivityLog, DeviceTimelineEvent, SmartNotification, DeviceLifecycleCounter).

3. **Implemented all 15 steps** with full database queries:
   - Step 1 (verifyRegistration): DevicePassport lookup → QbitProduct/CustomerAccount/PurchaseRecord/FSMCustomerAsset linking
   - Step 2 (syncDevice): Updates DevicePassport + DeviceLifecycleCounter + creates EngineerActivityLog + DeviceTimelineEvent + ActivityFeed
   - Step 3 (manageLifecycle): Builds complete lifecycle data → determines lifecycleStage using stageFromData()
   - Step 4 (getInstallationHistory): Queries InstallationRecord sorted by date
   - Step 5 (getServiceHistory): Unified view from ServiceHistoryEntry + DriverHistory + FirmwareHistory + ConfigurationEvent + LiveDiagnosticSession
   - Step 6 (checkWarranty): DeviceWarranty + real date math → warrantyColorFromDays() strict rules
   - Step 7 (syncResources): Uses fetchProductResources() from resource-engine → per-category ResourceAvailabilityStatus
   - Step 8 (checkFirmware): FirmwareInformation + FirmwareRelease → recommendation only, never auto-update
   - Step 9 (getAnalytics): DeviceLifecycleCounter + LiveDiagnosticSession → aggregate stats
   - Step 10 (getEngineerActivity): EngineerActivityLog + User cross-reference → audit trail
   - Step 11 (getDashboardEvents): ActivityFeed → DashboardEventType mapping
   - Step 12 (getSmartNotifications): 6 real conditions → SmartNotification with dedupKey deduplication
   - Step 13 (verifySecurity): 5 security checks (genuine device, authorized engineer, valid customer, API auth, audit logging)
   - Step 14 (getDeviceTimeline): DeviceTimelineEvent → chronological timeline, creates initial events from existing data if empty
   - Step 15 (getEnterpriseArchitecture): QbitProduct catalog → supported device types + extensibility info

4. **Verified lint**: ESLint passes clean for lifecycle-engine.ts with no errors or warnings.

### Key design decisions:

- Uses `import { db } from "@/lib/db"` consistent with all existing engines
- Each step has its own try/catch error handling — no silent failures
- Step tracking via LifecycleStepTracking (pending → running → completed/failed)
- LifecycleError objects with specific error codes per step
- Warranty colors calculated purely from real date math (no hardcoded values)
- Smart notifications use dedupKey to prevent duplicates
- Never shows customer data for unregistered devices
- Never auto-updates firmware — only recommendations
- Integration with existing resource-engine via fetchProductResources() for Step 7
