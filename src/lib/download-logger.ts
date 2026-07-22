/**
 * Download Logger
 * Tracks all download events for analytics and auditing.
 * Uses the DownloadHistory and Download models from the current Prisma schema.
 */

import { db } from './db'
import { headers } from 'next/headers'

export interface DownloadLogEntry {
  fileId: string
  userId?: string
  ipAddress?: string
  userAgent?: string
  completed: boolean
}

/**
 * Log a download event
 */
export async function logDownload(entry: DownloadLogEntry): Promise<void> {
  try {
    await db.downloadHistory.create({
      data: {
        userId: entry.userId || "",
        downloadId: entry.fileId,
        ipAddress: entry.ipAddress || null,
        userAgent: entry.userAgent || null,
      },
    })
  } catch (error) {
    // Log errors should never break downloads
    console.error('Failed to log download:', error)
  }
}

/**
 * Increment the download count for a file
 */
export async function incrementDownloadCount(fileId: string): Promise<void> {
  try {
    await db.download.update({
      where: { id: fileId },
      data: { downloadCount: { increment: 1 } },
    })
  } catch (error) {
    // Also try Resource model (V5 resource library)
    try {
      await db.resource.update({
        where: { id: fileId },
        data: { downloadCount: { increment: 1 } },
      })
    } catch (innerError) {
      console.error('Failed to increment download count:', innerError)
    }
  }
}

/**
 * Extract request context for logging
 */
export async function extractRequestContext(): Promise<{
  ipAddress?: string
  userAgent?: string
  referer?: string
}> {
  try {
    const headersList = await headers()
    return {
      ipAddress: headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                 headersList.get('x-real-ip') ||
                 undefined,
      userAgent: headersList.get('user-agent') || undefined,
      referer: headersList.get('referer') || undefined,
    }
  } catch {
    return {}
  }
}
