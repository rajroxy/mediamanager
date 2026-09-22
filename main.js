/* main.js */
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let win = null;
const pending = [];                       /* files opened before the window exists */

function sendFile(p){ if(win) win.webContents.send('sf-open-media', p); else pending.push(p); }

/* "Open with → ScriptForge" / double-click on a media file */
app.on('open-file', (e, p) => { e.preventDefault(); sendFile(p); });
const argvFile = process.argv.slice(1).find(a => /\.(mp4|webm|mkv|mov|m4v|avi|m3u8|mp3|m4a|wav|flac|ogg|aac)$/i.test(a));

if(!app.requestSingleInstanceLock()){ app.quit(); }
else app.on('second-instance', (_e, argv) => {
  const f = argv.find(a => /\.(mp4|webm|mkv|mov|m4v|avi|m3u8|mp3|m4a|wav|flac|ogg|aac)$/i.test(a));
  if(f) sendFile(f);
  if(win){ if(win.isMinimized()) win.restore(); win.focus(); }
});

app.whenReady().then(() => {
  win = new BrowserWindow({
    width: 880, height: 560, minWidth: 380, minHeight: 220,
    title: 'ScriptForge', backgroundColor: '#1b1a19',
    transparent: !!argvFile,               /* the player-only layer floats */
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true }
  });
  win.loadFile(path.join(__dirname, 'index.html'), argvFile ? { query: { player: argvFile } } : {});
  win.webContents.once('did-finish-load', () => { pending.splice(0).forEach(sendFile); });
});
