import { useEffect, useMemo, useRef, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import { Extension, type JSONContent } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { MediaBlock } from './MediaBlock'
import { getMedia, saveMedia } from './mediaStore'
import { createWelcomeDocument, deleteDocument as removeDocument, listDocuments, saveDocument } from './documentStore'
import type { LocalDocument } from './desktopBridge'
import LandingPage from './LandingPage'
import DownloadPage from './DownloadPage'
import {
  ArrowDownToLine, Bold, Check, ChevronDown, Copy, FileText, Heading1, Heading2, ImagePlus,
  Italic, Link2, List, PanelLeft, Plus, Quote, Redo2, Search, Sparkles, Strikethrough, Trash2, Undo2, Upload,
} from 'lucide-react'

type NookDocument = LocalDocument
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

function findTextMatches(editor: NonNullable<ReturnType<typeof useEditor>>, query: string): Array<{ from: number; to: number }> {
  const normalized = query.trim().toLocaleLowerCase()
  if (!normalized) return []
  const matches: Array<{ from: number; to: number }> = []
  editor.state.doc.descendants((node, position) => {
    if (!node.isText || !node.text) return
    const text = node.text.toLocaleLowerCase()
    let offset = 0
    while (offset <= text.length - normalized.length) {
      const found = text.indexOf(normalized, offset)
      if (found < 0) break
      matches.push({ from: position + found, to: position + found + normalized.length })
      offset = found + normalized.length
    }
  })
  return matches
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
  const trimmed = value.trim()
  if (!trimmed || /[\u0000-\u0020]/.test(trimmed) || trimmed.startsWith('//') || trimmed.startsWith('\\\\')) return false
  if (trimmed.startsWith('/') || trimmed.startsWith('#') || trimmed.startsWith('?') || trimmed.startsWith('./') || trimmed.startsWith('../')) return true
  try { return ['http:', 'https:', 'mailto:', 'tel:'].includes(new URL(trimmed).protocol) } catch { return false }
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

const emptyContent = { type: 'doc', content: [{ type: 'paragraph' }] }

function EditorWorkspace({ onHome }: { onHome: () => void }) {
  const [documents, setDocuments] = useState<NookDocument[]>([])
  const [activeId, setActiveId] = useState('')
  const [title, setTitle] = useState('')
  const [ready, setReady] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [saved, setSaved] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [dark, setDark] = useState(false)
  const saveTimer = useRef<number | undefined>(undefined)
  const saveQueue = useRef<Promise<void>>(Promise.resolve())
  const editGeneration = useRef(0)
  const titleRef = useRef(title)
  const activeIdRef = useRef(activeId)
  const documentsRef = useRef<NookDocument[]>([])
  const uploadRef = useRef<HTMLInputElement>(null)
  const importRef = useRef<HTMLInputElement>(null)
  const [notice, setNotice] = useState('')
  const [blockMenuOpen, setBlockMenuOpen] = useState(false)
  const blockMenuOpenRef = useRef(false)
  const [pageSearch, setPageSearch] = useState('')
  const [findOpen, setFindOpen] = useState(false)
  const [findTerm, setFindTerm] = useState('')
  const [replaceTerm, setReplaceTerm] = useState('')
  const findOpenRef = useRef(false)
  const ingestMediaRef = useRef<(file?: File) => Promise<void>>(async () => undefined)
  titleRef.current = title
  activeIdRef.current = activeId
  documentsRef.current = documents
  blockMenuOpenRef.current = blockMenuOpen
  findOpenRef.current = findOpen

  const persistDocument = async (document: NookDocument) => {
    const task = saveQueue.current.catch(() => undefined).then(() => saveDocument(document))
    saveQueue.current = task
    await task
    const current = documentsRef.current
    const next = current.some(item => item.id === document.id)
      ? current.map(item => item.id === document.id ? document : item)
      : [...current, document]
    documentsRef.current = next
    setDocuments(next)
  }

  const slashCommands = useMemo(() => Extension.create({
    name: 'nookSlashCommands',
    addKeyboardShortcuts() {
      return {
        '/': () => {
          const { selection } = this.editor.state
          if (!selection.empty || selection.$from.parent.type.name !== 'paragraph' || selection.$from.parent.content.size !== 0) return false
          setBlockMenuOpen(true)
          return true
        },
        'Mod-f': () => {
          setFindOpen(true)
          return true
        },
        Escape: () => {
          if (findOpenRef.current) {
            setFindOpen(false)
            return true
          }
          if (!blockMenuOpenRef.current) return false
          setBlockMenuOpen(false)
          return true
        },
      }
    },
  }), [])

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        let loaded = (await listDocuments()).map(document => ({ ...document, content: sanitizeContent(document.content) }))
        if (!loaded.length) {
          const welcome = createWelcomeDocument(initialContent)
          await saveDocument(welcome)
          loaded = [welcome]
        }
        if (!active) return
        documentsRef.current = loaded
        setDocuments(loaded)
        setActiveId(loaded[0].id)
        activeIdRef.current = loaded[0].id
        setTitle(loaded[0].title)
        titleRef.current = loaded[0].title
        setReady(true)
      } catch {
        if (active) setLoadError('Nook could not open local storage. Check the device’s storage permissions, then reload.')
      }
    })()
    return () => { active = false }
  }, [])

  const editor = useEditor({
    extensions: [StarterKit, Link.configure({ openOnClick: false }), MediaBlock, Placeholder.configure({ placeholder: 'Start writing…' }), slashCommands],
    content: emptyContent,
    editorProps: {
      handleDrop: (_view, event) => {
        const file = event.dataTransfer?.files[0]
        if (!file) return false
        event.preventDefault()
        void ingestMediaRef.current(file)
        return true
      },
      handlePaste: (_view, event) => {
        const file = Array.from(event.clipboardData?.items ?? []).find(item => item.kind === 'file' && item.type.startsWith('image/'))?.getAsFile()
        if (!file) return false
        event.preventDefault()
        void ingestMediaRef.current(file)
        return true
      },
    },
    onUpdate: ({ editor: nextEditor }) => {
      const generation = ++editGeneration.current
      setSaved(false)
      window.clearTimeout(saveTimer.current)
      saveTimer.current = window.setTimeout(() => {
        void persistDocument({ id: activeIdRef.current, title: titleRef.current, content: nextEditor.getJSON(), updatedAt: new Date().toISOString() })
          .then(() => { if (generation === editGeneration.current) setSaved(true) }).catch(() => setNotice('Could not save this page. Export a backup before closing.'))
      }, 500)
    },
  })

  useEffect(() => { document.documentElement.dataset.theme = dark ? 'dark' : 'light' }, [dark])
  useEffect(() => {
    if (!editor || !ready) return
    const selected = documentsRef.current.find(document => document.id === activeIdRef.current)
    if (selected) editor.commands.setContent(selected.content, false)
    editor.commands.focus('start')
  }, [editor, ready])
  useEffect(() => () => window.clearTimeout(saveTimer.current), [])

  const updateTitle = (nextTitle: string) => {
    const generation = ++editGeneration.current
    setTitle(nextTitle)
    titleRef.current = nextTitle
    setSaved(false)
    window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      try {
        void persistDocument({ id: activeIdRef.current, title: nextTitle, content: editor?.getJSON() ?? emptyContent, updatedAt: new Date().toISOString() })
          .then(() => { if (generation === editGeneration.current) setSaved(true) }).catch(() => setNotice('Could not save this page. Export a backup before closing.'))
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
    const payload = JSON.stringify({ schemaVersion: 1, id: activeId, title, content: sanitizeContent(content), assets, updatedAt: new Date().toISOString() }, null, 2)
    const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `${title.trim().replace(/[^a-z0-9-_]+/gi, '-').replace(/^-|-$/g, '') || 'document'}.nook.json`
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const addMedia = async (file?: File) => {
    if (!file || !editor) return
    if (file.size > 500 * 1024 * 1024) {
      setNotice('Files larger than 500 MB cannot be added yet')
      return
    }
    try {
      const asset = await saveMedia(file)
      editor.chain().focus().insertContent({ type: 'media', attrs: { assetId: asset.id, name: asset.name, mimeType: asset.mimeType, size: asset.size } }).run()
      setNotice('Media added to this page')
    } catch { setNotice('Could not save this file to local storage') }
  }
  const addMediaBatch = async (files?: FileList | File[]) => {
    if (!files) return
    for (const file of Array.from(files)) await addMedia(file)
  }
  ingestMediaRef.current = addMedia

  const importDocument = async (file?: File) => {
    if (!file || !editor) return
    try {
      if (file.size > 700 * 1024 * 1024) throw new Error('Document package exceeds the import size limit')
      const imported = JSON.parse(await file.text()) as { schemaVersion?: unknown; title?: unknown; content?: { type?: unknown }; assets?: Array<{ id: string; name: string; mimeType: string; size: number; dataUrl: string }> }
      if (imported.schemaVersion !== 1 || imported.content?.type !== 'doc' || !Array.isArray(imported.assets)) throw new Error('Unsupported document format')
      const content = sanitizeContent(imported.content)
      const assetIds = new Set<string>()
      const idMap = new Map<string, string>()
      for (const asset of imported.assets) {
        if (typeof asset.id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(asset.id) || assetIds.has(asset.id) || typeof asset.name !== 'string' || asset.name.length > 255 || typeof asset.mimeType !== 'string' ||
          !Number.isSafeInteger(asset.size) || asset.size < 0 || asset.size > 500 * 1024 * 1024 ||
          typeof asset.dataUrl !== 'string' || !asset.dataUrl.startsWith('data:') || asset.dataUrl.length > 670 * 1024 * 1024) throw new Error('Invalid media')
        assetIds.add(asset.id)
        idMap.set(asset.id, crypto.randomUUID())
      }
      visitMedia(content, attrs => {
        if (typeof attrs.assetId !== 'string' || !idMap.has(attrs.assetId)) throw new Error('Missing media')
        attrs.assetId = idMap.get(attrs.assetId)
      })
      for (const asset of imported.assets) {
        if (typeof asset.id !== 'string' || typeof asset.dataUrl !== 'string') throw new Error('Invalid media')
        const blob = await (await fetch(asset.dataUrl)).blob()
        if (blob.size !== asset.size) throw new Error('Media size does not match package metadata')
        const assetId = idMap.get(asset.id)
        if (!assetId) throw new Error('Invalid media reference')
        await saveMedia(new File([blob], asset.name, { type: asset.mimeType }), assetId)
      }
      const importedTitle = typeof imported.title === 'string' ? imported.title.slice(0, 500) : 'Imported page'
      await saveCurrentNow()
      const document: NookDocument = { id: crypto.randomUUID(), title: importedTitle, content, updatedAt: new Date().toISOString() }
      await persistDocument(document)
      activeIdRef.current = document.id
      editGeneration.current++
      titleRef.current = document.title
      setActiveId(document.id)
      setTitle(importedTitle)
      titleRef.current = importedTitle
      editor.commands.setContent(content, false)
      setSaved(true)
      setNotice('Document imported successfully')
    } catch { setNotice('Could not import this file. Choose a valid Nook document export.') }
  }

  const saveCurrentNow = async () => {
    if (!editor) return
    window.clearTimeout(saveTimer.current)
    await persistDocument({ id: activeIdRef.current, title: titleRef.current, content: editor.getJSON(), updatedAt: new Date().toISOString() })
    setSaved(true)
  }

  const createDocument = async () => {
    if (!editor) return
    const document: NookDocument = { id: crypto.randomUUID(), title: 'Untitled page', content: emptyContent, updatedAt: new Date().toISOString() }
    try { await saveCurrentNow(); await persistDocument(document) } catch { setNotice('Could not save the current page before creating another'); return }
    activeIdRef.current = document.id
    editGeneration.current++
    titleRef.current = document.title
    setActiveId(document.id)
    setTitle(document.title)
    editor.commands.setContent(emptyContent, false)
    editor.commands.focus('start')
  }

  const selectDocument = async (document: NookDocument) => {
    if (!editor || document.id === activeIdRef.current) return
    try { await saveCurrentNow() } catch { setNotice('Could not save the current page before switching'); return }
    activeIdRef.current = document.id
    editGeneration.current++
    titleRef.current = document.title
    setActiveId(document.id)
    setTitle(document.title)
    editor.commands.setContent(sanitizeContent(document.content), false)
    editor.commands.focus('start')
  }

  const duplicateDocument = async () => {
    if (!editor) return
    try {
      await saveCurrentNow()
      const copy: NookDocument = { id: crypto.randomUUID(), title: `${title.trim() || 'Untitled page'} copy`, content: structuredClone(editor.getJSON()), updatedAt: new Date().toISOString() }
      await persistDocument(copy)
      activeIdRef.current = copy.id
      editGeneration.current++
      titleRef.current = copy.title
      setActiveId(copy.id)
      setTitle(copy.title)
      editor.commands.setContent(copy.content, false)
      editor.commands.focus('start')
      setNotice('Page duplicated')
    } catch { setNotice('Could not duplicate this page') }
  }

  const deleteCurrentDocument = async () => {
    if (documentsRef.current.length <= 1) {
      setNotice('Keep at least one page in your workspace')
      return
    }
    if (!window.confirm(`Delete “${title || 'Untitled page'}”? This removes the page from this device.`)) return
    try {
      window.clearTimeout(saveTimer.current)
      const remaining = documentsRef.current.filter(document => document.id !== activeIdRef.current)
      await removeDocument(activeIdRef.current)
      documentsRef.current = remaining
      setDocuments(remaining)
      activeIdRef.current = remaining[0].id
      editGeneration.current++
      titleRef.current = remaining[0].title
      setActiveId(remaining[0].id)
      setTitle(remaining[0].title)
      editor?.commands.setContent(sanitizeContent(remaining[0].content), false)
      setNotice('Page deleted. Stored media remains available to other pages and exports.')
    } catch { setNotice('Could not delete this page') }
  }

  const toolbar = useMemo(() => [
    { label: 'Bold', icon: Bold, action: () => editor?.chain().focus().toggleBold().run(), active: editor?.isActive('bold') },
    { label: 'Italic', icon: Italic, action: () => editor?.chain().focus().toggleItalic().run(), active: editor?.isActive('italic') },
    { label: 'Strike', icon: Strikethrough, action: () => editor?.chain().focus().toggleStrike().run(), active: editor?.isActive('strike') },
    { label: 'Link', icon: Link2, action: () => { const url = window.prompt('Paste a link'); if (!url) return; if (isSafeLink(url)) editor?.chain().focus().setLink({ href: url }).run(); else setNotice('Use a web, email, or phone link') } },
  ], [editor])

  const matches = editor ? findTextMatches(editor, findTerm) : []
  const findNext = () => {
    if (!editor || !matches.length) return
    const next = matches.find(match => match.from > editor.state.selection.from) ?? matches[0]
    editor.chain().focus().setTextSelection(next).run()
  }
  const replaceCurrent = () => {
    if (!editor || !matches.length) return
    const active = matches.find(match => match.from === editor.state.selection.from) ?? matches.find(match => match.from > editor.state.selection.from) ?? matches[0]
    editor.commands.command(({ tr }) => { tr.insertText(replaceTerm, active.from, active.to); return true })
  }
  const replaceAll = () => {
    if (!editor || !matches.length) return
    editor.commands.command(({ tr }) => {
      for (const match of [...matches].reverse()) tr.insertText(replaceTerm, match.from, match.to)
      return true
    })
  }

  if (!ready) return <main className="workspace-loading" role={loadError ? undefined : 'status'}><p>{loadError || 'Opening your local workspace…'}</p>{loadError && <button onClick={() => window.location.reload()}>Reload Nook</button>}</main>

  return <div className="app-shell">
    <header className="topbar">
      {window.nookDesktop ? <div className="brand"><div className="brand-mark">n</div><span>nook</span><span className="crumb">/</span><span className="crumb">Personal</span></div> : <button className="brand brand-home" onClick={onHome} aria-label="Back to Nook landing page"><div className="brand-mark">n</div><span>nook</span><span className="crumb">/</span><span className="crumb">Personal</span><ChevronDown size={14} /></button>}
      <div className="top-actions"><button className="icon-button" aria-label="Toggle sidebar" onClick={() => setSidebarOpen(!sidebarOpen)}><PanelLeft size={17} /></button></div>
    </header>
    <div className="workspace">
      {sidebarOpen && <aside className="sidebar">
        <div className="sidebar-head"><span>Workspace</span></div>
        <div className="workspace-name"><div className="workspace-icon">✦</div><span>Personal</span><ChevronDown size={14} /></div>
        <div className="section-label"><span>Pages</span><button className="icon-button" aria-label="Create page" title="Create page" onClick={() => void createDocument()}><Plus size={16} /></button></div>
        <label className="page-search"><Search size={14} /><input aria-label="Search pages" placeholder="Find a page…" value={pageSearch} onChange={event => setPageSearch(event.target.value)} /></label>
        <nav className="page-list" aria-label="Local pages">{documents.filter(document => document.title.toLocaleLowerCase().includes(pageSearch.toLocaleLowerCase())).map(document => <div key={document.id} className="page-row"><button className={document.id === activeId ? 'page-item selected' : 'page-item'} onClick={() => void selectDocument(document)}><FileText size={16} /><span>{document.title || 'Untitled page'}</span></button>{document.id === activeId && <button className="page-delete" aria-label={`Delete ${document.title || 'untitled page'}`} title="Delete page" onClick={() => void deleteCurrentDocument()}><Trash2 size={14} /></button>}</div>)}</nav>
        <div className="sidebar-bottom"><button onClick={() => setDark(!dark)}><Sparkles size={16} /> {dark ? 'Light mode' : 'Dark mode'}</button><div className="storage"><small>{window.nookDesktop ? 'Pages and media stay on this device' : 'Pages and media stay in this browser'}</small></div></div>
      </aside>}
      <main className="main-content">
        <div className="document-header"><div className="breadcrumbs"><span>Personal</span><span>/</span><span>Pages</span></div><div className="document-actions"><span className="save-state">{saved ? <><Check size={14} /> Saved locally</> : 'Saving…'}</span><button className="icon-button" aria-label="Find and replace in page" title="Find and replace (Ctrl/⌘+F)" onClick={() => setFindOpen(open => !open)}><Search size={16} /></button><button className="icon-button" aria-label="Duplicate page" title="Duplicate page" onClick={() => void duplicateDocument()}><Copy size={16} /></button><button className="icon-button" aria-label="Delete page" title="Delete page" onClick={() => void deleteCurrentDocument()}><Trash2 size={16} /></button><button className="icon-button" aria-label="Import document" title="Import document" onClick={() => importRef.current?.click()}><Upload size={16} /></button><button className="icon-button" aria-label="Export document" title="Export document with media" onClick={() => void exportDocument().catch(() => setNotice('Could not export because a media file is unavailable'))}><ArrowDownToLine size={17} /></button></div></div>
        {findOpen && <section className="find-panel" aria-label="Find and replace">
          <label><span>Find</span><input autoFocus value={findTerm} onChange={event => setFindTerm(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') findNext() }} /></label>
          <label><span>Replace</span><input value={replaceTerm} onChange={event => setReplaceTerm(event.target.value)} /></label>
          <span className="find-count" aria-live="polite">{matches.length} {matches.length === 1 ? 'match' : 'matches'}</span>
          <button className="find-action" onClick={findNext} disabled={!matches.length}>Next</button>
          <button className="find-action" onClick={replaceCurrent} disabled={!matches.length}>Replace</button>
          <button className="find-action" onClick={replaceAll} disabled={!matches.length}>All</button>
          <button className="find-close" aria-label="Close find and replace" onClick={() => setFindOpen(false)}>×</button>
        </section>}
        <div className="editor-wrap">
          <div className="page-icon">✦</div>
          <input className="title-input" value={title} maxLength={500} onChange={e => updateTitle(e.target.value)} aria-label="Document title" />
          <div className="toolbar-container"><div className="format-toolbar"><button className="format-select" onClick={() => setBlockMenuOpen(!blockMenuOpen)}>Style <ChevronDown size={13} /></button>{toolbar.map(({ label, icon: Icon, action, active }) => <button key={label} className={active ? 'format-button active' : 'format-button'} aria-label={label} onClick={action}><Icon size={16} /></button>)}<span className="toolbar-divider" /><button className="format-button" aria-label="Bulleted list" onClick={() => editor?.chain().focus().toggleBulletList().run()}><List size={16} /></button><button className="format-button" aria-label="Quote" onClick={() => editor?.chain().focus().toggleBlockquote().run()}><Quote size={16} /></button><span className="toolbar-divider" /><button className="format-button" aria-label="Add media" title="Add image, audio, video, PDF, or file" onClick={() => uploadRef.current?.click()}><ImagePlus size={16} /></button><span className="toolbar-spacer" /><button className="format-button" aria-label="Undo" onClick={() => editor?.chain().focus().undo().run()}><Undo2 size={16} /></button><button className="format-button" aria-label="Redo" onClick={() => editor?.chain().focus().redo().run()}><Redo2 size={16} /></button></div>{blockMenuOpen && <div className="block-menu"><button onClick={() => { editor?.chain().focus().setParagraph().run(); setBlockMenuOpen(false) }}>Paragraph</button><button onClick={() => { editor?.chain().focus().toggleHeading({ level: 1 }).run(); setBlockMenuOpen(false) }}><Heading1 size={16} /> Heading 1</button><button onClick={() => { editor?.chain().focus().toggleHeading({ level: 2 }).run(); setBlockMenuOpen(false) }}><Heading2 size={16} /> Heading 2</button></div>}</div>
          <input ref={uploadRef} className="hidden-input" type="file" multiple onChange={event => { void addMediaBatch(event.target.files ?? undefined); event.currentTarget.value = '' }} />
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
  const [screen, setScreen] = useState<'landing' | 'download' | 'workspace'>(() => Boolean(window.nookDesktop) || window.location.pathname.startsWith('/app') ? 'workspace' : window.location.pathname.startsWith('/download') ? 'download' : 'landing')
  if (screen === 'workspace') return <EditorWorkspace onHome={() => setScreen('landing')} />
  if (screen === 'download') return <DownloadPage />
  return <LandingPage />
}

export default App
