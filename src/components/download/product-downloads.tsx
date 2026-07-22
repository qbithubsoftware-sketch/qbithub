'use client'

/**
 * Product Downloads Component
 * Displays all downloads for a product, grouped by category
 * Used on product detail pages
 */

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { DownloadButton } from './download-button'
import { formatFileSize } from '@/lib/file-validator'
import {
  Download,
  Monitor,
  FileText,
  Cpu,
  Wrench,
  Shield,
  Award,
  Package,
  Code,
  ScrollText,
  Image as ImageIcon,
  File,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Star,
} from 'lucide-react'
import { Input } from '@/components/ui/input'

interface DownloadItem {
  id: string
  name: string
  fileName: string
  fileSize: number
  fileSizeFormatted: string
  category: string
  platform: string | null
  language: string | null
  version: string | null
  mimeType: string
  extension: string | null
  description: string | null
  releaseDate: string | null
  downloadCount: number
  status: string
  isFeatured: boolean
  downloadUrl: string
  createdAt: string
  updatedAt: string
  product?: { id: string; name: string; slug: string } | null
}

interface ProductDownloadsProps {
  productId?: string
  productSlug?: string
  product?: {
    id: string
    name: string
    slug: string
    description?: string | null
    imageUrl?: string | null
  }
}

const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  driver: { icon: Monitor, label: 'Drivers', color: 'bg-blue-500/10 text-blue-600' },
  manual: { icon: FileText, label: 'Manuals', color: 'bg-green-500/10 text-green-600' },
  firmware: { icon: Cpu, label: 'Firmware', color: 'bg-orange-500/10 text-orange-600' },
  utility: { icon: Wrench, label: 'Utilities', color: 'bg-purple-500/10 text-purple-600' },
  warranty: { icon: Shield, label: 'Warranty', color: 'bg-emerald-500/10 text-emerald-600' },
  certificate: { icon: Award, label: 'Certificates', color: 'bg-amber-500/10 text-amber-600' },
  software: { icon: Package, label: 'Software', color: 'bg-cyan-500/10 text-cyan-600' },
  sdk: { icon: Code, label: 'SDK', color: 'bg-indigo-500/10 text-indigo-600' },
  'release-note': { icon: ScrollText, label: 'Release Notes', color: 'bg-slate-500/10 text-slate-600' },
  image: { icon: ImageIcon, label: 'Images', color: 'bg-pink-500/10 text-pink-600' },
  other: { icon: File, label: 'Other', color: 'bg-gray-500/10 text-gray-600' },
}

const PLATFORM_BADGES: Record<string, { label: string; color: string }> = {
  windows: { label: 'Windows', color: 'bg-blue-100 text-blue-700' },
  linux: { label: 'Linux', color: 'bg-yellow-100 text-yellow-700' },
  mac: { label: 'macOS', color: 'bg-gray-100 text-gray-700' },
  android: { label: 'Android', color: 'bg-green-100 text-green-700' },
  'cross-platform': { label: 'Cross-Platform', color: 'bg-purple-100 text-purple-700' },
}

export function ProductDownloads({ productId, productSlug, product }: ProductDownloadsProps) {
  const [downloads, setDownloads] = useState<DownloadItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function fetchDownloads() {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        if (productId) params.set('productId', productId)
        params.set('status', 'published')
        params.set('limit', '100')

        const response = await fetch(`/api/download/files?${params}`)
        if (!response.ok) throw new Error('Failed to load downloads')

        const data = await response.json()
        setDownloads(data.files || [])
        setError(null)

        // Auto-expand all categories that have files
        const categories = new Set<string>(data.files?.map((f: DownloadItem) => f.category) || [])
        setExpandedCategories(categories)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load downloads')
      } finally {
        setLoading(false)
      }
    }

    fetchDownloads()
  }, [productId])

  // Group downloads by category
  const grouped = downloads.reduce<Record<string, DownloadItem[]>>((acc, file) => {
    const cat = file.category || 'other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(file)
    return acc
  }, {})

  // Filter by search
  const filteredGrouped = Object.entries(grouped).reduce<Record<string, DownloadItem[]>>((acc, [cat, files]) => {
    if (!searchQuery) {
      acc[cat] = files
      return acc
    }
    const q = searchQuery.toLowerCase()
    const filtered = files.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.fileName.toLowerCase().includes(q) ||
        (f.version && f.version.toLowerCase().includes(q)) ||
        (f.platform && f.platform.toLowerCase().includes(q))
    )
    if (filtered.length > 0) acc[cat] = filtered
    return acc
  }, {})

  const categoryOrder = ['firmware', 'driver', 'software', 'utility', 'sdk', 'manual', 'release-note', 'warranty', 'certificate', 'image', 'other']
  const sortedCategories = Object.keys(filteredGrouped).sort(
    (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
  )

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  const productName = product?.name || 'Product'

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted rounded-lg mb-3" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="pt-6">
          <p className="text-destructive">{error}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Unable to load downloads. Please try again later or contact support.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (downloads.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <Download className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">
            No downloads available for {productName} yet.
          </p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Check back later for updates or contact support.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search downloads..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Download Categories */}
      <div className="space-y-3">
        {sortedCategories.map((category) => {
          const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other
          const CatIcon = config.icon
          const files = filteredGrouped[category]
          const isExpanded = expandedCategories.has(category)
          const featured = files.filter((f) => f.isFeatured)
          const regular = files.filter((f) => !f.isFeatured)

          return (
            <Card key={category} className="overflow-hidden">
              <CardHeader
                className="cursor-pointer hover:bg-muted/50 transition-colors py-3"
                onClick={() => toggleCategory(category)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CatIcon className="h-5 w-5" />
                    <CardTitle className="text-base">{config.label}</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {files.length}
                    </Badge>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0 pb-4">
                  {/* Featured Downloads */}
                  {featured.length > 0 && (
                    <div className="mb-3 space-y-2">
                      {featured.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Star className="h-4 w-4 text-primary shrink-0" />
                            <div className="min-w-0">
                              <div className="font-medium text-sm truncate">{file.name}</div>
                              <div className="flex items-center gap-2 mt-0.5">
                                {file.version && (
                                  <span className="text-xs text-muted-foreground">v{file.version}</span>
                                )}
                                {file.platform && PLATFORM_BADGES[file.platform] && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                    {PLATFORM_BADGES[file.platform].label}
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {file.fileSizeFormatted}
                                </span>
                                {file.downloadCount > 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    {file.downloadCount} downloads
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <DownloadButton
                            fileId={file.id}
                            fileName={file.fileName}
                            category={category as any}
                            fileSize={file.fileSizeFormatted}
                            version={file.version || undefined}
                            platform={file.platform || undefined}
                            mimeType={file.mimeType}
                            size="sm"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Regular Downloads */}
                  <div className="space-y-1.5">
                    {regular.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate">{file.name}</div>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {file.version && (
                                <span className="text-xs text-muted-foreground">v{file.version}</span>
                              )}
                              {file.platform && PLATFORM_BADGES[file.platform] && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  {PLATFORM_BADGES[file.platform].label}
                                </Badge>
                              )}
                              {file.language && (
                                <span className="text-xs text-muted-foreground uppercase">
                                  {file.language}
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {file.fileSizeFormatted}
                              </span>
                              {file.downloadCount > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  {file.downloadCount} downloads
                                </span>
                              )}
                              {file.extension && (
                                <span className="text-[10px] font-mono text-muted-foreground uppercase bg-muted px-1 rounded">
                                  {file.extension}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <DownloadButton
                          fileId={file.id}
                          fileName={file.fileName}
                          category={category as any}
                          fileSize={file.fileSizeFormatted}
                          version={file.version || undefined}
                          platform={file.platform || undefined}
                          mimeType={file.mimeType}
                          variant="outline"
                          size="sm"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {/* Summary */}
      <div className="text-center text-sm text-muted-foreground pt-2">
        {downloads.length} download{downloads.length !== 1 ? 's' : ''} available
        {searchQuery && ` (filtered from ${downloads.length})`}
      </div>
    </div>
  )
}

// Also export the formatFileSize for convenience
export { formatFileSize }
