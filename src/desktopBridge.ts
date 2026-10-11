import type { JSONContent } from '@tiptap/core'

export type LocalDocument = {
  id: string
  title: string
  content: JSONContent
  updatedAt: string
}

export type MediaMetadata = {
  id: string
  name: string
  mimeType: string
  size: number
}

export type DesktopBridge = {
  platform: 'darwin' | 'win32' | 'linux'
  listDocuments: () => Promise<LocalDocument[]>
  saveDocument: (document: LocalDocument) => Promise<void>
  deleteDocument: (id: string) => Promise<void>
  saveMedia: (metadata: MediaMetadata, bytes: Uint8Array) => Promise<void>
  getMedia: (id: string) => Promise<{ metadata: MediaMetadata; bytes: Uint8Array } | null>
  saveMediaCopy: (id: string) => Promise<boolean>
  exportPdf: (title: string) => Promise<boolean>
}

declare global {
  interface Window {
    nookDesktop?: DesktopBridge
  }
}

export {}
