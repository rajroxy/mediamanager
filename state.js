/* ═══════════════════════════════════════════════════════════
   Media Manager — State
   Themes · config · utilities · persistence
   ═══════════════════════════════════════════════════════════ */

// ═══════════════════════════════════════════════════════════
//   THEMES
// ═══════════════════════════════════════════════════════════

//   Dark-only themes — each one is a full token set applied inline on
//   <html> + <body>, so a theme never has to fight the cascade.
//   Eye comfort is deliberately NOT a theme: it's a warm light filter that
//   toggles over whichever theme you're using (Settings → Appearance).
const THEMES = [
  {
    id:'night', name:'Night', c1:'#1b1a19', c2:'#fab387', dark:true,
    note:'Warm dark — the original',
    palette:{
      bg:'#1b1a19', s1:'#222120', s2:'#292725', s3:'#312e2c', s4:'#3a3734', s5:'#454140',
      ov:'rgba(255,255,255,.05)', ovs:'rgba(255,255,255,.09)',
      ink:'#d9d3cb', ink2:'#b0aaa1', ink3:'#8b857c', ink4:'#6a655e',
      line:'#332f2c', line2:'#3e3a36', line3:'#4c4741',
      acc:'#e6dfd5', acc2:'#cfc7bb', accInk:'#1b1a19', accSoft:'rgba(230,223,213,.08)', accLine:'rgba(230,223,213,.22)',
      grad:'linear-gradient(135deg,#e6dfd5 0%,#b8b0a4 100%)',
      docBg:'#211f1d', docInk:'#d3cdc4', caret:'#fab387', sel:'#fab387', selInk:'#211f1d'
    }
  },
  {
    id:'lamp', name:'Desk Lamp', c1:'#16130f', c2:'#f0c07a', dark:true,
    note:'Amber dark — easy on the eyes at 2am',
    palette:{
      bg:'#16130f', s1:'#1d1913', s2:'#241f18', s3:'#2c261d', s4:'#352e23', s5:'#41382b',
      ov:'rgba(240,192,122,.05)', ovs:'rgba(240,192,122,.09)',
      ink:'#e8ddc8', ink2:'#c3b59b', ink3:'#9b8e77', ink4:'#7a6e58',
      line:'#2e2820', line2:'#3a3327', line3:'#4a402f',
      acc:'#f0c07a', acc2:'#d8a75f', accInk:'#1b1610', accSoft:'rgba(240,192,122,.10)', accLine:'rgba(240,192,122,.28)',
      grad:'linear-gradient(135deg,#f0c07a 0%,#c98f3f 100%)',
      docBg:'#1e1913', docInk:'#ded1b8', caret:'#f0c07a', sel:'#f0c07a', selInk:'#1b1610'
    }
  },
  {
    id:'ink', name:'Ink', c1:'#101214', c2:'#e9edf1', dark:true,
    note:'Cool monochrome, high contrast',
    palette:{
      bg:'#101214', s1:'#16191c', s2:'#1c2024', s3:'#24282d', s4:'#2d3238', s5:'#3a4047',
      ov:'rgba(255,255,255,.05)', ovs:'rgba(255,255,255,.09)',
      ink:'#e9edf1', ink2:'#b9c2cb', ink3:'#8c959e', ink4:'#666e76',
      line:'#23272b', line2:'#2c3136', line3:'#3b4249',
      acc:'#e9edf1', acc2:'#cdd5dc', accInk:'#101214', accSoft:'rgba(233,237,241,.08)', accLine:'rgba(233,237,241,.22)',
      grad:'linear-gradient(135deg,#e9edf1 0%,#9aa4ad 100%)',
      docBg:'#15181b', docInk:'#dfe5ea', caret:'#7cc7ff', sel:'#7cc7ff', selInk:'#0d1013'
    }
  },
  {
    id:'noir', name:'Noir', c1:'#000000', c2:'#ffffff', dark:true,
    note:'True black — OLED and focus friendly',
    palette:{
      bg:'#000000', s1:'#0a0a0a', s2:'#111111', s3:'#181818', s4:'#212121', s5:'#2b2b2b',
      ov:'rgba(255,255,255,.05)', ovs:'rgba(255,255,255,.09)',
      ink:'#ededed', ink2:'#bdbdbd', ink3:'#8a8a8a', ink4:'#636363',
      line:'#1c1c1c', line2:'#252525', line3:'#333333',
      acc:'#ffffff', acc2:'#d4d4d4', accInk:'#000000', accSoft:'rgba(255,255,255,.08)', accLine:'rgba(255,255,255,.20)',
      grad:'linear-gradient(135deg,#ffffff 0%,#9e9e9e 100%)',
      docBg:'#0d0d0d', docInk:'#e3e3e3', caret:'#ffd479', sel:'#ffd479', selInk:'#0d0d0d'
    }
  },
  {
    id:'midnight', name:'Midnight', c1:'#0d1420', c2:'#7cc7ff', dark:true,
    note:'Deep navy dark with a cool blue accent',
    palette:{
      bg:'#0d1420', s1:'#131b28', s2:'#19222f', s3:'#202a38', s4:'#283343', s5:'#334051',
      ov:'rgba(124,199,255,.05)', ovs:'rgba(124,199,255,.09)',
      ink:'#dbe4f0', ink2:'#adb9c9', ink3:'#8391a3', ink4:'#5f6b7c',
      line:'#1a2331', line2:'#222d3d', line3:'#2e3b4d',
      acc:'#7cc7ff', acc2:'#5aa9e6', accInk:'#0a1017', accSoft:'rgba(124,199,255,.10)', accLine:'rgba(124,199,255,.28)',
      grad:'linear-gradient(135deg,#7cc7ff 0%,#3b82c4 100%)',
      docBg:'#101825', docInk:'#d3dfee', caret:'#7cc7ff', sel:'#7cc7ff', selInk:'#0a1017'
    }
  },
  {
    id:'ember', name:'Ember', c1:'#1a1310', c2:'#ff8a5c', dark:true,
    note:'Warm ember dark — a fireside glow at night',
    palette:{
      bg:'#1a1310', s1:'#211814', s2:'#281d18', s3:'#30241e', s4:'#3a2c25', s5:'#46362d',
      ov:'rgba(255,138,92,.05)', ovs:'rgba(255,138,92,.09)',
      ink:'#ecdfd6', ink2:'#c6b3a6', ink3:'#9b8578', ink4:'#77655a',
      line:'#2a1e19', line2:'#362821', line3:'#453329',
      acc:'#ff8a5c', acc2:'#e56f3e', accInk:'#1a1310', accSoft:'rgba(255,138,92,.12)', accLine:'rgba(255,138,92,.30)',
      grad:'linear-gradient(135deg,#ff8a5c 0%,#c2502a 100%)',
      docBg:'#211713', docInk:'#e6d6cb', caret:'#ff8a5c', sel:'#ff8a5c', selInk:'#1a1310'
    }
  },
  {
    id:'forest', name:'Forest', c1:'#0e1512', c2:'#8fd6a8', dark:true,
    note:'Deep green dark — calm, low glare',
    palette:{
      bg:'#0e1512', s1:'#141d19', s2:'#1a251f', s3:'#212e27', s4:'#293930', s5:'#34463c',
      ov:'rgba(143,214,168,.05)', ovs:'rgba(143,214,168,.09)',
      ink:'#dce8e1', ink2:'#aebdb4', ink3:'#84948b', ink4:'#61706a',
      line:'#1a2620', line2:'#22302a', line3:'#2f4136',
      acc:'#8fd6a8', acc2:'#68b184', accInk:'#0b1210', accSoft:'rgba(143,214,168,.10)', accLine:'rgba(143,214,168,.28)',
      grad:'linear-gradient(135deg,#8fd6a8 0%,#3f8a5d 100%)',
      docBg:'#111a16', docInk:'#d3e2d9', caret:'#8fd6a8', sel:'#8fd6a8', selInk:'#0b1210'
    }
  },
  {
    id:'graphite', name:'Graphite', c1:'#141517', c2:'#c8cdd6', dark:true,
    note:'Neutral graphite — quiet, no colour cast',
    palette:{
      bg:'#141517', s1:'#1b1c1f', s2:'#212327', s3:'#292b30', s4:'#32353b', s5:'#3e424a',
      ov:'rgba(255,255,255,.05)', ovs:'rgba(255,255,255,.09)',
      ink:'#e2e4e8', ink2:'#b4b8bf', ink3:'#8b9099', ink4:'#666b74',
      line:'#222428', line2:'#2b2e33', line3:'#393d44',
      acc:'#c8cdd6', acc2:'#a9b0bb', accInk:'#141517', accSoft:'rgba(200,205,214,.08)', accLine:'rgba(200,205,214,.22)',
      grad:'linear-gradient(135deg,#c8cdd6 0%,#7d8590 100%)',
      docBg:'#17191c', docInk:'#dde0e5', caret:'#9ecbff', sel:'#9ecbff', selInk:'#0f1114'
    }
  }
];

// Compact palette → the full CSS custom-property set every theme must define
function themeTokens(t){
  const p = t.palette, dark = !!t.dark;
  return {
    '--bg':p.bg, '--surface-1':p.s1, '--surface-2':p.s2, '--surface-3':p.s3,
    '--surface-4':p.s4, '--surface-5':p.s5,
    '--overlay':p.ov, '--overlay-strong':p.ovs,
    '--ink':p.ink, '--ink-2':p.ink2, '--ink-3':p.ink3, '--ink-4':p.ink4,
    '--line':p.line, '--line-2':p.line2, '--line-3':p.line3,
    '--accent':p.acc, '--accent-2':p.acc2, '--accent-soft':p.accSoft,
    '--accent-line':p.accLine, '--accent-ink':p.accInk, '--grad':p.grad,
    '--doc-bg':p.docBg, '--doc-ink':p.docInk,
    '--caret':p.caret, '--sel':p.sel, '--sel-ink':p.selInk,
    '--e-1': dark ? '0 1px 2px rgba(0,0,0,.40)'    : '0 1px 2px rgba(0,0,0,.06)',
    '--e-2': dark ? '0 4px 12px rgba(0,0,0,.45)'   : '0 4px 12px rgba(0,0,0,.08)',
    '--e-3': dark ? '0 8px 24px rgba(0,0,0,.50)'   : '0 8px 24px rgba(0,0,0,.10)',
    '--e-4': dark ? '0 16px 40px rgba(0,0,0,.55)'  : '0 16px 40px rgba(0,0,0,.14)'
  };
}

function themeById(id){
  return THEMES.find(t => t.id === id) || THEMES.find(t => t.id === 'night') || THEMES[0];
}

// Every theme is dark, so this only has to normalise ids (old saved values
// like 'auto' / 'paper' / 'eye' fall back to Night instead of breaking boot)
function resolveThemeId(id){
  return THEMES.some(t => t.id === id) ? id : 'night';
}

// Write a theme's tokens onto <html> and <body> (inline beats any stylesheet)
function applyThemeVars(id){
  const tid = resolveThemeId(id);
  const t = themeById(tid);
  const toks = themeTokens(t);
  const html = document.documentElement, body = document.body;
  Object.keys(toks).forEach(k => {
    html.style.setProperty(k, toks[k]);
    body.style.setProperty(k, toks[k]);
  });
  const scheme = t.dark ? 'dark' : 'light';
  html.style.colorScheme = scheme;
  body.style.colorScheme = scheme;
  body.setAttribute('data-theme', id || 'night');
  body.setAttribute('data-theme-resolved', tid);
  // cache the resolved tokens so the next boot can paint before JS loads
  try{
    localStorage.setItem('sf6_theme', JSON.stringify({ id:id || 'night', resolved:tid, dark:!!t.dark, scheme, tokens:toks }));
  }catch(e){}
  return t;
}

// ═══════════════════════════════════════════════════════════
//   STATE
// ═══════════════════════════════════════════════════════════

const S = {
  config:{
    // ── appearance ──
    theme:'night',            // colour theme id from THEMES
    style:'vercel',           // style preset
    color:'minimal',          // colour preset
    eyeComfort:false,         // warm light filter over any theme
    eyeComfortLevel:40,       // 0–100 → overlay strength
    uiScale:1,
    layout:'classic',

    // ── motion ──
    motionOn:true,
    motionEffect:'bars',
    motionColor:'#fab387',
    motionSync:false,
    reduceMotion:false,
    richAnims:true,
    animSpeed:1,

    // ── sound ──
    sound:true,

    // ── player ──
    visualizerAlign:'flex-end',   // 'center' | 'flex-end'  ← bars grow bottom-to-top
    musicProxy:false,             // route catbox URLs through a CORS proxy
    videoVolume:1,
    musicVolume:1,
    videoAspect:'fit',
    videoPlaylist:[],
    musicPlaylist:[],
    videoLibrary:[],
    musicLibrary:[],
    musicCurrent:0,
    musicShuffle:false,
    musicRepeat:false,

    // ── privacy ──
    offlineMode:false
  },

  /* Which page the router is showing (pages.js owns this) */
  page:'overview'
};

// ═══════════════════════════════════════════════════════════
//   UTILITIES
// ═══════════════════════════════════════════════════════════

const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = () => 'i' + Math.random().toString(36).slice(2,10);
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

function toast(msg, kind = 'ok'){
  const el = $('toast');
  if(!el) return;
  $('toastMsg').textContent = msg;
  el.className = 'toast show' + (kind === 'err' ? ' err' : kind === 'warn' ? ' warn' : '');
  const icon = el.querySelector('i');
  if(icon) icon.className = kind === 'err' ? 'bi bi-exclamation-triangle-fill' : kind === 'warn' ? 'bi bi-exclamation-circle-fill' : 'bi bi-check-circle-fill';
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2600);
}

function toastLeft(msg, kind){
  kind = kind || 'info';
  const el = document.getElementById('toastLeft');
  if(!el) return;
  const msgEl = document.getElementById('toastLeftMsg');
  if(msgEl) msgEl.textContent = msg;
  el.className = 'toast-left show' + (kind === 'err' ? ' err' : kind === 'warn' ? ' warn' : '');
  const icon = el.querySelector('i');
  if(icon) icon.className = kind === 'err'
    ? 'bi bi-exclamation-triangle-fill'
    : kind === 'warn' ? 'bi bi-exclamation-circle-fill' : 'bi bi-info-circle-fill';
  clearTimeout(el._t);
  el._t = setTimeout(function(){ el.classList.remove('show'); }, 3000);
}
window.toastLeft = toastLeft;

// ═══════════════════════════════════════════════════════════
//   PERSISTENCE
// ═══════════════════════════════════════════════════════════

const STORE = {CFG:'sf7_config', DATA:'sf7_data'};

function save(){
  /* Overlay panes load the app in a read-only view — they must never write
     over the config the main window is using. */
  if(window.SF_VIEW) return;
  try{
    localStorage.setItem(STORE.CFG, JSON.stringify(S.config));
  }catch(e){ console.warn('save failed', e); }
}

function load(){
  try{
    const cfg = localStorage.getItem(STORE.CFG);
    if(cfg) Object.assign(S.config, JSON.parse(cfg));
  }catch(e){ console.warn('load failed', e); }
}

// ═══════════════════════════════════════════════════════════
//   EXPORT TO GLOBAL SCOPE
// ═══════════════════════════════════════════════════════════

window.S = S;
window.THEMES = THEMES;
window.themeById = themeById;
window.themeTokens = themeTokens;
window.resolveThemeId = resolveThemeId;
window.applyThemeVars = applyThemeVars;
window.$ = $;
window.$$ = $$;
window.esc = esc;
window.uid = uid;
window.debounce = debounce;
window.toast = toast;
window.save = save;
window.load = load;

console.log('%c ✓ state.js loaded (' + THEMES.length + ' themes)', 'color:#10b981;font-weight:600;');
