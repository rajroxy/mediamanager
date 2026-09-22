/* preload.js */
const { contextBridge, ipcRenderer, shell } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
  openPath:     (p) => shell.openPath(p),          /* VLC / default app */
  showInFolder: (p) => shell.showItemInFolder(p),
  onOpenMedia:  (cb) => ipcRenderer.on('sf-open-media', (_e, p) => cb(p))
});
