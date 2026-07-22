/**
 * Storage Abstraction Layer
 * Supports local filesystem and cloud providers (configurable from one place)
 */

import { validateFilePath } from './file-validator'
import { Readable } from 'stream'

export type StorageProvider = 'local' | 's3' | 'cloudinary' | 'supabase' | 'azure' | 'gcs' | 'cdn'

export interface StorageConfig {
  provider: StorageProvider
  basePath: string
  baseUrl: string
  // Cloud-specific config (loaded from environment/integration config)
  region?: string
  bucket?: string
  accessKeyId?: string
  secretAccessKey?: string
  endpoint?: string
}

export interface StoredFile {
  path: string
  url: string
  size: number
  mimeType: string
  checksum?: string
}

/**
 * Get the current storage configuration
 * Reads from environment variables, with local filesystem as default
 */
export function getStorageConfig(): StorageConfig {
  const provider = (process.env.STORAGE_PROVIDER || 'local') as StorageProvider

  const configs: Record<StorageProvider, () => StorageConfig> = {
    local: () => ({
      provider: 'local',
      basePath: process.env.STORAGE_BASE_PATH || 'public/uploads',
      baseUrl: process.env.STORAGE_BASE_URL || '/uploads',
    }),
    s3: () => ({
      provider: 's3',
      basePath: process.env.S3_BASE_PATH || 'uploads',
      baseUrl: process.env.S3_BASE_URL || '',
      region: process.env.AWS_REGION || 'us-east-1',
      bucket: process.env.S3_BUCKET || '',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    }),
    cloudinary: () => ({
      provider: 'cloudinary',
      basePath: process.env.CLOUDINARY_FOLDER || 'downloads',
      baseUrl: process.env.CLOUDINARY_URL || '',
    }),
    supabase: () => ({
      provider: 'supabase',
      basePath: process.env.SUPABASE_BUCKET || 'downloads',
      baseUrl: process.env.SUPABASE_URL || '',
    }),
    azure: () => ({
      provider: 'azure',
      basePath: process.env.AZURE_CONTAINER || 'downloads',
      baseUrl: process.env.AZURE_STORAGE_URL || '',
    }),
    gcs: () => ({
      provider: 'gcs',
      basePath: process.env.GCS_BUCKET || 'downloads',
      baseUrl: process.env.GCS_BASE_URL || '',
    }),
    cdn: () => ({
      provider: 'cdn',
      basePath: 'cdn',
      baseUrl: process.env.CDN_BASE_URL || '',
    }),
  }

  return configs[provider]?.() || configs.local()
}

/**
 * Store a file using the configured provider
 */
export async function storeFile(
  buffer: Buffer,
  relativePath: string,
  mimeType: string
): Promise<StoredFile> {
  const config = getStorageConfig()

  // Validate path
  const pathValidation = validateFilePath(relativePath)
  if (!pathValidation.valid) {
    throw new Error(`Invalid storage path: ${pathValidation.error}`)
  }

  switch (config.provider) {
    case 'local':
      return storeLocal(buffer, relativePath, mimeType, config)
    default:
      // For cloud providers, fall back to local for now (cloud integration via API)
      return storeLocal(buffer, relativePath, mimeType, config)
  }
}

/**
 * Store file on local filesystem
 */
async function storeLocal(
  buffer: Buffer,
  relativePath: string,
  mimeType: string,
  config: StorageConfig
): Promise<StoredFile> {
  const fs = await import('fs/promises')
  const path = await import('path')

  const fullPath = path.join(process.cwd(), config.basePath, relativePath)
  const dir = path.dirname(fullPath)

  // Ensure directory exists
  await fs.mkdir(dir, { recursive: true })

  // Write file
  await fs.writeFile(fullPath, buffer)

  // Compute checksum
  const { computeChecksum } = await import('./checksum')
  const checksum = await computeChecksum(buffer)

  return {
    path: relativePath,
    url: `${config.baseUrl}/${relativePath}`,
    size: buffer.length,
    mimeType,
    checksum,
  }
}

/**
 * Delete a file from storage
 */
export async function deleteFile(relativePath: string): Promise<boolean> {
  const config = getStorageConfig()

  if (config.provider === 'local') {
    const fs = await import('fs/promises')
    const path = await import('path')
    const fullPath = path.join(process.cwd(), config.basePath, relativePath)
    try {
      await fs.unlink(fullPath)
      return true
    } catch {
      return false
    }
  }

  // Cloud providers would implement their delete logic here
  return false
}

/**
 * Check if a file exists in storage
 */
export async function fileExists(relativePath: string): Promise<boolean> {
  const config = getStorageConfig()

  if (config.provider === 'local') {
    const fs = await import('fs/promises')
    const path = await import('path')
    const fullPath = path.join(process.cwd(), config.basePath, relativePath)
    try {
      await fs.access(fullPath)
      return true
    } catch {
      return false
    }
  }

  return false
}

/**
 * Read a file from storage as a Buffer
 */
export async function readFile(relativePath: string): Promise<Buffer | null> {
  const config = getStorageConfig()

  if (config.provider === 'local') {
    const fs = await import('fs/promises')
    const path = await import('path')
    const fullPath = path.join(process.cwd(), config.basePath, relativePath)

    try {
      return await fs.readFile(fullPath)
    } catch {
      return null
    }
  }

  return null
}

/**
 * Get a readable stream for a file (for large file support / streaming downloads)
 */
export async function getFileStream(relativePath: string): Promise<ReadableStream | null> {
  const config = getStorageConfig()

  if (config.provider === 'local') {
    const fs = await import('fs')
    const path = await import('path')
    const fullPath = path.join(process.cwd(), config.basePath, relativePath)

    try {
      const stat = await fs.promises.stat(fullPath)
      const nodeStream = fs.createReadStream(fullPath)
      // Convert Node.js Readable to Web ReadableStream
      return Readable.toWeb(nodeStream) as ReadableStream
    } catch {
      return null
    }
  }

  return null
}

/**
 * Get file metadata (size, last modified) without reading the file
 */
export async function getFileStats(relativePath: string): Promise<{
  size: number
  lastModified: Date
} | null> {
  const config = getStorageConfig()

  if (config.provider === 'local') {
    const fs = await import('fs/promises')
    const path = await import('path')
    const fullPath = path.join(process.cwd(), config.basePath, relativePath)

    try {
      const stat = await fs.stat(fullPath)
      return {
        size: stat.size,
        lastModified: stat.mtime,
      }
    } catch {
      return null
    }
  }

  return null
}

/**
 * List files in a storage directory
 */
export async function listFiles(prefix: string = ''): Promise<string[]> {
  const config = getStorageConfig()

  if (config.provider === 'local') {
    const fs = await import('fs/promises')
    const path = await import('path')
    const fullPath = path.join(process.cwd(), config.basePath, prefix)

    try {
      const entries = await fs.readdir(fullPath, { withFileTypes: true })
      const files: string[] = []

      for (const entry of entries) {
        const entryPath = prefix ? `${prefix}/${entry.name}` : entry.name
        if (entry.isDirectory()) {
          const subFiles = await listFiles(entryPath)
          files.push(...subFiles)
        } else {
          files.push(entryPath)
        }
      }

      return files
    } catch {
      return []
    }
  }

  return []
}
