/**
 * Download Files List API
 * GET /api/download/files - List downloadable files with filtering
 */

import { NextRequest, NextResponse } from 'next/server'
import { listDownloads, type DownloadCategory, type Platform } from '@/lib/download-service'

const VALID_CATEGORIES = new Set([
  'driver', 'manual', 'firmware', 'utility', 'warranty',
  'certificate', 'software', 'sdk', 'release-note', 'image', 'other',
])

const VALID_PLATFORMS = new Set([
  'windows', 'linux', 'mac', 'android', 'cross-platform', 'n/a',
])

const VALID_STATUSES = new Set(['published', 'hidden', 'archived', 'draft'])

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    const category = searchParams.get('category')
    const platform = searchParams.get('platform')
    const productId = searchParams.get('productId')
    const search = searchParams.get('search')
    const status = searchParams.get('status') || 'published'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Validate parameters
    if (category && !VALID_CATEGORIES.has(category)) {
      return NextResponse.json(
        { error: `Invalid category. Valid: ${Array.from(VALID_CATEGORIES).join(', ')}` },
        { status: 400 }
      )
    }

    if (platform && !VALID_PLATFORMS.has(platform)) {
      return NextResponse.json(
        { error: `Invalid platform. Valid: ${Array.from(VALID_PLATFORMS).join(', ')}` },
        { status: 400 }
      )
    }

    if (status !== 'published' && !VALID_STATUSES.has(status)) {
      return NextResponse.json(
        { error: `Invalid status. Valid: ${Array.from(VALID_STATUSES).join(', ')}` },
        { status: 400 }
      )
    }

    const result = await listDownloads({
      category: category as DownloadCategory | undefined,
      platform: platform as Platform | undefined,
      productId: productId || undefined,
      search: search || undefined,
      status: status as 'published' | 'hidden' | 'archived' | 'draft',
      page,
      limit,
      sortBy: sortBy as 'name' | 'createdAt' | 'downloadCount' | 'releaseDate',
      sortOrder: sortOrder as 'asc' | 'desc',
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Files list API error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve files list', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
