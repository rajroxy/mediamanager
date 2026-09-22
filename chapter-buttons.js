/* chapter-buttons.js */
(function(){
  const L = () => (S.mode === 'screenplay') ? {ch:'Scene',sub:'Subscene'} : {ch:'Chapter',sub:'Subchapter'};
  const rootOf = id => { const ls = D().chapters || [];
    return ls.find(c => c.id === id) || ls.find(c => (c.children||[]).some(x => x.id === id)) || ls[0]; };

  /* The next free number for a default-named section: the first one is 1, the
     next is 2, and deleting a middle one never makes a number repeat. Both
     spellings count, so Chapter/Scene numbering survives a mode switch. */
  function nextNum(list, kind){
    const pre = kind === 'sub' ? ['Subchapter','Subscene'] : ['Chapter','Scene'];
    let max = 0;
    (list || []).forEach(function(c){
      const t = String((c && c.title) || '').trim();
      pre.forEach(function(p){
        const m = new RegExp('^' + p + '\\s+(\\d+)$').exec(t);
        if(m) max = Math.max(max, parseInt(m[1], 10));
      });
    });
    return max + 1;
  }

  /* A default name that counts EVERY sibling, renamed ones included, so the
     number always matches how many chapters/scenes you actually have and can
     never repeat one that is already taken. */
  function nextFreeNum(list, kind){
    const pre = kind === 'sub' ? ['Subchapter','Subscene'] : ['Chapter','Scene'];
    const taken = {};
    (list || []).forEach(function(c){
      const t = String((c && c.title) || '').trim();
      pre.forEach(function(p){
        const m = new RegExp('^' + p + '\\s+(\\d+)$', 'i').exec(t);
        if(m) taken[parseInt(m[1], 10)] = 1;
      });
    });
    let n = (list || []).length + 1;              /* position-based default */
    while(taken[n]) n++;                          /* never collide, renamed or not */
    return n;
  }

  // keep whatever is on screen in the doc it belongs to — BEFORE the pointer moves
  function keepScreen(){
    const e = document.getElementById('editor');
    if(!e) return;
    const f = findCh(D().currentChapter);
    if(f) f.ch.content = e.innerHTML;
  }

  function switchTo(id){
    if(!id || id === D().currentChapter) return;
    keepScreen();
    D().currentChapter = id;
    goPage('write');          // app's own render: loads the editor, rebuilds the row, saves — all correct
  }

  // picking from either dropdown (native select fires change; the custom one dispatches it too)
  document.addEventListener('change', function(e){
    const s = e.target;
    if(s && s.tagName === 'SELECT' && s.closest && s.closest('#chapterControls')) switchTo(s.value);
  }, true);

  document.addEventListener('click', function(e){
    const lab = L();

    if(e.target.closest('[data-act="new-chapter"]')){
      e.preventDefault();
      const d = D(); if(!d.chapters) d.chapters = [];
      keepScreen();
      const ch = { id:uid(), title:lab.ch+' '+nextFreeNum(d.chapters, 'ch'), content:'', children:[], collapsed:false };
      const root = rootOf(d.currentChapter);
      const at = root ? d.chapters.indexOf(root) : -1;
      if(at >= 0) d.chapters.splice(at+1,0,ch); else d.chapters.push(ch);
      D().currentChapter = ch.id;
      goPage('write');
      return;
    }

    if(e.target.closest('[data-act="new-subchapter"]')){
      e.preventDefault();
      const d = D();
      const root = rootOf(d.currentChapter);
      if(!root) return;
      keepScreen();
      if(!root.children) root.children = [];
      root.collapsed = false;
      const ch = { id:uid(), title:lab.sub+' '+nextFreeNum(root.children, 'sub'), content:'', children:[], collapsed:false };
      root.children.push(ch);
      D().currentChapter = ch.id;
      goPage('write');
      return;
    }

    const it = e.target.closest('.tb-drop2-item');
    if(it && it.dataset.value) switchTo(it.dataset.value);
  }, true);
})();

/* ═══ Rename / Delete chapter + subchapter (pencil & trash in the strip) ═══ */
(function(){
  const L = () => (S.mode === 'screenplay') ? {ch:'Scene',sub:'Subscene'} : {ch:'Chapter',sub:'Subchapter'};

  // keep whatever is on screen in the doc it belongs to — same as switching
  function keepScreen(){
    const e = document.getElementById('editor');
    if(!e) return;
    const f = findCh(D().currentChapter);
    if(f) f.ch.content = e.innerHTML;
  }

  function findRoot(){
    const d = D();
    return d.chapters.find(c => c.id === d.currentChapter)
        || d.chapters.find(c => (c.children||[]).some(x => x.id === d.currentChapter))
        || d.chapters[0];
  }

  document.addEventListener('click', function(e){
    const lab = L();
    const d = D();
    const root = findRoot();
    const cur = d.chapters.find(c => c.id === d.currentChapter)
            || (root ? (root.children||[]).find(x => x.id === d.currentChapter) : null)
            || root;

    if(e.target.closest('[data-act="rename-chapter"]')){
      e.preventDefault();
      if(!root) return;
      const name = prompt('Rename ' + lab.ch + ':', root.title || '');
      if(!name || name === root.title) return;
      root.title = name.trim(); save(); goPage('write'); toast(lab.ch + ' renamed');
      return;
    }
    if(e.target.closest('[data-act="delete-chapter"]')){
      e.preventDefault();
      if(!root || d.chapters.length <= 1){ toast('Cannot delete the last ' + lab.ch.toLowerCase(), 'warn'); return; }
      if(!confirm('Delete "' + (root.title || 'Untitled') + '"? Cannot be undone.')) return;
      keepScreen();
      /* land on the section you came from: the previous one (delete chapter 3
         → chapter 2), else the next one, else whatever is left */
      const at = d.chapters.indexOf(root);
      d.chapters = d.chapters.filter(c => c !== root);
      const neighbour = d.chapters[at - 1] || d.chapters[at] || d.chapters[0];
      d.currentChapter = neighbour ? neighbour.id : null;
      save(); goPage('write'); toast(lab.ch + ' deleted');
      return;
    }
    if(e.target.closest('[data-act="rename-subchapter"]')){
      e.preventDefault();
      if(!cur || cur === root){ toast('No ' + lab.sub.toLowerCase() + ' selected', 'warn'); return; }
      const name = prompt('Rename ' + lab.sub + ':', cur.title || '');
      if(!name || name === cur.title) return;
      cur.title = name.trim(); save(); goPage('write'); toast(lab.sub + ' renamed');
      return;
    }
    if(e.target.closest('[data-act="delete-subchapter"]')){
      e.preventDefault();
      if(!cur || cur === root || !root){ toast('No ' + lab.sub.toLowerCase() + ' selected', 'warn'); return; }
      if(!confirm('Delete "' + (cur.title || 'Untitled') + '"? Cannot be undone.')) return;
      keepScreen();
      /* same rule for subchapters: the previous one, else the next one,
         else the parent section */
      const at = (root.children || []).indexOf(cur);
      root.children = (root.children||[]).filter(x => x !== cur);
      const neighbour = root.children[at - 1] || root.children[at] || root;
      d.currentChapter = neighbour.id;
      save(); goPage('write'); toast(lab.sub + ' deleted');
      return;
    }
  }, true);
})();
/* ── Drag any .modal (Settings, Web research) by its header ── */
(function(){
  var drag = null;
  document.addEventListener('mousedown', function(e){
    var head = e.target.closest('.modal-head');
    if(!head) return;
    if(e.target.closest('button, a, input, select, textarea')) return;  /* ✕ stays clickable */
    var modal = head.closest('.modal');
    if(!modal) return;
    var r = modal.getBoundingClientRect();
    drag = { m: modal, dx: e.clientX - r.left, dy: e.clientY - r.top };
    modal.style.position  = 'fixed';
    modal.style.margin    = '0';
    modal.style.left      = r.left + 'px';
    modal.style.top       = r.top  + 'px';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });
  document.addEventListener('mousemove', function(e){
    if(!drag) return;
    var w = drag.m.offsetWidth, h = drag.m.offsetHeight;
    drag.m.style.left = Math.max(4, Math.min(window.innerWidth  - w - 4, e.clientX - drag.dx)) + 'px';
    drag.m.style.top  = Math.max(4, Math.min(window.innerHeight - h - 4, e.clientY - drag.dy)) + 'px';
  });
  document.addEventListener('mouseup', function(){
    if(!drag) return;
    drag = null;
    document.body.style.userSelect = '';
  });
})();

/* ══════════════════════════════════════════════════════════════
   MUSIC PLAYER — physically cut the playlist out into its own panel
   (video-style frame). Moves the real #mpPlaylist node, then deletes
   everything the old queue used to be inside #musicPanel.
   ══════════════════════════════════════════════════════════════ */
(function(){

  function makeBtn(act, icon, title){
    var b = document.createElement('button');
    b.className = 'mv-btn';
    b.dataset.act = act;
    b.title = title;
    b.innerHTML = '<i class="bi bi-' + icon + '"></i>';
    return b;
  }

  function cutMusicPlaylist(){
    var player = document.getElementById('musicPanel');
    var listEl = document.getElementById('mpPlaylist');
    if(!player || !listEl) return;

    /* 1 · the panel — reuse it if it exists, otherwise build a video-style one */
    var panel = document.getElementById('musicPlaylistPanel');
    if(!panel){
      panel = document.createElement('div');
      panel.className = 'panel-shell video-playlist-panel';   /* ← the video panel's own class */
      panel.id = 'musicPlaylistPanel';
      panel.hidden = true;
      panel.innerHTML =
        '<div class="panel-head" id="musicPlaylistHead">' +
          '<div class="vpl-title"><span>Playlist</span></div>' +
          '<div class="panel-head-actions">' +
            '<button class="v-close" data-act="mpl-close" title="Close">' +
              '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3L11 11M11 3L3 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>' +
            '</button>' +
          '</div>' +
        '</div>' +
        '<div class="vpl-pager">' +
          '<button class="mv-pager-btn" data-act="mp-prev-page" title="Previous" disabled><i class="bi bi-chevron-left"></i></button>' +
          '<span class="vpl-range" id="mpRange">1</span>' +
          '<button class="mv-pager-btn" data-act="mp-next-page" title="Next" disabled><i class="bi bi-chevron-right"></i></button>' +
        '</div>';
      document.body.appendChild(panel);
    }

    /* 2 · MOVE the song list into the panel (this is the cut) */
    if(!panel.contains(listEl)){
      listEl.className = '';                       /* strip .mv-playlist → no fixed height rules */
      panel.insertBefore(listEl, panel.querySelector('.vpl-pager'));
    }

    /* 3 · DELETE everything the playlist used to be inside the player */
    player.querySelectorAll('.mv-playlist-wrap, .mv-playlist-head, .mv-pager').forEach(function(el){
      if(el !== listEl && !el.contains(listEl)) el.remove();
    });

    /* 4 · controls: playlist button far left, shuffle moves beside loop */
    var left  = player.querySelector('.mv-controls-left');
    var right = player.querySelector('.mv-controls-right');
    if(left && !left.querySelector('[data-act="music-playlist"]')){
      var sh = left.querySelector('[data-act="mp-shuffle"]');
      left.innerHTML = '';
      left.appendChild(makeBtn('music-playlist', 'music-note-list', 'Playlist'));
      if(sh && right) right.insertBefore(sh, right.firstChild);
    }

    /* 5 · draggable by its header */
    var head = document.getElementById('musicPlaylistHead');
    if(head && head.dataset.dragWired !== '1'){
      head.dataset.dragWired = '1';
      setTimeout(function(){
        if(typeof initPanelDrag === 'function') initPanelDrag('musicPlaylistPanel', 'musicPlaylistHead');
      }, 30);
    }
  }

  window.cutMusicPlaylist = cutMusicPlaylist;

  /* click wiring — open, close, and close-with-the-player */
  document.addEventListener('click', function(e){
    /* The Playlist button in the bar does ONE thing: it opens the strip under
       the player (handled in the queue-strip block below). Clicking it twice
       used to alternate between the strip and the full playlist panel, which
       read as "the other playlist". The strip has its own expand button for
       the full floating playlist, so that branch is gone. */
    if(e.target.closest('[data-act="mpl-close"]')){
      e.preventDefault(); e.stopPropagation();
      var q = document.getElementById('musicPlaylistPanel'); if(q) q.hidden = true;
      return;
    }
    if(e.target.closest('[data-act="music-close"]')){
      setTimeout(function(){
        var r = document.getElementById('musicPlaylistPanel'); if(r) r.hidden = true;
      }, 0);
    }
  }, true);

  if(document.readyState === 'complete') setTimeout(cutMusicPlaylist, 200);
  window.addEventListener('load', function(){ setTimeout(cutMusicPlaylist, 200); });
})();

/* ══════════════════════════════════════════════════════════════
   QUEUE STRIPS — a one-row strip docked under the bottom bar of the
   music and video players. Five entries per page with prev / next
   chevrons. The Playlist button in each bar opens it; the expand
   button opens the full floating playlist.
   ══════════════════════════════════════════════════════════════ */
(function(){
  var PER_PAGE = 5;
  var page = { music: 0, video: 0 };

  var KINDS = {
    music: {
      stripId: 'mpStrip',
      rowId:   'mpStripRow',
      panelId: 'musicPlaylistPanel',
      icon:    'music-note-beamed',
      empty:   'No tracks yet',
      list:    function(){ return (window.Music && Array.isArray(Music.playlist)) ? Music.playlist : []; },
      bar:     function(){ return document.querySelector('#musicPanel .mv-controls'); },
      current: function(){ return (window.Music && Music.currentIndex >= 0) ? Music.currentIndex : -1; },
      play:    function(i){ if(typeof musicPlay === 'function') musicPlay(i); }
    },
    video: {
      stripId: 'vpStrip',
      rowId:   'vpStripRow',
      panelId: 'videoPlaylistPanel',
      icon:    'film',
      empty:   'No videos yet',
      list:    function(){ return S.config.videoPlaylist || []; },
      bar:     function(){ return document.getElementById('vpFloatBar'); },
      current: function(){ return (typeof videoCurrentPlaylistIndex === 'function') ? videoCurrentPlaylistIndex() : -1; },
      play:    function(i){ if(typeof playFromVideoPlaylist === 'function') playFromVideoPlaylist(i); }
    }
  };

  function navBtn(kind, act, icon, title){
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'queue-nav';
    b.title = title;
    b.setAttribute(act, kind);
    b.dataset[act.replace(/^data-/, '').replace(/-([a-z])/g, function(_, c){ return c.toUpperCase(); })] = kind;
    var i = document.createElement('i');
    i.className = 'bi bi-' + icon;
    b.appendChild(i);
    return b;
  }

   /* where each floating strip sits — remembered between sessions */
  function stripPos(kind){
    if(!S.config.stripPos || typeof S.config.stripPos !== 'object') S.config.stripPos = {};
    var p = S.config.stripPos[kind];
    if(!p || typeof p !== 'object') p = S.config.stripPos[kind] = { x:null, y:null, manual:false };
    if(p.x === undefined) p.x = null;
    if(p.y === undefined) p.y = null;
    if(typeof p.manual !== 'boolean') p.manual = false;
    return p;
  }

  function barOf(kind){ var k = KINDS[kind]; return k ? k.bar() : null; }

  /* Home: the bar's exact length, floating a small gap BELOW it (not glued).
     A strip you dragged keeps its POSITION but always the bar's LENGTH — the
     width is written with priority so nothing else can shrink it. */
  function dockStrip(kind){
    var k = KINDS[kind];
    var strip = document.getElementById(k.stripId);
    if(!strip || strip.hidden) return;
    var bar = barOf(kind);
    if(!bar) return;
    var r = bar.getBoundingClientRect();
    if(!r.width) return;
    var vw = window.innerWidth, vh = window.innerHeight, pad = 8;

    if(stripPos(kind).manual){
      /* you placed it — only the LENGTH follows the bar */
      var w = Math.round(Math.min(r.width, vw - 24));
      try{
        strip.style.setProperty('box-sizing', 'border-box', 'important');
        strip.style.setProperty('width', w + 'px', 'important');
        strip.style.setProperty('min-width', '0', 'important');
        strip.style.setProperty('max-width', 'none', 'important');
      }catch(e){ strip.style.width = w + 'px'; }
      strip.style.right = 'auto';
      placeStrip(kind);
      return;
    }

    /* Docked: pin BOTH edges to the bar's, so the length is the bar's exactly —
       no width rule, no box-sizing, nothing in a stylesheet can shrink it. */
    var left  = Math.max(pad, Math.min(Math.round(r.left), vw - 140));
    var right = Math.max(pad, Math.min(Math.round(vw - r.right), vw - left - 140));
    try{
      strip.style.setProperty('box-sizing', 'border-box', 'important');
      strip.style.setProperty('width', 'auto', 'important');
      strip.style.setProperty('max-width', 'none', 'important');
      strip.style.setProperty('left', left + 'px', 'important');
      strip.style.setProperty('right', right + 'px', 'important');
    }catch(e){
      strip.style.boxSizing = 'border-box';
      strip.style.width = 'auto';
      strip.style.left = left + 'px';
      strip.style.right = right + 'px';
    }
    strip.style.top = Math.round(Math.min(r.bottom + 8, vh - 60)) + 'px';
  }

  function placeStrip(kind){
    var k = KINDS[kind];
    var strip = document.getElementById(k.stripId);
    if(!strip || strip.hidden) return;
    var p = stripPos(kind);
    if(!p.manual){ dockStrip(kind); return; }
    var vw = window.innerWidth, vh = window.innerHeight;
    var w = strip.offsetWidth  || Math.min(600, vw - 24);
    var h = strip.offsetHeight || 48;
    p.x = Math.max(8, Math.min(p.x, vw - w - 8));
    p.y = Math.max(52, Math.min(p.y, vh - h - 8));
    strip.style.left = p.x + 'px';
    strip.style.top  = p.y + 'px';
  }

  /* hand-placed → stop following; double-click the grip → snap back */
  function reattachStrip(kind){
    var p = stripPos(kind);
    p.manual = false; p.x = null; p.y = null;
    var s = document.getElementById(KINDS[kind].stripId);
    if(s){
      ['width','left','right','min-width','max-width'].forEach(function(k){
        try{ s.style.removeProperty(k); }catch(e){}
      });
    }
    dockStrip(kind); save();
  }

  /* Not glued to the player, but travelling with it: whenever the bar moves,
     the strip re-docks to the bar's new position at the bar's exact length. */
  (function followPlayer(){
    var last = {};
    /* only one of these loops should ever be live, and only while a strip is
       actually floating — panes and the overlay never need one */
    function anyFloating(){
      return ['music','video'].some(function(kind){
        var s = document.getElementById(KINDS[kind].stripId);
        return !!(s && !s.hidden && !stripPos(kind).manual);
      });
    }
    function tick(){
      if(document.hidden || !anyFloating()){ setTimeout(tick, 350); return; }
      ['music','video'].forEach(function(kind){
        var s = document.getElementById(KINDS[kind].stripId);
        if(!s || s.hidden) return;
        var bar = barOf(kind);
        if(!bar) return;
        var r = bar.getBoundingClientRect();
        if(!r.width) return;
        var l = last[kind];
        /* a dragged strip keeps its place but must still match the bar's length */
        if(!l || l.l !== r.left || l.t !== r.top || l.w !== r.width || l.b !== r.bottom){
          last[kind] = { l:r.left, t:r.top, w:r.width, b:r.bottom };
          dockStrip(kind);
        }
      });
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    /* a window change moves the bar — re-dock every strip that is floating */
    window.addEventListener('resize', function(){
      last = {};
      ['music','video'].forEach(function(kind){
        if(document.getElementById(KINDS[kind].stripId)) dockStrip(kind);
      });
    });
  })();



  /* drag the strip anywhere — the buttons inside it stay clickable */
  function wireStripDrag(strip, kind){
    if(strip.dataset.dragWired === '1') return;
    strip.dataset.dragWired = '1';
    var drag = null;
    strip.addEventListener('mousedown', function(e){
      if(e.target.closest('button')) return;
      var r = strip.getBoundingClientRect();
      drag = { dx: e.clientX - r.left, dy: e.clientY - r.top };
      document.body.style.userSelect = 'none';
      e.preventDefault();
    });
    document.addEventListener('mousemove', function(e){
      if(!drag) return;
      var p = stripPos(kind);
      p.manual = true;
      p.x = e.clientX - drag.dx;
      p.y = e.clientY - drag.dy;
      placeStrip(kind);
    });
    document.addEventListener('mouseup', function(){
      if(!drag) return;
      drag = null;
      document.body.style.userSelect = '';
      /* wherever you drop it, it keeps the bottom bar's exact length */
      var bar = barOf(kind);
      if(bar){
        var r = bar.getBoundingClientRect(), vw = window.innerWidth;
        var w = Math.round(Math.min(r.width, vw - 24));
        if(w){
          try{
            strip.style.setProperty('width', w + 'px', 'important');
            strip.style.setProperty('right', 'auto', 'important');
          }catch(err){ strip.style.width = w + 'px'; strip.style.right = 'auto'; }
          var pp = stripPos(kind);
          pp.x = Math.max(8, Math.min(pp.x, vw - w - 8));
          placeStrip(kind);
        }
      }
      save();
    });
    strip.addEventListener('dblclick', function(e){
      if(e.target.closest('.queue-grab')) reattachStrip(kind);
    });
  }

  /* build the strip once. It floats on its own — separated from the player,
     themed like the rest of the app, and free to be dragged anywhere. */
  function ensure(kind){
    var k = KINDS[kind];
    var strip = document.getElementById(k.stripId);
    if(strip) return strip;
    if(!k.bar()) return null;

    strip = document.createElement('div');
    strip.className = 'queue-strip queue-float';
    strip.id = k.stripId;
    strip.hidden = true;
    /* inline, so no stylesheet can change how the width is measured */
    strip.style.boxSizing = 'border-box';
    strip.style.margin = '0';

    var grab   = document.createElement('span');
    grab.className = 'queue-grab';
    grab.title = 'Drag to move';
    grab.innerHTML = '<i class="bi bi-grip-vertical"></i>';

    var prev   = navBtn(kind, 'data-strip-prev', 'chevron-left', 'Previous');
    var row    = document.createElement('div');
    row.className = 'queue-row';
    row.id = k.rowId;
    var next   = navBtn(kind, 'data-strip-next', 'chevron-right', 'Next');
    var expand = navBtn(kind, 'data-strip-expand', 'arrows-angle-expand', 'Full playlist');
    expand.className = 'queue-nav queue-expand';

    strip.appendChild(grab);
    strip.appendChild(prev);
    strip.appendChild(row);
    strip.appendChild(next);
    strip.appendChild(expand);

    document.body.appendChild(strip);
    wireStripDrag(strip, kind);
    return strip;
  }

  function render(kind){
    var k = KINDS[kind];
    var strip = ensure(kind);
    if(!strip) return;
    var row = document.getElementById(k.rowId);
    if(!row) return;

    var list  = k.list();
    var total = list.length;
    var pages = Math.max(1, Math.ceil(total / PER_PAGE));
    if(page[kind] > pages - 1) page[kind] = pages - 1;
    if(page[kind] < 0) page[kind] = 0;

    var start = page[kind] * PER_PAGE;
    var cur = k.current();

    while(row.children.length) row.removeChild(row.children[0]);

    for(var i = 0; i < PER_PAGE; i++){
      var idx = start + i;
      var t = list[idx];
      var cell = document.createElement(t ? 'button' : 'div');
      cell.className = 'queue-item';

      if(!t){
        cell.className += ' is-empty';
        if(!total && idx === 0) cell.textContent = k.empty;
        row.appendChild(cell);
        continue;
      }

      var label = t.name || 'Untitled';
      if(idx === cur) cell.className += ' active';
      cell.type = 'button';
      cell.title = label;
      cell.dataset.stripPlay = kind;
      cell.dataset.stripIndex = idx;

      var ic = document.createElement('i');
      ic.className = 'bi bi-' + k.icon;
      var nm = document.createElement('span');
      nm.className = 'queue-item-name';
      nm.textContent = label;

      cell.appendChild(ic);
      cell.appendChild(nm);
      row.appendChild(cell);
    }

    var prev = strip.querySelector('[data-strip-prev]');
    var next = strip.querySelector('[data-strip-next]');
    if(prev) prev.disabled = (page[kind] <= 0);
    if(next) next.disabled = (page[kind] >= pages - 1);
  }

  function open(kind, force){
    var k = KINDS[kind];
    var strip = ensure(kind);
    if(!strip || !k) return;
    var show = (force === undefined) ? strip.hidden : !!force;
    strip.hidden = !show;
    var panel = document.getElementById(k.panelId);
    if(show && panel) panel.hidden = true;
    if(show){ render(kind); placeStrip(kind); }
  }

  function step(kind, delta){
    var k = KINDS[kind];
    if(!k) return;
    var pages = Math.max(1, Math.ceil(k.list().length / PER_PAGE));
    page[kind] = Math.min(pages - 1, Math.max(0, page[kind] + delta));
    render(kind);
  }

  window.renderQueueStrips = function(){ render('music'); render('video'); };

  document.addEventListener('click', function(e){
    /* closing a player takes its floating strip with it */
    var closing = e.target.closest('[data-act="music-close"]') ? 'mpStrip'
                : e.target.closest('[data-act="video-close"]') ? 'vpStrip' : null;
    if(closing){
      setTimeout(function(){ var s = document.getElementById(closing); if(s) s.hidden = true; }, 0);
      return;
    }

    var prev = e.target.closest('[data-strip-prev]');
    if(prev){ e.preventDefault(); e.stopPropagation(); step(prev.dataset.stripPrev, -1); return; }

    var next = e.target.closest('[data-strip-next]');
    if(next){ e.preventDefault(); e.stopPropagation(); step(next.dataset.stripNext, 1); return; }

    var ex = e.target.closest('[data-strip-expand]');
    if(ex){
      e.preventDefault(); e.stopPropagation();
      var kind = ex.dataset.stripExpand;
      var k = KINDS[kind];
      var strip = document.getElementById(k.stripId);
      if(strip) strip.hidden = true;
      if(kind === 'video' && typeof openVideoPlaylist === 'function'){ openVideoPlaylist(); return; }
      var panel = document.getElementById(k.panelId);
      if(panel){
        panel.hidden = false;
        if(kind === 'music' && typeof renderMusicPlayer === 'function') renderMusicPlayer();
      }
      return;
    }

    var item = e.target.closest('[data-strip-play]');
    if(item){
      e.preventDefault(); e.stopPropagation();
      var who = item.dataset.stripPlay;
      KINDS[who].play(parseInt(item.dataset.stripIndex, 10));
      render(who);
      return;
    }

    if(e.target.closest('[data-act="music-playlist"]')){
      e.preventDefault(); e.stopPropagation(); open('music'); return;
    }
    if(e.target.closest('[data-act="video-playlist"]')){
      e.preventDefault(); e.stopPropagation(); open('video'); return;
    }
  }, true);

  /* keep the highlight in step with what is actually playing */
  function wireAudio(){
    var a = window.Music && Music.audio;
    if(!a || a.dataset.queueWired === '1') return;
    a.dataset.queueWired = '1';
    ['play', 'pause', 'ended'].forEach(function(ev){
      a.addEventListener(ev, function(){
        var strip = document.getElementById('mpStrip');
        if(strip && !strip.hidden) render('music');
      });
    });
  }

  function boot(){
    ensure('music');
    ensure('video');
    wireAudio();
  }

  if(document.readyState === 'complete') setTimeout(boot, 300);
  window.addEventListener('load', function(){ setTimeout(boot, 300); });

  window.addEventListener('resize', function(){
    ['music', 'video'].forEach(function(k){
      var s = document.getElementById(KINDS[k].stripId);
      if(s && !s.hidden) placeStrip(k);
    });
  });
})();
