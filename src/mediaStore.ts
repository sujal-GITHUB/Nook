export interface StoredMedia {
  id: string
  blob: Blob
  name: string
  mimeType: string
  size: number
}

const DATABASE_NAME = 'nook-media-v1'
let databasePromise: Promise<IDBDatabase> | undefined

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
  const requestedType = file.type.toLowerCase()
  const safeType = /^(image\/(png|jpeg|gif|webp|avif)|audio\/(mpeg|mp4|ogg|wav|webm|aac)|video\/(mp4|ogg|webm|quicktime)|application\/pdf)$/.test(requestedType)
    ? requestedType
    : 'application/octet-stream'
  const blob = new Blob([file], { type: safeType })
  const value: StoredMedia = { id, blob, name: file.name, mimeType: safeType, size: file.size }
  const db = await database()
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction('assets', 'readwrite').objectStore('assets').put(value)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error ?? new Error('Could not save media'))
  })
  return value
}

export async function getMedia(id: string): Promise<StoredMedia | undefined> {
  const db = await database()
  return new Promise((resolve, reject) => {
    const request = db.transaction('assets', 'readonly').objectStore('assets').get(id)
    request.onsuccess = () => resolve(request.result as StoredMedia | undefined)
    request.onerror = () => reject(request.error ?? new Error('Could not load media'))
  })
}
