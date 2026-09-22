/* ═══════════════════════════════════════════════════════════
   ScriptForge — Panels
   Search modal · Video panel (Electron) · Music panel (Vercel-flat)
   ═══════════════════════════════════════════════════════════ */

function isElectron(){
  return !!(window.electronAPI || (typeof process !== 'undefined' && process.versions && process.versions.electron));
}

// ═══ Video panel ═══
function openVideoPanel(){
  const videoPanel = document.getElementById('videoPanel');
  const musicPanel = document.getElementById('musicPanel');
  const playlistPanel = document.getElementById('videoPlaylistPanel');
  if(musicPanel) musicPanel.hidden = true;
  if(playlistPanel) playlistPanel.hidden = true;
  if(!videoPanel) return;
  videoPanel.hidden = false;
  clampFloat(videoPanel);
  setTimeout(() => clampFloat(videoPanel), 60);
}

function closeVideoPanel(){
  const panel = document.getElementById('videoPanel');
  if(panel) panel.hidden = true;
}

// ═══ Music panel ═══
function openMusicPanel(){
  const musicPanel    = document.getElementById('musicPanel');
  const videoPanel    = document.getElementById('videoPanel');
  const playlistPanel = document.getElementById('videoPlaylistPanel');
  if(videoPanel)    videoPanel.hidden    = true;
  if(playlistPanel) playlistPanel.hidden = true;
  if(!musicPanel) return;
  musicPanel.hidden = false;
  if(typeof renderMusicPlayer === 'function') renderMusicPlayer();
  clampFloat(musicPanel);
  setTimeout(() => {
    clampFloat(musicPanel);
    if(typeof initPanelDrag === 'function') initPanelDrag('musicPanel', 'musicPanelHead');
    if(typeof initPanelResize === 'function') initPanelResize('musicPanel', 'musicResize');
    if(typeof applyVisualizerAlign === 'function') applyVisualizerAlign();
    if(typeof startBeatVisualizer === 'function') startBeatVisualizer();
  }, 30);
}

function closeMusicPanel(){
  const panel = document.getElementById('musicPanel');
  if(panel) panel.hidden = true;
}
// ═══ URL validation ═══
function isPlayableUrl(input){
  if(!input) return false;
  if(input.startsWith('http://')) return true;
  if(input.startsWith('https://')) return true;
  if(input.startsWith('blob:')) return true;
  if(input.startsWith('file://') && isElectron()) return true;
  if(input.startsWith('/') && isElectron()) return true;
  return false;
}

// ═══ Keep a floating panel inside the viewport ═══
// Panels remember nothing about where they were opened, and inside an overlay
// pane / a small window a fixed-size player used to hang off the edge. This
// pulls it back in every time it opens.
function clampFloat(el, pad){
  if(!el || el.hidden) return;
  const p = pad || 10;
  const r = el.getBoundingClientRect();
  if(!r.width || !r.height) return;
  const vw = window.innerWidth, vh = window.innerHeight;
  let x = r.left, y = r.top, moved = false;
  if(r.right  > vw - p){ x = Math.max(p, vw - r.width  - p); moved = true; }
  if(r.bottom > vh - p){ y = Math.max(p, vh - r.height - p); moved = true; }
  if(x < p){ x = p; moved = true; }
  if(y < p){ y = p; moved = true; }
  if(!moved) return;
  el.style.transform = 'none';
  el.style.left = Math.round(x) + 'px';
  el.style.top  = Math.round(y) + 'px';
  el.style.right = 'auto';
}
window.clampFloat = clampFloat;

// ═══ Drag panel by header ═══
function initPanelDrag(panelId, headId){
  const panel = document.getElementById(panelId);
  const head = document.getElementById(headId);
  if(!panel || !head) return;
  let dragging = false, ox = 0, oy = 0;
  head.addEventListener('mousedown', (e) => {
    if(e.target.closest('button')) return;
    if(e.target.closest('input')) return;
    dragging = true;
    const r = panel.getBoundingClientRect();
    ox = e.clientX - r.left;
    oy = e.clientY - r.top;
    panel.style.transform = 'none';
    panel.style.left = r.left + 'px';
    panel.style.top = r.top + 'px';
    panel.style.right = 'auto';
    e.preventDefault();
  });
  document.addEventListener('mousemove', (e) => {
    if(!dragging) return;
    panel.style.left = Math.max(8, Math.min(window.innerWidth - 60, e.clientX - ox)) + 'px';
    panel.style.top = Math.max(8, Math.min(window.innerHeight - 40, e.clientY - oy)) + 'px';
  });
  document.addEventListener('mouseup', () => { dragging = false; });
}

// ═══ Resize panel by handle ═══
function initPanelResize(panelId, handleId){
  const panel = document.getElementById(panelId);
  const handle = document.getElementById(handleId);
  if(!panel || !handle) return;
  if(handle.dataset.resizeWired === '1') return;   // guard against double-binding
  handle.dataset.resizeWired = '1';

  let resizing = false, startX = 0, startY = 0, startW = 0, startH = 0;

  handle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    resizing = true;
    startX = e.clientX;
    startY = e.clientY;
    startW = panel.offsetWidth;
    startH = panel.offsetHeight;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'nwse-resize';
  });

  document.addEventListener('mousemove', (e) => {
    if(!resizing) return;
    const minW = (panelId === 'musicPanel') ? 360 : 300;
    const minH = (panelId === 'musicPanel') ? 600 : 240;
    const newW = Math.max(minW, startW + (e.clientX - startX));
    const newH = Math.max(minH, startH + (e.clientY - startY));
    panel.style.width = newW + 'px';
    panel.style.height = newH + 'px';
  });

  document.addEventListener('mouseup', () => {
    if(!resizing) return;
    resizing = false;
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  });
}

// ═══ Click routing ═══
// Player button — left = music panel, right = video panel
// (mousedown so a right-click open feels instant; context menu suppressed)
document.addEventListener('mousedown', (e) => {
  if(!e.target.closest('[data-act="open-music"]')) return;
  if(e.button !== 0 && e.button !== 2) return;
  e.preventDefault();
  e.stopPropagation();
  if(e.button === 2) openVideoPanel();
  else               openMusicPanel();
}, true);

document.addEventListener('contextmenu', (e) => {
  if(!e.target.closest('[data-act="open-music"]')) return;
  e.preventDefault();
  e.stopPropagation();
}, true);

document.addEventListener('click', (e) => {
  const t = e.target;

    // Video panel close
  if(t.closest('[data-act="video-close"]')){ closeVideoPanel(); return; }

  // Music panel
  if(t.closest('[data-act="music-close"]')){ closeMusicPanel(); return; }

    if(t.closest('[data-act="music-plus"]')){
    const w = document.getElementById('musicUrlWrap');
    const inp = document.getElementById('musicUrlInput');
    if(!w) return;
    if(w.hidden){
      w.hidden = false;
      if(inp){ inp.value = ''; setTimeout(() => inp.focus(), 30); }
    } else {
      const u = inp?.value.trim() || '';
      w.hidden = true;
      if(inp) inp.value = '';               // clear BEFORE add so Enter can't double-fire
      if(isPlayableUrl(u)){
        if(typeof musicAddURL === 'function') musicAddURL(u);
        if(typeof renderMusicPlayer === 'function') renderMusicPlayer();
      } else if(u){
        toast('Not a valid URL', 'warn');
      }
    }
    return;
  }
}, true);

// Right-click on + → open file picker
document.addEventListener('contextmenu', (e) => {
  const t = e.target;
  const plusBtn = t.closest('[data-act="music-plus"]');
  if(plusBtn){
    e.preventDefault();
    e.stopPropagation();
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.multiple = true;
    input.onchange = (ev) => {
      const files = ev.target.files;
      if(!files || !files.length) return;
      if(typeof musicAddFiles === 'function') musicAddFiles(files);
    };
    input.click();
    return;
  }
}, true);

// Right-click on video + → open file picker for video files
document.addEventListener('contextmenu', (e) => {
  const plusBtn = e.target.closest('[data-act="video-plus"]');
  if(!plusBtn) return;
  e.preventDefault();
  e.stopPropagation();

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'video/*,.mkv,.avi,.mov,.webm,.m4v';
  input.multiple = false;
  input.onchange = (ev) => {
    const file = ev.target.files && ev.target.files[0];
    if(!file) return;
    videoPlayFile(file);
  };
  input.click();
}, true);

// Enter key on panel inputs
document.addEventListener('keydown', (e) => {
  if(e.key !== 'Enter') return;
  if(e.target.id === 'musicUrlInput'){ e.preventDefault(); document.querySelector('[data-act="music-plus"]')?.click(); return; }
  if(e.target.id === 'videoSearchInput'){ e.preventDefault(); document.querySelector('[data-act="video-plus"]')?.click(); return; }
});

// Init drag + resize
setTimeout(() => {
  initPanelDrag('videoPanel', 'videoPanelHead');
  initPanelDrag('musicPanel', 'musicPanelHead');
  // Video panel is fixed landscape (880×560) — resize handle removed (640px is the playlist panel)
  initPanelResize('musicPanel', 'musicResize');
}, 500);

// Expose
window.openVideoPanel = openVideoPanel;
window.openMusicPanel = openMusicPanel;
window.closeMusicPanel = closeMusicPanel;
window.isElectron = isElectron;

console.log('%c ✓ panels.js loaded', 'color:#10b981;font-weight:600;');

// ═══════════════════════════════════════════════════════════
//   VIDEO PLAYLIST — persistent storage
// ═══════════════════════════════════════════════════════════

S.config.videoPlaylist = S.config.videoPlaylist || [];

// ═══════════════════════════════════════════════════════════
//   PLAYLIST DE-DUPE
//   One identity per item so the same song/video can't land in a playlist
//   twice, whether it was added from a URL or picked from the file manager.
// ═══════════════════════════════════════════════════════════

// Last path segment without query/hash, lower-cased; %xx escapes decoded so
// "my%20song.mp3" matches the same file picked from disk ("my song.mp3")
function playlistBaseName(src){
  const last = String(src || '').split(/[?#]/)[0].replace(/\\/g, '/').split('/').pop().trim();
  let out = last.toLowerCase();
  try { out = decodeURIComponent(out); } catch(e) { /* malformed escape — keep raw */ }
  return out;
}

// Real source when we can resolve one, else the plain file name
function playlistFileKey(file){
  if(!file) return '';
  let path = null;
  if(window.electronPath && window.electronPath.getPathForFile){
    const p = window.electronPath.getPathForFile(file);
    if(p) path = 'file://' + String(p).replace(/\\/g, '/');
  }
  if(!path && file.path) path = 'file://' + String(file.path).replace(/\\/g, '/');
  return path || file.name || '';
}

// Browser picks get a fresh object URL every time, so identity for those
// rests on the file itself: name + size + mtime.
function playlistFileStamp(file){
  if(!file) return '';
  return [file.name, file.size, file.lastModified].join(':');
}

// Is this source already in the list? Same URL/path, same file fingerprint,
// or the same media header — the file's own name (before any rename), with or
// without its extension. Renaming a row or pasting a URL under a different
// title can't sneak a copy in; the underlying file still recognises itself.
// Two real on-disk paths only match exactly, so same-named files in different
// folders stay distinct.
function playlistHeaderOf(entry){
  if(!entry) return '';
  const src = entry.srcKey || entry.url || '';
  const base = playlistBaseName(src);
  if(!base) return '';
  const noExt = base.replace(/\.[a-z0-9]{1,5}$/i, '');
  return noExt || base;
}

function playlistHasDuplicate(list, key, stamp, header){
  if(!list || !list.length || !key) return false;
  const keyIsPath = key.indexOf('file://') === 0;
  const base = playlistBaseName(key);
  const head = header || playlistHeaderOf({ srcKey: key });
  for(let i = 0; i < list.length; i++){
    const t = list[i] || {};
    const other = t.srcKey || t.url || '';
    if(other && other === key) return true;
    if(keyIsPath && other.indexOf('file://') === 0) continue;
    if(stamp && t.srcStamp && t.srcStamp === stamp) return true;
    if(head && other){
      const otherHead = t.srcHeader || playlistHeaderOf(t);
      if(otherHead && otherHead === head) return true;
    }
  }
  return false;
}

// The music add helpers live in app.js, which loads after this file, so wrap
// them once the DOM is ready — duplicates are refused from both doors (a
// pasted URL and the file manager) the same way the video playlist does it.
function installMusicDedupe(){
  if(typeof window.musicAddURL !== 'function' || window.musicAddURL.__dedupe) return;

  const addURL = window.musicAddURL;
  window.musicAddURL = function(url){
    if(!url) return;
    if(playlistHasDuplicate(Music.playlist, url)){
      toast('Duplicate', 'warn');
      return;
    }
    addURL(url);
  };
  window.musicAddURL.__dedupe = true;

  const addFiles = window.musicAddFiles;
  if(typeof addFiles === 'function'){
    window.musicAddFiles = function(files){
      const all = Array.from(files || []);
      const accepted = [];   // also check within the batch itself
      const fresh = all.filter(function(f){
        const key = playlistFileKey(f);
        const stamp = playlistFileStamp(f);
        if(playlistHasDuplicate(Music.playlist, key, stamp)) return false;
        for(let i = 0; i < accepted.length; i++){
          if(playlistHasDuplicate(accepted, key, stamp)) return false;
        }
        accepted.push({ srcKey: key, srcStamp: stamp });
        return true;
      });
      const dupes = all.length - fresh.length;
      if(!fresh.length){
        toast('Duplicate', 'warn');
        return;
      }
      const before = Music.playlist.length;
      addFiles(fresh);
      // Stamp the new rows so the same file is recognisable next time
      const added = Music.playlist.slice(before);
      for(let i = 0; i < added.length && i < fresh.length; i++){
        added[i].srcKey = playlistFileKey(fresh[i]);
        added[i].srcStamp = playlistFileStamp(fresh[i]);
        added[i].srcHeader = playlistHeaderOf({ srcKey: added[i].srcKey });
      }
      S.config.musicPlaylist = Music.playlist;
      save();
      if(dupes) toast(dupes + ' duplicate' + (dupes > 1 ? 's' : '') + ' skipped', 'warn');
    };
    window.musicAddFiles.__dedupe = true;
  }
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', installMusicDedupe);
} else {
  installMusicDedupe();
}
// Catch-all for the case where app.js is still parsing when the DOM is ready
if(typeof window.addEventListener === 'function') window.addEventListener('load', installMusicDedupe);

function videoPlaylistAdd(url, name, source, srcKey, srcStamp){
  if(!url) return;
  const key = srcKey || url;
  if(playlistHasDuplicate(S.config.videoPlaylist, key, srcStamp)){
    toast('Duplicate', 'warn');
    return;
  }
  if(S.config.videoPlaylist.length >= VP_PER_PAGE * VP_MAX_PAGES){
    toast('Playlist full (max ' + (VP_PER_PAGE * VP_MAX_PAGES) + ' videos)', 'warn');
    return;
  }
  S.config.videoPlaylist.push({
    url: url,
    name: name || url.split('/').pop() || 'Untitled',
    source: source || 'url',
    srcKey: key,
    srcStamp: srcStamp || '',
    srcHeader: playlistHeaderOf({ srcKey: key }),
    added: Date.now()
  });
  save();
  renderVideoPlaylist();
  toast('Added to playlist');
}

function videoPlaylistRemove(index){
  S.config.videoPlaylist.splice(index, 1);
  save();
  renderVideoPlaylist();
}

// Shared look for the playlist row actions (rename · remove) — same ghost buttons
// the music playlist rows use: borderless, revealed on row hover
const VPL_ACTION_CSS =
  'width:22px;height:22px;display:flex;align-items:center;justify-content:center;' +
  'background:transparent;border:none;color:var(--ink-4);padding:0;' +
  'cursor:pointer;border-radius:var(--r-sm);opacity:0;pointer-events:none;flex-shrink:0;' +
  'transition:opacity 120ms var(--ease), background 100ms var(--ease), color 100ms var(--ease);';

// ═══════════════════════════════════════════════════════════
//   VIDEO PLAYER LOGIC
// ═══════════════════════════════════════════════════════════

// ─── Session playlist / history stack ───
const VideoHistory = {
  stack: [],
  index: -1,
  push(action){
    if(!action) return;
    const cur = this.stack[this.index];
    if(cur && cur.type === action.type && cur.value === action.value) return;
    this.stack = this.stack.slice(0, this.index + 1);
    this.stack.push(action);
    this.index = this.stack.length - 1;
  },
  prev(){
    if(this.index <= 0) return;
    this.index--;
    replay(this.stack[this.index]);
  },
  next(){
    if(this.index >= this.stack.length - 1) return;
    this.index++;
    replay(this.stack[this.index]);
  },
  current(){
    return this.stack[this.index] || null;
  }
};

function replay(action){
  if(!action) return;
  if(action.type === 'url')  videoPlayDirect(action.value, true);
  if(action.type === 'file') videoPlayDirect(action.value, true);
}

// ─── Input router — direct video URLs only ───
function videoHandleInput(v){
  if(!v) return;
  if(/\.(mp4|webm|m3u8|ogg|mov|mkv|m4v)(\?.*)?$/i.test(v)){
    videoPlaylistAdd(v, null, 'url');
    return;
  }
  toast('Not a valid video URL', 'warn');
}

// ─── Play a direct video URL ───
function videoPlayDirect(url, silent){
  const stage = document.getElementById('videoStage');
  const body  = document.getElementById('videoBody');
  if(!stage) return;

  // Remove old video but keep the floating bar
  const oldV = stage.querySelector('video');
  if(oldV) oldV.remove();

  const v = document.createElement('video');
  v.autoplay = true;
  // No forced CORS mode — direct video URLs usually send no CORS headers,
  // and requesting them makes the browser refuse to load the media at all.
  v.removeAttribute('crossorigin');
  v.dataset.aspect = S.config.videoAspect || 'default';
  v.style.cssText = 'width:100%;height:100%;background:#000;display:block;';
  v.src = url;
  stage.insertBefore(v, stage.firstChild);

  // Hide the empty-state
  const emptyEl = stage.querySelector('.video-empty');
  if(emptyEl) emptyEl.style.display = 'none';

  if(body) body.classList.remove('no-video');

  // Restore volume
  v.volume = (S.config.videoVolume !== undefined) ? S.config.videoVolume : 0.8;
  updateVolumeIcon(v.volume);

  // Keep the selected-row pointer in sync with what is actually loaded, so a
  // stale selection can never hijack the play/pause button.
  const list = S.config.videoPlaylist || [];
  for(let k = 0; k < list.length; k++){
    if(list[k].url === url){ _vpSelectedIndex = k; break; }
  }

  v.play().catch(function(e){
    if(e && e.name === 'AbortError') return;
    console.warn('video:', e);
    setVideoPlayIcon(false);
    if(typeof mediaErrorMessage === 'function') toast(mediaErrorMessage(e, { url: url }), 'err');
  });

  v.addEventListener('timeupdate', function(){
    const dur = v.duration || 0;
    if(dur){
      const seek = document.getElementById('vpSeek');
      if(seek) seek.value = (v.currentTime / dur) * 100;
      const curEl = document.getElementById('vpCur');
      if(curEl) curEl.textContent = fmtTime(v.currentTime);
      const durEl = document.getElementById('vpDur');
      if(durEl) durEl.textContent = fmtTime(dur);
    }
  });
  v.addEventListener('loadedmetadata', function(){
    const durEl = document.getElementById('vpDur');
    if(durEl) durEl.textContent = fmtTime(v.duration);
  });
  v.addEventListener('play',  function(){ setVideoPlayIcon(true);  });
  v.addEventListener('pause', function(){ setVideoPlayIcon(false); });
  v.addEventListener('ended', function(){ setVideoPlayIcon(false); });
  v.addEventListener('volumechange', function(){ updateVolumeIcon(v.volume); });

  if(!silent) VideoHistory.push({ type:'url', value:url });
}

// ─── Play a local file ───
function videoPlayFile(file){
  if(!file) return;

  let url = null;
  let source = 'file';
  if(window.electronPath && window.electronPath.getPathForFile){
    const p = window.electronPath.getPathForFile(file);
    if(p) url = 'file://' + p.replace(/\\/g, '/');
  }
  if(!url && file.path) url = 'file://' + file.path.replace(/\\/g, '/');
  if(!url){ url = URL.createObjectURL(file); source = 'blob'; }

  videoPlaylistAdd(url, file.name.replace(/\.[^.]+$/, ''), source,
    playlistFileKey(file), playlistFileStamp(file));
}

// ─── Play icon ───
function setVideoPlayIcon(playing){
  const icon = document.getElementById('vpPlayIcon');
  if(icon) icon.className = playing ? 'bi bi-pause-fill' : 'bi bi-play-fill';
}

// ─── Volume icon + label ───
function updateVolumeIcon(vol){
  const icon = document.getElementById('vpVolIcon');
  if(icon){
    if(vol === 0)      icon.className = 'bi bi-volume-mute';
    else if(vol < 0.5) icon.className = 'bi bi-volume-down';
    else               icon.className = 'bi bi-volume-up';
  }
  const pct = document.getElementById('vpVolPct');
  if(pct) pct.textContent = Math.round(vol * 100) + '%';
}

// ─── Play / pause ───
function toggleVideoPlay(){
  const stage = document.getElementById('videoStage');
  if(!stage) return;
  const v = stage.querySelector('video');
  if(!v){ toast('Nothing loaded', 'warn'); return; }
  if(v.paused) v.play().catch(function(e){ console.warn(e); });
  else v.pause();
}

// ─── Fullscreen ───
function toggleVideoFullscreen(){
  // Fullscreen the video body (stage + docked control bar) so the controls stay reachable
  const el = document.getElementById('videoBody') || document.getElementById('videoStage');
  if(!el) return;
  // Exit native or fallback fullscreen first
  if(document.fullscreenElement){ document.exitFullscreen(); return; }
  if(el.classList.contains('vp-fs-fallback')){ el.classList.remove('vp-fs-fallback'); return; }
  if(el.requestFullscreen){
    el.requestFullscreen().catch(function(){
      // Browser rejected the request (e.g. right-click activation) — use CSS fullscreen instead
      el.classList.add('vp-fs-fallback');
    });
  } else {
    el.classList.add('vp-fs-fallback');
  }
}

// ═══════════════════════════════════════════════════════════
//   CLICK WIRING
// ═══════════════════════════════════════════════════════════

// ─── Left-click + → toggle search box, submit on second click ───
document.addEventListener('click', function(e){
  const plus = e.target.closest('[data-act="video-plus"]');
  if(!plus) return;
  e.preventDefault();
  e.stopPropagation();

  const w   = document.getElementById('videoSearchWrap');
  const inp = document.getElementById('videoSearchInput');
  if(!w) return;

  if(w.hidden){
    w.hidden = false;
    if(inp){ inp.value = ''; setTimeout(function(){ inp.focus(); }, 30); }
  } else {
    const v = (inp && inp.value || '').trim();
    w.hidden = true;
    if(inp) inp.value = '';
    if(v) videoHandleInput(v);
  }
}, true);

// ─── Right-click + → file picker ───
document.addEventListener('contextmenu', function(e){
  const plus = e.target.closest('[data-act="video-plus"]');
  if(!plus) return;
  e.preventDefault();
  e.stopPropagation();

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'video/*,.mkv,.avi,.mov,.webm,.m4v';
  input.multiple = false;
  input.onchange = function(ev){
    const file = ev.target.files && ev.target.files[0];
    if(file) videoPlayFile(file);
  };
  input.click();
}, true);

// ─── Enter in search input ───
document.addEventListener('keydown', function(e){
  if(e.key !== 'Enter') return;
  if(e.target.id !== 'videoSearchInput') return;
  e.preventDefault();
  const v = (e.target.value || '').trim();
  const w = document.getElementById('videoSearchWrap');
  const inp = e.target;
  if(w) w.hidden = true;
  if(inp) inp.value = '';
  if(v) videoHandleInput(v);
});

// ─── Seek bar ───
document.addEventListener('input', function(e){
  if(e.target.id !== 'vpSeek') return;
  const stage = document.getElementById('videoStage');
  if(!stage) return;
  const v = stage.querySelector('video');
  if(v && v.duration) v.currentTime = (parseFloat(e.target.value) / 100) * v.duration;
}, true);

// ─── Volume slider ───
document.addEventListener('input', function(e){
  if(e.target.id !== 'vpVol') return;
  const stage = document.getElementById('videoStage');
  if(!stage) return;
  const v = stage.querySelector('video');
  const vol = parseFloat(e.target.value) / 100;
  if(v) v.volume = vol;
  S.config.videoVolume = vol;
  updateVolumeIcon(vol);
  save();
}, true);

// ─── Init ───
window.addEventListener('load', function(){
  setTimeout(function(){
    const body = document.getElementById('videoBody');
    const vol = document.getElementById('vpVol');
    if(vol) vol.value = ((S.config.videoVolume !== undefined ? S.config.videoVolume : 0.8) * 100);

    const cur = S.config.videoAspect || 'default';
    document.querySelectorAll('.vc-aspect-item').forEach(function(b){
      b.classList.toggle('active', b.dataset.aspect === cur);
    });
  }, 100);
});

// ═══════════════════════════════════════════════════════════
//   VIDEO VOLUME — tap N% · hold to ramp
// ═══════════════════════════════════════════════════════════

const VOL_TAP        = 0.01;   // 1% per tap
const VOL_TICK_MS    = 100;    // 100ms between hold ticks
const VOL_RAMP_AFTER = 400;    // after 400ms, accelerate
const VOL_SLOW       = 0.02;   // 2% per tick (slow ramp)
const VOL_MED        = 0.05;   // 5% per tick (fast ramp)
const VOL_HOLD_DELAY = 250;    // don't ramp until held this long

let _volHoldTimer = null;
let _volHoldStart = 0;
let _volHoldDir   = 0;

function getVideoEl(){
  const stage = document.getElementById('videoStage');
  return stage ? stage.querySelector('video') : null;
}

function getVideoVolume(){
  return (S.config.videoVolume !== undefined) ? S.config.videoVolume : 0.8;
}

function setVideoVolume(vol){
  vol = Math.max(0, Math.min(1, Math.round(vol * 100) / 100));
  const v = getVideoEl();
  if(v) v.volume = vol;
  S.config.videoVolume = vol;
  updateVolumeIcon(vol);
  save();
}

function startVolHold(dir){
  stopVolHold();
  _volHoldStart = Date.now();
  _volHoldDir   = dir;

  // 1) immediate tap — always fires
  setVideoVolume(getVideoVolume() + dir * VOL_TAP);

  // 2) ramp starts after VOL_HOLD_DELAY ms
  _volHoldTimer = setTimeout(function(){
    _volHoldTimer = setInterval(function(){
      const elapsed = Date.now() - _volHoldStart;
      const step = (elapsed > VOL_RAMP_AFTER) ? VOL_MED : VOL_SLOW;

      const next = getVideoVolume() + dir * step;
      if(next <= 0 || next >= 1){
        setVideoVolume(next);
        stopVolHold();
        return;
      }
      setVideoVolume(next);
    }, VOL_TICK_MS);
  }, VOL_HOLD_DELAY);
}

function stopVolHold(){
  if(_volHoldTimer){
    clearInterval(_volHoldTimer);
    clearTimeout(_volHoldTimer);
    _volHoldTimer = null;
  }
  _volHoldDir = 0;
}

document.addEventListener('mousedown', function(e){
  if(!e.target.closest('#vpVolBtn')) return;
  if(e.button !== 0 && e.button !== 2) return;
  e.preventDefault();
  e.stopPropagation();
  startVolHold(e.button === 2 ? +1 : -1);
}, true);

document.addEventListener('mouseup', function(){
  if(_volHoldTimer) stopVolHold();
}, true);

document.addEventListener('click', function(e){
  if(!e.target.closest('#vpVolBtn')) return;
  e.preventDefault();
  e.stopPropagation();
}, true);

document.addEventListener('contextmenu', function(e){
  if(!e.target.closest('#vpVolBtn')) return;
  e.preventDefault();
  e.stopPropagation();
}, true);

document.addEventListener('DOMContentLoaded', function(){
  setTimeout(function(){
    setVideoVolume(getVideoVolume());
  }, 200);
});

// ═══════════════════════════════════════════════════════════
//   VIDEO PLAYLIST — button + modal
// ═══════════════════════════════════════════════════════════

/* The Playlist button in the video bar opens the floating queue strip under
   the player — that lives in chapter-buttons.js. The full playlist panel is
   reached from the strip's expand button (and from openVideoPlaylist()), so
   the button no longer opens it directly and can't alternate between the two. */

document.addEventListener('click', function(e){
  if(!e.target.closest('[data-act="vpl-close"]')) return;
  e.preventDefault();
  e.stopPropagation();
  closeVideoPlaylist();
}, true);

// ═══════════════════════════════════════════════════════════
//   VIDEO PLAYLIST — draggable panel
// ═══════════════════════════════════════════════════════════

function openVideoPlaylist(){
  const panel = document.getElementById('videoPlaylistPanel');
  if(!panel) return;
  panel.hidden = false;
  renderVideoPlaylist();
  setTimeout(function(){
    initPanelDrag('videoPlaylistPanel', 'videoPlaylistHead');
    initPanelResize('videoPlaylistPanel', 'videoPlaylistResize');
  }, 30);
}

function closeVideoPlaylist(){
  const panel = document.getElementById('videoPlaylistPanel');
  if(panel) panel.hidden = true;
}

function renderVideoPlaylist(){
    const body = document.getElementById('videoPlaylistBody');
    if(!body) return;
    
    const list = S.config.videoPlaylist || [];
    const totalPages = Math.max(1, Math.ceil(list.length / VP_PER_PAGE));
    
    // Ensure current page is valid
    if(_vpPage >= totalPages) _vpPage = totalPages - 1;
    if(_vpPage < 0) _vpPage = 0;
    
    const start = _vpPage * VP_PER_PAGE;
    const end = Math.min(start + VP_PER_PAGE, list.length);
    
    // Clear existing content
    body.innerHTML = '';
    
    // Render empty state if no tracks
    if(!list.length){
        body.innerHTML =
            '<div class="panel-empty vpl-empty">' +
                '<div class="vpl-empty-hint">Click <span class="vpl-empty-key">+</span> to add.</div>' +
            '</div>';
        updateVplPager(0, 0, 0);
        return;
    }
    
    // Render track rows
    for(let i = start; i < end; i++){
        const t = list[i];
        const isCurrent = (t.url === (VideoHistory.current() ? VideoHistory.current().value : null));
        
        const row = document.createElement('div');
        row.className = 'vpl-row' + (isCurrent ? ' active' : '');
        row.style.cssText = 
            'display:flex;align-items:center;gap:10px;width:100%;' +
            'padding:8px 10px;border-radius:6px;cursor:pointer;' +
            'background:' + (isCurrent ? 'var(--surface-3)' : 'transparent') + ';' +
            'margin-bottom:2px;';
            
        // Origin label — same wording as the music playlist rows
        const srcLabel = (t.source === 'file' || t.source === 'blob') ? 'Internal' : 'External';

        row.innerHTML =
            '<span class="vpl-row-body" style="flex:1;min-width:0;text-align:left;overflow:hidden;">' +
                '<span class="vpl-row-name" title="' + esc(t.name) + '" ' +
                    'style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;' +
                    'font-size:12.5px;line-height:1.35;color:' + (isCurrent ? 'var(--ink)' : 'var(--ink-2)') + ';">' +
                    esc(t.name) +
                '</span>' +
                '<span class="vpl-row-source" style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;' +
                    'font-size:10.5px;line-height:1.2;margin-top:1px;letter-spacing:.01em;color:' +
                    (isCurrent ? 'var(--ink-3)' : 'var(--ink-4)') + ';">' +
                    srcLabel +
                '</span>' +
            '</span>' +
            '<button class="vpl-rename" data-vpl-rename="' + i + '" title="Rename" ' +
                'style="' + VPL_ACTION_CSS + 'margin-right:2px;">' +
                '<i class="bi bi-pencil" style="font-size:11px;line-height:1;display:block;"></i>' +
            '</button>' +
            '<button class="vpl-del" data-vpl-del="' + i + '" title="Remove" ' +
                'style="' + VPL_ACTION_CSS + '">' +
                '<svg width="10" height="10" viewBox="0 0 10 10" fill="none">' +
                    '<path d="M2 2L8 8M8 2L2 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
                '</svg>' +
            '</button>';
            
        // Row actions (play · rename · remove) fade in on hover
        const showActions = function(on){
            const btns = row.querySelectorAll('.vpl-play, .vpl-rename, .vpl-del');
            for(let k = 0; k < btns.length; k++){
                btns[k].style.opacity = on ? '1' : '0';
                btns[k].style.pointerEvents = on ? 'auto' : 'none';
            }
        };

        row.addEventListener('mouseenter', function(){
            if(!isCurrent) row.style.background = 'var(--surface-3)';
        });
        row.addEventListener('mouseleave', function(){
            // Keep the actions visible while a rename field is open
            if(row.querySelector('.vpl-rename-edit')) return;
            row.style.background = isCurrent ? 'var(--surface-3)' : 'transparent';
            showActions(false);
        });
        row.addEventListener('mouseover', function(e){
            if(e.target.closest('.vpl-play') || e.target.closest('.vpl-rename') || e.target.closest('.vpl-del')) return;
            showActions(true);
        });

        // Row click only selects — playback happens via the row's Play button
        // or the player's play/pause control.
        row.addEventListener('click', function(e){
            if(e.target.closest('.vpl-play') || e.target.closest('.vpl-rename') || e.target.closest('.vpl-del')) return;
            if(e.target.closest('.vpl-rename-edit')) return;
            _vpSelectedIndex = i;
        });
        
        body.appendChild(row);
    }
    
    // Update the numbering pager (same system as the music panel: "<page>-<last item on page>")
    updateVplPager(_vpPage + 1, totalPages, list.length);
}

function playFromVideoPlaylist(index){
  const list = S.config.videoPlaylist || [];
  const t = list[index];
  if(!t) return;

  videoPlayDirect(t.url);
  VideoHistory.push({ type: t.source === 'file' ? 'file' : 'url', value: t.url, name: t.name });
  // The selection is now the playing row
  _vpSelectedIndex = index;
  renderVideoPlaylist();
  toast('Playing: ' + t.name);
}

// ─── Previous / next video from the saved playlist (wraps around) ───
function videoCurrentPlaylistIndex(){
  const list = S.config.videoPlaylist || [];
  const cur  = VideoHistory.current();
  if(!cur) return -1;
  for(let i = 0; i < list.length; i++){
    if(list[i].url === cur.value) return i;
  }
  return -1;
}

function videoAdvanceNext(){
  const list = S.config.videoPlaylist || [];
  if(!list.length){ toast('Playlist is empty', 'warn'); return; }
  const i = videoCurrentPlaylistIndex();
  playFromVideoPlaylist(i < 0 ? 0 : (i + 1) % list.length);
}

function videoAdvancePrev(){
  const list = S.config.videoPlaylist || [];
  if(!list.length){ toast('Playlist is empty', 'warn'); return; }
  const i = videoCurrentPlaylistIndex();
  playFromVideoPlaylist(i < 0 ? 0 : (i - 1 + list.length) % list.length);
}

function updateVplPager(page, totalPages, totalItems){
  const prev  = document.querySelector('[data-act="vpl-prev-page"]');
  const next  = document.querySelector('[data-act="vpl-next-page"]');
  const range = document.getElementById('vplRange');
  const pages = totalPages || 0;
  const items = totalItems || 0;
  if(prev) prev.disabled = (page <= 1);
  if(next) next.disabled = (pages < 1 || page >= pages);
  if(range){
    const last = Math.min(page * VP_PER_PAGE, items);
    // Empty playlist still has a single (empty) page, so it reads "1"
    range.textContent = items ? (page + '-' + last) : '1';
  }
}

// Play a playlist row directly from its Play button
document.addEventListener('click', function(e){
  const pb = e.target.closest('[data-vpl-play]');
  if(!pb) return;
  e.preventDefault();
  e.stopPropagation();
  playFromVideoPlaylist(parseInt(pb.dataset.vplPlay));
}, true);

// Delete from playlist
document.addEventListener('click', function(e){
  const del = e.target.closest('[data-vpl-del]');
  if(!del) return;
  e.preventDefault();
  e.stopPropagation();
  const i = parseInt(del.dataset.vplDel);
  videoPlaylistRemove(i);
}, true);

// ─── Rename a playlist row (inline edit — mirrors the music panel) ───
function commitVideoRename(input, index, commit){
  if(!input || !input.isConnected) return;   // already committed/cancelled
  const list = S.config.videoPlaylist || [];
  const track = list[index];
  if(!track) return;
  const name = input.value.trim();
  if(commit && name && name !== track.name){
    track.name = name;
    S.config.videoPlaylist = list;
    save();
    toast('Renamed');
  }
  renderVideoPlaylist();
}

document.addEventListener('click', function(e){
  const btn = e.target.closest('[data-vpl-rename]');
  if(!btn) return;   // clicks inside the edit field fall through so the caret still moves
  e.preventDefault();
  e.stopPropagation();

  const row = btn.closest('.vpl-row');
  if(!row) return;
  const i = parseInt(btn.dataset.vplRename);
  const list = S.config.videoPlaylist || [];
  const track = list[i];
  if(!track) return;

  // Second press (tick) saves
  if(btn.dataset.mode === 'save'){
    commitVideoRename(row.querySelector('.vpl-rename-edit'), i, true);
    return;
  }

  const nameEl = row.querySelector('.vpl-row-name');
  if(!nameEl) return;

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'vpl-rename-edit';
  input.value = track.name;
  nameEl.replaceWith(input);
  input.focus();
  input.select();

  // Pencil → tick, and keep both row actions visible
  btn.innerHTML = '<i class="bi bi-check-lg" style="font-size:11px;line-height:1;display:block;"></i>';
  btn.title = 'Save';
  btn.dataset.mode = 'save';
  btn.style.opacity = '1';
  btn.style.pointerEvents = 'auto';
  const del = row.querySelector('.vpl-del');
  if(del){ del.style.opacity = '1'; del.style.pointerEvents = 'auto'; }

  let done = false;
  const finish = function(commit){
    if(done) return;
    done = true;
    commitVideoRename(input, i, commit);
  };

  input.addEventListener('keydown', function(ev){
    if(ev.key === 'Enter'){ ev.preventDefault(); finish(true); }
    else if(ev.key === 'Escape'){ ev.preventDefault(); finish(false); }
  });
  input.addEventListener('blur', function(){
    setTimeout(function(){
      // Don't commit when the blur was caused by pressing the tick
      if(document.activeElement !== btn) finish(true);
    }, 80);
  });
}, true);

// ═══════════════════════════════════════════════════════════
//   STRUCTURE GUARD — keep panels as direct children of <body>
// ═══════════════════════════════════════════════════════════

(function ensurePanelSiblings(){
  function fix(){
    ['videoPanel', 'videoPlaylistPanel', 'musicPanel'].forEach(function(id){
      const el = document.getElementById(id);
      if(!el) return;
      if(el.parentElement !== document.body){
        console.warn('[guard] reparenting #' + id + ' to <body>');
        document.body.appendChild(el);
      }
    });
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', fix);
  } else {
    fix();
  }
})();

// ═══════════════════════════════════════════════════════════
//   VIDEO PLAYLIST — pager wiring
// ═══════════════════════════════════════════════════════════

let _vpPage = 0;
// Playlist row picked by clicking (not yet playing) — the player's play/pause
// button plays this row when the user presses it.
let _vpSelectedIndex = -1;
const VP_PER_PAGE = 10;
const VP_MAX_PAGES = 50;   // 10 × 50 = 500 videos max

document.addEventListener('click', function(e){
  if(e.target.closest('[data-act="vpl-prev-page"]')){
    e.preventDefault();
    e.stopPropagation();
    if(_vpPage > 0){ _vpPage--; renderVideoPlaylist(); }
    return;
  }
  if(e.target.closest('[data-act="vpl-next-page"]')){
    e.preventDefault();
    e.stopPropagation();
    const total = Math.max(1, Math.ceil((S.config.videoPlaylist || []).length / VP_PER_PAGE));
    if(_vpPage < total - 1){ _vpPage++; renderVideoPlaylist(); }
    return;
  }
}, true);

// ═══════════════════════════════════════════════════════════
//   VIDEO ASPECT — left/right click cycle
// ═══════════════════════════════════════════════════════════

const ASPECT_CYCLE = ['16:9', '4:3', '21:9', '1:1', '9:16'];

function aspectLabel(ratio){
  return ratio;
}

function applyAspect(ratio){
  S.config.videoAspect = ratio;
  save();

  const stage = document.getElementById('videoStage');
  if(stage){
    const v = stage.querySelector('video');
    if(v) v.dataset.aspect = ratio;
  }

  const label = document.getElementById('vpAspectLabel');
  if(label) label.textContent = aspectLabel(ratio);
}

function cycleAspect(dir){
  const cur = S.config.videoAspect || 'default';
  let idx = ASPECT_CYCLE.indexOf(cur);
  if(idx < 0) idx = 0;
  idx = (idx + dir + ASPECT_CYCLE.length) % ASPECT_CYCLE.length;

  const next = ASPECT_CYCLE[idx];
  applyAspect(next);
  toast('Aspect: ' + aspectLabel(next));
}

// Left-click → previous · Right-click → next
document.addEventListener('mousedown', function(e){
  if(!e.target.closest('#vpAspectBtn')) return;
  if(e.button !== 0 && e.button !== 2) return;
  e.preventDefault();
  e.stopPropagation();
  cycleAspect(e.button === 2 ? +1 : -1);
}, true);

// Suppress OS context menu on the aspect button
document.addEventListener('contextmenu', function(e){
  if(!e.target.closest('#vpAspectBtn')) return;
  e.preventDefault();
  e.stopPropagation();
}, true);

// Suppress plain click (we use mousedown)
document.addEventListener('click', function(e){
  if(!e.target.closest('#vpAspectBtn')) return;
  e.preventDefault();
  e.stopPropagation();
}, true);

// Paint the label on load
document.addEventListener('DOMContentLoaded', function(){
  setTimeout(function(){
    applyAspect(S.config.videoAspect || 'default');
  }, 200);
});

// ═══════════════════════════════════════════════════════════
//   VIDEO TRANSPORT — tap = skip, hold = seek
// ═══════════════════════════════════════════════════════════

function videoPlay(){
  const v = getVideoEl();
  if(!v){ toast('Nothing loaded', 'warn'); return; }
  v.play().catch(function(e){ console.warn(e); });
  setVideoPlayIcon(true);   // ← add this
}

function videoPause(){
  const v = getVideoEl();
  if(!v) return;
  v.pause();
  setVideoPlayIcon(false);  // ← add this
}

// ─── Prev / Next — click plays the previous/next playlist video, hold seeks ───
const SEEK_TICK_MS    = 100;
const SEEK_HOLD_MS    = 400;   // held longer than this = seek instead of switching
const SEEK_RAMP_AFTER = 800;
const SEEK_SLOW       = 2;
const SEEK_FAST       = 6;

let _seekHoldTimer  = null;
let _seekHoldDir    = 0;
let _seekHoldStart  = 0;
let _seekMoved      = false;

function beginPrevNext(dir){
  // dir: -1 = prev, +1 = next
  _seekHoldDir   = dir;
  _seekHoldStart = Date.now();
  _seekMoved     = false;

  // holding the button keeps seeking the video that is already loaded
  _seekHoldTimer = setInterval(function(){
    const v = getVideoEl();
    if(!v || !v.duration) return;
    const elapsed = Date.now() - _seekHoldStart;
    if(!_seekMoved && elapsed < SEEK_HOLD_MS) return;   // still a click — don't move yet
    const step = (elapsed > SEEK_RAMP_AFTER) ? SEEK_FAST : SEEK_SLOW;
    v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + dir * step));
    _seekMoved = true;
  }, SEEK_TICK_MS);
}

function endPrevNext(){
  if(_seekHoldTimer){
    clearInterval(_seekHoldTimer);
    _seekHoldTimer = null;
  }

  // nothing was scrubbed → the button was clicked, so play another video
  if(!_seekMoved){
    if(_seekHoldDir === -1) videoAdvancePrev();
    if(_seekHoldDir === +1) videoAdvanceNext();
  }

  _seekHoldDir = 0;
  _seekMoved   = false;
}

document.addEventListener('mousedown', function(e){
  const t = e.target;

  // Play / Pause — left click toggles
  if(t.closest('[data-act="video-toggle"]')){
    if(e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const v = getVideoEl();
    // A row selected in the playlist (but not yet playing) starts on play.
    if(_vpSelectedIndex >= 0 &&
       _vpSelectedIndex !== videoCurrentPlaylistIndex()){
      playFromVideoPlaylist(_vpSelectedIndex);
      _vpSelectedIndex = -1;
      return;
    }
    if(!v){ toast('Nothing loaded', 'warn'); return; }
    if(v.paused) videoPlay();
    else         videoPause();
    return;
  }

  // Prev
  if(t.closest('[data-act="video-prev"]')){
    if(e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    beginPrevNext(-1);
    return;
  }

  // Next
  if(t.closest('[data-act="video-next"]')){
    if(e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    beginPrevNext(+1);
    return;
  }

  // Fullscreen — left click toggles fullscreen (right click is menu-suppressed below)
  if(t.closest('[data-act="video-fullscreen"]')){
    if(e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    toggleVideoFullscreen();
    return;
  }

}, true);

document.addEventListener('mouseup', function(e){
  // Release on prev/next → finalize tap vs hold
  if(e.target.closest('[data-act="video-prev"]') ||
     e.target.closest('[data-act="video-next"]') ||
     _seekHoldDir !== 0){
    endPrevNext();
  }
}, true);

// Also catch release anywhere (in case user dragged off the button)
document.addEventListener('mouseup', function(){
  if(_seekHoldDir !== 0) endPrevNext();
}, true);

document.addEventListener('contextmenu', function(e){
  if(!e.target.closest('[data-act="video-toggle"]') &&
     !e.target.closest('[data-act="video-prev"]') &&
     !e.target.closest('[data-act="video-next"]') &&
     !e.target.closest('[data-act="video-fullscreen"]')) return;
  e.preventDefault();
  e.stopPropagation();
}, true);

// Escape exits the CSS fallback fullscreen (no native fullscreen to exit)
document.addEventListener('keydown', function(e){
  if(e.key !== 'Escape') return;
  const el = document.getElementById('videoBody');
  if(el && el.classList.contains('vp-fs-fallback')) el.classList.remove('vp-fs-fallback');
});

// ═══════════════════════════════════════════════════════════
//   MUSIC TRANSPORT — tap = skip, hold = seek
// ═══════════════════════════════════════════════════════════

// Music.currentIndex doubles as the selected row and the playing row, so it
// has to move with playback (app.js's musicPlay only swaps the audio source).
function playMusicIndex(i){
  if(i < 0 || i >= Music.playlist.length) return;
  Music.currentIndex = i;
  musicPlay(i);
}

function musicPlayExplicit(){
  if(!Music.audio) return;
  if(Music.currentIndex < 0 && Music.playlist.length) playMusicIndex(0);
  else Music.audio.play();
}

function musicPauseExplicit(){
  if(Music.audio) Music.audio.pause();
}

// One entry point for play/pause — used by the play buttons and by the row click.
let _lastMusicToggle = 0;
function musicTogglePlayback(){
  const a = Music.audio;
  if(!a) return;

  // A duplicated press event must not toggle straight back to where it started.
  const now = Date.now();
  if(now - _lastMusicToggle < 60) return;
  _lastMusicToggle = now;

  if(a.paused){
    // Nothing to play — an empty playlist must never start the visualizer
    if(!Music.playlist.length){ toast('Add a track first', 'warn'); return; }
    // A selected-but-not-yet-loaded row plays from the top when the user hits
    // the player's play button.
    if(Music.loadedIndex !== undefined && Music.loadedIndex !== null &&
       Music.loadedIndex !== Music.currentIndex){
      playMusicIndex(Music.currentIndex);
    } else if(Music.currentIndex < 0 && Music.playlist.length){
      playMusicIndex(0);
    } else if(!a.currentSrc && !a.src && Music.playlist.length){
      // Fresh session with a restored playlist — no source loaded yet
      playMusicIndex(Math.max(0, Music.currentIndex));
    } else {
      const pr = a.play();
      if(pr && pr.catch) pr.catch(function(e){
        if(e && e.name === 'AbortError') return;
        setPlayIcon(false);
        if(typeof mediaErrorMessage === 'function') toast(mediaErrorMessage(e, Music.playlist[Music.currentIndex]), 'err');
      });
    }
  } else {
    a.pause();
  }

  if(typeof renderMusicMini === 'function') renderMusicMini();
}

// Shuffle-aware advance — used by the transport buttons and by auto-advance.
function musicAdvanceNext(){
  const len = Music.playlist.length;
  if(!len) return;
  if(Music.currentIndex < 0 || Music.currentIndex >= len){ playMusicIndex(0); return; }

  let i;
  if(Music.shuffle && len > 1){
    // never shuffle straight back into the track that just played
    do { i = Math.floor(Math.random() * len); }
    while(i === Music.currentIndex);
  } else {
    i = (Music.currentIndex + 1) % len;
  }
  playMusicIndex(i);
}

function musicAdvancePrev(){
  const len = Music.playlist.length;
  if(!len) return;
  if(Music.currentIndex < 0 || Music.currentIndex >= len){ playMusicIndex(0); return; }
  playMusicIndex((Music.currentIndex - 1 + len) % len);
}

const MSEEK_TICK_MS    = 100;
const MSEEK_HOLD_MS    = 400;  // held longer than this = seek instead of skipping
const MSEEK_RAMP_AFTER = 800;
const MSEEK_SLOW       = 3;    // seconds per tick
const MSEEK_FAST       = 10;

let _mSeekTimer  = null;
let _mSeekDir    = 0;
let _mSeekStart  = 0;
let _mSeekMoved  = false;

// Click = previous/next song, hold = seek (same feel as the video player).
// The song switch waits for release so holding always seeks the track that is
// already loaded — a freshly loaded track has no duration, so seeking it stalls.
function beginMusicPrevNext(dir){
  _mSeekDir   = dir;
  _mSeekStart = Date.now();
  _mSeekMoved = false;

  _mSeekTimer = setInterval(function(){
    if(!Music.audio || !Music.audio.duration) return;
    const elapsed = Date.now() - _mSeekStart;
    if(!_mSeekMoved && elapsed < MSEEK_HOLD_MS) return;   // still a click — don't move yet
    const step = (elapsed > MSEEK_RAMP_AFTER) ? MSEEK_FAST : MSEEK_SLOW;
    Music.audio.currentTime = Math.max(0, Math.min(Music.audio.duration, Music.audio.currentTime + dir * step));
    _mSeekMoved = true;
  }, MSEEK_TICK_MS);
}

function endMusicPrevNext(){
  if(_mSeekTimer){
    clearInterval(_mSeekTimer);
    _mSeekTimer = null;
  }
  // nothing was scrubbed → the button was clicked, so switch song
  if(!_mSeekMoved){
    if(_mSeekDir === -1) musicAdvancePrev();
    if(_mSeekDir === +1) musicAdvanceNext();
  }
  _mSeekDir   = 0;
  _mSeekMoved = false;
}

// A press that loses focus (window blur, pointer dragged off-screen) must not
// leave the transport stuck in seek mode.
window.addEventListener('blur', function(){
  if(_mSeekTimer){ clearInterval(_mSeekTimer); _mSeekTimer = null; }
  _mSeekDir   = 0;
  _mSeekMoved = false;
  if(_seekHoldTimer){ clearInterval(_seekHoldTimer); _seekHoldTimer = null; }
  _seekHoldDir = 0;
  _seekMoved   = false;
});

document.addEventListener('mousedown', function(e){
  const t = e.target;

  // Play / Pause — left click toggles (same as the video player)
  if(t.closest('[data-act="mp-toggle"]')){
    if(e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    musicTogglePlayback();
    return;
  }

  // Prev — tap = previous, hold = seek back
  if(t.closest('[data-act="mp-prev"]')){
    if(e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    beginMusicPrevNext(-1);
    return;
  }

  // Next — tap = next, hold = seek forward
  if(t.closest('[data-act="mp-next"]')){
    if(e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    beginMusicPrevNext(+1);
    return;
  }
}, true);

document.addEventListener('mouseup', function(e){
  if(_mSeekDir !== 0) endMusicPrevNext();
}, true);

document.addEventListener('contextmenu', function(e){
  if(!e.target.closest('[data-act="mp-toggle"]') &&
     !e.target.closest('[data-act="mp-prev"]') &&
     !e.target.closest('[data-act="mp-next"]') &&
     !e.target.closest('[data-act="mp-shuffle"]') &&
     !e.target.closest('[data-act="mp-repeat"]')) return;
  e.preventDefault();
  e.stopPropagation();
}, true);

// ─── Shuffle / Loop — left click toggles, state is persisted ───
document.addEventListener('click', function(e){
  const sh = e.target.closest('[data-act="mp-shuffle"]');
  if(sh){
    e.preventDefault();
    e.stopPropagation();
    Music.shuffle = !Music.shuffle;
    S.config.musicShuffle = Music.shuffle;
    save();
    sh.classList.toggle('active', Music.shuffle);
    toast(Music.shuffle ? 'Shuffle on' : 'Shuffle off');
    return;
  }

  const rp = e.target.closest('[data-act="mp-repeat"]');
  if(rp){
    e.preventDefault();
    e.stopPropagation();
    Music.repeat = !Music.repeat;
    S.config.musicRepeat = Music.repeat;
    save();
    rp.classList.toggle('active', Music.repeat);
    const rpIcon = rp.querySelector('i');
    if(rpIcon) rpIcon.className = Music.repeat ? 'bi bi-repeat-1' : 'bi bi-repeat';
    toast(Music.repeat ? 'Loop on' : 'Loop off');
    return;
  }
}, true);

// ─── Playlist row subtitle ───
// Rows carry their origin as "URL"/"File"; the panel wording is External for
// links and Internal for files picked from disk, so relabel rows as they render.
function labelMusicRowSources(){
  const wrap = document.getElementById('mpPlaylist');
  if(!wrap) return;
  const labels = wrap.querySelectorAll('.mv-item-source');
  for(let i = 0; i < labels.length; i++){
    const el = labels[i];
    if(el.textContent === 'URL') el.textContent = 'External';
    else if(el.textContent === 'File' || el.textContent === 'Unknown') el.textContent = 'Internal';
  }
}

function watchMusicRowSources(){
  const wrap = document.getElementById('mpPlaylist');
  if(!wrap || typeof MutationObserver === 'undefined') return;
  new MutationObserver(labelMusicRowSources).observe(wrap, { childList: true, subtree: true });
  labelMusicRowSources();
}

// The playlist element is parsed after this script, so wait for the DOM.
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', watchMusicRowSources);
} else {
  watchMusicRowSources();
}

// ═══════════════════════════════════════════════════════════
//   TOPBAR BUTTONS — direct listeners (permanent)
// ═══════════════════════════════════════════════════════════

(function attachTopbarButtons(){
  function wireButton(selector, handler){
    const el = document.querySelector(selector);
    if(!el) return false;
    if(el.dataset.wired === '1') return true;
    el.dataset.wired = '1';
    el.addEventListener('click', function(e){
      e.preventDefault();
      e.stopImmediatePropagation();
      handler(e);
    }, true);
    return true;
  }

  function attachAll(){
    wireButton('[data-act="open-settings"]', function(){
      if(typeof SETTINGS !== 'undefined' && SETTINGS.open) SETTINGS.open();
    });
  }

  // Try immediately
  attachAll();

  // Re-run if the DOM changes
  const obs = new MutationObserver(attachAll);
  obs.observe(document.body, { childList: true, subtree: true });
})();

