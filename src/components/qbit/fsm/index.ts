/**
 * Barrel export for FSM components — keeps imports clean.
 */

export { JobCard, bucketWorkOrders } from "./JobCard";
export type { WorkOrderCardDTO } from "@/lib/fsm/types";
export { WorkOrderTimeline } from "./WorkOrderTimeline";
export { EngineerActions } from "./EngineerActions";
export { PhotoUploader } from "./PhotoUploader";
export { ReportGenerator } from "./ReportGenerator";
export { NotificationCenter } from "./NotificationCenter";
export { CustomerTracking } from "./CustomerTracking";
