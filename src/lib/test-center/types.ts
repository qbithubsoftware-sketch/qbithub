/**
 * Test Center — type definitions.
 *
 * Strict TypeScript types for test sessions, test results, and reports.
 * The Test Center NEVER modifies customer data — it only validates hardware.
 */

import type { DeviceType } from "@/lib/drqbit/types";

/** Test status — the result of a single test. */
export type TestStatus = "passed" | "warning" | "failed" | "not_supported" | "skipped" | "pending";

/** Overall test session status. */
export type OverallTestStatus = "pending" | "passed" | "failed" | "partial";

/** Test category — groups related tests. */
export type TestCategory =
  | "printer"
  | "scanner"
  | "cash_drawer"
  | "display"
  | "usb"
  | "network"
  | "communication";

/** Test type — the specific test to run. */
export type TestType =
  // Printer tests
  | "test_print" | "alignment_test" | "paper_feed_test" | "cutter_test"
  | "print_speed_test" | "character_encoding_test" | "receipt_sample_test"
  // Scanner tests
  | "scan_input_test" | "symbology_recognition_test" | "input_speed_test" | "multi_barcode_test"
  // Cash drawer tests
  | "drawer_open_test" | "drawer_status_test"
  // Display tests
  | "text_output_test" | "character_rendering_test" | "brightness_test"
  // USB tests
  | "usb_connection_test" | "usb_stability_test" | "reconnect_test" | "usb_speed_test"
  // Network tests
  | "ip_address_test" | "reachability_test" | "latency_test" | "packet_loss_test"
  // Communication tests
  | "communication_test" | "timeout_test" | "retry_test" | "stability_test";

/** Full test session DTO returned to the UI. */
export interface TestSessionDTO {
  id: string;
  sessionToken: string;
  passportId: string;
  passportNumber?: string | null;
  productName?: string | null;
  engineerName: string | null;
  workOrderId: string | null;
  deviceType: string;
  deviceName: string | null;
  model: string | null;
  totalTests: number;
  passedCount: number;
  failedCount: number;
  warningCount: number;
  skippedCount: number;
  notSupportedCount: number;
  overallScore: number;
  overallStatus: OverallTestStatus;
  startedAt: string;
  completedAt: string | null;
  scanDurationMs: number | null;
  reportId: string | null;
  testResults: TestResultDTO[];
}

/** Test result DTO. */
export interface TestResultDTO {
  id: string;
  testType: TestType;
  testCategory: TestCategory;
  testName: string;
  status: TestStatus;
  duration: number | null;
  message: string | null;
  details: Record<string, unknown> | null;
  possibleCause: string | null;
  kbArticleUrl: string | null;
  recommendedAction: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

/** Test report DTO. */
export interface TestReportDTO {
  id: string;
  reportNumber: string;
  sessionId: string;
  customerName: string | null;
  companyName: string | null;
  engineerName: string | null;
  deviceName: string | null;
  model: string | null;
  serialNumber: string | null;
  overallScore: number;
  overallStatus: string;
  passedCount: number;
  failedCount: number;
  warningCount: number;
  totalTests: number;
  generatedAt: string;
  generatedByName: string | null;
}

/** Status badge variant per test status. */
export const TEST_STATUS_VARIANTS: Record<
  TestStatus,
  "success" | "warning" | "error" | "info" | "neutral"
> = {
  passed: "success",
  warning: "warning",
  failed: "error",
  not_supported: "neutral",
  skipped: "neutral",
  pending: "info",
};

/** Human-readable label per test status. */
export const TEST_STATUS_LABELS: Record<TestStatus, string> = {
  passed: "Passed",
  warning: "Warning",
  failed: "Failed",
  not_supported: "Not Supported",
  skipped: "Skipped",
  pending: "Pending",
};

/** Material Symbol icon per test status. */
export const TEST_STATUS_ICONS: Record<TestStatus, string> = {
  passed: "check_circle",
  warning: "warning",
  failed: "cancel",
  not_supported: "remove_circle",
  skipped: "skip_next",
  pending: "hourglass_empty",
};

/** Overall status variant. */
export const OVERALL_STATUS_VARIANTS: Record<
  OverallTestStatus,
  "success" | "warning" | "error" | "info" | "neutral"
> = {
  pending: "info",
  passed: "success",
  failed: "error",
  partial: "warning",
};

/** Overall status label. */
export const OVERALL_STATUS_LABELS: Record<OverallTestStatus, string> = {
  pending: "Pending",
  passed: "All Tests Passed",
  failed: "Tests Failed",
  partial: "Partial Pass",
};

/** Material Symbol icon per test category. */
export const CATEGORY_ICONS: Record<TestCategory, string> = {
  printer: "print",
  scanner: "barcode_scanner",
  cash_drawer: "point_of_sale",
  display: "monitor",
  usb: "usb",
  network: "wifi",
  communication: "cable",
};

/** Human-readable label per test category. */
export const CATEGORY_LABELS: Record<TestCategory, string> = {
  printer: "Printer Tests",
  scanner: "Scanner Tests",
  cash_drawer: "Cash Drawer Tests",
  display: "Display Tests",
  usb: "USB Tests",
  network: "Network Tests",
  communication: "Communication Tests",
};

/**
 * Returns the tests applicable to a given device type.
 * Each device type has a specific set of tests.
 */
export function getTestsForDeviceType(deviceType: string): Array<{
  testType: TestType;
  testCategory: TestCategory;
  testName: string;
}> {
  switch (deviceType) {
    case "thermal_printer":
    case "label_printer":
    case "kitchen_printer":
      return [
        { testType: "test_print", testCategory: "printer", testName: "Test Print" },
        { testType: "alignment_test", testCategory: "printer", testName: "Alignment Test" },
        { testType: "paper_feed_test", testCategory: "printer", testName: "Paper Feed Test" },
        { testType: "cutter_test", testCategory: "printer", testName: "Cutter Test" },
        { testType: "print_speed_test", testCategory: "printer", testName: "Print Speed Test" },
        { testType: "character_encoding_test", testCategory: "printer", testName: "Character Encoding Test" },
        { testType: "receipt_sample_test", testCategory: "printer", testName: "Receipt Sample Test" },
      ];

    case "barcode_scanner":
      return [
        { testType: "scan_input_test", testCategory: "scanner", testName: "Scan Input Test" },
        { testType: "symbology_recognition_test", testCategory: "scanner", testName: "Symbology Recognition Test" },
        { testType: "input_speed_test", testCategory: "scanner", testName: "Input Speed Test" },
        { testType: "multi_barcode_test", testCategory: "scanner", testName: "Multiple Barcode Scan Test" },
      ];

    case "cash_drawer":
      return [
        { testType: "drawer_open_test", testCategory: "cash_drawer", testName: "Drawer Open Command Test" },
        { testType: "drawer_status_test", testCategory: "cash_drawer", testName: "Drawer Status Test" },
      ];

    case "customer_display":
      return [
        { testType: "text_output_test", testCategory: "display", testName: "Text Output Test" },
        { testType: "character_rendering_test", testCategory: "display", testName: "Character Rendering Test" },
        { testType: "brightness_test", testCategory: "display", testName: "Brightness Test" },
      ];

    default:
      // All device types get USB + communication + network tests
      return [
        { testType: "usb_connection_test", testCategory: "usb", testName: "USB Connection Test" },
        { testType: "communication_test", testCategory: "communication", testName: "Communication Test" },
        { testType: "reachability_test", testCategory: "network", testName: "Reachability Test" },
      ];
  }
}

/**
 * Returns ALL applicable tests for a device type, including common tests
 * (USB, network, communication) in addition to device-specific tests.
 */
export function getAllTestsForDeviceType(deviceType: string): Array<{
  testType: TestType;
  testCategory: TestCategory;
  testName: string;
}> {
  const deviceTests = getTestsForDeviceType(deviceType);
  const commonTests: Array<{ testType: TestType; testCategory: TestCategory; testName: string }> = [
    { testType: "usb_connection_test", testCategory: "usb", testName: "USB Connection Test" },
    { testType: "usb_stability_test", testCategory: "usb", testName: "USB Stability Test" },
    { testType: "reconnect_test", testCategory: "usb", testName: "Reconnect Detection Test" },
    { testType: "communication_test", testCategory: "communication", testName: "Communication Test" },
    { testType: "timeout_test", testCategory: "communication", testName: "Timeout Detection Test" },
    { testType: "stability_test", testCategory: "communication", testName: "Connection Stability Test" },
    { testType: "reachability_test", testCategory: "network", testName: "Network Reachability Test" },
    { testType: "latency_test", testCategory: "network", testName: "Latency Test" },
  ];

  // Deduplicate (some device types include USB tests already)
  const seen = new Set(deviceTests.map((t) => t.testType));
  const unique = commonTests.filter((t) => !seen.has(t.testType));

  return [...deviceTests, ...unique];
}
