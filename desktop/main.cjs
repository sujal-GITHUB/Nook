const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron')
const initializeSqlite = require('sql.js')
const crypto = require('node:crypto')
const fs = require('node:fs/promises')
const path = require('node:path')
const { pathToFileURL } = require('node:url')

const isDocumentId = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(value)
const isAssetId = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(value)
const isMedia = value => value && typeof value === 'object' &&
  typeof value.id === 'string' && isAssetId(value.id) &&
  typeof value.name === 'string' && value.name.length > 0 && value.name.length <= 255 &&
  typeof value.mimeType === 'string' && value.mimeType.length <= 127 &&
  Number.isSafeInteger(value.size) && value.size >= 0
const safeFileName = id => `${crypto.createHash('sha256').update(id).digest('hex')}.blob`

let database
let writeQueue = Promise.resolve()
let assetsDirectory
let databaseFile

function queryRows(sql, values = []) {
  const statement = database.prepare(sql)
  const rows = []
  try {
    if (values.length) statement.bind(values)
    while (statement.step()) rows.push(statement.getAsObject())
  } finally { statement.free() }
  return rows
}

function run(sql, values) {
  const statement = database.prepare(sql)
  try { statement.run(values) } finally { statement.free() }
}

function persistDatabase() {
  const snapshot = database.export()
  const task = writeQueue.catch(() => undefined).then(async () => {
    const temporary = `${databaseFile}.${crypto.randomUUID()}.tmp`
    await fs.writeFile(temporary, snapshot, { flag: 'wx', mode: 0o600 })
    await fs.rename(temporary, databaseFile)
  })
  writeQueue = task
  return task
}

function validateDocument(value) {
  if (!value || typeof value !== 'object' || !isDocumentId(value.id) ||
      typeof value.title !== 'string' || value.title.length > 500 ||
      typeof value.updatedAt !== 'string' || !Number.isFinite(Date.parse(value.updatedAt)) ||
      !value.content || value.content.type !== 'doc' || !Array.isArray(value.content.content)) {
    throw new TypeError('Invalid document record')
  }
  const serialized = JSON.stringify(value.content)
  if (serialized.length > 25_000_000) throw new RangeError('Document is too large')
  return { id: value.id, title: value.title, content: serialized, updatedAt: value.updatedAt }
}

function registerHandlers() {
  ipcMain.handle('workspace:list-documents', () => {
    const rows = queryRows('SELECT id, title, content, updatedAt FROM documents ORDER BY updatedAt DESC')
    return rows.map(row => ({ ...row, content: JSON.parse(row.content) }))
  })

  ipcMain.handle('workspace:save-document', (_event, value) => {
    const document = validateDocument(value)
    run(`INSERT INTO documents (id, title, content, updatedAt) VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET title=excluded.title, content=excluded.content, updatedAt=excluded.updatedAt`,
    [document.id, document.title, document.content, document.updatedAt])
    return persistDatabase()
  })

  ipcMain.handle('workspace:delete-document', (_event, id) => {
    if (!isDocumentId(id)) throw new TypeError('Invalid document id')
    run('DELETE FROM documents WHERE id = ?', [id])
    return persistDatabase()
  })

  ipcMain.handle('workspace:save-media', async (_event, metadata, data) => {
    if (!isMedia(metadata) || !(data instanceof Uint8Array) || data.byteLength !== metadata.size || data.byteLength > 500 * 1024 * 1024) {
      throw new TypeError('Invalid media asset')
    }
    const destination = path.join(assetsDirectory, safeFileName(metadata.id))
    const temporary = `${destination}.${crypto.randomUUID()}.tmp`
    await fs.writeFile(temporary, data, { flag: 'wx' })
    await fs.rename(temporary, destination)
    run(`INSERT INTO assets (id, name, mimeType, size) VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET name=excluded.name, mimeType=excluded.mimeType, size=excluded.size`,
    [metadata.id, metadata.name, metadata.mimeType, metadata.size])
    await persistDatabase()
  })

  ipcMain.handle('workspace:get-media', async (_event, id) => {
    if (!isAssetId(id)) throw new TypeError('Invalid asset id')
    const metadata = queryRows('SELECT id, name, mimeType, size FROM assets WHERE id = ?', [id])[0]
    if (!metadata) return null
    try {
      const bytes = await fs.readFile(path.join(assetsDirectory, safeFileName(id)))
      if (bytes.byteLength !== metadata.size) return null
      return { metadata, bytes: new Uint8Array(bytes) }
    } catch (error) {
      if (error && error.code === 'ENOENT') return null
      throw error
    }
  })

  ipcMain.handle('workspace:save-media-copy', async (event, id) => {
    if (!isAssetId(id)) throw new TypeError('Invalid media id')
    const window = BrowserWindow.fromWebContents(event.sender)
    if (!window) throw new Error('The Nook window is no longer available')
    const metadata = queryRows('SELECT id, name, mimeType, size FROM assets WHERE id = ?', [id])[0]
    if (!metadata) throw new Error('The attached file is no longer available')
    const safeName = path.basename(metadata.name).replace(/[\\/:*?"<>|\u0000-\u001f]/g, '-').replace(/[. ]+$/g, '').slice(0, 180) || 'attachment'
    const extension = path.extname(safeName).slice(1).toLowerCase()
    const source = path.join(assetsDirectory, safeFileName(id))
    const result = await dialog.showSaveDialog(window, {
      title: 'Save a copy of this attachment',
      defaultPath: safeName,
      ...(extension ? { filters: [{ name: `${extension.toUpperCase()} file`, extensions: [extension] }] } : {}),
    })
    if (result.canceled || !result.filePath) return false
    const info = await fs.stat(source)
    if (info.size !== metadata.size) throw new Error('The attached file is incomplete')
    await fs.copyFile(source, result.filePath)
    return true
  })

  ipcMain.handle('workspace:export-pdf', async (event, title) => {
    if (typeof title !== 'string' || title.length > 500) throw new TypeError('Invalid PDF title')
    const window = BrowserWindow.fromWebContents(event.sender)
    if (!window) throw new Error('The Nook window is no longer available')
    const safeTitle = title.trim().replace(/[\\/:*?"<>|\u0000-\u001f]/g, '-').replace(/[. ]+$/g, '').slice(0, 120) || 'Nook document'
    const result = await dialog.showSaveDialog(window, {
      title: 'Save document as PDF',
      defaultPath: `${safeTitle}.pdf`,
      filters: [{ name: 'PDF document', extensions: ['pdf'] }],
    })
    if (result.canceled || !result.filePath) return false
    const pdf = await window.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      margins: { top: 0.55, bottom: 0.55, left: 0.62, right: 0.62 },
    })
    await fs.writeFile(result.filePath, pdf, { mode: 0o600 })
    return true
  })
}

async function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 760,
    minHeight: 560,
    backgroundColor: '#1b1e4a',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  })
  window.once('ready-to-show', () => window.show())
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('mailto:')) void shell.openExternal(url)
    return { action: 'deny' }
  })
  const rendererUrl = pathToFileURL(path.join(__dirname, '..', 'dist', 'desktop.html')).href
  window.webContents.on('will-navigate', (event, url) => {
    if (url !== rendererUrl) event.preventDefault()
  })
  await window.loadURL(rendererUrl)
}

app.whenReady().then(async () => {
  const userData = app.getPath('userData')
  assetsDirectory = path.join(userData, 'assets')
  databaseFile = path.join(userData, 'nook.sqlite')
  await fs.mkdir(assetsDirectory, { recursive: true, mode: 0o700 })
  const SQL = await initializeSqlite({ locateFile: file => path.join(app.getAppPath(), 'node_modules', 'sql.js', 'dist', file) })
  database = await fs.readFile(databaseFile).then(bytes => new SQL.Database(new Uint8Array(bytes))).catch(error => {
    if (error && error.code === 'ENOENT') return new SQL.Database()
    throw error
  })
  database.exec(`CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, content TEXT NOT NULL, updatedAt TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, mimeType TEXT NOT NULL, size INTEGER NOT NULL CHECK(size >= 0)
  );`)
  registerHandlers()
  await createWindow()
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) void createWindow() })
}).catch(error => {
  console.error('Could not start Nook desktop:', error)
  app.quit()
})

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('before-quit', () => { if (database) database.close() })
