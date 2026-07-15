"use client";

import { useNavigation } from "@/lib/navigation/store";
import { AuthGuard } from "@/components/qbit/auth/AuthGuard";
import { LoginPage } from "@/components/qbit/pages/LoginPage";
import { HomePage } from "@/components/qbit/pages/HomePage";
import { EngineerDashboardPage } from "@/components/qbit/pages/EngineerDashboardPage";
import { ProductLibraryPage } from "@/components/qbit/pages/ProductLibraryPage";
import { ProductDetailsT800Page } from "@/components/qbit/pages/ProductDetailsT800Page";
import { DriverDownloadCenterPage } from "@/components/qbit/pages/DriverDownloadCenterPage";
import { InstallationCenterPage } from "@/components/qbit/pages/InstallationCenterPage";
import { CustomerHandoverReportPage } from "@/components/qbit/pages/CustomerHandoverReportPage";
import { VideoTrainingCenterPage } from "@/components/qbit/pages/VideoTrainingCenterPage";
import { T800InstallationGuidePage } from "@/components/qbit/pages/T800InstallationGuidePage";
import { AISupportCenterPage } from "@/components/qbit/pages/AISupportCenterPage";
import { JobDetailsInst550APage } from "@/components/qbit/pages/JobDetailsInst550APage";
import { FieldEngineerWorkspacePage } from "@/components/qbit/pages/FieldEngineerWorkspacePage";
import { JobCompletionHandoverPage } from "@/components/qbit/pages/JobCompletionHandoverPage";
import { AdminDashboardPage } from "@/components/qbit/pages/AdminDashboardPage";
import { UserRoleManagementPage } from "@/components/qbit/pages/UserRoleManagementPage";
import { ProductMasterPage } from "@/components/qbit/pages/ProductMasterPage";
import { ProductMasterCreatePage } from "@/components/qbit/pages/ProductMasterCreatePage";
import { UploadMasterPage } from "@/components/qbit/pages/UploadMasterPage";
import { AIPurchaseImportCenterPage } from "@/components/qbit/pages/AIPurchaseImportCenterPage";
import { SystemSettingsPage } from "@/components/qbit/pages/SystemSettingsPage";
import { UniversalSearchCommandCenterPage } from "@/components/qbit/pages/UniversalSearchCommandCenterPage";
import { UniversalSearchMobilePage } from "@/components/qbit/pages/UniversalSearchMobilePage";
import { QbitT800ProductOverviewPage } from "@/components/qbit/pages/QbitT800ProductOverviewPage";
import { PublicSearchPage } from "@/components/qbit/pages/PublicSearchPage";
import { FSMDashboardPage } from "@/components/qbit/pages/FSMDashboardPage";
import { FSMWorkOrderDetailPage } from "@/components/qbit/pages/FSMWorkOrderDetailPage";
import { FSMWorkOrderCompletionPage } from "@/components/qbit/pages/FSMWorkOrderCompletionPage";
import { FSMCustomerAssetHistoryPage } from "@/components/qbit/pages/FSMCustomerAssetHistoryPage";
import { FSMCustomerTrackingPage } from "@/components/qbit/pages/FSMCustomerTrackingPage";
import { CustomerTrackingPortalPage } from "@/components/qbit/pages/CustomerTrackingPortalPage";
import { MobileEngineerPage } from "@/components/qbit/pages/MobileEngineerPage";
import { DrQbitDeviceDetectionPage } from "@/components/qbit/pages/DrQbitDeviceDetectionPage";
import { DrQbitDevicePassportPage } from "@/components/qbit/pages/DrQbitDevicePassportPage";
import { DrQbitFirmwareIntelligencePage } from "@/components/qbit/pages/DrQbitFirmwareIntelligencePage";
import { DrQbitDiagnosticsPage } from "@/components/qbit/pages/DrQbitDiagnosticsPage";
import { DrQbitTestCenterPage } from "@/components/qbit/pages/DrQbitTestCenterPage";
import { FleetManagerPage } from "@/components/qbit/pages/FleetManagerPage";
import { AnalyticsPage } from "@/components/qbit/pages/AnalyticsPage";
import { NotificationCenterPage } from "@/components/qbit/pages/NotificationCenterPage";
import { NotificationTemplateManagerPage } from "@/components/qbit/pages/NotificationTemplateManagerPage";
import { NotificationHistoryPage } from "@/components/qbit/pages/NotificationHistoryPage";
import { NotificationRemindersPage } from "@/components/qbit/pages/NotificationRemindersPage";

export default function Home() {
  const current = useNavigation((s) => s.current);

  const screen = (() => {
    switch (current) {
      case "login":
        return <LoginPage />;
      case "home":
        return <HomePage />;
      case "engineer-dashboard":
        return <EngineerDashboardPage />;
      case "product-library":
        return <ProductLibraryPage />;
      case "product-details-t800":
        return <ProductDetailsT800Page />;
      case "driver-download-center":
        return <DriverDownloadCenterPage />;
      case "installation-center":
        return <InstallationCenterPage />;
      case "customer-handover-report":
        return <CustomerHandoverReportPage />;
      case "video-training-center":
        return <VideoTrainingCenterPage />;
      case "t800-installation-guide":
        return <T800InstallationGuidePage />;
      case "ai-support-center":
        return <AISupportCenterPage />;
      case "job-details-inst-550-a":
        return <JobDetailsInst550APage />;
      case "field-engineer-workspace":
        return <FieldEngineerWorkspacePage />;
      case "job-completion-handover":
        return <JobCompletionHandoverPage />;
      case "admin-dashboard":
        return <AdminDashboardPage />;
      case "user-role-management":
        return <UserRoleManagementPage />;
      case "product-master":
        return <ProductMasterPage />;
      case "product-master-create":
        return <ProductMasterCreatePage />;
      case "upload-master":
        return <UploadMasterPage />;
      case "ai-purchase-center":
        return <AIPurchaseImportCenterPage />;
      case "system-settings":
        return <SystemSettingsPage />;
      case "universal-search-command-center":
        return <UniversalSearchCommandCenterPage />;
      case "universal-search-mobile":
        return <UniversalSearchMobilePage />;
      case "product-overview":
        return <QbitT800ProductOverviewPage />;
      case "public-search":
        return <PublicSearchPage />;
      // Field Service Management (FSM) — Version 2
      case "fsm-dashboard":
        return <FSMDashboardPage />;
      case "fsm-work-order-detail":
        return <FSMWorkOrderDetailPage />;
      case "fsm-work-order-completion":
        return <FSMWorkOrderCompletionPage />;
      case "fsm-customer-asset-history":
        return <FSMCustomerAssetHistoryPage />;
      case "fsm-customer-tracking":
        return <FSMCustomerTrackingPage />;
      // Customer Live Tracking Portal — Version 2
      case "customer-tracking-portal":
        return <CustomerTrackingPortalPage />;
      // Engineer Mobile Portal (PWA) — Version 2
      case "mobile-engineer":
        return <MobileEngineerPage />;
      // Dr. QBIT Device Detection Engine — Version 2
      case "dr-qbit-detection":
        return <DrQbitDeviceDetectionPage />;
      // Dr. QBIT Device Passport & Driver Intelligence — Version 2
      case "dr-qbit-passport":
        return <DrQbitDevicePassportPage />;
      // Dr. QBIT Firmware Intelligence — Version 2
      case "dr-qbit-firmware":
        return <DrQbitFirmwareIntelligencePage />;
      // Dr. QBIT AI Diagnostics Engine — Version 2
      case "dr-qbit-diagnostics":
        return <DrQbitDiagnosticsPage />;
      // Dr. QBIT Test Center — Version 2
      case "dr-qbit-test-center":
        return <DrQbitTestCenterPage />;
      // Enterprise Fleet Manager — Version 2
      case "fleet-manager":
        return <FleetManagerPage />;
      // Enterprise Analytics — Version 2
      case "analytics":
        return <AnalyticsPage />;
      // Notification Automation Engine — Version 2
      case "notification-center":
        return <NotificationCenterPage />;
      case "notification-template-manager":
        return <NotificationTemplateManagerPage />;
      case "notification-history":
        return <NotificationHistoryPage />;
      case "notification-reminders":
        return <NotificationRemindersPage />;
      default:
        return <LoginPage />;
    }
  })();

  return <AuthGuard>{screen}</AuthGuard>;
}
