import { useEffect, useMemo, useRef, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import type { JSONContent } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { MediaBlock } from './MediaBlock'
import { getMedia, saveMedia } from './mediaStore'
import LandingPage from './LandingPage'
import {
  ArrowDownToLine, Bold, Check, ChevronDown, FileText, Heading1, Heading2, ImagePlus,
  Italic, Link2, List, PanelLeft,
  Plus, Quote, Redo2, Sparkles, Strikethrough, Undo2, Upload,
} from 'lucide-react'

const STORAGE_KEY = 'nook-documents-v1'
const LEGACY_STORAGE_KEY = 'nook-document-v1'
type NookDocument = { id: string; title: string; content: JSONContent; updatedAt: string }
const initialContent = {
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'A quiet place to think' }] },
    { type: 'paragraph', content: [{ type: 'text', text: 'Welcome to Nook. Start writing, collect your ideas, and let your notes find their shape.' }] },
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Today' }] },
    { type: 'paragraph', content: [{ type: 'text', text: 'Use the editor as a calm, local-first workspace. Everything is saved on this device as you work.' }] },
    { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Write something worth keeping' }] }] }, { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Add a link, image, or file when you need context' }] }] }] },
  ],
}

function visitMedia(node: unknown, visitor: (attrs: Record<string, unknown>) => void) {
  if (!node || typeof node !== 'object') return
  const value = node as { type?: unknown; attrs?: unknown; content?: unknown[] }
  if (value.type === 'media' && value.attrs && typeof value.attrs === 'object') visitor(value.attrs as Record<string, unknown>)
  value.content?.forEach(child => visitMedia(child, visitor))
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Media export failed'))
    reader.onerror = () => reject(reader.error ?? new Error('Media export failed'))
    reader.readAsDataURL(blob)
  })
}

function isSafeLink(value: string): boolean {
  if (/^[\/#?.]/.test(value)) return true
  try { return ['http:', 'https:', 'mailto:', 'tel:'].includes(new URL(value).protocol) } catch { return false }
}

function sanitizeContent(value: unknown): JSONContent {
  if (!value || typeof value !== 'object' || (value as { type?: unknown }).type !== 'doc' || !Array.isArray((value as { content?: unknown }).content)) {
    throw new Error('Invalid document content')
  }
  const clean = structuredClone(value) as JSONContent
  const visit = (node: JSONContent) => {
    if (node.marks) node.marks = node.marks.filter(mark => {
      if (mark.type !== 'link') return true
      const href = mark.attrs?.href
      return typeof href === 'string' && isSafeLink(href)
    })
    node.content?.forEach(visit)
  }
  clean.content?.forEach(visit)
  return clean
}

function loadDocuments(): NookDocument[] {
  try {
    const documents = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (Array.isArray(documents) && documents.length > 0) return documents.map((document: NookDocument) => ({ ...document, content: sanitizeContent(document.content) }))
    const legacy = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) ?? 'null')
    if (legacy?.content) return [{ id: 'local-document', title: legacy.title ?? 'A quiet place to think', content: sanitizeContent(legacy.content), updatedAt: legacy.updatedAt ?? new Date().toISOString() }]
  } catch { /* Start with the welcome page when saved data cannot be read. */ }
  return [{ id: 'welcome', title: 'A quiet place to think', content: initialContent, updatedAt: new Date().toISOString() }]
}

const emptyContent = { type: 'doc', content: [{ type: 'paragraph' }] }

function EditorWorkspace({ onHome }: { onHome: () => void }) {
  const [initialDocuments] = useState(loadDocuments)
  const [documents, setDocuments] = useState(initialDocuments)
  const [activeId, setActiveId] = useState(initialDocuments[0].id)
  const [title, setTitle] = useState(initialDocuments[0].title)
  const [saved, setSaved] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [dark, setDark] = useState(false)
  const saveTimer = useRef<number | undefined>(undefined)
  const titleRef = useRef(title)
  const activeIdRef = useRef(activeId)
  const documentsRef = useRef(documents)
  const uploadRef = useRef<HTMLInputElement>(null)
  const importRef = useRef<HTMLInputElement>(null)
  const [notice, setNotice] = useState('')
  const [blockMenuOpen, setBlockMenuOpen] = useState(false)
  titleRef.current = title
  activeIdRef.current = activeId
  documentsRef.current = documents

  const persistDocument = (document: NookDocument) => {
    const current = documentsRef.current
    const next = current.some(item => item.id === document.id)
      ? current.map(item => item.id === document.id ? document : item)
      : [...current, document]
    documentsRef.current = next
    setDocuments(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const editor = useEditor({
    extensions: [StarterKit, Link.configure({ openOnClick: false }), MediaBlock, Placeholder.configure({ placeholder: 'Start writing…' })],
    content: initialDocuments[0].content,
    onUpdate: ({ editor: nextEditor }) => {
      setSaved(false)
      window.clearTimeout(saveTimer.current)
      saveTimer.current = window.setTimeout(() => {
        try {
          persistDocument({ id: activeIdRef.current, title: titleRef.current, content: nextEditor.getJSON(), updatedAt: new Date().toISOString() })
          setSaved(true)
        } catch {
          setSaved(false)
        }
      }, 500)
    },
  })

  useEffect(() => { document.documentElement.dataset.theme = dark ? 'dark' : 'light' }, [dark])
  useEffect(() => { if (editor) editor.commands.focus('start') }, [editor])
  useEffect(() => () => window.clearTimeout(saveTimer.current), [])

  const updateTitle = (nextTitle: string) => {
    setTitle(nextTitle)
    titleRef.current = nextTitle
    setSaved(false)
    window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      try {
        persistDocument({ id: activeIdRef.current, title: nextTitle, content: editor?.getJSON() ?? emptyContent, updatedAt: new Date().toISOString() })
        setSaved(true)
      } catch { setSaved(false) }
    }, 350)
  }

  const exportDocument = async () => {
    if (!editor) return
    const content = editor.getJSON()
    const ids = new Set<string>()
    visitMedia(content, attrs => { if (typeof attrs.assetId === 'string') ids.add(attrs.assetId) })
    const assets: Array<{ id: string; name: string; mimeType: string; size: number; dataUrl: string }> = []
    for (const id of ids) {
      const asset = await getMedia(id)
      if (!asset) throw new Error(`Missing media asset: ${id}`)
      const dataUrl = await blobToDataUrl(asset.blob)
      assets.push({ id, name: asset.name, mimeType: asset.mimeType, size: asset.size, dataUrl })
    }
    const payload = JSON.stringify({ schemaVersion: 1, id: activeId, title, content, assets, updatedAt: new Date().toISOString() }, null, 2)
    const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `${title.trim().replace(/[^a-z0-9-_]+/gi, '-').replace(/^-|-$/g, '') || 'document'}.nook.json`
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const addMedia = async (file?: File) => {
    if (!file || !editor) return
    try {
      const asset = await saveMedia(file)
      editor.chain().focus().insertContent({ type: 'media', attrs: { assetId: asset.id, name: asset.name, mimeType: asset.mimeType, size: asset.size } }).run()
      setNotice('Media added to this page')
    } catch { setNotice('Could not save this file in local browser storage') }
  }

  const importDocument = async (file?: File) => {
    if (!file || !editor) return
    try {
      const imported = JSON.parse(await file.text()) as { schemaVersion?: unknown; title?: unknown; content?: { type?: unknown }; assets?: Array<{ id: string; name: string; mimeType: string; dataUrl: string }> }
      if (imported.schemaVersion !== 1 || imported.content?.type !== 'doc' || !Array.isArray(imported.assets)) throw new Error('Unsupported document format')
      const content = sanitizeContent(imported.content)
      const ids = new Set(imported.assets.map(asset => asset.id))
      const references: string[] = []
      visitMedia(content, attrs => { if (typeof attrs.assetId === 'string') references.push(attrs.assetId) })
      if (references.some(id => !ids.has(id))) throw new Error('Missing media')
      for (const asset of imported.assets) {
        if (typeof asset.id !== 'string' || typeof asset.dataUrl !== 'string' || !asset.dataUrl.startsWith('data:')) throw new Error('Invalid media')
        const blob = await (await fetch(asset.dataUrl)).blob()
        await saveMedia(new File([blob], asset.name, { type: asset.mimeType }), asset.id)
      }
      updateTitle(typeof imported.title === 'string' ? imported.title : 'Imported page')
      editor.commands.setContent(content)
      setNotice('Document imported successfully')
    } catch { setNotice('Could not import this file. Choose a valid Nook document export.') }
  }

  const saveCurrentNow = () => {
    if (!editor) return
    window.clearTimeout(saveTimer.current)
    persistDocument({ id: activeIdRef.current, title: titleRef.current, content: editor.getJSON(), updatedAt: new Date().toISOString() })
    setSaved(true)
  }

  const createDocument = () => {
    if (!editor) return
    const document: NookDocument = { id: crypto.randomUUID(), title: 'Untitled page', content: emptyContent, updatedAt: new Date().toISOString() }
    try { saveCurrentNow() } catch { setNotice('Could not save the current page before creating another') ; return }
    persistDocument(document)
    activeIdRef.current = document.id
    titleRef.current = document.title
    setActiveId(document.id)
    setTitle(document.title)
    editor.commands.setContent(emptyContent)
    editor.commands.focus('start')
  }

  const selectDocument = (document: NookDocument) => {
    if (!editor || document.id === activeIdRef.current) return
    try { saveCurrentNow() } catch { setNotice('Could not save the current page before switching') ; return }
    activeIdRef.current = document.id
    titleRef.current = document.title
    setActiveId(document.id)
    setTitle(document.title)
    editor.commands.setContent(document.content)
    editor.commands.focus('start')
  }

  const toolbar = useMemo(() => [
    { label: 'Bold', icon: Bold, action: () => editor?.chain().focus().toggleBold().run(), active: editor?.isActive('bold') },
    { label: 'Italic', icon: Italic, action: () => editor?.chain().focus().toggleItalic().run(), active: editor?.isActive('italic') },
    { label: 'Strike', icon: Strikethrough, action: () => editor?.chain().focus().toggleStrike().run(), active: editor?.isActive('strike') },
    { label: 'Link', icon: Link2, action: () => { const url = window.prompt('Paste a link'); if (!url) return; if (isSafeLink(url)) editor?.chain().focus().setLink({ href: url }).run(); else setNotice('Use a web, email, or phone link') } },
  ], [editor])

  return <div className="app-shell">
    <header className="topbar">
      <button className="brand brand-home" onClick={onHome} aria-label="Back to Nook landing page"><div className="brand-mark">n</div><span>nook</span><span className="crumb">/</span><span className="crumb">Personal</span><ChevronDown size={14} /></button>
      <div className="top-actions"><button className="icon-button" aria-label="Toggle sidebar" onClick={() => setSidebarOpen(!sidebarOpen)}><PanelLeft size={17} /></button></div>
    </header>
    <div className="workspace">
      {sidebarOpen && <aside className="sidebar">
        <div className="sidebar-head"><span>Workspace</span></div>
        <div className="workspace-name"><div className="workspace-icon">✦</div><span>Personal</span><ChevronDown size={14} /></div>
        <div className="section-label"><span>Pages</span><button className="icon-button" aria-label="Create page" title="Create page" onClick={createDocument}><Plus size={16} /></button></div>
        <nav className="page-list">{documents.map(document => <button key={document.id} className={document.id === activeId ? 'page-item selected' : 'page-item'} onClick={() => selectDocument(document)}><FileText size={16} /><span>{document.title || 'Untitled page'}</span></button>)}</nav>
        <div className="sidebar-bottom"><button onClick={() => setDark(!dark)}><Sparkles size={16} /> {dark ? 'Light mode' : 'Dark mode'}</button><div className="storage"><small>Pages and media stay in this browser</small></div></div>
      </aside>}
      <main className="main-content">
        <div className="document-header"><div className="breadcrumbs"><span>Personal</span><span>/</span><span>Pages</span></div><div className="document-actions"><span className="save-state">{saved ? <><Check size={14} /> Saved locally</> : 'Saving…'}</span><button className="icon-button" aria-label="Import document" title="Import document" onClick={() => importRef.current?.click()}><Upload size={16} /></button><button className="icon-button" aria-label="Export document" title="Export document with media" onClick={() => void exportDocument().catch(() => setNotice('Could not export because a media file is unavailable'))}><ArrowDownToLine size={17} /></button></div></div>
        <div className="editor-wrap">
          <div className="page-icon">✦</div>
          <input className="title-input" value={title} onChange={e => updateTitle(e.target.value)} aria-label="Document title" />
          <div className="toolbar-container"><div className="format-toolbar"><button className="format-select" onClick={() => setBlockMenuOpen(!blockMenuOpen)}>Style <ChevronDown size={13} /></button>{toolbar.map(({ label, icon: Icon, action, active }) => <button key={label} className={active ? 'format-button active' : 'format-button'} aria-label={label} onClick={action}><Icon size={16} /></button>)}<span className="toolbar-divider" /><button className="format-button" aria-label="Bulleted list" onClick={() => editor?.chain().focus().toggleBulletList().run()}><List size={16} /></button><button className="format-button" aria-label="Quote" onClick={() => editor?.chain().focus().toggleBlockquote().run()}><Quote size={16} /></button><span className="toolbar-divider" /><button className="format-button" aria-label="Add media" title="Add image, audio, video, PDF, or file" onClick={() => uploadRef.current?.click()}><ImagePlus size={16} /></button><span className="toolbar-spacer" /><button className="format-button" aria-label="Undo" onClick={() => editor?.chain().focus().undo().run()}><Undo2 size={16} /></button><button className="format-button" aria-label="Redo" onClick={() => editor?.chain().focus().redo().run()}><Redo2 size={16} /></button></div>{blockMenuOpen && <div className="block-menu"><button onClick={() => { editor?.chain().focus().setParagraph().run(); setBlockMenuOpen(false) }}>Paragraph</button><button onClick={() => { editor?.chain().focus().toggleHeading({ level: 1 }).run(); setBlockMenuOpen(false) }}><Heading1 size={16} /> Heading 1</button><button onClick={() => { editor?.chain().focus().toggleHeading({ level: 2 }).run(); setBlockMenuOpen(false) }}><Heading2 size={16} /> Heading 2</button></div>}</div>
          <input ref={uploadRef} className="hidden-input" type="file" onChange={event => { void addMedia(event.target.files?.[0]); event.currentTarget.value = '' }} />
          <input ref={importRef} className="hidden-input" type="file" accept="application/json,.json" onChange={event => { void importDocument(event.target.files?.[0]); event.currentTarget.value = '' }} />
          {notice && <div className="notice" role="status">{notice}<button aria-label="Dismiss notification" onClick={() => setNotice('')}>×</button></div>}
          <EditorContent editor={editor} />
          <div className="editor-hint"><span>Changes save automatically on this device</span><span>Use the toolbar to format</span></div>
        </div>
      </main>
    </div>
  </div>
}

function App() {
  const [screen, setScreen] = useState<'landing' | 'workspace'>(() => window.location.pathname.startsWith('/app') ? 'workspace' : 'landing')
  if (screen === 'workspace') return <EditorWorkspace onHome={() => setScreen('landing')} />
  return <LandingPage />
}

export default App
