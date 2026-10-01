/* main.js — Electron main process

   Two standalone apps, one source tree:

     npm run manager  →  Media Manager   (index.html?app=manager)
     npm run player   →  ScriptForge Player (index.html?app=player)
     npm start        →  the full app, exactly as before

   ScriptForge Player is also the app the operating system hands media to:
   double-clicking an audio/video file (or "Open with → ScriptForge Player")
   starts/raises the player window and plays that file. */
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

const MEDIA_EXT = /\\.(mp4|webm|mkv|mov|m4v|avi|m3u8|mp3|m4a|wav|flac|ogg|oga|opus|aac)$/i;
const MEDIA_FILTERS = ['mp4','webm','mkv','mov','m4v','avi','m3u8',
                       'mp3','m4a','wav','flac','ogg','oga','opus','aac'];

/* ── command line ────────────────────────────────────────────────── */
function clean(a){ return String(a || '').replace(/^"+|"+$/g, ''); }
function mediaInArgv(argv){
  return (argv || []).map(clean).find(a => MEDIA_EXT.test(a)) || null;
}
function appModeInArgv(argv){
  const args = (argv || []).slice(1);
  for(let i = 0; i < args.length; i++){
    const a = String(args[i]);
    if(a === '--app') return String(args[i + 1] || '').toLowerCase();
    if(a.indexOf('--app=') === 0) return a.slice(6).toLowerCase();
  }
  return process.env.SF_APP ? String(process.env.SF_APP).toLowerCase() : '';
}

/* ── windows ─────────────────────────────────────────────────────── */
const windows = { full: null, player: null, manager: null };
const pending = [];                       /* files opened before a window exists */

function windowTitle(mode){
  if(mode === 'player')  return 'ScriptForge Player';
  if(mode === 'manager') return 'Media Manager';
  return 'ScriptForge';
}

function createWindow(mode){
  const key = mode || 'full';
  const existing = windows[key];
  if(existing && !existing.isDestroyed()){ existing.show(); existing.focus(); return existing; }

  const isPlayer = mode === 'player';
  const win = new BrowserWindow({
    width:  isPlayer ? 960 : 880,
    height: isPlayer ? 600 : 560,
    minWidth:  isPlayer ? 420 : 380,
    minHeight: isPlayer ? 280 : 220,
    title: windowTitle(mode),
    backgroundColor: '#1b1a19',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true }
  });

  const query = mode ? { app: mode } : null;
  win.loadFile(path.join(__dirname, 'index.html'), query ? { query } : {});

  win.webContents.once('did-finish-load', () => {
    pending.splice(0).forEach(p => win.webContents.send('sf-open-media', p));
  });
  win.on('closed', () => { windows[key] = null; });
  windows[key] = win;
  return win;
}

/* the player app owns media handed over by the OS */
function openInPlayer(filePath){
  if(!filePath) return;
  if(windows.player && !windows.player.isDestroyed()){
    windows.player.webContents.send('sf-open-media', filePath);
    if(windows.player.isMinimized()) windows.player.restore();
    windows.player.show();
    windows.player.focus();
    return;
  }
  pending.push(filePath);
  createWindow('player');
}

/* macOS: "Open with → ScriptForge Player" / double-click */
app.on('open-file', (e, p) => {
  e.preventDefault();
  if(app.isReady()) openInPlayer(p);
  else pending.push(p);
});

function normaliseMode(m){ return (m === 'player' || m === 'manager') ? m : ''; }

/* A packaged build pins itself to one of the two apps (see the
   electron-builder.*.yml files), so the installed player always opens the
   player and the installed manager always opens the library. */
let packagedMode = '';
try{ packagedMode = normaliseMode(String(require('./package.json').sfApp || '').toLowerCase()); }
catch(e){}

const argvFile = mediaInArgv(process.argv);
const startMode = argvFile ? 'player'
                : (normaliseMode(appModeInArgv(process.argv)) || packagedMode || null);

if(!app.requestSingleInstanceLock()){
  app.quit();
}else{
  app.on('second-instance', (_e, argv) => {
    const f = mediaInArgv(argv);
    if(f){ openInPlayer(f); return; }                  /* a second file → player */
    createWindow(normaliseMode(appModeInArgv(argv)) || packagedMode || 'manager');
  });

  app.whenReady().then(() => {
    if(argvFile) pending.push(argvFile);
    createWindow(startMode);

    app.on('activate', () => {
      if(BrowserWindow.getAllWindows().length === 0) createWindow(startMode);
    });
  });
}

app.on('window-all-closed', () => {
  if(process.platform !== 'darwin') app.quit();
});

/* ── IPC ─────────────────────────────────────────────────────────── */
ipcMain.handle('sf-pick-media', async () => {
  const res = await dialog.showOpenDialog({
    title: 'Open media',
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Audio & video', extensions: MEDIA_FILTERS },
      { name: 'All files', extensions: ['*'] }
    ]
  });
  return res.canceled ? [] : res.filePaths;
});
