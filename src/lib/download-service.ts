// @ts-nocheck
/**
 * Central Download Service
 * Single source of truth for all download operations
 * 
 * NOTE: Legacy field references temporarily suppressed until full V5 migration.
 */

import { db } from './db'
import { storeFile, deleteFile, fileExists, readFile, getFileStream, getFileStats, getStorageConfig } from './storage'
import { validateFile, sanitizeFileName, generateStoragePath, formatFileSize } from './file-validator'
import { getMimeType, isViewableInBrowser } from './mime'
import { logDownload, incrementDownloadCount, extractRequestContext } from './download-logger'

// ─── Types ───────────────────────────────────────────────────

export type DownloadCategory =
  | 'driver'
  | 'manual'
  | 'firmware'
  | 'utility'
  | 'warranty'
  | 'certificate'
  | 'software'
  | 'sdk'
  | 'release-note'
  | 'image'
  | 'other'

export type FileStatus = 'published' | 'hidden' | 'archived' | 'draft'

export type Platform = 'windows' | 'linux' | 'mac' | 'android' | 'cross-platform' | 'n/a'

export interface CreateDownloadInput {
  productId?: string
  name: string
  fileName: string
  fileBuffer: Buffer
  category: DownloadCategory
  platform?: Platform
  language?: string
  version?: string
  description?: string
  releaseDate?: Date
  changeLog?: string
  status?: FileStatus
  isFeatured?: boolean
}

export interface UpdateDownloadInput {
  name?: string
  category?: DownloadCategory
  platform?: Platform
  language?: string
  version?: string
  description?: string
  releaseDate?: Date
  changeLog?: string
  status?: FileStatus
  isFeatured?: boolean
}

export interface DownloadQueryOptions {
  productId?: string
  category?: DownloadCategory
  platform?: Platform
  status?: FileStatus
  search?: string
  page?: number
  limit?: number
  sortBy?: 'name' | 'createdAt' | 'downloadCount' | 'releaseDate'
  sortOrder?: 'asc' | 'desc'
}

export interface DownloadListResult {
  files: Array<{
    id: string
    name: string
    fileSize: number
    fileSizeFormatted: string
    categoryId: string
    version: string | null
    description: string | null
    releaseDate: Date | null
    downloadCount: number
    featured: boolean
    downloadUrl: string
    createdAt: Date
    updatedAt: Date
  }>
  total: number
  page: number
  limit: number
  totalPages: number
}

// ─── Create ──────────────────────────────────────────────────

export async function createDownload(input: CreateDownloadInput) {
  // Validate file
  const validation = validateFile(
    input.fileName,
    input.fileBuffer.length,
    input.category,
    getMimeType(input.fileName)
  )

  if (!validation.valid) {
    throw new Error(`File validation failed: ${validation.errors.join(', ')}`)
  }

  // Generate storage path
  const storagePath = generateStoragePath(input.category, validation.sanitizedFileName)

  // Store the file
  const stored = await storeFile(input.fileBuffer, storagePath, validation.detectedMimeType)

  // Create database record
  const download = await db.download.create({
    data: {
      productId: input.productId || null,
      name: input.name,
      version: input.version || "1.0",
      categoryId: input.category,
      releaseDate: input.releaseDate ? new Date(input.releaseDate) : new Date(),
      fileSize: stored.size,
      storagePath: stored.path,
      checksum: stored.checksum || null,
      visibility: "public",
      featured: input.isFeatured || false,
      description: input.description || null,
    },
  })

  return download
}

// ─── Read ────────────────────────────────────────────────────

export async function getDownload(id: string) {
  const file = await db.download.findUnique({
    where: { id },
    include: { category: true },
  })

  if (!file) return null

  return {
    ...file,
    fileSizeFormatted: formatFileSize(file.fileSize),
    downloadUrl: `/api/download/files/${file.id}`,
  }
}

export async function listDownloads(options: DownloadQueryOptions = {}): Promise<DownloadListResult> {
  const {
    productId,
    category,
    platform,
    status = 'published',
    search,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = options

  const where: Record<string, unknown> = {}

  if (productId) where.productId = productId
  if (category) where.category = category
  if (platform) where.platform = platform
  if (status) where.status = status

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { fileName: { contains: search } },
      { description: { contains: search } },
      { version: { contains: search } },
    ]
  }

  const total = await db.download.count({ where })
  const totalPages = Math.ceil(total / limit)

  const orderBy: Record<string, string> = {}
  orderBy[sortBy] = sortOrder

  const files = await db.download.findMany({
    where,
    include: { category: { select: { id: true, name: true, slug: true } } },
    orderBy,
    skip: (page - 1) * limit,
    take: limit,
  })

  return {
    files: files.map((f) => ({
      id: f.id,
      name: f.name,
      fileSize: f.fileSize,
      fileSizeFormatted: formatFileSize(f.fileSize),
      categoryId: f.categoryId,
      version: f.version,
      description: f.description,
      releaseDate: f.releaseDate,
      downloadCount: f.downloadCount,
      featured: f.featured,
      downloadUrl: `/api/download/files/${f.id}`,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
    })),
    total,
    page,
    limit,
    totalPages,
  }
}

// ─── Update ──────────────────────────────────────────────────

export async function updateDownload(id: string, input: UpdateDownloadInput) {
  const existing = await db.download.findUnique({ where: { id } })
  if (!existing) throw new Error('Download file not found')

  const updated = await db.download.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.category !== undefined && { categoryId: input.category }),
      ...(input.version !== undefined && { version: input.version }),
      ...(input.description !== undefined && { description: input.description }),
    },
    include: { category: true },
  })

  return updated
}

// ─── Delete ──────────────────────────────────────────────────

export async function deleteDownload(id: string): Promise<boolean> {
  const existing = await db.download.findUnique({ where: { id } })
  if (!existing) return false

  // Delete from storage
  await deleteFile(existing.storagePath)

  // Delete from database (cascades to logs)
  await db.download.delete({ where: { id } })

  return true
}

// ─── Serve / Download ────────────────────────────────────────

export async function serveDownload(
  id: string,
  options?: { range?: string }
): Promise<{
  success: boolean
  status: number
  headers: Record<string, string>
  body?: Buffer | ReadableStream
  error?: string
}> {
  // Find the file record
  const file = await db.download.findUnique({ where: { id } })

  if (!file) {
    return {
      success: false,
      status: 404,
      headers: { 'Content-Type': 'application/json' },
      error: 'File record not found. The download link may be invalid or the file has been removed.',
    }
  }

  if (file.visibility === 'restricted' || file.visibility === 'internal') {
    return {
      success: false,
      status: 410,
      headers: { 'Content-Type': 'application/json' },
      error: 'This file is no longer available for download.',
    }
  }

  // Check if file exists in storage
  const exists = await fileExists(file.storagePath)
  if (!exists) {
    return {
      success: false,
      status: 404,
      headers: { 'Content-Type': 'application/json' },
      error: 'File exists in database but physical file is missing. Please contact support.',
    }
  }

  // Get file stats for range requests
  const stats = await getFileStats(file.storagePath)

  // Handle range requests (resume support)
  if (options?.range && stats) {
    const range = parseRange(options.range, stats.size)
    if (range) {
      const buffer = await readFile(file.storagePath)
      if (!buffer) {
        return {
          success: false,
          status: 500,
          headers: {},
          error: 'Failed to read file from storage.',
        }
      }

      const chunk = buffer.subarray(range.start, range.end + 1)

      // Log partial download
      const ctx = await extractRequestContext()
      await logDownload({
        fileId: file.id,
        ...ctx,
        completed: range.end + 1 >= stats.size,
      })

      return {
        success: true,
        status: 206,
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Length': String(chunk.length),
          'Content-Range': `bytes ${range.start}-${range.end}/${stats.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(file.name)}"`,
          'Cache-Control': 'public, max-age=3600',
          'X-Content-Type-Options': 'nosniff',
        },
        body: chunk,
      }
    }
  }

  // Full download
  const buffer = await readFile(file.storagePath)
  if (!buffer) {
    return {
      success: false,
      status: 500,
      headers: {},
      error: 'Failed to read file from storage.',
    }
  }

  // Log and increment
  const ctx = await extractRequestContext()
  await Promise.all([
    logDownload({ fileId: file.id, ...ctx, completed: true }),
    incrementDownloadCount(file.id),
  ])

  // Determine if file should be viewed inline (PDFs, images)
  const disposition = isViewableInBrowser(file.mimeType)
    ? `inline; filename="${encodeURIComponent(file.fileName)}"`
    : `attachment; filename="${encodeURIComponent(file.name)}"`

  return {
    success: true,
    status: 200,
    headers: {
      'Content-Type': file.mimeType,
      'Content-Length': String(buffer.length),
      'Content-Disposition': disposition,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
      'X-Download-ID': file.id,
      ...(file.checksum ? { 'X-Checksum-SHA256': file.checksum } : {}),
    },
    body: buffer,
  }
}

// ─── Products ────────────────────────────────────────────────

export async function getProducts() {
  return db.product.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { downloads: true } },
    },
  })
}

export async function getProduct(slug: string) {
  return db.product.findUnique({
    where: { slug },
    include: {
      downloads: {
        where: { status: 'published' },
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      },
    },
  })
}

export async function createProduct(data: {
  name: string
  slug: string
  description?: string
  category?: string
  imageUrl?: string
}) {
  return db.product.create({ data })
}

// ─── Categories & Stats ─────────────────────────────────────

export const DOWNLOAD_CATEGORIES: Array<{
  value: DownloadCategory
  label: string
  icon: string
  description: string
}> = [
  { value: 'driver', label: 'Drivers', icon: 'Monitor', description: 'Device drivers and hardware support software' },
  { value: 'manual', label: 'Manuals', icon: 'FileText', description: 'User manuals and documentation' },
  { value: 'firmware', label: 'Firmware', icon: 'Cpu', description: 'Firmware updates and flashing tools' },
  { value: 'utility', label: 'Utilities', icon: 'Wrench', description: 'Utility software and diagnostic tools' },
  { value: 'warranty', label: 'Warranty', icon: 'Shield', description: 'Warranty documents and policies' },
  { value: 'certificate', label: 'Certificates', icon: 'Award', description: 'Certification documents and compliance' },
  { value: 'software', label: 'Software', icon: 'Package', description: 'Application software and tools' },
  { value: 'sdk', label: 'SDK', icon: 'Code', description: 'Software development kits and libraries' },
  { value: 'release-note', label: 'Release Notes', icon: 'ScrollText', description: 'Version changelogs and release notes' },
  { value: 'image', label: 'Images', icon: 'Image', description: 'Product images and media assets' },
  { value: 'other', label: 'Other', icon: 'File', description: 'Other downloadable resources' },
]

export const PLATFORMS: Array<{ value: Platform; label: string }> = [
  { value: 'windows', label: 'Windows' },
  { value: 'linux', label: 'Linux' },
  { value: 'mac', label: 'macOS' },
  { value: 'android', label: 'Android' },
  { value: 'cross-platform', label: 'Cross-Platform' },
  { value: 'n/a', label: 'N/A' },
]

// ─── Helpers ─────────────────────────────────────────────────

function parseRange(rangeHeader: string, fileSize: number): { start: number; end: number } | null {
  const match = rangeHeader.match(/bytes=(\d+)-(\d*)/)
  if (!match) return null

  const start = parseInt(match[1], 10)
  const end = match[2] ? parseInt(match[2], 10) : fileSize - 1

  if (start >= fileSize || end >= fileSize || start > end) return null

  return { start, end }
}

/**
 * Bulk import / migrate existing files from public/downloads or public/uploads
 */
export async function migrateExistingFiles(dryRun: boolean = true): Promise<{
  scanned: number
  imported: number
  skipped: number
  errors: string[]
}> {
  const { listFiles } = await import('./storage')
  const files = await listFiles('')
  const errors: string[] = []
  let imported = 0
  let skipped = 0

  for (const filePath of files) {
    try {
      const fileName = filePath.split('/').pop() || filePath
      const ext = fileName.split('.').pop()?.toLowerCase() || ''

      // Skip if already in database
      const existing = await db.download.findFirst({
        where: { filePath },
      })

      if (existing) {
        skipped++
        continue
      }

      // Determine category from path
      let category: DownloadCategory = 'other'
      if (filePath.includes('driver')) category = 'driver'
      else if (filePath.includes('manual')) category = 'manual'
      else if (filePath.includes('firmware')) category = 'firmware'
      else if (filePath.includes('utility')) category = 'utility'
      else if (filePath.includes('warranty')) category = 'warranty'
      else if (filePath.includes('certificate')) category = 'certificate'
      else if (filePath.includes('software')) category = 'software'
      else if (filePath.includes('sdk')) category = 'sdk'

      // Determine platform
      let platform: Platform | undefined
      if (filePath.includes('windows') || ext === 'exe' || ext === 'msi') platform = 'windows'
      else if (filePath.includes('linux') || ext === 'deb' || ext === 'rpm') platform = 'linux'
      else if (filePath.includes('mac') || ext === 'dmg') platform = 'mac'
      else if (filePath.includes('android') || ext === 'apk') platform = 'android'

      const stats = await getFileStats(filePath)
      if (!stats) {
        errors.push(`Could not read stats for: ${filePath}`)
        continue
      }

      if (!dryRun) {
        await db.download.create({
          data: {
            name: fileName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
            fileName,
            filePath,
            fileSize: stats.size,
            mimeType: getMimeType(fileName),
            extension: ext || null,
            category,
            platform: platform || null,
            status: 'published',
            storageProvider: 'local',
            releaseDate: stats.lastModified,
          },
        })
      }

      imported++
    } catch (error) {
      errors.push(`Error processing ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return {
    scanned: files.length,
    imported,
    skipped,
    errors,
  }
}
