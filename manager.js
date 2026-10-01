/* ═══════════════════════════════════════════════════════════════════
   manager.js — Media Manager (page: overview)     v11
   Card 1 Library (half width) · Card 2 Player (copy of the dashboard
   player) · Card 3 Queue / Folders
   Taps: volume 1% + hold-ramp · prev/next tap = skip, hold = seek ·
   aspect left/right click · fullscreen native + CSS fallback.
   Dashboard players are never moved, driven or written to.
   Electron: window.SF_PLAY_EXTERNAL(url)  ·  the OS hands media to the
   player app (index.html?app=player); this page is the Media Manager app
   (index.html?app=manager).
   ═══════════════════════════════════════════════════════════════════ */
(function(){
'use strict';

/* ── switches ─────────────────────────────────────────────────────── */
var ROW_OPEN_IN_PLAYER = false;  /* pip icon on media rows            */
var ROW_OPEN_EXTERNAL  = false;  /* 'open with…' on media rows (Elec) */
var PER_PAGE = 8, PER_FOLD = 8;
var LIB_UNFILED_ONLY = true;   /* no folder selected → root shows only unfiled media */




var active=false, type='video', sideView='queue';
var page=0, fpage=0, folder=null, current=null, dragIdx=-1;
var host=null, mgV=null, mgA=null;

/* ── helpers ─────────────────────────────────────────────────────── */
function $(id){ return document.getElementById(id); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){
  return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function isManager(){ return active && typeof S!=='undefined' && S && S.page==='overview'; }
function libKey(){ return type==='video' ? 'videoLibrary'  : 'musicLibrary'; }
function folKey(){ return type==='video' ? 'videoFolders'  : 'audioFolders'; }
function qKey(){   return type==='video' ? 'videoQueue'    : 'musicQueue';   }
function lib(){ if(!S||!S.config) return [];
  if(!Array.isArray(S.config[libKey()])) S.config[libKey()]=[]; return S.config[libKey()]; }
function folders(){ if(!S||!S.config) return [];
  if(!Array.isArray(S.config[folKey()])) S.config[folKey()]=[]; return S.config[folKey()]; }
function queue(){ if(!S||!S.config) return [];
  if(!Array.isArray(S.config[qKey()])) S.config[qKey()]=[]; return S.config[qKey()]; }
function folderById(id){ var l=folders(); for(var i=0;i<l.length;i++) if(l[i].id===id) return l[i]; return null; }
function items(){
  var a=lib();
  if(folder) return a.filter(function(x){ return x.folder===folder; });
  return LIB_UNFILED_ONLY ? a.filter(function(x){ return !x.folder; }) : a;
}

function queueItems(){ var l=lib();
  return queue().map(function(u){ for(var i=0;i<l.length;i++) if(l[i].url===u) return l[i]; return null; })
                .filter(Boolean); }
function playList(){ var q=queueItems(); return q.length ? q : items(); }
function pagesOf(n,per){ return Math.max(1, Math.ceil(n/per)); }
function icons(){ return type==='video' ? 'film' : 'music-note-beamed'; }
function fmt(t){ if(!isFinite(t)||t<0) t=0;
  var m=Math.floor(t/60), s=Math.floor(t%60); return m+':'+(s<10?'0':'')+s; }
function ask(title,def){
  if(typeof promptModal==='function') return promptModal(title, def||'').then(function(v){ return v==null?null:String(v); });
  var v=window.prompt(title, def||''); return Promise.resolve(v==null?null:String(v));
}
function persistVol(kind,vol){
  vol=Math.max(0, Math.min(1, Math.round(vol*100)/100));
  if(kind==='video'){ if(mgV) mgV.volume=vol; S.config.videoVolume=vol; vVol(); }
  else { if(mgA) mgA.volume=vol; S.config.musicVolume=vol; aVol(); }
  save();
}

/* ── real panels first in <body> (position:fixed → nothing moves) ── */
function panelsFirst(){
  ['musicPlaylistPanel','videoPlaylistPanel','musicPanel','videoPanel'].forEach(function(id){
    var el=$(id);
    if(el && el.parentNode===document.body) document.body.insertBefore(el, document.body.firstChild);
  });
}

/* ── the player copy ─────────────────────────────────────────────── */
function tagClone(root){
  if(root.id) root.setAttribute('data-mg', root.id);
  var all=root.querySelectorAll('[id]');
  for(var i=0;i<all.length;i++) all[i].setAttribute('data-mg', all[i].id);
}
function q(name){ return host ? host.querySelector('[data-mg="'+name+'"]') : null; }

function buildPlayer(){
  var slot=$('mgPlayerSlot'); if(!slot) return;
  stopMotion();
  slot.innerHTML=''; host=null; mgV=null; mgA=null;

  var src=$(type==='video' ? 'videoPanel' : 'musicPanel'); if(!src) return;
  var c=src.cloneNode(true);
  c.removeAttribute('hidden'); c.hidden=false;
  c.classList.add('mg-embed');
  var head=c.querySelector(':scope > .panel-head'); if(head) head.parentNode.removeChild(head);
  tagClone(c);
  host=c; slot.appendChild(c);
  if(type==='video') initVideoClone(); else initAudioClone();
  folderBtn();
  watchPlayerSlot();
}

function initVideoClone(){
  var stage=host.querySelector('.video-stage') || q('videoStage'); if(!stage) return;
  stage.innerHTML='';
  mgV=document.createElement('video');
  mgV.autoplay=true; mgV.removeAttribute('crossorigin');
  mgV.style.cssText='width:100%;height:100%;background:#000;display:block;';
  mgV.dataset.aspect=(S.config.videoAspect||'16:9');
  mgV.volume=(S.config.videoVolume!==undefined) ? S.config.videoVolume : 0.8;
  stage.appendChild(mgV);

  mgV.addEventListener('timeupdate', function(){
    var d=mgV.duration||0; if(!d) return;
    var sk=q('vpSeek'); if(sk) sk.value=(mgV.currentTime/d)*100;
    var cu=q('vpCur'); if(cu) cu.textContent=fmt(mgV.currentTime);
    var du=q('vpDur'); if(du) du.textContent=fmt(d);
  });
  mgV.addEventListener('loadedmetadata', function(){ var du=q('vpDur'); if(du) du.textContent=fmt(mgV.duration); });
  mgV.addEventListener('play',  function(){ vIcon(true);  });
  mgV.addEventListener('pause', function(){ vIcon(false); });
  mgV.addEventListener('ended', function(){ mgStep(1); });
  mgV.addEventListener('volumechange', vVol);
  vVol(); vAspectLabel();
}
function vIcon(on){ var i=host&&host.querySelector('.mv-play i'); if(i) i.className='bi '+(on?'bi-pause-fill':'bi-play-fill'); }
function vVol(){
  var v=mgV?mgV.volume:0.8, i=q('vpVolIcon');
  if(i) i.className='bi '+(v===0?'bi-volume-mute':(v<0.5?'bi-volume-down':'bi-volume-up'));
  var p=q('vpVolPct'); if(p) p.textContent=Math.round(v*100)+'%';
}
function vAspectLabel(){
  var l=q('vpAspectLabel');
  if(l) l.textContent=(S.config.videoAspect||'16:9');
}

function initAudioClone(){
  mgA=new Audio(); mgA.preload='metadata';
  mgA.volume=(S.config.musicVolume!==undefined) ? S.config.musicVolume : 0.8;
  mgA.addEventListener('timeupdate', function(){
    var d=mgA.duration||0; if(!d) return;
    var sk=q('mpSeek'); if(sk) sk.value=(mgA.currentTime/d)*100;
    var cu=q('mpCur'); if(cu) cu.textContent=fmt(mgA.currentTime);
    var du=q('mpDur'); if(du) du.textContent=fmt(d);
  });
  mgA.addEventListener('loadedmetadata', function(){ var du=q('mpDur'); if(du) du.textContent=fmt(mgA.duration); });
  mgA.addEventListener('play',  function(){ aIcon(true);  aViz(true);  });
  mgA.addEventListener('pause', function(){ aIcon(false); aViz(false); });
  mgA.addEventListener('ended', function(){ mgStep(1); });
  mgA.addEventListener('volumechange', aVol);
  var pb=host.querySelector('[data-act="music-playlist"]');
  if(pb && pb.parentNode) pb.parentNode.removeChild(pb);
  aVol(); initMotion();
}
function aIcon(on){ var i=q('mpPlayIcon'); if(i) i.className='bi '+(on?'bi-pause-fill':'bi-play-fill'); }
function aViz(on){ var v=q('mvVisualizer'); if(v) v.classList.toggle('playing', !!on); }
function aVol(){
  var v=mgA?mgA.volume:0.8, i=q('mpVolIcon');
  if(i) i.className='bi '+(v===0?'bi-volume-mute':(v<0.5?'bi-volume-down':'bi-volume-up'));
  var p=q('mpVolPct'); if(p) p.textContent=Math.round(v*100)+'%';
}

/* ── MY MOTION, inside the manager's audio stage ─────────────────── */
/* the player card is about half the window — flag it when the docked bar
   would clip its right end (the aspect ratio + fullscreen buttons) */
var mgRO=null, MG_NARROW=420;
function watchPlayerSlot(){
  var slot=$('mgPlayerSlot'); if(!slot) return;
  function fit(){ slot.classList.toggle('mg-narrow', slot.clientWidth > 0 && slot.clientWidth < MG_NARROW); }
  fit();
  if(typeof ResizeObserver==='function'){
    if(mgRO){ try{ mgRO.disconnect(); }catch(e){} }
    mgRO=new ResizeObserver(fit); mgRO.observe(slot);
  }
}

var mCanvas=null, mCtx=null, mW=1, mH=1, mRaf=0, mStore={};
function stopMotion(){ if(mRaf){ cancelAnimationFrame(mRaf); mRaf=0; } mCanvas=null; mCtx=null; }
function initMotion(){
  if(typeof renderMotionEffect!=='function') return;
  var viz=q('mvVisualizer'); if(!viz) return;
  var cv=viz.querySelector(':scope > canvas.mg-motion');
  if(!cv){ cv=document.createElement('canvas'); cv.className='mg-motion'; viz.appendChild(cv); }
  mCanvas=cv; mCtx=cv.getContext('2d'); mStore={};
  mResize(); startMotion();
}
function mResize(){
  if(!mCanvas) return;
  var r=mCanvas.getBoundingClientRect();
  mW=Math.max(1, Math.round(r.width)); mH=Math.max(1, Math.round(r.height));
  var dpr=Math.min(window.devicePixelRatio||1,2);
  mCanvas.width=Math.round(mW*dpr); mCanvas.height=Math.round(mH*dpr);
  mCtx.setTransform(dpr,0,0,dpr,0,0);
}
function startMotion(){
  if(mRaf || !mCtx) return;
  var cfg=(window.MOTION && MOTION.cfg) ? MOTION.cfg()
        : { motionOn:true, motionEffect:'rain', motionSpeed:1, motionIntensity:1, motionColor:'#fab387' };
  if(!cfg.motionOn || !cfg.motionEffect || cfg.motionEffect==='none') return;
  (function loop(){
    mRaf=requestAnimationFrame(loop);
    if(!mCtx || !mCanvas) return;
    if(mCanvas.width!==Math.round(mW*Math.min(window.devicePixelRatio||1,2))) mResize();
    if(!mgA || mgA.paused){ mCtx.clearRect(0,0,mW,mH); return; }
    renderMotionEffect(mCtx, mW, mH, cfg.motionEffect, cfg.motionSpeed, cfg.motionIntensity, mStore, cfg.motionColor);
  })();
}

/* the playlist button in the copy becomes the folder button */
function folderBtn(){
  var b=host.querySelector('[data-act="video-playlist"]');
  if(b){
    b.dataset.mgFolder='1'; b.title='Folders';
    var i=b.querySelector('i'); if(i) i.className='bi bi-folder2-open';
    return;
  }
  var left=host.querySelector('.mv-controls-left') || host.querySelector('.mv-controls');
  if(left){
    var nb=document.createElement('button');
    nb.className='mv-btn'; nb.dataset.mgFolder='1'; nb.title='Folders';
    nb.innerHTML='<i class="bi bi-folder2-open"></i>';
    left.appendChild(nb);
  }
}

/* ── playback ────────────────────────────────────────────────────── */
function mgPlay(item){
  if(!item) return;
  current=item;
    silenceRealMedia();

  if(type==='video'){
    if(mgV){ mgV.src=item.url; try{mgV.load();}catch(e){}
      var p=mgV.play(); if(p&&p.catch) p.catch(function(){}); }
  } else {
    if(mgA){ try{mgA.pause();}catch(e){} mgA.src=item.url; try{mgA.load();}catch(e){}
      var p2=mgA.play(); if(p2&&p2.catch) p2.catch(function(){}); }
  }
  paintLib(); if(sideView==='queue') paintSide();
}
function mgStep(dir){
  var list=playList(); if(!list.length) return;
  var i=current?list.indexOf(current):-1;
  var n=i<0 ? (dir>0?0:list.length-1) : (i+dir+list.length)%list.length;
  mgPlay(list[n]);
}
function mgToggle(){
  var m=type==='video'?mgV:mgA;
  if(!m){ toast('Nothing loaded','warn'); return; }
  if(m.paused) m.play().catch(function(){}); else m.pause();
}

/* opens the app's OWN floating player — no new window */
function openInPlayer(item){
  if(!item){ toast('Nothing to open','warn'); return; }
  try{ if(mgV) mgV.pause(); }catch(e){}
  try{ if(mgA) mgA.pause(); }catch(e){}
  var isVid=type==='video';
  if(isVid){
    if(typeof videoPlayDirect==='function') videoPlayDirect(item.url, true);
    if(typeof openVideoPanel==='function') openVideoPanel();
  } else {
    var a=window.Music && Music.audio;
    if(!a || typeof openMusicPanel!=='function'){ toast('Music player is not ready','warn'); return; }
    Music.currentIndex=-1; a.src=item.url;
    var p=a.play(); if(p&&p.catch) p.catch(function(){});
    openMusicPanel();
  }
  toast('Opened in the player');
}
function mgOpenExternal(idx){
  var it=lib()[idx]; if(!it) return;
  var api=window.electronAPI||{};
  var path=it.path || String(it.url||'').replace(/^file:\/\//,'');
  if(typeof api.openPath==='function' && path){ api.openPath(path); return; }
  if(typeof api.openExternal==='function'){ api.openExternal(it.url); return; }
  window.open(it.url,'_blank');
}

/* ── paint ───────────────────────────────────────────────────────── */
function pager(attr,p,pages){
  return '<button class="mv-pager-btn" data-'+attr+'="-1"'+(p<=0?' disabled':'')+'><i class="bi bi-chevron-left"></i></button>'+
         '<span class="vpl-range">'+(p+1)+'-'+pages+'</span>'+
         '<button class="mv-pager-btn" data-'+attr+'="1"'+(p>=pages-1?' disabled':'')+'><i class="bi bi-chevron-right"></i></button>';
}
function rowHTML(x, showQueueDel){
  var idx=lib().indexOf(x);
  var open = ROW_OPEN_IN_PLAYER ? '<button class="mg-btn" data-mg-open="'+idx+'" title="Open in player"><i class="bi bi-pip"></i></button>' : '';
  var ext  = (ROW_OPEN_EXTERNAL && window.electronAPI) ? '<button class="mg-btn" data-mg-ext="'+idx+'" title="Open with… (VLC)"><i class="bi bi-box-arrow-up-right"></i></button>' : '';
  var del  = showQueueDel
    ? '<button class="mg-btn" data-mg-qdel="'+idx+'" title="Remove from queue"><i class="bi bi-x-lg"></i></button>'
    : '<button class="mg-btn" data-mg-del="'+idx+'" title="Remove"><i class="bi bi-trash"></i></button>';
  return '<div class="mg-row'+(current===x?' on':'')+'" draggable="true" data-mg-drag="'+idx+'">'+
        '<i class="bi bi-grip-vertical mg-grab" title="Drag to a folder or the queue"></i>'+

    '<i class="bi bi-'+icons()+' mg-ico"></i>'+
    '<span class="mg-name" title="'+esc(x.name)+'">'+esc(x.name||'Untitled')+'</span>'+
    '<button class="mg-btn" data-mg-play="'+idx+'" title="Play"><i class="bi bi-play-fill"></i></button>'+
    open+ext+
    '<button class="mg-btn" data-mg-ren="'+idx+'" title="Rename"><i class="bi bi-pencil"></i></button>'+
    del+
  '</div>';
}
function paintLib(){
  var card=$('mgLib'); if(!card) return;
  var list=items(), pages=pagesOf(list.length,PER_PAGE);
  if(page>pages-1) page=pages-1;
  if(page<0) page=0;
  var slice=list.slice(page*PER_PAGE, page*PER_PAGE+PER_PAGE);
  /* head bar — Video/Audio switch on the left, Import on the right;
     left-click imports audio, right-click imports video (see onCapture) */
    card.innerHTML=
    '<div class="mg-head">'+
      '<button class="mg-type" data-mg-type>'+(type==='video'?'Video':'Audio')+'</button>'+
      '<button class="mg-import" data-sf-import="1" title="Import files — left-click: audio · right-click: video">'+
        '<i class="bi bi-box-arrow-in-down"></i><span>Import</span></button>'+
    '</div>'+

    '<div class="mg-list" data-mg-unfile="1">'+
      (slice.length?slice.map(function(x){ return rowHTML(x,false); }).join(''):'<div class="mg-empty">Nothing here yet</div>')+
    '</div>'+
    '<div class="vpl-pager">'+pager('mg-page',page,pages)+'</div>';
}
function paintSide(){
  var card=$('mgSide'); if(!card) return;

  if(sideView==='queue'){
    var ql=queueItems(), pages=pagesOf(ql.length,PER_PAGE);
    if(page>pages-1) page=pages-1;
    if(page<0) page=0;
    var slice=ql.slice(page*PER_PAGE, page*PER_PAGE+PER_PAGE);
    card.innerHTML=
      '<div class="mg-list" data-mg-queue="1">'+
        (slice.length?slice.map(function(x){ return rowHTML(x,true); }).join('')
                     :'<div class="mg-empty">Drag media here to build the queue</div>')+
      '</div>'+
      '<div class="vpl-pager">'+pager('mg-qpage',page,pages)+'</div>';
    return;
  }

  /* folders — BOTH panes are folders */
  var fl=folders(), pages2=pagesOf(fl.length,PER_FOLD);
  if(fpage>pages2-1) fpage=pages2-1;
  if(fpage<0) fpage=0;
  var sl=fl.slice(fpage*PER_FOLD, fpage*PER_FOLD+PER_FOLD);
  var half=Math.ceil(sl.length/2);
    function foldRow(f){
    var n=lib().filter(function(x){ return x.folder===f.id; }).length;
    return '<div class="mg-row'+(folder===f.id?' on':'')+'" data-mg-fold="'+f.id+'">'+
      '<i class="bi bi-folder2 mg-ico"></i>'+
      '<span class="mg-col">'+
        '<span class="mg-name">'+esc(f.name)+'</span>'+
        '<span class="mg-sub">'+n+' '+(type==='video'?'video':'song')+(n===1?'':'s')+'</span>'+
      '</span>'+
      '<button class="mg-btn" data-mg-fren="'+f.id+'" title="Rename"><i class="bi bi-pencil"></i></button>'+
      '<button class="mg-btn" data-mg-fdel="'+f.id+'" title="Delete folder and its media"><i class="bi bi-trash"></i></button>'+
    '</div>';
  }

  var a=sl.slice(0,half).map(foldRow).join('');
  var b=sl.slice(half).map(foldRow).join('');
  card.innerHTML=
    '<div class="mg-head">'+
      '<button class="mg-btn" data-mg-newfold title="New folder"><i class="bi bi-plus-lg"></i></button>'+
    '</div>'+
    '<div class="mg-panes" data-mg-foldzone="1">'+
      '<div class="mg-pane"><div class="mg-list">'+(a||'<div class="mg-empty">No folders yet</div>')+'</div></div>'+
      '<div class="mg-pane"><div class="mg-list">'+b+'</div></div>'+
    '</div>'+
    '<div class="vpl-pager">'+
      '<button class="mv-pager-btn" data-mg-fpage="-1"'+(fpage<=0?' disabled':'')+'><i class="bi bi-chevron-left"></i></button>'+
      '<span class="vpl-range">'+(fpage+1)+'-'+fl.length+'</span>'+
      '<button class="mv-pager-btn" data-mg-fpage="1"'+(fpage>=pages2-1?' disabled':'')+'><i class="bi bi-chevron-right"></i></button>'+
    '</div>';
}

/* ── page ────────────────────────────────────────────────────────── */
function mgRender(root){
  active=true;
  root.classList.add('mg-root');
  root.innerHTML=
    '<div class="mg-grid">'+
      '<section class="mg-card mg-lib" id="mgLib"></section>'+
      '<section class="mg-card mg-player" id="mgPlayer"><div class="mg-slot" id="mgPlayerSlot"></div></section>'+
      '<section class="mg-card mg-side" id="mgSide"></section>'+
    '</div>';
  hideStrips();  
    hideRealPanels(); silenceRealMedia();
  buildPlayer(); paintLib(); paintSide();
}
function leaveManager(){
  if(!active) return;
  active=false; stopMotion();
  try{ if(mgV) mgV.pause(); }catch(e){}
  try{ if(mgA) mgA.pause(); }catch(e){}
  hideStrips();
}
function hideStrips(){ ['vpStrip','mpStrip'].forEach(function(id){ var s=$(id); if(s) s.hidden=true; }); }
/* the real dashboard panels are first in <body>, so getElementById gives the
   REAL one, never the clone */
function hideRealPanels(){
  ['videoPanel','musicPanel','videoPlaylistPanel','musicPlaylistPanel'].forEach(function(id){
    var el=$(id); if(el) el.hidden=true;
  });
}
function silenceRealMedia(){
  var st=$('videoStage'), v=st && st.querySelector('video');
  if(v){ try{ v.pause(); }catch(e){} }
  try{ if(window.Music && Music.audio) Music.audio.pause(); }catch(e){}
}


/* ── type / folders / rows ───────────────────────────────────────── */
function mgSwitchType(){
  type=(type==='video')?'audio':'video';
  folder=null; page=0; fpage=0; current=null; sideView='queue';
  buildPlayer(); paintLib(); paintSide();
}
function mgNewFolder(){
  ask('Folder name','').then(function(n){
    n=(n||'').trim(); if(!n) return;
    folders().push({ id:uid(), name:n });
    fpage=pagesOf(folders().length,PER_FOLD)-1;
    save(); paintSide();
  });
}
function mgRenameFolder(id){
  var f=folderById(id); if(!f) return;
  ask('Rename folder', f.name).then(function(n){
    n=(n||'').trim(); if(!n) return;
    f.name=n; save(); paintSide(); paintLib();
  });
}
function mgDeleteFolder(id){
  var f=folderById(id), n=lib().filter(function(x){ return x.folder===id; }).length;
  if(!window.confirm('Delete "'+(f?f.name:'folder')+'" and its '+n+' item(s)?')) return;
  S.config[folKey()]=folders().filter(function(x){ return x.id!==id; });
  S.config[libKey()]=lib().filter(function(x){ return x.folder!==id; });
  if(folder===id) folder=null;
  if(current && current.folder===id) current=null;
  save(); paintLib(); paintSide();
}
function mgRenameItem(idx){
  var it=lib()[idx]; if(!it) return;
  ask('Rename', it.name).then(function(n){
    n=(n||'').trim(); if(!n) return;
    it.name=n; save(); paintLib(); if(sideView==='queue') paintSide();
  });
}
function mgRemoveItem(idx){
  var it=lib()[idx]; if(!it) return;
  S.config[qKey()]=queue().filter(function(u){ return u!==it.url; });   /* drop from queue too */
  lib().splice(idx,1);
  if(current===it) current=null;
  save(); paintLib(); paintSide();
}
function mgQueueRemove(idx){                        /* X on a queue row */
  var it=lib()[idx]; if(!it) return;
  S.config[qKey()]=queue().filter(function(u){ return u!==it.url; });
  save(); paintSide();
}

/* ── import: left = audio · right = video ────────────────────────── */
function pickFiles(kind){
  var isVid=kind==='video';
  var input=document.createElement('input');
  input.type='file'; input.multiple=true; input.accept=isVid?'video/*':'audio/*';
  input.onchange=function(ev){
    var files=Array.prototype.slice.call((ev.target&&ev.target.files)||[]);
    if(!files.length) return;
    var list=isVid ? (S.config.videoLibrary=S.config.videoLibrary||[])
                   : (S.config.musicLibrary=S.config.musicLibrary||[]);
    var n=0;
    files.forEach(function(f){
      var path=f.path||null;
      var url=(window.electronAPI && path) ? ('file://'+path.replace(/\\/g,'/')) : URL.createObjectURL(f);
      if(list.some(function(x){ return x.url===url; })) return;
      list.push({ url:url, name:f.name.replace(/\.[^.]+$/,''),
                  source:(window.electronAPI && path)?'path':'file',
                  path:path, mime:f.type, added:Date.now(), folder:null });   /* never auto-filed */
      n++;
    });
       if(!n) return;
    var kind = isVid ? 'video' : 'audio';
    if(type !== kind){ type = kind; fpage = 0; if(isManager()) buildPlayer(); }  /* Manager opens on what you just imported */
    save();
    toast(n+(isVid?' video':' track')+(n>1?'s':'')+' added to library');
    if(isManager()){ page=0; paintLib(); paintSide(); }

  };
  input.click();
}

/* ── events ──────────────────────────────────────────────────────── */
function onCapture(e){
  var t=e.target; if(!t||!t.closest) return;
  var el;

  /* Import — the button on the library bar (right of the Video/Audio switch)
     and the floating one both add files to the library */
  if(t.closest('#floatingImport') || t.closest('[data-sf-import]')){
    e.preventDefault(); e.stopImmediatePropagation();
    pickFiles(e.type==='contextmenu'?'video':'audio');
    return;
  }
  if(!isManager()) return;

  if(t.closest('[data-mg-folder]')){
    e.preventDefault(); e.stopImmediatePropagation();
    sideView=(sideView==='folders')?'queue':'folders'; paintSide(); return;
  }

  /* inside the player copy: the app must never see it */
  if(t.closest('#mgPlayerSlot')){
    e.stopImmediatePropagation();
    var isCtx=(e.type==='contextmenu');
    if(t.closest('[data-act="video-toggle"], [data-act="mp-toggle"]')){ e.preventDefault(); mgToggle(); return; }
    if(t.closest('[data-act="mp-shuffle"], [data-act="mp-repeat"]')){
      e.preventDefault();
      var b=t.closest('[data-act]'); b.classList.toggle('active');
      var ic=b.querySelector('i');
      if(ic && b.dataset.act==='mp-repeat') ic.className=b.classList.contains('active')?'bi bi-repeat-1':'bi bi-repeat';
      return;
    }
    return;
  }

  if(t.closest('#mgLib')){
    if(t.closest('[data-mg-type]')){ e.preventDefault(); e.stopImmediatePropagation(); mgSwitchType(); return; }
    if(t.closest('[data-mg-clearfold]')){ e.preventDefault(); e.stopImmediatePropagation();
      folder=null; page=0; paintLib(); paintSide(); return; }
    if((el=t.closest('[data-mg-page]'))){ e.preventDefault(); e.stopImmediatePropagation();
      page=Math.max(0,page+(+el.dataset.mgPage)); paintLib(); return; }
  }
  if(t.closest('#mgSide')){
    if((el=t.closest('[data-mg-qpage]'))){ e.preventDefault(); e.stopImmediatePropagation();
      page=Math.max(0,page+(+el.dataset.mgQpage)); paintSide(); return; }
    if((el=t.closest('[data-mg-fpage]'))){ e.preventDefault(); e.stopImmediatePropagation();
      fpage=Math.max(0,fpage+(+el.dataset.mgFpage)); paintSide(); return; }
    if(t.closest('[data-mg-newfold]')){ e.preventDefault(); e.stopImmediatePropagation(); mgNewFolder(); return; }
    if((el=t.closest('[data-mg-fren]'))){ e.preventDefault(); e.stopImmediatePropagation(); mgRenameFolder(el.dataset.mgFren); return; }
    if((el=t.closest('[data-mg-fdel]'))){ e.preventDefault(); e.stopImmediatePropagation(); mgDeleteFolder(el.dataset.mgFdel); return; }
    if((el=t.closest('[data-mg-fold]'))){ e.preventDefault(); e.stopImmediatePropagation();
      folder=(folder===el.dataset.mgFold)?null:el.dataset.mgFold; page=0; paintLib(); paintSide(); return; }
  }

  if((el=t.closest('[data-mg-play]'))){ e.preventDefault(); e.stopImmediatePropagation(); mgPlay(lib()[+el.dataset.mgPlay]); return; }
  if((el=t.closest('[data-mg-open]'))){ e.preventDefault(); e.stopImmediatePropagation(); openInPlayer(lib()[+el.dataset.mgOpen]); return; }
  if((el=t.closest('[data-mg-ext]'))){  e.preventDefault(); e.stopImmediatePropagation(); mgOpenExternal(+el.dataset.mgExt); return; }
  if((el=t.closest('[data-mg-ren]'))){  e.preventDefault(); e.stopImmediatePropagation(); mgRenameItem(+el.dataset.mgRen); return; }
  if((el=t.closest('[data-mg-qdel]'))){ e.preventDefault(); e.stopImmediatePropagation(); mgQueueRemove(+el.dataset.mgQdel); return; }
  if((el=t.closest('[data-mg-del]'))){  e.preventDefault(); e.stopImmediatePropagation(); mgRemoveItem(+el.dataset.mgDel); return; }
}
window.addEventListener('click', onCapture, true);
window.addEventListener('contextmenu', onCapture, true);

/* ── fullscreen — the app's own path, on the copy ────────────────── */
function mgFullscreen(){
  var el=q('videoBody') || q('videoStage') || (host && host.querySelector('.video-stage'));
  if(!el){ toast('Nothing to fullscreen','warn'); return; }
  if(document.fullscreenElement){ document.exitFullscreen(); return; }
  if(el.classList.contains('vp-fs-fallback')){ el.classList.remove('vp-fs-fallback'); return; }
  if(el.requestFullscreen){
    el.requestFullscreen().catch(function(){
      if(el.classList.contains('panel-body')) el.classList.add('vp-fs-fallback');
      else if(mgV && mgV.requestFullscreen) mgV.requestFullscreen().catch(function(){ el.classList.add('vp-fs-fallback'); });
    });
  } else if(mgV && mgV.requestFullscreen){
    mgV.requestFullscreen().catch(function(){});
  } else {
    el.classList.add('vp-fs-fallback');
  }
}


/* ── volume: tap 1% · hold to ramp (same numbers as the app) ─────── */
var VOL_TAP=0.01, VOL_TICK_MS=100, VOL_RAMP_AFTER=400, VOL_SLOW=0.02, VOL_MED=0.05, VOL_HOLD_DELAY=250;
var volTimer=null, volStart=0, volDir=0;
function startVolHold(dir){
  stopVolHold();
  volStart=Date.now(); volDir=dir;
  var cur=(volDir>0?1:-1);
  var now=(type==='video') ? (mgV?mgV.volume:0.8) : (mgA?mgA.volume:0.8);
  persistVol(type, now + dir*VOL_TAP);
  volTimer=setTimeout(function(){
    volTimer=setInterval(function(){
      var elapsed=Date.now()-volStart;
      var step=(elapsed>VOL_RAMP_AFTER)?VOL_MED:VOL_SLOW;
      var v=(type==='video') ? (mgV?mgV.volume:0.8) : (mgA?mgA.volume:0.8);
      var next=v+dir*step;
      if(next<=0||next>=1){ persistVol(type,next); stopVolHold(); return; }
      persistVol(type,next);
    }, VOL_TICK_MS);
  }, VOL_HOLD_DELAY);
}
function stopVolHold(){ if(volTimer){ clearTimeout(volTimer); clearInterval(volTimer); volTimer=null; } volDir=0; }

/* ── prev / next: tap = skip · hold = seek (same as the app) ─────── */
var SEEK_TICK_MS=100, SEEK_HOLD_MS=400, SEEK_RAMP_AFTER=800, SEEK_SLOW=2, SEEK_FAST=6;
var skTimer=null, skStart=0, skDir=0, skMoved=false;
function startSkipHold(dir){
  stopSkipHold(); skDir=dir; skStart=Date.now(); skMoved=false;
  skTimer=setInterval(function(){
    var m=(type==='video')?mgV:mgA;
    if(!m || !m.duration) return;
    var elapsed=Date.now()-skStart;
    if(!skMoved && elapsed<SEEK_HOLD_MS) return;
    skMoved=true;
    var step=(elapsed>SEEK_RAMP_AFTER)?SEEK_FAST:SEEK_SLOW;
    m.currentTime=Math.max(0, Math.min(m.duration, m.currentTime + dir*step));
  }, SEEK_TICK_MS);
}
function stopSkipHold(){
  if(skTimer){ clearInterval(skTimer); skTimer=null; }
  if(!skMoved && skDir){ mgStep(skDir); }
  skDir=0; skMoved=false;
}
function stopAllHolds(){ stopVolHold(); stopSkipHold(); }

  window.addEventListener('mousedown', function(e){
  if(!isManager()) return;
  var t=e.target; if(!t||!t.closest) return;
  if(!t.closest('#mgPlayerSlot')) return;

  /* the clone keeps the app's ids, so panels.js's document-capture mousedown
     handlers would drive the REAL hidden panels — never let them see it */
  e.stopImmediatePropagation();

  if(e.button!==0 && e.button!==2) return;

  if(t.closest('[data-act="video-fullscreen"]')){
    e.preventDefault();
    if(e.button===0) mgFullscreen();
    return;
  }
  if(t.closest('[data-mg="vpVolBtn"], [data-mg="mpVolBtn"]')){
    e.preventDefault();
    startVolHold(e.button===2 ? +1 : -1); return;
  }
  if(t.closest('[data-mg="vpAspectBtn"]')){
    e.preventDefault();
    mgCycleAspect(e.button===2 ? +1 : -1); return;
  }
  if(t.closest('[data-act="video-prev"], [data-act="mp-prev"]')){
    e.preventDefault(); startSkipHold(-1); return;
  }
  if(t.closest('[data-act="video-next"], [data-act="mp-next"]')){
    e.preventDefault(); startSkipHold(1); return;
  }
}, true);

window.addEventListener('mouseup', function(){ stopAllHolds(); }, true);
window.addEventListener('blur', function(){ stopAllHolds(); });

function mgCycleAspect(dir){
  var ASP=['16:9','4:3','21:9','1:1','9:16'];
  var cur=S.config.videoAspect||'16:9';
  var i=ASP.indexOf(cur); if(i<0) i=0;
  cur=ASP[(i+dir+ASP.length)%ASP.length];
  S.config.videoAspect=cur; save();
  if(mgV) mgV.dataset.aspect=cur;
  vAspectLabel();
  toast('Aspect: '+cur);
}

/* ── drag & drop: file / unfile / queue ──────────────────────────── */
function dropTargetOf(t){
  if(t.closest('[data-mg-fold]'))     return { kind:'folder', el:t.closest('[data-mg-fold]') };
  if(t.closest('[data-mg-queue]'))    return { kind:'queue',  el:null };
  if(t.closest('[data-mg-foldzone]')) return { kind:'folderopen', el:null };
  if(t.closest('[data-mg-unfile]'))   return { kind:'unfile', el:null };
  return null;
}
window.addEventListener('dragstart', function(e){
  if(!isManager()||!e.target.closest) return;
  var r=e.target.closest('[data-mg-drag]'); if(!r) return;
  dragIdx=+r.dataset.mgDrag;
  try{ e.dataTransfer.setData('text/plain', String(dragIdx)); }catch(x){}
  e.dataTransfer.effectAllowed='move';
}, true);
window.addEventListener('dragover', function(e){
  if(!isManager()||!e.target.closest) return;
  if(dropTargetOf(e.target)){ e.preventDefault(); e.dataTransfer.dropEffect='move'; }
}, true);
window.addEventListener('drop', function(e){
  if(!isManager()||!e.target.closest) return;
  var tgt=dropTargetOf(e.target); if(!tgt) return;
  e.preventDefault(); e.stopImmediatePropagation();
  var idx=dragIdx>=0?dragIdx:parseInt(e.dataTransfer.getData('text/plain'),10);
  var it=lib()[idx]; if(!it) return;
    if(tgt.kind==='folder'){
    it.folder=tgt.el.dataset.mgFold;
  } else if(tgt.kind==='folderopen'){
    if(!folder){ toast('Open a folder first','warn'); return; }
    it.folder=folder;
  } else if(tgt.kind==='unfile'){
    it.folder=null;
   } else {
    if(queue().indexOf(it.url)<0) queue().push(it.url);
    toast('Added to queue');
  }
  save();
  paintLib(); paintSide();
}, true);


/* seek sliders */
document.addEventListener('input', function(e){
  if(!isManager()) return;
  var t=e.target; if(!t||t.type!=='range') return;
  if(!t.closest('#mgPlayerSlot')) return;
  var pct=(+t.value)/100;
  if(t.getAttribute('data-mg')==='vpSeek' && mgV && mgV.duration) mgV.currentTime=pct*mgV.duration;
  if(t.getAttribute('data-mg')==='mpSeek' && mgA && mgA.duration) mgA.currentTime=pct*mgA.duration;
}, true);

/* ── settings modal: make Close always work ──────────────────────── */
function hardCloseModal(){
  if(typeof closeModal==='function'){ try{ closeModal(); return; }catch(err){} }
  var root=$('modalRoot'); if(!root) return;
  var scrims=root.querySelectorAll('.modal-scrim');
  for(var i=0;i<scrims.length;i++) scrims[i].remove();
  root.innerHTML=''; root.classList.remove('open');
}
document.addEventListener('click', function(e){
  if(!e.target.closest) return;
  if(!e.target.closest('[data-act="set-close"]')) return;
  e.preventDefault(); e.stopImmediatePropagation(); hardCloseModal();
}, true);


/* a path handed over by the OS becomes a file:// url. Media filenames are
   full of spaces and brackets, so encode them (and leave real urls alone). */
function sfFileUrl(p){
  if(!p) return '';
  if(/^[a-z][a-z0-9+.-]*:\/\//i.test(p)) return p;
  var s=String(p).replace(/\\/g,'/');
  if(/^[a-z]:\//i.test(s)) s='/'+s;
  else if(s.charAt(0)!=='/') s='/'+s;
  return 'file://'+encodeURI(s).replace(/#/g,'%23');
}

/* ── a file handed to us by the OS / VLC: playlist + history + play ── */
function openMediaExternally(url){
  if(!url) return;
  var isVideo=/\.(mp4|webm|mkv|mov|m4v|avi|m3u8|ogv)(\?|$)/i.test(url);

  if(isVideo){
    var name=url.split('/').pop().split('?')[0].replace(/\.[^.]+$/,'');
    try{ name=decodeURIComponent(name); }catch(e){}
    if(typeof videoPlaylistAdd==='function') videoPlaylistAdd(url, name, 'url');
    var list=S.config.videoPlaylist||[], idx=-1;
    for(var k=0;k<list.length;k++) if(list[k].url===url) idx=k;
    if(idx>=0 && typeof playFromVideoPlaylist==='function') playFromVideoPlaylist(idx);
    else if(typeof videoPlayDirect==='function') videoPlayDirect(url, false);   /* false → history */
    if(typeof openVideoPanel==='function') openVideoPanel();
    return;
  }

  if(!(window.Music && Music.audio)) return;
  if(typeof musicAddURL==='function') musicAddURL(url);          /* playlist + save + render */
  var i=-1;
  for(var k2=0;k2<Music.playlist.length;k2++) if(Music.playlist[k2].url===url) i=k2;
  if(i>=0 && typeof playMusicIndex==='function') playMusicIndex(i);   /* selects + plays the row */
  else {
    Music.currentIndex=-1; Music.audio.src=url;
    var p=Music.audio.play(); if(p&&p.catch) p.catch(function(){});
  }
  if(typeof openMusicPanel==='function') openMusicPanel();
}

window.SF_PLAY_EXTERNAL = openMediaExternally;

function playerOnlyRequest(){
  var m=/[?&]player=([^&]+)/.exec(location.search);
  if(m) return decodeURIComponent(m[1]);
  if(location.hash.indexOf('#play=')===0) return decodeURIComponent(location.hash.slice(6));
  return '';
}
function bootPlayerOnly(url){
  document.body.classList.add('sf-player-only');
  setTimeout(function(){ openMediaExternally(url); }, 600);
}

/* ══════════════════════════════════════════════════════════════════
   STATISTICS → MEDIA card (one dropdown: Video / Audio)
   ══════════════════════════════════════════════════════════════════ */
var mgStatKind = 'video';

function mgStatMeta(k){
  var items=(S.config[k==='video'?'videoLibrary':'musicLibrary'])||[];
  var folds=(S.config[k==='video'?'videoFolders':'audioFolders'])||[];
  var q    =(S.config[k==='video'?'videoQueue':'musicQueue'])||[];
  var filed=0;
  items.forEach(function(x){ if(x.folder) filed++; });
  return { items:items, folds:folds, q:q, filed:filed, unfiled:items.length-filed };
}
function mgStatPaint(){
  var box=$('mgStatBody'); if(!box) return;
  var k=mgStatKind, m=mgStatMeta(k);
  var ico=(k==='video')?'film':'music-note-beamed';
  function card(n,lbl,i){
    return '<div class="stat-card-lg"><div class="stat-ico"><i class="bi bi-'+i+'"></i></div>'+
           '<div class="stat-big">'+n+'</div><div class="stat-lbl">'+lbl+'</div></div>';
  }
  var rows=m.items.map(function(x){
    var fn='';
    for(var i=0;i<m.folds.length;i++) if(m.folds[i].id===x.folder) fn=m.folds[i].name;
    return '<div class="mg-row"><i class="bi bi-'+ico+' mg-ico"></i>'+
      '<span class="mg-name" title="'+esc(x.name)+'">'+esc(x.name||'Untitled')+'</span>'+
      '<span class="mg-meta">'+esc(fn||'—')+'</span></div>';
  }).join('');
  var foldRows=m.folds.map(function(f){
    var n=0; m.items.forEach(function(x){ if(x.folder===f.id) n++; });
    return '<div class="mg-row"><i class="bi bi-folder2 mg-ico"></i>'+
      '<span class="mg-name" title="'+esc(f.name)+'">'+esc(f.name)+'</span>'+
      '<span class="mg-meta">'+n+'</span></div>';
  }).join('');
  box.innerHTML=
    '<div class="stats-grid-kpi">'+
      card(m.items.length, (k==='video'?'Videos':'Tracks'), ico)+
      card(m.folds.length, 'Folders', 'folder2')+
      card(m.q.length,     'In queue','list-ol')+
      card(m.filed,        'Filed',   'box-seam')+
    '</div>'+
    '<div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.5fr);gap:12px;align-items:start;">'+
      '<div class="set-card">'+
        '<div class="mg-head"><i class="bi bi-folder2 mg-ico"></i>'+
          '<span class="mg-meta" style="margin-left:2px;">Folders</span>'+
          '<span class="mg-meta" style="margin-left:auto;">'+m.folds.length+'</span></div>'+
        '<div class="mg-list" style="max-height:300px;">'+(foldRows||'<div class="mg-empty">No folders yet</div>')+'</div>'+
      '</div>'+
      '<div class="set-card">'+
        '<div class="mg-head"><i class="bi bi-'+ico+' mg-ico"></i>'+
          '<span class="mg-meta" style="margin-left:2px;">Library</span>'+
          '<span class="mg-meta" style="margin-left:auto;">'+(m.items.length-m.filed)+' unfiled</span></div>'+
        '<div class="mg-list" style="max-height:300px;">'+(rows||'<div class="mg-empty">Nothing added yet</div>')+'</div>'+
      '</div>'+
    '</div>';
}
function mountMediaStats(root){
  root.innerHTML=
    '<div class="stats-page">'+
      '<div class="stats-top">'+
        '<div class="stats-drops">'+
          '<div class="stats-cat-card" data-mg-stat-kind>'+
            '<button type="button" class="stats-cat-title"><i class="bi bi-collection-play"></i> Media'+
              '<span class="stats-cat-value">Video</span>'+
              '<i class="bi bi-chevron-down stats-cat-caret"></i></button>'+
            '<div class="stats-cat-list">'+
              '<button class="stats-cat-item active" data-value="video"><span>Video</span><i class="bi bi-check2"></i></button>'+
              '<button class="stats-cat-item" data-value="audio"><span>Audio</span><i class="bi bi-check2"></i></button>'+
            '</div>'+
          '</div>'+
        '</div>'+
      '</div>'+
      '<div class="stats-body" id="mgStatBody" style="overflow-y:auto;"></div>'+
    '</div>';
  var box=root.querySelector('[data-mg-stat-kind]');
  if(box){
    function label(){
      var v=box.querySelector('.stats-cat-value');
      if(v) v.textContent=(mgStatKind==='video')?'Video':'Audio';
      box.querySelectorAll('.stats-cat-item').forEach(function(el){
        el.classList.toggle('active', el.dataset.value===mgStatKind);
      });
    }
    label();

    /* the Video / Audio switch */
    box.addEventListener('click', function(e){
      var it=e.target.closest('.stats-cat-item');
      if(it){
        mgStatKind=it.dataset.value;
        box.classList.remove('open');
        label(); mgStatPaint();
        return;
      }
      if(e.target.closest('.stats-cat-title')) box.classList.toggle('open');
    });
  }
  mgStatPaint();
}


/* ── boot ────────────────────────────────────────────────────────── */
if(window.PAGE_RENDERERS){
  window.PAGE_RENDERERS.overview=function(root){ mgRender(root); };
  /* the app's Statistics page is the media library's own numbers */
  window.PAGE_RENDERERS.stats=function(root){ mountMediaStats(root); };
}

var origGoPage=window.goPage;
window.goPage=function(id){
  if(id!=='overview') leaveManager();
  if(id==='overview' || id==='stats') hideRealPanels();
  return origGoPage.apply(this,arguments);
};

window.addEventListener('load', function(){
  panelsFirst();
  var u=playerOnlyRequest(); if(u) bootPlayerOnly(u);
  /* Electron file association / "Open with" */
  if(window.electronAPI && typeof window.electronAPI.onOpenMedia==='function'){
    window.electronAPI.onOpenMedia(function(p){
      openMediaExternally(sfFileUrl(p));
    });
  }
});

console.log('%c ✓ manager.js loaded', 'color:#10b981;font-weight:600;');
})();
