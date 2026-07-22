/**
 * MIME Type Registry
 * Centralized MIME type mapping for download management system
 */

export const MIME_TYPES: Record<string, string> = {
  // Documents
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain',
  rtf: 'application/rtf',
  csv: 'text/csv',

  // Executables & Installers
  exe: 'application/x-msdownload',
  msi: 'application/x-msi',
  dmg: 'application/x-apple-diskimage',
  deb: 'application/x-debian-package',
  rpm: 'application/x-rpm',
  apk: 'application/vnd.android.package-archive',
  appx: 'application/vnd.ms-appx',
  msix: 'application/vnd.ms-msix',

  // Archives
  zip: 'application/zip',
  rar: 'application/vnd.rar',
  '7z': 'application/x-7z-compressed',
  tar: 'application/x-tar',
  gz: 'application/gzip',
  bz2: 'application/x-bzip2',

  // Disk Images
  iso: 'application/x-iso9660-image',
  img: 'application/octet-stream',
  bin: 'application/octet-stream',

  // Firmware
  fw: 'application/octet-stream',
  hex: 'application/octet-stream',
  fls: 'application/octet-stream',

  // Media
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  webp: 'image/webp',
  ico: 'image/x-icon',
  bmp: 'image/bmp',

  // Audio/Video
  mp3: 'audio/mpeg',
  mp4: 'video/mp4',
  avi: 'video/x-msvideo',
  mov: 'video/quicktime',
  wav: 'audio/wav',

  // Code & Data
  json: 'application/json',
  xml: 'application/xml',
  html: 'text/html',
  css: 'text/css',
  js: 'text/javascript',

  // Certificates
  cer: 'application/x-x509-ca-cert',
  crt: 'application/x-x509-ca-cert',
  p7b: 'application/x-pkcs7-certificates',
  pfx: 'application/x-pkcs12',

  // Other
  md: 'text/markdown',
  log: 'text/plain',
}

export const EXTENSION_FROM_MIME: Record<string, string> = Object.fromEntries(
  Object.entries(MIME_TYPES).map(([ext, mime]) => [mime, ext])
)

export function getMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  return MIME_TYPES[ext] || 'application/octet-stream'
}

export function getExtension(mimeType: string): string {
  return EXTENSION_FROM_MIME[mimeType] || 'bin'
}

export function isSafeMimeType(mimeType: string): boolean {
  const safeMimes = new Set(Object.values(MIME_TYPES))
  return safeMimes.has(mimeType)
}

export function isViewableInBrowser(mimeType: string): boolean {
  const viewable = new Set([
    'application/pdf',
    'text/plain',
    'text/html',
    'text/css',
    'text/markdown',
    'text/csv',
    'application/json',
    'application/xml',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/svg+xml',
    'image/webp',
    'image/x-icon',
    'image/bmp',
  ])
  return viewable.has(mimeType)
}
