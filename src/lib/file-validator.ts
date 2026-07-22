/**
 * File Validator
 * Validates files for security, type, size, and name
 */

import { getMimeType, isSafeMimeType } from './mime'

// Dangerous extensions that should never be served directly
const BLOCKED_EXTENSIONS = new Set([
  'php', 'php5', 'phtml', 'asp', 'aspx', 'jsp', 'jspx',
  'sh', 'bash', 'csh', 'ksh',
  'bat', 'cmd', 'ps1', 'psm1',
  'vbs', 'vbe', 'wsf', 'wsh',
  'sql', 'db', 'sqlite',
  'htaccess', 'htpasswd',
  'env', 'git',
])

// Maximum file sizes by category (in bytes)
const MAX_FILE_SIZES: Record<string, number> = {
  driver: 2 * 1024 * 1024 * 1024,     // 2 GB
  firmware: 4 * 1024 * 1024 * 1024,    // 4 GB
  manual: 200 * 1024 * 1024,           // 200 MB
  utility: 1 * 1024 * 1024 * 1024,     // 1 GB
  warranty: 50 * 1024 * 1024,          // 50 MB
  certificate: 20 * 1024 * 1024,       // 20 MB
  software: 5 * 1024 * 1024 * 1024,    // 5 GB
  sdk: 2 * 1024 * 1024 * 1024,        // 2 GB
  'release-note': 10 * 1024 * 1024,    // 10 MB
  image: 50 * 1024 * 1024,             // 50 MB
  other: 500 * 1024 * 1024,            // 500 MB
}

const DEFAULT_MAX_SIZE = 500 * 1024 * 1024 // 500 MB

export interface FileValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  sanitizedFileName: string
  detectedMimeType: string
  detectedExtension: string
}

/**
 * Sanitize a filename to prevent path traversal and other attacks
 */
export function sanitizeFileName(fileName: string): string {
  let sanitized = fileName

  // Remove path components
  sanitized = sanitized.split('/').pop() || sanitized
  sanitized = sanitized.split('\\').pop() || sanitized

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '')

  // Remove leading dots (hidden files)
  sanitized = sanitized.replace(/^\.+/, '')

  // Replace dangerous characters
  sanitized = sanitized.replace(/[<>:"|?*]/g, '_')

  // Collapse multiple underscores/dots
  sanitized = sanitized.replace(/_+/g, '_')
  sanitized = sanitized.replace(/\.+/g, '.')

  // Trim whitespace
  sanitized = sanitized.trim()

  // Ensure non-empty
  if (!sanitized || sanitized.length < 2) {
    sanitized = `file_${Date.now()}`
  }

  return sanitized
}

/**
 * Validate a file path to prevent path traversal
 */
export function validateFilePath(filePath: string): { valid: boolean; error?: string } {
  // Check for path traversal attempts
  if (filePath.includes('..')) {
    return { valid: false, error: 'Path traversal detected' }
  }
  if (filePath.includes('\0')) {
    return { valid: false, error: 'Null byte injection detected' }
  }
  if (filePath.startsWith('/') && !filePath.startsWith('/public/')) {
    return { valid: false, error: 'Absolute path outside public directory' }
  }

  return { valid: true }
}

/**
 * Check if a file extension is allowed
 */
export function isAllowedExtension(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  return !BLOCKED_EXTENSIONS.has(ext)
}

/**
 * Get maximum allowed file size for a category
 */
export function getMaxFileSize(category: string): number {
  return MAX_FILE_SIZES[category] || DEFAULT_MAX_SIZE
}

/**
 * Validate an uploaded file comprehensively
 */
export function validateFile(
  fileName: string,
  fileSize: number,
  category: string,
  declaredMimeType?: string
): FileValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Sanitize filename
  const sanitizedFileName = sanitizeFileName(fileName)
  if (sanitizedFileName !== fileName) {
    warnings.push('Filename was sanitized for security')
  }

  // Check extension
  const extension = fileName.split('.').pop()?.toLowerCase() || ''
  if (!extension) {
    errors.push('File must have an extension')
  }

  // Check blocked extensions
  if (!isAllowedExtension(fileName)) {
    errors.push(`File extension .${extension} is not allowed for security reasons`)
  }

  // Validate file size
  const maxSize = getMaxFileSize(category)
  if (fileSize > maxSize) {
    errors.push(`File size (${formatFileSize(fileSize)}) exceeds maximum (${formatFileSize(maxSize)}) for category "${category}"`)
  }
  if (fileSize === 0) {
    errors.push('File is empty (0 bytes)')
  }

  // Detect MIME type
  const detectedMimeType = getMimeType(fileName)

  // Verify MIME type if declared
  if (declaredMimeType && declaredMimeType !== detectedMimeType) {
    warnings.push(`Declared MIME type (${declaredMimeType}) does not match detected type (${detectedMimeType})`)
  }

  // Check if MIME type is safe
  if (detectedMimeType !== 'application/octet-stream' && !isSafeMimeType(detectedMimeType)) {
    warnings.push(`MIME type ${detectedMimeType} is not in the known safe list`)
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    sanitizedFileName,
    detectedMimeType,
    detectedExtension: extension,
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}

/**
 * Generate a safe storage path for a file
 */
export function generateStoragePath(category: string, fileName: string): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const sanitized = sanitizeFileName(fileName)
  // Path is relative to the storage base path (e.g., public/uploads)
  return `${category}/${year}/${month}/${sanitized}`
}
