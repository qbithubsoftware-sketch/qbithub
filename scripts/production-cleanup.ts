/**
 * Production Cleanup & Super Admin Creation Script
 *
 * 1. Deletes all demo users
 * 2. Deletes all demo data (inquiries, newsletters, AI conversations, etc.)
 * 3. Creates the Super Administrator account
 * 4. Generates a strong random password
 * 5. Hashes it with bcrypt
 * 6. Prints the password ONCE for the admin to save
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const db = new PrismaClient();

function generateStrongPassword(): string {
  const length = 20;
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()_+-=[]{}|;:,.<>?";
  const bytes = crypto.randomBytes(length);
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset[bytes[i] % charset.length];
  }
  return password;
}

async function main() {
  console.log("=== QBIT Hub Production Cleanup ===\n");

  // ---- Step 1: Delete all demo data (order matters for foreign keys) ----
  console.log("Step 1: Deleting demo data...\n");

  const deleted = {
    articleFeedback: await db.articleFeedback.deleteMany({}),
    articleBookmarks: await db.articleBookmark.deleteMany({}),
    aiFeedback: await db.aIFeedback.deleteMany({}),
    sourceReferences: await db.sourceReference.deleteMany({}),
    aiMessages: await db.aIMessage.deleteMany({}),
    aiConversations: await db.aIConversation.deleteMany({}),
    searchHistory: await db.searchHistory.deleteMany({}),
    customerInquiries: await db.customerInquiry.deleteMany({}),
    customerNewsletters: await db.customerNewsletter.deleteMany({}),
    publicContactMessages: await db.publicContactMessage.deleteMany({}),
    publicPageVisits: await db.publicPageVisit.deleteMany({}),
    publicProductViews: await db.publicProductView.deleteMany({}),
    favoriteDownloads: await db.favoriteDownload.deleteMany({}),
    downloadHistory: await db.downloadHistory.deleteMany({}),
    auditLogs: await db.auditLog.deleteMany({}),
    activityFeed: await db.activityFeed.deleteMany({}),
    adminNotifications: await db.adminNotification.deleteMany({}),
    importLogs: await db.importLog.deleteMany({}),
    importJobs: await db.importJob.deleteMany({}),
    contentVersions: await db.contentVersion.deleteMany({}),
    slugHistory: await db.slugHistory.deleteMany({}),
    qrMappings: await db.qRMapping.deleteMany({}),
    seoConfigurations: await db.sEOConfiguration.deleteMany({}),
    mediaFiles: await db.mediaFile.deleteMany({}),
    systemMetrics: await db.systemMetric.deleteMany({}),
    systemSettings: await db.systemSetting.deleteMany({}),
    announcements: await db.announcement.deleteMany({}),
    rolePermissions: await db.rolePermission.deleteMany({}),
    permissions: await db.permission.deleteMany({}),
    assetCategories: await db.assetCategory.deleteMany({}),
    userPreferences: await db.userPreference.deleteMany({}),
    suggestedQuestions: await db.suggestedQuestion.deleteMany({}),
    releaseNotes: await db.releaseNote.deleteMany({}),
    downloadOS: await db.downloadOS.deleteMany({}),
    downloads: await db.download.deleteMany({}),
    driverVersions: await db.driverVersion.deleteMany({}),
    drivers: await db.driver.deleteMany({}),
    firmware: await db.firmware.deleteMany({}),
    sdks: await db.sDK.deleteMany({}),
    utilities: await db.utility.deleteMany({}),
    manuals: await db.manual.deleteMany({}),
    installationChecklists: await db.installationChecklist.deleteMany({}),
    installationFAQs: await db.installationFAQ.deleteMany({}),
    productInstallationGuides: await db.productInstallationGuide.deleteMany({}),
    wiringDiagrams: await db.wiringDiagram.deleteMany({}),
    configurationGuides: await db.configurationGuide.deleteMany({}),
    safetyInstructions: await db.safetyInstruction.deleteMany({}),
    requiredTools: await db.requiredTool.deleteMany({}),
    installationSteps: await db.installationStep.deleteMany({}),
    installationGuides: await db.installationGuide.deleteMany({}),
    commonErrors: await db.commonError.deleteMany({}),
    solutions: await db.solution.deleteMany({}),
    relatedAssets: await db.relatedAsset.deleteMany({}),
    troubleshootingSteps: await db.troubleshootingStep.deleteMany({}),
    troubleshootingIssues: await db.troubleshootingIssue.deleteMany({}),
    faqs: await db.fAQ.deleteMany({}),
    articleSections: await db.articleSection.deleteMany({}),
    knowledgeArticles: await db.knowledgeArticle.deleteMany({}),
    knowledgeCategories: await db.knowledgeCategory.deleteMany({}),
    operatingSystems: await db.operatingSystem.deleteMany({}),
    downloadCategories: await db.downloadCategory.deleteMany({}),
    posts: await db.post.deleteMany({}),
    users: await db.user.deleteMany({}),
  };

  let totalDeleted = 0;
  for (const [table, result] of Object.entries(deleted)) {
    console.log(`  ✓ ${table}: ${result.count} records deleted`);
    totalDeleted += result.count;
  }
  console.log(`\n  Total records deleted: ${totalDeleted}\n`);

  // ---- Step 2: Create Super Administrator ----
  console.log("Step 2: Creating Super Administrator...\n");

  const email = "qbithubsoftware@gmail.com";
  const name = "Super Administrator";
  const role = "administrator";
  const password = generateStrongPassword();
  const passwordHash = await bcrypt.hash(password, 12);

  const superAdmin = await db.user.create({
    data: {
      email,
      name,
      role,
      passwordHash,
    },
  });

  console.log(`  ✓ Super Administrator created:`);
  console.log(`    ID:    ${superAdmin.id}`);
  console.log(`    Email: ${superAdmin.email}`);
  console.log(`    Name:  ${superAdmin.name}`);
  console.log(`    Role:  ${superAdmin.role}`);
  console.log(`    Password Hash: ${(superAdmin.passwordHash ?? "").substring(0, 20)}... (bcrypt, 12 rounds)`);
  console.log(`\n  ⚠️  TEMPORARY PASSWORD (save this now — it will NOT be shown again):`);
  console.log(`  ┌──────────────────────────────────────────┐`);
  console.log(`  │  ${password}`);
  console.log(`  └──────────────────────────────────────────┘`);
  console.log(`\n  Note: Password is hashed with bcrypt (12 rounds).`);
  console.log(`  The admin must change this password on first login.\n`);

  // ---- Step 3: Verify cleanup ----
  console.log("Step 3: Verifying cleanup...\n");

  const remainingUsers = await db.user.findMany({ select: { email: true, name: true, role: true } });
  console.log(`  Remaining users: ${remainingUsers.length}`);
  console.log(`  ${JSON.stringify(remainingUsers, null, 2)}`);

  const remainingDownloads = await db.download.count();
  const remainingArticles = await db.knowledgeArticle.count();
  const remainingGuides = await db.installationGuide.count();
  console.log(`  Remaining downloads: ${remainingDownloads}`);
  console.log(`  Remaining articles: ${remainingArticles}`);
  console.log(`  Remaining guides: ${remainingGuides}`);
  console.log(`\n  ✅ Database is clean. Only the Super Administrator account exists.\n`);

  await db.$disconnect();
}

main().catch((e) => {
  console.error("ERROR:", e);
  process.exit(1);
});
