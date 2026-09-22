// Add to boot() in app.js, or just paste these lines at the end:

// Wire corner buttons + logo + pages
// Open Project — opens the editor for a project. Declared as a callable so the
// recent-project rows can open a project on double-click as well.
function openProjectById(pid){
  const d = D();
  const proj = (d.projects || []).find(p => p.id === pid);
  if(!proj){ console.warn('[open-project] not found:', pid); return; }

  // Set the mode to match the project
  if(proj.mode && proj.mode !== S.mode){
    S.mode = proj.mode;
    document.body.setAttribute('data-writing-mode', proj.mode);
  }

  // Make sure the mode data bucket exists
  if(!S.modes[S.mode]) S.modes[S.mode] = freshModeData();
  const md = S.modes[S.mode];

  // Point the working set at the project's chapters
  if(!proj.chapters || !proj.chapters.length){
    proj.chapters = [{ id: uid(), title: 'Chapter 1', content: '', children: [], collapsed: false }];
  }
  md.currentProject = proj.id;
  md.currentCategory = proj.category;
  md.chapters = proj.chapters;
  md.currentChapter = proj.chapters[0].id;

  save();

  // Close the panels
  if(typeof togglePagesOverlay === 'function') togglePagesOverlay(false);
  if(typeof hideInfoPanel === 'function') hideInfoPanel();

  // Refresh the pills, then open the editor — projects land in Draft
  if(typeof renderModePills === 'function') renderModePills();
  if(typeof updateBreadcrumb === 'function') updateBreadcrumb();
  goPage('draft');

  toast('Opened: ' + proj.name);
}

document.addEventListener('click', e => {
  const t = e.target;

    // Dropdown: Menu → toggle modes panel
  if(t.closest('[data-act="open-menu"]')){
    e.preventDefault();
    document.getElementById('logoDrop')?.classList.remove('open');
    const panel = document.getElementById('modesPanel');
    const isOpen = panel && panel.classList.contains('open');
    if(isOpen){
      if(typeof toggleModesPanel === 'function') toggleModesPanel(false);
    } else {
      if(typeof renderModesPanel === 'function') renderModesPanel();
      if(typeof toggleModesPanel === 'function') toggleModesPanel(true);
    }
    return;
  }

  // Click outside logo-wrap → close dropdown
  if(!t.closest('.logo-wrap')){
    document.getElementById('logoDrop')?.classList.remove('open');
  }

  // Pages button (top bar) → toggle pages overlay
  if(t.closest('[data-act="pages"]')){ e.preventDefault(); togglePagesOverlay(); return; }
  
    // Home page actions
  if(t.closest('[data-act="go-write"]')){ e.preventDefault(); goPage('write'); return; }
  if(t.closest('[data-act="go-new"]')){ e.preventDefault(); if(window.TOOLS?.newProject) TOOLS.newProject(); return; }
  if(t.closest('[data-act="go-stats"]')){ e.preventDefault(); goPage('stats'); return; }
if(t.closest('[data-act="go-overview"]')){
  e.preventDefault();
  if(typeof goPage === 'function') goPage('overview');
  return;
}

  // ─── Export project (from Write toolbar) ───
  if(t.closest('[data-act="export-project"]')){
    e.preventDefault();
    if(typeof IO?.exportProject === 'function') IO.exportProject();
    return;
  }

  // ─── Show in folder (project expand) ───
  const projShow = t.closest('[data-proj-showfolder]');
  if(projShow){
    e.preventDefault();
    e.stopPropagation();
    const pid = projShow.dataset.projShowfolder;
    const d = D();
    const proj = d.projects.find(x => x.id === pid);
    if(!proj) return;

    if(proj.savedPath){
      if(typeof FS?.isElectron === 'function' && FS.isElectron() && window.electronAPI?.showInFolder){
        window.electronAPI.showInFolder(proj.savedPath);
      } else {
        toast('Saved at: ' + proj.savedPath);
      }
    } else {
      toast('Not saved to disk yet. Click Export to save it first.', 'warn');
    }
    return;
  }

  // ─── Project row: select (stats) / double-click to open ───
  const projToggle = t.closest('[data-proj-toggle]');
  if(projToggle){
    e.preventDefault();
    const pid = projToggle.dataset.projToggle;
    const d = D();

    // A single click selects the project and shows its stats; open it with
    // the Open button on the row instead of double-clicking.
    if(typeof setStatsProject === 'function') setStatsProject(pid);
    if(typeof renderProjectsForCategory === 'function') renderProjectsForCategory(d.currentCategory);
    if(typeof renderProjectStatsPanel === 'function') renderProjectStatsPanel();
    return;
  } 

  // Project: Open (single click on the open button opens the project)
  const projOpenBtn = t.closest('[data-proj-open-btn]');
  if(projOpenBtn){
    e.preventDefault();
    e.stopPropagation();
    openProjectById(projOpenBtn.dataset.projOpenBtn);
    return;
  }

  // Project: Pin / unpin (pinned rows sit at the top of the recents list)
  const projPin = t.closest('[data-proj-pin]');
  if(projPin){
    e.preventDefault();
    e.stopPropagation();
    const pid = projPin.dataset.projPin;
    if(typeof togglePinnedProject === 'function') togglePinnedProject(pid);
    if(typeof renderProjectsForCategory === 'function') renderProjectsForCategory(D().currentCategory);
    return;
  }

  // Projects head: Open the project currently selected in the list
  const projOpenSel = t.closest('[data-proj-open-sel]');
  if(projOpenSel){
    e.preventDefault();
    e.stopPropagation();
    const pid = (typeof getStatsProject === 'function') ? getStatsProject() : null;
    if(!pid){ toast('Click a project in the list first, then Open', 'warn'); return; }
    openProjectById(pid);
    return;
  }

  // Project: Rename
  const projRename = t.closest('[data-proj-rename]');
  if(projRename){
    e.preventDefault();
    e.stopPropagation();
    const pid = projRename.dataset.projRename;
    const d = D();
    const proj = d.projects.find(x => x.id === pid);
    if(!proj) return;
    const newName = prompt('Rename project:', proj.name);
    if(!newName || newName === proj.name) return;
    proj.name = newName.trim();
    save();
    if(typeof renderProjectsForCategory === 'function') renderProjectsForCategory(d.currentCategory);
    if(typeof renderProjectStatsPanel === 'function') renderProjectStatsPanel();
    toast('Renamed');
    return;
  }

  // Project: Change folder
  const projFolder = t.closest('[data-proj-folder]');
  if(projFolder){
    e.preventDefault();
    e.stopPropagation();
    const pid = projFolder.dataset.projFolder;
    const d = D();
    const proj = d.projects.find(x => x.id === pid);
    if(!proj) return;
    const categories = (currentMode()?.categories) || [];
    const list = categories.map(c => c.name).join(' / ');
    const pick = prompt('Move to which category? (' + list + ')', getCatName(proj.category));
    if(!pick) return;
    const match = categories.find(c => c.name.toLowerCase() === pick.toLowerCase());
    if(!match){ toast('Unknown category', 'warn'); return; }
    proj.category = match.id;
    save();
    if(typeof renderProjectsForCategory === 'function') renderProjectsForCategory(d.currentCategory);
    toast('Moved to ' + match.name);
    return;
  }

  // Project: Delete
  const projDel = t.closest('[data-proj-del]');
  if(projDel){
    e.preventDefault();
    e.stopPropagation();
    const pid = projDel.dataset.projDel;
    const d = D();
    const proj = d.projects.find(x => x.id === pid);
    if(!proj) return;
    if(!confirm('Delete project "' + proj.name + '"? Cannot be undone.')) return;
    d.projects = d.projects.filter(x => x.id !== pid);
    if(d.currentProject === pid) d.currentProject = d.projects[0]?.id || null;
    d._expandedProject = null;
    // If the deleted project was the one shown in the stats card, empty it
    if(typeof getStatsProject === 'function' && getStatsProject() === pid){
      if(typeof setStatsProject === 'function') setStatsProject(null);
    }
    save();
    if(typeof renderProjectsForCategory === 'function') renderProjectsForCategory(d.currentCategory);
    toast('Project deleted');
    return;
  }

     // Stats page actions — Export
  if(t.closest('[data-act="stats-export"]')){
    e.preventDefault();
    const novelCat = S.config.statsNovel || 'none';
    const screenCat = S.config.statsScreenplay || 'none';
    let modeId = null, catId = null;
    if(novelCat !== 'none'){ modeId = 'novel'; catId = novelCat; }
    else if(screenCat !== 'none'){ modeId = 'screenplay'; catId = screenCat; }

    const modeData = modeId ? (S.modes[modeId] || {}) : {};
    const projs = catId ? (modeData.projects || []).filter(p => p.category === catId) : [];
    let totalWords = 0, totalSections = 0;
    projs.forEach(p => {
      totalSections += (p.chapters ? flatChs(p.chapters).length : 0);
      totalWords += (p.chapters ? p.chapters.reduce((a, c) => a + wordCount(c.content), 0) : 0);
    });

    let report = 'ScriptForge — Statistics Report\n';
    report += 'Generated: ' + new Date().toLocaleString() + '\n';
    report += 'Mode: ' + (modeId || '(none)') + '\n';
    report += 'Category: ' + (catId || '(none)') + '\n\n';
    report += 'Projects: ' + projs.length + '\n';
    report += 'Sections: ' + totalSections + '\n';
    report += 'Words: ' + totalWords + '\n';

    const blob = new Blob([report], {type: 'text/plain'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'scriptforge-stats-' + Date.now() + '.txt';
    a.click();
    toast('Report exported');
    return;
  }
    // Topbar: Command palette
  if(t.closest('[data-act="command-palette"]')){
    e.preventDefault();
    if(typeof openCommandPalette === 'function') openCommandPalette();
    else toast('Command palette coming soon', 'warn');
    return;
  }

  // Topbar: Settings
  if(t.closest('[data-act="open-settings"]')){
    e.preventDefault();
    if(typeof SETTINGS?.open === 'function') SETTINGS.open();
    else toast('Settings opening...', 'warn');
    return;
  }
  
  if(t.closest('[data-act="close-pages"]')){ e.preventDefault(); togglePagesOverlay(false); return; }
  
  
  // Mode pill click → open overlay for that mode
  const pillEl = t.closest('[data-mode-pill]');
if(pillEl){
  e.preventDefault();
  const newMode = pillEl.dataset.modePill;
  /* inside an overlay pane the pill switches that pane's mode and opens the
     projects panel inside the pane (never the parent's) */
  if(window.SF_VIEW === true){
    if(newMode !== S.mode) switchMode(newMode);
    D().currentCategory = null;
    if(typeof renderPagesOverlay === 'function') renderPagesOverlay();
    if(typeof togglePagesOverlay === 'function') togglePagesOverlay(true);
    return;
  }
  const overlay = document.getElementById('pagesOverlay');
  const isOpen = !!(overlay && overlay.classList.contains('open'));
  // clicking the pill again closes the panel; switching modes opens it
  if(isOpen && newMode === S.mode){
    if(typeof togglePagesOverlay === 'function') togglePagesOverlay(false);
    return;
  }
  if(newMode !== S.mode) switchMode(newMode);
  D().currentCategory = null;
  renderPagesOverlay();
  togglePagesOverlay(true);
  return;
}

  // Category "+ New" button
  const catNew = t.closest('[data-cat-new]');
  if(catNew){
    e.preventDefault();
    e.stopPropagation();
    const catId = catNew.dataset.catNew;
    const name = prompt('Project name:', 'Untitled');
    if(!name) return;
    const d = D();
    // Duplicate names within a category are not allowed
    if((d.projects || []).some(p => p.category === catId && p.name.toLowerCase() === name.trim().toLowerCase())){
      toast('A project named "' + name.trim() + '" already exists in this category', 'warn');
      return;
    }
    // Cap each category at 5 recent projects
    const catProjects = (d.projects || []).filter(p => p.category === catId);
    if(catProjects.length >= 5){
      toast('Category is full — 5 recent projects max', 'warn');
      return;
    }
    const id = uid();
       const firstChapterId = uid();
    d.projects.unshift({
      id, name, category: catId, mode: S.mode, created: Date.now(),
      chapters: [{id: firstChapterId, title:'Chapter 1', content:'', children:[], collapsed:false}],
      bible: { characters:[], locations:[], items:[], scenes:[], events:[], organizations:[] },
      notes: [],
      kanban: { columns:[
        {id:'k1', title:'Ideas', cards:[]},
        {id:'k2', title:'Drafting', cards:[]},
        {id:'k3', title:'Editing', cards:[]},
        {id:'k4', title:'Done', cards:[]}
      ]}
    });
    d.currentProject = id;
    d.currentCategory = catId;
    d.currentChapter = firstChapterId;
    save();
    togglePagesOverlay(false);
    goPage('write');
    toast('Project created');
    return;
  }

  // Category "Open" button
  const catOpen = t.closest('[data-cat-open]');
  if(catOpen){
    e.preventDefault();
    e.stopPropagation();
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.md,.json,.html,.docx,.rtf';
    input.onchange = async ev => {
      const f = ev.target.files[0];
      if(!f) return;
      const text = await f.text();
      const d = D();
      const id = uid();
      d.projects.push({
        id, name: f.name.replace(/\.[^.]+$/, ''), category: catOpen.dataset.catOpen,
        mode: S.mode, created: Date.now(),
        chapters: [{id: uid(), title:'Section 1', content: text.replace(/\n/g,'<br>'), children:[], collapsed:false}],
        currentChapter: null
      });
      d.currentProject = id;
      d.currentCategory = catOpen.dataset.catOpen;
      save();
      togglePagesOverlay(false);
      goPage('write');
      toast('Project imported');
    };
    input.click();
    return;
  }
  // Category tile click
  const catEl = t.closest('[data-cat-pick]');
  if(catEl){
    e.preventDefault();
    D().currentCategory = catEl.dataset.catPick;
    // Switching category clears the stats card (it describes a project, and
    // the project list below belongs to the previous category).
    if(typeof setStatsProject === 'function') setStatsProject(null);
    save();
    renderPagesOverlay();
    return;
  }
  
  if(t.closest('[data-act="close-modes"]')){ e.preventDefault(); toggleModesPanel(false); return; }
  
  // Breadcrumb mode → open modes
  
});

// Modes list needs click handlers — mode click opens pages panel on right
document.addEventListener('click', e => {
  const mi = e.target.closest('.mode-item');
  if(mi && mi.dataset.modeSwitch){
    e.preventDefault();
    const isOpen = document.getElementById('pagesOverlay')?.classList.contains('open');
    const sameMode = (mi.dataset.modeSwitch === S.mode);

    // If clicking the same mode while panel is open → just close panel
    if(sameMode && isOpen){
      if(typeof togglePagesOverlay === 'function') togglePagesOverlay(false);
      if(typeof hideInfoPanel === 'function') hideInfoPanel();
      return;
    }

    // Otherwise switch mode + open panel
    if(!sameMode){
      switchMode(mi.dataset.modeSwitch);
    }
    if(typeof renderPagesOverlay === 'function') renderPagesOverlay();
    if(typeof togglePagesOverlay === 'function') togglePagesOverlay(true);
    if(typeof hideInfoPanel === 'function') hideInfoPanel();
  }
}, true);

// Menu bar contents
function buildMenubar(){
  const mb = document.querySelector('.menubar');
  if(!mb || mb.dataset.built) return;
  mb.dataset.built = '1';
  const MENUS = [
    {label:'File', items:[
      {icon:'file-plus', label:'New project', act:() => TOOLS.newProject()},
      {icon:'folder', label:'Open project', act:() => togglePagesOverlay()},
      {icon:'save', label:'Save', hint:'Ctrl+S', act:() => { save(); toast('Saved'); }},
      {sep:true},
      {icon:'box-arrow-in-down', label:'Import', act:() => goPage('import')},
      {icon:'box-arrow-up', label:'Export', act:() => goPage('import')},
      {sep:true},
      {icon:'printer', label:'Print', hint:'Ctrl+P', act:() => IO.printDoc()},
      {icon:'download', label:'Full backup', act:() => IO.exportFullBackup()},
      {sep:true},
      {icon:'sliders', label:'Settings', act:() => SETTINGS.open()}
    ]},
    {label:'Edit', items:[
      {icon:'arrow-counterclockwise', label:'Undo', hint:'Ctrl+Z', act:() => runCmd('undo')},
      {icon:'arrow-clockwise', label:'Redo', hint:'Ctrl+Y', act:() => runCmd('redo')},
      {sep:true},
      {icon:'search', label:'Find & replace', hint:'Ctrl+F', act:() => openFind()},
      {sep:true},
      {icon:'scissors', label:'Cut', act:() => document.execCommand('cut')},
      {icon:'copy', label:'Copy', act:() => document.execCommand('copy')},
      {icon:'clipboard', label:'Paste', act:() => document.execCommand('paste')},
      {sep:true},
      {icon:'check2-all', label:'Select all', hint:'Ctrl+A', act:() => document.execCommand('selectAll')}
    ]},
    {label:'View', items:[
      {icon:'grid-1x2', label:'Pages panel', act:() => togglePagesOverlay()},
      {icon:'collection', label:'Modes panel', act:() => { renderModesPanel(); toggleModesPanel(); }},
      {sep:true},
      {icon:'bullseye', label:'Focus mode', hint:'Ctrl+Shift+F', act:() => toggleFocus()},
      {icon:'arrows-fullscreen', label:'Fullscreen', act:() => { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); }}
    ]},
    {label:'Format', items:[
      {icon:'type-bold', label:'Bold', hint:'Ctrl+B', act:() => runCmd('bold')},
      {icon:'type-italic', label:'Italic', hint:'Ctrl+I', act:() => runCmd('italic')},
      {icon:'type-underline', label:'Underline', hint:'Ctrl+U', act:() => runCmd('underline')},
      {icon:'type-strikethrough', label:'Strike', act:() => runCmd('strikeThrough')},
      {sep:true},
      {icon:'text-left', label:'Align left', act:() => runCmd('justifyLeft')},
      {icon:'text-center', label:'Center', act:() => runCmd('justifyCenter')},
      {icon:'text-right', label:'Align right', act:() => runCmd('justifyRight')},
      {icon:'text-paragraph', label:'Justify', act:() => runCmd('justifyFull')},
      {sep:true},
      {icon:'list-ul', label:'Bullet list', act:() => runCmd('insertUnorderedList')},
      {icon:'list-ol', label:'Numbered list', act:() => runCmd('insertOrderedList')},
      {sep:true},
      {icon:'eraser', label:'Clear formatting', act:() => runCmd('removeFormat')}
    ]},
    {label:'Insert', items:[
      {icon:'hr', label:'Divider', act:() => insertHTML('<hr>')},
      {icon:'info-square', label:'Callout', act:() => insertHTML('<div style="border-left:3px solid var(--accent);padding:10px 14px;background:var(--surface-2);border-radius:6px;margin:12px 0;"><strong>Note:</strong> </div>')},
      {icon:'emoji-smile', label:'Icon library', act:() => openIconLibrary()},
      {sep:true},
      {icon:'calendar-event', label:'Date', act:() => insertHTML(new Date().toLocaleDateString())},
      {icon:'clock', label:'Time', act:() => insertHTML(new Date().toLocaleTimeString())}
    ]},
    {label:'AI', items:[
      {icon:'stars', label:'Toggle AI panel', hint:'Ctrl+I', act:() => toggleAIPanel()},
      {sep:true},
      {icon:'magic', label:'Fix grammar', act:() => AI_FNS.fixGrammar()},
      {icon:'translate', label:'Translate', act:() => AI_FNS.translate()},
      {icon:'stars', label:'Improve', act:() => AI_FNS.improve()},
      {icon:'arrow-right-circle', label:'Continue writing', act:() => AI_FNS.continue()},
      {icon:'arrows-angle-expand', label:'Expand', act:() => AI_FNS.expand()},
      {icon:'card-text', label:'Summarize', act:() => AI_FNS.summarize()},
      {icon:'arrow-repeat', label:'Rewrite', act:() => AI_FNS.rewrite()}
    ]},
    {label:'Help', items:[
      {icon:'keyboard', label:'Keyboard shortcuts', act:() => openShortcuts()},
      {icon:'book', label:'About', act:() => SETTINGS.open()}
    ]}
  ];

  MENUS.forEach(m => {
    const btn = document.createElement('button');
    btn.className = 'menu-btn';
    btn.textContent = m.label;
    btn.onclick = e => {
      e.stopPropagation();
      document.querySelectorAll('.menu-drop').forEach(x => x.remove());
      document.querySelectorAll('.menu-btn').forEach(x => x.classList.remove('open'));
      btn.classList.add('open');
      const drop = document.createElement('div');
      drop.className = 'menu-drop';
      const rect = btn.getBoundingClientRect();
      drop.style.left = rect.left + 'px';
      drop.style.top = (rect.bottom + 4) + 'px';
      m.items.forEach(item => {
        if(item.sep){
          const s = document.createElement('div');
          s.className = 'menu-sep';
          drop.appendChild(s);
          return;
        }
        const bi = document.createElement('button');
        bi.className = 'menu-item';
        bi.innerHTML = `<i class="mi-icon bi bi-${item.icon}"></i><span>${item.label}</span>${item.hint ? `<span class="mi-hint">${item.hint}</span>` : ''}`;
        bi.onclick = () => { drop.remove(); btn.classList.remove('open'); item.act(); };
        drop.appendChild(bi);
      });
      document.body.appendChild(drop);
    };
    mb.appendChild(btn);
  });

  document.addEventListener('click', () => {
    document.querySelectorAll('.menu-drop').forEach(x => x.remove());
    document.querySelectorAll('.menu-btn').forEach(x => x.classList.remove('open'));
  });
}

function openShortcuts(){
  const root = $('modalRoot');
  root.innerHTML = '';
  root.classList.add('open');
  const scrim = document.createElement('div');
  scrim.className = 'modal-scrim';
  const shortcuts = [
    ['Save','Ctrl+S'], ['Find','Ctrl+F'], ['Bold','Ctrl+B'], ['Italic','Ctrl+I'],
    ['Underline','Ctrl+U'], ['Command palette','Ctrl+K'], ['AI panel','Ctrl+I'],
    ['Focus mode','Ctrl+Shift+F'], ['Cycle theme','Ctrl+T'], ['New project','Ctrl+N']
  ];
  scrim.innerHTML = `
    <div class="modal" style="max-width:520px;">
      <div class="modal-head">
        <h2><i class="bi bi-keyboard"></i> Shortcuts</h2>
        <button class="icon-btn" data-act="close-modal-shortcuts"><i class="bi bi-x-lg"></i></button>
      </div>
      <div class="modal-body">
        ${shortcuts.map(([label, key]) => `
          <div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--surface-2);border-radius:8px;margin-bottom:6px;font-size:12.5px;">
            <span>${label}</span><kbd style="font-family:var(--mono);font-size:11px;padding:2px 8px;background:var(--surface-3);border-radius:4px;">${key}</kbd>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  root.appendChild(scrim);
  scrim.querySelector('[data-act="close-modal-shortcuts"]')?.addEventListener('click', () => closeModal());
  scrim.addEventListener('click', e => { if(e.target === scrim) closeModal(); });
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

// In app.js, inside the document.addEventListener('click', ...) block

// Legacy entry point — no longer rendered in the project list, kept for safety
const projOpen = t.closest('[data-proj-open]');
if(projOpen){
  e.preventDefault();
  e.stopPropagation();
  openProjectById(projOpen.getAttribute('data-proj-open'));
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
    S.mode = 'media';
    if(!S.modes.media) S.modes.media = freshModeData();

   
    
         // Set mode attribute first — before anything else needs it
    document.body.setAttribute('data-style', 'vercel');
    
    // Apply theme
    if(typeof applyThemeNow === 'function') applyThemeNow();
    if(typeof applyAllConfig === 'function') applyAllConfig();
    /* the interface language (Settings → Language) applies before the first
       paint, so page names and text direction are right from the start */
    if(typeof applyLang === 'function') applyLang();
    document.body.setAttribute('data-layout', S.config.layout || 'classic');

    buildMenubar();

    if(typeof renderModesPanel === 'function') renderModesPanel();
        // Always start on Dashboard
    if(typeof goPage === 'function') goPage('home');

    // Overlay panes open straight onto the page / player they asked for
    try{
      const qp = new URLSearchParams(location.search);
      const wantPage  = qp.get('sfPage');
      const wantPanel = qp.get('sfPanel');
      if(wantPage && wantPage !== 'home' && typeof goPage === 'function') goPage(wantPage);
      if(wantPanel === 'music' && typeof openMusicPanel === 'function') openMusicPanel();
      if(wantPanel === 'video' && typeof openVideoPanel === 'function') openVideoPanel();
    }catch(e){}

    // Past this point any goPage() is the writer navigating, not booting —
    // an overlay pane uses it to tell its parent window what it's showing.
    window.SF_NAV_READY = true;

    // Bring back the overlay pane in the main window if it was left open
    if(window.SF_VIEW !== true && S.config.overlay && S.config.overlay.open && typeof overlayShow === 'function'){
      overlayShow(true);
    }

    if(window.PLUGINS?.initVoice) PLUGINS.initVoice();
    if(window.initAIDrag) initAIDrag();

    if(typeof updateBreadcrumb === 'function') updateBreadcrumb();
    if(typeof renderModePills === 'function') renderModePills();
    if(typeof updateStatusBar === 'function') updateStatusBar();

       console.log('%c ✓ ScriptForge booted', 'color:#10b981;font-weight:700;');
  }catch(e){
    console.error('Boot failed:', e);
    const stage = document.getElementById('stage');
    if(stage){
      stage.innerHTML = '<div style="padding:40px;color:#ef4444;font-family:monospace;">Boot error: ' + e.message + '<br><br>Check browser console for details.</div>';
    }
      // Apply status bar + FAB visibility for initial page
  const isDash = (S.page === 'home' || S.page === 'stats' || S.page === 'overview');
  const sb = document.getElementById('statusbar');
  if(sb) sb.hidden = isDash;
  const fab = document.getElementById('fabWrap');
  if(fab) fab.style.display = isDash ? 'none' : '';
  }

  // Boot animation — skipped inside an overlay pane
  if(window.SF_VIEW !== true && typeof runBootAnimation === 'function') runBootAnimation();
}

// Toggle theme in top bar
document.addEventListener('click', e => {
  if(e.target.closest('[data-act="cycle-theme"]')){
    e.preventDefault();
    const idx = THEMES.findIndex(t => t.id === S.config.theme);
    const next = THEMES[(idx + 1) % THEMES.length];
    if(typeof setTheme === 'function') setTheme(next.id);
    else { S.config.theme = next.id; applyThemeVars(next.id); save(); }
    toast('Theme: ' + next.name);   // one pane button, two seats — see overlay.js
  }
});

// ═══════════════════════════════════════════════════════════
//   FLOATING IMPORT BUTTON — dual behavior (fab extras appended at file end)
//   Left click  → GitHub import panel
//   Right click → local file picker
// ═══════════════════════════════════════════════════════════

(function wireFloatingImport(){
  const btn = document.getElementById('floatingImport');
  if(!btn) return;

  // Left click → GitHub panel
  btn.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    if(typeof openGitHubPanel === 'function') openGitHubPanel();
    else toast('GitHub panel not loaded', 'err');
  }, true);

  // Right click → file picker
  btn.addEventListener('contextmenu', e => {
    e.preventDefault();
    e.stopPropagation();

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.md,.markdown,.json,.html,.htm,.fountain,.spmd,.doc,.docx,.rtf';
    input.multiple = false;
    input.onchange = async ev => {
      const file = ev.target.files && ev.target.files[0];
      if(!file) return;

      const text = await file.text();
      const d = D();
      const chapterId = uid();

      // Convert plain text → HTML paragraphs
      const html = text
        .split(/\n{2,}/)
        .map(block => `<p>${esc(block).replace(/\n/g, '<br>')}</p>`)
        .join('');

      d.chapters.push({
        id: chapterId,
        title: file.name.replace(/\.[^.]+$/, ''),
        content: html,
        children: [],
        collapsed: false
      });
      d.currentChapter = chapterId;
      save();

      if(typeof togglePagesOverlay === 'function') togglePagesOverlay(false);
      if(typeof goPage === 'function') goPage('write');
      toast('Imported: ' + file.name);
    };
    input.click();
  }, true);
})();

// ═══════════════════════════════════════════════════════════
//   SWITCH MODE
// ═══════════════════════════════════════════════════════════
function switchMode(modeId){
  const m = MODES.find(x => x.id === modeId);
  if(!m){
    console.warn('[switchMode] unknown mode:', modeId);
    return;
  }
  S.mode = modeId;
document.body.setAttribute('data-mode', modeId);           // ← CSS hook
document.body.setAttribute('data-writing-mode', modeId);   // keep if other code reads it
if(!S.modes[modeId]) S.modes[modeId] = freshModeData();
// Land on the dashboard for the new mode — the caller opens the mode's
// categories panel; never jump straight into the editor.
S.page = 'home';
if(typeof goPage === 'function') goPage(S.page);
}

window.switchMode = switchMode;

// ═══════════════════════════════════════════════════════════
//   INFO PANEL — slides in from right on page/project click
// ═══════════════════════════════════════════════════════════

function showPageInfo(pageId){
  const panel = $('infoPanel');
  const title = $('infoTitle');
  const body = $('infoBody');
  if(!panel || !title || !body) return;

  const def = PAGE_META[pageId] || {name: pageId, icon: 'file'};
  const count = (typeof pageCount === 'function') ? pageCount(pageId) : null;

  title.innerHTML = `<i class="bi bi-${def.icon}"></i> ${(window.pname ? pname(pageId) : def.name)}`;
  body.innerHTML = `
    <div class="info-section">
      <div class="info-label">Page</div>
      <div class="info-value">
        <strong>${def.name}</strong><br>
        Part of <strong>${currentMode()?.name || 'Novel'}</strong> mode.
      </div>
    </div>
    <div class="info-section">
      <div class="info-label">Stats</div>
      <div class="info-stats">
        ${count !== null ? `
          <div class="info-stat">
            <div class="info-stat-val">${count}</div>
            <div class="info-stat-lbl">Items</div>
          </div>
        ` : ''}
        <div class="info-stat">
          <div class="info-stat-val">${currentMode()?.pages?.length || 0}</div>
          <div class="info-stat-lbl">Pages</div>
        </div>
      </div>
    </div>
    <button class="info-open" data-info-open-page="${pageId}">
      <i class="bi bi-box-arrow-in-right"></i> Open ${def.name}
    </button>
  `;

  panel.classList.add('open');
  panel.dataset.page = pageId;
}

function showProjectInfo(projectId){
  const panel = $('infoPanel');
  const title = $('infoTitle');
  const body = $('infoBody');
  if(!panel || !title || !body) return;

  const d = D();
  const proj = d.projects.find(p => p.id === projectId);
  if(!proj){ return; }

  const chapters = proj.chapters ? flatChs(proj.chapters).length : 0;
  const words = proj.chapters ? proj.chapters.reduce((a, c) => a + wordCount(c.content), 0) : 0;
  const created = new Date(proj.created).toLocaleDateString();

  title.innerHTML = `<i class="bi bi-folder-fill"></i> ${esc(proj.name)}`;
  body.innerHTML = `
    <div class="info-section">
      <div class="info-label">Project</div>
      <div class="info-value">
        <strong>${esc(proj.name)}</strong>
      </div>
    </div>
    <div class="info-section">
      <div class="info-label">Stats</div>
      <div class="info-stats">
        <div class="info-stat">
          <div class="info-stat-val">${chapters}</div>
          <div class="info-stat-lbl">Sections</div>
        </div>
        <div class="info-stat">
          <div class="info-stat-val">${words}</div>
          <div class="info-stat-lbl">Words</div>
        </div>
      </div>
    </div>
    <div class="info-section">
      <div class="info-label">Created</div>
      <div class="info-value">${created}</div>
    </div>
    <div class="info-section">
      <div class="info-label">Actions</div>
      <div class="info-actions">
        <button data-info-rename="${proj.id}"><i class="bi bi-pencil"></i> Rename</button>
        ${d.projects.length > 1 ? `<button class="danger" data-info-del="${proj.id}"><i class="bi bi-trash"></i> Delete</button>` : ''}
      </div>
    </div>
    <button class="info-open" data-info-open-project="${proj.id}">
      <i class="bi bi-box-arrow-in-right"></i> Open Project
    </button>
  `;

  panel.classList.add('open');
  panel.dataset.page = 'proj:' + projectId;
}

function hideInfoPanel(){
  const panel = $('infoPanel');
  if(panel) panel.classList.remove('open');
}

// Info panel click routing
document.addEventListener('click', e => {
  const t = e.target;

  // Close info panel
  if(t.closest('[data-act="info-close"]')){ hideInfoPanel(); return; }
     // Logo click → go Home
  if(t.closest('.logo-btn')){
    e.preventDefault();
    if(typeof toggleModesPanel === 'function') toggleModesPanel(false);
    if(typeof togglePagesOverlay === 'function') togglePagesOverlay(false);
    if(typeof hideInfoPanel === 'function') hideInfoPanel();
    if(typeof goPage === 'function') goPage('home');
    return;
  }
  

  // Open page from info panel
const openPage = t.closest('[data-info-open-page]');
if(openPage){
  const pid = openPage.dataset.infoOpenPage;
  hideInfoPanel();
  if(typeof togglePagesOverlay === 'function') togglePagesOverlay(false);
  if(typeof toggleModesPanel === 'function') toggleModesPanel(false);
  if(typeof goPage === 'function') goPage(pid);
  return;
}
  // Open project from info panel
  const openProj = t.closest('[data-info-open-project]');
if(openProj){
  const pid = openProj.dataset.infoOpenProject;
  hideInfoPanel();
  if(typeof togglePagesOverlay === 'function') togglePagesOverlay(false);
  if(typeof toggleModesPanel === 'function') toggleModesPanel(false);
  if(typeof TOOLS?.openProject === 'function'){
    TOOLS.openProject(pid);
  } else if(typeof IO?.openProject === 'function'){
    IO.openProject(pid);
  }
  return;
}

  // Rename project
  const renameProj = t.closest('[data-info-rename]');
  if(renameProj){
    const pid = renameProj.dataset.infoRename;
    const d = D();
    const proj = d.projects.find(p => p.id === pid);
    if(!proj) return;
    const newName = prompt('Rename project:', proj.name);
    if(!newName || newName === proj.name) return;
    proj.name = newName.trim();
    save();
    if(typeof renderProjectsList === 'function') renderProjectsList();
    showProjectInfo(pid);
    return;
  }

  // Delete project
  const delProj = t.closest('[data-info-del]');
  if(delProj){
    const pid = delProj.dataset.infoDel;
    const d = D();
    const proj = d.projects.find(p => p.id === pid);
    if(!proj) return;
    if(!confirm(`Delete project "${proj.name}"? Cannot be undone.`)) return;
    d.projects = d.projects.filter(p => p.id !== pid);
    if(d.currentProject === pid && d.projects[0]){
      d.currentProject = d.projects[0].id;
    }
    save();
    if(typeof renderProjectsList === 'function') renderProjectsList();
    hideInfoPanel();
    return;
  }

 // Click on page tile — toggle info panel
const pageTile = t.closest('[data-page-pick]');
if(pageTile){
  e.preventDefault();
  e.stopPropagation();
  const pid = pageTile.dataset.pagePick;
  const panel = document.getElementById('infoPanel');
  if(!panel) return;

  const isOpen = panel.classList.contains('open');
  const samePage = panel.dataset.page === pid;

  // If panel is showing THIS page already → close it
  if(isOpen && samePage){
    hideInfoPanel();
    return;
  }

  // Otherwise show (whether opening fresh or switching pages)
  showPageInfo(pid);
  return;
}

  // Click on project row in overlay → show info panel
  const projRow = t.closest('[data-open-project]');
if(projRow){
  e.preventDefault();
  e.stopPropagation();
  const projId = projRow.dataset.openProject;
  const panel = document.getElementById('infoPanel');
  if(!panel) return;
  const isOpen = panel.classList.contains('open');
  const sameProj = panel.dataset.page === 'proj:' + projId;
  if(isOpen && sameProj){ hideInfoPanel(); return; }
  showProjectInfo(projId);
  return;
}
}, true);  // capture phase so it fires before other handlers

window.showPageInfo = showPageInfo;
window.showProjectInfo = showProjectInfo;
window.hideInfoPanel = hideInfoPanel;

// ═══════════════════════════════════════════════════════════
//   COMMAND PALETTE
// ═══════════════════════════════════════════════════════════
function openCommandPalette(){
  const root = $('modalRoot');
  if(!root) return;
  root.innerHTML = '';
  root.classList.add('open');

  const commands = [
    {group:'File', items:[
      {icon:'house-door', label:'Home', act:() => { closeModal(); goPage('home'); }},
      {icon:'plus-circle', label:'New project', act:() => { closeModal(); TOOLS.newProject(); }},
      {icon:'save', label:'Save', act:() => { closeModal(); save(); toast('Saved'); }},
      {icon:'download', label:'Export', act:() => { closeModal(); goPage('import'); }},
      {icon:'upload', label:'Import', act:() => { closeModal(); goPage('import'); }}
    ]},
    {group:'View', items:[
      {icon:'grid-1x2', label:'Pages panel', act:() => { closeModal(); togglePagesOverlay(true); }},
      {icon:'list', label:'Modes panel', act:() => { closeModal(); renderModesPanel(); toggleModesPanel(true); }},
      {icon:'bullseye', label:'Focus mode', act:() => { closeModal(); document.body.classList.toggle('focus'); }},
      {icon:'graph-up', label:'Statistics', act:() => { closeModal(); goPage('stats'); }},
      {icon:'gear', label:'Settings', act:() => { closeModal(); if(typeof SETTINGS?.open === 'function') SETTINGS.open(); }}
    ]},
    {group:'Edit', items:[
      {icon:'arrow-counterclockwise', label:'Undo', act:() => { closeModal(); runCmd('undo'); }},
      {icon:'arrow-clockwise', label:'Redo', act:() => { closeModal(); runCmd('redo'); }},
      {icon:'search', label:'Find & replace', act:() => { closeModal(); openFind(); }}
    ]},
    {group:'AI', items:[
      {icon:'stars', label:'Toggle AI panel', act:() => { closeModal(); if(typeof toggleAIPanel === 'function') toggleAIPanel(); }},
      {icon:'magic', label:'Fix grammar', act:() => { closeModal(); AI_FNS.fixGrammar(); }},
      {icon:'translate', label:'Translate', act:() => { closeModal(); AI_FNS.translate(); }},
      {icon:'arrow-repeat', label:'Improve', act:() => { closeModal(); AI_FNS.improve(); }}
    ]}
  ];

  const scrim = document.createElement('div');
  scrim.className = 'modal-scrim cp-scrim';
  scrim.style.cssText = 'align-items:flex-start;padding-top:15vh;';
  scrim.innerHTML = `
    <div class="modal cp-modal" style="max-width:560px;width:90%;">
      <div style="display:flex;align-items:center;gap:10px;padding:14px 18px;border-bottom:1px solid var(--line);">
        <i class="bi bi-search" style="color:var(--ink-4);font-size:16px;"></i>
        <input id="cpInput" placeholder="Type a command or search..." style="flex:1;background:none;border:none;font-size:14px;color:var(--ink);outline:none;">
        <kbd style="font-family:var(--mono);font-size:10.5px;padding:2px 6px;background:var(--surface-3);border-radius:4px;color:var(--ink-3);">Esc</kbd>
      </div>
      <div id="cpList" style="max-height:400px;overflow-y:auto;padding:8px;">
        ${commands.map(g => `
          <div class="cp-group" data-cp-group="${g.group.toLowerCase()}">
            <div style="padding:6px 10px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--ink-4);">${g.group}</div>
            ${g.items.map(it => `
              <button class="menu-item cp-item" data-cp-label="${esc(it.label.toLowerCase())}">
                <i class="mi-icon bi bi-${it.icon}"></i>
                <span>${it.label}</span>
              </button>
            `).join('')}
          </div>
        `).join('')}
      </div>
    </div>
  `;
  root.appendChild(scrim);

  const input = $('cpInput');
  const list = $('cpList');

  // Wire each item click
  let idx = 0;
  const allItems = () => Array.from(scrim.querySelectorAll('.cp-item'));
  const items = commands.flatMap(g => g.items);

  allItems().forEach((el, i) => {
    el.addEventListener('click', () => {
      const label = el.dataset.cpLabel;
      const found = commands.flatMap(g => g.items).find(x => x.label.toLowerCase() === label);
      if(found) found.act();
    });
  });

  // Keyboard navigation
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    allItems().forEach(el => {
      const match = !q || el.dataset.cpLabel.includes(q);
      el.style.display = match ? '' : 'none';
    });
    scrim.querySelectorAll('.cp-group').forEach(g => {
      const visible = Array.from(g.querySelectorAll('.cp-item')).some(e => e.style.display !== 'none');
      g.style.display = visible ? '' : 'none';
    });
  });

  input.addEventListener('keydown', e => {
    const visible = allItems().filter(el => el.style.display !== 'none');
    if(e.key === 'Escape'){ closeModal(); return; }
    if(e.key === 'ArrowDown'){
      e.preventDefault();
      idx = Math.min(idx + 1, visible.length - 1);
      visible.forEach((el, i) => el.classList.toggle('active', i === idx));
      visible[idx]?.scrollIntoView({block:'nearest'});
    }
    if(e.key === 'ArrowUp'){
      e.preventDefault();
      idx = Math.max(idx - 1, 0);
      visible.forEach((el, i) => el.classList.toggle('active', i === idx));
      visible[idx]?.scrollIntoView({block:'nearest'});
    }
    if(e.key === 'Enter'){
      e.preventDefault();
      visible[idx]?.click();
    }
  });

  setTimeout(() => input.focus(), 30);
}
window.openCommandPalette = openCommandPalette;

// ═══════════════════════════════════════════════════════════
//   COMMAND BOX — Super / Shift+` trigger, dropdown above pill
// ═══════════════════════════════════════════════════════════

const CMD_DEFAULTS = {
  // Key → { label, icon, run }
  'gt': { label:'Write page',      icon:'pencil-fill',      run:() => goPage('write') },
  'q7': { label:'Read page',       icon:'book-half',        run:() => goPage('read') },
  'zk': { label:'Draft page',      icon:'lightbulb',        run:() => goPage('draft') },
  'ph': { label:'Plan page',       icon:'list-nested',      run:() => goPage('plan') },
  'rb': { label:'Board page',      icon:'kanban',           run:() => goPage('board') },
  'ns': { label:'Notes page',      icon:'sticky',           run:() => goPage('notes') },
  'cn': { label:'Canvas page',     icon:'pencil-square',    run:() => goPage('canvas') },
  'fc': { label:'Cast page',       icon:'people-fill',      run:() => goPage('cast') },
  'rs': { label:'Research page',   icon:'link-45deg',       run:() => goPage('research') },
  'dl': { label:'Dictionary page', icon:'book',             run:() => goPage('dictionary') },
  'tl': { label:'Timeline page',   icon:'git',              run:() => goPage('timeline') },
  'nb': { label:'Notebook page',   icon:'journal-bookmark-fill', run:() => goPage('notebook') },
  'fm': { label:'Format page',     icon:'sliders',          run:() => goPage('format') },
  'ip': { label:'Inspire page',    icon:'lightbulb-fill',   run:() => goPage('inspire') }
};

function getCmdMap(){
  // Merge user overrides if present
  const userMap = S.config.commandKeys || {};
  return Object.assign({}, CMD_DEFAULTS, userMap);
}

function openCmdBox(){
  const box = $('cmdBox');
  const input = $('cmdInput');
  if(!box || !input) return;
  box.hidden = false;
  requestAnimationFrame(() => box.classList.add('open'));
  input.value = '';
  const list = $('cmdList');
  if(list) list.innerHTML = '';
  setTimeout(() => input.focus(), 30);
}

function closeCmdBox(){
  const box = $('cmdBox');
  if(!box) return;
  box.classList.remove('open');
  setTimeout(() => { box.hidden = true; }, 180);
}

function renderCmdList(query){
  const list = $('cmdList');
  if(!list) return;
  const map = getCmdMap();
  const q = (query || '').trim().toLowerCase();
    
    // Empty query → show nothing (Spotlight style)
  if(!q){
    list.innerHTML = '';
    return;
  }

  // Group by rough category
  const groups = {
    'Pages':  [],
    'Modes':  [],
    'File':   [],
    'View':   [],
    'App':    []
  };

  const items = Object.entries(map).map(([key, def]) => ({ key, ...def }));

  const filtered = q
    ? items.filter(it =>
        it.key.includes(q) ||
        it.label.toLowerCase().includes(q))
    : items;

  filtered.forEach(it => {
    // Sort into groups by key heuristic
    if(['kr','gt','q7','zk','ph','rb','ns','jp'].includes(it.key)) groups.Pages.push(it);
    else if(['im','y4'].includes(it.key)) groups.Modes.push(it);
    else if(['86','mo'].includes(it.key)) groups.File.push(it);
    else if(['hm','pw','fo'].includes(it.key)) groups.View.push(it);
    else groups.App.push(it);
  });

  list.innerHTML = '';
  let total = 0;
  Object.keys(groups).forEach(g => {
    if(!groups[g].length) return;
    const lbl = document.createElement('div');
    lbl.className = 'cmd-group-label';
    lbl.textContent = g;
    list.appendChild(lbl);
    groups[g].forEach(it => {
      total++;
      const btn = document.createElement('button');
      btn.className = 'cmd-item';
      btn.innerHTML = `
        <i class="bi bi-${it.icon}"></i>
        <span class="cmd-label">${esc(it.label)}</span>
        <span class="cmd-key">${esc(it.key)}</span>
      `;
      btn.addEventListener('click', () => runCmdByKey(it.key));
      list.appendChild(btn);
    });
  });

  if(!total){
    list.innerHTML = `<div class="cmd-empty">No matching commands</div>`;
  }
}

function runCmdByKey(key){
  const map = getCmdMap();
  const def = map[key];
  if(!def){ toast('Unknown command: ' + key, 'err'); return; }
  closeCmdBox();
  try{ def.run(); }
  catch(e){ console.error('Command failed', key, e); toast('Command failed', 'err'); }
}

// Keyboard: Enter runs first match, Up/Down navigates
document.addEventListener('keydown', e => {
    // Trigger: Super (Meta) or Shift+`
  // Disabled on Dashboard and Statistics
  const onDashboardOrStats = (S.page === 'home' || S.page === 'stats');

  if(!onDashboardOrStats && e.key === 'Meta' && !e.ctrlKey && !e.altKey && !e.shiftKey){
    e.preventDefault();
    openCmdBox();
    return;
  }
  if(!onDashboardOrStats && e.shiftKey && e.key === '~'){
    e.preventDefault();
    openCmdBox();
    return;
  }

  const box = $('cmdBox');
  if(!box || box.hidden) return;

  const input = $('cmdInput');
  if(!input) return;

  if(e.key === 'Escape'){
    e.preventDefault();
    closeCmdBox();
    return;
  }

  if(e.key === 'ArrowDown' || e.key === 'ArrowUp'){
    e.preventDefault();
    const items = Array.from(box.querySelectorAll('.cmd-item'));
    if(!items.length) return;
    let idx = items.findIndex(x => x.classList.contains('active'));
    items.forEach(x => x.classList.remove('active'));
    idx = e.key === 'ArrowDown'
      ? Math.min(idx + 1, items.length - 1)
      : Math.max(idx - 1, 0);
    if(idx < 0) idx = 0;
    items[idx].classList.add('active');
    items[idx].scrollIntoView({block:'nearest'});
    return;
  }

  if(e.key === 'Enter'){
    e.preventDefault();
    const q = input.value.trim().toLowerCase();
    const items = Array.from(box.querySelectorAll('.cmd-item'));

    // Exact key match first
    const map = getCmdMap();
    if(map[q]){
      runCmdByKey(q);
      return;
    }

    // Otherwise, first visible item
    const active = items.find(x => x.classList.contains('active'));
    if(active){
      const keyEl = active.querySelector('.cmd-key');
      if(keyEl) runCmdByKey(keyEl.textContent);
    }
  }
}, true);

// Input: re-render on type
document.addEventListener('input', e => {
  if(e.target && e.target.id === 'cmdInput'){
    renderCmdList(e.target.value);
  }
}, true);

// Pill click → open box
document.addEventListener('click', e => {
  if(e.target.closest('#cmdPill')){
    e.preventDefault();
    openCmdBox();
    return;
  }
  // Click outside → close
  const box = $('cmdBox');
  if(box && !box.hidden && !e.target.closest('#cmdBox') && !e.target.closest('#cmdPill')){
    closeCmdBox();
  }
}, true);

window.openCmdBox = openCmdBox;
window.closeCmdBox = closeCmdBox;
window.runCmdByKey = runCmdByKey;
window.CMD_DEFAULTS = CMD_DEFAULTS;

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
    {pct: 20, msg: 'Loading state…',  delay: 150},
    {pct: 45, msg: 'Loading modes…',  delay: 200},
    {pct: 70, msg: 'Loading pages…',  delay: 200},
    {pct: 90, msg: 'Almost ready…',   delay: 200},
    {pct: 100,msg: 'Ready',           delay: 250}
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

// ═══════════════════════════════════════════════════════════
//   FAB
// ═══════════════════════════════════════════════════════════

function renderFabMenu(){
  const views = $('fabMenuViews');
  if(!views) return;
  const mode = currentMode();
  if(!mode) return;

  const viewList = mode.editorViews || [];

  views.innerHTML = viewList.map(function(pid){
    const meta = PAGE_META[pid] || { name: pid, icon: 'file' };
    const sep = (pid === 'kanban') ? '<div class="fab-divider"></div>' : '';
    return sep + '<button class="fab-item' + (S.page === pid ? ' active' : '') +
      '" data-fab-go="' + pid + '"><i class="bi bi-' + meta.icon + '"></i><span>' + (window.pname ? pname(pid) : meta.name) + '</span></button>';
  }).join('');
}


function toggleFabMenu(force){
  const menu = $('fabMenu');
  const ai = $('fabAI');
  const wrap = $('fabWrap');
  if(!menu) return;
  if(ai) ai.hidden = true;
  const open = force !== undefined ? force : menu.hidden;
  if(open){
    renderFabMenu();
    menu.hidden = false;
    if(wrap) wrap.classList.add('menu-open');
  } else {
    menu.hidden = true;
    if(wrap) wrap.classList.remove('menu-open');
  }
}

function toggleFabAI(force){
  const ai = $('fabAI');
  const menu = $('fabMenu');
  const wrap = $('fabWrap');
  if(!ai) return;
  if(menu) menu.hidden = true;
  const open = force !== undefined ? force : ai.hidden;
  if(open){
    renderFabAI();
    ai.hidden = false;
    if(wrap) wrap.classList.add('menu-open');
  } else {
    ai.hidden = true;
    if(wrap) wrap.classList.remove('menu-open');
  }
}

function renderFabAI(){
  const body = $('fabAIBody');
  if(!body) return;

  const editorActions = [
    { fn:'fixGrammar', icon:'magic',               label:'Fix grammar' },
    { fn:'improve',    icon:'stars',               label:'Improve' },
    { fn:'continue',   icon:'arrow-right-circle',  label:'Continue' },
    { fn:'expand',     icon:'arrows-angle-expand', label:'Expand' },
    { fn:'summarize',  icon:'card-text',           label:'Summarize' },
    { fn:'rewrite',    icon:'arrow-repeat',        label:'Rewrite' }
  ];
  const actions = editorActions.concat([
    { fn:'translate', icon:'translate', label:'Translate' }
  ]);
  body.innerHTML = actions.map(function(a){
    return '<button class="ai-chip" data-ai="' + a.fn + '"><i class="bi bi-' +
      a.icon + '"></i> ' + a.label + '</button>';
  }).join('');
}

// ══ Right-click FAB AI assistant → Google-Translate-style popup panel ══
// Every AI option and the full translation flow live in one popup:
// source text on the left, result on the right, language grid beneath.
// The Hinglish conversions only appear when the experimental toggle is on.
document.addEventListener('click', function(e){
  const chip = e.target.closest('.fab-ai .ai-chip[data-ai]');
  if(!chip) return;
  const fn = chip.dataset.ai;
  if(fn === 'translate'){ openFabTranslate(); }
  else { toggleFabAI(false); AI_FNS[fn] && AI_FNS[fn](); }
}, true);

function openFabTranslate(){
  const fab = $('fabAI');
  const body = $('fabAIBody');
  if(!fab || !body) return;

  const langs = allLangs();
  const sel = window.getSelection();
  const srcText = (sel && sel.toString().trim() && $('editor') && $('editor').contains(sel.anchorNode))
    ? sel.toString() : ($('editor') ? $('editor').innerText.trim() : '');

  body.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'fab-translate';
  wrap.innerHTML = `
    <div class="ft-bar">
      <div class="ft-cell">
        <span class="ft-lang">Detect language</span>
        <div class="ft-text">${srcText ? esc(srcText) : '<span style="color:var(--ink-4)">Editor is empty</span>'}</div>
      </div>
      <div class="ft-cell">
        <span class="ft-lang" id="ftDstName">English</span>
        <div class="ft-text" id="ftDst"><span style="color:var(--ink-4)">Translation</span></div>
      </div>
    </div>
    <div class="ft-search"><i class="bi bi-search"></i><input id="ftQuery" placeholder="Search languages…"></div>
    <div class="ft-grid" id="ftGrid"></div>
    ${S.config.expHinglish ? `
      <div class="ft-hg">
        <button class="ai-chip" data-ai="hinglishToHindi"><i class="bi bi-arrow-return-right"></i> Hinglish → हिन्दी</button>
        <button class="ai-chip" data-ai="hinglishToEnglish"><i class="bi bi-arrow-return-right"></i> Hinglish → English</button>
      </div>` : ''}
  `;
  body.appendChild(wrap);

  const grid = wrap.querySelector('#ftGrid');
  const dstName = wrap.querySelector('#ftDstName');
  const dst = wrap.querySelector('#ftDst');
  let current = S.config.defaultLang || 'en';

  function renderGrid(q){
    const needle = (q || '').toLowerCase();
    grid.innerHTML = langs.filter(l =>
      !needle || l.name.toLowerCase().includes(needle) ||
      (l.native && l.native.toLowerCase().includes(needle))
    ).map(l =>
      '<button class="ft-lang-btn' + (l.code === current ? ' on' : '') + '" data-lang="' + l.code + '">' +
      '<span class="ft-flag">' + (l.flag || '') + '</span><span>' + esc(l.name) +
      (l.native ? ' <em>' + esc(l.native) + '</em>' : '') + '</span></button>'
    ).join('') || '<div class="ft-empty">No language found</div>';
  }
  renderGrid('');

  wrap.querySelector('#ftQuery').addEventListener('input', function(){ renderGrid(this.value); });

  grid.addEventListener('click', async function(ev){
    const btn = ev.target.closest('[data-lang]');
    if(!btn) return;
    current = btn.dataset.lang;
    const lang = langs.find(l => l.code === current);
    dstName.textContent = lang ? lang.name : current;
    renderGrid(wrap.querySelector('#ftQuery').value);
    if(!srcText){ dst.innerHTML = '<span style="color:var(--ink-4)">Nothing to translate</span>'; return; }
    dst.innerHTML = '<span class="ft-busy">Translating…</span>';
    S.config.defaultLang = current; save();
    try{
      const res = await callAI('Translate the text below into ' + lang.name +
        '. Preserve tone, meaning and paragraphs. Return only the translation.' +
        '\n\n"""\n' + srcText + '\n"""');
      dst.textContent = res.trim() || 'No response';
    }catch(err){
      dst.innerHTML = '<span style="color:var(--ink-3)">' + esc(err.message) + '</span>';
    }
  });
}


document.addEventListener('click', function(e){
  const t = e.target;
  if(t.closest('#fabBtn')){ e.preventDefault(); toggleFabMenu(); return; }
  const fabGo = t.closest('[data-fab-go]');
  if(fabGo){
    e.preventDefault();
    const pid = fabGo.dataset.fabGo;
    toggleFabMenu(false);
    if(typeof goPage === 'function') goPage(pid);
    return;
  }
  if(t.closest('[data-act="fab-ai-close"]')){ e.preventDefault(); toggleFabAI(false); return; }
  if(!t.closest('#fabWrap')){
    const m = $('fabMenu'), a = $('fabAI');
    if(m) m.hidden = true;
    if(a) a.hidden = true;
    $('fabWrap')?.classList.remove('menu-open');
  }
}, true);

document.addEventListener('contextmenu', function(e){
  if(e.target.closest('#fabBtn')){
    e.preventDefault();
    toggleFabAI();
  }
}, true);

window.renderFabMenu = renderFabMenu;

// Listen for system theme changes when mode is auto
window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function(){
  if(S.config.mode === 'auto' && typeof applyThemeNow === 'function') applyThemeNow();
});

// ═══════════════════════════════════════════════════════════
//   FLOATING IMPORT BUTTON
//   Left click  → GitHub import panel
//   Right click → local file picker
// ═══════════════════════════════════════════════════════════

function attachFloatingImport(){
  const btn = document.getElementById('floatingImport');
  if(!btn){ console.warn('[import] button not found'); return; }
  if(btn.dataset.wired === '1') return;
  btn.dataset.wired = '1';

  btn.addEventListener('click', function(e){
    e.preventDefault();
    e.stopImmediatePropagation();
    console.log('[import] LEFT click → openGitHubPanel');
    if(typeof openGitHubPanel === 'function') openGitHubPanel();
    else console.error('[import] openGitHubPanel missing');
  }, true);

  btn.addEventListener('contextmenu', function(e){
    e.preventDefault();
    e.stopImmediatePropagation();
    console.log('[import] RIGHT click → JSON project import');

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.multiple = false;

    input.onchange = async function(ev){
      const file = ev.target.files && ev.target.files[0];
      if(!file) return;

      if(!file.name.toLowerCase().endsWith('.json')){
        toast('Only .json project files are supported', 'err');
        return;
      }

      let parsed;
      try{
        const text = await file.text();
        parsed = JSON.parse(text);
      }catch(err){
        toast('Invalid JSON file', 'err');
        return;
      }

      importJSONProject(parsed, file.name);
    };

    input.click();
  }, true);

  console.log('[import] button wired ✓');
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', attachFloatingImport);
} else {
  attachFloatingImport();
}
window.attachFloatingImport = attachFloatingImport;


// ═══════════════════════════════════════════════════════════
//   JSON PROJECT IMPORT — routed by name keywords
//   Name must contain: novel | screenplay
//   Category:          fiction
// ═══════════════════════════════════════════════════════════

function classifyProjectName(rawName){
  const name = (rawName || '').toLowerCase();

  // ─── Mode keyword (required) ───
  let mode = null;
  if(/\bscreenplay\b/.test(name) || /\bscript\b/.test(name)){
    mode = 'screenplay';
  } else if(/\bnovel\b/.test(name)){
    mode = 'novel';
  }

  // ─── Category keyword (required) ───
  let category = null;
  if(/\bfiction\b/.test(name)){
    category = 'fiction';
  }

  return { mode, category };
}

function importJSONProject(parsed, filename){
  const src = parsed.project || parsed;

  if(!src || typeof src !== 'object'){
    toast('File does not contain a project', 'err');
    return;
  }

  // ─── Display title ───
// Use the JSON's internal name if present (nicer to read in the list),
// otherwise fall back to the filename.
const projectName = (filename || '').replace(/\.json$/i, '') || src.name || 'Untitled';

// ─── Routing key ───
// ALWAYS classify by the filename. Never by JSON content.
const routingKey = (filename || '').replace(/\.json$/i, '') || '';

const cls = classifyProjectName(routingKey);
const mode     = cls.mode;
const category = cls.category;

  // ═══════════════════════════════════════════════════════
  //   STRICT GUARDS — nothing below runs unless both present
  // ═══════════════════════════════════════════════════════
  if(!mode && !category){
    toast('Project name must contain "novel" or "screenplay", and "fiction"', 'err');
    return;
  }
  if(!mode){
    toast('Project name must contain "novel" or "screenplay"', 'err');
    return;
  }
  if(!category){
    toast('Project name must contain "fiction"', 'err');
    return;
  }

  // From here on, both are guaranteed non-null strings
  const modeDef = MODES.find(m => m.id === mode);
  if(!modeDef){
    toast('Unknown mode "' + mode + '"', 'err');
    return;
  }
  const catExists = modeDef.categories && modeDef.categories.some(c => c.id === category);
  if(!catExists){
    toast('Category "' + category + '" not valid for ' + mode, 'err');
    return;
  }

  if(!S.modes[mode]) S.modes[mode] = freshModeData();
  const targetData = S.modes[mode];

  const newId = uid();
  const chapters = Array.isArray(src.chapters) && src.chapters.length
    ? src.chapters
    : [{ id: uid(), title: 'Chapter 1', content: '', children: [], collapsed: false }];

  const newProject = {
    id: newId,
    name: projectName,
    category: category,
    mode: mode,
    created: src.created || Date.now(),
    chapters: chapters,
    notes: src.notes || [],
    beats: src.beats || [],
    cast: src.cast || [],
    bible: src.bible || { characters:[], locations:[], items:[], scenes:[], events:[], organizations:[] },
    references: src.references || [],
    timeline: src.timeline || [],
    kanban: src.kanban || null,
    drafts: src.drafts || [],
    versions: src.versions || [],
    _importedFrom: filename,
    _importSource: 'internal'
  };

  if(!Array.isArray(targetData.projects)) targetData.projects = [];

  const dupe = targetData.projects.find(p =>
    p.category === category &&
    p.name.toLowerCase() === newProject.name.toLowerCase()
  );
  if(dupe){
    toast('A project named "' + newProject.name + '" already exists in this category', 'warn');
    return;
  }

  // Cap each category at 5 recent projects
  const catCount = targetData.projects.filter(p => p.category === category).length;
  if(catCount >= 5){
    toast('Category is full — 5 recent projects max', 'warn');
    return;
  }

  targetData.projects.unshift(newProject);
  targetData.currentCategory = category;
  targetData.currentProject = newId;
  targetData.currentChapter = chapters[0].id;

  save();

  if(typeof closeGitHubPanel === 'function') closeGitHubPanel();
  if(typeof hideInfoPanel === 'function') hideInfoPanel();

  if(S.mode !== mode && typeof switchMode === 'function'){
    switchMode(mode);
  }

  setTimeout(function(){
    if(typeof renderPagesOverlay === 'function') renderPagesOverlay();
    if(typeof togglePagesOverlay === 'function') togglePagesOverlay(true);

    const row = document.querySelector('[data-proj-toggle="' + newId + '"]');
    if(row){
      row.scrollIntoView({ block: 'center', behavior: 'smooth' });
      const prev = row.style.background;
      row.style.background = 'var(--surface-4)';
      setTimeout(function(){ row.style.background = prev; }, 900);
    }
  }, 60);

  toast('Imported "' + newProject.name + '" → ' + modeDef.name + ' · ' + category);
}

window.importJSONProject = importJSONProject;
