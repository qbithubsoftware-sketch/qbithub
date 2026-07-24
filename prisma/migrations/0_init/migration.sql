-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'dealer',
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperatingSystem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "sortIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperatingSystem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DownloadCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "sortIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DownloadCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Download" (
    "id" TEXT NOT NULL,
    "productId" TEXT,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "releaseDate" TIMESTAMP(3) NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "checksum" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "latest" BOOLEAN NOT NULL DEFAULT false,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "installInstructions" TEXT,
    "knownIssues" TEXT,
    "supportedProducts" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Download_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DownloadOS" (
    "downloadId" TEXT NOT NULL,
    "osId" TEXT NOT NULL,

    CONSTRAINT "DownloadOS_pkey" PRIMARY KEY ("downloadId","osId")
);

-- CreateTable
CREATE TABLE "ReleaseNote" (
    "id" TEXT NOT NULL,
    "downloadId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "releaseDate" TIMESTAMP(3) NOT NULL,
    "changes" TEXT NOT NULL,
    "bugFixes" TEXT,
    "securityUpdates" TEXT,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReleaseNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DownloadHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "downloadId" TEXT NOT NULL,
    "downloadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "DownloadHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FavoriteDownload" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "downloadId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteDownload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Driver" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "productId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverVersion" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "downloadId" TEXT,
    "releaseDate" TIMESTAMP(3) NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DriverVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Firmware" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "productId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Firmware_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SDK" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "productId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SDK_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Utility" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "productId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Utility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Manual" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "productId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Manual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstallationGuide" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "productId" TEXT,
    "product" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "estimatedTime" INTEGER NOT NULL,
    "difficulty" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "description" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "latest" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "completionCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstallationGuide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstallationStep" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT,
    "estimatedTime" INTEGER NOT NULL,
    "warning" TEXT,
    "tip" TEXT,
    "requiredToolId" TEXT,
    "relatedDownloadId" TEXT,
    "relatedManualId" TEXT,
    "relatedVideoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstallationStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequiredTool" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "description" TEXT,
    "included" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequiredTool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyInstruction" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'warning',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SafetyInstruction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfigurationGuide" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "configType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConfigurationGuide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WiringDiagram" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WiringDiagram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstallationChecklist" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstallationChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductInstallationGuide" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "downloadId" TEXT,
    "relationType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductInstallationGuide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstallationFAQ" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstallationFAQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "description" TEXT,
    "color" TEXT,
    "sortIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeArticle" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "authorAvatar" TEXT,
    "readingTime" INTEGER NOT NULL,
    "difficulty" TEXT NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "popular" BOOLEAN NOT NULL DEFAULT false,
    "latest" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "notHelpfulCount" INTEGER NOT NULL DEFAULT 0,
    "relatedProductIds" TEXT,
    "relatedDownloadIds" TEXT,
    "relatedGuideIds" TEXT,
    "relatedVideoUrls" TEXT,
    "relatedFaqIds" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleSection" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArticleSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FAQ" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "categoryId" TEXT,
    "relatedFaqIds" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FAQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TroubleshootingIssue" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "productId" TEXT,
    "symptoms" TEXT NOT NULL,
    "causes" TEXT NOT NULL,
    "resolution" TEXT NOT NULL,
    "relatedDownloadIds" TEXT,
    "relatedManualIds" TEXT,
    "relatedGuideIds" TEXT,
    "relatedVideoUrls" TEXT,
    "difficulty" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TroubleshootingIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TroubleshootingStep" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "warning" TEXT,
    "tip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TroubleshootingStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommonError" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "possibleCause" TEXT NOT NULL,
    "resolution" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'warning',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommonError_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Solution" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "issueId" TEXT,
    "errorId" TEXT,
    "steps" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Solution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelatedAsset" (
    "id" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "assetId" TEXT,
    "assetUrl" TEXT,
    "label" TEXT NOT NULL,
    "icon" TEXT,
    "issueId" TEXT,
    "errorId" TEXT,
    "articleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RelatedAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleBookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "bookmarkType" TEXT NOT NULL DEFAULT 'article',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArticleBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleFeedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "articleId" TEXT NOT NULL,
    "rating" TEXT NOT NULL,
    "comment" TEXT,
    "feedbackType" TEXT NOT NULL DEFAULT 'rating',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArticleFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "userName" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "entityName" TEXT,
    "description" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "severity" TEXT NOT NULL DEFAULT 'info',
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "targetRoles" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemMetric" (
    "id" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "unit" TEXT,
    "category" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityFeed" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "userName" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityName" TEXT,
    "icon" TEXT,
    "dotColor" TEXT NOT NULL DEFAULT 'primary',
    "attachment" TEXT,
    "invitees" TEXT,
    "dim" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityFeed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'system',
    "density" TEXT NOT NULL DEFAULT 'comfortable',
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "sidebarCollapsed" BOOLEAN NOT NULL DEFAULT false,
    "dashboardLayout" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminNotification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "category" TEXT NOT NULL DEFAULT 'system',
    "actionUrl" TEXT,
    "actionLabel" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "targetUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerInquiry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "assignedTo" TEXT,
    "response" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicPageVisit" (
    "id" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "pageId" TEXT,
    "referrer" TEXT,
    "country" TEXT,
    "visitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicPageVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicProductView" (
    "id" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referrer" TEXT,

    CONSTRAINT "PublicProductView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerNewsletter" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "unsubscribeToken" TEXT NOT NULL,

    CONSTRAINT "CustomerNewsletter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicContactMessage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "handled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PublicContactMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "title" TEXT NOT NULL DEFAULT 'New Conversation',
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "model" TEXT,
    "provider" TEXT,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "responseTimeMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "query" TEXT NOT NULL,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuggestedQuestion" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuggestedQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIFeedback" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT,
    "rating" TEXT NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceReference" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "excerpt" TEXT,
    "relevance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SourceReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportJob" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT,
    "startedBy" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportLog" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "data" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentVersion" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "changedBy" TEXT,
    "changedByName" TEXT,
    "changeSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaFile" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "thumbnailPath" TEXT,
    "webpPath" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "altText" TEXT,
    "folder" TEXT NOT NULL DEFAULT 'general',
    "tags" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SEOConfiguration" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "keywords" TEXT,
    "ogImage" TEXT,
    "canonicalUrl" TEXT,
    "jsonLd" TEXT,
    "autoGenerated" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SEOConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QRMapping" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "qrType" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "qrImageUrl" TEXT,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QRMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlugHistory" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldSlug" TEXT NOT NULL,
    "newSlug" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SlugHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FSMCustomer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyName" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "addressLine" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'India',
    "geoLat" DOUBLE PRECISION,
    "geoLng" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FSMCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FSMCustomerAsset" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "qrCode" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "warrantyStatus" TEXT NOT NULL DEFAULT 'active',
    "warrantyExpiry" TIMESTAMP(3),
    "firmwareVersion" TEXT,
    "driverVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FSMCustomerAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOrder" (
    "id" TEXT NOT NULL,
    "jobNumber" TEXT NOT NULL,
    "publicTrackingCode" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "customerId" TEXT NOT NULL,
    "assetId" TEXT,
    "assignedEngineerId" TEXT,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "scheduledTime" TEXT,
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 60,
    "startedAt" TIMESTAMP(3),
    "arrivedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "rescheduledFrom" TIMESTAMP(3),
    "rescheduledTo" TIMESTAMP(3),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobTimeline" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "actorId" TEXT,
    "actorName" TEXT,
    "metadata" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobTimeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOrderPhoto" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "caption" TEXT,
    "storagePath" TEXT NOT NULL,
    "thumbnailPath" TEXT,
    "mimeType" TEXT NOT NULL DEFAULT 'image/jpeg',
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "geoLat" DOUBLE PRECISION,
    "geoLng" DOUBLE PRECISION,
    "uploadedById" TEXT,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkOrderPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerSignature" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "signerName" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "CustomerSignature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EngineerNote" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT,
    "body" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EngineerNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompletionReport" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "reportNumber" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "testsPerformed" TEXT NOT NULL,
    "partsReplaced" TEXT,
    "recommendations" TEXT,
    "pdfStoragePath" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedById" TEXT,

    CONSTRAINT "CompletionReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "templateCode" TEXT NOT NULL DEFAULT 'legacy',
    "templateId" TEXT,
    "recipient" TEXT NOT NULL,
    "recipientRole" TEXT NOT NULL DEFAULT 'customer',
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "error" TEXT,
    "providerName" TEXT,
    "providerMessageId" TEXT,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationTemplate" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "recipientType" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "htmlBody" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "recipientType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'system',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "actionUrl" TEXT,
    "actionLabel" TEXT,
    "readAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "templateId" TEXT,
    "workOrderId" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailQueue" (
    "id" TEXT NOT NULL,
    "toAddress" TEXT NOT NULL,
    "fromAddress" TEXT NOT NULL DEFAULT 'noreply@qbithub.com',
    "replyTo" TEXT,
    "subject" TEXT NOT NULL,
    "textBody" TEXT NOT NULL,
    "htmlBody" TEXT,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "nextRetryAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "lastError" TEXT,
    "templateId" TEXT,
    "workOrderId" TEXT,
    "recipientUserId" TEXT,
    "providerName" TEXT,
    "providerMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppQueue" (
    "id" TEXT NOT NULL,
    "toPhone" TEXT NOT NULL,
    "templateName" TEXT,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "nextRetryAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "lastError" TEXT,
    "templateId" TEXT,
    "workOrderId" TEXT,
    "recipientUserId" TEXT,
    "providerName" TEXT,
    "providerMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reminder" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "recipientType" TEXT NOT NULL,
    "recipientId" TEXT,
    "recipientContact" TEXT NOT NULL,
    "offsetMinutes" INTEGER NOT NULL,
    "offsetLabel" TEXT NOT NULL,
    "channels" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "dueAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "notificationLogIds" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackingToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "lastViewedAt" TIMESTAMP(3),
    "lastViewedIp" TEXT,
    "lastViewedUserAgent" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,
    "source" TEXT NOT NULL DEFAULT 'email',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "TrackingToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerFeedback" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "trackingTokenId" TEXT,
    "overallRating" INTEGER NOT NULL,
    "punctualityRating" INTEGER,
    "professionalismRating" INTEGER,
    "qualityRating" INTEGER,
    "communicationRating" INTEGER,
    "comment" TEXT,
    "recommendImprovement" TEXT,
    "wouldRecommend" BOOLEAN,
    "customerName" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "CustomerFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstallationRating" (
    "id" TEXT NOT NULL,
    "engineerId" TEXT NOT NULL,
    "totalRatings" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fiveStarCount" INTEGER NOT NULL DEFAULT 0,
    "fourStarCount" INTEGER NOT NULL DEFAULT 0,
    "threeStarCount" INTEGER NOT NULL DEFAULT 0,
    "twoStarCount" INTEGER NOT NULL DEFAULT 0,
    "oneStarCount" INTEGER NOT NULL DEFAULT 0,
    "avgPunctuality" DOUBLE PRECISION,
    "avgProfessionalism" DOUBLE PRECISION,
    "avgQuality" DOUBLE PRECISION,
    "avgCommunication" DOUBLE PRECISION,
    "lastRatingAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstallationRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EngineerLocation" (
    "id" TEXT NOT NULL,
    "engineerId" TEXT NOT NULL,
    "workOrderId" TEXT,
    "geoLat" DOUBLE PRECISION NOT NULL,
    "geoLng" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "heading" DOUBLE PRECISION,
    "speed" DOUBLE PRECISION,
    "batteryLevel" DOUBLE PRECISION,
    "isOnline" BOOLEAN NOT NULL DEFAULT true,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EngineerLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfflineSyncQueue" (
    "id" TEXT NOT NULL,
    "engineerId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "lastAttemptAt" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3),
    "responseStatus" INTEGER,
    "responseBody" TEXT,
    "error" TEXT,
    "clientQueueId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfflineSyncQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QbitProduct" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT NOT NULL DEFAULT 'QBIT',
    "manufacturer" TEXT,
    "model" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "sku" TEXT,
    "serialPattern" TEXT,
    "description" TEXT,
    "longDescription" TEXT,
    "imageUrl" TEXT,
    "galleryImages" TEXT,
    "category" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isTrending" BOOLEAN NOT NULL DEFAULT false,
    "badgeLabel" TEXT,
    "startingPrice" TEXT,
    "specifications" TEXT,
    "features" TEXT,
    "operatingSystems" TEXT,
    "videos" TEXT,
    "driverDownloadUrl" TEXT,
    "manualUrl" TEXT,
    "installationGuideUrl" TEXT,
    "knowledgeBaseUrl" TEXT,
    "brochureUrl" TEXT,
    "datasheetUrl" TEXT,
    "warrantyUrl" TEXT,
    "sdkUrl" TEXT,
    "utilityUrl" TEXT,
    "qrCodeUrl" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "seoKeywords" TEXT,
    "tags" TEXT,
    "compatibleDevices" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "aiDiagnosticsSupported" BOOLEAN NOT NULL DEFAULT true,
    "drQbitSupported" BOOLEAN NOT NULL DEFAULT true,
    "latestDriverVersion" TEXT,
    "latestFirmwareVersion" TEXT,
    "lastUpdated" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "subCategory" TEXT,
    "productSeries" TEXT,
    "productType" TEXT,
    "highlights" TEXT,
    "installationInstructions" TEXT,
    "requiredSoftware" TEXT,
    "requiredDrivers" TEXT,
    "requiredAccessories" TEXT,
    "installationTime" TEXT,
    "difficultyLevel" TEXT,
    "canonicalUrl" TEXT,
    "openGraphImage" TEXT,
    "twitterCard" TEXT,
    "productSchema" TEXT,
    "frequentlyBoughtTogether" TEXT,
    "alternativeProducts" TEXT,
    "upgradedModel" TEXT,
    "previousModel" TEXT,
    "warrantyDuration" TEXT,
    "amcAvailable" BOOLEAN NOT NULL DEFAULT false,
    "isDraft" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "isBestSeller" BOOLEAN NOT NULL DEFAULT false,
    "isNewArrival" BOOLEAN NOT NULL DEFAULT false,
    "driverDownloadCount" INTEGER NOT NULL DEFAULT 0,
    "manualDownloadCount" INTEGER NOT NULL DEFAULT 0,
    "installationGuideDownloadCount" INTEGER NOT NULL DEFAULT 0,
    "qrScanCount" INTEGER NOT NULL DEFAULT 0,
    "barcodePrintCount" INTEGER NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "supportsWifi" BOOLEAN NOT NULL DEFAULT false,
    "autoDriverInstall" BOOLEAN NOT NULL DEFAULT false,
    "sdkAvailable" BOOLEAN NOT NULL DEFAULT false,
    "firmwareConfigSupported" BOOLEAN NOT NULL DEFAULT false,
    "connectionTypes" TEXT,
    "categoryId" TEXT,

    CONSTRAINT "QbitProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "version" TEXT,
    "description" TEXT,
    "storageKey" TEXT,
    "publicUrl" TEXT,
    "storageProvider" TEXT,
    "urlType" TEXT NOT NULL DEFAULT 'uploaded',
    "extension" TEXT,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "originalFileName" TEXT,
    "checksum" TEXT,
    "supportedCategories" TEXT,
    "thumbnailUrl" TEXT,
    "releaseDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "url" TEXT,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductResourceMapping" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "overrideType" TEXT,
    "sortIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductResourceMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductRelation" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "relatedId" TEXT NOT NULL,
    "sortIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductRelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductOS" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "osName" TEXT NOT NULL,
    "osIcon" TEXT,
    "minVersion" TEXT,
    "sortIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductOS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductMedia" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "provider" TEXT,
    "externalId" TEXT,
    "altText" TEXT,
    "sortIndex" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSpecification" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "property" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "group" TEXT,
    "sortIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductSpecification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductFeature" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sortIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HardwareSignature" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "vendorId" TEXT,
    "productIdCode" TEXT,
    "hardwareId" TEXT,
    "manufacturer" TEXT,
    "model" TEXT,
    "macPrefix" TEXT,
    "openPorts" TEXT,
    "usbDeviceInstanceId" TEXT,
    "usbContainerId" TEXT,
    "chipUid" TEXT,
    "factoryDeviceUuid" TEXT,
    "ethernetMac" TEXT,
    "bluetoothMac" TEXT,
    "firmwareSignature" TEXT,
    "connectionType" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HardwareSignature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanSession" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "engineerId" TEXT,
    "engineerName" TEXT,
    "customerId" TEXT,
    "customerName" TEXT,
    "workOrderId" TEXT,
    "agentVersion" TEXT,
    "osInfo" TEXT,
    "hostname" TEXT,
    "scanDurationMs" INTEGER,
    "deviceCount" INTEGER NOT NULL DEFAULT 0,
    "usbCount" INTEGER NOT NULL DEFAULT 0,
    "comCount" INTEGER NOT NULL DEFAULT 0,
    "lanCount" INTEGER NOT NULL DEFAULT 0,
    "wifiCount" INTEGER NOT NULL DEFAULT 0,
    "bluetoothCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ScanSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetectedDevice" (
    "id" TEXT NOT NULL,
    "scanSessionId" TEXT NOT NULL,
    "connectionType" TEXT NOT NULL,
    "port" TEXT,
    "deviceName" TEXT,
    "manufacturer" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "hardwareId" TEXT,
    "vendorId" TEXT,
    "productIdCode" TEXT,
    "serialNumber" TEXT,
    "usbVersion" TEXT,
    "osInfo" TEXT,
    "architecture" TEXT,
    "ipAddress" TEXT,
    "macAddress" TEXT,
    "hostname" TEXT,
    "openPorts" TEXT,
    "signalQuality" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ready',
    "matchedProductId" TEXT,
    "matchConfidence" DOUBLE PRECISION,
    "matchMethod" TEXT,
    "firstDetectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DetectedDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnknownDevice" (
    "id" TEXT NOT NULL,
    "scanSessionId" TEXT NOT NULL,
    "hardwareId" TEXT,
    "vendorId" TEXT,
    "productIdCode" TEXT,
    "deviceName" TEXT,
    "manufacturer" TEXT,
    "model" TEXT,
    "connectionType" TEXT,
    "port" TEXT,
    "macAddress" TEXT,
    "ipAddress" TEXT,
    "mappedProductId" TEXT,
    "mappedAt" TIMESTAMP(3),
    "mappedBy" TEXT,
    "mappedByName" TEXT,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UnknownDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevicePassport" (
    "id" TEXT NOT NULL,
    "passportNumber" TEXT NOT NULL,
    "detectedDeviceId" TEXT,
    "productId" TEXT,
    "hardwareId" TEXT,
    "vendorId" TEXT,
    "productIdCode" TEXT,
    "serialNumber" TEXT,
    "deviceName" TEXT,
    "manufacturer" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "productCode" TEXT,
    "firmwareVersion" TEXT,
    "hardwareRevision" TEXT,
    "connectionType" TEXT,
    "port" TEXT,
    "usbVersion" TEXT,
    "osInfo" TEXT,
    "architecture" TEXT,
    "macAddress" TEXT,
    "ipAddress" TEXT,
    "usbDeviceInstanceId" TEXT,
    "usbContainerId" TEXT,
    "usbDevicePath" TEXT,
    "usbPortPath" TEXT,
    "usbLocationPath" TEXT,
    "usbInterfaceNumber" INTEGER,
    "usbBusNumber" INTEGER,
    "usbAddress" INTEGER,
    "usbDeviceClass" TEXT,
    "usbDeviceSubclass" TEXT,
    "pnpDeviceId" TEXT,
    "containerGuid" TEXT,
    "parentDevice" TEXT,
    "driverVersion" TEXT,
    "driverProvider" TEXT,
    "driverDate" TEXT,
    "deviceClassGuid" TEXT,
    "ethernetMacAddress" TEXT,
    "wifiMacAddress" TEXT,
    "hostname" TEXT,
    "bluetoothMacAddress" TEXT,
    "bluetoothDeviceAddress" TEXT,
    "bluetoothName" TEXT,
    "chipUid" TEXT,
    "flashId" TEXT,
    "factoryDeviceUuid" TEXT,
    "manufacturingBatch" TEXT,
    "manufacturingDate" TEXT,
    "deviceUuid" TEXT,
    "hardwareFingerprint" TEXT,
    "duplicateSerialFlag" BOOLEAN NOT NULL DEFAULT false,
    "fingerprintQuality" TEXT,
    "primaryIdentifier" TEXT,
    "firstConnectedAt" TIMESTAMP(3),
    "lastConnectedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "connectionCount" INTEGER NOT NULL DEFAULT 1,
    "deviceStatus" TEXT NOT NULL DEFAULT 'ready',
    "customerId" TEXT,
    "dealerId" TEXT,
    "invoiceNumber" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "warrantyStartDate" TIMESTAMP(3),
    "warrantyEndDate" TIMESTAMP(3),
    "registrationDate" TIMESTAMP(3),
    "activationDate" TIMESTAMP(3),
    "qrCode" TEXT,
    "productImage" TEXT,
    "productCategory" TEXT,
    "customerAssetId" TEXT,
    "branchId" TEXT,
    "assignedEngineerId" TEXT,
    "firstDetectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastScannedAt" TIMESTAMP(3),
    "lastDriverUpdateAt" TIMESTAMP(3),
    "lastFirmwareUpdateAt" TIMESTAMP(3),
    "lastInstallationAt" TIMESTAMP(3),
    "lastServiceAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DevicePassport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverInformation" (
    "id" TEXT NOT NULL,
    "passportId" TEXT NOT NULL,
    "installedDriverName" TEXT,
    "installedDriverVersion" TEXT,
    "installedDriverProvider" TEXT,
    "installedDriverDate" TIMESTAMP(3),
    "latestDriverVersion" TEXT,
    "latestDriverReleaseDate" TIMESTAMP(3),
    "latestDriverDownloadUrl" TEXT,
    "latestDriverFileSize" INTEGER,
    "latestDriverReleaseNotes" TEXT,
    "driverStatus" TEXT NOT NULL DEFAULT 'unknown',
    "supportedOses" TEXT,
    "lastCheckedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverInformation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceWarranty" (
    "id" TEXT NOT NULL,
    "passportId" TEXT NOT NULL,
    "purchaseDate" TIMESTAMP(3),
    "warrantyStartDate" TIMESTAMP(3),
    "warrantyExpiryDate" TIMESTAMP(3),
    "warrantyStatus" TEXT NOT NULL DEFAULT 'unknown',
    "warrantyDaysRemaining" INTEGER,
    "extendedWarranty" BOOLEAN NOT NULL DEFAULT false,
    "extendedExpiryDate" TIMESTAMP(3),
    "warrantyProvider" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceWarranty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverHistory" (
    "id" TEXT NOT NULL,
    "passportId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "oldVersion" TEXT,
    "newVersion" TEXT,
    "driverName" TEXT,
    "driverProvider" TEXT,
    "performedBy" TEXT,
    "performedByName" TEXT,
    "notes" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DriverHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FirmwareRelease" (
    "id" TEXT NOT NULL,
    "firmwareId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "buildNumber" TEXT,
    "releaseDate" TIMESTAMP(3) NOT NULL,
    "downloadId" TEXT,
    "fileSize" INTEGER,
    "checksum" TEXT,
    "releaseNotes" TEXT,
    "releaseNotesHtml" TEXT,
    "isCritical" BOOLEAN NOT NULL DEFAULT false,
    "isLatest" BOOLEAN NOT NULL DEFAULT false,
    "isStable" BOOLEAN NOT NULL DEFAULT true,
    "supportedModels" TEXT,
    "supportedHardwareIds" TEXT,
    "minOsVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FirmwareRelease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FirmwareCompatibility" (
    "id" TEXT NOT NULL,
    "firmwareReleaseId" TEXT NOT NULL,
    "productId" TEXT,
    "deviceModel" TEXT NOT NULL,
    "hardwareIdPattern" TEXT,
    "vendorId" TEXT,
    "productIdCode" TEXT,
    "isCompatible" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FirmwareCompatibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FirmwareInformation" (
    "id" TEXT NOT NULL,
    "passportId" TEXT NOT NULL,
    "installedVersion" TEXT,
    "installedBuildNumber" TEXT,
    "installedFirmwareDate" TIMESTAMP(3),
    "installedFirmwareVendor" TEXT,
    "installedCompatibility" TEXT,
    "latestReleaseId" TEXT,
    "latestVersion" TEXT,
    "latestReleaseDate" TIMESTAMP(3),
    "latestDownloadUrl" TEXT,
    "latestFileSize" INTEGER,
    "latestChecksum" TEXT,
    "latestReleaseNotes" TEXT,
    "firmwareStatus" TEXT NOT NULL DEFAULT 'unknown',
    "compatibilityChecked" BOOLEAN NOT NULL DEFAULT false,
    "isCompatible" BOOLEAN NOT NULL DEFAULT true,
    "compatibilityReason" TEXT,
    "lastCheckedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FirmwareInformation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FirmwareHistory" (
    "id" TEXT NOT NULL,
    "passportId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "oldVersion" TEXT,
    "newVersion" TEXT,
    "firmwareReleaseId" TEXT,
    "performedBy" TEXT,
    "performedByName" TEXT,
    "updateMethod" TEXT,
    "notes" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FirmwareHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticSession" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "passportId" TEXT NOT NULL,
    "engineerId" TEXT,
    "engineerName" TEXT,
    "agentVersion" TEXT,
    "osInfo" TEXT,
    "hostname" TEXT,
    "scanDurationMs" INTEGER,
    "overallScore" INTEGER NOT NULL DEFAULT 0,
    "healthGrade" TEXT NOT NULL DEFAULT 'unknown',
    "driverScore" INTEGER NOT NULL DEFAULT 0,
    "firmwareScore" INTEGER NOT NULL DEFAULT 0,
    "connectionScore" INTEGER NOT NULL DEFAULT 0,
    "deviceStatusScore" INTEGER NOT NULL DEFAULT 0,
    "compatibilityScore" INTEGER NOT NULL DEFAULT 0,
    "knowledgeScore" INTEGER NOT NULL DEFAULT 0,
    "findingsCount" INTEGER NOT NULL DEFAULT 0,
    "confirmedCount" INTEGER NOT NULL DEFAULT 0,
    "possibleCount" INTEGER NOT NULL DEFAULT 0,
    "recommendationsCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiagnosticSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticFinding" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "certainty" TEXT NOT NULL DEFAULT 'confirmed',
    "evidence" TEXT,
    "kbArticleId" TEXT,
    "recommendedAction" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiagnosticFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticRecommendation" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "findingId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "actionType" TEXT NOT NULL,
    "resourceUrl" TEXT,
    "resourceScreen" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiagnosticRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthScore" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "overallGrade" TEXT NOT NULL,
    "driverScore" INTEGER NOT NULL,
    "driverGrade" TEXT NOT NULL,
    "firmwareScore" INTEGER NOT NULL,
    "firmwareGrade" TEXT NOT NULL,
    "connectionScore" INTEGER NOT NULL,
    "connectionGrade" TEXT NOT NULL,
    "deviceStatusScore" INTEGER NOT NULL,
    "deviceStatusGrade" TEXT NOT NULL,
    "compatibilityScore" INTEGER NOT NULL,
    "compatibilityGrade" TEXT NOT NULL,
    "knowledgeScore" INTEGER NOT NULL,
    "knowledgeGrade" TEXT NOT NULL,
    "scoringRules" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceTestSession" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "passportId" TEXT NOT NULL,
    "engineerId" TEXT,
    "engineerName" TEXT,
    "workOrderId" TEXT,
    "deviceType" TEXT NOT NULL,
    "deviceName" TEXT,
    "model" TEXT,
    "totalTests" INTEGER NOT NULL DEFAULT 0,
    "passedCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "warningCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "notSupportedCount" INTEGER NOT NULL DEFAULT 0,
    "overallScore" INTEGER NOT NULL DEFAULT 0,
    "overallStatus" TEXT NOT NULL DEFAULT 'pending',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "scanDurationMs" INTEGER,
    "reportId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceTestSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestResult" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "testType" TEXT NOT NULL,
    "testCategory" TEXT NOT NULL,
    "testName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "duration" INTEGER,
    "message" TEXT,
    "details" TEXT,
    "possibleCause" TEXT,
    "kbArticleUrl" TEXT,
    "recommendedAction" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestReport" (
    "id" TEXT NOT NULL,
    "reportNumber" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "customerName" TEXT,
    "companyName" TEXT,
    "engineerName" TEXT,
    "deviceName" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "overallScore" INTEGER NOT NULL,
    "overallStatus" TEXT NOT NULL,
    "passedCount" INTEGER NOT NULL,
    "failedCount" INTEGER NOT NULL,
    "warningCount" INTEGER NOT NULL,
    "totalTests" INTEGER NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedById" TEXT,
    "generatedByName" TEXT,
    "pdfStoragePath" TEXT,

    CONSTRAINT "TestReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "addressLine" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'India',
    "geoLat" DOUBLE PRECISION,
    "geoLng" DOUBLE PRECISION,
    "contactPerson" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FleetReport" (
    "id" TEXT NOT NULL,
    "reportNumber" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "filters" TEXT,
    "totalDevices" INTEGER NOT NULL DEFAULT 0,
    "healthyDevices" INTEGER NOT NULL DEFAULT 0,
    "offlineDevices" INTEGER NOT NULL DEFAULT 0,
    "attentionDevices" INTEGER NOT NULL DEFAULT 0,
    "warrantyExpiring" INTEGER NOT NULL DEFAULT 0,
    "generatedById" TEXT,
    "generatedByName" TEXT,
    "exportFormat" TEXT NOT NULL DEFAULT 'pdf',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FleetReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsSnapshot" (
    "id" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "snapshotType" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessMetric" (
    "id" TEXT NOT NULL,
    "metricKey" TEXT NOT NULL,
    "metricLabel" TEXT NOT NULL,
    "metricValue" DOUBLE PRECISION NOT NULL,
    "metricUnit" TEXT,
    "metricCategory" TEXT NOT NULL,
    "previousValue" DOUBLE PRECISION,
    "trendPercent" DOUBLE PRECISION,
    "snapshotDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EngineerMetric" (
    "id" TEXT NOT NULL,
    "engineerId" TEXT NOT NULL,
    "engineerName" TEXT NOT NULL,
    "jobsAssigned" INTEGER NOT NULL DEFAULT 0,
    "jobsCompleted" INTEGER NOT NULL DEFAULT 0,
    "jobsPending" INTEGER NOT NULL DEFAULT 0,
    "averageCompletionHours" DOUBLE PRECISION,
    "averageRating" DOUBLE PRECISION,
    "totalRatings" INTEGER NOT NULL DEFAULT 0,
    "averageResponseHours" DOUBLE PRECISION,
    "averageResolutionHours" DOUBLE PRECISION,
    "photoCompliance" DOUBLE PRECISION,
    "reportSubmissionRate" DOUBLE PRECISION,
    "snapshotDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EngineerMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceMetric" (
    "id" TEXT NOT NULL,
    "passportId" TEXT NOT NULL,
    "passportNumber" TEXT NOT NULL,
    "deviceName" TEXT,
    "deviceType" TEXT,
    "model" TEXT,
    "totalScans" INTEGER NOT NULL DEFAULT 0,
    "totalTests" INTEGER NOT NULL DEFAULT 0,
    "totalDiagnostics" INTEGER NOT NULL DEFAULT 0,
    "totalServiceVisits" INTEGER NOT NULL DEFAULT 0,
    "healthScore" INTEGER,
    "driverStatus" TEXT,
    "firmwareStatus" TEXT,
    "warrantyStatus" TEXT,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "lastFailureDate" TIMESTAMP(3),
    "snapshotDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerAccount" (
    "id" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "alternateMobile" TEXT,
    "email" TEXT,
    "name" TEXT NOT NULL,
    "companyName" TEXT,
    "gstNumber" TEXT,
    "billingAddress" TEXT,
    "shippingAddress" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pinCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseRecord" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "brand" TEXT,
    "modelNumber" TEXT NOT NULL,
    "serialNumber" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "invoiceNumber" TEXT,
    "invoiceDate" TIMESTAMP(3),
    "purchaseDate" TIMESTAMP(3),
    "unitPrice" DOUBLE PRECISION,
    "gstAmount" DOUBLE PRECISION,
    "totalAmount" DOUBLE PRECISION,
    "paymentStatus" TEXT,
    "dealerName" TEXT,
    "dealerId" TEXT,
    "warrantyPeriod" TEXT,
    "warrantyStartDate" TIMESTAMP(3),
    "warrantyEndDate" TIMESTAMP(3),
    "assignedEngineerId" TEXT,
    "assignedSupportId" TEXT,
    "installationStatus" TEXT NOT NULL DEFAULT 'pending',
    "serviceStatus" TEXT NOT NULL DEFAULT 'none',
    "amcStatus" TEXT NOT NULL DEFAULT 'none',
    "extractionSource" TEXT,
    "extractionConfidence" DOUBLE PRECISION,
    "extractionRaw" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseInvoice" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "extractionStatus" TEXT NOT NULL DEFAULT 'pending',
    "extractionError" TEXT,
    "uploadedById" TEXT,
    "uploadedByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceConfiguration" (
    "id" TEXT NOT NULL,
    "configurationNumber" TEXT NOT NULL,
    "passportId" TEXT NOT NULL,
    "serialNumber" TEXT,
    "activeConnectionType" TEXT,
    "usbConfig" TEXT,
    "lanConfig" TEXT,
    "wifiConfig" TEXT,
    "bluetoothConfig" TEXT,
    "configurationStatus" TEXT NOT NULL DEFAULT 'pending',
    "communicationVerified" BOOLEAN NOT NULL DEFAULT false,
    "testPrintStatus" TEXT NOT NULL DEFAULT 'pending',
    "firmwareVersionAtConfig" TEXT,
    "lastConfiguredAt" TIMESTAMP(3),
    "lastConfiguredBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfigurationEvent" (
    "id" TEXT NOT NULL,
    "configurationId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "connectionType" TEXT,
    "eventDetails" TEXT,
    "performedBy" TEXT,
    "performedByName" TEXT,
    "result" TEXT NOT NULL DEFAULT 'success',
    "errorMessage" TEXT,
    "errorCode" TEXT,
    "durationMs" INTEGER,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConfigurationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveDiagnosticSession" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "passportId" TEXT NOT NULL,
    "configurationId" TEXT,
    "serialNumber" TEXT,
    "deviceModel" TEXT,
    "deviceType" TEXT,
    "connectionType" TEXT,
    "engineerId" TEXT,
    "engineerName" TEXT,
    "agentAvailable" BOOLEAN NOT NULL DEFAULT false,
    "agentVersion" TEXT,
    "osInfo" TEXT,
    "hostname" TEXT,
    "overallStatus" TEXT NOT NULL DEFAULT 'Unknown',
    "healthScore" INTEGER NOT NULL DEFAULT 0,
    "healthGrade" TEXT NOT NULL DEFAULT 'unknown',
    "hardwareScore" INTEGER NOT NULL DEFAULT 0,
    "communicationScore" INTEGER NOT NULL DEFAULT 0,
    "driverScore" INTEGER NOT NULL DEFAULT 0,
    "firmwareScore" INTEGER NOT NULL DEFAULT 0,
    "networkScore" INTEGER NOT NULL DEFAULT 0,
    "printingScore" INTEGER NOT NULL DEFAULT 0,
    "hardwareHealthResult" TEXT,
    "driverValidationResult" TEXT,
    "firmwareValidationResult" TEXT,
    "communicationResult" TEXT,
    "printEngineResult" TEXT,
    "capabilityResult" TEXT,
    "errorDetectionResult" TEXT,
    "troubleshootingResult" TEXT,
    "predictiveHealthResult" TEXT,
    "healthScoreBreakdown" TEXT,
    "diagnosticReportResult" TEXT,
    "resourceRecommendations" TEXT,
    "issuesCount" INTEGER NOT NULL DEFAULT 0,
    "warningsCount" INTEGER NOT NULL DEFAULT 0,
    "errorsCount" INTEGER NOT NULL DEFAULT 0,
    "requiresMaintenance" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "diagnosticDurationMs" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiveDiagnosticSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstallationRecord" (
    "id" TEXT NOT NULL,
    "passportId" TEXT NOT NULL,
    "installNumber" TEXT NOT NULL,
    "installationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "engineerId" TEXT,
    "engineerName" TEXT,
    "customerId" TEXT,
    "customerName" TEXT,
    "customerLocation" TEXT,
    "connectionType" TEXT,
    "initialFirmware" TEXT,
    "initialDriver" TEXT,
    "deviceConfig" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstallationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceHistoryEntry" (
    "id" TEXT NOT NULL,
    "passportId" TEXT NOT NULL,
    "serviceNumber" TEXT NOT NULL,
    "serviceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "engineerId" TEXT,
    "engineerName" TEXT,
    "activityType" TEXT NOT NULL,
    "previousValue" TEXT,
    "currentValue" TEXT,
    "details" TEXT,
    "customerId" TEXT,
    "customerName" TEXT,
    "result" TEXT NOT NULL DEFAULT 'successful',
    "resultDetails" TEXT,
    "diagnosticSessionId" TEXT,
    "configurationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceHistoryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EngineerActivityLog" (
    "id" TEXT NOT NULL,
    "engineerId" TEXT NOT NULL,
    "engineerName" TEXT,
    "engineerEmail" TEXT,
    "passportId" TEXT NOT NULL,
    "customerId" TEXT,
    "customerName" TEXT,
    "activity" TEXT NOT NULL,
    "result" TEXT NOT NULL DEFAULT 'successful',
    "resultData" TEXT,
    "activityTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EngineerActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceTimelineEvent" (
    "id" TEXT NOT NULL,
    "passportId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "actorId" TEXT,
    "actorName" TEXT,
    "previousValue" TEXT,
    "newValue" TEXT,
    "relatedId" TEXT,
    "relatedType" TEXT,
    "metadata" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceTimelineEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmartNotification" (
    "id" TEXT NOT NULL,
    "passportId" TEXT NOT NULL,
    "serialNumber" TEXT,
    "deviceModel" TEXT,
    "notificationType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'warning',
    "conditionData" TEXT,
    "actionUrl" TEXT,
    "actionLabel" TEXT,
    "targetRole" TEXT NOT NULL DEFAULT 'engineer',
    "targetUserId" TEXT,
    "deliveryStatus" TEXT NOT NULL DEFAULT 'pending',
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),
    "dedupKey" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmartNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceLifecycleCounter" (
    "id" TEXT NOT NULL,
    "passportId" TEXT NOT NULL,
    "totalScans" INTEGER NOT NULL DEFAULT 0,
    "lastScanAt" TIMESTAMP(3),
    "totalDiagnostics" INTEGER NOT NULL DEFAULT 0,
    "successfulDiagnostics" INTEGER NOT NULL DEFAULT 0,
    "failedDiagnostics" INTEGER NOT NULL DEFAULT 0,
    "driverInstallCount" INTEGER NOT NULL DEFAULT 0,
    "driverUpdateCount" INTEGER NOT NULL DEFAULT 0,
    "firmwareUpdateCount" INTEGER NOT NULL DEFAULT 0,
    "serviceCount" INTEGER NOT NULL DEFAULT 0,
    "repairCount" INTEGER NOT NULL DEFAULT 0,
    "maintenanceCount" INTEGER NOT NULL DEFAULT 0,
    "configurationCount" INTEGER NOT NULL DEFAULT 0,
    "testPrintCount" INTEGER NOT NULL DEFAULT 0,
    "isRegistered" BOOLEAN NOT NULL DEFAULT false,
    "registeredAt" TIMESTAMP(3),
    "lifecycleStage" TEXT NOT NULL DEFAULT 'discovered',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceLifecycleCounter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceCategory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "productFamily" TEXT,
    "supportedInterfaces" TEXT,
    "defaultProtocol" TEXT,
    "supportedOS" TEXT,
    "sortIndex" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapabilityDefinition" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "capabilityGroup" TEXT,
    "isQbitRelevant" BOOLEAN NOT NULL DEFAULT true,
    "affectsDiscovery" BOOLEAN NOT NULL DEFAULT false,
    "affectsConfiguration" BOOLEAN NOT NULL DEFAULT false,
    "affectsDiagnostics" BOOLEAN NOT NULL DEFAULT false,
    "affectsLifecycle" BOOLEAN NOT NULL DEFAULT false,
    "sortIndex" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CapabilityDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCapability" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "capabilityId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "overrideName" TEXT,
    "overrideIcon" TEXT,
    "sortIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductCapability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryCapability" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "capabilityId" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT true,
    "sortIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoryCapability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConnectionTypeDefinition" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "protocol" TEXT,
    "supportsDiscovery" BOOLEAN NOT NULL DEFAULT false,
    "requiresDesktopAgent" BOOLEAN NOT NULL DEFAULT false,
    "supportsConfiguration" BOOLEAN NOT NULL DEFAULT true,
    "supportsDiagnostics" BOOLEAN NOT NULL DEFAULT true,
    "sortIndex" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConnectionTypeDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductConnectionType" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "connectionTypeId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "supportsAutoConfig" BOOLEAN NOT NULL DEFAULT false,
    "sortIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductConnectionType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryConnectionType" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "connectionTypeId" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT true,
    "sortIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoryConnectionType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationAdapterDefinition" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "adapterClass" TEXT NOT NULL,
    "protocol" TEXT,
    "requiresDesktopAgent" BOOLEAN NOT NULL DEFAULT false,
    "supportsLiveDiagnostics" BOOLEAN NOT NULL DEFAULT true,
    "supportsConfiguration" BOOLEAN NOT NULL DEFAULT true,
    "supportsFirmwareOps" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunicationAdapterDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryAdapterMapping" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "adapterId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sortIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoryAdapterMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdapterConnectionType" (
    "id" TEXT NOT NULL,
    "adapterId" TEXT NOT NULL,
    "connectionTypeId" TEXT NOT NULL,
    "supportsDiscovery" BOOLEAN NOT NULL DEFAULT false,
    "supportsConfiguration" BOOLEAN NOT NULL DEFAULT true,
    "supportsDiagnostics" BOOLEAN NOT NULL DEFAULT true,
    "sortIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdapterConnectionType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "OperatingSystem_name_key" ON "OperatingSystem"("name");

-- CreateIndex
CREATE UNIQUE INDEX "OperatingSystem_slug_key" ON "OperatingSystem"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "DownloadCategory_name_key" ON "DownloadCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DownloadCategory_slug_key" ON "DownloadCategory"("slug");

-- CreateIndex
CREATE INDEX "Download_categoryId_idx" ON "Download"("categoryId");

-- CreateIndex
CREATE INDEX "Download_visibility_idx" ON "Download"("visibility");

-- CreateIndex
CREATE INDEX "Download_featured_idx" ON "Download"("featured");

-- CreateIndex
CREATE INDEX "Download_latest_idx" ON "Download"("latest");

-- CreateIndex
CREATE INDEX "DownloadOS_osId_idx" ON "DownloadOS"("osId");

-- CreateIndex
CREATE INDEX "ReleaseNote_downloadId_idx" ON "ReleaseNote"("downloadId");

-- CreateIndex
CREATE INDEX "ReleaseNote_isCurrent_idx" ON "ReleaseNote"("isCurrent");

-- CreateIndex
CREATE INDEX "DownloadHistory_userId_idx" ON "DownloadHistory"("userId");

-- CreateIndex
CREATE INDEX "DownloadHistory_downloadId_idx" ON "DownloadHistory"("downloadId");

-- CreateIndex
CREATE INDEX "DownloadHistory_downloadedAt_idx" ON "DownloadHistory"("downloadedAt");

-- CreateIndex
CREATE INDEX "FavoriteDownload_userId_idx" ON "FavoriteDownload"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteDownload_userId_downloadId_key" ON "FavoriteDownload"("userId", "downloadId");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_name_key" ON "Driver"("name");

-- CreateIndex
CREATE INDEX "DriverVersion_driverId_idx" ON "DriverVersion"("driverId");

-- CreateIndex
CREATE INDEX "DriverVersion_isCurrent_idx" ON "DriverVersion"("isCurrent");

-- CreateIndex
CREATE UNIQUE INDEX "Firmware_name_key" ON "Firmware"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SDK_name_key" ON "SDK"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Utility_name_key" ON "Utility"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Manual_name_key" ON "Manual"("name");

-- CreateIndex
CREATE UNIQUE INDEX "InstallationGuide_slug_key" ON "InstallationGuide"("slug");

-- CreateIndex
CREATE INDEX "InstallationStep_guideId_idx" ON "InstallationStep"("guideId");

-- CreateIndex
CREATE INDEX "InstallationStep_stepNumber_idx" ON "InstallationStep"("stepNumber");

-- CreateIndex
CREATE INDEX "RequiredTool_guideId_idx" ON "RequiredTool"("guideId");

-- CreateIndex
CREATE INDEX "SafetyInstruction_guideId_idx" ON "SafetyInstruction"("guideId");

-- CreateIndex
CREATE INDEX "ConfigurationGuide_guideId_idx" ON "ConfigurationGuide"("guideId");

-- CreateIndex
CREATE INDEX "WiringDiagram_guideId_idx" ON "WiringDiagram"("guideId");

-- CreateIndex
CREATE INDEX "InstallationChecklist_guideId_idx" ON "InstallationChecklist"("guideId");

-- CreateIndex
CREATE INDEX "InstallationChecklist_group_idx" ON "InstallationChecklist"("group");

-- CreateIndex
CREATE INDEX "ProductInstallationGuide_guideId_idx" ON "ProductInstallationGuide"("guideId");

-- CreateIndex
CREATE INDEX "InstallationFAQ_guideId_idx" ON "InstallationFAQ"("guideId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeCategory_name_key" ON "KnowledgeCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeCategory_slug_key" ON "KnowledgeCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeArticle_slug_key" ON "KnowledgeArticle"("slug");

-- CreateIndex
CREATE INDEX "KnowledgeArticle_categoryId_idx" ON "KnowledgeArticle"("categoryId");

-- CreateIndex
CREATE INDEX "KnowledgeArticle_featured_idx" ON "KnowledgeArticle"("featured");

-- CreateIndex
CREATE INDEX "KnowledgeArticle_popular_idx" ON "KnowledgeArticle"("popular");

-- CreateIndex
CREATE INDEX "KnowledgeArticle_latest_idx" ON "KnowledgeArticle"("latest");

-- CreateIndex
CREATE INDEX "ArticleSection_articleId_idx" ON "ArticleSection"("articleId");

-- CreateIndex
CREATE INDEX "FAQ_categoryId_idx" ON "FAQ"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "TroubleshootingIssue_slug_key" ON "TroubleshootingIssue"("slug");

-- CreateIndex
CREATE INDEX "TroubleshootingIssue_productId_idx" ON "TroubleshootingIssue"("productId");

-- CreateIndex
CREATE INDEX "TroubleshootingStep_issueId_idx" ON "TroubleshootingStep"("issueId");

-- CreateIndex
CREATE INDEX "TroubleshootingStep_stepNumber_idx" ON "TroubleshootingStep"("stepNumber");

-- CreateIndex
CREATE UNIQUE INDEX "CommonError_code_key" ON "CommonError"("code");

-- CreateIndex
CREATE INDEX "CommonError_productId_idx" ON "CommonError"("productId");

-- CreateIndex
CREATE INDEX "CommonError_severity_idx" ON "CommonError"("severity");

-- CreateIndex
CREATE INDEX "Solution_issueId_idx" ON "Solution"("issueId");

-- CreateIndex
CREATE INDEX "Solution_errorId_idx" ON "Solution"("errorId");

-- CreateIndex
CREATE INDEX "RelatedAsset_issueId_idx" ON "RelatedAsset"("issueId");

-- CreateIndex
CREATE INDEX "RelatedAsset_errorId_idx" ON "RelatedAsset"("errorId");

-- CreateIndex
CREATE INDEX "RelatedAsset_articleId_idx" ON "RelatedAsset"("articleId");

-- CreateIndex
CREATE INDEX "ArticleBookmark_userId_idx" ON "ArticleBookmark"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleBookmark_userId_articleId_key" ON "ArticleBookmark"("userId", "articleId");

-- CreateIndex
CREATE INDEX "ArticleFeedback_articleId_idx" ON "ArticleFeedback"("articleId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entity_idx" ON "AuditLog"("entity");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");

-- CreateIndex
CREATE INDEX "Announcement_type_idx" ON "Announcement"("type");

-- CreateIndex
CREATE INDEX "Announcement_visibility_idx" ON "Announcement"("visibility");

-- CreateIndex
CREATE INDEX "Announcement_active_idx" ON "Announcement"("active");

-- CreateIndex
CREATE INDEX "SystemMetric_metric_idx" ON "SystemMetric"("metric");

-- CreateIndex
CREATE INDEX "SystemMetric_category_idx" ON "SystemMetric"("category");

-- CreateIndex
CREATE INDEX "SystemMetric_recordedAt_idx" ON "SystemMetric"("recordedAt");

-- CreateIndex
CREATE INDEX "ActivityFeed_userId_idx" ON "ActivityFeed"("userId");

-- CreateIndex
CREATE INDEX "ActivityFeed_createdAt_idx" ON "ActivityFeed"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AssetCategory_name_key" ON "AssetCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AssetCategory_slug_key" ON "AssetCategory"("slug");

-- CreateIndex
CREATE INDEX "AssetCategory_parentId_idx" ON "AssetCategory"("parentId");

-- CreateIndex
CREATE INDEX "AssetCategory_sortOrder_idx" ON "AssetCategory"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");

-- CreateIndex
CREATE INDEX "RolePermission_role_idx" ON "RolePermission"("role");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_role_permissionId_key" ON "RolePermission"("role", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_userId_key" ON "UserPreference"("userId");

-- CreateIndex
CREATE INDEX "UserPreference_userId_idx" ON "UserPreference"("userId");

-- CreateIndex
CREATE INDEX "AdminNotification_read_idx" ON "AdminNotification"("read");

-- CreateIndex
CREATE INDEX "AdminNotification_category_idx" ON "AdminNotification"("category");

-- CreateIndex
CREATE INDEX "AdminNotification_targetUserId_idx" ON "AdminNotification"("targetUserId");

-- CreateIndex
CREATE INDEX "CustomerInquiry_status_idx" ON "CustomerInquiry"("status");

-- CreateIndex
CREATE INDEX "CustomerInquiry_priority_idx" ON "CustomerInquiry"("priority");

-- CreateIndex
CREATE INDEX "CustomerInquiry_createdAt_idx" ON "CustomerInquiry"("createdAt");

-- CreateIndex
CREATE INDEX "PublicPageVisit_page_idx" ON "PublicPageVisit"("page");

-- CreateIndex
CREATE INDEX "PublicPageVisit_visitedAt_idx" ON "PublicPageVisit"("visitedAt");

-- CreateIndex
CREATE INDEX "PublicProductView_productId_idx" ON "PublicProductView"("productId");

-- CreateIndex
CREATE INDEX "PublicProductView_viewedAt_idx" ON "PublicProductView"("viewedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerNewsletter_email_key" ON "CustomerNewsletter"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerNewsletter_unsubscribeToken_key" ON "CustomerNewsletter"("unsubscribeToken");

-- CreateIndex
CREATE INDEX "CustomerNewsletter_active_idx" ON "CustomerNewsletter"("active");

-- CreateIndex
CREATE INDEX "PublicContactMessage_handled_idx" ON "PublicContactMessage"("handled");

-- CreateIndex
CREATE INDEX "PublicContactMessage_category_idx" ON "PublicContactMessage"("category");

-- CreateIndex
CREATE INDEX "AIConversation_userId_idx" ON "AIConversation"("userId");

-- CreateIndex
CREATE INDEX "AIConversation_pinned_idx" ON "AIConversation"("pinned");

-- CreateIndex
CREATE INDEX "AIMessage_conversationId_idx" ON "AIMessage"("conversationId");

-- CreateIndex
CREATE INDEX "AIMessage_role_idx" ON "AIMessage"("role");

-- CreateIndex
CREATE INDEX "SearchHistory_userId_idx" ON "SearchHistory"("userId");

-- CreateIndex
CREATE INDEX "SearchHistory_createdAt_idx" ON "SearchHistory"("createdAt");

-- CreateIndex
CREATE INDEX "SuggestedQuestion_active_idx" ON "SuggestedQuestion"("active");

-- CreateIndex
CREATE INDEX "SuggestedQuestion_category_idx" ON "SuggestedQuestion"("category");

-- CreateIndex
CREATE INDEX "AIFeedback_messageId_idx" ON "AIFeedback"("messageId");

-- CreateIndex
CREATE INDEX "AIFeedback_rating_idx" ON "AIFeedback"("rating");

-- CreateIndex
CREATE INDEX "SourceReference_messageId_idx" ON "SourceReference"("messageId");

-- CreateIndex
CREATE INDEX "SourceReference_sourceType_idx" ON "SourceReference"("sourceType");

-- CreateIndex
CREATE INDEX "ImportJob_type_idx" ON "ImportJob"("type");

-- CreateIndex
CREATE INDEX "ImportJob_status_idx" ON "ImportJob"("status");

-- CreateIndex
CREATE INDEX "ImportJob_createdAt_idx" ON "ImportJob"("createdAt");

-- CreateIndex
CREATE INDEX "ImportLog_jobId_idx" ON "ImportLog"("jobId");

-- CreateIndex
CREATE INDEX "ImportLog_status_idx" ON "ImportLog"("status");

-- CreateIndex
CREATE INDEX "ContentVersion_entityType_entityId_idx" ON "ContentVersion"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ContentVersion_version_idx" ON "ContentVersion"("version");

-- CreateIndex
CREATE INDEX "ContentVersion_createdAt_idx" ON "ContentVersion"("createdAt");

-- CreateIndex
CREATE INDEX "MediaFile_folder_idx" ON "MediaFile"("folder");

-- CreateIndex
CREATE INDEX "MediaFile_mimeType_idx" ON "MediaFile"("mimeType");

-- CreateIndex
CREATE INDEX "MediaFile_createdAt_idx" ON "MediaFile"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SEOConfiguration_slug_key" ON "SEOConfiguration"("slug");

-- CreateIndex
CREATE INDEX "SEOConfiguration_entityType_entityId_idx" ON "SEOConfiguration"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "SEOConfiguration_slug_idx" ON "SEOConfiguration"("slug");

-- CreateIndex
CREATE INDEX "QRMapping_entityType_entityId_idx" ON "QRMapping"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "QRMapping_qrType_idx" ON "QRMapping"("qrType");

-- CreateIndex
CREATE INDEX "SlugHistory_entityType_entityId_idx" ON "SlugHistory"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "SlugHistory_oldSlug_idx" ON "SlugHistory"("oldSlug");

-- CreateIndex
CREATE UNIQUE INDEX "FSMCustomerAsset_serialNumber_key" ON "FSMCustomerAsset"("serialNumber");

-- CreateIndex
CREATE INDEX "FSMCustomerAsset_customerId_idx" ON "FSMCustomerAsset"("customerId");

-- CreateIndex
CREATE INDEX "FSMCustomerAsset_model_idx" ON "FSMCustomerAsset"("model");

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrder_jobNumber_key" ON "WorkOrder"("jobNumber");

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrder_publicTrackingCode_key" ON "WorkOrder"("publicTrackingCode");

-- CreateIndex
CREATE INDEX "WorkOrder_status_idx" ON "WorkOrder"("status");

-- CreateIndex
CREATE INDEX "WorkOrder_assignedEngineerId_idx" ON "WorkOrder"("assignedEngineerId");

-- CreateIndex
CREATE INDEX "WorkOrder_customerId_idx" ON "WorkOrder"("customerId");

-- CreateIndex
CREATE INDEX "WorkOrder_assetId_idx" ON "WorkOrder"("assetId");

-- CreateIndex
CREATE INDEX "WorkOrder_scheduledDate_idx" ON "WorkOrder"("scheduledDate");

-- CreateIndex
CREATE INDEX "WorkOrder_type_idx" ON "WorkOrder"("type");

-- CreateIndex
CREATE INDEX "JobTimeline_workOrderId_idx" ON "JobTimeline"("workOrderId");

-- CreateIndex
CREATE INDEX "JobTimeline_occurredAt_idx" ON "JobTimeline"("occurredAt");

-- CreateIndex
CREATE INDEX "WorkOrderPhoto_workOrderId_idx" ON "WorkOrderPhoto"("workOrderId");

-- CreateIndex
CREATE INDEX "WorkOrderPhoto_category_idx" ON "WorkOrderPhoto"("category");

-- CreateIndex
CREATE INDEX "CustomerSignature_workOrderId_idx" ON "CustomerSignature"("workOrderId");

-- CreateIndex
CREATE INDEX "EngineerNote_workOrderId_idx" ON "EngineerNote"("workOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "CompletionReport_workOrderId_key" ON "CompletionReport"("workOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "CompletionReport_reportNumber_key" ON "CompletionReport"("reportNumber");

-- CreateIndex
CREATE INDEX "CompletionReport_workOrderId_idx" ON "CompletionReport"("workOrderId");

-- CreateIndex
CREATE INDEX "NotificationLog_workOrderId_idx" ON "NotificationLog"("workOrderId");

-- CreateIndex
CREATE INDEX "NotificationLog_channel_idx" ON "NotificationLog"("channel");

-- CreateIndex
CREATE INDEX "NotificationLog_sentAt_idx" ON "NotificationLog"("sentAt");

-- CreateIndex
CREATE INDEX "NotificationLog_status_idx" ON "NotificationLog"("status");

-- CreateIndex
CREATE INDEX "NotificationLog_recipientRole_idx" ON "NotificationLog"("recipientRole");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationTemplate_code_key" ON "NotificationTemplate"("code");

-- CreateIndex
CREATE INDEX "NotificationTemplate_event_idx" ON "NotificationTemplate"("event");

-- CreateIndex
CREATE INDEX "NotificationTemplate_channel_idx" ON "NotificationTemplate"("channel");

-- CreateIndex
CREATE INDEX "NotificationTemplate_recipientType_idx" ON "NotificationTemplate"("recipientType");

-- CreateIndex
CREATE INDEX "NotificationTemplate_isActive_idx" ON "NotificationTemplate"("isActive");

-- CreateIndex
CREATE INDEX "Notification_recipientId_readAt_idx" ON "Notification"("recipientId", "readAt");

-- CreateIndex
CREATE INDEX "Notification_recipientType_idx" ON "Notification"("recipientType");

-- CreateIndex
CREATE INDEX "Notification_category_idx" ON "Notification"("category");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_workOrderId_idx" ON "Notification"("workOrderId");

-- CreateIndex
CREATE INDEX "EmailQueue_status_nextRetryAt_idx" ON "EmailQueue"("status", "nextRetryAt");

-- CreateIndex
CREATE INDEX "EmailQueue_workOrderId_idx" ON "EmailQueue"("workOrderId");

-- CreateIndex
CREATE INDEX "EmailQueue_recipientUserId_idx" ON "EmailQueue"("recipientUserId");

-- CreateIndex
CREATE INDEX "EmailQueue_createdAt_idx" ON "EmailQueue"("createdAt");

-- CreateIndex
CREATE INDEX "WhatsAppQueue_status_nextRetryAt_idx" ON "WhatsAppQueue"("status", "nextRetryAt");

-- CreateIndex
CREATE INDEX "WhatsAppQueue_workOrderId_idx" ON "WhatsAppQueue"("workOrderId");

-- CreateIndex
CREATE INDEX "WhatsAppQueue_recipientUserId_idx" ON "WhatsAppQueue"("recipientUserId");

-- CreateIndex
CREATE INDEX "WhatsAppQueue_createdAt_idx" ON "WhatsAppQueue"("createdAt");

-- CreateIndex
CREATE INDEX "Reminder_status_dueAt_idx" ON "Reminder"("status", "dueAt");

-- CreateIndex
CREATE INDEX "Reminder_workOrderId_idx" ON "Reminder"("workOrderId");

-- CreateIndex
CREATE INDEX "Reminder_recipientType_idx" ON "Reminder"("recipientType");

-- CreateIndex
CREATE UNIQUE INDEX "TrackingToken_token_key" ON "TrackingToken"("token");

-- CreateIndex
CREATE INDEX "TrackingToken_workOrderId_idx" ON "TrackingToken"("workOrderId");

-- CreateIndex
CREATE INDEX "TrackingToken_isActive_idx" ON "TrackingToken"("isActive");

-- CreateIndex
CREATE INDEX "TrackingToken_expiresAt_idx" ON "TrackingToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerFeedback_workOrderId_key" ON "CustomerFeedback"("workOrderId");

-- CreateIndex
CREATE INDEX "CustomerFeedback_workOrderId_idx" ON "CustomerFeedback"("workOrderId");

-- CreateIndex
CREATE INDEX "CustomerFeedback_overallRating_idx" ON "CustomerFeedback"("overallRating");

-- CreateIndex
CREATE INDEX "CustomerFeedback_submittedAt_idx" ON "CustomerFeedback"("submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "InstallationRating_engineerId_key" ON "InstallationRating"("engineerId");

-- CreateIndex
CREATE INDEX "InstallationRating_engineerId_idx" ON "InstallationRating"("engineerId");

-- CreateIndex
CREATE INDEX "InstallationRating_averageRating_idx" ON "InstallationRating"("averageRating");

-- CreateIndex
CREATE INDEX "EngineerLocation_engineerId_capturedAt_idx" ON "EngineerLocation"("engineerId", "capturedAt");

-- CreateIndex
CREATE INDEX "EngineerLocation_workOrderId_idx" ON "EngineerLocation"("workOrderId");

-- CreateIndex
CREATE INDEX "EngineerLocation_capturedAt_idx" ON "EngineerLocation"("capturedAt");

-- CreateIndex
CREATE INDEX "OfflineSyncQueue_engineerId_status_idx" ON "OfflineSyncQueue"("engineerId", "status");

-- CreateIndex
CREATE INDEX "OfflineSyncQueue_status_createdAt_idx" ON "OfflineSyncQueue"("status", "createdAt");

-- CreateIndex
CREATE INDEX "OfflineSyncQueue_clientQueueId_idx" ON "OfflineSyncQueue"("clientQueueId");

-- CreateIndex
CREATE UNIQUE INDEX "QbitProduct_slug_key" ON "QbitProduct"("slug");

-- CreateIndex
CREATE INDEX "QbitProduct_slug_idx" ON "QbitProduct"("slug");

-- CreateIndex
CREATE INDEX "QbitProduct_categoryId_idx" ON "QbitProduct"("categoryId");

-- CreateIndex
CREATE INDEX "QbitProduct_deviceType_idx" ON "QbitProduct"("deviceType");

-- CreateIndex
CREATE INDEX "QbitProduct_isFeatured_idx" ON "QbitProduct"("isFeatured");

-- CreateIndex
CREATE INDEX "QbitProduct_isTrending_idx" ON "QbitProduct"("isTrending");

-- CreateIndex
CREATE INDEX "QbitProduct_status_idx" ON "QbitProduct"("status");

-- CreateIndex
CREATE INDEX "QbitProduct_isActive_idx" ON "QbitProduct"("isActive");

-- CreateIndex
CREATE INDEX "Resource_type_idx" ON "Resource"("type");

-- CreateIndex
CREATE INDEX "Resource_status_idx" ON "Resource"("status");

-- CreateIndex
CREATE INDEX "Resource_visibility_idx" ON "Resource"("visibility");

-- CreateIndex
CREATE INDEX "Resource_name_idx" ON "Resource"("name");

-- CreateIndex
CREATE INDEX "Resource_urlType_idx" ON "Resource"("urlType");

-- CreateIndex
CREATE INDEX "Resource_storageProvider_idx" ON "Resource"("storageProvider");

-- CreateIndex
CREATE INDEX "Resource_extension_idx" ON "Resource"("extension");

-- CreateIndex
CREATE INDEX "ProductResourceMapping_productId_idx" ON "ProductResourceMapping"("productId");

-- CreateIndex
CREATE INDEX "ProductResourceMapping_resourceId_idx" ON "ProductResourceMapping"("resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductResourceMapping_productId_resourceId_key" ON "ProductResourceMapping"("productId", "resourceId");

-- CreateIndex
CREATE INDEX "ProductRelation_productId_idx" ON "ProductRelation"("productId");

-- CreateIndex
CREATE INDEX "ProductRelation_relatedId_idx" ON "ProductRelation"("relatedId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductRelation_productId_relatedId_key" ON "ProductRelation"("productId", "relatedId");

-- CreateIndex
CREATE INDEX "ProductOS_productId_idx" ON "ProductOS"("productId");

-- CreateIndex
CREATE INDEX "ProductMedia_productId_type_idx" ON "ProductMedia"("productId", "type");

-- CreateIndex
CREATE INDEX "ProductMedia_productId_sortIndex_idx" ON "ProductMedia"("productId", "sortIndex");

-- CreateIndex
CREATE INDEX "ProductMedia_visibility_idx" ON "ProductMedia"("visibility");

-- CreateIndex
CREATE INDEX "ProductSpecification_productId_idx" ON "ProductSpecification"("productId");

-- CreateIndex
CREATE INDEX "ProductFeature_productId_idx" ON "ProductFeature"("productId");

-- CreateIndex
CREATE INDEX "HardwareSignature_productId_idx" ON "HardwareSignature"("productId");

-- CreateIndex
CREATE INDEX "HardwareSignature_vendorId_productIdCode_idx" ON "HardwareSignature"("vendorId", "productIdCode");

-- CreateIndex
CREATE INDEX "HardwareSignature_macPrefix_idx" ON "HardwareSignature"("macPrefix");

-- CreateIndex
CREATE INDEX "HardwareSignature_chipUid_idx" ON "HardwareSignature"("chipUid");

-- CreateIndex
CREATE INDEX "HardwareSignature_factoryDeviceUuid_idx" ON "HardwareSignature"("factoryDeviceUuid");

-- CreateIndex
CREATE INDEX "HardwareSignature_ethernetMac_idx" ON "HardwareSignature"("ethernetMac");

-- CreateIndex
CREATE INDEX "HardwareSignature_bluetoothMac_idx" ON "HardwareSignature"("bluetoothMac");

-- CreateIndex
CREATE UNIQUE INDEX "ScanSession_sessionToken_key" ON "ScanSession"("sessionToken");

-- CreateIndex
CREATE INDEX "ScanSession_engineerId_idx" ON "ScanSession"("engineerId");

-- CreateIndex
CREATE INDEX "ScanSession_customerId_idx" ON "ScanSession"("customerId");

-- CreateIndex
CREATE INDEX "ScanSession_startedAt_idx" ON "ScanSession"("startedAt");

-- CreateIndex
CREATE INDEX "ScanSession_status_idx" ON "ScanSession"("status");

-- CreateIndex
CREATE INDEX "DetectedDevice_scanSessionId_idx" ON "DetectedDevice"("scanSessionId");

-- CreateIndex
CREATE INDEX "DetectedDevice_connectionType_idx" ON "DetectedDevice"("connectionType");

-- CreateIndex
CREATE INDEX "DetectedDevice_status_idx" ON "DetectedDevice"("status");

-- CreateIndex
CREATE INDEX "DetectedDevice_matchedProductId_idx" ON "DetectedDevice"("matchedProductId");

-- CreateIndex
CREATE INDEX "DetectedDevice_vendorId_productIdCode_idx" ON "DetectedDevice"("vendorId", "productIdCode");

-- CreateIndex
CREATE INDEX "DetectedDevice_macAddress_idx" ON "DetectedDevice"("macAddress");

-- CreateIndex
CREATE INDEX "UnknownDevice_scanSessionId_idx" ON "UnknownDevice"("scanSessionId");

-- CreateIndex
CREATE INDEX "UnknownDevice_vendorId_productIdCode_idx" ON "UnknownDevice"("vendorId", "productIdCode");

-- CreateIndex
CREATE INDEX "UnknownDevice_mappedProductId_idx" ON "UnknownDevice"("mappedProductId");

-- CreateIndex
CREATE INDEX "UnknownDevice_hardwareId_idx" ON "UnknownDevice"("hardwareId");

-- CreateIndex
CREATE UNIQUE INDEX "DevicePassport_passportNumber_key" ON "DevicePassport"("passportNumber");

-- CreateIndex
CREATE UNIQUE INDEX "DevicePassport_detectedDeviceId_key" ON "DevicePassport"("detectedDeviceId");

-- CreateIndex
CREATE UNIQUE INDEX "DevicePassport_deviceUuid_key" ON "DevicePassport"("deviceUuid");

-- CreateIndex
CREATE UNIQUE INDEX "DevicePassport_hardwareFingerprint_key" ON "DevicePassport"("hardwareFingerprint");

-- CreateIndex
CREATE INDEX "DevicePassport_productId_idx" ON "DevicePassport"("productId");

-- CreateIndex
CREATE INDEX "DevicePassport_serialNumber_idx" ON "DevicePassport"("serialNumber");

-- CreateIndex
CREATE INDEX "DevicePassport_vendorId_productIdCode_idx" ON "DevicePassport"("vendorId", "productIdCode");

-- CreateIndex
CREATE INDEX "DevicePassport_hardwareId_idx" ON "DevicePassport"("hardwareId");

-- CreateIndex
CREATE INDEX "DevicePassport_hardwareFingerprint_idx" ON "DevicePassport"("hardwareFingerprint");

-- CreateIndex
CREATE INDEX "DevicePassport_deviceUuid_idx" ON "DevicePassport"("deviceUuid");

-- CreateIndex
CREATE INDEX "DevicePassport_chipUid_idx" ON "DevicePassport"("chipUid");

-- CreateIndex
CREATE INDEX "DevicePassport_usbDeviceInstanceId_idx" ON "DevicePassport"("usbDeviceInstanceId");

-- CreateIndex
CREATE INDEX "DevicePassport_usbContainerId_idx" ON "DevicePassport"("usbContainerId");

-- CreateIndex
CREATE INDEX "DevicePassport_ethernetMacAddress_idx" ON "DevicePassport"("ethernetMacAddress");

-- CreateIndex
CREATE INDEX "DevicePassport_bluetoothMacAddress_idx" ON "DevicePassport"("bluetoothMacAddress");

-- CreateIndex
CREATE INDEX "DevicePassport_factoryDeviceUuid_idx" ON "DevicePassport"("factoryDeviceUuid");

-- CreateIndex
CREATE INDEX "DevicePassport_duplicateSerialFlag_idx" ON "DevicePassport"("duplicateSerialFlag");

-- CreateIndex
CREATE INDEX "DevicePassport_customerAssetId_idx" ON "DevicePassport"("customerAssetId");

-- CreateIndex
CREATE INDEX "DevicePassport_branchId_idx" ON "DevicePassport"("branchId");

-- CreateIndex
CREATE INDEX "DevicePassport_assignedEngineerId_idx" ON "DevicePassport"("assignedEngineerId");

-- CreateIndex
CREATE INDEX "DevicePassport_deviceStatus_idx" ON "DevicePassport"("deviceStatus");

-- CreateIndex
CREATE INDEX "DevicePassport_fingerprintQuality_idx" ON "DevicePassport"("fingerprintQuality");

-- CreateIndex
CREATE INDEX "DevicePassport_customerId_idx" ON "DevicePassport"("customerId");

-- CreateIndex
CREATE INDEX "DevicePassport_dealerId_idx" ON "DevicePassport"("dealerId");

-- CreateIndex
CREATE INDEX "DevicePassport_invoiceNumber_idx" ON "DevicePassport"("invoiceNumber");

-- CreateIndex
CREATE INDEX "DevicePassport_qrCode_idx" ON "DevicePassport"("qrCode");

-- CreateIndex
CREATE INDEX "DevicePassport_registrationDate_idx" ON "DevicePassport"("registrationDate");

-- CreateIndex
CREATE UNIQUE INDEX "DriverInformation_passportId_key" ON "DriverInformation"("passportId");

-- CreateIndex
CREATE INDEX "DriverInformation_passportId_idx" ON "DriverInformation"("passportId");

-- CreateIndex
CREATE INDEX "DriverInformation_driverStatus_idx" ON "DriverInformation"("driverStatus");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceWarranty_passportId_key" ON "DeviceWarranty"("passportId");

-- CreateIndex
CREATE INDEX "DeviceWarranty_passportId_idx" ON "DeviceWarranty"("passportId");

-- CreateIndex
CREATE INDEX "DeviceWarranty_warrantyStatus_idx" ON "DeviceWarranty"("warrantyStatus");

-- CreateIndex
CREATE INDEX "DriverHistory_passportId_idx" ON "DriverHistory"("passportId");

-- CreateIndex
CREATE INDEX "DriverHistory_occurredAt_idx" ON "DriverHistory"("occurredAt");

-- CreateIndex
CREATE INDEX "DriverHistory_eventType_idx" ON "DriverHistory"("eventType");

-- CreateIndex
CREATE INDEX "FirmwareRelease_firmwareId_idx" ON "FirmwareRelease"("firmwareId");

-- CreateIndex
CREATE INDEX "FirmwareRelease_version_idx" ON "FirmwareRelease"("version");

-- CreateIndex
CREATE INDEX "FirmwareRelease_isLatest_idx" ON "FirmwareRelease"("isLatest");

-- CreateIndex
CREATE INDEX "FirmwareRelease_releaseDate_idx" ON "FirmwareRelease"("releaseDate");

-- CreateIndex
CREATE INDEX "FirmwareCompatibility_firmwareReleaseId_idx" ON "FirmwareCompatibility"("firmwareReleaseId");

-- CreateIndex
CREATE INDEX "FirmwareCompatibility_productId_idx" ON "FirmwareCompatibility"("productId");

-- CreateIndex
CREATE INDEX "FirmwareCompatibility_deviceModel_idx" ON "FirmwareCompatibility"("deviceModel");

-- CreateIndex
CREATE INDEX "FirmwareCompatibility_vendorId_productIdCode_idx" ON "FirmwareCompatibility"("vendorId", "productIdCode");

-- CreateIndex
CREATE UNIQUE INDEX "FirmwareInformation_passportId_key" ON "FirmwareInformation"("passportId");

-- CreateIndex
CREATE INDEX "FirmwareInformation_passportId_idx" ON "FirmwareInformation"("passportId");

-- CreateIndex
CREATE INDEX "FirmwareInformation_firmwareStatus_idx" ON "FirmwareInformation"("firmwareStatus");

-- CreateIndex
CREATE INDEX "FirmwareInformation_latestReleaseId_idx" ON "FirmwareInformation"("latestReleaseId");

-- CreateIndex
CREATE INDEX "FirmwareHistory_passportId_idx" ON "FirmwareHistory"("passportId");

-- CreateIndex
CREATE INDEX "FirmwareHistory_occurredAt_idx" ON "FirmwareHistory"("occurredAt");

-- CreateIndex
CREATE INDEX "FirmwareHistory_eventType_idx" ON "FirmwareHistory"("eventType");

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosticSession_sessionToken_key" ON "DiagnosticSession"("sessionToken");

-- CreateIndex
CREATE INDEX "DiagnosticSession_passportId_idx" ON "DiagnosticSession"("passportId");

-- CreateIndex
CREATE INDEX "DiagnosticSession_engineerId_idx" ON "DiagnosticSession"("engineerId");

-- CreateIndex
CREATE INDEX "DiagnosticSession_healthGrade_idx" ON "DiagnosticSession"("healthGrade");

-- CreateIndex
CREATE INDEX "DiagnosticSession_startedAt_idx" ON "DiagnosticSession"("startedAt");

-- CreateIndex
CREATE INDEX "DiagnosticSession_status_idx" ON "DiagnosticSession"("status");

-- CreateIndex
CREATE INDEX "DiagnosticFinding_sessionId_idx" ON "DiagnosticFinding"("sessionId");

-- CreateIndex
CREATE INDEX "DiagnosticFinding_category_idx" ON "DiagnosticFinding"("category");

-- CreateIndex
CREATE INDEX "DiagnosticFinding_severity_idx" ON "DiagnosticFinding"("severity");

-- CreateIndex
CREATE INDEX "DiagnosticFinding_certainty_idx" ON "DiagnosticFinding"("certainty");

-- CreateIndex
CREATE INDEX "DiagnosticRecommendation_sessionId_idx" ON "DiagnosticRecommendation"("sessionId");

-- CreateIndex
CREATE INDEX "DiagnosticRecommendation_findingId_idx" ON "DiagnosticRecommendation"("findingId");

-- CreateIndex
CREATE INDEX "DiagnosticRecommendation_actionType_idx" ON "DiagnosticRecommendation"("actionType");

-- CreateIndex
CREATE INDEX "DiagnosticRecommendation_priority_idx" ON "DiagnosticRecommendation"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "HealthScore_sessionId_key" ON "HealthScore"("sessionId");

-- CreateIndex
CREATE INDEX "HealthScore_sessionId_idx" ON "HealthScore"("sessionId");

-- CreateIndex
CREATE INDEX "HealthScore_overallGrade_idx" ON "HealthScore"("overallGrade");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceTestSession_sessionToken_key" ON "DeviceTestSession"("sessionToken");

-- CreateIndex
CREATE INDEX "DeviceTestSession_passportId_idx" ON "DeviceTestSession"("passportId");

-- CreateIndex
CREATE INDEX "DeviceTestSession_engineerId_idx" ON "DeviceTestSession"("engineerId");

-- CreateIndex
CREATE INDEX "DeviceTestSession_overallStatus_idx" ON "DeviceTestSession"("overallStatus");

-- CreateIndex
CREATE INDEX "DeviceTestSession_startedAt_idx" ON "DeviceTestSession"("startedAt");

-- CreateIndex
CREATE INDEX "TestResult_sessionId_idx" ON "TestResult"("sessionId");

-- CreateIndex
CREATE INDEX "TestResult_testCategory_idx" ON "TestResult"("testCategory");

-- CreateIndex
CREATE INDEX "TestResult_status_idx" ON "TestResult"("status");

-- CreateIndex
CREATE INDEX "TestResult_testType_idx" ON "TestResult"("testType");

-- CreateIndex
CREATE UNIQUE INDEX "TestReport_reportNumber_key" ON "TestReport"("reportNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TestReport_sessionId_key" ON "TestReport"("sessionId");

-- CreateIndex
CREATE INDEX "TestReport_sessionId_idx" ON "TestReport"("sessionId");

-- CreateIndex
CREATE INDEX "TestReport_generatedAt_idx" ON "TestReport"("generatedAt");

-- CreateIndex
CREATE INDEX "Branch_customerId_idx" ON "Branch"("customerId");

-- CreateIndex
CREATE INDEX "Branch_city_idx" ON "Branch"("city");

-- CreateIndex
CREATE INDEX "Branch_state_idx" ON "Branch"("state");

-- CreateIndex
CREATE INDEX "Branch_isActive_idx" ON "Branch"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "FleetReport_reportNumber_key" ON "FleetReport"("reportNumber");

-- CreateIndex
CREATE INDEX "FleetReport_reportType_idx" ON "FleetReport"("reportType");

-- CreateIndex
CREATE INDEX "FleetReport_generatedAt_idx" ON "FleetReport"("generatedAt");

-- CreateIndex
CREATE INDEX "FleetReport_generatedById_idx" ON "FleetReport"("generatedById");

-- CreateIndex
CREATE INDEX "AnalyticsSnapshot_snapshotType_snapshotDate_idx" ON "AnalyticsSnapshot"("snapshotType", "snapshotDate");

-- CreateIndex
CREATE INDEX "AnalyticsSnapshot_snapshotDate_idx" ON "AnalyticsSnapshot"("snapshotDate");

-- CreateIndex
CREATE INDEX "BusinessMetric_metricKey_idx" ON "BusinessMetric"("metricKey");

-- CreateIndex
CREATE INDEX "BusinessMetric_metricCategory_idx" ON "BusinessMetric"("metricCategory");

-- CreateIndex
CREATE INDEX "BusinessMetric_snapshotDate_idx" ON "BusinessMetric"("snapshotDate");

-- CreateIndex
CREATE INDEX "EngineerMetric_engineerId_idx" ON "EngineerMetric"("engineerId");

-- CreateIndex
CREATE INDEX "EngineerMetric_snapshotDate_idx" ON "EngineerMetric"("snapshotDate");

-- CreateIndex
CREATE INDEX "DeviceMetric_passportId_idx" ON "DeviceMetric"("passportId");

-- CreateIndex
CREATE INDEX "DeviceMetric_deviceType_idx" ON "DeviceMetric"("deviceType");

-- CreateIndex
CREATE INDEX "DeviceMetric_snapshotDate_idx" ON "DeviceMetric"("snapshotDate");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerAccount_mobileNumber_key" ON "CustomerAccount"("mobileNumber");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerAccount_userId_key" ON "CustomerAccount"("userId");

-- CreateIndex
CREATE INDEX "CustomerAccount_mobileNumber_idx" ON "CustomerAccount"("mobileNumber");

-- CreateIndex
CREATE INDEX "CustomerAccount_email_idx" ON "CustomerAccount"("email");

-- CreateIndex
CREATE INDEX "CustomerAccount_status_idx" ON "CustomerAccount"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseRecord_purchaseId_key" ON "PurchaseRecord"("purchaseId");

-- CreateIndex
CREATE INDEX "PurchaseRecord_customerId_idx" ON "PurchaseRecord"("customerId");

-- CreateIndex
CREATE INDEX "PurchaseRecord_productId_idx" ON "PurchaseRecord"("productId");

-- CreateIndex
CREATE INDEX "PurchaseRecord_modelNumber_idx" ON "PurchaseRecord"("modelNumber");

-- CreateIndex
CREATE INDEX "PurchaseRecord_serialNumber_idx" ON "PurchaseRecord"("serialNumber");

-- CreateIndex
CREATE INDEX "PurchaseRecord_purchaseDate_idx" ON "PurchaseRecord"("purchaseDate");

-- CreateIndex
CREATE INDEX "PurchaseRecord_invoiceNumber_idx" ON "PurchaseRecord"("invoiceNumber");

-- CreateIndex
CREATE INDEX "PurchaseInvoice_purchaseId_idx" ON "PurchaseInvoice"("purchaseId");

-- CreateIndex
CREATE INDEX "PurchaseInvoice_documentType_idx" ON "PurchaseInvoice"("documentType");

-- CreateIndex
CREATE INDEX "PurchaseInvoice_extractionStatus_idx" ON "PurchaseInvoice"("extractionStatus");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceConfiguration_configurationNumber_key" ON "DeviceConfiguration"("configurationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceConfiguration_passportId_key" ON "DeviceConfiguration"("passportId");

-- CreateIndex
CREATE INDEX "DeviceConfiguration_passportId_idx" ON "DeviceConfiguration"("passportId");

-- CreateIndex
CREATE INDEX "DeviceConfiguration_serialNumber_idx" ON "DeviceConfiguration"("serialNumber");

-- CreateIndex
CREATE INDEX "DeviceConfiguration_configurationStatus_idx" ON "DeviceConfiguration"("configurationStatus");

-- CreateIndex
CREATE INDEX "DeviceConfiguration_activeConnectionType_idx" ON "DeviceConfiguration"("activeConnectionType");

-- CreateIndex
CREATE INDEX "DeviceConfiguration_lastConfiguredAt_idx" ON "DeviceConfiguration"("lastConfiguredAt");

-- CreateIndex
CREATE INDEX "ConfigurationEvent_configurationId_idx" ON "ConfigurationEvent"("configurationId");

-- CreateIndex
CREATE INDEX "ConfigurationEvent_eventType_idx" ON "ConfigurationEvent"("eventType");

-- CreateIndex
CREATE INDEX "ConfigurationEvent_connectionType_idx" ON "ConfigurationEvent"("connectionType");

-- CreateIndex
CREATE INDEX "ConfigurationEvent_result_idx" ON "ConfigurationEvent"("result");

-- CreateIndex
CREATE INDEX "ConfigurationEvent_occurredAt_idx" ON "ConfigurationEvent"("occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "LiveDiagnosticSession_sessionToken_key" ON "LiveDiagnosticSession"("sessionToken");

-- CreateIndex
CREATE INDEX "LiveDiagnosticSession_passportId_idx" ON "LiveDiagnosticSession"("passportId");

-- CreateIndex
CREATE INDEX "LiveDiagnosticSession_configurationId_idx" ON "LiveDiagnosticSession"("configurationId");

-- CreateIndex
CREATE INDEX "LiveDiagnosticSession_serialNumber_idx" ON "LiveDiagnosticSession"("serialNumber");

-- CreateIndex
CREATE INDEX "LiveDiagnosticSession_overallStatus_idx" ON "LiveDiagnosticSession"("overallStatus");

-- CreateIndex
CREATE INDEX "LiveDiagnosticSession_healthGrade_idx" ON "LiveDiagnosticSession"("healthGrade");

-- CreateIndex
CREATE INDEX "LiveDiagnosticSession_engineerId_idx" ON "LiveDiagnosticSession"("engineerId");

-- CreateIndex
CREATE INDEX "LiveDiagnosticSession_startedAt_idx" ON "LiveDiagnosticSession"("startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "InstallationRecord_installNumber_key" ON "InstallationRecord"("installNumber");

-- CreateIndex
CREATE INDEX "InstallationRecord_passportId_idx" ON "InstallationRecord"("passportId");

-- CreateIndex
CREATE INDEX "InstallationRecord_engineerId_idx" ON "InstallationRecord"("engineerId");

-- CreateIndex
CREATE INDEX "InstallationRecord_customerId_idx" ON "InstallationRecord"("customerId");

-- CreateIndex
CREATE INDEX "InstallationRecord_installationDate_idx" ON "InstallationRecord"("installationDate");

-- CreateIndex
CREATE INDEX "InstallationRecord_status_idx" ON "InstallationRecord"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceHistoryEntry_serviceNumber_key" ON "ServiceHistoryEntry"("serviceNumber");

-- CreateIndex
CREATE INDEX "ServiceHistoryEntry_passportId_idx" ON "ServiceHistoryEntry"("passportId");

-- CreateIndex
CREATE INDEX "ServiceHistoryEntry_engineerId_idx" ON "ServiceHistoryEntry"("engineerId");

-- CreateIndex
CREATE INDEX "ServiceHistoryEntry_activityType_idx" ON "ServiceHistoryEntry"("activityType");

-- CreateIndex
CREATE INDEX "ServiceHistoryEntry_serviceDate_idx" ON "ServiceHistoryEntry"("serviceDate");

-- CreateIndex
CREATE INDEX "ServiceHistoryEntry_result_idx" ON "ServiceHistoryEntry"("result");

-- CreateIndex
CREATE INDEX "EngineerActivityLog_engineerId_idx" ON "EngineerActivityLog"("engineerId");

-- CreateIndex
CREATE INDEX "EngineerActivityLog_passportId_idx" ON "EngineerActivityLog"("passportId");

-- CreateIndex
CREATE INDEX "EngineerActivityLog_activity_idx" ON "EngineerActivityLog"("activity");

-- CreateIndex
CREATE INDEX "EngineerActivityLog_activityTime_idx" ON "EngineerActivityLog"("activityTime");

-- CreateIndex
CREATE INDEX "EngineerActivityLog_result_idx" ON "EngineerActivityLog"("result");

-- CreateIndex
CREATE INDEX "DeviceTimelineEvent_passportId_idx" ON "DeviceTimelineEvent"("passportId");

-- CreateIndex
CREATE INDEX "DeviceTimelineEvent_eventType_idx" ON "DeviceTimelineEvent"("eventType");

-- CreateIndex
CREATE INDEX "DeviceTimelineEvent_occurredAt_idx" ON "DeviceTimelineEvent"("occurredAt");

-- CreateIndex
CREATE INDEX "DeviceTimelineEvent_actorId_idx" ON "DeviceTimelineEvent"("actorId");

-- CreateIndex
CREATE INDEX "SmartNotification_passportId_idx" ON "SmartNotification"("passportId");

-- CreateIndex
CREATE INDEX "SmartNotification_notificationType_idx" ON "SmartNotification"("notificationType");

-- CreateIndex
CREATE INDEX "SmartNotification_severity_idx" ON "SmartNotification"("severity");

-- CreateIndex
CREATE INDEX "SmartNotification_targetRole_idx" ON "SmartNotification"("targetRole");

-- CreateIndex
CREATE INDEX "SmartNotification_targetUserId_idx" ON "SmartNotification"("targetUserId");

-- CreateIndex
CREATE INDEX "SmartNotification_deliveryStatus_idx" ON "SmartNotification"("deliveryStatus");

-- CreateIndex
CREATE INDEX "SmartNotification_dedupKey_idx" ON "SmartNotification"("dedupKey");

-- CreateIndex
CREATE INDEX "SmartNotification_createdAt_idx" ON "SmartNotification"("createdAt");

-- CreateIndex
CREATE INDEX "SmartNotification_expiresAt_idx" ON "SmartNotification"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceLifecycleCounter_passportId_key" ON "DeviceLifecycleCounter"("passportId");

-- CreateIndex
CREATE INDEX "DeviceLifecycleCounter_passportId_idx" ON "DeviceLifecycleCounter"("passportId");

-- CreateIndex
CREATE INDEX "DeviceLifecycleCounter_isRegistered_idx" ON "DeviceLifecycleCounter"("isRegistered");

-- CreateIndex
CREATE INDEX "DeviceLifecycleCounter_lifecycleStage_idx" ON "DeviceLifecycleCounter"("lifecycleStage");

-- CreateIndex
CREATE INDEX "DeviceLifecycleCounter_lastScanAt_idx" ON "DeviceLifecycleCounter"("lastScanAt");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceCategory_slug_key" ON "DeviceCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceCategory_name_key" ON "DeviceCategory"("name");

-- CreateIndex
CREATE INDEX "DeviceCategory_slug_idx" ON "DeviceCategory"("slug");

-- CreateIndex
CREATE INDEX "DeviceCategory_productFamily_idx" ON "DeviceCategory"("productFamily");

-- CreateIndex
CREATE INDEX "DeviceCategory_sortIndex_idx" ON "DeviceCategory"("sortIndex");

-- CreateIndex
CREATE INDEX "DeviceCategory_isActive_idx" ON "DeviceCategory"("isActive");

-- CreateIndex
CREATE INDEX "DeviceCategory_status_idx" ON "DeviceCategory"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CapabilityDefinition_slug_key" ON "CapabilityDefinition"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CapabilityDefinition_name_key" ON "CapabilityDefinition"("name");

-- CreateIndex
CREATE INDEX "CapabilityDefinition_slug_idx" ON "CapabilityDefinition"("slug");

-- CreateIndex
CREATE INDEX "CapabilityDefinition_capabilityGroup_idx" ON "CapabilityDefinition"("capabilityGroup");

-- CreateIndex
CREATE INDEX "CapabilityDefinition_sortIndex_idx" ON "CapabilityDefinition"("sortIndex");

-- CreateIndex
CREATE INDEX "CapabilityDefinition_isActive_idx" ON "CapabilityDefinition"("isActive");

-- CreateIndex
CREATE INDEX "CapabilityDefinition_isQbitRelevant_idx" ON "CapabilityDefinition"("isQbitRelevant");

-- CreateIndex
CREATE INDEX "ProductCapability_productId_idx" ON "ProductCapability"("productId");

-- CreateIndex
CREATE INDEX "ProductCapability_capabilityId_idx" ON "ProductCapability"("capabilityId");

-- CreateIndex
CREATE INDEX "ProductCapability_isEnabled_idx" ON "ProductCapability"("isEnabled");

-- CreateIndex
CREATE INDEX "ProductCapability_sortIndex_idx" ON "ProductCapability"("sortIndex");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCapability_productId_capabilityId_key" ON "ProductCapability"("productId", "capabilityId");

-- CreateIndex
CREATE INDEX "CategoryCapability_categoryId_idx" ON "CategoryCapability"("categoryId");

-- CreateIndex
CREATE INDEX "CategoryCapability_capabilityId_idx" ON "CategoryCapability"("capabilityId");

-- CreateIndex
CREATE INDEX "CategoryCapability_isDefault_idx" ON "CategoryCapability"("isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryCapability_categoryId_capabilityId_key" ON "CategoryCapability"("categoryId", "capabilityId");

-- CreateIndex
CREATE UNIQUE INDEX "ConnectionTypeDefinition_slug_key" ON "ConnectionTypeDefinition"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ConnectionTypeDefinition_name_key" ON "ConnectionTypeDefinition"("name");

-- CreateIndex
CREATE INDEX "ConnectionTypeDefinition_slug_idx" ON "ConnectionTypeDefinition"("slug");

-- CreateIndex
CREATE INDEX "ConnectionTypeDefinition_sortIndex_idx" ON "ConnectionTypeDefinition"("sortIndex");

-- CreateIndex
CREATE INDEX "ConnectionTypeDefinition_isActive_idx" ON "ConnectionTypeDefinition"("isActive");

-- CreateIndex
CREATE INDEX "ConnectionTypeDefinition_supportsDiscovery_idx" ON "ConnectionTypeDefinition"("supportsDiscovery");

-- CreateIndex
CREATE INDEX "ProductConnectionType_productId_idx" ON "ProductConnectionType"("productId");

-- CreateIndex
CREATE INDEX "ProductConnectionType_connectionTypeId_idx" ON "ProductConnectionType"("connectionTypeId");

-- CreateIndex
CREATE INDEX "ProductConnectionType_isPrimary_idx" ON "ProductConnectionType"("isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "ProductConnectionType_productId_connectionTypeId_key" ON "ProductConnectionType"("productId", "connectionTypeId");

-- CreateIndex
CREATE INDEX "CategoryConnectionType_categoryId_idx" ON "CategoryConnectionType"("categoryId");

-- CreateIndex
CREATE INDEX "CategoryConnectionType_connectionTypeId_idx" ON "CategoryConnectionType"("connectionTypeId");

-- CreateIndex
CREATE INDEX "CategoryConnectionType_isDefault_idx" ON "CategoryConnectionType"("isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryConnectionType_categoryId_connectionTypeId_key" ON "CategoryConnectionType"("categoryId", "connectionTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "CommunicationAdapterDefinition_slug_key" ON "CommunicationAdapterDefinition"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CommunicationAdapterDefinition_name_key" ON "CommunicationAdapterDefinition"("name");

-- CreateIndex
CREATE INDEX "CommunicationAdapterDefinition_slug_idx" ON "CommunicationAdapterDefinition"("slug");

-- CreateIndex
CREATE INDEX "CommunicationAdapterDefinition_adapterClass_idx" ON "CommunicationAdapterDefinition"("adapterClass");

-- CreateIndex
CREATE INDEX "CommunicationAdapterDefinition_protocol_idx" ON "CommunicationAdapterDefinition"("protocol");

-- CreateIndex
CREATE INDEX "CommunicationAdapterDefinition_isActive_idx" ON "CommunicationAdapterDefinition"("isActive");

-- CreateIndex
CREATE INDEX "CommunicationAdapterDefinition_sortIndex_idx" ON "CommunicationAdapterDefinition"("sortIndex");

-- CreateIndex
CREATE INDEX "CategoryAdapterMapping_categoryId_idx" ON "CategoryAdapterMapping"("categoryId");

-- CreateIndex
CREATE INDEX "CategoryAdapterMapping_adapterId_idx" ON "CategoryAdapterMapping"("adapterId");

-- CreateIndex
CREATE INDEX "CategoryAdapterMapping_isPrimary_idx" ON "CategoryAdapterMapping"("isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryAdapterMapping_categoryId_adapterId_key" ON "CategoryAdapterMapping"("categoryId", "adapterId");

-- CreateIndex
CREATE INDEX "AdapterConnectionType_adapterId_idx" ON "AdapterConnectionType"("adapterId");

-- CreateIndex
CREATE INDEX "AdapterConnectionType_connectionTypeId_idx" ON "AdapterConnectionType"("connectionTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "AdapterConnectionType_adapterId_connectionTypeId_key" ON "AdapterConnectionType"("adapterId", "connectionTypeId");

-- AddForeignKey
ALTER TABLE "Download" ADD CONSTRAINT "Download_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "DownloadCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DownloadOS" ADD CONSTRAINT "DownloadOS_downloadId_fkey" FOREIGN KEY ("downloadId") REFERENCES "Download"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DownloadOS" ADD CONSTRAINT "DownloadOS_osId_fkey" FOREIGN KEY ("osId") REFERENCES "OperatingSystem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReleaseNote" ADD CONSTRAINT "ReleaseNote_downloadId_fkey" FOREIGN KEY ("downloadId") REFERENCES "Download"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DownloadHistory" ADD CONSTRAINT "DownloadHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DownloadHistory" ADD CONSTRAINT "DownloadHistory_downloadId_fkey" FOREIGN KEY ("downloadId") REFERENCES "Download"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteDownload" ADD CONSTRAINT "FavoriteDownload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteDownload" ADD CONSTRAINT "FavoriteDownload_downloadId_fkey" FOREIGN KEY ("downloadId") REFERENCES "Download"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverVersion" ADD CONSTRAINT "DriverVersion_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationStep" ADD CONSTRAINT "InstallationStep_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "InstallationGuide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequiredTool" ADD CONSTRAINT "RequiredTool_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "InstallationGuide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyInstruction" ADD CONSTRAINT "SafetyInstruction_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "InstallationGuide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfigurationGuide" ADD CONSTRAINT "ConfigurationGuide_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "InstallationGuide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WiringDiagram" ADD CONSTRAINT "WiringDiagram_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "InstallationGuide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationChecklist" ADD CONSTRAINT "InstallationChecklist_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "InstallationGuide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductInstallationGuide" ADD CONSTRAINT "ProductInstallationGuide_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "InstallationGuide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationFAQ" ADD CONSTRAINT "InstallationFAQ_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "InstallationGuide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeArticle" ADD CONSTRAINT "KnowledgeArticle_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "KnowledgeCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleSection" ADD CONSTRAINT "ArticleSection_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "KnowledgeArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TroubleshootingStep" ADD CONSTRAINT "TroubleshootingStep_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "TroubleshootingIssue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleBookmark" ADD CONSTRAINT "ArticleBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleBookmark" ADD CONSTRAINT "ArticleBookmark_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "KnowledgeArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleFeedback" ADD CONSTRAINT "ArticleFeedback_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "KnowledgeArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetCategory" ADD CONSTRAINT "AssetCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "AssetCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicProductView" ADD CONSTRAINT "PublicProductView_productId_fkey" FOREIGN KEY ("productId") REFERENCES "QbitProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIMessage" ADD CONSTRAINT "AIMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AIConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIFeedback" ADD CONSTRAINT "AIFeedback_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "AIMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceReference" ADD CONSTRAINT "SourceReference_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "AIMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportLog" ADD CONSTRAINT "ImportLog_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ImportJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FSMCustomerAsset" ADD CONSTRAINT "FSMCustomerAsset_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "FSMCustomer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "FSMCustomer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "FSMCustomerAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_assignedEngineerId_fkey" FOREIGN KEY ("assignedEngineerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobTimeline" ADD CONSTRAINT "JobTimeline_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderPhoto" ADD CONSTRAINT "WorkOrderPhoto_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerSignature" ADD CONSTRAINT "CustomerSignature_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EngineerNote" ADD CONSTRAINT "EngineerNote_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompletionReport" ADD CONSTRAINT "CompletionReport_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "NotificationTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "NotificationTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailQueue" ADD CONSTRAINT "EmailQueue_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "NotificationTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailQueue" ADD CONSTRAINT "EmailQueue_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppQueue" ADD CONSTRAINT "WhatsAppQueue_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "NotificationTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppQueue" ADD CONSTRAINT "WhatsAppQueue_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingToken" ADD CONSTRAINT "TrackingToken_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerFeedback" ADD CONSTRAINT "CustomerFeedback_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationRating" ADD CONSTRAINT "InstallationRating_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QbitProduct" ADD CONSTRAINT "QbitProduct_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "DeviceCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductResourceMapping" ADD CONSTRAINT "ProductResourceMapping_productId_fkey" FOREIGN KEY ("productId") REFERENCES "QbitProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductResourceMapping" ADD CONSTRAINT "ProductResourceMapping_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductRelation" ADD CONSTRAINT "ProductRelation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "QbitProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductRelation" ADD CONSTRAINT "ProductRelation_relatedId_fkey" FOREIGN KEY ("relatedId") REFERENCES "QbitProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductOS" ADD CONSTRAINT "ProductOS_productId_fkey" FOREIGN KEY ("productId") REFERENCES "QbitProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMedia" ADD CONSTRAINT "ProductMedia_productId_fkey" FOREIGN KEY ("productId") REFERENCES "QbitProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSpecification" ADD CONSTRAINT "ProductSpecification_productId_fkey" FOREIGN KEY ("productId") REFERENCES "QbitProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductFeature" ADD CONSTRAINT "ProductFeature_productId_fkey" FOREIGN KEY ("productId") REFERENCES "QbitProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HardwareSignature" ADD CONSTRAINT "HardwareSignature_productId_fkey" FOREIGN KEY ("productId") REFERENCES "QbitProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetectedDevice" ADD CONSTRAINT "DetectedDevice_scanSessionId_fkey" FOREIGN KEY ("scanSessionId") REFERENCES "ScanSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetectedDevice" ADD CONSTRAINT "DetectedDevice_matchedProductId_fkey" FOREIGN KEY ("matchedProductId") REFERENCES "QbitProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnknownDevice" ADD CONSTRAINT "UnknownDevice_scanSessionId_fkey" FOREIGN KEY ("scanSessionId") REFERENCES "ScanSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnknownDevice" ADD CONSTRAINT "UnknownDevice_mappedProductId_fkey" FOREIGN KEY ("mappedProductId") REFERENCES "QbitProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevicePassport" ADD CONSTRAINT "DevicePassport_detectedDeviceId_fkey" FOREIGN KEY ("detectedDeviceId") REFERENCES "DetectedDevice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevicePassport" ADD CONSTRAINT "DevicePassport_productId_fkey" FOREIGN KEY ("productId") REFERENCES "QbitProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevicePassport" ADD CONSTRAINT "DevicePassport_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevicePassport" ADD CONSTRAINT "DevicePassport_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevicePassport" ADD CONSTRAINT "DevicePassport_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverInformation" ADD CONSTRAINT "DriverInformation_passportId_fkey" FOREIGN KEY ("passportId") REFERENCES "DevicePassport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceWarranty" ADD CONSTRAINT "DeviceWarranty_passportId_fkey" FOREIGN KEY ("passportId") REFERENCES "DevicePassport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverHistory" ADD CONSTRAINT "DriverHistory_passportId_fkey" FOREIGN KEY ("passportId") REFERENCES "DevicePassport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FirmwareRelease" ADD CONSTRAINT "FirmwareRelease_firmwareId_fkey" FOREIGN KEY ("firmwareId") REFERENCES "Firmware"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FirmwareRelease" ADD CONSTRAINT "FirmwareRelease_downloadId_fkey" FOREIGN KEY ("downloadId") REFERENCES "Download"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FirmwareCompatibility" ADD CONSTRAINT "FirmwareCompatibility_firmwareReleaseId_fkey" FOREIGN KEY ("firmwareReleaseId") REFERENCES "FirmwareRelease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FirmwareCompatibility" ADD CONSTRAINT "FirmwareCompatibility_productId_fkey" FOREIGN KEY ("productId") REFERENCES "QbitProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FirmwareInformation" ADD CONSTRAINT "FirmwareInformation_passportId_fkey" FOREIGN KEY ("passportId") REFERENCES "DevicePassport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FirmwareInformation" ADD CONSTRAINT "FirmwareInformation_latestReleaseId_fkey" FOREIGN KEY ("latestReleaseId") REFERENCES "FirmwareRelease"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FirmwareHistory" ADD CONSTRAINT "FirmwareHistory_passportId_fkey" FOREIGN KEY ("passportId") REFERENCES "DevicePassport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FirmwareHistory" ADD CONSTRAINT "FirmwareHistory_firmwareReleaseId_fkey" FOREIGN KEY ("firmwareReleaseId") REFERENCES "FirmwareRelease"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticSession" ADD CONSTRAINT "DiagnosticSession_passportId_fkey" FOREIGN KEY ("passportId") REFERENCES "DevicePassport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticFinding" ADD CONSTRAINT "DiagnosticFinding_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DiagnosticSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticRecommendation" ADD CONSTRAINT "DiagnosticRecommendation_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DiagnosticSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticRecommendation" ADD CONSTRAINT "DiagnosticRecommendation_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "DiagnosticFinding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthScore" ADD CONSTRAINT "HealthScore_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DiagnosticSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceTestSession" ADD CONSTRAINT "DeviceTestSession_passportId_fkey" FOREIGN KEY ("passportId") REFERENCES "DevicePassport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestResult" ADD CONSTRAINT "TestResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DeviceTestSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestReport" ADD CONSTRAINT "TestReport_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DeviceTestSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "FSMCustomer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerAccount" ADD CONSTRAINT "CustomerAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRecord" ADD CONSTRAINT "PurchaseRecord_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRecord" ADD CONSTRAINT "PurchaseRecord_productId_fkey" FOREIGN KEY ("productId") REFERENCES "QbitProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseInvoice" ADD CONSTRAINT "PurchaseInvoice_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "PurchaseRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceConfiguration" ADD CONSTRAINT "DeviceConfiguration_passportId_fkey" FOREIGN KEY ("passportId") REFERENCES "DevicePassport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfigurationEvent" ADD CONSTRAINT "ConfigurationEvent_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "DeviceConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveDiagnosticSession" ADD CONSTRAINT "LiveDiagnosticSession_passportId_fkey" FOREIGN KEY ("passportId") REFERENCES "DevicePassport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveDiagnosticSession" ADD CONSTRAINT "LiveDiagnosticSession_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "DeviceConfiguration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationRecord" ADD CONSTRAINT "InstallationRecord_passportId_fkey" FOREIGN KEY ("passportId") REFERENCES "DevicePassport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceHistoryEntry" ADD CONSTRAINT "ServiceHistoryEntry_passportId_fkey" FOREIGN KEY ("passportId") REFERENCES "DevicePassport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EngineerActivityLog" ADD CONSTRAINT "EngineerActivityLog_passportId_fkey" FOREIGN KEY ("passportId") REFERENCES "DevicePassport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceTimelineEvent" ADD CONSTRAINT "DeviceTimelineEvent_passportId_fkey" FOREIGN KEY ("passportId") REFERENCES "DevicePassport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmartNotification" ADD CONSTRAINT "SmartNotification_passportId_fkey" FOREIGN KEY ("passportId") REFERENCES "DevicePassport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceLifecycleCounter" ADD CONSTRAINT "DeviceLifecycleCounter_passportId_fkey" FOREIGN KEY ("passportId") REFERENCES "DevicePassport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCapability" ADD CONSTRAINT "ProductCapability_productId_fkey" FOREIGN KEY ("productId") REFERENCES "QbitProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCapability" ADD CONSTRAINT "ProductCapability_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "CapabilityDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryCapability" ADD CONSTRAINT "CategoryCapability_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "DeviceCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryCapability" ADD CONSTRAINT "CategoryCapability_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "CapabilityDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductConnectionType" ADD CONSTRAINT "ProductConnectionType_productId_fkey" FOREIGN KEY ("productId") REFERENCES "QbitProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductConnectionType" ADD CONSTRAINT "ProductConnectionType_connectionTypeId_fkey" FOREIGN KEY ("connectionTypeId") REFERENCES "ConnectionTypeDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryConnectionType" ADD CONSTRAINT "CategoryConnectionType_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "DeviceCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryConnectionType" ADD CONSTRAINT "CategoryConnectionType_connectionTypeId_fkey" FOREIGN KEY ("connectionTypeId") REFERENCES "ConnectionTypeDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryAdapterMapping" ADD CONSTRAINT "CategoryAdapterMapping_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "DeviceCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryAdapterMapping" ADD CONSTRAINT "CategoryAdapterMapping_adapterId_fkey" FOREIGN KEY ("adapterId") REFERENCES "CommunicationAdapterDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdapterConnectionType" ADD CONSTRAINT "AdapterConnectionType_adapterId_fkey" FOREIGN KEY ("adapterId") REFERENCES "CommunicationAdapterDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdapterConnectionType" ADD CONSTRAINT "AdapterConnectionType_connectionTypeId_fkey" FOREIGN KEY ("connectionTypeId") REFERENCES "ConnectionTypeDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

