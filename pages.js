console.log("MARK 91");


/* ═══════════════════════════════════════════════════════════
   ScriptForge — Pages
   Router · Modes panel · Pages overlay · All page renderers
   ═══════════════════════════════════════════════════════════ */

// ═══════════════════════════════════════════════════════════
//   MODES PANEL (left, portrait, opens via logo)
// ═══════════════════════════════════════════════════════════

function renderModesPanel(){
  let panel = $('modesPanel');
  if(!panel){
    panel = document.createElement('div');
    panel.className = 'modes-panel';
    panel.id = 'modesPanel';
    document.body.appendChild(panel);
  }
  panel.innerHTML = `
    <div class="modes-head">
  <span>Modes</span>
</div>
    <div class="modes-list" id="modesList"></div>
  `;
  const list = $('modesList');
  MODES.forEach(m => {
    const item = document.createElement('div');
    item.className = 'mode-item' + (m.id === S.mode ? ' active' : '');
    item.dataset.modeSwitch = m.id;
    const data = S.modes[m.id];
    const count = data ? flatChs(data.chapters).length : 0;
    item.innerHTML = `
      <i class="bi bi-${m.icon}"></i>
      <span>${m.name}</span>
      ${count > 0 ? `<span class="mode-badge">${count}</span>` : ''}
    `;
    list.appendChild(item);
  });
}

function toggleModesPanel(force){
  const panel = $('modesPanel');
  if(!panel) return;
  const open = force !== undefined ? force : !panel.classList.contains('open');
  panel.classList.toggle('open', open);
}

// ═══════════════════════════════════════════════════════════
//   PAGES OVERLAY (right, landscape, covers editor)
// ═══════════════════════════════════════════════════════════

function renderPagesOverlay(){
  let overlay = $('pagesOverlay');
  if(!overlay){
    overlay = document.createElement('div');
    overlay.className = 'pages-overlay';
    overlay.id = 'pagesOverlay';
    document.body.appendChild(overlay);
  }

  const mode = currentMode();
  if(!mode) return;

  const d = D();
  const categories = mode.categories || [];
  // No category tiles anymore — the panel always works in this mode's
  // category (Fiction), so default to it instead of waiting for a pick.
  const selectedCat = d.currentCategory || (categories[0] && categories[0].id) || null;
  if(selectedCat && d.currentCategory !== selectedCat) d.currentCategory = selectedCat;

  overlay.innerHTML = `
    <div class="pages-body">
      <div class="pages-grid-wrap">
        <div class="cat-row">
          <div class="cat-stats" id="catStats"></div>
        </div>
      </div>
      <div class="pages-divider"></div>
      <div class="projects-wrap">
        <div class="proj-list-head">
          <div class="pages-grid-label">
            <i class="bi bi-clock-history"></i> Recent projects
          </div>
          ${selectedCat ? `
          <button data-proj-open-sel title="Open the project selected in the list below">
            <i class="bi bi-folder2-open"></i> Open project
          </button>
          <button data-cat-new="${selectedCat}" title="New project">
            <i class="bi bi-plus-lg"></i> New project
          </button>` : ''}
        </div>
        <div id="projList"></div>
      </div>
    </div>
  `;

  renderProjectStatsPanel();

  renderProjectsForCategory(selectedCat);
}

// The project whose stats are shown beside the category cards. This is a
// session-only selection — it is deliberately not saved, so the card starts
// empty instead of showing some project from a previous session.
let statsProjectId = null;

function setStatsProject(pid){
  statsProjectId = pid || null;
}

function getStatsProject(){
  return statsProjectId;
}

// Stats panel sitting in the empty space to the right of the category cards.
// It shows the project currently selected in the list below.
function renderProjectStatsPanel(){
  const panel = $('catStats');
  if(!panel) return;

  const d = D();
  const pid = statsProjectId;
  const proj = pid ? (d.projects || []).find(x => x.id === pid) : null;

  if(!proj){
    panel.innerHTML =
      '<div class="cat-stats-half"><div class="cat-stats-head"><i class="bi bi-bar-chart"></i> Project stats</div>' +
      '<div class="cat-stats-empty">Click a project to see its stats.</div></div>' +
      '<div class="cat-stats-half cat-stats-half-b"><div class="cat-stats-head"><i class="bi bi-hdd-stack"></i> Progress</div>' +
      '<div class="cat-stats-empty">—</div></div>';
    return;
  }

  const chs = proj.chapters || [];
  const chCount  = chs.length;
  const subCount = chs.reduce((a, c) => a + ((c.children || []).length), 0);
  const words = chs.reduce((a, c) => a + wordCount(c.content), 0)
    + chs.reduce((a, c) => a + (c.children || []).reduce((b, x) => b + wordCount(x.content), 0), 0);

  const dt = v => new Date(v).toLocaleDateString('en-US', {year:'numeric', month:'long', day:'numeric'});
  const created = dt(proj.created);
  const upd     = dt(proj.updated || proj.created);

  /* units come from the PROJECT's mode (never the mode you're browsing in) */
  const L = (typeof CH_LABELS !== 'undefined' && CH_LABELS[proj.mode]) || { ch:'Chapter', sub:'Subchapter' };

  panel.innerHTML = `
    <div class="cat-stats-half">
      <div class="cat-stats-head"><i class="bi bi-bar-chart"></i> Project stats</div>
      <div class="cat-dates">
        <div class="cat-stat">
          <div class="cat-stat-val-sm">${created}</div>
          <div class="cat-stat-lbl">Created</div>
        </div>
        <div class="cat-stat cat-stat-right">
          <div class="cat-stat-val-sm">${upd}</div>
          <div class="cat-stat-lbl">Updated</div>
        </div>
      </div>
    </div>
    <div class="cat-stats-half cat-stats-half-b">
      <div class="cat-stats-head"><i class="bi bi-hdd-stack"></i> Progress</div>
      <div class="cat-dates">
        <div class="cat-stat">
          <div class="cat-stat-lbl">${L.ch}</div>
          <div class="cat-stat-val">${chCount}</div>
        </div>
        <div class="cat-stat cat-stat-right">
          <div class="cat-stat-lbl">${L.sub}</div>
          <div class="cat-stat-val">${subCount}</div>
        </div>
      </div>
    </div>`;
}


function getCatName(catId){
  const m = currentMode();
  const c = m?.categories?.find(x => x.id === catId);
  return c ? c.name : catId;
}

/* ── pinned recent projects — a session-transcending list of ids ── */
function pinnedProjects(){
  if(!Array.isArray(S.config.pinnedProjects)) S.config.pinnedProjects = [];
  return S.config.pinnedProjects;
}
function togglePinnedProject(pid){
  if(!pid) return;
  const pins = pinnedProjects();
  const i = pins.indexOf(pid);
  if(i >= 0){ pins.splice(i, 1); toast('Unpinned'); }
  else { pins.unshift(pid); toast('Pinned to the top'); }
  if(typeof save === 'function') save();
}
window.pinnedProjects = pinnedProjects;
window.togglePinnedProject = togglePinnedProject;

function renderProjectsForCategory(catId){
  const list = $('projList');
  if(!list) return;
  // Paint the stats card first so it stays in sync even when this list ends up
  // empty (deleted last project) and returns early below.
  renderProjectStatsPanel();
  if(!catId){
    list.innerHTML = `<div class="pages-empty" style="padding:24px;">Select a category above to see its projects.</div>`;
    return;
  }
  const d = D();
  /* pinned projects float to the top of the recents list */
  const pins = pinnedProjects();
  const projs = (d.projects || []).filter(p => p.category === catId).sort(function(a, b){
    const pa = pins.indexOf(a.id) >= 0 ? 0 : 1, pb = pins.indexOf(b.id) >= 0 ? 0 : 1;
    if(pa !== pb) return pa - pb;
    return (b.created || 0) - (a.created || 0);
  }).slice(0, 10);
  if(!projs.length){
    list.innerHTML = `<div class="pages-empty" style="padding:24px;">No projects in ${esc(getCatName(catId))} yet.</div>`;
    return;
  }
  list.innerHTML = '';
  projs.forEach(p => {
    // The stats panel on the right mirrors the selected project, so the row
    // just needs to show which one that is (double-click opens it).
    const selected = statsProjectId === p.id;
    const pinned = pins.indexOf(p.id) >= 0;

    const item = document.createElement('div');
    item.className = 'proj-item-wrap';
    item.innerHTML = `
      <div class="proj-row${selected ? ' active' : ''}">
        <div class="proj-item" data-proj-toggle="${p.id}">
          <div class="proj-icon"><i class="bi bi-folder-fill"></i></div>
          <div class="proj-body">
            <div class="proj-name">${esc(p.name)}</div>
            ${p._importSource === 'external' || p._importSource === 'internal'
              ? `<div class="proj-source">${p._importSource === 'external' ? 'External' : 'Internal'}</div>`
              : ''}
          </div>
        </div>
        <div class="proj-actions">
          <button class="proj-btn${pinned ? ' on' : ''}" data-proj-pin="${p.id}" title="${pinned ? 'Unpin' : 'Pin to the top'}">
            <i class="bi bi-pin-angle${pinned ? '-fill' : ''}"></i>
          </button>
          <button class="proj-btn" data-proj-rename="${p.id}" title="Rename">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="proj-btn" data-proj-del="${p.id}" title="Delete">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 2L8 8M8 2L2 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    `;
    list.appendChild(item);
  });
}
function togglePagesOverlay(force){
  const overlay = $('pagesOverlay');
  if(!overlay) return;
  const open = force !== undefined ? force : !overlay.classList.contains('open');
  if(open) renderPagesOverlay();
  overlay.classList.toggle('open', open);
}

// ═══════════════════════════════════════════════════════════
//   ROUTER — goPage
// ═══════════════════════════════════════════════════════════

function goPage(id){
  // Allow universal pages (home, overview, stats, reader)
  const universalPages = ['home', 'overview', 'stats', 'reader'];
  if(!universalPages.includes(id) && !modePages().includes(id)){
    toast('Page not available in this mode', 'warn');
    return;
  }

  // Topbar actions (Music + Settings) — only on home
  const actions = document.getElementById('topbarActions');
  if(actions) actions.hidden = (id !== 'home');

  // Mode pills — only on home
  const pills = document.getElementById('modePills');
        if(pills) pills.style.display = (id === 'home') ? '' : 'none';   /* the dashboard keeps its pills, everywhere */


  S.page = id;
          // Status bar & FAB visibility
  const isDashboard = (id === 'home' || id === 'stats' || id === 'overview');
  const statusEl = document.getElementById('statusbar');
  if(statusEl) statusEl.hidden = isDashboard;
  const fabEl = document.getElementById('fabWrap');
  if(fabEl) fabEl.style.display = isDashboard ? 'none' : '';
    // Import button — only on Dashboard
      const impEl = document.getElementById('floatingImport');
    if(impEl) impEl.style.display = (id === 'home') ? '' : 'none';



  const stage = $('stage');
  if(!stage) return;
  stage.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'page active';
  wrap.id = 'page-' + id;
  stage.appendChild(wrap);

  const renderer = PAGE_RENDERERS[id];
  if(renderer){
    try{ renderer(wrap); }
    catch(e){ console.error('Renderer failed', id, e); wrap.innerHTML = `<div class="pages-empty">Failed to render ${id}.</div>`; }
  } else {
    // Generic placeholder for pages that only exist in menus
    wrap.innerHTML = `<div class="pages-empty"><i class="bi bi-${(PAGE_META[id]?.icon) || 'file'}"></i>${(window.pname ? pname(id) : (PAGE_META[id]?.name)) || id}<br><span class="tiny">Coming soon</span></div>`;
  }

  if(typeof renderMusicMini === 'function') renderMusicMini();
  if(typeof renderModePills === 'function') renderModePills();
  updateBreadcrumb();
  updateStatusBar();
  save();

  // Inside an overlay pane, keep the parent's Back / Forward in step.
  // SF_NAV_READY is only set once booting is done, so the pane's initial
  // page loads never reach the parent — only real navigation does.
  if(window.SF_VIEW === true && window.SF_NAV_READY && window.parent && window.parent !== window){
    try{ window.parent.postMessage({ sf:'nav', page:id }, location.origin); }catch(e){}
  }
}

// ═══════════════════════════════════════════════════════════
//   BREADCRUMB
// ═══════════════════════════════════════════════════════════

function renderModePills(){
  const el = $('modePills');
  if(!el) return;
  el.innerHTML = '';

  // Plain pills — one per mode, active highlighted, slide-in on switch.
  const idx = Math.max(0, MODES.findIndex(m => m.id === S.mode));
  const cur = MODES[idx];
  if(!cur) return;

  MODES.forEach(function(m){
    const btn = document.createElement('button');
    btn.className = 'mode-pill' + (m.id === S.mode ? ' active' : '');
    btn.dataset.modePill = m.id;
    btn.innerHTML = `<i class="bi bi-${m.icon}"></i> ${m.name}`;

    // Slide-in when the mode changed since last render — forward (next)
    // slides from the right, backward (prev) from the left.
    if(m.id === S.mode &&
       typeof window._lastPillMode !== 'undefined' && window._lastPillMode &&
       window._lastPillMode !== m.id){
      btn.classList.add(window._lastPillIdx < idx ? 'slide-from-left' : 'slide-from-right');
    }
    el.appendChild(btn);
  });
  window._lastPillMode = cur.id;
  window._lastPillIdx = idx;
}

function updateBreadcrumb(){
  const el = $('breadcrumb');
  if(!el) return;
  const L = { home:'Dashboard', overview:'Manager', stats:'Statistics', import:'Import' };
  el.innerHTML = S.page === 'home'
    ? '<span class="crumb current">Dashboard</span>'
    : '<span class="crumb">Dashboard</span><span class="sep">›</span>' +
      '<span class="crumb current">' + (L[S.page] || pname(S.page)) + '</span>';
}

// ═══════════════════════════════════════════════════════════
//   STATUS BAR
// ═══════════════════════════════════════════════════════════

function updateStatusBar(){
  const sb = $('statusbar');
  if(!sb) return;

  // Hide on dashboard and statistics
  const hiddenPages = ['home', 'stats', 'overview'];
  const shouldHide = hiddenPages.includes(S.page);

  if(shouldHide){
    sb.hidden = true;
    document.body.classList.add('statusbar-hidden');
    return;
  }

  sb.hidden = false;
  document.body.classList.remove('statusbar-hidden');

  const left = $('sbLeft');
  const right = $('sbRight');
  if(!left || !right) return;

  const m = currentMode();
  const ed = $('editor');
  const text = ed ? ed.innerText : '';
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  const total = totalWords();

    left.innerHTML = '';
  right.innerHTML = '';

}

// ═══════════════════════════════════════════════════════════
//   PAGE RENDERERS
// ═══════════════════════════════════════════════════════════

const PAGE_RENDERERS = {};

// ─── HOME ───
PAGE_RENDERERS.home = function(root){
  const d = D();
  const mode = currentMode() || MODES[0];
  const words = (typeof totalWords === 'function') ? totalWords() : 0;
  const chapters = d.chapters ? flatChs(d.chapters).length : 0;
  const projects = d.projects ? d.projects.length : 0;
  const today = new Date().toLocaleDateString('en-US', {weekday:'long', month:'long', day:'numeric'});

  root.innerHTML = `
    <div style="padding:60px 40px;max-width:900px;margin:0 auto;">

            <div style="margin-bottom:48px;text-align:center;">
        <h1 style="font-family:var(--display);font-size:32px;font-weight:700;letter-spacing:-.03em;">
          Welcome back
        </h1>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;max-width:640px;margin:0 auto;">
                <button class="home-tile-big" data-act="go-overview">
          <i class="bi bi-grid-1x2"></i>
          <div>
            <div class="home-tile-big-title">Manager</div>
          </div>
        </button>
        <button class="home-tile-big" data-act="go-stats">
          <i class="bi bi-graph-up-arrow"></i>
          <div>
            <div class="home-tile-big-title">Statistics</div>
          </div>
        </button>
      </div>

    </div>

    <style>
      .home-tile-big{
  position:relative;
  display:flex;
  align-items:center;
  justify-content:center;
  gap:14px;
  padding:32px 24px;
  text-align:left;
  background:var(--surface-2);
  border:1px solid var(--line);
  border-radius:var(--r-lg);
  cursor:pointer;
  transition:all var(--t-fast) var(--ease);
  min-height:120px;
}
      .home-tile-big:hover{
  border-color:var(--line-3);
  background:var(--surface-3);
}
      .home-tile-big i{
  font-size:28px;
  color:var(--ink-2);
  flex-shrink:0;
}
      .home-tile-big-title{
  font-size:15px;
  font-weight:600;
  color:var(--ink);
  letter-spacing:-.01em;
}
    </style>
  `;
};

/* ═══ OVERVIEW — a card-by-card guide to what makes this app different:
   every original feature, what it is, and exactly how to use it. ═══ */
const OV_FEATURES = [
  {
    icon:'journal-bookmark', tag:'Story bible', title:'The Bible',
    what:'A living reference for every name, place, item, event and beat in the project — kept beside the draft instead of in a separate document.',
    how:['Open the FAB → <b>Bible</b> (or Pages → Bible).',
         'Pick a category in the top bar — Characters, Locations, Items, Events, Organizations, Concepts, Timeline.',
         'The list is on the left, the big working panel on the right. Type and it saves as you go.',
         'Press <b>+</b> in the panel to add an entry, or the <b>Aa</b> button to set that page’s type.'],
    go:'bible', cta:'Open the Bible'
  },
  {
    icon:'columns-gap', tag:'Split screen', title:'Two halves, two minds',
    what:'Split screen where each half keeps its <b>own</b> chapter/subchapter and its own font, size and formatting — so you can hold a scene next to the chapter it belongs to.',
    how:['Manuscript → the split icon in the chapter bar.',
         'Click the left half, set its font/size/chapter. Click the right half, set a different one.',
         'Only the chapter and subchapter differ; every formatting action applies to the half you last clicked.'],
    go:'manuscript', cta:'Try split screen'
  },
  {
    icon:'translate', tag:'Languages', title:'Hinglish ⇄ Hindi ⇄ English',
    what:'Write Hinglish and convert it to Devanagari Hindi or clean English, from the right-click options on any selection — not a separate translator app.',
    how:['Select text in the editor.',
         'Right-click → the Google-translate-style panel opens with the language list.',
         'Choose <b>Hindi</b>, <b>English</b> or any of the languages, then <b>Replace</b> or <b>Append</b>.',
         'Turned on/off in Settings → Typography → Intermixed fonts and Settings → AI Assistance → Assistant actions.'],
    go:'write', cta:'Open the editor'
  },
  {
    icon:'fonts', tag:'Typography', title:'Three fonts, mixed live',
    what:'A rotation of three fonts that can drop in per letter, per word or per sentence while you type — plus a per-page type panel for Outline, Kanban and Bible.',
    how:['Settings → Typography → Intermixed fonts, then pick the three faces.',
         'Choose the scope: letter, word or sentence.',
         'Click a Font chip (1, 2, 3) then type — that font is used for what you write next.',
         'The <b>Aa</b> button on Outline, Kanban and Bible sets that page’s font, size, leading and weight.'],
    openSettings:'typography', cta:'Open Typography'
  },
  {
    icon:'layout-split', tag:'Overlay', title:'The overlay screen',
    what:'A floating window over the whole app with the dashboard, statistics, reader and pages inside it — for a second look without losing where you are.',
    how:['Appearance → Interface → Overlay screen, then the overlay icon appears in the chapter bar.',
         'It opens on the <b>dashboard</b> every time.',
         'Drag it by the corner grip, resize it from the right rail, and switch Novel/Screenplay for that pane only.'],
    openSettings:'appearance', cta:'Turn it on'
  },
  {
    icon:'graph-up-arrow', tag:'Statistics', title:'The day rail',
    what:'A single unbroken line that runs through every day you actually opened the app — and breaks on the days you did not. Gaps are the honest record.',
    how:['Statistics → the rail at the bottom.',
         'An unbroken run means you wrote on those days; a break means you did not.',
         'Nothing to configure — it logs itself the first time you open the app each day.'],
    go:'stats', cta:'See the rail'
  },
  {
    icon:'list-nested', tag:'Structure', title:'Outline with descriptions',
    what:'The only place chapters and subchapters are created, renamed and deleted — a real tree, with a description box for every section.',
    how:['FAB → <b>Outline</b>.',
         'The chapter bar in the writer keeps just the two dropdowns now; structure lives here.',
         '<b>New chapter</b> / <b>New subchapter</b> in the head, or <b>+</b> on a row.',
         'Click the card icon on a row to open its description box and type what happens in it.'],
    go:'outline', cta:'Open the Outline'
  },
  {
    icon:'kanban', tag:'Planning', title:'Kanban with your own lists',
    what:'A production board of your sections that you can extend — the four defaults (Planning, Drafting, Revised, Final) plus any lists your process needs.',
    how:['FAB → <b>Kanban</b>.',
         '<b>New list</b> in the head, or the ghost column at the end of the board.',
         'Drag cards between lists; rename any list with the pencil, remove your own with the ✕.'],
    go:'kanban', cta:'Open the board'
  },
  {
    icon:'music-note-beamed', tag:'Players', title:'Mini players in the chapter bar',
    what:'Music and video as icons that open small popups — never a panel that hijacks the screen — each with transport, a seek bar and the playlist strip.',
    how:['Look for the ♪ and film icons in the chapter bar.',
         'Click one to open its popup: prev · play/pause · next, the clock, a clickable seek bar, and the playlist (click any row to jump).',
         'The icons tint while that player is running; the popups drag anywhere and remember where you left them.'],
    go:'write', cta:'Open the chapter bar'
  },
  {
    icon:'text-paragraph', tag:'Research', title:'Text & image search inside the app',
    what:'The web and image results open in their own panel — you never lose the page you were writing on, and no browser tab is opened.',
    how:['The paragraph icon and the images icon in the chapter bar.',
         'Type a query — results load in the panel; click one to read it inside the app.',
         'Both panels are compact and draggable.'],
    go:'write', cta:'Search something'
  },
  {
    icon:'cloud-arrow-up', tag:'Publishing', title:'Publishing that is real',
    what:'Metadata, structure, publish checks, a proper EPUB 3 file and a hosted read link — the whole path from draft to reader.',
    how:['Book page → the delivery icon (or the Publish panel in the head).',
         '<b>Metadata</b>: title, subtitle, author, series, ISBN, language, blurb, word target.',
         '<b>Structure</b>: chapter numbering, dedication, acknowledgements, read next.',
         '<b>Checks</b>: words vs target, scene numbering, speakers not in your cast, POV and tense mixing.',
         '<b>Delivery</b>: download the EPUB or copy the hosted read link, and drag the panel by its header.'],
    go:'notebook', cta:'Open a book'
  },
  {
    icon:'stars', tag:'Writing', title:'Keyboard-first formatting',
    what:'Screenplay and novel element sets applied from the keyboard, plus an advanced panel for the things a toolbar should not hold.',
    how:['<b>Shift + @</b> — the element menu (scene heading, action, character, dialogue… / paragraph, headings, quote…). Arrow keys and Enter work; Shift + @ again closes it.',
         '<b>⌘/Ctrl + 1…6</b> — set the element outright; <b>Tab</b> cycles, <b>Enter</b> advances.',
         '<b>Shift + /</b> — advanced formatting: typeface, case, drop caps, scene breaks, page breaks.'],
    go:'write', cta:'Try the shortcuts'
  },
  {
    icon:'book-half', tag:'Reading', title:'Book panel with a real reader',
    what:'Your chapters as a tree on the left, and on the right the same draft page you write on — with edit options for online publishing.',
    how:['Book page → pick a book, then a chapter or subchapter.',
         'Right-click a chapter to expand its subchapters in tree style.',
         'The pencil toggles editing; the globe marks it ready — the blue state means the chapter is publishing-ready.'],
    go:'notebook', cta:'Open a book'
  },
  {
    icon:'search', tag:'Lookup', title:'Utilities, notes and dictionary',
    what:'A clock, calendar, calculator, unit converter, dictionary and thesaurus in one panel — plus a notes scratchpad that floats over everything.',
    how:['The grid icon and the sticky icon in the chapter bar.',
         'Utilities → Dictionary to look a word up; Merriam-Webster answers when a key is set, with the open dictionary as the fallback.',
         'Notes is a scratchpad you can keep open while writing.'],
    go:'write', cta:'Open Utilities'
  }
];

/* ═══ MANAGER — Vercel-style media manager ═══ */
let mmTab = 'all';          // 'all' | 'video' | 'music' — survives re-render

PAGE_RENDERERS.overview = function(root){
  const vids  = S.config.videoPlaylist || [];
  const mus   = S.config.musicPlaylist  || [];
  const total = vids.length + mus.length;

  function card(t, kind, i){
    const isVid = kind === 'video';
    const name  = esc(t.name || 'Untitled');
    const url   = esc(t.url  || '');
    return `<article class="mm-card">
      <div class="mm-thumb ${isVid ? 'is-video' : 'is-audio'}">
        ${isVid && url ? `<video class="mm-thumb-v" src="${url}" preload="metadata" muted playsinline></video>` : ''}
        <i class="bi bi-${isVid ? 'film' : 'music-note-beamed'} mm-thumb-icon"></i>
        <div class="mm-acts">
          <button class="mm-icon" data-mm-play="${kind}" data-mm-i="${i}" title="Play"><i class="bi bi-play-fill"></i></button>
          <button class="mm-icon" data-mm-del="${kind}" data-mm-i="${i}" title="Remove"><i class="bi bi-trash"></i></button>
        </div>
      </div>
      <div class="mm-body">
        <div class="mm-title" title="${name}">${name}</div>
        <div class="mm-tags"><span class="mm-pill">${t.source === 'file' ? 'file' : 'link'}</span></div>
      </div>
    </article>`;
  }

  function section(kind, list, label){
    if(!list.length) return '';
    return `<div class="mm-sec">
      ${label ? `<div class="mm-sec-label">${label}</div>` : ''}
      <div class="mm-grid">${list.map((t, i) => card(t, kind, i)).join('')}</div>
    </div>`;
  }

  const showVid  = (mmTab === 'all' || mmTab === 'video') && vids.length;
  const showMus  = (mmTab === 'all' || mmTab === 'music') && mus.length;
  const anyShown = showVid || showMus;
  const both     = mmTab === 'all';

  root.innerHTML = `
    <div class="mm-wrap">
      <header class="mm-head">
        <div>
          <h1 class="mm-title">Manager</h1>
          <p class="mm-sub">${total} item${total === 1 ? '' : 's'} · ${vids.length} video${vids.length === 1 ? '' : 's'} · ${mus.length} track${mus.length === 1 ? '' : 's'}</p>
        </div>
        <div class="mm-head-acts">
        </div>
      </header>

      <div class="mm-tabs">
        ${[['all','All',total], ['video','Video',vids.length], ['music','Music',mus.length]]
          .map(([id, label, n]) =>
            `<button class="mm-tab${mmTab === id ? ' active' : ''}" data-mm-tab="${id}">${label}<span class="mm-tab-n">${n}</span></button>`
          ).join('')}
      </div>

      ${anyShown
        ? (showVid ? section('video', vids, both ? 'Video' : '') : '')
        + (showMus ? section('music', mus,  both ? 'Music' : '') : '')
        : `<div class="mm-empty">
             <div class="mm-empty-icon"><i class="bi bi-collection-play"></i></div>
             <div class="mm-empty-title">${total ? 'Nothing in this tab' : 'No media yet'}</div>
             <div class="mm-empty-hint">Add a stream URL, or drop in local files. Videos get a thumbnail; tracks appear in the music player.</div>
           </div>`}

      <input type="file" id="mmFiles" multiple accept="audio/*,video/*" hidden>
    </div>

    <style>
      .mm-wrap{max-width:1120px;margin:0 auto;padding:32px 32px 72px;}
      .mm-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:20px;}
      .mm-title{margin:0;font-size:15px;font-weight:600;letter-spacing:-.01em;color:var(--ink);}
      .mm-sub{margin-top:4px;font-size:12px;color:var(--ink-3);}
      .mm-head-acts{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
      html body .mm-head-acts .btn{height:32px;padding:0 12px;font-size:12px;border-radius:var(--r-md,6px);display:inline-flex;align-items:center;gap:6px;}

      .mm-tabs{display:inline-flex;align-items:center;gap:2px;padding:3px;background:var(--surface-2);border:1px solid var(--line-2);border-radius:var(--r-md,6px);margin-bottom:16px;}
      .mm-tab{height:30px;padding:0 12px;border:0;border-radius:var(--r-sm,4px);background:transparent;color:var(--ink-3);font-size:12px;font-weight:500;display:inline-flex;align-items:center;gap:6px;cursor:pointer;transition:background var(--t-fast) var(--ease),color var(--t-fast) var(--ease);}
      .mm-tab:hover{background:var(--overlay);color:var(--ink);}
      .mm-tab.active{background:var(--surface-4);color:var(--ink);}
      .mm-tab-n{font-size:10.5px;color:var(--ink-4);font-variant-numeric:tabular-nums;}

      .mm-sec + .mm-sec{margin-top:28px;}
      .mm-sec-label{font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-4);margin-bottom:10px;}

      .mm-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;}
      .mm-card{background:var(--surface-2);border:1px solid var(--line-2);border-radius:var(--r-lg,8px);overflow:hidden;transition:background var(--t-fast) var(--ease),border-color var(--t-fast) var(--ease),transform var(--t-fast) var(--ease);}
      .mm-card:hover{background:var(--surface-3);border-color:var(--line-3);transform:translateY(-1px);}

      .mm-thumb{position:relative;aspect-ratio:16/9;background:var(--surface-3);display:flex;align-items:center;justify-content:center;overflow:hidden;}
      .mm-thumb.is-audio{background:linear-gradient(135deg,var(--surface-3),var(--surface-2));}
      .mm-thumb-icon{font-size:20px;color:var(--ink-4);}
      .mm-thumb-v{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1;}

      .mm-acts{position:absolute;inset:0;z-index:2;display:flex;align-items:center;justify-content:center;gap:8px;background:rgba(0,0,0,.42);opacity:0;transition:opacity var(--t-fast) var(--ease);}
      .mm-card:hover .mm-acts{opacity:1;}
      @media (hover:none){ .mm-acts{opacity:1;background:linear-gradient(180deg,transparent 40%,rgba(0,0,0,.55));align-items:flex-end;padding-bottom:8px;} }
      .mm-icon{width:30px;height:30px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;background:var(--surface-1);color:var(--ink);border:1px solid var(--line-3);font-size:13px;cursor:pointer;}
      .mm-icon:hover{background:var(--accent);color:var(--accent-ink);border-color:var(--accent);}

      .mm-body{padding:10px 12px;}
      .mm-title{font-size:12.5px;line-height:17px;font-weight:500;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      .mm-tags{margin-top:6px;}
      .mm-pill{font-size:10.5px;color:var(--ink-3);border:1px solid var(--line-2);border-radius:999px;padding:1px 7px;}

      .mm-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:6px;min-height:280px;padding:32px;background:var(--surface-1);border:1px solid var(--line-2);border-radius:var(--r-lg,8px);}
      .mm-empty-icon{width:40px;height:40px;border-radius:var(--r-md,6px);background:var(--surface-3);display:flex;align-items:center;justify-content:center;font-size:18px;color:var(--ink-3);margin-bottom:6px;}
      .mm-empty-title{font-size:14px;font-weight:600;color:var(--ink);}
      .mm-empty-hint{font-size:12px;line-height:1.6;color:var(--ink-3);max-width:40ch;}
    </style>
  `;

  const inp = $('mmFiles');
  if(inp) inp.addEventListener('change', function(e){
    Array.prototype.forEach.call(e.target.files, function(f){
      const isVid = (f.type || '').indexOf('video/') === 0;
      const url = URL.createObjectURL(f);
      const name = f.name.replace(/\.[^.]+$/, '');
      if(isVid){
        if(typeof videoPlaylistAdd === 'function') videoPlaylistAdd(url, name, 'file', f.name);
        else S.config.videoPlaylist.push({ url:url, name:name, source:'file', added:Date.now() });
      } else {
        Music.playlist.push({ name:name, url:url, source:'file', mime:f.type });
        S.config.musicPlaylist = Music.playlist;
      }
    });
    save();
    if(typeof renderVideoPlaylist === 'function') renderVideoPlaylist();
    if(typeof renderMusicPlayer === 'function') renderMusicPlayer();
    if(typeof renderMusicMini === 'function') renderMusicMini();
    toast('Added');
    goPage('overview');
  });
};


/* clicks — delegated, so it survives every re-render */
if(!window.__mmWired){
  window.__mmWired = 1;
  document.addEventListener('click', function(e){

      const tb = e.target.closest('[data-mm-tab]');
  if(tb){ mmTab = tb.dataset.mmTab; goPage('overview'); return; }

    const add = e.target.closest('[data-mm-add]');
    if(add){
      const kind = add.dataset.mmAdd;
      const url = prompt(kind === 'video' ? 'Video URL (mp4 · webm · m3u8)' : 'Audio URL (mp3 · ogg · m4a)');
      if(url && url.trim()){
        if(kind === 'video'){ if(typeof videoPlaylistAdd === 'function') videoPlaylistAdd(url.trim(), null, 'url'); }
        else { if(typeof musicAddURL === 'function') musicAddURL(url.trim()); }
        goPage('overview');
      }
      return;
    }

    const p = e.target.closest('[data-mm-play]');
    if(p){
      const i = parseInt(p.dataset.mmI, 10);
      if(p.dataset.mmPlay === 'video'){ openVideoPanel(); playFromVideoPlaylist(i); }
      else { playMusicIndex(i); openMusicPanel(); }
      return;
    }

    const d = e.target.closest('[data-mm-del]');
    if(d){
      const i = parseInt(d.dataset.mmI, 10);
      if(d.dataset.mmDel === 'video'){ S.config.videoPlaylist.splice(i, 1); }
      else { Music.playlist.splice(i, 1); S.config.musicPlaylist = Music.playlist; }
      save();
      goPage('overview');
      return;
    }
  }, true);
}

// ═══ EDITOR ═══
PAGE_RENDERERS.editor = function(root){
  root.innerHTML = `
    <div class="editor-wrap">
      <div class="editor-toolbar" id="editorToolbar"></div>
      <div class="editor-canvas" id="editorCanvas">
        <div class="editor-doc" id="editor" contenteditable="true" spellcheck="false" data-placeholder="Start writing…"></div>
      </div>
    </div>
  `;
  if(window.WRITE && WRITE.init) WRITE.init();
};

// ═══ OUTLINE ═══
function olWords(html){
  const t = String(html || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ');
  const m = t.trim().match(/\S+/g);
  return m ? m.length : 0;
}
function olOpenTarget(id){
  if(!id) return;
  const sels = document.querySelectorAll('#chapterControls select');
  for(let i = 0; i < sels.length; i++){
    const s = sels[i];
    const hit = Array.prototype.slice.call(s.options).some(function(o){ return o.value === id; });
    if(hit){ s.value = id; s.dispatchEvent(new Event('change', { bubbles:true })); return; }
  }
  D().currentChapter = id;
  if(typeof goPage === 'function') goPage('write');
}
function olLabel(){
  return (S.mode === 'screenplay') ? { ch:'Scene', sub:'Subscene' } : { ch:'Chapter', sub:'Subchapter' };
}

/* ── creating / renumbering sections lives HERE now (the writing strip keeps
      only the two dropdowns). Numbering is position-based and skips numbers
      already taken, so a renamed section still counts as one. ── */
function olTakenNums(list, kind){
  const pre = kind === 'sub' ? ['Subchapter','Subscene'] : ['Chapter','Scene'];
  const taken = {};
  (list || []).forEach(function(c){
    const t = String((c && c.title) || '').trim();
    pre.forEach(function(p){
      const m = new RegExp('^' + p + '\\s+(\\d+)$', 'i').exec(t);
      if(m) taken[parseInt(m[1], 10)] = 1;
    });
  });
  return taken;
}
function olNextNum(list, kind){
  const taken = olTakenNums(list, kind);
  let n = (list || []).length + 1;
  while(taken[n]) n++;
  return n;
}
function olFind(id){
  const ds = D();
  for(const c of (ds.chapters || [])){
    if(c.id === id) return { node:c, parent:null };
    for(const x of (c.children || [])) if(x.id === id) return { node:x, parent:c };
  }
  return null;
}
function olAddSection(parentId){
  const ds = D();
  const L = olLabel();
  if(!Array.isArray(ds.chapters)) ds.chapters = [];
  if(parentId){
    const p = olFind(parentId);
    const root = (p && p.parent) ? p.parent : (p && p.node) || ds.chapters[0];
    if(!root) return toast('Add a ' + L.ch.toLowerCase() + ' first', 'warn');
    if(!Array.isArray(root.children)) root.children = [];
    root.collapsed = false;
    const node = { id:uid(), title:L.sub + ' ' + olNextNum(root.children, 'sub'), content:'', children:[], collapsed:false, desc:'' };
    root.children.push(node);
    toast(L.sub + ' added');
  } else {
    const node = { id:uid(), title:L.ch + ' ' + olNextNum(ds.chapters, 'ch'), content:'', children:[], collapsed:false, desc:'' };
    const cur = olFind(ds.currentChapter);
    const at = cur ? ds.chapters.indexOf(cur.parent || cur.node) : -1;
    if(at >= 0) ds.chapters.splice(at + 1, 0, node); else ds.chapters.push(node);
    toast(L.ch + ' added');
  }
  save();
  PAGE_RENDERERS.outline(document.querySelector('#page-outline') || document.querySelector('.page.active'));
}

/* ═══ TYPE PANEL — one floating "Aa" card shared by Outline, Kanban and
   Bible, so those pages can set their own font, size and leading. ═══ */
function typoKey(page){ return 'typo_' + (page || 'page'); }
function typoGet(page){
  if(!S.config.typo || typeof S.config.typo !== 'object') S.config.typo = {};
  const t = S.config.typo[page];
  return (t && typeof t === 'object') ? t : { font:'', size:13, lh:1.6, weight:'400' };
}
function typoApply(page, root){
  const el = root || document.querySelector('.page.active');
  if(!el) return;
  const t = typoGet(page);
  const face = t.font ? ((typeof FONTS !== 'undefined' && FONTS.find(function(f){ return f.name === t.font; }) || {}).f || ('"' + t.font + '", var(--ui)')) : 'var(--ui)';
  el.style.setProperty('--pg-font', face);
  el.style.setProperty('--pg-size', t.size + 'px');
  el.style.setProperty('--pg-lh', String(t.lh));
  el.style.setProperty('--pg-weight', String(t.weight || '400'));
}
 function typoPanelHtml(page){
  const t = typoGet(page);
  const fonts = (typeof FONTS !== 'undefined' ? FONTS : []).map(function(f){ return f.name; });
  const opts = ['', ...fonts].map(function(f){
    const label = f || 'Interface font';
    return '<option value="' + esc(f) + '"' + ((t.font || '') === f ? ' selected' : '') + '>' + esc(label) + '</option>';
  }).join('');
  const sizes = [11,12,13,14,15,16,18,20,22].map(function(n){
    return '<option value="' + n + '"' + (Number(t.size) === n ? ' selected' : '') + '>' + n + 'px</option>';
  }).join('');
  const lh = [['1.4','Tight'],['1.6','Normal'],['1.8','Airy'],['2','Script']].map(function(p){
    return '<option value="' + p[0] + '"' + (Number(t.lh) === Number(p[0]) ? ' selected' : '') + '>' + p[1] + '</option>';
  }).join('');
  const wt = [['300','Light'],['400','Regular'],['500','Medium'],['600','Semibold']].map(function(p){
    return '<option value="' + p[0] + '"' + (String(t.weight) === p[0] ? ' selected' : '') + '>' + p[1] + '</option>';
  }).join('');
  return '<div class="typo-panel" data-typo-panel="' + page + '">'
    + '<div class="typo-head"><i class="bi bi-type"></i><span>Type on this page</span>'
    +   '<button class="icon-btn v-close" data-typo-close="1" title="Close">'
    +     '<svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M3 3L11 11M11 3L3 11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>'
    +   '</button></div>'
    + '<div class="typo-body">'
    +   '<label class="typo-row"><span>Font</span><select class="sel typo-font">' + opts + '</select></label>'
    +   '<label class="typo-row"><span>Size</span><select class="sel typo-size">' + sizes + '</select></label>'
    +   '<label class="typo-row"><span>Leading</span><select class="sel typo-lh">' + lh + '</select></label>'
    +   '<label class="typo-row"><span>Weight</span><select class="sel typo-wt">' + wt + '</select></label>'
    +   '<button class="typo-reset" data-typo-reset="1">Reset to app defaults</button>'
    + '</div></div>';
}

function typoOpen(page, anchor){
  let p = document.querySelector('[data-typo-panel]');
  if(p){
    if(p.dataset.typoPanel === page){ typoClose(); return; }
    p.remove();
  }
  document.body.insertAdjacentHTML('beforeend', typoPanelHtml(page));
  p = document.querySelector('[data-typo-panel]');
  if(!p) return;
  if(typeof window.enhanceSelects === 'function') window.enhanceSelects(p);
  const vw = window.innerWidth, vh = window.innerHeight;
  const w = p.offsetWidth || 236, h = p.offsetHeight || 200;
  let left = vw - w - 16, top = 74;
  if(anchor && anchor.getBoundingClientRect){
    const r = anchor.getBoundingClientRect();
    left = r.right - w; top = r.bottom + 8;
  }
  p.style.left = Math.max(8, Math.min(left, vw - w - 8)) + 'px';
  p.style.top  = Math.max(8, Math.min(top,  vh - h - 8)) + 'px';
  typoWire(page);
}
function typoClose(){ const p = document.querySelector('[data-typo-panel]'); if(p) p.remove(); }
function typoSet(page, key, val){
  const t = typoGet(page);
  t[key] = val;
  S.config.typo[page] = t;
  save();
  typoApply(page);
}
function typoWire(page){
  const p = document.querySelector('[data-typo-panel]');
  if(!p || p.__wired) return;
  p.__wired = true;
  p.addEventListener('change', function(e){
    const f = e.target.closest('.typo-font'), s = e.target.closest('.typo-size'),
          l = e.target.closest('.typo-lh'),   w = e.target.closest('.typo-wt');
    if(f) typoSet(page, 'font', f.value);
    if(s) typoSet(page, 'size', parseInt(s.value, 10) || 13);
    if(l) typoSet(page, 'lh', parseFloat(l.value) || 1.6);
    if(w) typoSet(page, 'weight', w.value);
  });
  p.addEventListener('click', function(e){
    if(e.target.closest('[data-typo-close]')){ typoClose(); return; }
    if(e.target.closest('[data-typo-reset]')){
      S.config.typo[page] = { font:'', size:13, lh:1.6, weight:'400' };
      save(); typoApply(page); typoClose(); typoOpen(page);
    }
  });
}
document.addEventListener('click', function(e){
  const op = e.target.closest('[data-typop]');
  if(op){ e.preventDefault(); e.stopPropagation(); typoOpen(op.dataset.typop, op); return; }
  const p = document.querySelector('[data-typo-panel]');
  if(p && !e.target.closest('[data-typo-panel]')) typoClose();
}, true);
PAGE_RENDERERS.outline = function(root){
  const d = D();
  const L = olLabel();
  const chapters = d.chapters || [];

  const total = chapters.reduce(function(n, c){ return n + 1 + (c.children || []).length; }, 0);
  const words = chapters.reduce(function(n, c){
    return n + olWords(c.content) + (c.children || []).reduce(function(m, x){ return m + olWords(x.content); }, 0);
  }, 0);
  const proj = (d.projects || []).find(function(p){ return p.id === d.currentProject; });

  root.innerHTML = `
    <div class="page-head ol-head">
    <button class="ol-btn ol-btn-icon" data-typop="outline" title="Font, size and leading"><i class="bi bi-fonts"></i></button>
      <div>
      </div>
      <div class="ol-actions">
        <button class="ol-btn" data-ol="expand"><i class="bi bi-arrows-expand"></i> Expand all</button>
        <button class="ol-btn" data-ol="collapse"><i class="bi bi-arrows-collapse"></i> Collapse all</button>
        <button class="ol-btn" data-ol="addsub"><i class="bi bi-file-earmark-plus"></i> New ${L.sub.toLowerCase()}</button>
        <button class="ol-btn ol-btn" data-ol="add"><i class="bi bi-plus-lg"></i> New ${L.ch.toLowerCase()}</button>
      </div>
    </div>
    <div class="ol-wrap">
      <div class="ol-panel" id="olList"></div>
    </div>`;

  const list = $('olList');
  if(!list) return;

  if(!chapters.length){
    list.innerHTML = '<div class="ol-empty"><i class="bi bi-list-nested"></i>'
      + '<div>No ' + L.ch.toLowerCase() + 's yet</div>'
      + '<button class="ol-btn ol-btn-primary" data-ol="add">Create the first one</button></div>';
  } else {
    list.innerHTML = chapters.map(function(c, i){
      const kids = c.children || [];
      const open = !c.collapsed;
      const cw = olWords(c.content);
      const kw = kids.reduce(function(m, x){ return m + olWords(x.content); }, 0);
      const done = c.ready ? ' is-ready' : '';
      return '<div class="ol-node' + done + '" data-ol-node="' + c.id + '">'
        + '<div class="ol-row' + (d.currentChapter === c.id ? ' on' : '') + '" data-ol-open="' + c.id + '">'
        +   '<button class="ol-twist' + (kids.length ? '' : ' is-empty') + (open ? ' is-open' : '') + '" data-ol-toggle="' + c.id + '" title="' + (open ? 'Collapse' : 'Expand') + '">'
        +     '<i class="bi bi-chevron-right"></i></button>'
        +   '<span class="ol-num">' + (i + 1) + '</span>'
        +   '<span class="ol-name">' + esc(c.title || (L.ch + ' ' + (i + 1))) + '</span>'
        +   (c.ready ? '<span class="ol-badge">ready</span>' : '')
        +   '<span class="ol-tools">'
        +     '<button class="ol-tool" data-ol-addsub="' + c.id + '" title="New ' + L.sub.toLowerCase() + ' inside"><i class="bi bi-plus-lg"></i></button>'
        +     '<button class="ol-tool' + (String(c.desc || '').trim() ? ' is-on' : '') + '" data-ol-desc="' + c.id + '" title="Description"><i class="bi bi-card-text"></i></button>'
        +     '<button class="ol-tool" data-ol-rename="' + c.id + '" title="Rename"><i class="bi bi-pencil"></i></button>'
        +     '<button class="ol-tool" data-ol-del="' + c.id + '" title="Delete"><i class="bi bi-trash"></i></button>'
        +   '</span>'
        + '</div>'
        + (c.descOpen ? '<div class="ol-desc"><textarea class="inp" data-ol-descbox="' + c.id + '" placeholder="Describe this ' + L.ch.toLowerCase() + ' — what happens, who changes, what it sets up…">' + esc(c.desc || '') + '</textarea></div>' : '')
        + (kids.length && open ? '<div class="ol-kids">' + kids.map(function(x, j){
            return '<div class="ol-node ol-node-sub" data-ol-node="' + x.id + '">'
              + '<div class="ol-row ol-sub' + (d.currentChapter === x.id ? ' on' : '') + '" data-ol-open="' + x.id + '">'
              + '<span class="ol-num">' + (i + 1) + '.' + (j + 1) + '</span>'
              + '<span class="ol-name">' + esc(x.title || (L.sub + ' ' + (j + 1))) + '</span>'
              + '<span class="ol-tools">'
              +   '<button class="ol-tool' + (String(x.desc || '').trim() ? ' is-on' : '') + '" data-ol-desc="' + x.id + '" title="Description"><i class="bi bi-card-text"></i></button>'
              +   '<button class="ol-tool" data-ol-rename="' + x.id + '" title="Rename"><i class="bi bi-pencil"></i></button>'
              +   '<button class="ol-tool" data-ol-del="' + x.id + '" title="Delete"><i class="bi bi-trash"></i></button>'
              + '</span>'
              + '</div>'
              + (x.descOpen ? '<div class="ol-desc ol-desc-sub"><textarea class="inp" data-ol-descbox="' + x.id + '" placeholder="Describe this ' + L.sub.toLowerCase() + '…">' + esc(x.desc || '') + '</textarea></div>' : '')
              + '</div>';
          }).join('') + '</div>' : '')
        + '</div>';
    }).join('');
  }

  const find = function(id){
    const ds = D();
    for(const c of (ds.chapters || [])){
      if(c.id === id) return { node:c, parent:null };
      for(const x of (c.children || [])) if(x.id === id) return { node:x, parent:c };
    }
    return null;
  };

  const olAction = function(act){
    if(act === 'expand' || act === 'collapse'){
      (D().chapters || []).forEach(function(c){ c.collapsed = (act === 'collapse'); });
      save();
      PAGE_RENDERERS.outline(root);
      return;
    }
    if(act === 'add'){ olAddSection(null); return; }
    if(act === 'addsub'){
      const cur = olFind(D().currentChapter);
      const rootId = cur ? (cur.parent ? cur.parent.id : cur.node.id) : (D().chapters[0] || {}).id;
      if(!rootId) return toast('Add a ' + L.ch.toLowerCase() + ' first', 'warn');
      olAddSection(rootId);
    }
  };

  list.addEventListener('click', function(e){
    const act = e.target.closest('[data-ol]');
    if(act){ e.preventDefault(); olAction(act.dataset.ol); return; }
    const sub = e.target.closest('[data-ol-addsub]');
    if(sub){ e.stopPropagation(); olAddSection(sub.dataset.olAddsub); return; }
    const dsc = e.target.closest('[data-ol-desc]');
    if(dsc){
      e.stopPropagation();
      const f = olFind(dsc.dataset.olDesc);
      if(f){
        f.node.descOpen = !f.node.descOpen;
        save();
        PAGE_RENDERERS.outline(root);
        const box = root.querySelector('[data-ol-descbox="' + f.node.id + '"]');
        if(box) box.focus();
      }
      return;
    }
    const tgl = e.target.closest('[data-ol-toggle]');
    if(tgl){
      e.stopPropagation();
      const f = find(tgl.dataset.olToggle);
      if(f){ f.node.collapsed = !f.node.collapsed; save(); PAGE_RENDERERS.outline(root); }
      return;
    }
    const rn = e.target.closest('[data-ol-rename]');
    if(rn){
      e.stopPropagation();
      const f = find(rn.dataset.olRename);
      if(!f) return;
      const name = prompt('Rename:', f.node.title || '');
      if(name && name.trim()){ f.node.title = name.trim(); save(); PAGE_RENDERERS.outline(root); }
      return;
    }
    const dl = e.target.closest('[data-ol-del]');
    if(dl){
      e.stopPropagation();
      const f = find(dl.dataset.olDel);
      if(!f) return;
      if(!confirm('Delete "' + (f.node.title || 'this section') + '"?')) return;
      if(f.parent) f.parent.children = (f.parent.children || []).filter(function(x){ return x.id !== f.node.id; });
      else D().chapters = (D().chapters || []).filter(function(x){ return x.id !== f.node.id; });
      if(D().currentChapter === f.node.id){
        const first = (D().chapters || [])[0];
        D().currentChapter = first ? first.id : null;
      }
      save();
      PAGE_RENDERERS.outline(root);
      return;
    }
  });

  const head = root.querySelector('.ol-head');
  if(head) head.addEventListener('click', function(e){
    const b = e.target.closest('[data-ol]');
    if(b){ e.preventDefault(); olAction(b.dataset.ol); }
  });

  /* descriptions save as you type — no dialog, no re-render while typing */
  root.addEventListener('input', function(e){
    const box = e.target.closest('[data-ol-descbox]');
    if(!box) return;
    const f = olFind(box.dataset.olDescbox);
    if(!f) return;
    f.node.desc = box.value;
    if(typeof scheduleSave === 'function') scheduleSave(); else save();
  });

  typoApply('outline', root);
  let dragId = null;
  root.addEventListener('dragstart', e => {
    const n = e.target.closest('.ol-node'); if(!n) return;
    dragId = n.dataset.olNode; e.dataTransfer.effectAllowed = 'move';
  });
  root.addEventListener('dragover', e => e.preventDefault());
  root.addEventListener('drop', e => {
    const t = e.target.closest('.ol-node'); if(!t || !dragId || t.dataset.olNode === dragId) return;
    e.preventDefault();
    const dd = D(); const id = dragId; dragId = null;
    const take = (list) => { const i = list.findIndex(x => x.id === id); return i < 0 ? null : list.splice(i,1)[0]; };
    let moved = take(dd.chapters);
    (dd.chapters||[]).forEach(c => { if(!moved) moved = take(c.children||[]); });
    if(!moved) return;
    (dd.chapters||[]).forEach(c => {
      if(c.id === t.dataset.olNode){ c.children = c.children||[]; c.children.unshift(moved); moved = null; }
      else if(!moved) (c.children||[]).forEach(x => { if(x.id === t.dataset.olNode){ c.children.unshift(moved); moved=null; } });
    });
    if(moved) dd.chapters.unshift(moved);
    save(); PAGE_RENDERERS.outline(root);
  });
};

// ═══ KANBAN — a production board for the sections ═══
const KB_COLUMNS = [
  { id:'planning',  name:'Planning',  hint:'Beats and notes' },
  { id:'drafting',  name:'Drafting',  hint:'Words going down' },
  { id:'revised',   name:'Revised',   hint:'Second pass' },
  { id:'final',     name:'Final',     hint:'Ready to publish' }
];
function kbProj(){
  const d = D();
  return (d.projects || []).find(function(p){ return p.id === d.currentProject; }) || null;
}
function kbBoard(){
  const proj = kbProj();
  if(!proj) return null;
  if(!proj.kanban || typeof proj.kanban !== 'object') proj.kanban = {};
  return proj.kanban;
}
/* the lists on the board — the four defaults, plus anything you add.
   They live on the project, so every book/screenplay gets its own board. */
function kbColumns(create){
  const proj = kbProj();
  if(!proj) return KB_COLUMNS.slice();
  if(!Array.isArray(proj.kbCols) || !proj.kbCols.length){
    proj.kbCols = KB_COLUMNS.map(function(c){ return { id:c.id, name:c.name, hint:c.hint, fixed:true }; });
  }
  return proj.kbCols;
}
function kbColumn(id){
  return kbColumns().filter(function(c){ return c.id === id; })[0] || null;
}
function kbDefaultColumn(){ return kbColumns()[0].id; }
function kbStatus(id, words){
  const board = kbBoard();
  const cols = kbColumns();
  if(board && board[id] && cols.some(function(c){ return c.id === board[id]; })) return board[id];
  const auto = words > 0 ? (cols[1] || cols[0]).id : cols[0].id;
  return auto;
}
function kbAddList(){
  const name = prompt('Name of the new list:', 'Ideas');
  if(!name || !name.trim()) return;
  const cols = kbColumns();
  cols.push({ id:'kb' + Date.now().toString(36), name:name.trim(), hint:'Drop cards here', fixed:false });
  save();
  PAGE_RENDERERS.kanban(document.querySelector('#page-kanban') || document.querySelector('.page.active'));
  toast('List added');
}
function kbRenameList(colId){
  const col = kbColumn(colId);
  if(!col) return;
  const name = prompt('Rename list:', col.name);
  if(!name || !name.trim()) return;
  col.name = name.trim();
  save();
  PAGE_RENDERERS.kanban(document.querySelector('#page-kanban') || document.querySelector('.page.active'));
}
function kbDeleteList(colId){
  const col = kbColumn(colId);
  if(!col) return;
  if(col.fixed){ toast('The four default lists stay put', 'warn'); return; }
  if(!confirm('Remove the list “' + col.name + '”? Cards go back to ' + kbColumns()[0].name + '.')) return;
  const proj = kbProj();
  if(proj){
    proj.kbCols = kbColumns().filter(function(c){ return c.id !== colId; });
    Object.keys(proj.kanban || {}).forEach(function(k){ if(proj.kanban[k] === colId) delete proj.kanban[k]; });
  }
  save();
  PAGE_RENDERERS.kanban(document.querySelector('#page-kanban') || document.querySelector('.page.active'));
}
PAGE_RENDERERS.kanban = function(root){
  const d = D();
  const L = olLabel();
  const chapters = d.chapters || [];
  const board = kbBoard();
  if(!board){
    root.innerHTML =
      + '<div class="page-sub">Open a project to track its progress</div></div></div>'
      + '<div class="ol-wrap"><div class="ol-panel"><div class="ol-empty"><i class="bi bi-kanban"></i><div>No project open</div></div></div></div>';
    return;
  }

  const all = [];
  chapters.forEach(function(c, i){
    all.push({ id:c.id, title:c.title || (L.ch + ' ' + (i + 1)), words:olWords(c.content), root:c.id });
    (c.children || []).forEach(function(x, j){
      all.push({ id:x.id, title:x.title || (L.sub + ' ' + (j + 1)), words:olWords(x.content), root:c.id });
    });
  });

  const words = all.reduce(function(n, x){ return n + x.words; }, 0);
  root.innerHTML = `
    <div class="page-head ol-head">
    <button class="ol-btn ol-btn-icon" data-typop="kanban" title="Font, size and leading"><i class="bi bi-fonts"></i></button>
      <div>
        <h1 class="page-title">Kanban</h1>
        <div class="page-sub">${all.length} cards · ${words.toLocaleString()} words · drag a card between columns</div>
      </div>
      <div class="ol-actions">
        <button class="ol-btn" data-kb="newlist"><i class="bi bi-plus-lg"></i> New list</button>
        <button class="ol-btn" data-kb="reset"><i class="bi bi-arrow-counterclockwise"></i> Reset board</button>
      </div>
    </div>
    <div class="kb-board" id="kbBoard"></div>`;
    
      const el = $('kbBoard');
  if(!el) return;


  el.innerHTML = kbColumns().map(function(col){
    const cards = all.filter(function(x){ return kbStatus(x.id, x.words) === col.id; });
    const sum = cards.reduce(function(n, x){ return n + x.words; }, 0);
    return '<section class="kb-col" data-kb-col="' + col.id + '">'
      + '<header class="kb-col-head">'
      +   '<span class="kb-col-name">' + esc(col.name) + '</span>'
      +   '<span class="kb-col-meta">' + cards.length + ' · ' + sum.toLocaleString() + 'w</span>'
      +   '<span class="kb-col-tools">'
      +     '<button class="ol-tool" data-kb-rename="' + col.id + '" title="Rename list"><i class="bi bi-pencil"></i></button>'
      +     (col.fixed ? '' : '<button class="ol-tool" data-kb-kill="' + col.id + '" title="Remove list"><i class="bi bi-trash"></i></button>')
      +   '</span>'
      + '</header>'
      + '<div class="kb-drop" data-kb-drop="' + col.id + '">'
      + (cards.length ? cards.map(function(c){
          return '<article class="kb-card" draggable="true" data-kb-card="' + c.id + '">'
            + '<div class="kb-card-title">' + esc(c.title) + '</div>'
            + '<div class="kb-card-foot"><span>' + c.words.toLocaleString() + ' words</span>'
            + '<button class="ol-tool" data-kb-open="' + c.id + '" title="Open in the writer"><i class="bi bi-box-arrow-up-right"></i></button></div>'
            + '</article>';
        }).join('') : '<div class="kb-empty">' + col.hint + '</div>')
      + '</div>'
      + '</section>';
  }).join('')
  + '<button class="kb-addlist" data-kb="newlist"><i class="bi bi-plus-lg"></i> New list</button>';

  /* drag and drop */
  let dragged = null;
  el.addEventListener('dragstart', function(e){
    const card = e.target.closest('[data-kb-card]');
    if(!card) return;
    dragged = card.dataset.kbCard;
    card.classList.add('is-dragging');
    try{ e.dataTransfer.setData('text/plain', dragged); }catch(err){}
    e.dataTransfer.effectAllowed = 'move';
  });
  el.addEventListener('dragend', function(e){
    const card = e.target.closest('[data-kb-card]');
    if(card) card.classList.remove('is-dragging');
    el.querySelectorAll('.kb-drop.is-over').forEach(function(x){ x.classList.remove('is-over'); });
  });
  el.addEventListener('dragover', function(e){
    const drop = e.target.closest('[data-kb-drop]');
    if(!drop) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    el.querySelectorAll('.kb-drop.is-over').forEach(function(x){ if(x !== drop) x.classList.remove('is-over'); });
    drop.classList.add('is-over');
  });
  el.addEventListener('drop', function(e){
    const drop = e.target.closest('[data-kb-drop]');
    if(!drop) return;
    e.preventDefault();
    const id = dragged || (e.dataTransfer && e.dataTransfer.getData('text/plain'));
    if(!id) return;
    const b = kbBoard();
    if(b){ b[id] = drop.dataset.kbDrop; save(); }
    dragged = null;
    PAGE_RENDERERS.kanban(root);
  });
  el.addEventListener('click', function(e){
    const op = e.target.closest('[data-kb-open]');
    if(op){ e.preventDefault(); olOpenTarget(op.dataset.kbOpen); return; }
    const rn = e.target.closest('[data-kb-rename]');
    if(rn){ e.preventDefault(); kbRenameList(rn.dataset.kbRename); return; }
    const kl = e.target.closest('[data-kb-kill]');
    if(kl){ e.preventDefault(); kbDeleteList(kl.dataset.kbKill); return; }
    if(e.target.closest('[data-kb="newlist"]')){ e.preventDefault(); kbAddList(); }
  });

    const head = root.querySelector('.ol-head');
  if(head) head.addEventListener('click', function(e){
    if(e.target.closest('[data-kb="newlist"]')){ e.preventDefault(); kbAddList(); return; }
    if(e.target.closest('[data-kb="reset"]')){
      e.preventDefault();
      const proj = kbProj();
      if(proj && confirm('Reset the board — every card back to the first list, custom lists removed?')){
        proj.kanban = {}; proj.kbCols = null;
         const el = $('kbBoard');
       if(!el) return;             
      }
    }
  });


  typoApply('kanban', root);
};

// ═══ BIBLE — a story bible with a category bar and one big working panel ═══
const BB_TABS = [
  { id:'timeline',     name:'Timeline',      icon:'git',           item:'Timeline entry' },
  { id:'event',        name:'Events',        icon:'calendar-event',item:'Event' },
  { id:'character',    name:'Characters',    icon:'people',        item:'Character' },
  { id:'location',     name:'Locations',     icon:'geo-alt',       item:'Location' },
  { id:'item',         name:'Items',         icon:'box-seam',      item:'Item' },
  { id:'organization', name:'Organizations', icon:'diagram-3',     item:'Organization' },
  { id:'concept',      name:'Concepts',      icon:'lightbulb',     item:'Concept' },
  
];
let _bbTab = 'character';
let _bbSel = null;

var BB_KEYS = { character:'characters', location:'locations', item:'items', scene:'scenes', event:'events', organization:'organizations', concept:'concepts' };

function bbIsTimeline(tab){ return tab === 'timeline'; }
function bbBag(){
  const d = D();
  if(Array.isArray(d.bible)){                 // legacy flat array → per-category arrays
    const flat = d.bible; d.bible = {};
    flat.forEach(function(e){ if(e && typeof e === 'object'){ const k = BB_KEYS[e.type] || 'characters'; (d.bible[k] = d.bible[k] || []).push(e); } });
  }
  if(!d.bible || typeof d.bible !== 'object') d.bible = {};
  Object.keys(BB_KEYS).forEach(function(t){ const k = BB_KEYS[t]; if(!Array.isArray(d.bible[k])) d.bible[k] = []; });
  return d.bible;
}
function bbList(tab){
  if(bbIsTimeline(tab)) return D().timeline || [];
  const arr = bbBag()[BB_KEYS[tab] || 'characters'];
  arr.forEach(function(e){ if(e && !e.type) e.type = tab; });
  return arr;
}
function bbIndexOf(tab, id){
  const list = bbList(tab);
  return list.findIndex(function(e){ return String(e.id || e.name) === String(id); });
}
function bbMutate(tab, fn){
  if(bbIsTimeline(tab)){
    if(!Array.isArray(D().timeline)) D().timeline = [];
    return fn(D().timeline);
  }
  const arr = bbBag()[BB_KEYS[tab] || 'characters'];
  return fn(arr);
}
PAGE_RENDERERS.bible = function(root){
  root.innerHTML = `
    <div class="page-head bb-head">
      <div>
        <h1 class="page-title">Bible</h1>
        <div class="page-sub">Every name, place and event your story leans on</div>
      </div>
      <div class="ol-actions">
        <button class="ol-btn" data-typop="bible" title="Font, size and leading"><i class="bi bi-fonts"></i></button>
        <button class="ol-btn ol-btn-primary" data-bb="add"><i class="bi bi-plus-lg"></i> New <span id="bbAddWord">Character</span></button>
      </div>
    </div>
    <div class="bb-tabs" id="bbTabs"></div>
    <div class="bb-panel">
      <aside class="bb-list">
        <div class="bb-search">
          <i class="bi bi-search"></i>
          <input id="bbQuery" placeholder="Filter…" autocomplete="off">
        </div>
        <div class="bb-rows" id="bbRows"></div>
      </aside>
      <section class="bb-detail" id="bbDetail"></section>
    </div>`;

  renderBbTabs();
  renderBbRows();
  renderBbDetail();
  paintBbWord();
  typoApply('bible', root);
};


function paintBbWord(){
  const w = $('bbAddWord');
  const tab = BB_TABS.find(function(t){ return t.id === _bbTab; });
  if(w && tab) w.textContent = tab.item;
}
function renderBbTabs(){
  const el = $('bbTabs');
  if(!el) return;
  el.innerHTML = BB_TABS.map(function(t){
    const n = bbList(t.id).length;
    return '<button class="bb-tab' + (t.id === _bbTab ? ' on' : '') + '" data-bb-tab="' + t.id + '">'
      + '<i class="bi bi-' + t.icon + '"></i><span>' + t.name + '</span>'
      + (n ? '<em>' + n + '</em>' : '') + '</button>';
  }).join('');
}
function renderBbRows(){
  const box = $('bbRows');
  if(!box) return;
  const q = ($('bbQuery') ? $('bbQuery').value : '').trim().toLowerCase();
  let list = bbList(_bbTab);
  if(q){
    list = list.filter(function(e){
      return String(e.name || e.title || '').toLowerCase().indexOf(q) >= 0
          || String(e.details || e.desc || '').toLowerCase().indexOf(q) >= 0;
    });
  }
  if(_bbSel == null || bbIndexOf(_bbTab, _bbSel) < 0){
    _bbSel = list.length ? String(list[0].id || list[0].name) : null;
  }
  if(!list.length){
    const tab = BB_TABS.find(function(t){ return t.id === _bbTab; });
    box.innerHTML = '<div class="bb-empty"><i class="bi bi-' + (tab ? tab.icon : 'journal') + '"></i>'
      + '<div>' + (q ? 'Nothing matches “' + esc(q) + '”' : 'No ' + (tab ? tab.name.toLowerCase() : 'entries') + ' yet') + '</div>'
      + '<button class="ol-btn ol-btn-primary" data-bb="add">Add the first one</button></div>';
    return;
  }
  box.innerHTML = list.map(function(e){
    const id = String(e.id || e.name);
    const title = e.name || e.title || 'Untitled';
    const sub = (e.details || e.desc || '').replace(/\s+/g, ' ').slice(0, 70);
    const initial = title.trim().charAt(0).toUpperCase() || '?';
    return '<button class="bb-row' + (id === String(_bbSel) ? ' on' : '') + '" data-bb-open="' + esc(id) + '">'
      + '<span class="bb-avatar">' + esc(initial) + '</span>'
      + '<span class="bb-row-body"><span class="bb-row-name">' + esc(title) + '</span>'
      + (e.date ? '<span class="bb-row-sub">' + esc(e.date) + '</span>' : (sub ? '<span class="bb-row-sub">' + esc(sub) + '</span>' : ''))
      + '</span></button>';
  }).join('');
}
function renderBbDetail(){
  const box = $('bbDetail');
  if(!box) return;
  const tab = BB_TABS.find(function(t){ return t.id === _bbTab; });
  const list = bbList(_bbTab);
  const idx = list.findIndex(function(e){ return String(e.id || e.name) === String(_bbSel); });

  if(idx < 0){
    box.innerHTML = '<div class="bb-empty bb-empty-lg"><i class="bi bi-journal-bookmark"></i>'
      + '<div>Pick an entry on the left, or add a new one</div>'
      + '<button class="ol-btn ol-btn-primary" data-bb="add">New ' + (tab ? tab.item : 'entry') + '</button></div>';
    return;
  }
  const e = list[idx];
  const isTl = bbIsTimeline(_bbTab);
  box.innerHTML = `
    <header class="bb-detail-head">
      <span class="bb-kicker">${isTl ? 'Timeline entry' : esc(tab.name.replace(/s$/, ''))}</span>
      <div class="bb-detail-actions">
        <button class="ol-tool" data-bb-del="1" title="Delete"><i class="bi bi-trash"></i></button>
      </div>
    </header>
    <label class="bb-field">
      <span>${isTl ? 'Event' : 'Name'}</span>
      <input class="inp" data-bb-field="${isTl ? 'title' : 'name'}" value="${esc(isTl ? (e.title || '') : (e.name || ''))}" placeholder="${isTl ? 'What happens' : 'Name'}">
    </label>
    ${isTl ? `
    <label class="bb-field">
      <span>When</span>
      <input class="inp" data-bb-field="date" value="${esc(e.date || '')}" placeholder="Year 3 · Act II · Day 12">
    </label>` : `
    <label class="bb-field">
      <span>Category</span>
      <select class="sel" data-bb-field="type">
        ${BB_TABS.filter(function(t){ return !bbIsTimeline(t.id); }).map(function(t){
          const v = t.id;
          return '<option value="' + v + '"' + ((e.type || 'character') === v ? ' selected' : '') + '>' + t.name.replace(/s$/, '') + '</option>';
        }).join('')}
      </select>
    </label>`}
    <label class="bb-field bb-field-grow">
      <span>Details</span>
      <textarea class="inp" data-bb-field="${isTl ? 'desc' : 'details'}" placeholder="${isTl ? 'What changes because of it…' : 'Backstory, voice, wants, ties to other entries…'}">${esc(isTl ? (e.desc || '') : (e.details || ''))}</textarea>
    </label>
    <div class="bb-meta">${list.length} ${isTl ? 'entries' : tab.name.toLowerCase()} in this project</div>`;
}

/* one delegated handler for the whole page */
document.addEventListener('click', function(e){
  const tabBtn = e.target.closest('[data-bb-tab]');
  if(tabBtn){
    e.preventDefault();
    _bbTab = tabBtn.dataset.bbTab;
    _bbSel = null;
    renderBbTabs(); renderBbRows(); renderBbDetail(); paintBbWord();
    return;
  }
  const row = e.target.closest('[data-bb-open]');
  if(row){
    e.preventDefault();
    _bbSel = row.dataset.bbOpen;
    renderBbRows(); renderBbDetail();
    return;
  }
  const add = e.target.closest('[data-bb="add"]');
  if(add){
    e.preventDefault();
    const isTl = bbIsTimeline(_bbTab);
    const entry = isTl
      ? { id:uid(), title:'New event', date:'', desc:'' }
      : { id:uid(), name:'New ' + (BB_TABS.find(function(t){ return t.id === _bbTab; }) || {}).item, type:_bbTab, details:'' };
    bbMutate(_bbTab, function(arr){ arr.push(entry); });
    _bbSel = String(entry.id);
    save();
    renderBbTabs(); renderBbRows(); renderBbDetail();
    const f = document.querySelector('[data-bb-field]');
    if(f){ f.focus(); f.select && f.select(); }
    return;
  }
  const del = e.target.closest('[data-bb-del]');
  if(del){
    e.preventDefault();
    const list = bbList(_bbTab);
    const idx = list.findIndex(function(x){ return String(x.id || x.name) === String(_bbSel); });
    if(idx < 0) return;
    if(!confirm('Delete this entry?')) return;
    const target = list[idx];
    bbMutate(_bbTab, function(arr){
      const j = arr.indexOf(target);
      if(j >= 0) arr.splice(j, 1);
    });
    _bbSel = null;
    save();
    renderBbTabs(); renderBbRows(); renderBbDetail();
  }
}, true);

document.addEventListener('input', function(e){
  const q = e.target.closest('#bbQuery');
  if(q){ renderBbRows(); renderBbDetail(); return; }
  const f = e.target.closest('[data-bb-field]');
  if(!f) return;
  const list = bbList(_bbTab);
  const entry = list.find(function(x){ return String(x.id || x.name) === String(_bbSel); });
  if(!entry) return;
  entry[f.dataset.bbField] = f.value;
  save();
  renderBbRows();
}, true);

document.addEventListener('change', function(e){
  const f = e.target.closest('[data-bb-field]');
  if(!f || f.dataset.bbField !== 'type') return;
  const list = bbList(_bbTab);
  const entry = list.find(function(x){ return String(x.id || x.name) === String(_bbSel); });
  if(!entry) return;
  entry.type = f.value;
  _bbTab = f.value;
  _bbSel = null;
  save();
  renderBbTabs(); renderBbRows(); renderBbDetail(); paintBbWord();
}, true);

// ─── MANUSCRIPT ─── the manuscript IS the editor: same chapter /
// subchapter strip, same toolbar, same canvas as Write.
PAGE_RENDERERS.manuscript = function(root){
  PAGE_RENDERERS.write(root);
};

// ─── WRITE ───
PAGE_RENDERERS.write = function(root){
  root.innerHTML = `
    <div class="write-wrap">
      <div class="chapter-controls" id="chapterControls"></div>
      <div class="write-toolbar" id="writeToolbar"></div>
      <div class="write-canvas" id="writeCanvas">
        <div class="write-doc" id="editor" contenteditable="true" spellcheck="false"></div>
      </div>
    </div>
  `;
  // Always render the strip — the renderer labels it Scene / Subscene in
  // screenplay and Chapter / Subchapter in every other mode.
  try { if (typeof renderChapterControls === 'function') renderChapterControls(); }
  catch (e) { console.warn('chapter controls failed:', e); }
  if(window.WRITE && window.WRITE.init) window.WRITE.init();
  if(window.ScriptForgeSplit) window.ScriptForgeSplit.afterRender();

};



// ─── READ ───
PAGE_RENDERERS.read = function(root){
  const c = curCh();
  const html = c?.content || '';
  const pages = paginateRead(html, 1800);
  D()._readingPages = pages;
  D()._readingPage = Math.min(D()._readingPage || 0, Math.max(0, pages.length - 1));

  root.innerHTML = `
    <div class="read-wrap">
      <div class="read-top">
        <div>
          <div style="font-family:var(--display);font-size:16px;font-weight:600;">${esc(c?.title || 'Reading')}</div>
          <div class="tiny muted">${pages.length} page${pages.length === 1 ? '' : 's'}</div>
        </div>
        <div class="page-actions">
          <button class="btn btn-ghost" data-act="read-tts"><i class="bi bi-volume-up"></i> Read aloud</button>
          <button class="btn btn-ghost" data-act="read-font-plus"><i class="bi bi-zoom-in"></i></button>
          <button class="btn btn-ghost" data-act="read-font-minus"><i class="bi bi-zoom-out"></i></button>
        </div>
      </div>
      <div class="read-body" style="position:relative;">
        <button class="read-nav prev" data-act="read-prev"><i class="bi bi-chevron-left"></i></button>
        <div class="read-page" id="readPage"></div>
        <button class="read-nav next" data-act="read-next"><i class="bi bi-chevron-right"></i></button>
      </div>
      <div class="read-foot">
        <span>Page <strong id="readNum">1</strong> of <strong id="readTotal">${pages.length}</strong></span>
        <div class="read-progress"><div class="read-progress-fill" id="readProg" style="width:0%"></div></div>
        <span id="readWords">0 words</span>
      </div>
    </div>
  `;
  renderReadPage();
};

function paginateRead(html, perPage){
  const d = document.createElement('div');
  d.innerHTML = html || '<p></p>';
  const blocks = Array.from(d.children);
  if(!blocks.length) return ['<p>Nothing to read yet.</p>'];
  const pages = [];
  let cur = '', len = 0;
  for(const b of blocks){
    const L = b.textContent.length;
    if(len + L > perPage && cur.trim()){ pages.push(cur); cur = ''; len = 0; }
    cur += b.outerHTML;
    len += L;
  }
  if(cur.trim()) pages.push(cur);
  return pages.length ? pages : ['<p></p>'];
}

function renderReadPage(){
  const el = $('readPage');
  if(!el) return;
  const d = D();
  const pages = d._readingPages || [];
  const idx = d._readingPage || 0;
  el.innerHTML = pages[idx] || '';
  $('readNum').textContent = idx + 1;
  $('readTotal').textContent = pages.length;
  const pct = pages.length > 1 ? (idx / (pages.length - 1)) * 100 : 100;
  $('readProg').style.width = pct + '%';
  const t = pages.join(' ');
  const tmp = document.createElement('div');
  tmp.innerHTML = t;
  const wc = tmp.innerText.trim() ? tmp.innerText.trim().split(/\s+/).length : 0;
  $('readWords').textContent = wc + ' words';
  el.scrollTop = 0;
}

// ─── DRAFT ─── paged list (5 per page, like the player playlist) + writing pane
let DRAFT_PER_PAGE = 5;
function draftMeasurePerPage(){
  const rows = document.getElementById('draftRows');
  if(!rows) return DRAFT_PER_PAGE;
  const probe = rows.querySelector('.draft-row');
  const rh = (probe && probe.offsetHeight) || 40;      /* real row height */
  const avail = rows.clientHeight - 8;
  if(avail < rh) return DRAFT_PER_PAGE;                /* not laid out yet → keep last value */
  return Math.max(1, Math.floor(avail / rh));
}


let _draftSel = 0, _draftPage = 0;

const DRAFT_SIZES = [12,13,14,15,16,17,18,20,22,24,28];

function draftFontList(){
  let list = [];
  if(typeof FONTS !== 'undefined' && Array.isArray(FONTS)){
    list = FONTS.map(function(x){
      if(typeof x === 'string') return { name:x, f:x };
      return { name:x.name || x.f || 'Font', f:x.f || x.value || x.name };
    }).filter(function(x){ return !!x.f; });
  }
  if(!list.length) list = [{ name:'System', f:'' }];
  return list;
}

/* the app's own dropdown = <select class="sel"> turned into a .dd-card by
   enhanceSelects() (settings.js) — rebuilt whenever the value changes */
/* The draft pane uses the app's own dropdown look (see draftBuildDrops).
   The <select> elements stay in the DOM, hidden, as the value holders. */
function draftRebuildDd(){ draftSyncDrops(); }


/* The Font / Size menus are placed with fixed coordinates: right-aligned to
   their button, then pulled back inside the window. No pane width can push
   them off the screen. */
/* Every property here is written with priority: the stylesheet owns these
   lists with !important rules, so a normal inline value would lose and the
   menu would sit at left:0 of its pane (off the right edge of the screen). */
function ddSet(el, prop, val){
  try{ el.style.setProperty(prop, val, 'important'); }
  catch(e){ el.style[prop] = val; }
}
function ddClear(el, props){
  props.forEach(function(p){ try{ el.style.removeProperty(p); }catch(e){} });
}
function clampDraftDrop(drop){
  const btn  = drop.querySelector('.draft-drop-btn');
  const list = drop.querySelector('.draft-drop-list');
  if(!btn || !list) return;
  ddSet(list, 'display', 'block');
  const b = btn.getBoundingClientRect();
  const w = list.offsetWidth || 200;
  const h = list.offsetHeight || 200;
  const vw = window.innerWidth, vh = window.innerHeight;
  let left = b.right - w;                                    /* right edge = the button's */
  left = Math.max(8, Math.min(left, vw - w - 8));
  let top = b.bottom + 5;
  if(top + h > vh - 8) top = Math.max(8, b.top - h - 5);
  ddSet(list, 'position', 'fixed');
  ddSet(list, 'right', 'auto');
  ddSet(list, 'left', Math.round(left) + 'px');
  ddSet(list, 'top', Math.round(top) + 'px');
  ddSet(list, 'max-height', Math.round(Math.max(140, Math.min(280, vh - top - 12))) + 'px');
}
function draftCloseDrops(){
  document.querySelectorAll('.draft-drop.open').forEach(function(x){ x.classList.remove('open'); });
  document.querySelectorAll('.draft-drop-list').forEach(function(l){
    ddClear(l, ['display','position','left','top','right','max-height']);
  });
}
window.clampDraftDrop = clampDraftDrop;
window.addEventListener('resize', function(){
  document.querySelectorAll('.draft-drop.open').forEach(function(d){ clampDraftDrop(d); });
});

function draftSyncDrops(){
  const d = (D().drafts || [])[_draftSel];
  const fSel = $('draftFont'), sSel = $('draftSize');
  const fontVal = (d && d.font) || (fSel && fSel.value) || '';
  const sizeVal = String((d && d.size) || (sSel && sSel.value) || 15);
  const hit = draftFontList().find(function(x){ return x.f === fontVal; });
  const fv = $('draftFontVal'), sv = $('draftSizeVal');
  if(fv) fv.textContent = hit ? hit.name : (fontVal ? fontVal : 'Font');
  if(sv) sv.textContent = sizeVal + ' px';
  document.querySelectorAll('#draftFontList .draft-drop-item').forEach(function(b){
    b.classList.toggle('on', b.dataset.ddValue === fontVal);
  });
  document.querySelectorAll('#draftSizeList .draft-drop-item').forEach(function(b){
    b.classList.toggle('on', b.dataset.ddValue === sizeVal);
  });
}

document.addEventListener('click', function(e){
  const tg = e.target.closest('[data-dd-toggle]');
  if(tg){
    e.preventDefault();
    const drop = tg.closest('.draft-drop');
    const open = drop && !drop.classList.contains('open');
    draftCloseDrops();
    if(drop && open){
      drop.classList.add('open');
      requestAnimationFrame(function(){ clampDraftDrop(drop); });
    }
    return;
  }
  const pick = e.target.closest('[data-dd-pick]');
  if(pick){
    e.preventDefault();
    const kind = pick.dataset.ddPick;
    const sel = (kind === 'font') ? $('draftFont') : $('draftSize');
    if(sel){ sel.value = pick.dataset.ddValue; sel.dispatchEvent(new Event('change', { bubbles:true })); }
    draftCloseDrops();
    draftSyncDrops();
    return;
  }
  if(!e.target.closest('.draft-drop')) draftCloseDrops();
}, true);

PAGE_RENDERERS.draft = function(root){
  root.innerHTML = `
    <div class="draft-split">
      <aside class="draft-list">
        <div class="draft-list-head">
          <button class="icon-btn-sm" data-act="add-draft" title="New draft"><i class="bi bi-plus-lg"></i></button>
          <span class="draft-pager">
            <button class="mv-pager-btn" data-draft-page="-1" title="Previous"><i class="bi bi-chevron-left"></i></button>
            <span class="vpl-range" id="draftRange">0</span>
            <button class="mv-pager-btn" data-draft-page="1" title="Next"><i class="bi bi-chevron-right"></i></button>
          </span>
        </div>
        <div class="draft-rows" id="draftRows"></div>
      </aside>
      <section class="draft-pane">
        <header class="draft-pane-head">
          <button class="ol-btn ol-btn-icon" data-typop="draft" title="Font, size and leading"><i class="bi bi-fonts"></i></button>
          <div class="draft-drop" id="draftFontDrop">
            <button type="button" class="draft-drop-btn" data-dd-toggle="font" title="Font">
              <i class="bi bi-fonts"></i><span class="draft-drop-val" id="draftFontVal">Font</span><i class="bi bi-chevron-down draft-drop-caret"></i>
            </button>
            <div class="draft-drop-list" id="draftFontList"></div>
          </div>
          <div class="draft-drop" id="draftSizeDrop">
            <button type="button" class="draft-drop-btn" data-dd-toggle="size" title="Size">
              <span class="draft-drop-val" id="draftSizeVal">15</span><i class="bi bi-chevron-down draft-drop-caret"></i>
            </button>
            <div class="draft-drop-list" id="draftSizeList"></div>
          </div>
        </header>
        <textarea class="draft-pane-body" id="draftBody" placeholder="Write here — plain text." spellcheck="true"></textarea>
      </section>
    </div>`;

  const f = $('draftFont'), s = $('draftSize');
  if(f) f.innerHTML = draftFontList().map(x => `<option value="${esc(x.f)}">${esc(x.name)}</option>`).join('');
  if(s) s.innerHTML = DRAFT_SIZES.map(n => `<option value="${n}">${n}</option>`).join('');

  renderDrafts();
  draftSyncDrops();
};

let _draftRowH = 0;

function draftPerPage(){
  const rows = $('draftRows');
  const h = (rows && rows.clientHeight) ? rows.clientHeight : 0;
  if(!h) return DRAFT_PER_PAGE;
  return Math.max(1, Math.floor(h / (_draftRowH || 30)));
}

function renderDrafts(){
  const rows = $('draftRows');
  if(!rows) return;
  DRAFT_PER_PAGE = draftMeasurePerPage();
  const list = D().drafts || [];
  const per  = draftPerPage();
  const pages = Math.max(1, Math.ceil(list.length / per));

  if(list.length) _draftSel = Math.max(0, Math.min(_draftSel, list.length - 1));
  else { _draftSel = 0; _draftPage = 0; }

  _draftPage = Math.max(0, Math.min(_draftPage, pages - 1));

  const from = _draftPage * per;
  const slice = list.slice(from, from + per);

  rows.innerHTML = slice.length
    ? slice.map(function(d, k){
        const i = from + k;
        return '<div class="draft-row' + (i === _draftSel ? ' on' : '') + '" data-draft-pick="' + i + '">' +
            '<span class="draft-row-num">' + (i + 1) + '</span>' +
            '<span class="draft-row-title">' + esc(d.title || 'Untitled draft') + '</span>' +
            '<span class="draft-row-acts">' +
              '<button class="draft-act" data-draft-rename="' + i + '" title="Rename">' +
                '<i class="bi bi-pencil"></i>' +
              '</button>' +
              '<button class="draft-act" data-draft-del="' + i + '" title="Remove">' +
                '<svg width="10" height="10" viewBox="0 0 10 10" fill="none">' +
                  '<path d="M2 2L8 8M8 2L2 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
                '</svg>' +
              '</button>' +
            '</span>' +
          '</div>';
      }).join('')
    : '<div class="draft-empty">No drafts yet</div>';

  /* learn the real row height once, then refit the page to the panel */
  if(!_draftRowH){
    const r0 = rows.querySelector('.draft-row');
    if(r0){
      _draftRowH = r0.offsetHeight + 2;
      if(draftPerPage() !== per){ renderDrafts(); return; }
    }
  }

  const range = $('draftRange');
  if(range) range.textContent = list.length ? ((from + 1) + '–' + Math.min(from + per, list.length)) : '0';
  const prev = document.querySelector('[data-draft-page="-1"]');
  const next = document.querySelector('[data-draft-page="1"]');
  if(prev) prev.disabled = _draftPage <= 0;
  if(next) next.disabled = _draftPage >= pages - 1;

  const d = list[_draftSel];
  const t = $('draftTitle'), b = $('draftBody'), f = $('draftFont'), s = $('draftSize');

  if(t){
    t.disabled = !d;
    t.value = d ? (d.title || '') : '';
    if(d) t.setAttribute('data-draft-title', _draftSel); else t.removeAttribute('data-draft-title');
  }
  if(b){
    b.disabled = !d;
    b.value = d ? (d.body || '') : '';
    if(d) b.setAttribute('data-draft-body', _draftSel); else b.removeAttribute('data-draft-body');
    b.style.fontFamily = (d && d.font) ? d.font : '';
    b.style.fontSize = (((d && d.size) || 15)) + 'px';
  }
  if(f) f.value = (d && d.font) ? d.font : '';
  if(s) s.value = String((d && d.size) || 15);
  draftRebuildDd();
  if(typeof draftSyncDrops === 'function') draftSyncDrops();
}

function draftToolbarSync(){
  const d = (D().drafts || [])[_draftSel];
  if(!d) return;
  const f = $('draftFont'), s = $('draftSize'), b = $('draftBody');
  if(f) d.font = f.value;
  if(s) d.size = parseInt(s.value, 10) || 15;
  if(b){ b.style.fontFamily = d.font || ''; b.style.fontSize = d.size + 'px'; }
  save();
}

/* pick · page · rename */
document.addEventListener('click', function(e){
  const pick = e.target.closest('[data-draft-pick]');
  if(pick && !e.target.closest('button')){
    _draftSel = parseInt(pick.dataset.draftPick, 10) || 0;
    save(); renderDrafts(); return;
  }
    const add = e.target.closest('[data-act="add-draft"]');
  if(add){
    e.preventDefault();
    e.stopImmediatePropagation();        /* keep any older handler from firing too */
    const list = D().drafts || (D().drafts = []);
    list.unshift({
      id: (typeof uid === 'function' ? uid() : String(Date.now())),
      title:'', sub:'', body:'', created: Date.now()
    });
    _draftSel = 0; _draftPage = 0;
    save(); renderDrafts();
    const t = $('draftTitle');
    if(t){ t.focus(); t.select(); }
    return;
  }
  const del = e.target.closest('[data-draft-del]');
  if(del){
    e.preventDefault(); e.stopImmediatePropagation();
    const list = D().drafts || [];
    const i = parseInt(del.dataset.draftDel, 10);
    const d = list[i];
    if(!d) return;
    if(!confirm('Remove "' + (d.title || 'this draft') + '"? Cannot be undone.')) return;
    list.splice(i, 1);
    if(_draftSel >= list.length) _draftSel = Math.max(0, list.length - 1);
    save(); renderDrafts();
    if(typeof toast === 'function') toast('Draft removed');
    return;
  }

  const pg = e.target.closest('[data-draft-page]');
  if(pg){
    e.preventDefault();
    const pages = Math.max(1, Math.ceil((D().drafts || []).length / DRAFT_PER_PAGE));
    _draftPage = Math.max(0, Math.min(_draftPage + (parseInt(pg.dataset.draftPage, 10) || 1), pages - 1));
    renderDrafts(); return;
  }
  const ren = e.target.closest('[data-draft-rename]');
  if(ren){
    e.preventDefault();
    const t = $('draftTitle');
    if(t){ t.focus(); t.select(); }
    return;
  }
  /* the dropdown card writes .value on the hidden <select> — resync after it */
  if(e.target.closest('.draft-pane-head .stats-cat-item')) setTimeout(draftToolbarSync, 0);
}, true);

const draftSaveSoon = (typeof debounce === 'function') ? debounce(function(){ save(); }, 600) : function(){ save(); };

document.addEventListener('input', function(e){
  const t = e.target;
  if(!t) return;
  const d = (D().drafts || [])[_draftSel];
  if(t.id === 'draftTitle'){
    if(d){ d.title = t.value; draftSaveSoon(); }
    const row = document.querySelector('.draft-row.on .draft-row-title');
    if(row) row.textContent = t.value || 'Untitled draft';
  }
  if(t.id === 'draftBody' && d){ d.body = t.value; draftSaveSoon(); }
}, true);

document.addEventListener('change', function(e){
  if(e.target && (e.target.id === 'draftFont' || e.target.id === 'draftSize')) draftToolbarSync();
}, true);



// ─── NOTES ───
PAGE_RENDERERS.notes = function(root){
  root.innerHTML = `
    <div class="page-head">
      <div>
        <h1 class="page-title"><i class="bi bi-sticky"></i> Notes</h1>
        <div class="page-sub">Quick scratchpad — anything goes</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" data-act="add-note"><i class="bi bi-plus-lg"></i> New note</button>
      </div>
    </div>
    <div class="draft-grid" id="notesGrid"></div>
  `;
  renderNotes();
};

function renderNotes(){
  const g = $('notesGrid');
  if(!g) return;
  if(!D().notes.length){
    g.innerHTML = `<div class="pages-empty"><i class="bi bi-sticky"></i>No notes yet</div>`;
    return;
  }
  g.innerHTML = '';
  D().notes.forEach((n, i) => {
    const c = document.createElement('div');
    c.className = 'draft-card';
    c.innerHTML = `
      <div class="draft-card-head">
        <input class="draft-card-title" value="${esc(n.title || '')}" placeholder="Note title" data-note-title="${i}">
        <button class="icon-btn-sm" data-note-del="${i}"><i class="bi bi-trash"></i></button>
      </div>
      <textarea class="draft-card-body" data-note-body="${i}" placeholder="Note text...">${esc(n.body || '')}</textarea>
      <div class="draft-card-meta">
        <span>${new Date(n.created).toLocaleDateString()}</span>
      </div>
    `;
    g.appendChild(c);
  });
}

// ─── PLAN (outline/beats) ───
PAGE_RENDERERS.plan = function(root){
  root.innerHTML = `
    <div class="page-head">
      <div>
        <h1 class="page-title"><i class="bi bi-list-nested"></i> Plan</h1>
        <div class="page-sub">Story beats & outline</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" data-act="add-beat"><i class="bi bi-plus-lg"></i> Add beat</button>
        <button class="btn btn-ghost" data-act="preset-plan"><i class="bi bi-magic"></i> Preset</button>
      </div>
    </div>
    <div id="beatList"></div>
  `;
  renderBeats();
};

function renderBeats(){
  const l = $('beatList');
  if(!l) return;
  if(!D().beats.length){
    l.innerHTML = `<div class="pages-empty"><i class="bi bi-list-nested"></i>No beats yet</div>`;
    return;
  }
  l.innerHTML = '';
  D().beats.forEach((b, i) => {
    const row = document.createElement('div');
    row.className = 'beat';
    row.style.marginLeft = (b.level || 0) * 24 + 'px';
    row.innerHTML = `
      <button class="icon-btn-sm" data-beat-indent="${i}"><i class="bi bi-chevron-right"></i></button>
      <button class="icon-btn-sm" data-beat-outdent="${i}"><i class="bi bi-chevron-left"></i></button>
      <select class="beat-type" data-beat-type="${i}">
        ${['beat','scene','chapter','act','subplot','reveal','action'].map(t =>
          `<option value="${t}" ${b.type === t ? 'selected' : ''}>${t}</option>`).join('')}
      </select>
      <input class="beat-input" value="${esc(b.text || '')}" placeholder="Beat description..." data-beat-text="${i}">
      <button class="icon-btn-sm" data-beat-del="${i}"><i class="bi bi-trash"></i></button>
    `;
    l.appendChild(row);
  });
}

// ─── BOARD ───
PAGE_RENDERERS.board = function(root){
  root.innerHTML = `<div class="board-wrap" id="boardWrap"></div>`;
  renderKanban();
};

function renderKanban(){
  const w = $('boardWrap');
  if(!w) return;
  w.innerHTML = '';
  D().kanban.columns.forEach(col => {
    const c = document.createElement('div');
    c.className = 'col';
    c.innerHTML = `
      <div class="col-head">
        <input class="col-title" value="${esc(col.title)}" data-col-title="${col.id}">
        <span class="col-count">${col.cards.length}</span>
        <button class="icon-btn-sm" data-col-del="${col.id}"><i class="bi bi-trash"></i></button>
      </div>
      <div class="col-body" data-col-body="${col.id}"></div>
      <button class="btn btn-ghost" style="margin-top:8px;justify-content:center;border:1px dashed var(--line-2);" data-card-add="${col.id}">
        <i class="bi bi-plus-lg"></i> Add
      </button>
    `;
    const body = c.querySelector('.col-body');
    col.cards.forEach(card => {
      const kc = document.createElement('div');
      kc.className = 'kcard';
      kc.draggable = true;
      kc.dataset.cardId = card.id;
      kc.dataset.colId = col.id;
      kc.innerHTML = `
        <div class="kcard-title">${esc(card.title)}</div>
        ${card.desc ? `<div class="kcard-desc">${esc(card.desc.slice(0, 100))}</div>` : ''}
        <div style="display:flex;gap:2px;margin-top:6px;opacity:0.6;">
          <button class="icon-btn-sm" data-card-edit="${card.id}"><i class="bi bi-pencil"></i></button>
          <button class="icon-btn-sm" data-card-del="${card.id}"><i class="bi bi-trash"></i></button>
        </div>
      `;
      kc.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', JSON.stringify({cardId: card.id, fromCol: col.id}));
        kc.style.opacity = '0.4';
      });
      kc.addEventListener('dragend', () => { kc.style.opacity = '1'; });
      body.appendChild(kc);
    });
    body.addEventListener('dragover', e => { e.preventDefault(); body.classList.add('dragover'); });
    body.addEventListener('dragleave', () => body.classList.remove('dragover'));
    body.addEventListener('drop', e => {
      e.preventDefault();
      body.classList.remove('dragover');
      try{
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        moveCard(data.cardId, data.fromCol, col.id);
      }catch(err){}
    });
    w.appendChild(c);
  });
  const addCol = document.createElement('button');
  addCol.className = 'col';
  addCol.style.cssText = 'flex:0 0 200px;background:transparent;border:2px dashed var(--line-2);color:var(--ink-3);cursor:pointer;';
  addCol.dataset.act = 'add-column';
  addCol.innerHTML = `<div style="padding:40px 20px;text-align:center;font-size:12.5px;font-weight:600;"><i class="bi bi-plus-lg" style="font-size:20px;display:block;margin-bottom:8px;"></i>Add column</div>`;
  w.appendChild(addCol);
}

// ─── TIMELINE ───
PAGE_RENDERERS.timeline = function(root){
  root.innerHTML = `
    <div class="page-head">
      <div>
        <h1 class="page-title"><i class="bi bi-git"></i> Timeline</h1>
        <div class="page-sub">Chronological order</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" data-act="add-event"><i class="bi bi-plus-lg"></i> Add event</button>
      </div>
    </div>
    <div id="timelineList"></div>
  `;
  renderTimeline();
};

function renderTimeline(){
  const c = $('timelineList');
  if(!c) return;
  if(!D().timeline.length){
    c.innerHTML = `<div class="pages-empty"><i class="bi bi-git"></i>No events yet</div>`;
    return;
  }
  c.innerHTML = '';
  D().timeline.forEach((ev, i) => {
    const item = document.createElement('div');
    item.className = 'time-event';
    item.style.cssText = 'margin-left:24px;padding-left:20px;border-left:2px solid var(--line-2);padding-bottom:16px;position:relative;';
    item.innerHTML = `
      <div style="position:absolute;left:-7px;top:4px;width:12px;height:12px;border-radius:50%;background:var(--grad);"></div>
      <div class="time-card" style="padding:12px;">
        <div class="time-card-title">${esc(ev.title)}</div>
        ${ev.date ? `<div class="time-card-date">${esc(ev.date)}</div>` : ''}
        ${ev.desc ? `<div class="time-card-desc">${esc(ev.desc)}</div>` : ''}
        <div style="display:flex;gap:4px;margin-top:8px;">
          <button class="icon-btn-sm" data-event-edit="${i}"><i class="bi bi-pencil"></i></button>
          <button class="icon-btn-sm" data-event-del="${i}"><i class="bi bi-trash"></i></button>
        </div>
      </div>
    `;
    c.appendChild(item);
  });
}

// ─── CAST ───
PAGE_RENDERERS.cast = function(root){
  root.innerHTML = `
    <div class="page-head">
      <div>
        <h1 class="page-title"><i class="bi bi-people-fill"></i> Cast</h1>
        <div class="page-sub">Characters, locations, items, concepts</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" data-act="add-cast"><i class="bi bi-plus-lg"></i> New entry</button>
      </div>
    </div>
    <div class="cast-grid" id="castGrid"></div>
  `;
  renderCast();
};

function renderCast(){
  const g = $('castGrid');
  if(!g) return;
  if(!D().bible.length){
    g.innerHTML = `<div class="pages-empty"><i class="bi bi-people"></i>No cast yet</div>`;
    return;
  }
  g.innerHTML = '';
  D().bible.forEach((e, i) => {
    const init = (e.name || '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
    const c = document.createElement('div');
    c.className = 'cast-card';
    c.innerHTML = `
      <div class="cast-head">
        <div class="cast-avatar">${esc(init)}</div>
        <input class="cast-name" value="${esc(e.name || '')}" placeholder="Name" data-cast-name="${i}">
        <button class="icon-btn-sm" data-cast-del="${i}"><i class="bi bi-trash"></i></button>
      </div>
      <select class="sel" data-cast-type="${i}" style="font-size:11px;padding:4px 8px;">
        ${['character','location','item','concept','organization','event'].map(t =>
          `<option value="${t}" ${e.type === t ? 'selected' : ''}>${t}</option>`).join('')}
      </select>
      <textarea class="cast-details" data-cast-details="${i}" placeholder="Role, description, motivations...">${esc(e.details || '')}</textarea>
    `;
    g.appendChild(c);
  });
}

// ─── RESEARCH ───
PAGE_RENDERERS.research = function(root){
  root.innerHTML = `
    <div class="page-head">
      <div>
        <h1 class="page-title"><i class="bi bi-link-45deg"></i> Research</h1>
        <div class="page-sub">Sources, references, and notes</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" data-act="add-url"><i class="bi bi-link-45deg"></i> Add URL</button>
        <button class="btn btn-ghost" data-act="web-search"><i class="bi bi-globe2"></i> Web search</button>
      </div>
    </div>
    <div class="ref-list" id="refList"></div>
  `;
  renderReferences();
};

function renderReferences(){
  const l = $('refList');
  if(!l) return;
  if(!D().references.length){
    l.innerHTML = `<div class="pages-empty"><i class="bi bi-link-45deg"></i>No references yet</div>`;
    return;
  }
  l.innerHTML = '';
  D().references.forEach((r, i) => {
    const icons = {url:'link-45deg',note:'sticky',text:'file-text',bible:'book'};
    const c = document.createElement('div');
    c.className = 'ref-card';
    c.innerHTML = `
      <div class="ref-head">
        <div class="ref-icon"><i class="bi bi-${icons[r.type] || 'file'}"></i></div>
        <div class="ref-body">
          <div class="ref-title">${esc(r.title)}</div>
          ${r.url ? `<a href="${esc(r.url)}" target="_blank" rel="noopener" class="ref-url">${esc(r.url)}</a>` : ''}
          <div class="ref-preview">${esc((r.content || '').slice(0, 200))}</div>
        </div>
        <div class="ref-actions">
          <button class="ref-act" data-ref-view="${i}" title="View"><i class="bi bi-eye"></i></button>
          <button class="ref-act danger" data-ref-del="${i}" title="Delete"><i class="bi bi-trash"></i></button>
        </div>
      </div>
    `;
    l.appendChild(c);
  });
}

// ─── BOOK — chapter tree + reader pane (same shape as the Draft page) ───
function nbSel(){ return D()._nbSel || null; }
function nbTree(){ if(!D()._nbTree || typeof D()._nbTree !== 'object') D()._nbTree = {}; return D()._nbTree; }
function nbProj(){ const d = D(); return (d.projects || []).find(p => p.id === (d._nbSel || d.currentProject)) || (d.projects || [])[0]; }
function nbFindCh(id){
  const p = nbProj();
  if(!p || !id) return null;
  const hit = flatChs(p.chapters || []).find(x => x.ch.id === id);
  return hit ? hit.ch : null;
}

/* ═══ BOOK — the draft page's shell, one project at a time ═══
   Left pane: the book title top-left, back-to-manuscript top-right, the
   chapter → subchapter tree in the middle, and the player playlists' own
   prev / next pager pinned at the bottom. Right pane: the draft writing
   pane — title row, big plain body — plus preview / edit / publish. */
let _nbPage = 0;
let _nbPer  = 8;
const NB_ROW_H = 30;

function nbMeasure(){
  const el = $('nbTree');
  const h = el ? el.clientHeight : 0;
  if(h) _nbPer = Math.max(1, Math.floor(h / NB_ROW_H));
  return _nbPer;
}
function nbPageSize(){ return _nbPer || 8; }

/* every row the tree is currently showing, chapters then their subchapters */
function nbRowsFlat(){
  const proj = nbProj();
  if(!proj) return [];
  const tree = nbTree();
  const out = [];
  (function walk(list, depth){
    (list || []).forEach(function(ch){
      const kids = ch.children || [];
      const open = depth > 0 ? true : !!tree[ch.id];
      out.push({ ch:ch, depth:depth, kids:kids.length, open:open });
      if(kids.length && open) walk(kids, depth + 1);
    });
  })(proj.chapters || [], 0);
  return out;
}

PAGE_RENDERERS.notebook = function(root){
  root.innerHTML = `
    <div class="draft-split">
      <aside class="draft-list">
        <div class="draft-list-head">
          <span class="draft-list-label" id="nbBookTitle">Book</span>
          <span class="draft-list-acts">
            <button class="icon-btn-sm" data-nb-manuscript title="Back to manuscript"><i class="bi bi-arrow-return-left"></i></button>
          </span>
        </div>
        <div class="draft-rows" id="nbTree"></div>
        <div class="nb-pager">
          <button class="mv-pager-btn" data-nb-page="-1" title="Previous"><i class="bi bi-chevron-left"></i></button>
          <span class="vpl-range" id="nbRange">0</span>
          <button class="mv-pager-btn" data-nb-page="1" title="Next"><i class="bi bi-chevron-right"></i></button>
        </div>
      </aside>
      <section class="draft-pane" id="nbReader"></section>
    </div>`;
  renderNbLeft();
  renderNbRight();
  /* no height until the panel is laid out: measure once, then refit */
  requestAnimationFrame(function(){
    const before = _nbPer;
    nbMeasure();
    if(_nbPer !== before) renderNbTree();
  });
};
/* outside callers (app.js re-renders) keep working */
function renderNbLeft(){ renderNbTree(); }
function renderNbRight(){ renderNbReader(); }

function renderNbTree(){
  const el = $('nbTree');
  if(!el) return;
  const d = D();
  const proj = nbProj();
  const titleEl = $('nbBookTitle');
  if(titleEl) titleEl.textContent = proj ? proj.name : 'Book';

  if(!proj){
    el.innerHTML = '<div class="draft-empty">No books yet</div>';
    paintNbPager(0, 0, 0);
    return;
  }
  if(!d._nbSel) d._nbSel = proj.id;

  const script = (S.mode === 'screenplay' || S.mode === 'tv' || S.mode === 'stage');
  const labelAt = function(depth){
    return depth ? (script ? 'Subscene' : 'Subchapter') : (script ? 'Scene' : 'Chapter');
  };
  const all = nbRowsFlat();
  const per = nbPageSize();
  const pages = Math.max(1, Math.ceil(all.length / per));
  _nbPage = Math.max(0, Math.min(_nbPage, pages - 1));
  const from = _nbPage * per;
  const slice = all.slice(from, from + per);

  el.innerHTML = slice.length ? slice.map(function(r){
    const ch = r.ch;
    return '<div class="nb-tree-row' + (ch.id === d._nbOpenCh ? ' on' : '') + (r.depth ? ' sub' : '') + '"'
      + ' data-nb-ch="' + esc(ch.id) + '" style="padding-left:' + (6 + r.depth * 16) + 'px">'
      + (r.kids
          ? '<button class="nb-twist' + (r.open ? ' open' : '') + '" data-nb-twist="' + esc(ch.id) + '"><i class="bi bi-chevron-right"></i></button>'
          : '<span class="nb-twist"></span>')
      + '<span class="nb-tree-name">' + esc(ch.title || ('Untitled ' + labelAt(r.depth))) + '</span>'
      + '<span class="nb-tree-acts">'
      +   '<button class="draft-act" data-nb-ch-rename="' + esc(ch.id) + '" title="Rename"><i class="bi bi-pencil"></i></button>'
      +   '<button class="draft-act" data-nb-ch-del="' + esc(ch.id) + '" title="Remove"><i class="bi bi-trash"></i></button>'
      + '</span></div>';
  }).join('') : '<div class="draft-empty">No sections yet</div>';

  paintNbPager(all.length ? from + 1 : 0, all.length ? Math.min(from + per, all.length) : 0, pages);
}

function paintNbPager(from, to, pages){
  const range = $('nbRange');
  if(range) range.textContent = to ? (from + '–' + to) : '0';
  const prev = document.querySelector('[data-nb-page="-1"]');
  const next = document.querySelector('[data-nb-page="1"]');
  if(prev) prev.disabled = _nbPage <= 0;
  if(next) next.disabled = _nbPage >= (pages || 1) - 1;
}

function renderNbReader(){
  const el = $('nbReader');
  if(!el) return;
  const d = D();
  const proj = nbProj();
  el.classList.remove('nb-editing');
  if(!proj){ el.innerHTML = '<div class="draft-empty">Open a book</div>'; return; }
  const ch = nbFindCh(d._nbOpenCh) || (flatChs(proj.chapters || [])[0] || {}).ch;
  if(!ch){ el.innerHTML = '<div class="draft-empty">No sections yet</div>'; return; }
  d._nbOpenCh = ch.id;

  const editing = !!d._nbEditing;
  const ready   = !!ch.pub;
  el.classList.toggle('nb-editing', editing);

  el.innerHTML = `
    <header class="draft-pane-head">
      <input class="draft-pane-title" id="nbChTitle" value="${esc(ch.title || '')}" placeholder="Untitled" autocomplete="off">
      <span class="draft-list-acts">
        <button class="icon-btn-sm${editing ? ' active' : ''}" data-nb-edit-toggle title="${editing ? 'Done editing' : 'Edit'}">${NB_ICON_PENCIL}</button>
        <button class="icon-btn-sm nb-pub${ready ? ' ready' : ''}" data-nb-publish title="${ready ? 'Ready for online publishing — click to unmark' : 'Mark this chapter ready for online publishing'}">${NB_ICON_GLOBE}</button>
        <button class="icon-btn-sm" data-nb-publish-panel title="Publish — metadata, structure, checks, delivery">${NB_ICON_DOWN}</button>
      </span>
    </header>
    <div class="draft-pane-body nb-reader-body" id="nbReaderBody"${editing ? ' contenteditable="true"' : ''}></div>
    ${editing ? nbEditBar() : ''}`;

  const body = $('nbReaderBody');
  body.innerHTML = (ch.content || '');

  if(editing){
    body.focus();
    body.addEventListener('input', function(){
      const c = nbFindCh(d._nbOpenCh);
      if(c){ c.content = body.innerHTML; save(); }
    });
  }
  const t = $('nbChTitle');
  if(t) t.addEventListener('input', function(){
    const c = nbFindCh(d._nbOpenCh);
    if(c){ c.title = t.value; save(); renderNbTree(); }
  });
}

/* ── the floating edit strip — the publisher-app formatting bar ──
   Every button runs its command on the reader pane itself (not the
   editor), then writes the chapter back immediately. */
function nbEditBar(){
  const b   = (cmd, icon, title) => '<button type="button" class="nb-eb" data-nb-cmd="' + cmd + '" title="' + title + '"><i class="bi bi-' + icon + '"></i></button>';
  const blk = (tag, label, title) => '<button type="button" class="nb-eb nb-eb-txt" data-nb-block="' + tag + '" title="' + title + '">' + label + '</button>';
  const sep = '<span class="nb-eb-sep"></span>';
  return '<div class="nb-editbar" id="nbEditBar">'
    + blk('h1','H1','Heading 1') + blk('h2','H2','Heading 2') + blk('h3','H3','Heading 3') + blk('p','¶','Paragraph')
    + sep
    + b('bold','type-bold','Bold') + b('italic','type-italic','Italic')
    + b('underline','type-underline','Underline') + b('strikeThrough','type-strikethrough','Strikethrough')
    + sep
    + b('insertUnorderedList','list-ul','Bullet list') + b('insertOrderedList','list-ol','Numbered list')
    + blk('blockquote','&ldquo;&rdquo;','Quote')
    + sep
    + b('justifyLeft','text-left','Align left') + b('justifyCenter','text-center','Align centre') + b('justifyRight','text-right','Align right') + b('justifyFull','text-paragraph','Justify')
    + sep
    + b('createLink','link-45deg','Add link') + b('unlink','link-45deg','Remove link')
    + b('removeFormat','eraser','Clear formatting')
    + b('undo','arrow-counterclockwise','Undo') + b('redo','arrow-clockwise','Redo')
    + '</div>';
}

function nbExec(cmd, val){
  const body = $('nbReaderBody');
  if(!body) return;
  body.focus();
  try{ document.execCommand(cmd, false, val); }
  catch(err){ console.warn('book cmd', cmd, err); }
  const c = nbFindCh(D()._nbOpenCh);
  if(c){ c.content = body.innerHTML; save(); }
}

/* ── book interactions ── */
/* keep the caret/selection in the pane while a strip button is pressed */
document.addEventListener('mousedown', function(e){
  if(e.target.closest('.nb-editbar')) e.preventDefault();
}, true);

document.addEventListener('click', function(e){
  const blk = e.target.closest('[data-nb-block]');
  if(blk){ e.preventDefault(); nbExec('formatBlock', '<' + blk.dataset.nbBlock + '>'); return; }

  const cmd = e.target.closest('[data-nb-cmd]');
  if(cmd){
    e.preventDefault();
    const c = cmd.dataset.nbCmd;
    if(c === 'createLink'){
      const url = prompt('Link URL:');
      if(url) nbExec('createLink', url);
      return;
    }
    nbExec(c);
    return;
  }

  if(e.target.closest('[data-nb-manuscript]')){
    e.preventDefault(); _nbPage = 0;
    if(typeof goPage === 'function') goPage('manuscript');
    return;
  }

  const pg = e.target.closest('[data-nb-page]');
  if(pg){
    e.preventDefault();
    const per = nbPageSize();
    const pages = Math.max(1, Math.ceil(nbRowsFlat().length / per));
    _nbPage = Math.max(0, Math.min(pages - 1, _nbPage + parseInt(pg.dataset.nbPage, 10) || 0));
    renderNbTree();
    return;
  }

  const tw = e.target.closest('[data-nb-twist]');
  if(tw){ e.preventDefault(); const t = nbTree(); t[tw.dataset.nbTwist] = !t[tw.dataset.nbTwist]; save(); renderNbTree(); return; }

  const row = e.target.closest('#nbTree [data-nb-ch]');
  if(row && !e.target.closest('button')){
    D()._nbOpenCh = row.dataset.nbCh; D()._nbEditing = false; save(); renderNbTree(); renderNbReader(); return;
  }

  const ren = e.target.closest('[data-nb-ch-rename]');
  if(ren){
    e.preventDefault();
    const c = nbFindCh(ren.dataset.nbChRename);
    if(!c) return;
    const name = prompt('Rename:', c.title || '');
    if(!name || name === c.title) return;
    c.title = name.trim(); save(); renderNbTree(); renderNbReader(); toast('Renamed'); return;
  }

  const del = e.target.closest('[data-nb-ch-del]');
  if(del){
    e.preventDefault();
    const id = del.dataset.nbChDel;
    const d = D(), proj = nbProj();
    if(!proj) return;
    const c = nbFindCh(id);
    if(!c) return;
    if(!confirm('Remove "' + (c.title || 'Untitled') + '"? Cannot be undone.')) return;
    (function strip(list){
      return (list || []).filter(x => x.id !== id).map(function(x){ x.children = strip(x.children); return x; });
    })(proj.chapters);
    if(d._nbOpenCh === id) d._nbOpenCh = null;
    save(); renderNbTree(); renderNbReader(); toast('Removed'); return;
  }

  if(e.target.closest('[data-nb-publish-panel]')){ e.preventDefault(); nbPublishOpen(); return; }

  if(e.target.closest('[data-nb-edit-toggle]')){ D()._nbEditing = !D()._nbEditing; save(); renderNbReader(); return; }

  if(e.target.closest('[data-nb-publish]')){
    const d = D();
    const c = nbFindCh(d._nbOpenCh);
    const proj = nbProj();
    if(!c || !proj) return;
    c.pub = !c.pub;
    if(c.pub){
      c.pubAt = Date.now();
      d.published = [{ id:'pub'+Date.now(), name:(proj.name + ' — ' + (c.title || 'Untitled')), date:Date.now() }]
        .concat(d.published || []).slice(0, 40);
      toast('"' + (c.title || 'Untitled') + '" is ready for online publishing');
    } else {
      d.published = (d.published || []).filter(x => !x.name || x.name.indexOf(proj.name + ' — ') !== 0);
      toast('Publishing mark removed');
    }
    save(); renderNbReader(); return;
  }
}, true);

/* right-click a chapter → expand / collapse its subchapters, tree style */
document.addEventListener('contextmenu', function(e){
  const row = e.target.closest('#nbTree [data-nb-ch]');
  if(!row) return;
  e.preventDefault();
  const t = nbTree();
  t[row.dataset.nbCh] = !t[row.dataset.nbCh];
  save(); renderNbTree();
}, true);


// ─── DICTIONARY ───
PAGE_RENDERERS.dictionary = function(root){
  root.innerHTML = `
    <div class="page-head">
      <div>
        <h1 class="page-title"><i class="bi bi-book"></i> Dictionary</h1>
        <div class="page-sub">Look up words, save favorites</div>
      </div>
    </div>
    <div class="dict-bar">
      <input class="tb-input" id="dictQuery" placeholder="Look up a word…" autocomplete="off" spellcheck="false">
      <button class="btn btn-primary" data-act="dict-go"><i class="bi bi-search"></i> Look up</button>
    </div>
    <div id="dictResult" class="dict-card">
      <div class="dict-load">Merriam-Webster — with an open dictionary as the fallback.</div>
    </div>
  `;
  $('dictQuery')?.addEventListener('keydown', e => {
    if(e.key === 'Enter'){ e.preventDefault(); runDictLookup(); }
  });
};

/* Merriam-Webster first — the key never leaves the server (/api/dict).
   If it is not connected yet, the open dictionary answers instead. */
const DICT_SUG_HTML = function(sugs, q){
  return '<p class="dict-miss">No entry for “' + esc(q) + '”. Did you mean: '
    + sugs.map(function(x){ return '<button type="button" class="dict-sug" data-dict-sug="' + esc(x) + '">' + esc(x) + '</button>'; }).join(' ')
    + '</p>';
};

async function runDictLookup(){
  const q = $('dictQuery')?.value.trim();
  if(!q) return;
  const box = $('dictResult');
  if(!box) return;
  box.innerHTML = '<div class="dict-load">Looking up “' + esc(q) + '”…</div>';

  const head = function(word, phonetic, source){
    return '<div class="dict-head">'
      + '<span class="dict-word">' + esc(word || q) + '</span>'
      + (phonetic ? '<span class="dict-ph">' + esc(phonetic) + '</span>' : '')
      + '<span class="dict-src">' + esc(source) + '</span></div>';
  };
  const senses = function(entries){
    let html = '';
    entries.forEach(function(e){
      html += '<div class="dict-pos">' + esc(e.pos || '') + '</div><ol class="dict-defs">';
      (e.defs || []).forEach(function(x){
        html += '<li><span class="dict-def">' + esc(x.def) + '</span>'
             + (x.example ? '<span class="dict-ex">“' + esc(x.example) + '”</span>' : '') + '</li>';
      });
      html += '</ol>';
    });
    return html;
  };

  let mwNote = '';
  try{
    const mwKey = String((S.config && S.config.mwApiKey) || '');
    const r = await fetch('/api/dict?word=' + encodeURIComponent(q) + (mwKey ? '&key=' + encodeURIComponent(mwKey) : ''));
    if(r.ok){
      const d = await r.json();
      if(d && d.ok && d.entries && d.entries.length){ box.innerHTML = head(d.word, d.phonetic, 'Merriam-Webster') + senses(d.entries); return; }
      if(d && d.reason === 'not-found'){
        box.innerHTML = head(q, '', 'Merriam-Webster')
          + (d.suggestions && d.suggestions.length ? DICT_SUG_HTML(d.suggestions, q)
             : '<p class="dict-miss">Merriam-Webster has no entry for “' + esc(q) + '”.</p>');
        return;
      }
      if(d && d.reason === 'no-key'){
        mwNote = '<p class="dict-note">Merriam-Webster is not connected yet — add <code>MW_API_KEY</code> in Settings → Environment and this panel switches over to it. The open dictionary below answers meanwhile.</p>';
      }
    }
  }catch(err){ /* fall through to the open dictionaries */ }

  try{
    const r = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(q)}`);
    if(r.ok){
      const d = await r.json();
      const w = d[0];
      const entries = (w.meanings || []).slice(0, 3).map(function(m){
        return { pos:m.partOfSpeech, defs:(m.definitions || []).slice(0, 3).map(function(x){
          return { def:x.definition, example:x.example || '' };
        }) };
      });
      box.innerHTML = head(w.word, w.phonetic || '', 'Free Dictionary') + senses(entries) + mwNote;
      return;
    }
    const r2 = await fetch(`https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(q)}`);
    if(r2.ok){
      const d2 = await r2.json();
      const en = d2.en?.[0];
      if(en){
        const entries = [{ pos:en.partOfSpeech, defs:(en.definitions || []).slice(0, 4).map(function(x){
          return { def:String(x.definition || '').replace(/<[^>]+>/g, '') };
        }) }];
        box.innerHTML = head(q, '', 'Wiktionary') + senses(entries) + mwNote;
        return;
      }
    }
    throw new Error('Word not found');
  }catch(e){
    box.innerHTML = mwNote + '<div class="dict-miss">' + esc(e.message) + '</div>';
  }
}

/* a suggestion chip looks the word up straight away */
document.addEventListener('click', function(e){
  const sug = e.target.closest('[data-dict-sug]');
  if(!sug) return;
  e.preventDefault();
  const inp = $('dictQuery');
  if(inp) inp.value = sug.dataset.dictSug;
  runDictLookup();
}, true);

// ─── CANVAS ───
PAGE_RENDERERS.canvas = function(root){
  root.innerHTML = `
    <div class="canvas-wrap">
      <div class="canvas-tools">
        <button class="btn btn-ghost" data-cx-tool="select"><i class="bi bi-cursor"></i> Select</button>
        <button class="btn btn-ghost" data-cx-tool="pen"><i class="bi bi-pencil"></i> Pen</button>
        <button class="btn btn-ghost" data-cx-tool="rect"><i class="bi bi-square"></i> Rect</button>
        <button class="btn btn-ghost" data-cx-tool="circle"><i class="bi bi-circle"></i> Circle</button>
        <button class="btn btn-ghost" data-cx-tool="arrow"><i class="bi bi-arrow-right"></i> Arrow</button>
        <button class="btn btn-ghost" data-cx-tool="text"><i class="bi bi-type"></i> Text</button>
        <input type="color" id="cxColor" value="#7c5cff" style="width:34px;height:30px;border-radius:6px;border:1px solid var(--line-2);cursor:pointer;">
        <div style="flex:1;"></div>
        <button class="btn btn-ghost" data-cx-clear><i class="bi bi-trash"></i> Clear</button>
        <button class="btn btn-ghost" data-cx-export><i class="bi bi-download"></i> PNG</button>
      </div>
      <div class="canvas-stage" id="cxStage">
        <canvas id="cxCanvas"></canvas>
      </div>
    </div>
  `;
  if(window.TOOLS?.initCanvas) window.TOOLS.initCanvas();
};

// ─── INSPIRE ───
PAGE_RENDERERS.inspire = function(root){
  root.innerHTML = `
    <div class="page-head">
      <div>
        <h1 class="page-title"><i class="bi bi-lightbulb-fill"></i> Inspire</h1>
        <div class="page-sub">Prompts and exercises for ${currentMode().name}</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" data-act="new-prompt"><i class="bi bi-shuffle"></i> New prompt</button>
      </div>
    </div>
    <div id="inspireBox" style="padding:24px;background:var(--surface-2);border:1px solid var(--line);border-radius:12px;min-height:200px;font-size:15px;line-height:1.7;color:var(--ink);">
      Click "New prompt" to get a writing prompt.
    </div>
    <div class="pages-grid-label" style="margin-top:24px;">
      <i class="bi bi-bookmark"></i> Saved prompts
    </div>
    <div id="savedPrompts"></div>
  `;
};

// ─── STATS (full analytics dashboard) ───
PAGE_RENDERERS.stats = function(root){
  const d = D();
  const modes = MODES;

  // Category selected from either Novel or Screenplay
  const selectedNovel = S.config.statsNovel || 'none';
  const selectedScreenplay = S.config.statsScreenplay || 'none';
  void selectedNovel; void selectedScreenplay;   // read via S.config in paintCat

  root.innerHTML = `
    <div class="stats-page">

      <div class="stats-top">
        <div class="stats-drops">
          <div class="stats-cat-card" data-stats-novel>
            <button type="button" class="stats-cat-title"><i class="bi bi-journal-bookmark"></i> Novel<span class="stats-cat-value">None</span><i class="bi bi-chevron-down stats-cat-caret"></i></button>
            <div class="stats-cat-list">
              <button class="stats-cat-item" data-value="none"><span>None</span><i class="bi bi-check2"></i></button>
              <button class="stats-cat-item" data-value="fiction"><span>Fiction</span><i class="bi bi-check2"></i></button>
            </div>
          </div>
          <div class="stats-cat-card" data-stats-screenplay>
            <button type="button" class="stats-cat-title"><i class="bi bi-film"></i> Screenplay<span class="stats-cat-value">None</span><i class="bi bi-chevron-down stats-cat-caret"></i></button>
            <div class="stats-cat-list">
              <button class="stats-cat-item" data-value="none"><span>None</span><i class="bi bi-check2"></i></button>
              <button class="stats-cat-item" data-value="fiction"><span>Fiction</span><i class="bi bi-check2"></i></button>
            </div>
          </div>
        </div>
        <button class="btn btn-ghost" data-act="stats-export">
          <i class="bi bi-download"></i> Export report
        </button>
      </div>

      <div class="stats-empty" id="statsEmpty">
        <div class="stats-empty-icon"><i class="bi bi-graph-up-arrow"></i></div>
        <div class="stats-empty-text">Select a category to view.</div>
      </div>

      <div class="stats-body" id="statsBody" hidden></div>

      <div class="stats-dayline-wrap" id="statsDayLineWrap" hidden>
        <div class="stats-dayline-head set-card-title">
          <i class="bi bi-calendar2-check"></i>
        </div>
        <div class="stats-dayline" id="statsDayLine"></div>
      </div>
    </div>
  `;

  // Paint + wire the category boxes (Vercel-style scrollable lists)
  const novelBox  = root.querySelector('[data-stats-novel]');
  const screenBox = root.querySelector('[data-stats-screenplay]');

  function paintCat(box, current){
    if(!box) return;
    box.querySelectorAll('.stats-cat-item').forEach(function(item){
      item.classList.toggle('active', item.dataset.value === current);
    });
    const val = box.querySelector('.stats-cat-value');
    if(val) val.textContent = current === 'fiction' ? 'Fiction' : 'None';
  }
  function bindCat(box, otherBox, key, otherKey){
    if(!box) return;
    paintCat(box, S.config[key] || 'none');
    box.addEventListener('click', function(e){
      const title = e.target.closest('.stats-cat-title');
      if(title){ box.classList.toggle('open'); return; }
      const item = e.target.closest('.stats-cat-item');
      if(!item) return;
      S.config[key] = item.dataset.value;
      S.config[otherKey] = 'none';
      paintCat(box, item.dataset.value);
      if(otherBox) paintCat(otherBox, 'none');
      box.classList.remove('open');
      save();
      renderStatsBody();
    });
  }
  // Clicking elsewhere closes any open category dropdown
  if(!document.__statsCatOutside){
    document.__statsCatOutside = true;
    document.addEventListener('click', function(e){
      document.querySelectorAll('.stats-cat-card.open').forEach(function(c){
        if(!c.contains(e.target)) c.classList.remove('open');
      });
    }, true);
  }
  bindCat(novelBox,  screenBox, 'statsNovel',      'statsScreenplay');
  bindCat(screenBox, novelBox,  'statsScreenplay', 'statsNovel');

  renderStatsBody();
  renderDayLine();
};

// ─── DAY LINE ─── one circle per day sitting on a hairline. A day the app
// was opened on is filled white; every other day stays a hollow ring. The
// window always ends on today, so older circles scroll away and new ones
// arrive as the days pass.
function renderDayLine(){
  const el = document.getElementById('statsDayLine');
  if(!el) return;

  const log = (S.config && S.config.openLog) || {};
  const keyOf = (typeof window.dayKey === 'function')
    ? window.dayKey
    : (dt => dt.toISOString().split('T')[0]);

  const now = new Date();
  const DAYS = 21;

  const days = [];
  for(let i = DAYS - 1; i >= 0; i--){
    days.push(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i));
  }

    // The tube is the rail. One 2px line runs through it: a day the app was
  // opened stitches the line together, a day it wasn't leaves a gap.
  el.innerHTML = '<span class="dayline-tube"></span>' + days.map(function(dt, i){
    const opened = !!log[keyOf(dt)];
    const isToday = i === days.length - 1;
    const label = dt.toLocaleDateString('en-US', {weekday:'long', month:'long', day:'numeric'});

    return '<div class="dayline-day' + (opened ? ' opened' : '') + (isToday ? ' today' : '') + '"'
        + ' title="' + label + (opened ? ' — opened' : ' — not opened') + '">'
        + '<span class="dayline-seg"></span>'
      + '</div>';
  }).join('');


}
window.renderDayLine = renderDayLine;

function renderStatsBody(){
  const body = document.getElementById('statsBody');
  const empty = document.getElementById('statsEmpty');
  if(!body) return;

  const novelCat = S.config.statsNovel || 'none';
  const screenCat = S.config.statsScreenplay || 'none';

  // Which mode + category to show?
  let activeModeId = null;
  let activeCatId = null;

  if(novelCat !== 'none'){ activeModeId = 'novel'; activeCatId = novelCat; }
  else if(screenCat !== 'none'){ activeModeId = 'screenplay'; activeCatId = screenCat; }

  // Nothing selected → show empty, hide body
  // The day line follows the same rule as every other stats card: it only
  // appears once Novel or Screenplay has a category selected.
  const railWrap = document.getElementById('statsDayLineWrap');

  if(!activeModeId){
    if(empty) empty.style.display = '';
    body.hidden = true;
    if(railWrap) railWrap.hidden = true;
    return;
  }

  if(empty) empty.style.display = 'none';
  body.hidden = false;
  if(railWrap) railWrap.hidden = false;

  // Gather projects
  const modeData = S.modes[activeModeId] || {};
    const allProjects = Array.isArray(modeData.projects) ? modeData.projects : [];
  const projs = allProjects.filter(p => p.category === activeCatId);

  // Stats
  let totalWords = 0;
  let totalSections = 0;
  projs.forEach(p => {
    totalSections += (p.chapters ? flatChs(p.chapters).length : 0);
    totalWords += (p.chapters ? p.chapters.reduce((a, c) => a + wordCount(c.content), 0) : 0);
  });
  const readMin = Math.round(totalWords / 200);
  const readTime = readMin < 60 ? readMin + ' min' : Math.round(readMin / 60) + ' hr';

  // Today + streak (uses writingLog)
  const log = S.config.writingLog || {};
  const todayKey = new Date().toISOString().split('T')[0];
  const todayWords = log[todayKey] || 0;
  const goal = S.config.dailyGoal || 500;
  const goalPct = Math.min(100, Math.round((todayWords / goal) * 100));

  let streak = 0;
  const cur = new Date();
  while(true){
    const k = cur.toISOString().split('T')[0];
    if(log[k] && log[k] > 0){ streak++; cur.setDate(cur.getDate() - 1); }
    else break;
  }

  // 7-day chart
  const days = [];
  for(let i = 6; i >= 0; i--){
    const dt = new Date();
    dt.setDate(dt.getDate() - i);
    const key = dt.toISOString().split('T')[0];
    days.push({
      label: dt.toLocaleDateString('en-US', {weekday:'short'}),
      words: log[key] || 0
    });
  }
  const maxDay = Math.max(1, ...days.map(x => x.words));
  const weekTotal = days.reduce((a, x) => a + x.words, 0);

  // Content breakdown
    const drafts = Array.isArray(modeData.drafts) ? modeData.drafts.filter(x => x.category === activeCatId).length : 0;
    const notes  = Array.isArray(modeData.notes)  ? modeData.notes.filter(x => x.category === activeCatId).length  : 0;
    const refs   = Array.isArray(modeData.references) ? modeData.references.filter(x => x.category === activeCatId).length : 0;
    // Bible is an object with sub-arrays (characters, locations, etc.) — sum them
  let bible = 0;
  if(modeData.bible && typeof modeData.bible === 'object'){
    Object.keys(modeData.bible).forEach(k => {
      const arr = modeData.bible[k];
      if(Array.isArray(arr)) bible += arr.length;
    });
  }
  const snaps = modeData.versions || [];

  const catLabel = 'Fiction';
  const modeLabel = activeModeId === 'novel' ? 'Novel' : 'Screenplay';

  body.innerHTML = `

        <div class="stats-grid-kpi">
      <div class="stat-card-lg">
        <div class="stat-ico"><i class="bi bi-file-text"></i></div>
        <div class="stat-big">${totalWords.toLocaleString()}</div>
        <div class="stat-lbl">Total words</div>
      </div>
      <div class="stat-card-lg">
        <div class="stat-ico"><i class="bi bi-file-earmark-text"></i></div>
        <div class="stat-big">${totalSections}</div>
        <div class="stat-lbl">Sections</div>
      </div>
      <div class="stat-card-lg">
        <div class="stat-ico"><i class="bi bi-collection"></i></div>
        <div class="stat-big">${projs.length}</div>
        <div class="stat-lbl">Projects</div>
      </div>
      <div class="stat-card-lg">
        <div class="stat-ico"><i class="bi bi-stopwatch"></i></div>
        <div class="stat-big">${readTime}</div>
        <div class="stat-lbl">Reading time</div>
      </div>
    </div>

    <div class="stats-grid-mid">
      <div class="set-card">
        <div class="set-card-title"><i class="bi bi-bullseye"></i> Today's goal</div>
        <div class="stat-row-big">
          <span class="stat-big-sm">${todayWords}</span>
          <span class="stat-sub">/ ${goal} words</span>
        </div>
        <div class="stat-bar"><div class="stat-bar-fill" style="width:${goalPct}%"></div></div>
        <div class="stat-hint">${goalPct}% complete</div>
      </div>
      <div class="set-card">
        <div class="set-card-title"><i class="bi bi-fire"></i> Writing streak</div>
        <div class="stat-row-big">
          <span class="stat-big-sm">${streak}</span>
          <span class="stat-sub">day${streak === 1 ? '' : 's'} in a row</span>
        </div>
        <div class="stat-hint">${streak > 0 ? 'Keep going!' : 'Write today to start a streak'}</div>
      </div>
    </div>

                                <div class="stats-chart-wrap">
      <div class="set-card stats-chart-card">
        <div class="set-card-title"><i class="bi bi-bar-chart"></i> Last 30 days</div>
        <div class="stats-chart-row">
          <div class="stats-wave" id="statsWave"></div>
          <div class="stats-wave-info" id="statsWaveInfo"></div>
        </div>
      </div>
    </div>
  `;

          // ─── Build the 30-day wave chart ───
  const waveEl = document.getElementById('statsWave');
  const infoEl = document.getElementById('statsWaveInfo');

  if(waveEl){
    waveEl.innerHTML = '';

    // Build 30 days
    const days30 = [];
    for(let i = 29; i >= 0; i--){
      const dt = new Date();
      dt.setDate(dt.getDate() - i);
      const key = dt.toISOString().split('T')[0];
      days30.push({ date: dt, key, words: log[key] || 0 });
    }

    const values = days30.map(x => x.words);
    const total = values.reduce((a, b) => a + b, 0);
    const avg = Math.round(total / 30);
    const low = Math.min(...values);
    const high = Math.max(...values);

    // If no data at all, show empty state
    if(total === 0){
      waveEl.innerHTML =
        '<div class="wave-empty">' +
          '<i class="bi bi-activity"></i>' +
          '<div class="wave-empty-title">No writing activity yet</div>' +
          '<div class="wave-empty-sub">Start writing to see your 30-day trend</div>' +
        '</div>';

      if(infoEl){
        infoEl.innerHTML =
          '<div class="stats-wave-info-row"><span class="stats-wave-info-lbl">Low</span><span class="stats-wave-info-val">0</span></div>' +
          '<div class="stats-wave-info-row"><span class="stats-wave-info-lbl">Avg</span><span class="stats-wave-info-val">0</span></div>' +
          '<div class="stats-wave-info-row"><span class="stats-wave-info-lbl">High</span><span class="stats-wave-info-val">0</span></div>' +
          '<div class="stats-wave-info-row"><span class="stats-wave-info-lbl">Total</span><span class="stats-wave-info-val">0</span></div>';
      }
      return;
    }

    const max = Math.max(1, high);

    // ─── SVG dimensions ───
    const W = 800, H = 140;
    const PAD_L = 8, PAD_R = 8, PAD_T = 20, PAD_B = 24;
    const innerW = W - PAD_L - PAD_R;
    const innerH = H - PAD_T - PAD_B;
    const step = innerW / (days30.length - 1);

    // Points
    const points = days30.map((d, i) => ({
      x: PAD_L + i * step,
      y: PAD_T + innerH - ((d.words / max) * innerH)
    }));

    // Smooth path (Catmull-Rom → Bézier)
    function smoothPath(pts){
      if(pts.length < 2) return '';
      let d = 'M ' + pts[0].x + ' ' + pts[0].y;
      for(let i = 0; i < pts.length - 1; i++){
        const p0 = pts[i - 1] || pts[i];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[i + 2] || p2;
        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;
        d += ' C ' + cp1x + ' ' + cp1y + ', ' + cp2x + ' ' + cp2y + ', ' + p2.x + ' ' + p2.y;
      }
      return d;
    }

    const pathD = smoothPath(points);
    const areaD = pathD + ' L ' + (PAD_L + innerW) + ' ' + (PAD_T + innerH) +
                   ' L ' + PAD_L + ' ' + (PAD_T + innerH) + ' Z';

    // ─── Build SVG ───
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.display = 'block';

    // Gradient
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    grad.setAttribute('id', 'waveGrad_' + Date.now());
    grad.setAttribute('x1', '0'); grad.setAttribute('y1', '0');
    grad.setAttribute('x2', '0'); grad.setAttribute('y2', '1');

    const s1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    s1.setAttribute('offset', '0%');
    s1.setAttribute('stop-color', 'var(--ink)');
    s1.setAttribute('stop-opacity', '0.10');

    const s2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    s2.setAttribute('offset', '100%');
    s2.setAttribute('stop-color', 'var(--ink)');
    s2.setAttribute('stop-opacity', '0');

    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
    svg.appendChild(defs);

    // Baseline grid (3 horizontal lines)
    for(let i = 0; i <= 3; i++){
      const y = PAD_T + (innerH / 3) * i;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', PAD_L);
      line.setAttribute('x2', PAD_L + innerW);
      line.setAttribute('y1', y);
      line.setAttribute('y2', y);
      line.setAttribute('stroke', 'var(--line)');
      line.setAttribute('stroke-width', '1');
      line.setAttribute('vector-effect', 'non-scaling-stroke');
      svg.appendChild(line);
    }

    // Area fill
    const area = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    area.setAttribute('d', areaD);
    area.setAttribute('fill', 'url(#' + grad.getAttribute('id') + ')');
    area.setAttribute('stroke', 'none');
    svg.appendChild(area);

    // Line
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathD);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'var(--ink)');
    path.setAttribute('stroke-width', '1.5');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('vector-effect', 'non-scaling-stroke');
    svg.appendChild(path);

    // Dot at highest point
    const highIdx = values.indexOf(high);
    if(highIdx >= 0){
      const hp = points[highIdx];
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', hp.x);
      dot.setAttribute('cy', hp.y);
      dot.setAttribute('r', '3');
      dot.setAttribute('fill', 'var(--ink)');
      svg.appendChild(dot);
    }

    waveEl.appendChild(svg);

    // Info column
    if(infoEl){
      infoEl.innerHTML =
        '<div class="stats-wave-info-row"><span class="stats-wave-info-lbl">Low</span><span class="stats-wave-info-val">' + low + '</span></div>' +
        '<div class="stats-wave-info-row"><span class="stats-wave-info-lbl">Avg</span><span class="stats-wave-info-val">' + avg + '</span></div>' +
        '<div class="stats-wave-info-row"><span class="stats-wave-info-lbl">High</span><span class="stats-wave-info-val">' + high + '</span></div>' +
        '<div class="stats-wave-info-row"><span class="stats-wave-info-lbl">Total</span><span class="stats-wave-info-val">' + total + '</span></div>';
    }
  }
}
window.renderStatsBody = renderStatsBody;
// ─── FORMAT ───
PAGE_RENDERERS.format = function(root){
  root.innerHTML = `
    <div class="page-head">
      <div>
        <h1 class="page-title"><i class="bi bi-sliders"></i> Format</h1>
        <div class="page-sub">Deep formatting for ${currentMode().name}</div>
      </div>
    </div>
    <div id="formatBody"></div>
  `;
  if(window.SETTINGS?.renderFormat) window.SETTINGS.renderFormat();
};

// ─── IMPORT / EXPORT ───
PAGE_RENDERERS.import = function(root){
  root.innerHTML = `
    <div class="page-head">
      <div>
        <h1 class="page-title"><i class="bi bi-box-arrow-in-down"></i> Import / Export</h1>
        <div class="page-sub">Move your work in and out</div>
      </div>
    </div>
    <div class="set-card">
      <div class="set-card-title"><i class="bi bi-box-arrow-in-down"></i> Import</div>
      <div class="chips">
        <button class="chip" data-import="txt"><i class="bi bi-file-text"></i> TXT</button>
        <button class="chip" data-import="md"><i class="bi bi-markdown"></i> Markdown</button>
        <button class="chip" data-import="html"><i class="bi bi-filetype-html"></i> HTML</button>
        <button class="chip" data-import="json"><i class="bi bi-filetype-json"></i> JSON backup</button>
        <button class="chip" data-import="fountain"><i class="bi bi-film"></i> Fountain</button>
        <button class="chip" data-import="paste"><i class="bi bi-clipboard"></i> Paste text</button>
      </div>
    </div>
    <div class="set-card">
      <div class="set-card-title"><i class="bi bi-box-arrow-up"></i> Export</div>
      <div class="chips">
        <button class="chip" data-export="txt"><i class="bi bi-file-text"></i> TXT</button>
        <button class="chip" data-export="html"><i class="bi bi-filetype-html"></i> HTML</button>
        <button class="chip" data-export="md"><i class="bi bi-markdown"></i> Markdown</button>
        <button class="chip" data-export="json"><i class="bi bi-filetype-json"></i> JSON</button>
        <button class="chip" data-export="fountain"><i class="bi bi-film"></i> Fountain</button>
        <button class="chip" data-export="rtf"><i class="bi bi-file-richtext"></i> RTF</button>
        <button class="chip" data-export="latex"><i class="bi bi-filetype-tex"></i> LaTeX</button>
        <button class="chip" data-export="csv"><i class="bi bi-filetype-csv"></i> CSV</button>
        <button class="chip" data-export="epub"><i class="bi bi-book"></i> EPUB</button>
        <button class="chip" data-export="doc"><i class="bi bi-file-word"></i> Word</button>
        <button class="chip" data-export="print"><i class="bi bi-printer"></i> Print / PDF</button>
      </div>
    </div>
  `;
};

// ─── NOVEL special pages ───
PAGE_RENDERERS.chapters = PAGE_RENDERERS.write;
PAGE_RENDERERS.characters = PAGE_RENDERERS.cast;
PAGE_RENDERERS.arcs = function(root){
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title"><i class="bi bi-graph-up-arrow"></i> Character Arcs</h1><div class="page-sub">Track how characters change</div></div></div><div class="pages-empty"><i class="bi bi-graph-up-arrow"></i>Coming soon</div>`;
};
PAGE_RENDERERS.scenes = PAGE_RENDERERS.write;
PAGE_RENDERERS.beatsheet = PAGE_RENDERERS.plan;
PAGE_RENDERERS.shots = function(root){
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title"><i class="bi bi-camera-reels"></i> Shot List</h1><div class="page-sub">Cinematographic shots</div></div><button class="btn btn-primary" data-act="add-shot"><i class="bi bi-plus-lg"></i> Add shot</button></div><div class="pages-empty"><i class="bi bi-camera-reels"></i>Coming soon</div>`;
};
PAGE_RENDERERS.episodes = PAGE_RENDERERS.write;
PAGE_RENDERERS.seasonarc = function(root){
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title"><i class="bi bi-graph-up-arrow"></i> Season Arc</h1></div></div><div class="pages-empty"><i class="bi bi-graph-up-arrow"></i>Coming soon</div>`;
};
PAGE_RENDERERS.acts = PAGE_RENDERERS.write;
PAGE_RENDERERS.blocking = function(root){
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title"><i class="bi bi-signpost-2"></i> Blocking</h1></div></div><div class="pages-empty">Coming soon</div>`;
};
PAGE_RENDERERS.cues = function(root){
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title"><i class="bi bi-soundwave"></i> Cue Sheet</h1></div></div><div class="pages-empty">Coming soon</div>`;
};
PAGE_RENDERERS.stanzas = PAGE_RENDERERS.write;
PAGE_RENDERERS.rhymes = function(root){
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title"><i class="bi bi-music-note-beamed"></i> Rhymes</h1><div class="page-sub">Find rhymes and near-rhymes</div></div></div><div style="display:flex;gap:8px;margin-bottom:16px;"><input class="tb-input" id="rhymeQuery" placeholder="Word to rhyme..." style="flex:1;"><button class="btn btn-primary" data-act="rhyme-go">Find</button></div><div id="rhymeResults" class="pages-empty">Enter a word above</div>`;
};
PAGE_RENDERERS.meter = function(root){
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title"><i class="bi bi-rulers"></i> Meter</h1></div></div><div class="pages-empty">Coming soon</div>`;
};
PAGE_RENDERERS.forms = function(root){
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title"><i class="bi bi-collection"></i> Poetic Forms</h1><div class="page-sub">Sonnet, haiku, villanelle, and more</div></div></div><div class="pages-empty">Coming soon</div>`;
};
PAGE_RENDERERS.verses = PAGE_RENDERERS.write;
PAGE_RENDERERS.chorus = function(root){
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title"><i class="bi bi-megaphone"></i> Chorus Library</h1></div></div><div class="pages-empty">Coming soon</div>`;
};
PAGE_RENDERERS.rhythm = function(root){
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title"><i class="bi bi-activity"></i> Rhythm</h1></div></div><div class="pages-empty">Coming soon</div>`;
};
PAGE_RENDERERS.chords = function(root){
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title"><i class="bi bi-music-note-list"></i> Chord Chart</h1></div></div><div class="pages-empty">Coming soon</div>`;
};
PAGE_RENDERERS.thesis = function(root){
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title"><i class="bi bi-bullseye"></i> Thesis</h1></div></div><div class="pages-empty">Coming soon</div>`;
};
PAGE_RENDERERS.arguments = function(root){
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title"><i class="bi bi-chat-left-text"></i> Arguments</h1></div></div><div class="pages-empty">Coming soon</div>`;
};
PAGE_RENDERERS.evidence = function(root){
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title"><i class="bi bi-file-earmark-text"></i> Evidence</h1></div></div><div class="pages-empty">Coming soon</div>`;
};
PAGE_RENDERERS.citations = function(root){
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title"><i class="bi bi-quote"></i> Citations</h1></div></div><div class="pages-empty">Coming soon</div>`;
};
PAGE_RENDERERS.abstract = function(root){
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title"><i class="bi bi-file-text"></i> Abstract</h1></div></div><textarea class="tb-input" style="width:100%;min-height:300px;padding:16px;font-size:14px;" placeholder="Write your abstract..."></textarea>`;
};
PAGE_RENDERERS.methodology = function(root){
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title"><i class="bi bi-gear"></i> Methodology</h1></div></div><div class="pages-empty">Coming soon</div>`;
};
PAGE_RENDERERS.data = function(root){
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title"><i class="bi bi-bar-chart"></i> Data</h1></div></div><div class="pages-empty">Coming soon</div>`;
};
PAGE_RENDERERS.footnotes = function(root){
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title"><i class="bi bi-1-circle"></i> Footnotes</h1></div></div><div class="pages-empty">Coming soon</div>`;
};
PAGE_RENDERERS.peers = function(root){
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title"><i class="bi bi-journals"></i> Peer References</h1></div></div><div class="pages-empty">Coming soon</div>`;
};
PAGE_RENDERERS.mood = function(root){
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title"><i class="bi bi-emoji-smile"></i> Mood Tracker</h1></div></div><div class="pages-empty">Coming soon</div>`;
};
PAGE_RENDERERS.habits = function(root){
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title"><i class="bi bi-check2-square"></i> Habits</h1></div></div><div class="pages-empty">Coming soon</div>`;
};
PAGE_RENDERERS.prompts = function(root){
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title"><i class="bi bi-lightbulb"></i> Journal Prompts</h1></div></div><div class="pages-empty">Coming soon</div>`;
};
PAGE_RENDERERS.headlines = function(root){
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title"><i class="bi bi-type-h1"></i> Headlines</h1></div></div><div class="pages-empty">Coming soon</div>`;
};
PAGE_RENDERERS.seo = function(root){
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title"><i class="bi bi-search"></i> SEO</h1></div></div><div class="pages-empty">Coming soon</div>`;
};
PAGE_RENDERERS.ctas = function(root){
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title"><i class="bi bi-cursor"></i> CTAs</h1></div></div><div class="pages-empty">Coming soon</div>`;
};
PAGE_RENDERERS.sources = function(root){
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title"><i class="bi bi-link-45deg"></i> Sources</h1></div></div><div class="pages-empty">Coming soon</div>`;
};
PAGE_RENDERERS.factcheck = function(root){
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title"><i class="bi bi-shield-check"></i> Fact Check</h1></div></div><div class="pages-empty">Coming soon</div>`;
};
PAGE_RENDERERS.datelines = function(root){
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title"><i class="bi bi-geo-alt"></i> Datelines</h1></div></div><div class="pages-empty">Coming soon</div>`;
};
PAGE_RENDERERS.panels = function(root){
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title"><i class="bi bi-grid-3x3"></i> Panels</h1></div></div><div class="pages-empty">Coming soon</div>`;
};
PAGE_RENDERERS.script = function(root){
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title"><i class="bi bi-file-text"></i> Comic Script</h1></div></div><div class="pages-empty">Coming soon</div>`;
};
PAGE_RENDERERS.pages = function(root){
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title"><i class="bi bi-file-earmark"></i> Page Layouts</h1></div></div><div class="pages-empty">Coming soon</div>`;
};
PAGE_RENDERERS.illustrations = function(root){
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title"><i class="bi bi-image"></i> Illustrations</h1></div></div><div class="pages-empty">Coming soon</div>`;
};
PAGE_RENDERERS.agelevel = function(root){
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title"><i class="bi bi-sliders"></i> Age Level</h1></div></div><div class="pages-empty">Coming soon</div>`;
};
PAGE_RENDERERS.moral = function(root){
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title"><i class="bi bi-heart"></i> Moral</h1></div></div><div class="pages-empty">Coming soon</div>`;
};
PAGE_RENDERERS.files = function(root){
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title"><i class="bi bi-folder"></i> Files</h1></div></div><div class="pages-empty">Coming soon</div>`;
};
PAGE_RENDERERS.snippets = function(root){
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title"><i class="bi bi-scissors"></i> Snippets</h1></div></div><div class="pages-empty">Coming soon</div>`;
};
PAGE_RENDERERS.terminal = function(root){
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title"><i class="bi bi-terminal"></i> Terminal</h1></div></div><div class="pages-empty">Coming soon</div>`;
};
PAGE_RENDERERS.photos = function(root){
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title"><i class="bi bi-images"></i> Photos</h1></div></div><div class="pages-empty">Coming soon</div>`;
};
PAGE_RENDERERS.cuecards = function(root){
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title"><i class="bi bi-card-text"></i> Cue Cards</h1></div></div><div class="pages-empty">Coming soon</div>`;
};
PAGE_RENDERERS.timing = function(root){
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title"><i class="bi bi-stopwatch"></i> Timing</h1></div></div><div class="pages-empty">Coming soon</div>`;
};
PAGE_RENDERERS.audience = function(root){
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title"><i class="bi bi-people"></i> Audience</h1></div></div><div class="pages-empty">Coming soon</div>`;
};
PAGE_RENDERERS.ingredients = function(root){
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title"><i class="bi bi-basket"></i> Ingredients</h1></div></div><div class="pages-empty">Coming soon</div>`;
};
PAGE_RENDERERS.steps = function(root){
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title"><i class="bi bi-list-ol"></i> Steps</h1></div></div><div class="pages-empty">Coming soon</div>`;
};
PAGE_RENDERERS.scaling = function(root){
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title"><i class="bi bi-arrows-angle-expand"></i> Scaling</h1></div></div><div class="pages-empty">Coming soon</div>`;
};
PAGE_RENDERERS.verses2 = PAGE_RENDERERS.write;
PAGE_RENDERERS.commentary = function(root){
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title"><i class="bi bi-chat-left-text"></i> Commentary</h1></div></div><div class="pages-empty">Coming soon</div>`;
};
PAGE_RENDERERS.crossrefs = function(root){
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title"><i class="bi bi-link-45deg"></i> Cross-references</h1></div></div><div class="pages-empty">Coming soon</div>`;
};
PAGE_RENDERERS.questions = function(root){
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title"><i class="bi bi-question-circle"></i> Questions</h1></div></div><div class="pages-empty">Coming soon</div>`;
};
PAGE_RENDERERS.answers = function(root){
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title"><i class="bi bi-chat-left-dots"></i> Answers</h1></div></div><div class="pages-empty">Coming soon</div>`;
};
PAGE_RENDERERS.followups = function(root){
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title"><i class="bi bi-arrow-return-right"></i> Follow-ups</h1></div></div><div class="pages-empty">Coming soon</div>`;
};

// ═══════════════════════════════════════════════════════════
//   EXPORT
// ═══════════════════════════════════════════════════════════

window.PAGE_RENDERERS = PAGE_RENDERERS;
window.goPage = goPage;
window.renderModesPanel = renderModesPanel;
window.toggleModesPanel = toggleModesPanel;
window.renderPagesOverlay = renderPagesOverlay;
window.togglePagesOverlay = togglePagesOverlay;
window.updateBreadcrumb = updateBreadcrumb;
window.updateStatusBar = updateStatusBar;
window.renderDrafts = renderDrafts;
window.renderNotes = renderNotes;
window.renderBeats = renderBeats;
window.renderKanban = renderKanban;
window.renderTimeline = renderTimeline;
window.renderCast = renderCast;
window.renderReferences = renderReferences;
window.renderProjectsForCategory = renderProjectsForCategory;
if(typeof renderSnapshots === 'function') window.renderSnapshots = renderSnapshots;
window.renderReadPage = renderReadPage;
window.runDictLookup = runDictLookup;

console.log('%c ✓ pages.js loaded (20 modes · pages overlay)', 'color:#10b981;font-weight:600;');


/* ═══════════════════════════════════════════════════════════
   BOOK ICONS — Vercel-style: thin, stroke-only, currentColor
   ═══════════════════════════════════════════════════════════ */
const NB_ICON_PENCIL = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
const NB_ICON_DOWN   = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 11 5 5 5-5"/><path d="M5 20h14"/></svg>';
const NB_ICON_GLOBE  = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.5 2.7 2.5 15.3 0 18"/><path d="M12 3c-2.5 2.7-2.5 15.3 0 18"/></svg>';

/* ═══════════════════════════════════════════════════════════
   ADVANCED FORMATTING — Shift + /  ( ? )
   The deep options in one floating panel, working on whichever
   surface you are writing in: the editor or a book chapter.
   ═══════════════════════════════════════════════════════════ */
function advTarget(){
  const visible = function(el){ return !!(el && el.isContentEditable && el.offsetParent !== null); };
  const a = document.activeElement;
  if(visible(a)) return a;
  const nb = $('nbReaderBody');
  if(visible(nb)) return nb;
  const ed = $('editor');
  if(ed && ed.isContentEditable) return ed;
  /* last resort: whichever editable is on screen at all */
  return Array.prototype.slice.call(document.querySelectorAll('[contenteditable="true"]'))
    .filter(function(el){ return el.offsetParent !== null; })[0] || null;
}
function advSaveFrom(ed){
  if(!ed) return;
  if(ed.id === 'editor' && typeof onInput === 'function'){ saveSel(); onInput(); }
  if(ed.id === 'nbReaderBody'){
    const c = nbFindCh(D()._nbOpenCh);
    if(c){ c.content = ed.innerHTML; save(); }
  }
}
function advCmd(cmd, val){
  const ed = advTarget(); if(!ed) return;
  ed.focus();
  try{ document.execCommand(cmd, false, val); }catch(e){ console.warn('adv', cmd, e); }
  advSaveFrom(ed);
}
function advBlock(tag){ advCmd('formatBlock', '<' + tag + '>'); }
/* the block the caret sits in — the fallback target when nothing is selected */
function advBlockEl(node, ed){
  let n = (node && node.nodeType === 3) ? node.parentNode : node;
  while(n && n.parentNode && n.parentNode !== ed) n = n.parentNode;
  return (n && n !== ed) ? n : null;
}
function advHint(){
  if(typeof toast === 'function') toast('Select some text first', 'warn');
}

function advWrap(css){
  const ed = advTarget(); if(!ed) return;
  const sel = window.getSelection();
  if(!sel || !sel.rangeCount) return;
  const r = sel.getRangeAt(0);
  if(r.collapsed){
    /* nothing selected → the whole block takes the typeface */
    const blk = advBlockEl(r.startContainer, ed);
    if(!blk){ advHint(); return; }
    blk.style.cssText = String(blk.style.cssText || '').replace(/;?\s*$/, '') + ';' + css;
    advSaveFrom(ed);
    return;
  }
  const span = document.createElement('span');
  span.setAttribute('style', css);
  try{ r.surroundContents(span); }
  catch(e){ const f = r.extractContents(); span.appendChild(f); r.insertNode(span); }
  advSaveFrom(ed);
}

/* text case transforms — operate on the selection, keep the markup */
function advCaseOf(mode, txt){
  if(mode === 'upper')    return txt.toUpperCase();
  if(mode === 'lower')    return txt.toLowerCase();
  if(mode === 'title')    return txt.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  if(mode === 'sentence') return txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase();
  return txt;
}
function advCase(mode){
  const ed = advTarget(); if(!ed) return;
  const sel = window.getSelection();
  if(!sel || !sel.rangeCount) return;
  const r = sel.getRangeAt(0);
  const txt = r.toString();
  if(!txt){
    /* nothing selected → change the case of the whole block */
    const blk = advBlockEl(r.startContainer, ed);
    const body = blk ? blk.textContent : '';
    if(!body){ advHint(); return; }
    blk.textContent = advCaseOf(mode, body);
    advSaveFrom(ed);
    return;
  }
  const out = advCaseOf(mode, txt);
  r.deleteContents();
  r.insertNode(document.createTextNode(out));
  advSaveFrom(ed);
}

/* manuscript inserts — the ones the body toolbar doesn't carry */
function advInsert(kind){
  const map = {
    scene:    '<p style="text-align:center;color:var(--ink-3);letter-spacing:1em;">* * *</p><p><br></p>',
    chapter:  '<h2 style="text-align:center;">Chapter</h2><p><br></p>',
    rule:     '<hr style="border:0;height:1px;background:var(--line-2);margin:18px 0;"><p><br></p>',
    page:     '<div style="border-top:1px dashed var(--line-2);margin:22px 0;"></div><p><br></p>',
    footnote: '<sup style="color:var(--ink-3);">[1]</sup>&nbsp;<span style="font-size:12.5px;color:var(--ink-3);">Footnote text.</span>',
    epigraph: '<p style="font-style:italic;color:var(--ink-3);text-align:center;">&ldquo;An epigraph goes here.&rdquo;</p><p><br></p>'
  };
  advCmd('insertHTML', map[kind] || '');
}

const ADV_BLOCKS = [['h1','H1'],['h2','H2'],['h3','H3'],['h4','H4'],['p','¶'],['blockquote','&ldquo;'],['pre','&lt;/&gt;']];
const ADV_INLINE = [['bold','type-bold','Bold'],['italic','type-italic','Italic'],['underline','type-underline','Underline'],['strikeThrough','type-strikethrough','Strikethrough'],['subscript','subscript','Subscript'],['superscript','superscript','Superscript']];
const ADV_ALIGN  = [['justifyLeft','text-left','Align left'],['justifyCenter','text-center','Align centre'],['justifyRight','text-right','Align right'],['justifyFull','text-paragraph','Justify'],['outdent','text-indent-left','Outdent'],['indent','text-indent-right','Indent'],['insertUnorderedList','list-ul','Bullets'],['insertOrderedList','list-ol','Numbers']];
const ADV_STYLE  = [
  ['font-family:var(--display);font-size:19px;font-weight:600','Title','Title style'],
  ['font-size:13px','Small','Small text'],
  ['line-height:2.1','Loose','Loose line height'],
  ['letter-spacing:.14em;text-transform:uppercase','AA','Small caps'],
  ['float:left;font-size:3.2em;line-height:.82;padding:4px 10px 0 0','D','Drop cap']
];

function advPanelEl(){
  let p = $('advPanel');
  if(!p){
    p = document.createElement('div');
    p.id = 'advPanel';
    p.className = 'adv-panel';
    p.hidden = true;
    document.body.appendChild(p);
  }
  return p;
}
function advRender(){
  const p = advPanelEl();
  const blk = (tag, label, title) => '<button type="button" class="adv-btn adv-btn-txt" data-adv-block="' + tag + '" title="' + (title || label) + '">' + label + '</button>';
  const sty = (css, label, title) => '<button type="button" class="adv-btn adv-btn-txt" data-adv-style="' + css + '" title="' + (title || label) + '">' + label + '</button>';
  const sep = '<span class="adv-sep"></span>';
  p.innerHTML = ''
    + '<div class="adv-head"><i class="bi bi-sliders"></i><span>Advanced formatting</span>'
    +   '<span class="adv-kbd">Shift + /</span>'
    + '</div>'
    + '<div class="adv-body">'
    /* ── typography: the deep controls the normal toolbar has no room for ── */
    +   '<div class="adv-row"><span class="adv-lbl">Typeface</span>'
    +     sty('font-family:var(--display);font-size:19px;font-weight:600;letter-spacing:-.01em','Display','Display face, 19px')
    +     sty('font-family:var(--ui)','UI','Interface face')
    +     sty('font-family:ui-serif,Georgia,serif','Serif','Serif face')
    +     sty('font-family:ui-monospace,SFMono-Regular,Menlo,monospace','Mono','Monospace face')
    +     sty('font-size:20px','20','Body 20px')
    +     sty('font-size:17px','17','Body 17px')
    +     sty('font-size:13.5px','13.5','Body 13.5px')
    +     sep
    +     sty('line-height:1.55','1.55','Tight leading')
    +     sty('line-height:1.8','1.8','Normal leading')
    +     sty('line-height:2.2','2.2','Loose leading')
    +     sty('letter-spacing:.02em','↔ +','Airier tracking')
    +     sty('letter-spacing:-.015em','↔ −','Tighter tracking')
    +   '</div>'
    /* ── structure: styles the body toolbar doesn't carry ── */
    +   '<div class="adv-row"><span class="adv-lbl">Structure</span>'
    +     blk('h1','Title','Chapter title') + blk('h2','Subtitle','Subtitle / section') + blk('h3','Head 3','Small heading')
    +     blk('blockquote','Quote','Block quote') + blk('pre','Code','Code block') + blk('p','Body','Back to body text')
    +     sep
    +     sty('text-indent:1.6em','Indent','First-line indent (book style)')
    +     sty('text-transform:uppercase;letter-spacing:.14em;font-size:11.5px;font-weight:600','CAPS','Small caps label')
    +     sty('float:left;font-size:3.3em;line-height:.82;padding:2px 10px 0 0;font-weight:600','¶D','Drop cap')
    +     sty('font-style:italic;color:var(--ink-3)','Em','Emphasis / epigraph')
    +   '</div>'
    /* ── case: text transforms the toolbar never had ── */
    +   '<div class="adv-row"><span class="adv-lbl">Case</span>'
    +     '<button type="button" class="adv-btn adv-btn-txt" data-adv-case="upper">UPPER</button>'
    +     '<button type="button" class="adv-btn adv-btn-txt" data-adv-case="lower">lower</button>'
    +     '<button type="button" class="adv-btn adv-btn-txt" data-adv-case="title">Title</button>'
    +     '<button type="button" class="adv-btn adv-btn-txt" data-adv-case="sentence">Sentence</button>'
    +     sep
    +     sty('white-space:pre','Pre','Keep spaces')
    +     sty('font-variant-numeric:tabular-nums','123','Tabular figures')
    +   '</div>'
    /* ── manuscript inserts ── */
    +   '<div class="adv-row"><span class="adv-lbl">Manuscript</span>'
    +     '<button type="button" class="adv-btn adv-btn-txt" data-adv-insert="scene">Scene break</button>'
    +     '<button type="button" class="adv-btn adv-btn-txt" data-adv-insert="chapter">Chapter break</button>'
    +     '<button type="button" class="adv-btn adv-btn-txt" data-adv-insert="rule">Rule</button>'
    +     '<button type="button" class="adv-btn adv-btn-txt" data-adv-insert="page">Page break</button>'
    +     '<button type="button" class="adv-btn adv-btn-txt" data-adv-insert="footnote">Footnote</button>'
    +     '<button type="button" class="adv-btn adv-btn-txt" data-adv-insert="epigraph">Epigraph</button>'
    +   '</div>'
    + '</div>';
}
function advToggle(force){
  const p = advPanelEl();
  const open = force !== undefined ? force : p.hidden;
  if(open){ advRender(); p.hidden = false; }
  else p.hidden = true;
}
window.advToggle = advToggle;

document.addEventListener('mousedown', function(e){
  if(e.target.closest('.adv-panel')) e.preventDefault();   /* keep the caret */
}, true);

function advPing(btn){
  if(!btn) return;
  advButtons().forEach(function(x){ x.classList.remove('adv-on'); });
  btn.classList.add('adv-on');
}
document.addEventListener('click', function(e){
  const b = e.target.closest('[data-adv-block]');
  if(b){ e.preventDefault(); advPing(b); advBlock(b.dataset.advBlock); return; }
  const st = e.target.closest('[data-adv-style]');
  if(st){ e.preventDefault(); advPing(st); advWrap(st.dataset.advStyle); return; }
  const cs = e.target.closest('[data-adv-case]');
  if(cs){ e.preventDefault(); advPing(cs); advCase(cs.dataset.advCase); return; }
  const ins = e.target.closest('[data-adv-insert]');
  if(ins){ e.preventDefault(); advInsert(ins.dataset.advInsert); return; }
  const c = e.target.closest('[data-adv-cmd]');
  if(c){
    e.preventDefault();
    const cmd = c.dataset.advCmd;
    if(cmd === 'createLink'){ const u = prompt('Link URL:'); if(u) advCmd('createLink', u); return; }
    advCmd(cmd);
    return;
  }
}, true);

/* ── the advanced panel answers to the keyboard: ↑ ↓ pick, Enter applies ── */
function advButtons(){
  const p = $('advPanel');
  return p ? Array.prototype.slice.call(p.querySelectorAll('.adv-btn')) : [];
}
function advMove(step){
  const b = advButtons(); if(!b.length) return;
  let i = b.findIndex(function(x){ return x.classList.contains('adv-on'); });
  if(i < 0) i = (step > 0) ? -1 : 0;
  i = (i + step + b.length) % b.length;
  b.forEach(function(x){ x.classList.remove('adv-on'); });
  b[i].classList.add('adv-on');
  if(b[i].scrollIntoView) b[i].scrollIntoView({ block:'nearest' });
}
document.addEventListener('keydown', function(e){
  const p = $('advPanel');
  if(!p || p.hidden) return;
  if(e.key === 'ArrowDown' || e.key === 'ArrowUp'){
    e.preventDefault(); e.stopPropagation();
    advMove(e.key === 'ArrowDown' ? 1 : -1);
    return;
  }
  if(e.key === 'Enter'){
    const cur = advButtons().find(function(x){ return x.classList.contains('adv-on'); });
    if(cur){ e.preventDefault(); e.stopPropagation(); cur.click(); advToggle(false); }
    return;
  }
}, true);

document.addEventListener('keydown', function(e){
  if(e.key === 'Escape'){
    const p = $('advPanel');
    if(p && !p.hidden){ p.hidden = true; return; }
  }
  const slash = (e.key === '?' || (e.code === 'Slash' && e.shiftKey));
  if(!slash) return;

  /* while it is open, Shift + / leaves it alone — Esc is the way out */
  const panel = $('advPanel');
  if(panel && !panel.hidden){
    e.preventDefault(); e.stopPropagation();
    return;
  }

  const ed = advTarget();
  const inEd = !!(ed && (document.activeElement === ed || ed.contains(document.activeElement)));
  /* a plain "?" still types: it only opens the panel on an empty block,
     or with the modifier chord anywhere */
  let blockEmpty = true;
  if(inEd && ed && ed.isContentEditable){
    const sel = window.getSelection();
    if(sel && sel.rangeCount && !sel.isCollapsed) blockEmpty = false;
    else{
      let n = sel && sel.rangeCount ? sel.anchorNode : null;
      if(n && n.nodeType === 3) n = n.parentNode;
      while(n && n.parentNode && n.parentNode !== ed) n = n.parentNode;
      blockEmpty = !n || n === ed || !String(n.textContent || '').trim();
    }
  }
  const chord = e.ctrlKey || e.metaKey;
  if(!chord && !blockEmpty) return;

  e.preventDefault(); e.stopPropagation();
  advToggle();
}, true);

/* ═══════════════════════════════════════════════════════════
   PUBLISHING DELIVERY — EPUB, and only EPUB
   A store-only ZIP writer (which is exactly what EPUB asks for),
   an EPUB 3 package, and a download.
   ═══════════════════════════════════════════════════════════ */
const EPUB_MIME = 'application/epub+zip';
let EPUB_CRC_TABLE = null;
function epubCrcTable(){
  if(EPUB_CRC_TABLE) return EPUB_CRC_TABLE;
  const t = new Uint32Array(256);
  for(let n = 0; n < 256; n++){
    let c = n;
    for(let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  EPUB_CRC_TABLE = t;
  return t;
}
function epubCrc32(bytes){
  const t = epubCrcTable();
  let c = 0xFFFFFFFF;
  for(let i = 0; i < bytes.length; i++) c = t[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
/* stored (uncompressed) zip — the mimetype entry must be first and stored */
function zipStore(files){
  const enc = new TextEncoder();
  const now = new Date();
  const u16 = v => [v & 0xFF, (v >>> 8) & 0xFF];
  const u32 = v => [v & 0xFF, (v >>> 8) & 0xFF, (v >>> 16) & 0xFF, (v >>> 24) & 0xFF];
  const dosTime = ((now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2)) & 0xFFFF;
  const dosDate = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xFFFF;

  const localChunks = [], centralChunks = [];
  let offset = 0, cdSize = 0;

  files.forEach(function(f){
    const name = enc.encode(f.name);
    const data = (typeof f.data === 'string') ? enc.encode(f.data) : f.data;
    const crc = epubCrc32(data);
    const local = new Uint8Array([].concat(
      u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(dosTime), u16(dosDate),
      u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0)
    ));
    localChunks.push(local, name, data);
    const cen = new Uint8Array([].concat(
      u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(dosTime), u16(dosDate),
      u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), u16(0),
      u16(0), u16(0), u32(0), u32(offset)
    ));
    centralChunks.push(cen, name);
    cdSize += cen.length + name.length;
    offset += local.length + name.length + data.length;
  });

  const end = new Uint8Array([].concat(
    u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(cdSize), u32(offset), u16(0)
  ));
  return new Blob(localChunks.concat(centralChunks, [end]), { type: EPUB_MIME });
}

function epubEsc(str){
  return String(str == null ? '' : str)
    .replace(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
/* stored chapter html has to be well-formed XHTML */
function toXhtml(html){
  return String(html || '')
    .replace(/&nbsp;/g, '&#160;')
    .replace(/<br\s*\/?>/gi, '<br/>')
    .replace(/<hr\s*\/?>/gi, '<hr/>')
    .replace(/<img([^>]*[^\/])>/gi, '<img$1/>')
    .replace(/<input([^>]*[^\/])>/gi, '<input$1/>');
}
function xhtmlDoc(title, body){
  return '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<!DOCTYPE html>\n'
    + '<html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">\n'
    + '<head><meta charset="utf-8"/><title>' + epubEsc(title) + '</title>'
    + '<link rel="stylesheet" type="text/css" href="style.css"/></head>\n'
    + '<body>' + body + '</body>\n</html>';
}

const EPUB_CSS = 'body{font-family:Georgia,serif;line-height:1.6;margin:5% 6%;}\n'
  + 'h1{font-size:1.5em;line-height:1.25;margin:0 0 1.1em;}\n'
  + 'h2{font-size:1.2em;margin:1.6em 0 .6em;}\n'
  + 'p{margin:0 0 .85em;text-indent:1.3em;}\n'
  + 'p:first-of-type{text-indent:0;}\n'
  + 'blockquote{margin:1.2em 2em;font-style:italic;color:#444;}\n'
  + 'hr{border:0;height:1px;background:#ccc;margin:1.5em 0;}\n'
  + '.titlepage{text-align:center;margin-top:30%;}\n'
  + '.titlepage h1{font-size:2em;text-indent:0;}\n'
  + '.titlepage .by{font-style:italic;color:#555;}\n'
  + '.titlepage .blurb{font-size:.92em;color:#666;margin-top:2em;text-align:left;}\n';

function buildEpub(proj){
  const meta  = (proj.meta && typeof proj.meta === 'object') ? proj.meta : {};
  const st    = (proj.struct && typeof proj.struct === 'object') ? proj.struct : {};
  const list  = flatChs(proj.chapters || []).map(x => x.ch).filter(Boolean);
  const title = meta.title || proj.name || 'Untitled';
  const author = meta.author || (S.config && (S.config.author || S.config.penName)) || '';
  const lang  = meta.lang || (S.config && (S.config.bookLang || S.config.defaultLang)) || 'en';
  const uid   = 'urn:uuid:sf-' + (proj.id || 'book') + '-' + Date.now();
  const modified = new Date().toISOString().replace(/\.\d+Z$/, 'Z');

  const files = [];
  files.push({ name:'mimetype', data: EPUB_MIME });
  files.push({ name:'META-INF/container.xml', data:
    '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">'
    + '<rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>' });
  files.push({ name:'OEBPS/style.css', data: EPUB_CSS });
  files.push({ name:'OEBPS/title.xhtml', data: xhtmlDoc(title,
    '<div class="titlepage"><h1>' + epubEsc(title) + '</h1>'
    + (meta.subtitle ? '<p class="by">' + epubEsc(meta.subtitle) + '</p>' : '')
    + (author ? '<p class="by">by ' + epubEsc(author) + '</p>' : '')
    + (meta.series ? '<p class="by">' + epubEsc(meta.series) + '</p>' : '')
    + (meta.blurb ? '<p class="blurb">' + epubEsc(meta.blurb) + '</p>' : '')
    + '</div>') });

  /* front matter */
  const front = [];
  if(st.dedication){
    front.push({ href:'dedication.xhtml', title:'Dedication' });
    files.push({ name:'OEBPS/dedication.xhtml', data: xhtmlDoc('Dedication',
      '<div class="titlepage"><p class="by"><em>' + epubEsc(st.dedication) + '</em></p></div>') });
  }
  if(st.acknowledgements){
    front.push({ href:'acknowledgements.xhtml', title:'Acknowledgements' });
    files.push({ name:'OEBPS/acknowledgements.xhtml', data: xhtmlDoc('Acknowledgements',
      '<h1>Acknowledgements</h1>' + String(st.acknowledgements).split(/\n+/).map(function(par){
        return '<p>' + epubEsc(par) + '</p>';
      }).join('')) });
  }

  const numbered = !!st.number;
  const chFiles = [];
  list.forEach(function(c, i){
    const name = 'OEBPS/ch' + (i + 1) + '.xhtml';
    const label = (numbered ? (i + 1) + '. ' : '') + (c.title || ('Section ' + (i + 1)));
    chFiles.push({ i:i + 1, name:name, href:'ch' + (i + 1) + '.xhtml', title:label });
    files.push({ name:name, data: xhtmlDoc(label,
      '<h1>' + epubEsc(label) + '</h1>' + toXhtml(c.content)) });
  });

  /* read next — back matter */
  let readNextFile = null;
  if(st.readNextUrl){
    readNextFile = 'readnext.xhtml';
    files.push({ name:'OEBPS/readnext.xhtml', data: xhtmlDoc('Read next',
      '<h1>Read next</h1><p><a href="' + epubEsc(st.readNextUrl) + '">'
      + epubEsc(st.readNextLabel || st.readNextUrl) + '</a></p>') });
  }

  files.push({ name:'OEBPS/nav.xhtml', data:
    '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE html>\n'
    + '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="' + lang + '" xml:lang="' + lang + '">\n'
    + '<head><meta charset="utf-8"/><title>Contents</title>'
    + '<link rel="stylesheet" type="text/css" href="style.css"/></head>\n<body><nav epub:type="toc" id="toc">'
    + '<h1>Contents</h1><ol><li><a href="title.xhtml">' + epubEsc(title) + '</a></li>'
    + front.map(f => '<li><a href="' + f.href + '">' + epubEsc(f.title) + '</a></li>').join('')
    + chFiles.map(c => '<li><a href="' + c.href + '">' + epubEsc(c.title) + '</a></li>').join('')
    + (readNextFile ? '<li><a href="' + readNextFile + '">Read next</a></li>' : '')
    + '</ol></nav></body></html>' });

  files.push({ name:'OEBPS/content.opf', data:
    '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid" xml:lang="' + lang + '">\n'
    + '<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">'
    + '<dc:identifier id="bookid">' + epubEsc(meta.isbn ? ('urn:isbn:' + meta.isbn) : uid) + '</dc:identifier>'
    + '<dc:title>' + epubEsc(title) + '</dc:title>'
    + (meta.subtitle ? '<dc:title id="sub">' + epubEsc(meta.subtitle) + '</dc:title>' : '')
    + (author ? '<dc:creator>' + epubEsc(author) + '</dc:creator>' : '')
    + '<dc:language>' + epubEsc(lang) + '</dc:language>'
    + (meta.blurb ? '<dc:description>' + epubEsc(meta.blurb) + '</dc:description>' : '')
    + (meta.series ? '<meta property="belongs-to-collection">' + epubEsc(meta.series) + '</meta>' : '')
    + (meta.isbn ? '<dc:identifier>' + epubEsc(meta.isbn) + '</dc:identifier>' : '')
    + '<meta property="dcterms:modified">' + modified + '</meta>'
    + '</metadata>\n<manifest>'
    + '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>'
    + '<item id="css" href="style.css" media-type="text/css"/>'
    + '<item id="title" href="title.xhtml" media-type="application/xhtml+xml"/>'
    + (front.length ? front.map((f, i) => '<item id="fm' + i + '" href="' + f.href + '" media-type="application/xhtml+xml"/>').join('') : '')
    + chFiles.map(c => '<item id="ch' + c.i + '" href="' + c.href + '" media-type="application/xhtml+xml"/>').join('')
    + (readNextFile ? '<item id="rn" href="' + readNextFile + '" media-type="application/xhtml+xml"/>' : '')
    + '</manifest>\n<spine><itemref idref="title"/>'
    + (front.length ? front.map((f, i) => '<itemref idref="fm' + i + '"/>').join('') : '')
    + chFiles.map(c => '<itemref idref="ch' + c.i + '"/>').join('')
    + (readNextFile ? '<itemref idref="rn"/>' : '')
    + '</spine>\n</package>' });

  return zipStore(files);
}

function downloadBlob(blob, name){
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(function(){ URL.revokeObjectURL(url); a.remove(); }, 2000);
}

function nbDeliverEpub(){
  const proj = nbProj();
  if(!proj){ toast('Open a book first', 'err'); return; }
  try{
    const blob = buildEpub(proj);
    const safe = (String(proj.name || 'book').replace(/[^\w\-. ]+/g, '').trim() || 'book');
    downloadBlob(blob, safe + '.epub');
    const n = flatChs(proj.chapters || []).length;
    toast('EPUB delivered — ' + n + ' section' + (n === 1 ? '' : 's'));
  }catch(err){
    console.error('[epub]', err);
    toast('EPUB failed: ' + err.message, 'err');
  }
}
window.nbDeliverEpub = nbDeliverEpub;

/* ═══════════════════════════════════════════════════════════
   PUBLISHING — one panel, four pillars
   Metadata · Structure · Checks · Delivery (EPUB + hosted read link)
   ═══════════════════════════════════════════════════════════ */
function nbMeta(){
  const p = nbProj(); if(!p) return {};
  if(!p.meta || typeof p.meta !== 'object') p.meta = {};
  return p.meta;
}
function nbStruct(){
  const p = nbProj(); if(!p) return {};
  if(!p.struct || typeof p.struct !== 'object') p.struct = {};
  return p.struct;
}
function nbSections(){
  const p = nbProj();
  return flatChs((p && p.chapters) || []).map(x => x.ch).filter(Boolean);
}
function nbWords(html){
  return String(html || '').replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
}

/* ── the publish checks: suggestions, not verdicts ── */
function nbChecks(){
  const p = nbProj(); if(!p) return [];
  const meta = nbMeta(), st = nbStruct();
  const secs = nbSections();
  const out = [];
  const total = secs.reduce((a, c) => a + nbWords(c.content), 0);
  const target = parseInt(meta.target, 10) || 0;
  const html = secs.map(c => c.content || '').join('\n');

  if(!secs.length) out.push({ level:'err', text:'No sections in this book yet' });
  if(target > 0){
    const pct = Math.round(total / target * 100);
    out.push({ level: total >= target ? 'ok' : 'warn',
      text:'Words ' + total.toLocaleString() + ' of ' + target.toLocaleString() + ' target — ' + pct + '%' });
  } else {
    out.push({ level:'info', text:'Words ' + total.toLocaleString() + ' — no target set' });
  }

  /* scene numbering */
  const heads = [];
  const reHead = /<[^>]*class="[^"]*scene-heading[^"]*"[^>]*>([\s\S]*?)<\//gi;
  let m; while((m = reHead.exec(html))) heads.push(String(m[1]).replace(/<[^>]*>/g, '').trim());
  if(heads.length){
    out.push({ level:'info', text:'Scenes: ' + heads.length });
    const dupes = heads.filter((h, i) => heads.indexOf(h) !== i);
    if(dupes.length) out.push({ level:'warn', text:'Duplicate scene headings: ' + Array.from(new Set(dupes)).slice(0, 3).join(' · ') });
    const unnumbered = heads.filter(h => !/^\d+[.)]?\s/.test(h)).length;
    if(unnumbered) out.push({ level:'info', text: unnumbered + ' scene heading' + (unnumbered === 1 ? '' : 's') + ' without a number prefix' });
  }

  /* unmatched speaker names */
  const names = [];
  const reName = /<[^>]*class="[^"]*character-name[^"]*"[^>]*>([\s\S]*?)<\//gi;
  while((m = reName.exec(html))) names.push(String(m[1]).replace(/<[^>]*>/g, '').trim().replace(/\s*\(.*\)$/, ''));
  if(names.length){
    const uniq = Array.from(new Set(names.filter(Boolean)));
    const cast = [];
    Object.keys(S.modes || {}).forEach(function(k){
      const b = (S.modes[k] || {}).bible || {};
      ['characters','cast','people'].forEach(function(bk){
        if(Array.isArray(b[bk])) b[bk].forEach(function(c){ if(c && c.name) cast.push(String(c.name).toLowerCase()); });
      });
    });
    if(!cast.length) out.push({ level:'info', text: uniq.length + ' speakers found — no cast list to check against' });
    else {
      const unmatched = uniq.filter(n => cast.indexOf(n.toLowerCase()) === -1);
      if(unmatched.length) out.push({ level:'warn', text:'Speakers not in your cast: ' + unmatched.slice(0, 5).join(' · ') });
      else out.push({ level:'ok', text:'All ' + uniq.length + ' speakers match your cast' });
    }
  }

  /* POV + tense consistency */
  const firstP = /(^|\s)(I|I'm|I've|me|my|mine|we|we're|our|ours)(\s|[.,!?;:])/g;
  const thirdP = /(^|\s)(he|she|they|him|her|them|his|their)(\s|[.,!?;:])/g;
  const pastT  = /(^|\s)(was|were|had|said|walked|looked|felt|turned|knew|thought|went|took)(\s|[.,!?;:])/gi;
  const presT  = /(^|\s)(is|are|says|walks|looks|feels|turns|knows|thinks|goes|takes)(\s|[.,!?;:])/gi;
  secs.forEach(function(c){
    const txt = String(c.content || '').replace(/<[^>]*>/g, ' ');
    const f = (txt.match(firstP) || []).length, t = (txt.match(thirdP) || []).length;
    if(f > 2 && t > 2) out.push({ level:'warn', text:'POV mixes first and third person in "' + (c.title || 'Untitled') + '"' });
    const pa = (txt.match(pastT) || []).length, pr = (txt.match(presT) || []).length;
    if(pa > 3 && pr > 3) out.push({ level:'warn', text:'Tense looks mixed in "' + (c.title || 'Untitled') + '"' });
  });

  /* essentials */
  if(!meta.author) out.push({ level:'warn', text:'No author name — EPUB metadata needs one' });
  if(!meta.blurb) out.push({ level:'info', text:'No blurb / description yet' });
  if(st.number) out.push({ level:'ok', text:'Chapter numbering is on' });
  return out;
}

let _nbPubTab = 'meta';
function nbPublishEl(){
  let p = $('nbPubPanel');
  if(!p){
    p = document.createElement('div');
    p.id = 'nbPubPanel';
    p.className = 'nb-pub-panel';
    p.hidden = true;
    document.body.appendChild(p);
  }
  return p;
}
/* ── the publish panel is picked up by its header and moved anywhere ── */
/* the panel's centred position comes from a stylesheet !important rule, so the
   dragged coordinates have to be written with priority too — a plain inline
   value loses to it and the panel snaps back to the middle (un-draggable). */
function nbPubSet(prop, val){
  const p = $('nbPubPanel'); if(!p) return;
  try{ p.style.setProperty(prop, val, 'important'); }catch(e){ p.style[prop] = val; }
}
function nbPubPlace(){
  const p = $('nbPubPanel'); if(!p) return;
  const pos = (S.config && S.config.nbPubPos) || null;
  if(pos && typeof pos.x === 'number' && typeof pos.y === 'number'){
    nbPubSet('transform', 'none');
    nbPubSet('left', Math.round(pos.x) + 'px');
    nbPubSet('top',  Math.round(pos.y) + 'px');
  } else {
    ['transform','left','top'].forEach(function(k){ try{ p.style.removeProperty(k); }catch(e){} });
  }
}
function nbPubDrag(){
  const p = $('nbPubPanel'); if(!p || p.dataset.dragWired === '1') return;
  p.dataset.dragWired = '1';
  /* wired on the document, so it survives the panel re-rendering its body */
  document.addEventListener('pointerdown', function(e){
    const head = e.target.closest ? e.target.closest('#nbPubPanel .nb-pub-head') : null;
    if(!head) return;
    if(e.target.closest('button, input, textarea, select, a')) return;
    const r = p.getBoundingClientRect();
    const drag = { dx:e.clientX - r.left, dy:e.clientY - r.top, w:r.width };
    const move = function(ev){
      const vw = window.innerWidth, vh = window.innerHeight;
      const w = Math.min(drag.w, vw - 12);
      const x = Math.max(6, Math.min(ev.clientX - drag.dx, vw - w - 6));
      const y = Math.max(6, Math.min(ev.clientY - drag.dy, vh - 38));
      nbPubSet('transform', 'none');
      nbPubSet('left', Math.round(x) + 'px');
      nbPubSet('top',  Math.round(y) + 'px');
    };
    const end = function(){
      document.removeEventListener('pointermove', move, true);
      document.removeEventListener('pointerup', end, true);
      document.body.classList.remove('nb-pub-moving');
      const rr = p.getBoundingClientRect();
      S.config.nbPubPos = { x:Math.round(rr.left), y:Math.round(rr.top) };
      if(typeof save === 'function') save();
    };
    document.addEventListener('pointermove', move, true);
    document.addEventListener('pointerup', end, true);
    document.body.classList.add('nb-pub-moving');
    e.preventDefault();
  }, true);
}
function nbPublishOpen(){ nbPublishRender(); nbPublishEl().hidden = false; nbPubDrag(); nbPubPlace(); }
function nbPublishClose(){ const p = $('nbPubPanel'); if(p) p.hidden = true; }

function nbPublishRender(){
  const el = nbPublishEl();
  const proj = nbProj();
  if(!proj){
    el.innerHTML = '<div class="nb-pub-head"><span>Publish</span></div><div class="nb-pub-body"><p class="nb-pub-empty">Open a book first.</p></div>';
    return;
  }
  const meta = nbMeta(), st = nbStruct();
  const tab = _nbPubTab;
  const fld = (label, key, val, ph, type) =>
    '<label class="nb-pub-f"><span>' + label + '</span><input data-pub-meta="' + key + '" type="' + (type || 'text') + '" value="' + esc(val || '') + '" placeholder="' + esc(ph || '') + '" autocomplete="off"></label>';
  const sfld = (label, key, val, ph) =>
    '<label class="nb-pub-f"><span>' + label + '</span><input data-pub-struct="' + key + '" type="text" value="' + esc(val || '') + '" placeholder="' + esc(ph || '') + '" autocomplete="off"></label>';
  const area = (label, key, val, ph) =>
    '<label class="nb-pub-f nb-pub-fa"><span>' + label + '</span><textarea data-pub-struct="' + key + '" rows="3" placeholder="' + esc(ph || '') + '">' + esc(val || '') + '</textarea></label>';

  let body = '';
  if(tab === 'meta'){
    body = '<div class="nb-pub-grid">'
      + fld('Title', 'title', meta.title || proj.name, 'Book title')
      + fld('Subtitle', 'subtitle', meta.subtitle, 'Optional')
      + fld('Author', 'author', meta.author, 'Pen name')
      + fld('Series', 'series', meta.series, 'Series / collection')
      + fld('ISBN', 'isbn', meta.isbn, 'Optional')
      + fld('Language', 'lang', meta.lang, 'en')
      + fld('Word target', 'target', meta.target, 'e.g. 80000', 'number')
      + fld('Cover image', 'cover', meta.cover, 'Image URL (used by the read link)')
      + '</div>'
      + '<label class="nb-pub-f nb-pub-fa"><span>Blurb</span><textarea data-pub-meta="blurb" rows="4" placeholder="Back-cover copy / description">' + esc(meta.blurb || '') + '</textarea></label>';
  } else if(tab === 'struct'){
    body = '<label class="nb-pub-check nb-pub-toggle"><input type="checkbox" data-pub-struct-check="number"' + (st.number ? ' checked' : '') + '><span>Number chapters automatically on delivery (1. Chapter…)</span></label>'
      + area('Dedication', 'dedication', st.dedication, 'For …')
      + area('Acknowledgements', 'acknowledgements', st.acknowledgements, 'Thanks to …')
      + '<div class="nb-pub-grid">'
      + sfld('Read next — label', 'readNextLabel', st.readNextLabel, 'Book two')
      + sfld('Read next — URL', 'readNextUrl', st.readNextUrl, 'https://…')
      + '</div>'
      + '<p class="nb-pub-note">Front matter (title page + dedication) and “Read next” go into the EPUB in order.</p>';
  } else if(tab === 'checks'){
    const items = nbChecks();
    const icon = { ok:'check2-circle', warn:'exclamation-triangle', err:'x-octagon', info:'info-circle' };
    body = '<div class="nb-pub-checks">' + (items.map(function(c){
      return '<div class="nb-pub-check lv-' + c.level + '"><i class="bi bi-' + (icon[c.level] || 'info-circle') + '"></i><span>' + esc(c.text) + '</span></div>';
    }).join('') || '<p class="nb-pub-empty">Nothing to check yet.</p>') + '</div>'
      + '<p class="nb-pub-note">These are suggestions from the text itself — they flag things to look at, never change your writing.</p>';
  } else {
    body = '<div class="nb-pub-deliver">'
      + '<button class="nb-pub-act" data-pub-epub><i class="bi bi-download"></i><span><strong>EPUB</strong><em>Download the book as a .epub file</em></span></button>'
      + '<button class="nb-pub-act" data-pub-link><i class="bi bi-link-45deg"></i><span><strong>Read link</strong><em>Host it and get a shareable URL</em></span></button>'
      + '</div>'
      + '<div class="nb-pub-url" id="nbPubUrlWrap" hidden>'
      +   '<input id="nbPubUrl" readonly value="">'
      +   '<button data-pub-copy title="Copy the link"><i class="bi bi-clipboard"></i></button>'
      +   '<button data-pub-open title="Open the link"><i class="bi bi-box-arrow-up-right"></i></button>'
      + '</div>'
      + '<p class="nb-pub-note">Delivery is EPUB only. The read link is served by the app itself at <code>/r/&lt;id&gt;</code> — it needs the site to be running the server (it works in the preview; a static-only host will not serve it).</p>';
  }

  el.innerHTML = ''
    + '<div class="nb-pub-head">'
    +   '<i class="bi bi-grip-vertical nb-pub-grip"></i><i class="bi bi-upload"></i><span>Publish — ' + esc(meta.title || proj.name) + '</span>'
    +   '<button class="nb-pub-x" data-pub-close title="Close"><svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M3 3L11 11M11 3L3 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button>'
    + '</div>'
    + '<div class="nb-pub-tabs">'
    +   ['meta:Metadata','struct:Structure','checks:Checks','deliver:Delivery'].map(function(t){
          const [id, name] = t.split(':');
          return '<button class="nb-pub-tab' + (id === tab ? ' on' : '') + '" data-pub-tab="' + id + '">' + name + '</button>';
        }).join('')
    + '</div>'
    + '<div class="nb-pub-body">' + body + '</div>';
}

/* ── the hosted read link ── */
async function nbPublishLink(){
  const proj = nbProj();
  if(!proj){ toast('Open a book first', 'err'); return; }
  const meta = nbMeta(), st = nbStruct();
  const sections = nbSections().map(function(c, i){
    return { title: ((st.number ? (i + 1) + '. ' : '') + (c.title || ('Section ' + (i + 1)))), html: toXhtml(c.content) };
  });
  if(!sections.length){ toast('Nothing to publish yet', 'err'); return; }
  const wrap = $('nbPubUrlWrap'), box = $('nbPubUrl');
  if(box) box.value = 'Publishing…';
  if(wrap) wrap.hidden = false;
  try{
    const res = await fetch('/api/publish', {
      method:'POST',
      headers:{ 'content-type':'application/json' },
      body: JSON.stringify({
        title: meta.title || proj.name, subtitle: meta.subtitle || '', author: meta.author || '',
        series: meta.series || '', blurb: meta.blurb || '', isbn: meta.isbn || '',
        language: meta.lang || 'en', cover: meta.cover || '',
        dedication: st.dedication || '', acknowledgements: st.acknowledgements || '',
        readNext: { label: st.readNextLabel || '', url: st.readNextUrl || '' },
        sections: sections
      })
    });
    const out = await res.json();
    if(!out.ok) throw new Error(out.error || 'publish failed');
    const url = location.origin + out.url;
    if(box) box.value = url;
    try{ await navigator.clipboard.writeText(url); toast('Read link copied'); }
    catch(e){ toast('Read link ready'); }
    const d = D();
    d.published = [{ id:'pub' + Date.now(), name:proj.name, url:url, date:Date.now() }].concat(d.published || []).slice(0, 40);
    save();
  }catch(err){
    console.error('[publish]', err);
    if(box) box.value = '';
    if(wrap) wrap.hidden = true;
    toast('Publish failed: ' + err.message, 'err');
  }
}

/* ── panel wiring ── */
document.addEventListener('input', function(e){
  const t = e.target;
  const mKey = t.dataset && t.dataset.pubMeta;
  if(mKey){ nbMeta()[mKey] = t.value; save(); return; }
  const sKey = t.dataset && t.dataset.pubStruct;
  if(sKey){ nbStruct()[sKey] = t.value; save(); return; }
});
document.addEventListener('change', function(e){
  const t = e.target;
  if(t.dataset && t.dataset.pubStructCheck){
    nbStruct()[t.dataset.pubStructCheck] = !!t.checked; save();
    if(_nbPubTab === 'checks') nbPublishRender();
    return;
  }
});
document.addEventListener('click', function(e){
  const tab = e.target.closest('[data-pub-tab]');
  if(tab){ e.preventDefault(); _nbPubTab = tab.dataset.pubTab; nbPublishRender(); return; }
  if(e.target.closest('[data-pub-close]')){ e.preventDefault(); nbPublishClose(); return; }
  if(e.target.closest('[data-pub-epub]')){ e.preventDefault(); nbDeliverEpub(); return; }
  if(e.target.closest('[data-pub-link]')){ e.preventDefault(); nbPublishLink(); return; }
  const cp = e.target.closest('[data-pub-copy]');
  if(cp){
    e.preventDefault();
    const box = $('nbPubUrl');
    if(box && box.value){ navigator.clipboard.writeText(box.value).then(function(){ toast('Link copied'); }); }
    return;
  }
  const op = e.target.closest('[data-pub-open]');
  if(op){
    e.preventDefault();
    const box = $('nbPubUrl');
    if(box && box.value) window.open(box.value, '_blank', 'noopener');
    return;
  }
}, true);
document.addEventListener('keydown', function(e){
  if(e.key === 'Escape'){ const p = $('nbPubPanel'); if(p && !p.hidden) p.hidden = true; }
}, true);
window.nbPublishOpen = nbPublishOpen;
