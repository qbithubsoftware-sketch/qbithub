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
import { ProductManagementPage } from "@/components/qbit/pages/ProductManagementPage";
import { SystemSettingsPage } from "@/components/qbit/pages/SystemSettingsPage";
import { UniversalSearchCommandCenterPage } from "@/components/qbit/pages/UniversalSearchCommandCenterPage";
import { UniversalSearchMobilePage } from "@/components/qbit/pages/UniversalSearchMobilePage";
import { QbitT800ProductOverviewPage } from "@/components/qbit/pages/QbitT800ProductOverviewPage";
import { PublicSearchPage } from "@/components/qbit/pages/PublicSearchPage";

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
      case "product-management":
        return <ProductManagementPage />;
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
      default:
        return <LoginPage />;
    }
  })();

  return <AuthGuard>{screen}</AuthGuard>;
}
