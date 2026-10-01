document.addEventListener('click', e => {
  const t = e.target;
  if(t.closest('[data-act="go-stats"]')){ e.preventDefault(); goPage('stats'); return; }
if(t.closest('[data-act="go-overview"]')){
  e.preventDefault();
  if(typeof goPage === 'function') goPage('overview');
  return;
}

  // Topbar: Settings
  if(t.closest('[data-act="open-settings"]')){
    e.preventDefault();
    if(typeof SETTINGS?.open === 'function') SETTINGS.open();
    else toast('Settings opening...', 'warn');
    return;
  }

  // Logo — the Manager page is the app's home
  if(t.closest('.logo-btn')){
    e.preventDefault();
    if(typeof goPage === 'function') goPage('overview');
    return;
  }
});

/* Settings lives in #modalRoot — this closes it. */
function closeModal(){
  const root = $('modalRoot');
  if(!root) return;
  root.classList.remove('open');
  root.innerHTML = '';
}

document.addEventListener('click', e => {
  const t = e.target;

  // ─── Pager ───
  if(t.closest('[data-act="mp-prev-page"]')){
    e.preventDefault();
    if(Music.page > 0){
      Music.page--;
      renderMusicPlayer();
    }
    return;
  }
  if(t.closest('[data-act="mp-next-page"]')){
    e.preventDefault();
  const perPage = Music.perPage || 5;
  const maxPages = Music.maxPages || 50;
  const totalPages = Math.min(maxPages, Math.max(1, Math.ceil(Music.playlist.length / perPage)));
  if(Music.page < totalPages - 1){
    Music.page++;
    renderMusicPlayer();
  }
    return;
  }

  // Play button — plays the track in that row immediately
 const pb = t.closest('[data-mp-play]');
 if(pb){
   e.preventDefault();
   e.stopPropagation();
   const pi = parseInt(pb.dataset.mpPlay);
   if(isNaN(pi) || pi < 0 || pi >= Music.playlist.length) return;
   if(typeof musicPlay === 'function') musicPlay(pi);
   return;
 }

 // ─── Delete track (BEFORE play — delete button lives inside the row) ───
 const rn = t.closest('[data-mp-rename]');
 if(rn && rn.dataset.mode === 'save') return;  // save click handled by rn.onclick
if(rn){
  e.preventDefault();
  e.stopPropagation();
  const i = parseInt(rn.dataset.mpRename);
  if(isNaN(i) || i < 0 || i >= Music.playlist.length) return;

  const row = rn.closest('.mv-item');
  const titleEl = row ? row.querySelector('.mv-item-name') : null;
  if(!titleEl) return;

  const track = Music.playlist[i];
  const originalName = track.name;

  // Replace title with input
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'mv-item-name-edit';
  input.value = originalName;
  titleEl.replaceWith(input);
  input.focus();
  input.select();

  // Replace pencil with tick
  rn.innerHTML = '<i class="bi bi-check-lg"></i>';
  rn.classList.add('mv-item-rename-active');
  rn.dataset.mode = 'save';
  rn.dataset.mpRename = i; // keep index for the save click

  let finished = false;

  function commit(){
    if(finished) return;
    finished = true;
    const newName = input.value.trim();
    if(newName && newName !== originalName){
      track.name = newName;
      S.config.musicPlaylist = Music.playlist;
      save();
      toast('Renamed');
    }
    renderMusicPlayer();
    renderMusicMini();
  }

  function cancel(){
    if(finished) return;
    finished = true;
    renderMusicPlayer();
  }

  // The tick click also commits
  rn.onclick = function(ev){
    ev.stopPropagation();
    commit();
  };

  input.addEventListener('keydown', function(ev){
    if(ev.key === 'Enter'){ ev.preventDefault(); commit(); }
    if(ev.key === 'Escape'){ ev.preventDefault(); cancel(); }
  });
  input.addEventListener('blur', function(){
    setTimeout(function(){
      // Only commit via blur if we're not mid-clicking the tick
      if(document.activeElement !== rn) commit();
    }, 80);
  });

  return;
}
  const del = t.closest('[data-mp-del]');
  if(del){
    e.preventDefault();
    e.stopPropagation();
    const i = parseInt(del.dataset.mpDel);
    if(isNaN(i) || i < 0 || i >= Music.playlist.length) return;

    const wasPlaying = (i === Music.currentIndex);
    Music.playlist.splice(i, 1);

    if(wasPlaying){
      Music.audio.pause();
      Music.audio.removeAttribute('src');
      Music.audio.load();
      Music.currentIndex = -1;
      setPlayIcon(false);
      updateMusicArt(null);
    } else if(i < Music.currentIndex){
      Music.currentIndex--;
    }

  const perPage = Music.perPage || 5;
  const maxPages = Music.maxPages || 50;
  const totalPages = Math.min(maxPages, Math.max(1, Math.ceil(Music.playlist.length / perPage)));
  if(Music.page >= totalPages) Music.page = totalPages - 1;

    S.config.musicPlaylist = Music.playlist;
    S.config.musicCurrent  = Music.currentIndex;
    save();
    renderMusicPlayer();
    renderMusicMini();
    toast('Track removed');
    return;
  }

// ─── Play row ───
// Clicking a playlist row only selects it — playback starts from the row's
// Play button or the player's play/pause control.
const item = t.closest('[data-mp-index]');
if(item){
    e.preventDefault();
    const index = parseInt(item.dataset.mpIndex);

    // Selecting a row only highlights it — playback starts from the row's
    // Play button or the player's play/pause control.
    Music.currentIndex = index;
    
    // Update visual state immediately so user sees selection
    renderMusicPlayer(); 
    renderMusicMini();
    
    // Save selection preference
    S.config.musicCurrent = index;
    save();
    return;
}
}); // <--- THIS CLOSES THE MAIN CLICK LISTENER PROPERLY
  
// ═══════════════════════════════════════════════════════════
//   BOOT
// ═══════════════════════════════════════════════════════════
function boot(){
  try{
    load();

    document.body.setAttribute('data-style', 'vercel');

    // Apply theme
    if(typeof applyThemeNow === 'function') applyThemeNow();
    if(typeof applyAllConfig === 'function') applyAllConfig();
    document.body.setAttribute('data-layout', S.config.layout || 'classic');

    /* The Manager is the app's home. */
    if(typeof goPage === 'function') goPage('overview');

    // Overlay panes open straight onto the page / player they asked for
    try{
      const qp = new URLSearchParams(location.search);
      const wantPage  = qp.get('sfPage');
      const wantPanel = qp.get('sfPanel');
      if(wantPage && wantPage !== 'home' && typeof goPage === 'function') goPage(wantPage);
      if(wantPanel === 'music' && typeof openMusicPanel === 'function') openMusicPanel();
      if(wantPanel === 'video' && typeof openVideoPanel === 'function') openVideoPanel();
    }catch(e){}

    // An overlay pane uses goPage() to tell its parent window what it shows.
    window.SF_NAV_READY = true;

    if(typeof updateBreadcrumb === 'function') updateBreadcrumb();

       console.log('%c ✓ ScriptForge booted', 'color:#10b981;font-weight:700;');
  }catch(e){
    console.error('Boot failed:', e);
    const stage = document.getElementById('stage');
    if(stage){
      stage.innerHTML = '<div style="padding:40px;color:#ef4444;font-family:monospace;">Boot error: ' + e.message + '<br><br>Check browser console for details.</div>';
    }
  }

  // Boot animation — skipped inside an overlay pane
  if(window.SF_VIEW !== true && typeof runBootAnimation === 'function') runBootAnimation();
}

// ═══════════════════════════════════════════════════════════
//   MUSIC PLAYER
// ═══════════════════════════════════════════════════════════

const Music = {
  audio: null,
  playlist: [],
  currentIndex: -1,
  shuffle: false,
  repeat: false,
  page: 0,
  perPage: 5,
  maxPages: 50
};

// ─── Volume button — tap/hold like the video player ───
const MVOL_TAP        = 0.01;   // 1% per tap
const MVOL_TICK_MS    = 100;
const MVOL_RAMP_AFTER = 400;    // accelerate after 400ms held
const MVOL_SLOW       = 0.02;   // 2% per tick
const MVOL_MED        = 0.05;   // 5% per tick (fast)
const MVOL_HOLD_DELAY = 250;    // ramp starts after this long held

let _mVolHoldTimer = null;
let _mVolHoldStart = 0;

function getMusicVolume(){
  return (S.config.musicVolume !== undefined && S.config.musicVolume !== null) ? S.config.musicVolume : 0.8;
}

function updateMusicVolumeUi(vol){
  const icon = document.getElementById('mpVolIcon');
  if(icon){
    if(vol === 0)      icon.className = 'bi bi-volume-mute';
    else if(vol < 0.5) icon.className = 'bi bi-volume-down';
    else               icon.className = 'bi bi-volume-up';
  }
  const pct = document.getElementById('mpVolPct');
  if(pct) pct.textContent = Math.round(vol * 100) + '%';
  const slider = document.getElementById('mpVol');
  if(slider) slider.value = Math.round(vol * 100);
}

function setMusicVolume(vol){
  vol = Math.max(0, Math.min(1, Math.round(vol * 100) / 100));
  if(Music.audio) Music.audio.volume = vol;
  S.config.musicVolume = vol;
  updateMusicVolumeUi(vol);
  save();
}

function startMusicVolHold(dir){
  stopMusicVolHold();
  _mVolHoldStart = Date.now();

  // 1) immediate tap — always fires
  setMusicVolume(getMusicVolume() + dir * MVOL_TAP);

  // 2) ramp starts after MVOL_HOLD_DELAY ms
  _mVolHoldTimer = setTimeout(function(){
    _mVolHoldTimer = setInterval(function(){
      const elapsed = Date.now() - _mVolHoldStart;
      const step = (elapsed > MVOL_RAMP_AFTER) ? MVOL_MED : MVOL_SLOW;
      const next = getMusicVolume() + dir * step;
      if(next <= 0 || next >= 1){
        setMusicVolume(next);
        stopMusicVolHold();
        return;
      }
      setMusicVolume(next);
    }, MVOL_TICK_MS);
  }, MVOL_HOLD_DELAY);
}

function stopMusicVolHold(){
  if(_mVolHoldTimer){
    clearInterval(_mVolHoldTimer);
    clearTimeout(_mVolHoldTimer);
    _mVolHoldTimer = null;
  }
}

document.addEventListener('mousedown', function(e){
  if(!e.target.closest('#mpVolBtn')) return;
  if(e.button !== 0 && e.button !== 2) return;
  e.preventDefault();
  e.stopPropagation();
  startMusicVolHold(e.button === 2 ? +1 : -1);
}, true);

document.addEventListener('mouseup', function(){
  if(_mVolHoldTimer) stopMusicVolHold();
}, true);

document.addEventListener('click', function(e){
  if(!e.target.closest('#mpVolBtn')) return;
  e.preventDefault();
  e.stopPropagation();
}, true);

document.addEventListener('contextmenu', function(e){
  if(!e.target.closest('#mpVolBtn')) return;
  e.preventDefault();
  e.stopPropagation();
}, true);

window.addEventListener('load', function(){
  setTimeout(function(){ updateMusicVolumeUi(getMusicVolume()); }, 150);
});

function resolveMusicUrl(url){
  // Electron with webSecurity:false plays cross-origin audio directly.
  // No proxy needed.
  return url;
}

// Readable reason for a failed load/play, so the player never fails silently.
function mediaErrorMessage(err, track){
  const name  = (err && err.name) || '';
  const url   = (track && track.url) || '';
  const label = (track && track.name) || url.split('/').pop() || 'this track';
  if(name === 'NotAllowedError') return 'Press play again to start ' + label;
  if(/^file:\/\//i.test(url) && !(window.electronPath && window.electronPath.getPathForFile)){
    return 'Local files play in the desktop app only \u2014 add "' + label + '" by URL instead';
  }
  if(name === 'NotSupportedError') return 'Cannot play "' + label + '" \u2014 unsupported format or blocked source';
  return 'Cannot play "' + label + '"';
}

function musicInit(){
  if(Music._initialized) return;
  Music._initialized = true;
  Music.audio = $('mpAudio');
  if(!Music.audio) return;

  Music.playlist = S.config.musicPlaylist || [];
  Music.shuffle  = !!S.config.musicShuffle;
  Music.repeat   = !!S.config.musicRepeat;
  Music.currentIndex = -1;
  // Prune dead blob URLs from previous sessions
Music.playlist = Music.playlist.filter(function(track){
  if(track.url && track.url.startsWith('blob:')){
    // Blob URLs are session-scoped; they're always dead after reload
    return false;
  }
  return true;
});
S.config.musicPlaylist = Music.playlist;

  document.querySelector('[data-act="mp-shuffle"]')?.classList.toggle('active', Music.shuffle);
  const repBtn = document.querySelector('[data-act="mp-repeat"]');
  if(repBtn){
    repBtn.classList.toggle('active', Music.repeat);
    const repIcon = repBtn.querySelector('i');
    if(repIcon) repIcon.className = Music.repeat ? 'bi bi-repeat-1' : 'bi bi-repeat';
  }

  const vol = S.config.musicVolume ?? 0.8;
  Music.audio.volume = vol;
  const volSlider = $('mpVol');
  if(volSlider) volSlider.value = vol * 100;

  Music.audio.addEventListener('timeupdate', () => {
    const cur = Music.audio.currentTime;
    const dur = Music.audio.duration || 0;
    if(dur){
      const seek = $('mpSeek');
      if(seek) seek.value = (cur / dur) * 100;
      const curEl = $('mpCur');
      if(curEl) curEl.textContent = fmtTime(cur);
      const durEl = $('mpDur');
      if(durEl) durEl.textContent = fmtTime(dur);
    }
  });

  Music.audio.addEventListener('ended', () => {
    if(Music.repeat){
      Music.audio.currentTime = 0;
      Music.audio.play();
    } else {
      musicAdvanceNext();
    }
  });

  Music.audio.addEventListener('loadedmetadata', () => {
    const durEl = $('mpDur');
    if(durEl) durEl.textContent = fmtTime(Music.audio.duration);
  });

  Music.audio.addEventListener('play',  () => setPlayIcon(true));
  Music.audio.addEventListener('pause', () => setPlayIcon(false));

  // A source that fails to load fires 'error' — report it instead of silence
  Music.audio.addEventListener('error', function(){
    const src = Music.audio.currentSrc || Music.audio.src || '';
    if(!src) return;
    const cur = Music.playlist[Music.currentIndex] || { url: src, name: src.split('/').pop() };
    setPlayIcon(false);
    updateMusicArt(null);
    toast(mediaErrorMessage({ name: 'NotSupportedError' }, cur), 'err');
  });

  renderMusicPlayer();
  renderMusicMini();
}

// Mini bar (bottom-right) — song title, play state, and visibility.
// Called from renderMusicPlayer, the transport, and the add/remove paths.
function renderMusicMini(){
  const mini   = document.getElementById('musicMini');
  const song   = document.getElementById('miniSong');
  const icon   = document.getElementById('miniPlayIcon');
  const playing = Music.audio ? !Music.audio.paused : false;
  const cur = (Music.currentIndex >= 0 && Music.playlist[Music.currentIndex])
    ? Music.playlist[Music.currentIndex] : null;

  if(song) song.textContent = cur ? cur.name : 'No track';
  if(icon) icon.className = playing ? 'bi bi-pause-fill' : 'bi bi-play-fill';
  const dot = document.getElementById('miniDot');
  if(dot) dot.hidden = !playing;
  // Mini player removed everywhere.
  if(mini) mini.hidden = true;
}

function promptModal(title, defaultValue){ /* modal prompt */
  return new Promise(function(resolve){
    const root = $('modalRoot');
    const scrim = document.createElement('div');
    scrim.className = 'modal-scrim';
    scrim.style.cssText = 'align-items:flex-start;padding-top:20vh;z-index:400;';
    scrim.innerHTML = `
      <div class="modal" style="max-width:420px;width:90%;">
        <div class="modal-head">
          <h2>${esc(title)}</h2>
        </div>
        <div class="modal-body">
          <input class="tb-input" id="promptModalInput" style="width:100%;padding:10px 14px;font-size:14px;" value="${esc(defaultValue || '')}">
        </div>
        <div class="modal-foot">
          <button class="btn btn-ghost" data-pm-cancel>Cancel</button>
          <button class="btn btn-primary" data-pm-ok>OK</button>
        </div>
      </div>
    `;
    root.appendChild(scrim);
    root.classList.add('open');

    const input = scrim.querySelector('#promptModalInput');
    const okBtn = scrim.querySelector('[data-pm-ok]');
    const cancelBtn = scrim.querySelector('[data-pm-cancel]');

    setTimeout(function(){ input.focus(); input.select(); }, 30);

    function cleanup(){
      scrim.remove();
      if(!root.children.length) root.classList.remove('open');
    }
    function submit(){
      const val = input.value;
      cleanup();
      resolve(val);
    }
    function cancel(){
      cleanup();
      resolve(null);
    }

    okBtn.onclick = submit;
    cancelBtn.onclick = cancel;
    input.onkeydown = function(e){
      if(e.key === 'Enter'){ e.preventDefault(); submit(); }
      if(e.key === 'Escape'){ e.preventDefault(); cancel(); }
    };
    scrim.addEventListener('click', function(e){
      if(e.target === scrim) cancel();
    });
  });
}
window.promptModal = promptModal;

function setPlayIcon(playing){
  const icon = $('mpPlayIcon');
  if(icon) icon.className = playing ? 'bi bi-pause-fill' : 'bi bi-play-fill';
  const miniIcon = $('miniPlayIcon');
  if(miniIcon) miniIcon.className = playing ? 'bi bi-pause-fill' : 'bi bi-play-fill';

  const viz = document.querySelector('.mv-visualizer');
  if(viz) viz.classList.toggle('playing', playing);
}

function fmtTime(sec){
  if(!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m + ':' + (s < 10 ? '0' : '') + s;
}

function updateMusicArt(track){
  const viz = document.querySelector('.mv-visualizer');
  if(!viz) return;
  const isPlaying = Music.audio ? !Music.audio.paused : false;
  viz.classList.toggle('playing', !!track && isPlaying);
}

function renderMusicPlayer(){
    const wrap    = $('mpPlaylist');
    const range   = $('mpRange'); // ✅ Properly defined here
    const prevBtn = document.querySelector('[data-act="mp-prev-page"]');
    const nextBtn = document.querySelector('[data-act="mp-next-page"]');
    
    if(!wrap) return;
    
    if(!Music.playlist.length){
        wrap.innerHTML = '<div class="mv-empty">Click + to add.</div>';
        if(range) range.textContent = '1';
        if(prevBtn) prevBtn.disabled = true;
        if(nextBtn) nextBtn.disabled = true;
        return;
    }
    
    const total = Music.playlist.length;
    const perPage = Music.perPage || 4;
    const maxPages = Music.maxPages || 50;
    const totalPages = Math.min(maxPages, Math.max(1, Math.ceil(total / perPage)));
    
    if(Music.page >= totalPages) Music.page = totalPages - 1;
    if(Music.page < 0) Music.page = 0;
    
    const start = Music.page * perPage;
    const end = Math.min(start + perPage, total);
    
    wrap.innerHTML = '';
    
    for(let i = start; i < end; i++){
        const track = Music.playlist[i];
        // Highlight based on SELECTION (currentIndex), not play state
        const isSelected = (i === Music.currentIndex); 
        
        const item = document.createElement('div');
        item.className = 'mv-item' + (isSelected ? ' active' : '');
        item.dataset.mpIndex = i;
        
        // Icon logic: Volume icon only if SELECTED AND PLAYING
        const isPlaying = Music.audio && !Music.audio.paused && isSelected;
        
        item.innerHTML = `
          <div class="mv-item-body">
            <div class="mv-item-name" title="${esc(track.name)}">${esc(track.name)}</div>
            <div class="mv-item-source">${track.source === 'url' ? 'External' : track.source === 'file' ? 'Internal' : 'Unknown'}</div>
          </div>
          <button class="mv-item-rename" data-mp-rename="${i}" title="Rename">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="mv-item-del" data-mp-del="${i}" title="Remove">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 2L8 8M8 2L2 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>`;
          
        wrap.appendChild(item);
    }
    // ✅ Now 'range' is safely accessible
    if(range){
        const pageNum = Music.page + 1;
        const last = Math.min(pageNum * perPage, total);
        range.textContent = pageNum + '-' + last;
    }
    
    if(prevBtn) prevBtn.disabled = (Music.page === 0);
    if(nextBtn) nextBtn.disabled = (Music.page >= totalPages - 1);
}
  function musicPlay(index){
    // If no index provided, use the currently selected one
    if(index === undefined || index < 0) {
        index = Music.currentIndex;
    }
    
    // Safety check
    if(index < 0 || index >= Music.playlist.length) return;
    
    const track = Music.playlist[index];
    
    // Force-clean previous source to prevent glitches
    try{
        Music.audio.pause();
        Music.audio.removeAttribute('src');
        Music.audio.load();
    }catch(e){ /* ignore */ }
    
    // Load new track.
    // Never force CORS mode: a plain <audio> has to be able to play URLs that
    // send no Access-Control-Allow-Origin header (most media hosts don't).
    Music.audio.removeAttribute('crossorigin');
    Music.audio.src = track.url;
    // Remember which playlist row is actually loaded, so play/pause can tell
    // "resume" apart from "play the newly selected row".
    Music.loadedIndex = index;

    // The beat visualizer routes this element through a Web Audio graph, and a
    // suspended context would make it play silently.
    if(_audioCtx && _audioCtx.state === 'suspended' && _audioCtx.resume) _audioCtx.resume();
    
    // Play and handle errors
    const playPromise = Music.audio.play();
    if(playPromise && playPromise.catch){
        playPromise.catch(function(e){
            if(e && e.name === 'AbortError') return;
            console.warn('Play failed:', e);
            setPlayIcon(false);
            updateMusicArt(null);
            toast(mediaErrorMessage(e, track), 'err');
        });
    }
    
    // Update UI states
    setPlayIcon(true);
    updateMusicArt(track);
    renderMusicPlayer();
    renderMusicMini();
    
    // Persist current playing index
    S.config.musicCurrent = index;
    save();
}

function musicToggle(){
  if(!Music.audio) return;
  if(Music.audio.paused){
    if(Music.currentIndex < 0 && Music.playlist.length) musicPlay(0);
    else Music.audio.play();
  } else {
    Music.audio.pause();
  }
}

function musicNext(){
  if(!Music.playlist.length) return;
  let next;
  if(Music.shuffle){
    next = Math.floor(Math.random() * Music.playlist.length);
  } else {
    next = (Music.currentIndex + 1) % Music.playlist.length;
  }
  musicPlay(next);
}

function musicPrev(){
  if(!Music.playlist.length) return;
  const prev = (Music.currentIndex - 1 + Music.playlist.length) % Music.playlist.length;
  musicPlay(prev);
}

function closeMusicPlayer(){
  const el = $('musicPlayer');
  if(el) el.hidden = true;
}

function musicAddURL(url){
  if(!url) return;
  if(Music.playlist.some(t => t.url === url)){
    toast('Already in playlist', 'warn');
    return;
  }
  const cap = Music.perPage * Music.maxPages;
  if(Music.playlist.length >= cap){
    toast('Playlist full (max ' + cap + ' tracks)', 'warn');
    return;
  }
  // In Electron, use the filename from URL as the default name — no prompt
  const name = url.split('/').pop().replace(/\.[^.]+$/, '') || 'Untitled';
  Music.playlist.push({ name, url, source: 'url' });
  S.config.musicPlaylist = Music.playlist;
  save();
  renderMusicPlayer();
  renderMusicMini();
  toast('Track added: ' + name);
}

function musicAddFiles(files){
  const cap = Music.perPage * Music.maxPages;
  Array.from(files).forEach(f => {
    if(Music.playlist.length >= cap) return;

    let url = null;
    let source = 'file';

    // Electron: get the real file path via preload bridge
    if(window.electronPath && window.electronPath.getPathForFile){
      const p = window.electronPath.getPathForFile(f);
      if(p) url = 'file://' + p;
    }
    // Older Electron fallback
    if(!url && f.path){
      url = 'file://' + f.path;
    }
    // Browser fallback: blob URL (session-only)
    if(!url){
      url = URL.createObjectURL(f);
      source = 'blob';
    }

    Music.playlist.push({
      name: f.name.replace(/\.[^.]+$/, ''),
      url,
      source
    });
  });
  S.config.musicPlaylist = Music.playlist;
  save();
  renderMusicPlayer();
  renderMusicMini();
  toast(files.length + ' track(s) added');
}

// Start beat visualizer when panel is visible
if(document.getElementById('musicPanel') && !document.getElementById('musicPanel').hidden){
  startBeatVisualizer();
}

window.Music = Music;
window.musicInit = musicInit;
window.closeMusicPlayer = closeMusicPlayer;
window.musicAddURL = musicAddURL;
window.musicAddFiles = musicAddFiles;
window.updateMusicArt = updateMusicArt;

function hideMusicAddModal(){
  const m = document.getElementById('musicAddModal');
  if(m) m.hidden = true;
}

/* ── Visualizer — hands off to motion.js ── */
function applyVisualizerAlign(){
  if(window.MOTION && typeof MOTION.sync === 'function') MOTION.sync();
}
window.applyVisualizerAlign = applyVisualizerAlign;

// Seek slider

document.addEventListener('input', e => {
  if(e.target.id === 'mpSeek' && Music.audio && Music.audio.duration){
    Music.audio.currentTime = (parseFloat(e.target.value) / 100) * Music.audio.duration;
  }
  if(e.target.id === 'mpVol' && Music.audio){
    const v = parseFloat(e.target.value) / 100;
    Music.audio.volume = v;
    S.config.musicVolume = v;
    save();
  }
}, true);

// Init music on load
window.addEventListener('load', () => {
  if(typeof musicInit === 'function') musicInit();
  if(typeof applyVisualizerAlign === 'function') applyVisualizerAlign();
});

// Auto-restore last playing track name
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if(typeof musicInit === 'function') musicInit();
  }, 100);
});

// ═══════════════════════════════════════════════════════════
//   BEAT ANALYZER — Web Audio frequency-driven visualizer
// ═══════════════════════════════════════════════════════════

let _audioCtx = null;
let _analyser = null;
let _dataArray = null;
let _sourceNode = null;
let _vizRafId = null;

function initBeatAnalyser(){
  if(_audioCtx && _analyser) return true;
  try{
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if(!AudioCtx) return false;
    _audioCtx = new AudioCtx();
    _analyser = _audioCtx.createAnalyser();
    _analyser.fftSize = 128;
    _analyser.smoothingTimeConstant = 0.75;
    _dataArray = new Uint8Array(_analyser.frequencyBinCount);

    try{
      _sourceNode = _audioCtx.createMediaElementSource(Music.audio);
      _sourceNode.connect(_analyser);
      _analyser.connect(_audioCtx.destination);
    }catch(e){
      // Already connected to a different context — fine
      console.warn('Audio node already connected');
    }
    return true;
  }catch(e){
    console.warn('Web Audio init failed:', e.message);
    return false;
  }
}

function startBeatVisualizer(){
  const viz = document.querySelector('.mv-visualizer');
  if(!viz) return;
  const bars = viz.querySelectorAll('span');
  if(!bars.length) return;
  if(!Music.audio || Music.audio.paused || !Music.audio.src){ viz.classList.remove('beat-active'); return; }

  if(!initBeatAnalyser()){
    viz.classList.remove('beat-active');
    return;
  }

  viz.classList.add('beat-active');

  // Resume audio context if it was suspended (browser policy)
  if(_audioCtx.state === 'suspended') _audioCtx.resume();

  if(_vizRafId) cancelAnimationFrame(_vizRafId);

  const BAR_COUNT = bars.length;

    let _silentFrames = 0;

   function frame(){
    if(viz.classList.contains('motion-on')){ _vizRafId = 0; return; }
    if(!_analyser) return;
    const audioPaused = Music.audio ? Music.audio.paused : true;

    if(audioPaused){
      bars.forEach(function(b){ b.style.height = ''; });
      _silentFrames = 0;
    } else {
      _analyser.getByteFrequencyData(_dataArray);
      const maxVal = Math.max.apply(null, Array.from(_dataArray));

      if(maxVal === 0){
        _silentFrames++;
        if(_silentFrames >= 10){
          viz.classList.remove('beat-active');
          bars.forEach(function(b){ b.style.height = ''; });
          _silentFrames = 0;
          return;
        }
      } else {
        _silentFrames = 0;
        const usable = Math.floor(_dataArray.length * 0.75);
        for(let i = 0; i < BAR_COUNT; i++){
          const idx = Math.floor((i / BAR_COUNT) * usable);
          const v = _dataArray[idx] || 0;
          const h = 4 + (v / 255) * 50;
          bars[i].style.height = h.toFixed(1) + 'px';
        }
      }
    }
    _vizRafId = requestAnimationFrame(frame);
  }
  frame();
}
window.startBeatVisualizer = startBeatVisualizer;
window.resolveMusicUrl = resolveMusicUrl;

// ═══════════════════════════════════════════════════════════
//   BOOT ANIMATION
// ═══════════════════════════════════════════════════════════
function runBootAnimation(){
  const overlay = document.getElementById('bootOverlay');
  const fill = document.getElementById('bootFill');
  const status = document.getElementById('bootStatus');
  if(!overlay || !fill) return;

  const steps = [
    {pct: 20, msg: 'Loading state…',   delay: 150},
    {pct: 45, msg: 'Loading library…', delay: 200},
    {pct: 70, msg: 'Loading player…',  delay: 200},
    {pct: 90, msg: 'Almost ready…',    delay: 200},
    {pct: 100,msg: 'Ready',            delay: 250}
  ];

  let i = 0;
  const next = () => {
    if(i >= steps.length){
      setTimeout(() => {
        overlay.classList.add('hide');
        setTimeout(() => { overlay.style.display = 'none'; }, 450);
      }, 150);
      return;
    }
    const step = steps[i++];
    fill.style.width = step.pct + '%';
    if(status) status.textContent = step.msg;
    setTimeout(next, step.delay);
  };

  setTimeout(next, 100);
}
window.runBootAnimation = runBootAnimation;


// ═══════════════════════════════════════════════════════════
//   START THE APP
// ═══════════════════════════════════════════════════════════
if(typeof boot === 'function'){
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
}

// Listen for system theme changes when mode is auto
window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function(){
  if(S.config.mode === 'auto' && typeof applyThemeNow === 'function') applyThemeNow();
});

/* ═══════════════════════════════════════════════════════════════════
   THE TWO STANDALONE APPS

   The whole interface lives in index.html. This block turns that one
   shell into two separate apps, chosen by the URL:

     index.html?app=player    → ScriptForge Player
        A player-only window: no dashboard, no Manager — just the media
        player, filling the window. This is the app the operating system
        hands audio/video files to.
        Optional  &file=<path|url>   plays that file on boot.
                  &player=<path|url> is accepted too (legacy).

     index.html?app=manager   → Media Manager
        The Manager page becomes the app's only page, so the window
        opens straight into the file library / folders / queue.

   No ?app= → the normal full app, untouched.
   ═══════════════════════════════════════════════════════════════════ */
(function(){
'use strict';

var qs  = new URLSearchParams(location.search);
var APP = String(qs.get('app') || '').toLowerCase();
if(APP !== 'player' && APP !== 'manager') return;     /* full app — leave it alone */

window.SF_APP = APP;

/* ── helpers ─────────────────────────────────────────────────────── */
function $(id){ return document.getElementById(id); }
function toastSafe(msg, kind){ if(typeof window.toast === 'function') window.toast(msg, kind); }

var VIDEO_RE = /\.(mp4|webm|mkv|mov|m4v|avi|m3u8|ogv|ts)(\?|#|$)/i;

function isVideoUrl(u){ return VIDEO_RE.test(String(u)); }

/* a bare filesystem path (or a path from the OS) becomes a file:// url.
   Media filenames are full of spaces and brackets, so encode them. */
function toUrl(p){
  if(!p) return '';
  var s = String(p);
  if(/^[a-z][a-z0-9+.-]*:\/\//i.test(s) || /^(blob|data):/i.test(s)) return s;
  s = s.replace(/\\/g, '/');
  if(/^[a-z]:\//i.test(s)) s = '/' + s;          /* C:/x → /C:/x */
  else if(s.charAt(0) !== '/') s = '/' + s;
  return 'file://' + encodeURI(s).replace(/#/g, '%23');
}
function nameOf(url){
  try{
    var s = String(url).split('?')[0].split('#')[0].split(/[\\/]/).pop() || '';
    return decodeURIComponent(s).replace(/\.[^.]+$/, '') || 'Untitled';
  }catch(e){ return 'Untitled'; }
}

/* ── hand a file to the app's own player ─────────────────────────── */
function playMedia(url){
  if(!url) return;
  if(typeof window.SF_PLAY_EXTERNAL === 'function'){ window.SF_PLAY_EXTERNAL(url); return; }
  if(isVideoUrl(url)){
    if(typeof window.videoPlayDirect === 'function') window.videoPlayDirect(url, false);
    if(typeof window.openVideoPanel === 'function') window.openVideoPanel();
  } else if(window.Music && Music.audio){
    Music.currentIndex = -1;
    Music.audio.src = url;
    var p = Music.audio.play(); if(p && p.catch) p.catch(function(){});
    if(typeof window.openMusicPanel === 'function') window.openMusicPanel();
  }
}
/* everything after the first file joins the playlist instead of playing */
function queueMedia(url){
  if(isVideoUrl(url)){
    if(typeof window.videoPlaylistAdd === 'function') window.videoPlaylistAdd(url, nameOf(url), 'url');
  } else if(typeof window.musicAddURL === 'function'){
    window.musicAddURL(url);
  }
}
function playMany(urls){
  var list = (urls || []).filter(Boolean);
  if(!list.length) return;
  playMedia(list[0]);
  for(var i = 1; i < list.length; i++) queueMedia(list[i]);
}

/* ── pick files: native dialog in Electron, <input> in a browser ─── */
function pickMedia(){
  var api = window.electronAPI || {};
  if(typeof api.pickMedia === 'function'){
    return Promise.resolve(api.pickMedia()).then(function(paths){
      return (paths || []).map(toUrl);
    });
  }
  return new Promise(function(resolve){
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*,video/*';
    input.multiple = true;
    input.onchange = function(ev){
      var files = Array.prototype.slice.call((ev.target && ev.target.files) || []);
      resolve(files.map(function(f){
        return (window.electronAPI && f.path) ? toUrl(f.path) : URL.createObjectURL(f);
      }));
    };
    input.click();
  });
}
function openFiles(){
  pickMedia().then(function(urls){
    if(!urls.length) return;
    playMany(urls);
  }).catch(function(e){ toastSafe('Could not open that file', 'err'); });
}

/* run after the app has booted (its own 'load' handler) so nothing we do
   here can be undone by the first page render */
function whenLoaded(fn){
  if(document.readyState === 'complete') fn();
  else window.addEventListener('load', fn);
}

/* ── the empty video stage: never leave the window blank ─────────── */
function makeEmptyStage(){
  var d = document.createElement('div');
  d.className = 'sf-player-empty';
  d.innerHTML =
    '<i class="bi bi-play-circle"></i>' +
    '<b>Drop a video here</b>' +
    '<span>or open a file from your computer</span>' +
    '<button class="sf-appbar-btn" data-sf-bar="open">' +
      '<i class="bi bi-folder2-open"></i><span>Open file</span></button>';
  return d;
}
function watchVideoStage(){
  var stage = $('videoStage');
  if(!stage || typeof MutationObserver !== 'function') return;
  function sync(){
    var el = stage.querySelector('.sf-player-empty');
    if(stage.querySelector('video')){ if(el) el.remove(); return; }
    if(!el) stage.appendChild(makeEmptyStage());
  }
  new MutationObserver(sync).observe(stage, { childList: true });
  sync();
}

/* ── drag a file onto the window ─────────────────────────────────── */
function wireDrops(){
  window.addEventListener('dragover', function(e){ e.preventDefault(); }, false);
  window.addEventListener('drop', function(e){
    e.preventDefault();
    var dt = e.dataTransfer; if(!dt) return;
    var urls = [];
    if(dt.files && dt.files.length){
      Array.prototype.forEach.call(dt.files, function(f){
        urls.push((window.electronAPI && f.path) ? toUrl(f.path) : URL.createObjectURL(f));
      });
    } else if(typeof dt.getData === 'function'){
      var raw = dt.getData('text/uri-list') || dt.getData('text/plain') || '';
      raw.split(/\r?\n/).forEach(function(line){
        line = (line || '').trim();
        if(line && line.charAt(0) !== '#') urls.push(line);
      });
    }
    if(urls.length) playMany(urls.map(toUrl));
  }, false);
}

/* ═══════════════════════════════════════════════════════════════════
   MEDIA MANAGER APP
   ═══════════════════════════════════════════════════════════════════ */
/* the two pages this app has: the library and its statistics */
var MM_PAGES = ['overview', 'stats'];

function bootManagerApp(){
  document.body.classList.add('sf-app-manager');
  document.title = 'Media Manager';

  /* The Manager is the app: everything else routes back to it, except the
     Statistics page the topbar opens. */
  var inner = window.goPage;
  if(typeof inner === 'function'){
    window.goPage = function(id){
      if(MM_PAGES.indexOf(id) < 0) id = 'overview';
      return inner.apply(this, arguments);
    };
  }

  /* the topbar shows no app name — pages.js leaves the crumb empty on the
     Manager and names only a sub-page (Statistics) */
}

/* ═══════════════════════════════════════════════════════════════════
   PLAYER APP
   ═══════════════════════════════════════════════════════════════════ */
var bar = null;

function barBtn(kind){ return bar ? bar.querySelector('[data-sf-bar="' + kind + '"]') : null; }

function setBarTitle(){
  var el = bar && bar.querySelector('.sf-appbar-title');
  if(!el) return;
  var v = document.querySelector('#videoStage video');
  var a = $('mpAudio');
  var url = (v && (v.currentSrc || v.src)) || (a && (a.currentSrc || a.src)) || '';
  el.textContent = url ? nameOf(url) : 'ScriptForge Player';
}

function syncBar(){
  var vp = $('videoPanel'), mp = $('musicPanel');
  var vOn = !!(vp && !vp.hidden), mOn = !!(mp && !mp.hidden);
  var bV = barBtn('video'), bA = barBtn('audio');
  if(bV) bV.classList.toggle('active', vOn);
  if(bA) bA.classList.toggle('active', mOn);
  setBarTitle();
}

function buildBar(){
  bar = document.createElement('div');
  bar.className = 'sf-appbar';
  bar.innerHTML =
    '<span class="sf-appbar-mark"><i class="bi bi-collection-play"></i></span>' +
    '<span class="sf-appbar-title">ScriptForge Player</span>' +
    '<span class="sf-appbar-spacer"></span>' +
    '<button class="sf-appbar-btn" data-sf-bar="open" title="Open a media file…">' +
      '<i class="bi bi-folder2-open"></i><span>Open</span></button>' +
    '<button class="sf-appbar-btn" data-sf-bar="video" title="Video player">' +
      '<i class="bi bi-film"></i></button>' +
    '<button class="sf-appbar-btn" data-sf-bar="audio" title="Audio player">' +
      '<i class="bi bi-music-note-beamed"></i></button>';
  document.body.appendChild(bar);
}

function bootPlayerApp(){
  /* sf-player-only already hides the app chrome (see manager.css) */
  document.body.classList.add('sf-player-only', 'sf-app-player');
  document.title = 'ScriptForge Player';

  buildBar();
  wireDrops();
  /* the media panels are declared below this script in index.html, so the
     stage only exists once the document has finished parsing */
  whenLoaded(watchVideoStage);

  /* one handler covers the title bar and the empty stage's button */
  document.addEventListener('click', function(e){
    var b = e.target && e.target.closest ? e.target.closest('[data-sf-bar]') : null;
    if(!b) return;
    e.preventDefault();
    var what = b.dataset.sfBar;
    if(what === 'open'){ openFiles(); return; }
    if(what === 'video' && typeof window.openVideoPanel === 'function'){ window.openVideoPanel(); }
    if(what === 'audio' && typeof window.openMusicPanel === 'function'){ window.openMusicPanel(); }
    syncBar();
  });

  /* keep the title and the video/audio toggle in step with playback */
  document.addEventListener('play', function(e){
    var el = e.target;
    if(!el || !el.tagName) return;
    if(el.tagName === 'VIDEO' || el.tagName === 'AUDIO') setTimeout(syncBar, 0);
  }, true);
  ['openVideoPanel', 'openMusicPanel', 'closeVideoPanel', 'closeMusicPanel'].forEach(function(fn){
    var orig = window[fn];
    if(typeof orig !== 'function') return;
    window[fn] = function(){ var r = orig.apply(this, arguments); setTimeout(syncBar, 0); return r; };
  });

  /* The OS files (double-click, "Open with") and ?file= both end up in
     manager.js's openMediaExternally via SF_PLAY_EXTERNAL, which already
     opens the right panel and starts playback. */

  /* Electron may have started us with a file on the command line. */
  var f = qs.get('file') || qs.get('player') || '';
  if(!f && location.hash.indexOf('#play=') === 0) f = location.hash.slice(6);
  if(f){
    try{ f = decodeURIComponent(f); }catch(e){}
    whenLoaded(function(){ setTimeout(function(){ playMedia(toUrl(f)); syncBar(); }, 150); });
  }

  /* Nothing to play yet → open the player anyway so the window is never
     blank. (The empty stage offers an Open button, and a file can be
     dropped straight onto the window.) A file the OS hands us may still be
     on its way, so give it a moment before falling back. */
  whenLoaded(function(){
    setTimeout(function(){
      var vp = $('videoPanel'), mp = $('musicPanel');
      if(!(vp && !vp.hidden) && !(mp && !mp.hidden) && typeof window.openVideoPanel === 'function'){
        window.openVideoPanel();
      }
      syncBar();
    }, f ? 400 : (window.electronAPI ? 700 : 150));
  });
}

/* ── go ──────────────────────────────────────────────────────────── */
if(APP === 'manager') bootManagerApp();
else bootPlayerApp();

console.log('%c ✓ the ' + APP + ' app is ready', 'color:#a6e3a1;font-weight:600;');
})();
