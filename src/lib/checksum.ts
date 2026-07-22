/**
 * Checksum utilities for file integrity verification
 */

export async function computeChecksum(
  data: Buffer | ArrayBuffer | Uint8Array,
  algorithm: 'sha256' | 'sha1' | 'md5' = 'sha256'
): Promise<string> {
  const buffer = data instanceof Buffer ? data : Buffer.from(new Uint8Array(data as ArrayBuffer))
  const crypto = await import('crypto')
  const hash = crypto.createHash(algorithm)
  hash.update(buffer)
  return hash.digest('hex')
}

export async function computeFileChecksum(
  filePath: string,
  algorithm: 'sha256' | 'sha1' | 'md5' = 'sha256'
): Promise<string> {
  const fs = await import('fs/promises')
  const crypto = await import('crypto')

  const fileBuffer = await fs.readFile(filePath)
  const hash = crypto.createHash(algorithm)
  hash.update(fileBuffer)
  return hash.digest('hex')
}

export async function verifyChecksum(
  data: Buffer | ArrayBuffer | Uint8Array,
  expectedChecksum: string,
  algorithm: 'sha256' | 'sha1' | 'md5' = 'sha256'
): Promise<boolean> {
  const computed = await computeChecksum(data, algorithm)
  return computed === expectedChecksum
}

export function formatChecksum(checksum: string): string {
  // Format as groups of 8 for readability
  return checksum.match(/.{1,8}/g)?.join(' ') || checksum
}
