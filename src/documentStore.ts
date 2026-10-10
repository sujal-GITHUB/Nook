import type { JSONContent } from '@tiptap/core'
import type { LocalDocument } from './desktopBridge'

const DATABASE_NAME = 'nook-local-v2'
const DOCUMENT_STORE = 'documents'
const LEGACY_DOCUMENTS_KEY = 'nook-documents-v1'
const LEGACY_DOCUMENT_KEY = 'nook-document-v1'

let databasePromise: Promise<IDBDatabase> | undefined
let persistenceRequested = false

function database(): Promise<IDBDatabase> {
  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, 1)
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(DOCUMENT_STORE)) db.createObjectStore(DOCUMENT_STORE, { keyPath: 'id' })
        if (!db.objectStoreNames.contains('assets')) db.createObjectStore('assets', { keyPath: 'id' })
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error ?? new Error('Could not open local workspace'))
      request.onblocked = () => reject(new Error('Close another Nook window to update its local storage'))
    })
  }
  return databasePromise
}

function transaction<T>(store: string, mode: IDBTransactionMode, action: (objectStore: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return database().then(db => new Promise<T>((resolve, reject) => {
    const tx = db.transaction(store, mode)
    const request = action(tx.objectStore(store))
    let result!: T
    request.onsuccess = () => { result = request.result }
    request.onerror = () => reject(request.error ?? new Error('Local storage operation failed'))
    tx.oncomplete = () => resolve(result)
    tx.onerror = () => reject(tx.error ?? new Error('Local storage transaction failed'))
    tx.onabort = () => reject(tx.error ?? new Error('Local storage transaction was interrupted'))
  }))
}

export function createWelcomeDocument(content: JSONContent): LocalDocument {
  return { id: 'welcome', title: 'A quiet place to think', content, updatedAt: new Date().toISOString() }
}

function isDocument(value: unknown): value is LocalDocument {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<LocalDocument>
  return typeof item.id === 'string' && typeof item.title === 'string' &&
    typeof item.updatedAt === 'string' && !!item.content && item.content.type === 'doc' && Array.isArray(item.content.content)
}

function readLegacyDocuments(): LocalDocument[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(LEGACY_DOCUMENTS_KEY) ?? 'null')
    if (Array.isArray(data)) return data.filter(isDocument)
    const legacy: unknown = JSON.parse(localStorage.getItem(LEGACY_DOCUMENT_KEY) ?? 'null')
    if (legacy && typeof legacy === 'object') {
      const item = legacy as Record<string, unknown>
      if (item.content && typeof item.content === 'object' && (item.content as { type?: unknown }).type === 'doc') {
        return [{ id: 'local-document', title: typeof item.title === 'string' ? item.title : 'A quiet place to think', content: item.content as JSONContent, updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : new Date().toISOString() }]
      }
    }
  } catch { /* An invalid old record is ignored without blocking workspace startup. */ }
  return []
}

export async function listDocuments(): Promise<LocalDocument[]> {
  if (window.nookDesktop) return window.nookDesktop.listDocuments()
  const stored = await transaction<LocalDocument[]>(DOCUMENT_STORE, 'readonly', store => store.getAll())
  if (stored.length) return stored.filter(isDocument).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  const legacy = readLegacyDocuments()
  for (const document of legacy) await transaction(DOCUMENT_STORE, 'readwrite', store => store.put(document))
  if (legacy.length) {
    localStorage.removeItem(LEGACY_DOCUMENTS_KEY)
    localStorage.removeItem(LEGACY_DOCUMENT_KEY)
    return legacy.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }
  return []
}

export async function saveDocument(document: LocalDocument): Promise<void> {
  if (window.nookDesktop) return window.nookDesktop.saveDocument(document)
  await transaction(DOCUMENT_STORE, 'readwrite', store => store.put(document))
  if (!persistenceRequested && navigator.storage?.persist) {
    persistenceRequested = true
    void navigator.storage.persist().catch(() => false)
  }
}

export async function deleteDocument(id: string): Promise<void> {
  if (window.nookDesktop) return window.nookDesktop.deleteDocument(id)
  await transaction(DOCUMENT_STORE, 'readwrite', store => store.delete(id))
}

