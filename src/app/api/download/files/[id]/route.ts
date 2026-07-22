/**
 * Download API Route - Single File Download
 * GET /api/download/files/[id]
 * Handles file downloads with security, logging, range requests, and proper headers
 */

import { NextRequest, NextResponse } from 'next/server'
import { serveDownload } from '@/lib/download-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid download ID', code: 'INVALID_ID' },
        { status: 400 }
      )
    }

    // Prevent path traversal via ID
    if (id.includes('..') || id.includes('/') || id.includes('\\')) {
      return NextResponse.json(
        { error: 'Invalid download ID format', code: 'INVALID_ID_FORMAT' },
        { status: 400 }
      )
    }

    const rangeHeader = request.headers.get('range') || undefined

    const result = await serveDownload(id, { range: rangeHeader })

    if (!result.success) {
      // Return proper error pages, not raw JSON for direct browser access
      const acceptHeader = request.headers.get('accept') || ''
      const isBrowserRequest = acceptHeader.includes('text/html')

      if (isBrowserRequest) {
        return new NextResponse(
          `<!DOCTYPE html>
<html>
<head><title>Download Error</title></head>
<body style="font-family:system-ui;max-width:600px;margin:80px auto;padding:20px;text-align:center">
<h1 style="color:#dc2626">${result.status === 404 ? 'File Not Found' : result.status === 410 ? 'File Unavailable' : 'Download Error'}</h1>
<p style="color:#6b7280">${result.error || 'An error occurred while processing your download request.'}</p>
<a href="/" style="color:#2563eb;text-decoration:underline">Return to Home</a>
</body>
</html>`,
          {
            status: result.status,
            headers: { 'Content-Type': 'text/html' },
          }
        )
      }

      return NextResponse.json(
        { error: result.error, code: result.status === 404 ? 'NOT_FOUND' : 'UNAVAILABLE' },
        { status: result.status }
      )
    }

    // Return the file with proper headers
    const bodyBuffer = result.body instanceof ReadableStream
      ? result.body
      : result.body ? Buffer.from(result.body as any) : null;

    return new NextResponse(bodyBuffer, {
      status: result.status,
      headers: result.headers,
    })
  } catch (error) {
    console.error('Download API error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
