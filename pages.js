/* ═══════════════════════════════════════════════════════════
   ScriptForge — page router

   The app has two pages: the Manager (overview) and its Statistics.
   Every renderer lives with the feature that owns it — manager.js
   registers PAGE_RENDERERS.overview and PAGE_RENDERERS.stats at boot.
   The old screenwriting pages (editor, outline, kanban, bible, notes,
   timeline, cast, import …) and their overlays are gone.
   ═══════════════════════════════════════════════════════════ */

const PAGE_RENDERERS = {};

const SF_PAGES = {
  overview: { name: 'Manager',    icon: 'grid-1x2' },
  stats:    { name: 'Statistics', icon: 'graph-up-arrow' }
};

/* ── ROUTER ───────────────────────────────────────────────── */

function goPage(id){
  /* The Manager is the app's home, so every old route lands there. */
  if(id === 'home') id = 'overview';

  if(!Object.prototype.hasOwnProperty.call(SF_PAGES, id)){
    toast('Page not available', 'warn');
    return;
  }

  /* Topbar actions (Player · Statistics · Settings) — kept on both pages */
  const actions = document.getElementById('topbarActions');
  if(actions) actions.hidden = false;

  S.page = id;

  const stage = $('stage');
  if(!stage) return;
  stage.innerHTML = '';

  const wrap = document.createElement('div');
  wrap.className = 'page active';
  wrap.id = 'page-' + id;
  stage.appendChild(wrap);

  const renderer = PAGE_RENDERERS[id];
  if(renderer){
    try{
      renderer(wrap);
    }catch(e){
      console.error('Renderer failed', id, e);
      wrap.innerHTML = '<div class="pages-empty">Failed to render ' + id + '.</div>';
    }
  } else {
    wrap.innerHTML = '<div class="pages-empty"><i class="bi bi-' +
      ((SF_PAGES[id] || {}).icon || 'file') + '"></i>' +
      ((SF_PAGES[id] || {}).name || id) + '</div>';
  }

  if(typeof renderMusicMini === 'function') renderMusicMini();
  updateBreadcrumb();
  save();

  /* An overlay pane keeps its parent's Back / Forward in step. SF_NAV_READY
     is only set once booting finished, so the pane's first page never
     reaches the parent — only real navigation does. */
  if(window.SF_VIEW === true && window.SF_NAV_READY && window.parent && window.parent !== window){
    try{ window.parent.postMessage({ sf:'nav', page:id }, location.origin); }catch(e){}
  }
}

/* ── BREADCRUMB ───────────────────────────────────────────── */

/* The topbar carries no app name. A sub-page names itself, the app's own
   page (the Manager) leaves the bar empty. */
function updateBreadcrumb(){
  const el = $('breadcrumb');
  if(!el) return;
  const name = (SF_PAGES[S.page] || SF_PAGES.overview).name;
  el.innerHTML = (S.page === 'overview')
    ? ''
    : '<span class="crumb current">' + name + '</span>';
}

/* ── EXPORT ───────────────────────────────────────────────── */

window.PAGE_RENDERERS   = PAGE_RENDERERS;
window.SF_PAGES         = SF_PAGES;
window.goPage           = goPage;
window.updateBreadcrumb = updateBreadcrumb;

console.log('%c ✓ pages.js loaded (router)', 'color:#10b981;font-weight:600;');
