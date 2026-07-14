/**
 * Test Runner — executes the validation suite for a device.
 *
 * In production, the Desktop Agent performs the actual hardware tests
 * (test print, scan input, drawer open, etc.) and reports results.
 * For this implementation, the test runner simulates test execution
 * based on the device's current state (from DevicePassport + DriverInfo +
 * FirmwareInfo) and produces realistic results.
 *
 * SAFETY: The Test Center NEVER modifies customer data. It only validates
 * hardware functionality. No auto firmware updates. No auto driver installs.
 */

import { db } from "@/lib/db";
import { randomBytes } from "node:crypto";
import {
  type TestType,
  type TestStatus,
  type TestCategory,
  getAllTestsForDeviceType,
} from "./types";

interface RunTestsArgs {
  passportId: string;
  engineerId?: string;
  engineerName?: string;
  workOrderId?: string;
}

interface TestExecutionResult {
  testType: TestType;
  testCategory: TestCategory;
  testName: string;
  status: TestStatus;
  duration: number;
  message: string | null;
  details: Record<string, unknown> | null;
  possibleCause: string | null;
  kbArticleUrl: string | null;
  recommendedAction: string | null;
}

/**
 * Runs the full test suite on a device passport.
 * Creates a DeviceTestSession + TestResults.
 */
export async function runTests(args: RunTestsArgs): Promise<{
  sessionId: string;
  sessionToken: string;
  overallScore: number;
  overallStatus: string;
  passedCount: number;
  failedCount: number;
  warningCount: number;
  totalTests: number;
}> {
  const startTime = Date.now();

  const passport = await db.devicePassport.findUnique({
    where: { id: args.passportId },
    include: {
      product: true,
      driverInfo: true,
      firmwareInfo: true,
    },
  });

  if (!passport) {
    throw new Error("Device passport not found");
  }

  const deviceType = passport.product?.deviceType ?? "unknown";
  const tests = getAllTestsForDeviceType(deviceType);

  // Execute tests (simulated based on device state)
  const results: TestExecutionResult[] = tests.map((test) =>
    executeTest(test, passport),
  );

  // Compute totals
  const passedCount = results.filter((r) => r.status === "passed").length;
  const failedCount = results.filter((r) => r.status === "failed").length;
  const warningCount = results.filter((r) => r.status === "warning").length;
  const skippedCount = results.filter((r) => r.status === "skipped").length;
  const notSupportedCount = results.filter((r) => r.status === "not_supported").length;
  const totalTests = results.length;

  // Compute overall score (passed=100%, warning=50%, failed=0%, skipped/not_supported=excluded)
  const scoredTests = results.filter((r) => r.status === "passed" || r.status === "warning" || r.status === "failed");
  const overallScore = scoredTests.length > 0
    ? Math.round((results.filter((r) => r.status === "passed").length * 100 + results.filter((r) => r.status === "warning").length * 50) / scoredTests.length)
    : 0;

  // Determine overall status
  let overallStatus: string;
  if (failedCount > 0) overallStatus = "failed";
  else if (warningCount > 0) overallStatus = "partial";
  else if (passedCount > 0) overallStatus = "passed";
  else overallStatus = "pending";

  const sessionToken = randomBytes(16).toString("hex");
  const session = await db.deviceTestSession.create({
    data: {
      sessionToken,
      passportId: args.passportId,
      engineerId: args.engineerId ?? null,
      engineerName: args.engineerName ?? null,
      workOrderId: args.workOrderId ?? null,
      deviceType,
      deviceName: passport.deviceName ?? passport.product?.name ?? null,
      model: passport.model ?? passport.product?.model ?? null,
      totalTests,
      passedCount,
      failedCount,
      warningCount,
      skippedCount,
      notSupportedCount,
      overallScore,
      overallStatus,
      completedAt: new Date(),
      scanDurationMs: Date.now() - startTime,
    },
  });

  // Create test results
  for (const r of results) {
    await db.testResult.create({
      data: {
        sessionId: session.id,
        testType: r.testType,
        testCategory: r.testCategory,
        testName: r.testName,
        status: r.status,
        duration: r.duration,
        message: r.message,
        details: r.details ? JSON.stringify(r.details) : null,
        possibleCause: r.possibleCause,
        kbArticleUrl: r.kbArticleUrl,
        recommendedAction: r.recommendedAction,
        startedAt: new Date(startTime),
        completedAt: new Date(),
      },
    });
  }

  return {
    sessionId: session.id,
    sessionToken,
    overallScore,
    overallStatus,
    passedCount,
    failedCount,
    warningCount,
    totalTests,
  };
}

/**
 * Executes a single test based on the device's current state.
 * Simulated — in production, the Desktop Agent performs the actual test.
 */
function executeTest(
  test: { testType: TestType; testCategory: TestCategory; testName: string },
  passport: {
    deviceStatus: string;
    connectionType: string | null;
    driverInfo: { driverStatus: string } | null;
    firmwareInfo: { firmwareStatus: string } | null;
    product: { driverDownloadUrl: string | null; manualUrl: string | null; knowledgeBaseUrl: string | null } | null;
  },
): TestExecutionResult {
  const duration = Math.floor(Math.random() * 2000) + 500; // 500-2500ms
  const driverOk = passport.driverInfo?.driverStatus === "installed" || passport.driverInfo?.driverStatus === "update_available";
  const firmwareOk = passport.firmwareInfo?.firmwareStatus === "healthy" || passport.firmwareInfo?.firmwareStatus === "update_available";
  const deviceReady = passport.deviceStatus === "ready";

  // Default result
  let status: TestStatus = "passed";
  let message = `${test.testName} completed successfully.`;
  let possibleCause: string | null = null;
  let kbArticleUrl: string | null = passport.product?.knowledgeBaseUrl ?? null;
  let recommendedAction: string | null = null;

  // If device is not ready, most tests fail
  if (!deviceReady && test.testCategory !== "usb") {
    status = "failed";
    message = `Device is not ready (status: ${passport.deviceStatus}). Test could not be executed.`;
    possibleCause = "Device is not in a ready state. Check connection and power.";
    recommendedAction = "Verify device connection and power cycle the device.";
  }
  // If driver is missing, printer/scanner tests fail
  else if (!driverOk && (test.testCategory === "printer" || test.testCategory === "scanner")) {
    status = "failed";
    message = `Driver is ${passport.driverInfo?.driverStatus ?? "not installed"}. Test requires a working driver.`;
    possibleCause = "Driver is missing or unsupported.";
    recommendedAction = "Download and install the recommended driver from the Driver Center.";
  }
  // Simulate occasional warnings for non-critical tests
  else if (Math.random() < 0.15 && (test.testType === "latency_test" || test.testType === "usb_speed_test")) {
    status = "warning";
    message = `${test.testName} completed with warnings. Performance is below optimal.`;
    possibleCause = "Network latency is higher than recommended.";
    recommendedAction = "Check network connection quality.";
  }
  // Cutter test — not all printers support it
  else if (test.testType === "cutter_test" && Math.random() < 0.3) {
    status = "not_supported";
    message = "This device does not support an automatic cutter.";
  }
  // Brightness test — not all displays support it
  else if (test.testType === "brightness_test" && Math.random() < 0.3) {
    status = "not_supported";
    message = "This display does not support brightness control.";
  }

  return {
    testType: test.testType,
    testCategory: test.testCategory,
    testName: test.testName,
    status,
    duration,
    message,
    details: { simulated: true, deviceStatus: passport.deviceStatus },
    possibleCause,
    kbArticleUrl,
    recommendedAction,
  };
}
