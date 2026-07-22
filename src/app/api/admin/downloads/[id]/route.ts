/**
 * Admin Download Detail API
 * GET    /api/admin/downloads/[id] - Get download details
 * PUT    /api/admin/downloads/[id] - Update download
 * DELETE /api/admin/downloads/[id] - Delete download
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDownload, updateDownload, deleteDownload } from '@/lib/download-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const download = await getDownload(id)

    if (!download) {
      return NextResponse.json({ error: 'Download not found' }, { status: 404 })
    }

    return NextResponse.json(download)
  } catch (error) {
    console.error('Get download error:', error)
    return NextResponse.json({ error: 'Failed to get download' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const updated = await updateDownload(id, {
      name: body.name,
      category: body.category,
      platform: body.platform,
      language: body.language,
      version: body.version,
      description: body.description,
      releaseDate: body.releaseDate ? new Date(body.releaseDate) : undefined,
      changeLog: body.changeLog,
      status: body.status,
      isFeatured: body.isFeatured,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update download error:', error)
    const message = error instanceof Error ? error.message : 'Failed to update download'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const deleted = await deleteDownload(id)

    if (!deleted) {
      return NextResponse.json({ error: 'Download not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete download error:', error)
    return NextResponse.json({ error: 'Failed to delete download' }, { status: 500 })
  }
}
