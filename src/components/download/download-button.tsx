'use client'

/**
 * Download Button Component
 * Automatically detects file type and handles download correctly
 * Never breaks - always provides graceful fallback
 */

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  Download,
  FileText,
  Monitor,
  Cpu,
  Wrench,
  Shield,
  Award,
  Package,
  Code,
  ScrollText,
  Image as ImageIcon,
  File,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'

type DownloadCategory =
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

interface DownloadButtonProps {
  fileId: string
  fileName: string
  category: DownloadCategory
  fileSize?: string
  version?: string
  platform?: string
  mimeType?: string
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  showIcon?: boolean
  showSize?: boolean
  label?: string
  children?: React.ReactNode
}

const CATEGORY_ICONS: Record<DownloadCategory, React.ElementType> = {
  driver: Monitor,
  manual: FileText,
  firmware: Cpu,
  utility: Wrench,
  warranty: Shield,
  certificate: Award,
  software: Package,
  sdk: Code,
  'release-note': ScrollText,
  image: ImageIcon,
  other: File,
}

const CATEGORY_LABELS: Record<DownloadCategory, string> = {
  driver: 'Driver',
  manual: 'Manual',
  firmware: 'Firmware',
  utility: 'Utility',
  warranty: 'Warranty',
  certificate: 'Certificate',
  software: 'Software',
  sdk: 'SDK',
  'release-note': 'Release Notes',
  image: 'Image',
  other: 'File',
}

type DownloadState = 'idle' | 'downloading' | 'success' | 'error'

export function DownloadButton({
  fileId,
  fileName,
  category,
  fileSize,
  version,
  platform,
  mimeType,
  variant = 'default',
  size = 'default',
  className,
  showIcon = true,
  showSize = true,
  label,
  children,
}: DownloadButtonProps) {
  const [state, setState] = useState<DownloadState>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')

  const Icon = CATEGORY_ICONS[category] || File
  const categoryLabel = label || CATEGORY_LABELS[category] || 'Download'

  const isViewable = mimeType && (
    mimeType === 'application/pdf' ||
    mimeType.startsWith('image/') ||
    mimeType.startsWith('text/')
  )

  const handleDownload = useCallback(async () => {
    setState('downloading')
    setErrorMessage('')

    try {
      const downloadUrl = `/api/download/files/${fileId}`

      if (isViewable) {
        // For viewable files (PDF, images), open in new tab
        window.open(downloadUrl, '_blank')
        setState('success')
        setTimeout(() => setState('idle'), 2000)
        return
      }

      // For downloadable files, use fetch + blob approach
      const response = await fetch(downloadUrl)

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Download failed' }))
        throw new Error(data.error || `Download failed with status ${response.status}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      setState('success')
      setTimeout(() => setState('idle'), 2000)
    } catch (error) {
      console.error('Download error:', error)
      const msg = error instanceof Error ? error.message : 'Download failed'
      setErrorMessage(msg)
      setState('error')
      toast.error('Download failed', { description: msg })
      setTimeout(() => setState('idle'), 3000)
    }
  }, [fileId, fileName, isViewable])

  const getButtonContent = () => {
    switch (state) {
      case 'downloading':
        return (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Downloading...</span>
          </>
        )
      case 'success':
        return (
          <>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>Downloaded!</span>
          </>
        )
      case 'error':
        return (
          <>
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-red-500 truncate max-w-[200px]">{errorMessage || 'Failed'}</span>
          </>
        )
      default:
        return (
          <>
            {showIcon && <Icon className="h-4 w-4" />}
            <span>{children || categoryLabel}</span>
            {version && <span className="text-xs opacity-70">v{version}</span>}
            {showSize && fileSize && (
              <span className="text-xs opacity-60">({fileSize})</span>
            )}
            {isViewable && <ExternalLink className="h-3 w-3 opacity-50" />}
          </>
        )
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleDownload}
      disabled={state === 'downloading'}
      title={`${fileName}${platform ? ` - ${platform}` : ''}${version ? ` v${version}` : ''}${fileSize ? ` (${fileSize})` : ''}`}
    >
      {getButtonContent()}
    </Button>
  )
}

/**
 * Compact download link for inline use in tables and lists
 */
export function DownloadLink({
  fileId,
  fileName,
  className,
}: {
  fileId: string
  fileName: string
  className?: string
}) {
  const [state, setState] = useState<DownloadState>('idle')

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    setState('downloading')

    try {
      const response = await fetch(`/api/download/files/${fileId}`)
      if (!response.ok) throw new Error('Download failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      setState('success')
      setTimeout(() => setState('idle'), 2000)
    } catch {
      setState('error')
      setTimeout(() => setState('idle'), 3000)
    }
  }, [fileId, fileName])

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-1 text-primary hover:underline cursor-pointer disabled:opacity-50 ${className || ''}`}
      disabled={state === 'downloading'}
    >
      {state === 'downloading' && <Loader2 className="h-3 w-3 animate-spin" />}
      {state === 'success' && <CheckCircle2 className="h-3 w-3 text-green-500" />}
      {state === 'error' && <AlertCircle className="h-3 w-3 text-red-500" />}
      <Download className="h-3 w-3" />
      {fileName}
    </button>
  )
}
