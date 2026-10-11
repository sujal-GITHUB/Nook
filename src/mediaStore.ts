import type { MediaMetadata } from './desktopBridge'

export interface StoredMedia {
  id: string
  blob: Blob
  name: string
  mimeType: string
  size: number
}

const DATABASE_NAME = 'nook-media-v1'
let databasePromise: Promise<IDBDatabase> | undefined

const KNOWN_MIME_TYPES = new Set([
  'image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/avif',
  'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/webm', 'audio/aac',
  'video/mp4', 'video/ogg', 'video/webm', 'video/quicktime', 'application/pdf',
])

const MIME_BY_EXTENSION: Record<string, string> = {
  avif: 'image/avif', gif: 'image/gif', jpeg: 'image/jpeg', jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
  aac: 'audio/aac', flac: 'audio/flac', m4a: 'audio/mp4', m4b: 'audio/mp4',
  mp3: 'audio/mpeg', oga: 'audio/ogg', ogg: 'audio/ogg', opus: 'audio/ogg', wav: 'audio/wav', wave: 'audio/wav',
  m4v: 'video/mp4', mov: 'video/quicktime', mp4: 'video/mp4', ogv: 'video/ogg', webm: 'video/webm',
  pdf: 'application/pdf',
}

function resolveMediaType(file: File): string {
  const supplied = file.type.toLowerCase().split(';', 1)[0].trim()
  const extension = file.name.toLowerCase().split('.').pop() ?? ''
  if (KNOWN_MIME_TYPES.has(supplied)) return supplied
  return Object.prototype.hasOwnProperty.call(MIME_BY_EXTENSION, extension) ? MIME_BY_EXTENSION[extension] : 'application/octet-stream'
}

function database(): Promise<IDBDatabase> {
  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, 1)
      request.onupgradeneeded = () => request.result.createObjectStore('assets', { keyPath: 'id' })
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error ?? new Error('Could not open local media storage'))
    })
  }
  return databasePromise
}

export async function saveMedia(file: File, id: string = crypto.randomUUID()): Promise<StoredMedia> {
  const mimeType = resolveMediaType(file)
  const blob = new Blob([file], { type: mimeType })
  const value: StoredMedia = { id, blob, name: file.name, mimeType, size: file.size }
  if (window.nookDesktop) {
    await window.nookDesktop.saveMedia({ id, name: value.name, mimeType: value.mimeType, size: value.size }, new Uint8Array(await blob.arrayBuffer()))
    return value
  }
  const db = await database()
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction('assets', 'readwrite').objectStore('assets').put(value)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error ?? new Error('Could not save media'))
  })
  return value
}

export async function getMedia(id: string): Promise<StoredMedia | undefined> {
  if (window.nookDesktop) {
    const asset = await window.nookDesktop.getMedia(id)
    if (!asset) return undefined
    const bytes = new Uint8Array(new ArrayBuffer(asset.bytes.byteLength))
    bytes.set(asset.bytes)
    return { ...asset.metadata, blob: new Blob([bytes.buffer], { type: asset.metadata.mimeType }) }
  }
  const db = await database()
  return new Promise((resolve, reject) => {
    const request = db.transaction('assets', 'readonly').objectStore('assets').get(id)
    request.onsuccess = () => resolve(request.result as StoredMedia | undefined)
    request.onerror = () => reject(request.error ?? new Error('Could not load media'))
  })
}
