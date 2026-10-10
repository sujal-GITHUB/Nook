const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('nookDesktop', Object.freeze({
  platform: process.platform,
  listDocuments: () => ipcRenderer.invoke('workspace:list-documents'),
  saveDocument: document => ipcRenderer.invoke('workspace:save-document', document),
  deleteDocument: id => ipcRenderer.invoke('workspace:delete-document', id),
  saveMedia: (metadata, bytes) => ipcRenderer.invoke('workspace:save-media', metadata, bytes),
  getMedia: id => ipcRenderer.invoke('workspace:get-media', id),
}))
