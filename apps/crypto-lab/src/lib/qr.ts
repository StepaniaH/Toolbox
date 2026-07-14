import QRCode from 'qrcode'
import jsQR from 'jsqr'
import { MAX_SHARE_PACKET_CHARS, parseSharePacket, ShareError } from './share.ts'

const MAX_IMPORT_BYTES = 8 * 1024 * 1024
const MAX_IMAGE_PIXELS = 16 * 1024 * 1024
const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])

export type ShareImportErrorCode =
  | 'file-too-large'
  | 'unsupported-file'
  | 'image-too-large'
  | 'image-unreadable'
  | 'qr-not-found'

export class ShareImportError extends Error {
  readonly code: ShareImportErrorCode

  constructor(code: ShareImportErrorCode) {
    super(code)
    this.name = 'ShareImportError'
    this.code = code
  }
}

export async function createShareQrDataUrl(packet: string): Promise<string> {
  parseSharePacket(packet)
  return QRCode.toDataURL(packet, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 512,
    color: { dark: '#111827', light: '#ffffff' },
  })
}

function isTextPacket(file: File): boolean {
  const lowerName = file.name.toLowerCase()
  return file.type === 'text/plain' || lowerName.endsWith('.cryptolab') || lowerName.endsWith('.txt')
}

async function decodeImage(file: File): Promise<string> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new ShareImportError('image-unreadable')
  }
  try {
    if (bitmap.width <= 0 || bitmap.height <= 0 || bitmap.width * bitmap.height > MAX_IMAGE_PIXELS) {
      throw new ShareImportError('image-too-large')
    }
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new ShareImportError('image-unreadable')
    context.drawImage(bitmap, 0, 0)
    const image = context.getImageData(0, 0, bitmap.width, bitmap.height)
    const result = jsQR(image.data, image.width, image.height, { inversionAttempts: 'attemptBoth' })
    if (!result?.data) throw new ShareImportError('qr-not-found')
    return result.data
  } finally {
    bitmap.close()
  }
}

export async function readSharePacketFile(file: File): Promise<string> {
  if (file.size > MAX_IMPORT_BYTES) throw new ShareImportError('file-too-large')
  let packet: string
  if (isTextPacket(file)) {
    packet = (await file.text()).trim()
    if (packet.length > MAX_SHARE_PACKET_CHARS) throw new ShareError('packet-too-large')
  } else if (IMAGE_TYPES.has(file.type)) {
    packet = await decodeImage(file)
  } else {
    throw new ShareImportError('unsupported-file')
  }
  parseSharePacket(packet)
  return packet
}
