const { contextBridge, ipcRenderer } = require('electron')
contextBridge.exposeInMainWorld('confluenceDesktop', {
  startupMode: process.argv.includes('--one-data-manual-login') ? 'manual' : 'automatic',
  addPage: url => ipcRenderer.invoke('confluence:add-page', url),
  removePage: id => ipcRenderer.invoke('confluence:remove-page', id),
  getState: () => ipcRenderer.invoke('confluence:state'),
  signIn: () => ipcRenderer.invoke('confluence:sign-in'),
  refresh: () => ipcRenderer.invoke('confluence:refresh'),
  signOut: () => ipcRenderer.invoke('confluence:sign-out'),
  useOffline: () => ipcRenderer.invoke('confluence:use-offline'),
  onChange: callback => {
    const listener = (_event, state) => callback(state)
    ipcRenderer.on('confluence:changed', listener)
    return () => ipcRenderer.removeListener('confluence:changed', listener)
  }
})
