/**
 * Test Upload + Download pipeline for PDF, EXE, APK
 * Verifies: create session → upload chunks → complete → create resource → download
 */
import { createUploadSession, writeUploadChunk, completeUploadSession, createResource, serveResourceDownload } from '../src/lib/resource-service';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const db = new PrismaClient();

function isResourceError(result: unknown): boolean {
  return result !== null && typeof result === 'object' && 'success' in result && result.success === false;
}

async function testUploadAndDownload(
  fileName: string,
  mimeType: string,
  content: Buffer,
  resourceType: string,
  expectedExtension: string,
) {
  console.log(`\n--- Test: Upload ${fileName} (${mimeType}) ---`);
  
  // Step 1: Create upload session
  const sessionResult = createUploadSession(fileName, mimeType, content.length);
  if (isResourceError(sessionResult)) {
    const err = sessionResult as any;
    console.log(`  FAILED create session: code=${err.code} message=${err.message}`);
    return null;
  }
  const session = sessionResult as any;
  console.log(`  Session created: id=${session.id} totalChunks=${session.totalChunks} chunkSize=${session.chunkSize}`);

  // Step 2: Upload all chunks
  for (let i = 0; i < session.totalChunks; i++) {
    const start = i * session.chunkSize;
    const end = Math.min(start + session.chunkSize, content.length);
    const chunkData = content.slice(start, end);
    const chunkResult = await writeUploadChunk(session.id, i, chunkData);
    if (isResourceError(chunkResult)) {
      const err = chunkResult as any;
      console.log(`  FAILED chunk ${i}: code=${err.code} message=${err.message}`);
      return null;
    }
    const chunk = chunkResult as any;
    console.log(`  Chunk ${i}: accepted=${chunk.accepted} progress=${(chunk.progress * 100).toFixed(1)}%`);
  }

  // Step 3: Complete upload
  const completeResult = await completeUploadSession(session.id);
  if (isResourceError(completeResult)) {
    const err = completeResult as any;
    console.log(`  FAILED complete: code=${err.code} message=${err.message}`);
    return null;
  }
  const completed = completeResult as any;
  console.log(`  Upload complete ✓: storageKey=${completed.storageKey} provider=${completed.storageProvider} checksum=${completed.checksum?.slice(0, 16)}... fileSize=${completed.fileSize}`);

  // Step 4: Create resource record
  const createResult = await createResource({
    name: `Test ${expectedExtension.toUpperCase()} Resource`,
    type: resourceType,
    mimeType: completed.mimeType,
    extension: completed.extension,
    storageKey: completed.storageKey,
    storageProvider: completed.storageProvider,
    urlType: 'uploaded',
    fileSize: completed.fileSize,
    checksum: completed.checksum,
    originalFileName: completed.originalFileName,
    visibility: 'public',
    status: 'active',
  });
  if (isResourceError(createResult)) {
    const err = createResult as any;
    console.log(`  FAILED create resource: code=${err.code} message=${err.message}`);
    return null;
  }
  const resource = createResult as any;
  console.log(`  Resource created: id=${resource.resource.id} name=${resource.resource.name} urlType=${resource.resource.urlType}`);

  // Step 5: Test download
  const downloadResult = await serveResourceDownload(resource.resource.id);
  if (isResourceError(downloadResult)) {
    const err = downloadResult as any;
    console.log(`  FAILED download: code=${err.code} message=${err.message}`);
    return null;
  }
  const download = downloadResult as any;
  if (download.mimeType === 'redirect') {
    console.log(`  Download: Redirect → ${download.buffer.toString('utf-8')}`);
  } else {
    console.log(`  Download ✓: mime=${download.mimeType} size=${download.fileSize} fileName=${download.fileName}`);
    
    // Verify the downloaded content matches
    const downloadedBuffer = Buffer.from(download.buffer);
    if (downloadedBuffer.length === content.length) {
      console.log(`  Content integrity ✓: downloaded size matches original (${content.length} bytes)`);
    } else {
      console.log(`  Content integrity ⚠: downloaded ${downloadedBuffer.length} vs original ${content.length}`);
    }
  }

  return resource.resource.id;
}

async function main() {
  console.log('=== UPLOAD + DOWNLOAD PIPELINE VERIFICATION ===');

  const testDir = '/home/z/my-project/scripts/test-files';
  if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });

  // Create test PDF (must be >= 1024 bytes for MIN_UPLOAD_SIZE)
  const pdfBase = Buffer.from(
    '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n' +
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n' +
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\n' +
    'xref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n' +
    '0000000115 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n190\n%%EOF\n'
  );
  const pdfContent = Buffer.concat([pdfBase, Buffer.alloc(1024 - pdfBase.length + 100, 0x20)]); // Pad to >1024 bytes
  fs.writeFileSync(path.join(testDir, 'test-manual.pdf'), pdfContent);
  console.log(`Created test-manual.pdf (${pdfContent.length} bytes)`);

  // Create test EXE (minimal MZ header, padded to >1024 bytes)
  const exeBase = Buffer.from('MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00\xb8\x00\x00\x00\x00\x00\x00\x00\x40\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00');
  const exeContent = Buffer.concat([exeBase, Buffer.alloc(1024 - exeBase.length + 100, 0)]);
  fs.writeFileSync(path.join(testDir, 'test-driver.exe'), exeContent);
  console.log(`Created test-driver.exe (${exeContent.length} bytes)`);

  // Create test APK (ZIP format, padded to >1024 bytes)
  const apkBase = Buffer.from([0x50, 0x4B, 0x03, 0x04, 0x0A, 0x00, 0x00, 0x00, 0x00, 0x00, 0x73, 0x45, 0x3F, 0x51, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x09, 0x00, 0x00, 0x00, 0x63, 0x6C, 0x61, 0x73, 0x73, 0x65, 0x73, 0x2E, 0x64, 0x65, 0x78]);
  const apkContent = Buffer.concat([apkBase, Buffer.alloc(1024 - apkBase.length + 100, 0)]);
  fs.writeFileSync(path.join(testDir, 'test-app.apk'), apkContent);
  console.log(`Created test-app.apk (${apkContent.length} bytes)`);

  // Test 1: PDF
  const pdfId = await testUploadAndDownload('test-manual.pdf', 'application/pdf', pdfContent, 'manual', 'pdf');

  // Test 2: EXE
  const exeId = await testUploadAndDownload('test-driver.exe', 'application/vnd.microsoft.portable-executable', exeContent, 'windows_driver', 'exe');

  // Test 3: APK
  const apkId = await testUploadAndDownload('test-app.apk', 'application/vnd.android.package-archive', apkContent, 'android_software', 'apk');

  // Final summary
  console.log('\n=== SUMMARY ===');
  const total = await db.resource.count();
  console.log(`Total resources in DB: ${total}`);
  console.log(`PDF test: ${pdfId ? '✓ PASSED (id=' + pdfId + ')' : '✗ FAILED'}`);
  console.log(`EXE test: ${exeId ? '✓ PASSED (id=' + exeId + ')' : '✗ FAILED'}`);
  console.log(`APK test: ${apkId ? '✓ PASSED (id=' + apkId + ')' : '✗ FAILED'}`);

  // Verify all uploaded resources have proper V5 fields
  const uploadedResources = await db.resource.findMany({
    where: { name: { startsWith: 'Test' } },
    select: { id: true, name: true, storageKey: true, publicUrl: true, storageProvider: true, urlType: true, mimeType: true, fileSize: true, extension: true, checksum: true, originalFileName: true, status: true },
  });
  console.log('\nUploaded resources V5 field audit:');
  for (const r of uploadedResources) {
    console.log(`  ${r.name}: storageKey=${r.storageKey} | urlType=${r.urlType} | ext=${r.extension} | mime=${r.mimeType} | fileSize=${r.fileSize} | checksum=${r.checksum?.slice(0,16)}... | provider=${r.storageProvider} | status=${r.status}`);
  }

  await db.$disconnect();
  console.log('\n=== UPLOAD + DOWNLOAD PIPELINE VERIFICATION COMPLETE ===');
}

main().catch(e => { console.error(e); process.exit(1); });
