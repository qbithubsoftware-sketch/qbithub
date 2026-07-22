/**
 * Admin Downloads CRUD API
 * GET  /api/admin/downloads - List all downloads (all statuses)
 * POST /api/admin/downloads - Create download from existing stored file
 */

import { NextRequest, NextResponse } from 'next/server'
import { listDownloads, createDownload } from '@/lib/download-service'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    const result = await listDownloads({
      productId: searchParams.get('productId') || undefined,
      category: searchParams.get('category') as any || undefined,
      platform: searchParams.get('platform') as any || undefined,
      status: (searchParams.get('status') as any) || undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
      sortBy: (searchParams.get('sortBy') as any) || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as any) || 'desc',
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Admin downloads list error:', error)
    return NextResponse.json({ error: 'Failed to list downloads' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Create a download record pointing to an already-stored file
    const { productId, name, fileName, filePath, fileSize, mimeType, category, platform, language, version, description, changeLog, status, isFeatured, checksum, extension, storageProvider } = body

    if (!name || !fileName || !filePath || !category) {
      return NextResponse.json(
        { error: 'name, fileName, filePath, and category are required' },
        { status: 400 }
      )
    }

    const download = await db.download.create({
      data: {
        productId: productId || null,
        name,
        version: version || "1.0",
        categoryId: category,
        releaseDate: new Date(),
        fileSize: fileSize || 0,
        storagePath: filePath || "",
        checksum: checksum || null,
        visibility: "public",
        featured: isFeatured || false,
        description: description || null,
      },
    })

    return NextResponse.json({
      success: true,
      id: download.id,
      downloadUrl: `/api/download/files/${download.id}`,
    }, { status: 201 })
  } catch (error) {
    console.error('Admin create download error:', error)
    return NextResponse.json({ error: 'Failed to create download' }, { status: 500 })
  }
}
