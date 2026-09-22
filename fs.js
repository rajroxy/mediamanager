/* ═══════════════════════════════════════════════════════════
   ScriptForge — File System
   Unified save/open for browser + Electron
   ═══════════════════════════════════════════════════════════ */

const FS = {};

// ═══ Detect environment ═══
FS.isElectron = () => !!(window.electronAPI && window.electronAPI.saveFile);
FS.hasFilePicker = () => typeof window.showSaveFilePicker === 'function';
FS.hasDirectoryPicker = () => typeof window.showDirectoryPicker === 'function';

// ═══ Save a file to disk ═══
FS.saveFile = async function(filename, content, mimeType){
  mimeType = mimeType || 'application/json';

  // 1. Electron native dialog
  if(FS.isElectron() && typeof window.electronAPI.saveFile === 'function'){
    try{
      const res = await window.electronAPI.saveFile(filename, content);
      return { ok: true, path: res?.path || null, method: 'electron' };
    }catch(e){
      return { ok: false, error: e.message };
    }
  }

  // 2. Chrome/Edge showSaveFilePicker (real native picker)
  if(FS.hasFilePicker()){
    try{
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [{
          description: 'Project file',
          accept: { [mimeType]: ['.' + filename.split('.').pop()] }
        }]
      });
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
      return { ok: true, path: handle.name, method: 'picker' };
    }catch(e){
      if(e.name === 'AbortError') return { ok: false, error: 'cancelled' };
      // fall through to download
    }
  }

  // 3. Browser fallback — download to default folder
  try{
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { ok: true, path: '~/Downloads/' + filename, method: 'download' };
  }catch(e){
    return { ok: false, error: e.message };
  }
};

// ═══ Open a file from disk ═══
FS.openFile = function(accept){
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept || '.json,.txt,.md,.html';
    input.onchange = async ev => {
      const f = ev.target.files[0];
      if(!f){ resolve(null); return; }
      try{
        const text = await f.text();
        resolve({ name: f.name, content: text, size: f.size });
      }catch(e){ reject(e); }
    };
    input.click();
  });
};

window.FS = FS;

console.log('%c ✓ fs.js loaded', 'color:#10b981;font-weight:600;');
