/**
 * Phase 4 — Resource Repair Script (NON-DESTRUCTIVE, UPDATE only)
 *
 * Fixes 26 Resource records that have:
 * - urlType incorrectly set to 'storage_key' (should be 'external' or 'uploaded')
 * - url field NULL (meaning downloads fail with FILE_NOT_FOUND)
 * - storageKey, publicUrl, storageProvider, extension all NULL
 *
 * Run: DATABASE_URL="..." npx tsx scripts/phase4-resource-repair.ts
 */

import { PrismaClient } from '@prisma/client';
const db = new PrismaClient({ log: ['warn', 'error'] });

// Global resource definitions from seed-global-resources.ts
const GLOBAL_RESOURCES = [
  { name: "4Barcode APK", type: "android_software", url: "https://qbithub.vercel.app/downloads/android/4barcode-v2.4.apk", extension: "apk" },
  { name: "Label Shop", type: "windows_software", url: "https://qbithub.vercel.app/downloads/windows/label-shop-v5.2.exe", extension: "exe" },
  { name: "POS Utility", type: "pos_utility", url: "https://qbithub.vercel.app/downloads/windows/pos-utility-v3.1.exe", extension: "exe" },
  { name: "Windows Driver v2.4.1", type: "windows_driver", url: "https://qbithub.vercel.app/downloads/drivers/thermal-driver-v2.4.1.exe", extension: "exe" },
  { name: "USB Driver", type: "windows_driver", url: "https://qbithub.vercel.app/downloads/drivers/usb-driver-v1.8.exe", extension: "exe" },
  { name: "Thermal Printer User Manual", type: "manual", url: "https://qbithub.vercel.app/downloads/manuals/thermal-user-manual-v4.0.pdf", extension: "pdf" },
  { name: "Quick Start Guide", type: "installation_guide", url: "https://qbithub.vercel.app/downloads/manuals/quick-start-guide-v1.2.pdf", extension: "pdf" },
  { name: "P80UE Firmware v1.8.0", type: "firmware", url: "https://qbithub.vercel.app/downloads/firmware/p80ue-firmware-v1.8.0.bin", extension: "bin" },
  { name: "Installation Video — Thermal Printer Setup", type: "video", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", extension: null },
  { name: "Common Error Guide", type: "troubleshooting", url: "https://qbithub.vercel.app/downloads/troubleshooting/common-error-guide-v2.0.pdf", extension: "pdf" },
  { name: "QBIT SDK", type: "sdk", url: "https://qbithub.vercel.app/downloads/sdk/qbit-sdk-v3.0.zip", extension: "zip" },
];

// Extension mapping by resource type
function extensionFromType(type: string): string | null {
  const map: Record<string, string> = {
    'windows_driver': 'exe',
    'android_software': 'apk',
    'windows_software': 'exe',
    'pos_utility': 'exe',
    'firmware': 'bin',
    'sdk': 'zip',
    'manual': 'pdf',
    'installation_guide': 'pdf',
    'troubleshooting': 'pdf',
    'video': null,
    'maintenance_tool': 'zip',
    'browser_utility': null,
    'other': null,
  };
  return map[type] || null;
}

// Extension from name patterns
function extensionFromName(name: string): string | null {
  const lower = name.toLowerCase();
  if (lower.includes('firmware')) return 'bin';
  if (lower.includes('driver') || lower.includes('driver pack')) return 'exe';
  if (lower.includes('manual') || lower.includes('guide') || lower.includes('user guide')) return 'pdf';
  if (lower.includes('sdk')) return 'zip';
  if (lower.includes('utility') || lower.includes('wizard') || lower.includes('tool') || lower.includes('config')) return 'exe';
  if (lower.includes('apk') || lower.includes('android')) return 'apk';
  if (lower.includes('video') || lower.includes('youtube')) return null;
  return null;
}

async function main() {
  console.log('=== Phase 4: Resource Repair (NON-DESTRUCTIVE UPDATE) ===\n');

  const resources = await db.resource.findMany();
  console.log(`Found ${resources.length} resources in database\n`);

  let fixedCount = 0;

  for (const resource of resources) {
    const updates: Record<string, any> = {};

    // 1. Classify urlType based on url field
    const effectiveUrl = resource.url || resource.storageKey || resource.publicUrl || '';
    
    if (effectiveUrl && (effectiveUrl.startsWith('http://') || effectiveUrl.startsWith('https://'))) {
      // URL is a proper HTTP URL
      if (effectiveUrl.includes('youtube.com') || effectiveUrl.includes('youtu.be')) {
        // YouTube videos → external
        updates.urlType = 'external';
        updates.publicUrl = effectiveUrl;
        updates.storageKey = null;
        updates.storageProvider = null;
      } else if (effectiveUrl.includes('blob.vercel-storage.com')) {
        // Vercel Blob → uploaded (storage key is the blob URL)
        updates.urlType = 'uploaded';
        updates.storageKey = effectiveUrl;
        updates.publicUrl = effectiveUrl;
        updates.storageProvider = 'vercel-blob';
      } else {
        // Regular external URL (qbithub.vercel.app, etc.) → external
        updates.urlType = 'external';
        updates.publicUrl = effectiveUrl;
        updates.storageKey = null;
        updates.storageProvider = null;
      }
    } else if (effectiveUrl && effectiveUrl.startsWith('public/')) {
      // Local storage key (like "public/uploads/driver/...")
      updates.urlType = 'uploaded';
      updates.storageKey = effectiveUrl;
      updates.storageProvider = 'local';
      // Construct publicUrl from storageKey
      updates.publicUrl = '/' + effectiveUrl;
    } else if (!effectiveUrl || effectiveUrl === '') {
      // No URL at all — try to find it from global resources
      const globalMatch = GLOBAL_RESOURCES.find(gr => gr.name === resource.name);
      if (globalMatch) {
        // Found in global resources → set URL
        updates.url = globalMatch.url;
        if (globalMatch.url.startsWith('http://') || globalMatch.url.startsWith('https://')) {
          if (globalMatch.url.includes('youtube.com')) {
            updates.urlType = 'external';
            updates.publicUrl = globalMatch.url;
            updates.storageKey = null;
            updates.storageProvider = null;
          } else {
            updates.urlType = 'external';
            updates.publicUrl = globalMatch.url;
            updates.storageKey = null;
            updates.storageProvider = null;
          }
        } else if (globalMatch.url.startsWith('public/')) {
          updates.urlType = 'uploaded';
          updates.storageKey = globalMatch.url;
          updates.storageProvider = 'local';
          updates.publicUrl = '/' + globalMatch.url;
        }
        if (globalMatch.extension) {
          updates.extension = globalMatch.extension;
        }
      } else {
        // No global match — classify by type and mark as 'uploaded' with local provider
        if (resource.urlType === 'storage_key' || !resource.urlType) {
          updates.urlType = 'uploaded';
        }
        updates.storageProvider = 'local';
      }
    }

    // 2. Fix urlType if it was incorrectly set to 'storage_key'
    if (resource.urlType === 'storage_key') {
      // The 'storage_key' urlType is a legacy value from before V5 redesign
      // If we already classified it above, keep that classification
      // Otherwise, default to 'uploaded'
      if (!updates.urlType) {
        updates.urlType = 'uploaded';
      }
    }

    // 3. Backfill extension from resource type or name
    if (!resource.extension && !updates.extension) {
      const ext = extensionFromType(resource.type) || extensionFromName(resource.name);
      if (ext) {
        updates.extension = ext;
      }
    }

    // 4. Ensure storageProvider is set
    if (!resource.storageProvider && !updates.storageProvider) {
      updates.storageProvider = 'local';
    }

    // 5. If this resource is an uploaded type with a storageKey, set publicUrl
    if (resource.storageKey && resource.storageKey.startsWith('public/') && !resource.publicUrl && !updates.publicUrl) {
      updates.publicUrl = '/' + resource.storageKey;
    }

    // Apply updates if any
    if (Object.keys(updates).length > 0) {
      await db.resource.update({
        where: { id: resource.id },
        data: updates,
      });
      fixedCount++;
      console.log(`  FIX: "${resource.name}" (id=${resource.id}) → ${JSON.stringify(updates)}`);
    } else {
      console.log(`  OK: "${resource.name}" — no changes needed`);
    }
  }

  // Verification
  console.log(`\n=== Phase 4 Verification ===`);
  console.log(`  Fixed ${fixedCount} of ${resources.length} resources`);
  
  // Check all resources now have proper fields
  const allResources = await db.resource.findMany({
    select: { id: true, name: true, urlType: true, extension: true, storageProvider: true, publicUrl: true },
  });
  
  let issues = 0;
  for (const r of allResources) {
    if (!r.urlType || r.urlType === 'storage_key') {
      console.log(`  ISSUE: "${r.name}" urlType=${r.urlType}`);
      issues++;
    }
    if (!r.storageProvider) {
      console.log(`  ISSUE: "${r.name}" storageProvider=null`);
      issues++;
    }
  }
  
  if (issues === 0) {
    console.log(`  ✓ ALL resources have proper urlType and storageProvider`);
  } else {
    console.log(`  ⚠ ${issues} resources still have issues`);
  }
  
  console.log('\n=== Phase 4 Complete ===');
}

main()
  .catch((e) => { console.error('Phase 4 failed:', e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
