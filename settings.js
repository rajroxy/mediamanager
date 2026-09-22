/* ═══════════════════════════════════════════════════════════
   ScriptForge — Settings
   Modal settings · Per-mode format page
   ═══════════════════════════════════════════════════════════ */

const SETTINGS = {};

// ═══ Open settings modal ═══
SETTINGS.open = function(){
  const root = $('modalRoot');
  root.innerHTML = '';
  root.classList.add('open');

  const scrim = document.createElement('div');
  scrim.className = 'modal-scrim';
  scrim.innerHTML = `
    <div class="modal" style="max-width:920px;">
      <div class="modal-head">
        <h2><i class="bi bi-sliders" style="color:var(--accent-2);"></i> Settings</h2>
        <button class="icon-btn v-close" data-act="set-close">
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  </svg>
</button>
      </div>
      <div id="setTabs" style="display:flex;gap:0;padding:0 20px;border-bottom:1px solid var(--line);overflow-x:auto;"></div>
      <div class="modal-body" id="setBody"></div>
      <div class="modal-foot">
        <button class="btn btn-ghost" data-act="set-close">Close</button>
        <button class="btn btn-primary" data-act="set-save"><i class="bi bi-check-lg"></i> Save</button>
      </div>
    </div>
  `;
  root.appendChild(scrim);

     const tabs = [
    {id:'ai',           icon:'stars',          label:'AI Assistance'},
    {divider:true},
    {id:'general',      icon:'gear',           label:'General'},
    {id:'appearance',   icon:'palette',        label:'Appearance'},
    {id:'typography',   icon:'fonts',          label:'Typography'},
    {id:'plugins',      icon:'puzzle',         label:'Plugins'},
    {id:'language',     icon:'translate',      label:'Language'},
    {id:'privacy',      icon:'shield-lock',    label:'Privacy'},
    {id:'sound',        icon:'volume-up',      label:'Sound'}
  ];
  const tabBar = $('setTabs');
  tabs.forEach(t => {
    if(t.divider){
      const d = document.createElement('span');
      d.className = 'set-tab-sep';
      tabBar.appendChild(d);
      return;
    }
    const b = document.createElement('button');
    b.className = 'set-tab' + (t.id === 'ai' ? ' active' : '');
    b.innerHTML = `<i class="bi bi-${t.icon}"></i> ${t.label}`;
    b.dataset.setTab = t.id;
    tabBar.appendChild(b);
  });

  renderSetTab('ai');

};

function renderSetTab(id){
  document.querySelectorAll('[data-set-tab]').forEach(b => {
    const on = b.dataset.setTab === id;
    b.classList.toggle('active', on);
    b.style.borderBottomColor = '';
    b.style.color = '';
  });
  const body = $('setBody');
  if(!body) return;
  body.innerHTML = '';
  // two tabs are named differently to their renderer — without this they'd
  // open an empty panel
  const RENDER_ALIAS = { typography:'type' };
  const key = RENDER_ALIAS[id] || id;
  if(SETTINGS.renderers[key]) SETTINGS.renderers[key](body);
  enhanceSelects(body);
}

// ═══ Dropdowns — every <select class="sel"> opens as the Statistics-style
//     card (same .stats-cat-* look and theme tokens). The real <select>
//     stays in the DOM (visually hidden) so all existing value/change
//     handlers keep working untouched. ═══
function enhanceSelects(root){
  root.querySelectorAll('select.sel').forEach(function(sel){
    if(sel.dataset.dd) return;
    sel.dataset.dd = '1';
    sel.style.display = 'none';

    const card = document.createElement('div');
    card.className = 'stats-cat-card dd-card';

    const title = document.createElement('button');
    title.type = 'button';
    title.className = 'stats-cat-title';
    title.innerHTML = '<span class="dd-value"></span><i class="bi bi-chevron-down stats-cat-caret"></i>';

    const list = document.createElement('div');
    list.className = 'stats-cat-list';

    function sync(){
      const opt = sel.options[sel.selectedIndex];
      title.querySelector('.dd-value').textContent = opt ? opt.textContent : '';
    }

    function paint(){
      list.querySelectorAll('.stats-cat-item').forEach(function(it){
        it.classList.toggle('active', it.dataset.value === sel.value);
      });
    }

    function addItem(opt){
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'stats-cat-item';
      item.dataset.value = opt.value;
      const span = document.createElement('span');
      span.textContent = opt.textContent;
      item.appendChild(span);
      item.insertAdjacentHTML('beforeend', '<i class="bi bi-check2"></i>');
      item.onclick = function(){
        sel.value = opt.value;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
        sync();
        paint();
        card.classList.remove('open');
      };
      list.appendChild(item);
    }

    // rebuild from the <select>'s current options — called again whenever
    // code refills the select (e.g. the provider → model list). The select's
    // grouping is kept too: each <optgroup> becomes a header row, the same
    // way the native list shows it (Free API tiers · Local · Bring your own key).
    function build(){
      list.innerHTML = '';
      const kids = sel.children.length ? Array.from(sel.children) : Array.from(sel.options);
      kids.forEach(function(n){
        if(n.tagName === 'OPTGROUP'){
          const h = document.createElement('div');
          h.className = 'dd-group';
          h.textContent = n.label;
          list.appendChild(h);
          Array.from(n.children).forEach(addItem);
        } else if(n.tagName === 'OPTION'){
          addItem(n);
        }
      });
      // a long list (AI providers, fonts) gets real room instead of a 150px slit
      card.classList.toggle('dd-long', sel.options.length > 12);
      sync();
      paint();
    }

    sel._ddRefresh = build;

    title.onclick = function(e){
      e.stopPropagation();
      document.querySelectorAll('.dd-card.open').forEach(function(c){ if(c !== card) c.classList.remove('open'); });
      card.classList.toggle('open');
    };

    // carry over an explicit width the renderer asked for (e.g. the font picker)
    if(sel.style.minWidth) card.style.minWidth = sel.style.minWidth;
    if(sel.style.width) card.style.width = sel.style.width;

    card.appendChild(title);
    card.appendChild(list);
    build();
    sel.parentNode.insertBefore(card, sel.nextSibling);
  });
}

// close any open dropdown on an outside click
document.addEventListener('click', function(e){
  if(e.target.closest('.dd-card')) return;
  document.querySelectorAll('.dd-card.open').forEach(function(c){ c.classList.remove('open'); });
}, true);

// ═══ Small helpers for building rows ═══
function row(label, desc, control){
  const r = document.createElement('div');
  r.className = 'set-row';
  const l = document.createElement('div');
  l.innerHTML = `<div class="set-label">${label}</div>${desc ? `<div class="set-desc">${desc}</div>` : ''}`;
  r.appendChild(l);
  const c = document.createElement('div');
  c.className = 'set-ctrl';
  if(typeof control === 'string') c.innerHTML = control;
    else if(control && control instanceof Node) c.appendChild(control);
  else if(Array.isArray(control)) control.forEach(function(n){ if(n && n instanceof Node) c.appendChild(n); });
  else if(control !== undefined && control !== null) c.appendChild(document.createTextNode(String(control)));
  r.appendChild(c);
  return r;
}

function card(title, icon){
  const d = document.createElement('div');
  d.className = 'set-card';
  d.innerHTML = `<div class="set-card-title"><i class="bi bi-${icon}"></i> ${title}</div>`;
  return d;
}

/* A toggle row that applies its change immediately — used by the tabs that
   inherited the experimental options. */
function cfgRow(cardEl, label, hint, key, after){
  const t = document.createElement('div');
  t.className = 'tgl';
  t.classList.toggle('on', !!S.config[key]);
  t.onclick = function(){
    S.config[key] = !S.config[key];
    t.classList.toggle('on', S.config[key]);
    applyConfig(key);
    save();
    if(typeof after === 'function') after(t);
  };
  cardEl.appendChild(row(label, hint, t));
  return t;
}
function classRow(cardEl, label, hint, key, cls, onWord, offWord){
  const t = document.createElement('div');
  t.className = 'tgl';
  t.classList.toggle('on', !!S.config[key]);
  t.onclick = function(){
    S.config[key] = !S.config[key];
    t.classList.toggle('on', S.config[key]);
    document.body.classList.toggle(cls, S.config[key]);
    save();
  };
  cardEl.appendChild(row(label, hint || (onWord || ''), t));
  return t;
}

function bindToggle(el, key){
  el.classList.toggle('on', !!S.config[key]);
  el.addEventListener('click', () => {
    S.config[key] = !S.config[key];
    el.classList.toggle('on', S.config[key]);
    applyConfig(key);
    save();
  });
}

// ═══ Config appliers ═══
function applyConfig(key){
  const c = S.config;
  const root = document.documentElement;
  switch(key){
    case 'theme': applyThemeVars(c.theme); break;
    case 'font':
      root.style.setProperty('--doc-font', `'${c.font}', serif`);
      const ed = $('editor'); if(ed) ed.style.fontFamily = `'${c.font}', serif`;
      break;
    case 'fontSize':
      root.style.setProperty('--doc-size', c.fontSize + 'px');
      const e2 = $('editor'); if(e2) e2.style.fontSize = c.fontSize + 'px';
      break;
    case 'lineHeight':
      root.style.setProperty('--doc-line', c.lineHeight);
      const e3 = $('editor'); if(e3) e3.style.lineHeight = c.lineHeight;
      break;
    case 'letterSpacing':
      root.style.setProperty('--doc-track', c.letterSpacing + 'px');
      break;
    case 'wordSpacing':
      root.style.setProperty('--doc-word', c.wordSpacing + 'px');
      break;
    case 'paraSpacing':
      root.style.setProperty('--doc-para', c.paraSpacing + 'px');
      break;
    case 'editorWidth':
      root.style.setProperty('--doc-max', c.editorWidth);
      break;
    case 'uiScale':
      root.style.setProperty('--ui-scale', c.uiScale);
      document.body.style.zoom = c.uiScale;
      break;
    case 'eyeComfort':
      // a warm light filter across the whole app — independent of the theme
      document.body.classList.toggle('eye-comfort', !!c.eyeComfort);
      root.style.setProperty('--eye-amount', eyeComfortAlpha());
      break;
    case 'expOverlay':
      // the editor toolbar carries one pane button: the docked split screen
      // normally, the floating overlay when this is on
      if(typeof renderToolbar === 'function') renderToolbar();
      if(typeof overlayApplyMode === 'function') overlayApplyMode();
      if(typeof overlayGeometry === 'function' && S.config.overlay && S.config.overlay.open) overlayGeometry();
      break;
    case 'expMixedFonts':
      document.body.classList.toggle('mixed-fonts', !!c.expMixedFonts);
      break;
    case 'expOrganize':
      // the assistant and the editor's right-click menu both grow the action
      if(typeof buildAIPanel === 'function') buildAIPanel();
      break;
    case 'expHinglish':
      if(typeof renderFabAI === 'function') renderFabAI();
      break;
  }
}

// 0–100 strength → a subtle overlay alpha (0 → 0.26)
function eyeComfortAlpha(){
  const lvl = Math.max(0, Math.min(100, Number(S.config.eyeComfortLevel ?? 40)));
  return String((lvl / 100) * 0.26);
}
window.eyeComfortAlpha = eyeComfortAlpha;

function applyAllConfig(){
  /* Shadows · Opacity · Blur · Glass UI are gone from Settings — the app runs
     flat and opaque, and any value left in storage from before is cleared so
     nothing looks glassy any more. */
  S.config.shadowIntensity = 0;
  S.config.surfaceOpacity  = 1;
  S.config.borderOpacity   = 1;
  S.config.backdropBlur    = 0;
  S.config.glassUI         = false;
  document.body.classList.remove('glass-ui');
  const rs = document.documentElement.style;
  rs.setProperty('--shadow-intensity', 0);
  rs.setProperty('--surface-opacity', 1);
  rs.setProperty('--border-opacity', 1);
  rs.setProperty('--backdrop-blur', '0px');
  ['theme','font','fontSize','lineHeight','letterSpacing','wordSpacing','paraSpacing','editorWidth','uiScale','eyeComfort',
   'expMixedFonts','expOverlay'].forEach(applyConfig);
  if(typeof applyVisualizerAlign === 'function') applyVisualizerAlign();
}

function applyVisualizerAlign(){
  const viz = document.querySelector('.mv-visualizer');
  if(viz) viz.style.alignItems = S.config.visualizerAlign || 'center';
}
window.applyVisualizerAlign = applyVisualizerAlign;

function hexToRgb(h){
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
  return m ? {r: parseInt(m[1],16), g: parseInt(m[2],16), b: parseInt(m[3],16)} : null;
}

// ═══ Renderers per tab ═══
SETTINGS.renderers = {};

// ═══ COLOR THEMES — one grid, used by both Appearance and Look ═══
function setTheme(id){
  S.config.theme = id;
  applyThemeVars(id);
  save();
}
window.setTheme = setTheme;

function buildThemeGrid(){
  const wrap = document.createElement('div');
  const grid = document.createElement('div');
  grid.className = 'grid-auto';

  const paint = () => {
    grid.querySelectorAll('[data-theme-pick]').forEach(x =>
      x.classList.toggle('on', x.dataset.themePick === (S.config.theme || 'night')));
  };

  THEMES.forEach(t => {
    const tile = document.createElement('div');
    tile.className = 'tile' + (t.id === (S.config.theme || 'night') ? ' on' : '');
    tile.dataset.themePick = t.id;
    tile.innerHTML = `
      <div style="display:flex;height:40px;border-radius:8px;overflow:hidden;margin-bottom:8px;border:1px solid var(--line-2);">
        <div style="flex:1;background:${t.c1}"></div>
        <div style="flex:1;background:${t.c2}"></div>
      </div>
      <div style="font-size:11.5px;font-weight:600;">${t.name}</div>
      <div style="font-size:10.5px;color:var(--ink-4);margin-top:3px;line-height:1.4;">${t.note || ''}</div>
    `;
    grid.appendChild(tile);
  });

  grid.addEventListener('click', e => {
    const el = e.target.closest('[data-theme-pick]');
    if(!el) return;
    const id = el.dataset.themePick;
    setTheme(id);
    paint();
    toast('Theme: ' + themeById(resolveThemeId(id)).name);
  });

  wrap.appendChild(grid);
  return wrap;
}

// ═══ APPEARANCE ═══
SETTINGS.renderers.appearance = function(root){

  // ── COLOR THEME — dark palettes built for long writing sessions ──
  const c0 = card('Color theme', 'palette2');
  c0.appendChild(buildThemeGrid());
  root.appendChild(c0);

  // ── EYE COMFORT — a toggle, not a theme, so it layers over any palette ──
  const cEye = card('Comfort', 'brightness-high');

  const eyeTgl = document.createElement('div');
  eyeTgl.className = 'tgl';
  bindToggle(eyeTgl, 'eyeComfort');
  cEye.appendChild(row('Eye comfort', 'Warm light filter over any theme — cuts blue light', eyeTgl));

  const eyeRng = document.createElement('input');
  eyeRng.type = 'range';
  eyeRng.className = 'rng';
  eyeRng.min = '0'; eyeRng.max = '100'; eyeRng.step = '5';
  eyeRng.value = S.config.eyeComfortLevel ?? 40;
  const eyeVal = document.createElement('span');
  eyeVal.className = 'rng-val';
  eyeVal.textContent = (S.config.eyeComfortLevel ?? 40) + '%';
  eyeRng.oninput = function(){
    S.config.eyeComfortLevel = parseInt(eyeRng.value, 10) || 0;
    eyeVal.textContent = S.config.eyeComfortLevel + '%';
    applyConfig('eyeComfort');
    save();
  };
  cEye.appendChild(row('Filter strength', 'How warm the filter is (0 = off)', [eyeRng, eyeVal]));

  const eyeHint = document.createElement('div');
  eyeHint.className = 'tiny muted';
  eyeHint.style.marginTop = '4px';
  eyeHint.textContent = 'Layers over every theme and every light-on-dark surface — including the overlay screen and the players.';
  cEye.appendChild(eyeHint);
  root.appendChild(cEye);

  /* ── motion effect ── */
  const c10 = card('Motion', 'activity');
  const moEff = document.createElement('select');
  moEff.className = 'sel';
  (window.MOTION ? MOTION.EFFECTS : ['none']).forEach(function(id){
    const o = document.createElement('option');
    o.value = id; o.textContent = id;
    moEff.appendChild(o);
  });
  moEff.value = S.config.motionEffect || 'rain';
  moEff.onchange = function(){
    S.config.motionEffect = moEff.value;
    if(moEff.value === 'none') S.config.motionOn = false;
    save();
    if(window.MOTION) MOTION.sync();
    renderSetTab('appearance');
  };
  c10.appendChild(row('Motion effect', 'Animated canvas drawn on the player stage', moEff));

  const moOn = document.createElement('div');
  moOn.className = 'tgl';
  moOn.classList.toggle('on', !!S.config.motionOn);
  moOn.onclick = function(){
    S.config.motionOn = !S.config.motionOn;
    if(S.config.motionOn && (!S.config.motionEffect || S.config.motionEffect === 'none'))
      S.config.motionEffect = 'rain';
    save();
    if(window.MOTION) MOTION.sync();
    renderSetTab('appearance');
  };
  c10.appendChild(row('Enable motion', 'Show the effect on the player stage', moOn));

  function motionRange(label, desc, key, min, max, step, def){
    const inp = document.createElement('input');
    inp.type = 'range'; inp.className = 'rng';
    inp.min = min; inp.max = max; inp.step = step;
    inp.value = (S.config[key] === undefined ? def : S.config[key]);
    const val = document.createElement('span');
    val.className = 'rng-val';
    val.textContent = parseFloat(inp.value).toFixed(1);
    inp.oninput = function(){
      S.config[key] = parseFloat(inp.value);
      val.textContent = parseFloat(inp.value).toFixed(1);
      save();
    };
    c10.appendChild(row(label, desc, [inp, val]));
  }
  motionRange('Speed', 'How fast the effect runs', 'motionSpeed', 0.2, 2.5, 0.1, 1);
  motionRange('Intensity', 'Brightness and thickness', 'motionIntensity', 0.2, 2, 0.1, 1);
  motionRange('Reactivity', 'How hard the music drives it', 'motionReact', 0, 2, 0.1, 1);

  const moCol = document.createElement('input');
  moCol.type = 'color';
  moCol.className = 'inp';
  moCol.value = S.config.motionColor || '#fab387';
  moCol.oninput = function(){ S.config.motionColor = moCol.value; save(); };
  c10.appendChild(row('Colour', 'Effect colour', moCol));

  const moSync = document.createElement('div');
  moSync.className = 'tgl';
  moSync.classList.toggle('on', S.config.motionSync !== false);
  moSync.onclick = function(){
    S.config.motionSync = (S.config.motionSync === false);
    moSync.classList.toggle('on', S.config.motionSync);
    save();
  };
  c10.appendChild(row('Sync to music', 'Drive the effect with the audio', moSync));

  const proxyTgl = document.createElement('div');
  proxyTgl.className = 'tgl';
  proxyTgl.classList.toggle('on', !!S.config.musicProxy);
  proxyTgl.onclick = function(){
    S.config.musicProxy = !S.config.musicProxy;
    proxyTgl.classList.toggle('on', S.config.musicProxy);
    save();
    toast(S.config.musicProxy ? 'Proxy enabled — catbox URLs will route through CORS proxy' : 'Proxy disabled');
  };
  c10.appendChild(row('Proxy catbox URLs', 'Route catbox.moe through a CORS proxy so beat analysis works', proxyTgl));
  
  root.appendChild(c10);

  // ── ANIMATION ──
  const c8 = card('Animation', 'lightning');

  const speedSel = document.createElement('select');
  speedSel.className = 'sel';
  [['0.7','Fast'],['1','Normal'],['1.5','Slow'],['2.5','Very slow']].forEach(function(p){
    const o = document.createElement('option');
    o.value = p[0]; o.textContent = p[1];
    if(p[0] === String(S.config.animSpeed || '1')) o.selected = true;
    speedSel.appendChild(o);
  });
  speedSel.onchange = function(){
    S.config.animSpeed = parseFloat(speedSel.value);
    document.documentElement.style.setProperty('--anim-speed', S.config.animSpeed);
    save();
  };
  c8.appendChild(row('Speed', 'Multiplier for all transitions', speedSel));

  const reduceMotion = document.createElement('div');
  reduceMotion.className = 'tgl';
  reduceMotion.classList.toggle('on', !!S.config.reduceMotion);
  reduceMotion.onclick = function(){
    S.config.reduceMotion = !S.config.reduceMotion;
    reduceMotion.classList.toggle('on', S.config.reduceMotion);
    document.body.classList.toggle('reduce-motion', S.config.reduceMotion);
    save();
  };
  c8.appendChild(row('Reduce motion', 'Minimize animations and transitions', reduceMotion));

  const richAnims = document.createElement('div');
  richAnims.className = 'tgl';
  richAnims.classList.toggle('on', S.config.richAnims !== false);
  richAnims.onclick = function(){
    S.config.richAnims = !(S.config.richAnims !== false);
    richAnims.classList.toggle('on', S.config.richAnims);
    document.body.classList.toggle('no-animations', !S.config.richAnims);
    save();
  };
  c8.appendChild(row('Rich animations', 'Extra transitions, spring easing, motion effects', richAnims));

  root.appendChild(c8);

  const c11 = card('Interface', 'window-stack');
  classRow(c11, 'Overlay screen', 'Floating overlay pane on the editor toolbar — off leaves the docked split screen', 'expOverlay', 'overlay-on');
  root.appendChild(c11);

};

// ═══ APPLY THEME IMMEDIATELY ═══
function applyThemeNow(){
  document.body.setAttribute('data-writing-mode', S.mode || 'novel');
  document.body.setAttribute('data-style', S.config.style || 'vercel');
  document.body.setAttribute('data-color', S.config.color || 'minimal');
  applyThemeVars(S.config.theme || 'night');
}
window.applyThemeNow = applyThemeNow;

SETTINGS.renderers.general = function(root){
  const c1 = card('Core', 'gear');
  const autoSave = document.createElement('div');
  autoSave.className = 'tgl';
  bindToggle(autoSave, 'autoSave');
  c1.appendChild(row('Auto-save', 'Save changes every few seconds', autoSave));

  const autoVer = document.createElement('div');
  autoVer.className = 'tgl';
  bindToggle(autoVer, 'autoVersion');
  c1.appendChild(row('Auto-snapshot', 'Save a snapshot every 10 minutes', autoVer));

  root.appendChild(c1);

  const c2 = card('Interface', 'display');
  const scale = document.createElement('input');
  scale.type = 'range';
  scale.className = 'rng';
  scale.min = .7; scale.max = 1.4; scale.step = .05;
  scale.value = S.config.uiScale;
  const scaleVal = document.createElement('span');
  scaleVal.className = 'rng-val';
  scaleVal.textContent = Math.round(S.config.uiScale*100) + '%';
  scale.addEventListener('input', e => {
    S.config.uiScale = parseFloat(e.target.value);
    scaleVal.textContent = Math.round(S.config.uiScale*100) + '%';
    applyConfig('uiScale');
  });
  c2.appendChild(row('UI scale', 'Zoom the whole interface', [scale, scaleVal]));

  root.appendChild(c2);

  const snap = document.createElement('button');
  snap.className = 'btn btn-ghost';
  snap.innerHTML = '<i class="bi bi-bookmark-plus"></i> Snapshot now';
  snap.onclick = function(){
    if(typeof TOOLS !== 'undefined' && typeof TOOLS.snapshot === 'function') TOOLS.snapshot();
    else toast('Snapshot not available', 'warn');
    closeModal();
  };
  c1.appendChild(row('Manual snapshot', 'Save a version right now', snap));
};

SETTINGS.renderers.ai = function(root){
  const prov = aiProvider(S.config.provider);

  const c1 = card('Provider', 'cloud');
  const provSel = document.createElement('select');
  provSel.className = 'sel';
  provSel.style.minWidth = '260px';
  // grouped: free cloud tiers · local · bring your own key
  const byGroup = {};
  AI_PROVIDERS.forEach(p => { (byGroup[p.group] = byGroup[p.group] || []).push(p); });
  Object.keys(byGroup).forEach(g => {
    const og = document.createElement('optgroup');
    og.label = g;
    byGroup[g].forEach(p => {
      const o = document.createElement('option');
      o.value = p.id; o.textContent = p.name;
      if(p.id === S.config.provider) o.selected = true;
      og.appendChild(o);
    });
    provSel.appendChild(og);
  });
  provSel.onchange = () => {
    S.config.provider = provSel.value;
    save();
    renderSetTab('ai');           // key + endpoint + model follow the provider
  };
  const freeN = AI_PROVIDERS.filter(p => p.group === 'Free API tiers').length;
  const byokN = AI_PROVIDERS.filter(p => p.group === 'Bring your own key').length;
  c1.appendChild(row('AI provider',
    freeN + ' with a free API tier · ' + byokN + ' bring-your-own-key · ' + AI_PROVIDERS.length + ' in total',
    provSel));
  root.appendChild(c1);

  // ── KEY + ENDPOINT for the selected provider (BYOK lives here) ──
  const c2 = card('Key & endpoint', 'key');
  if(prov.keyless){
    const note = document.createElement('div');
    note.className = 'tiny muted';
    note.style.marginBottom = '6px';
    note.textContent = 'No API key needed — this provider runs on your own machine.';
    c2.appendChild(note);
  } else {
    const inp = document.createElement('input');
    inp.type = 'password';
    inp.className = 'inp';
    inp.placeholder = prov.keyPh || '';
    inp.value = aiKeyFor(prov.id) || '';
    inp.style.minWidth = '240px';
    inp.oninput = () => { aiSetKey(prov.id, inp.value.trim()); save(); };
    c2.appendChild(row(prov.keyLabel || 'API key', prov.keyHint || '', inp));
  }

  const base = document.createElement('input');
  base.type = 'text';
  base.className = 'inp';
  base.style.minWidth = '240px';
  base.placeholder = prov.base || 'https://your-endpoint/v1';
  base.value = (S.config.aiBases && S.config.aiBases[prov.id]) || prov.base || '';
  base.oninput = () => {
    if(!S.config.aiBases) S.config.aiBases = {};
    S.config.aiBases[prov.id] = base.value.trim();
    save();
  };
  c2.appendChild(row('Endpoint',
    prov.custom ? 'Required — any OpenAI-compatible base URL'
                : 'Only change this for a proxy or self-hosted server',
    base));
  root.appendChild(c2);

  const c3 = card('Model', 'cpu');
  const sel = document.createElement('select');
  sel.className = 'sel';
  sel.id = 'aiModelSelect';
  sel.style.minWidth = '200px';
  c3.appendChild(row('Model', 'Click Fetch to load models from your provider', sel));

  if(prov.custom){
    const mid = document.createElement('input');
    mid.type = 'text';
    mid.className = 'inp';
    mid.style.minWidth = '200px';
    mid.placeholder = 'e.g. my-model-v1';
    mid.value = aiModelFor('custom') || '';
    mid.oninput = () => { aiSetModel('custom', mid.value.trim()); save(); };
    c3.appendChild(row('Model id', 'Name your endpoint expects', mid));
  }

  const fetchBtn = document.createElement('button');
  fetchBtn.className = 'btn btn-primary';
  fetchBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Fetch models';
  fetchBtn.onclick = async () => {
    const models = await fetchModels();
    if(models.length){
      fillModelSelect(sel, models);
    }
  };
  c3.appendChild(row('Refresh list', 'Pull latest available models', fetchBtn));

  const testBtn = document.createElement('button');
  testBtn.className = 'btn btn-ghost';
  testBtn.innerHTML = '<i class="bi bi-wifi"></i> Test connection';
  const badge = document.createElement('span');
  badge.dataset.conn = '1';
  badge.style.cssText = 'font-size:11.5px;font-weight:600;margin-left:8px;';
  badge.textContent = 'Not tested';
  testBtn.onclick = testConn;
  c3.appendChild(row('Test', 'Verify your API key works', [testBtn, badge]));
  root.appendChild(c3);

  const c4 = card('Generation', 'sliders');
  const temp = document.createElement('input');
  temp.type = 'range';
  temp.className = 'rng';
  temp.min = 0; temp.max = 2; temp.step = .05;
  temp.value = S.config.temperature;
  const tval = document.createElement('span');
  tval.className = 'rng-val';
  tval.textContent = S.config.temperature;
  temp.oninput = () => {
    S.config.temperature = parseFloat(temp.value);
    tval.textContent = S.config.temperature;
    save();
  };
  c4.appendChild(row('Temperature', '0 = precise, 2 = creative', [temp, tval]));

  const mt = document.createElement('input');
  mt.type = 'number';
  mt.className = 'inp sm';
  mt.value = S.config.maxTokens;
  mt.oninput = () => { S.config.maxTokens = parseInt(mt.value) || 4096; save(); };
  c4.appendChild(row('Max tokens', 'Response length limit', mt));
  root.appendChild(c4);

  fillModelSelect(sel, S.config.availableModels[S.config.provider] || getDefaultModels());

  /* ── Assistant actions — the two that used to live under Experimental ── */
  const c5 = card('Assistant actions', 'stars');
  cfgRow(c5, 'Organise my words', 'Adds an action that rebuilds a messy paragraph out of your own words — in the assistant and in the editor context menu', 'expOrganize');
  cfgRow(c5, 'Hinglish conversions', 'Adds Hinglish → हिन्दी and Hinglish → English inside the Translate option of the right-click assistant', 'expHinglish');
  root.appendChild(c5);
};

function fillModelSelect(sel, models){
  sel.innerHTML = '';
  models.forEach(m => {
    const o = document.createElement('option');
    o.value = m.id;
    o.textContent = m.n || m.id;
    if(m.id === aiModelFor(S.config.provider)) o.selected = true;
    sel.appendChild(o);
  });
  if(!sel.value && models[0]) sel.value = models[0].id;
  sel.onchange = () => { aiSetModel(S.config.provider, sel.value); save(); };
}

function getDefaultModels(){
  const list = aiProvider(S.config.provider).models || [];
  return list.length ? list.slice() : [{ id:'', n:'Type a model id above' }];
}

function buildModelDropdown(){
  const sel = $('aiModelSelect');
  if(!sel) return;
  const models = S.config.availableModels[S.config.provider] || getDefaultModels();
  fillModelSelect(sel, models);
  if(typeof sel._ddRefresh === 'function') sel._ddRefresh();   // rebuild the dropdown card
}

SETTINGS.renderers.type = function(root){
  const c1 = card('Font', 'fonts');
  const sel = document.createElement('select');
  sel.className = 'sel';
  sel.style.minWidth = '200px';
  FONTS.forEach(f => {
    const o = document.createElement('option');
    o.value = f.name; o.textContent = f.name;
    if(f.name === S.config.font) o.selected = true;
    sel.appendChild(o);
  });
  sel.onchange = () => { S.config.font = sel.value; applyConfig('font'); save(); };
  c1.appendChild(row('Editor font', 'Font used in the writing canvas', sel));

  const size = document.createElement('input');
  size.type = 'range'; size.className = 'rng';
  size.min = 12; size.max = 40; size.step = .5;
  size.value = S.config.fontSize;
  const sval = document.createElement('span');
  sval.className = 'rng-val';
  sval.textContent = S.config.fontSize + 'px';
  size.oninput = () => {
    S.config.fontSize = parseFloat(size.value);
    sval.textContent = S.config.fontSize + 'px';
    applyConfig('fontSize');
  };
  c1.appendChild(row('Size', '', [size, sval]));

  const lh = document.createElement('input');
  lh.type = 'range'; lh.className = 'rng';
  lh.min = 1.2; lh.max = 2.6; lh.step = .05;
  lh.value = S.config.lineHeight;
  const lval = document.createElement('span');
  lval.className = 'rng-val';
  lval.textContent = S.config.lineHeight;
  lh.oninput = () => {
    S.config.lineHeight = parseFloat(lh.value);
    lval.textContent = S.config.lineHeight;
    applyConfig('lineHeight');
  };
  c1.appendChild(row('Line height', '', [lh, lval]));

  const trk = document.createElement('input');
  trk.type = 'range'; trk.className = 'rng';
  trk.min = -2; trk.max = 6; trk.step = .1;
  trk.value = S.config.letterSpacing;
  const trkVal = document.createElement('span');
  trkVal.className = 'rng-val';
  trkVal.textContent = S.config.letterSpacing + 'px';
  trk.oninput = () => {
    S.config.letterSpacing = parseFloat(trk.value);
    trkVal.textContent = S.config.letterSpacing + 'px';
    applyConfig('letterSpacing');
  };
  c1.appendChild(row('Letter spacing', '', [trk, trkVal]));

  const wrd = document.createElement('input');
  wrd.type = 'range'; wrd.className = 'rng';
  wrd.min = -2; wrd.max = 10; wrd.step = .5;
  wrd.value = S.config.wordSpacing;
  const wrdVal = document.createElement('span');
  wrdVal.className = 'rng-val';
  wrdVal.textContent = S.config.wordSpacing + 'px';
  wrd.oninput = () => {
    S.config.wordSpacing = parseFloat(wrd.value);
    wrdVal.textContent = S.config.wordSpacing + 'px';
    applyConfig('wordSpacing');
  };
  c1.appendChild(row('Word spacing', '', [wrd, wrdVal]));

  const par = document.createElement('input');
  par.type = 'range'; par.className = 'rng';
  par.min = 0; par.max = 40; par.step = 1;
  par.value = S.config.paraSpacing;
  const parVal = document.createElement('span');
  parVal.className = 'rng-val';
  parVal.textContent = S.config.paraSpacing + 'px';
  par.oninput = () => {
    S.config.paraSpacing = parseInt(par.value);
    parVal.textContent = S.config.paraSpacing + 'px';
    applyConfig('paraSpacing');
  };
  c1.appendChild(row('Paragraph spacing', '', [par, parVal]));
  root.appendChild(c1);

  /* ── Writing — behaviour that used to sit in Editor / Experimental ── */
  const c2 = card('Writing', 'pencil');
  classRow(c2, 'Typewriter scroll', 'Keep the cursor vertically centered while typing', 'typewriterMode', 'typewriter-mode');
  classRow(c2, 'Focus dimming', 'Dim everything except the current paragraph', 'focusDim', 'focus-dim');
  cfgRow(c2, 'Live readability', 'Show the Flesch-Kincaid score while typing', 'liveMetrics');
  cfgRow(c2, 'Dictionary autocomplete', 'Suggest words from an offline dictionary', 'dictSuggest');
  root.appendChild(c2);

  /* ── Typing ── */
  const c3 = card('Typing', 'columns');
  const w = document.createElement('select');
  w.className = 'sel';
  [['narrow','Narrow'],['classic','Classic'],['wide','Wide'],['full','Full width']].forEach(function(p){
    const o = document.createElement('option');
    o.value = p[0]; o.textContent = p[1];
    if(p[0] === S.config.editorWidth) o.selected = true;
    w.appendChild(o);
  });
  w.onchange = function(){ S.config.editorWidth = w.value; applyConfig('editorWidth'); save(); };
  c3.appendChild(row('Canvas width', '', w));

  const spell = document.createElement('div');
  spell.className = 'tgl';
  spell.classList.toggle('on', S.config.spellCheck);
  spell.onclick = function(){
    S.config.spellCheck = !S.config.spellCheck;
    spell.classList.toggle('on', S.config.spellCheck);
    const ed = $('editor');
    if(ed) ed.setAttribute('spellcheck', S.config.spellCheck);
    save();
  };
  c3.appendChild(row('Spell check', 'Browser spell check in the editor', spell));

  const quotes = document.createElement('div');
  quotes.className = 'tgl';
  quotes.classList.toggle('on', S.config.smartQuotes);
  quotes.onclick = function(){
    S.config.smartQuotes = !S.config.smartQuotes;
    quotes.classList.toggle('on', S.config.smartQuotes);
    save();
  };
  c3.appendChild(row('Smart quotes', 'Convert straight quotes to curly', quotes));
  root.appendChild(c3);

  /* ── Autocomplete ── */
  const c4 = card('Autocomplete', 'magic');
  cfgRow(c4, 'AI ghost text', 'Show the AI continuation as you pause', 'ghostText');
  cfgRow(c4, 'Suggestion chips', 'Quick actions along the bottom', 'suggestionChips');
  root.appendChild(c4);

  /* ── Intermixed fonts — moved here from Experimental ── */
  const c5 = card('Intermixed fonts', 'fonts');
  cfgRow(c5, 'Mix three fonts', 'While you write, words take one of three fonts in turn — the toolbar font dropdown is untouched', 'expMixedFonts');

  if(!Array.isArray(S.config.mixedFonts)) S.config.mixedFonts = ['', '', ''];
  for(let i = 0; i < 3; i++){
    const sel = document.createElement('select');
    sel.className = 'sel';
    sel.style.minWidth = '190px';
    sel.innerHTML = '<option value="">Editor font</option>' +
      FONTS.map(f => `<option value="${f.name}"${S.config.mixedFonts[i] === f.name ? ' selected' : ''}>${f.name}</option>`).join('');
    sel.onchange = function(){ S.config.mixedFonts[i] = sel.value; save(); };
    c5.appendChild(row('Font ' + (i + 1), 'Slot ' + (i + 1) + ' of the rotation', sel));
  }
  const scopeSel = document.createElement('select');
  scopeSel.className = 'sel';
  scopeSel.style.minWidth = '190px';
  scopeSel.innerHTML = `
    <option value="word"${S.config.mixedFontScope !== 'sentence' && S.config.mixedFontScope !== 'random' ? ' selected' : ''}>Word by word</option>
    <option value="sentence"${S.config.mixedFontScope === 'sentence' ? ' selected' : ''}>Sentence by sentence</option>
    <option value="random"${S.config.mixedFontScope === 'random' ? ' selected' : ''}>Random from the three</option>`;
  scopeSel.onchange = function(){ S.config.mixedFontScope = scopeSel.value; save(); };
  c5.appendChild(row('Rotate by', 'How the three fonts take turns', scopeSel));
  root.appendChild(c5);
};

SETTINGS.renderers.plugins = function(root){
  const plugins = [
    {k:'hinglish', name:'Hinglish transliteration', desc:'Convert Hinglish to Devanagari live'},
    {k:'voice', name:'Voice dictation', desc:'Speak instead of type'},
    {k:'dictionary', name:'Dictionary lookup', desc:'Free dictionary API (no key)'},
    {k:'thesaurus', name:'Thesaurus & rhymes', desc:'Datamuse API (no key)'},
    {k:'wikipedia', name:'Wikipedia research', desc:'Inline article summaries'},
    {k:'websearch', name:'Text search', desc:'Inline search without leaving app'},
    {k:'imagesearch', name:'Image search', desc:'Wikimedia Commons gallery'},
    {k:'tts', name:'Text-to-speech', desc:'Read your writing aloud'}
  ];
  const c1 = card('Available plugins', 'puzzle');
  plugins.forEach(p => {
    const t = document.createElement('div');
    t.className = 'tgl';
    t.classList.toggle('on', S.config.plugins[p.k] !== false);
    t.onclick = () => {
      S.config.plugins[p.k] = !S.config.plugins[p.k];
      t.classList.toggle('on', S.config.plugins[p.k]);
      save();
    };
    c1.appendChild(row(p.name, p.desc, t));
  });
  root.appendChild(c1);
};

// ═══ LANGUAGE — the interface language, the language you write in, and
//     the language AI answers in. ═══
SETTINGS.renderers.language = function(root){
  const ui = card('Interface language', 'translate');
  const uiSel = document.createElement('select');
  uiSel.className = 'sel';
  uiSel.style.minWidth = '220px';
  (window.UI_LANGS || []).forEach(function(l){
    const o = document.createElement('option');
    o.value = l.code;
    o.textContent = l.name + (l.native && l.native !== l.name ? ' — ' + l.native : '');
    if((S.config.uiLang || 'en') === l.code) o.selected = true;
    uiSel.appendChild(o);
  });
  uiSel.onchange = function(){
    S.config.uiLang = uiSel.value;
    S.config.uiRtl = (uiSel.value === 'ar' || uiSel.value === 'ur');
    save();
    if(window.applyLang) applyLang();
    renderSetTab('language');
    if(typeof goPage === 'function') goPage(S.page);
    const l = (window.UI_LANGS || []).find(function(x){ return x.code === S.config.uiLang; });
    toast('Interface language: ' + (l ? l.name : S.config.uiLang));
  };
  ui.appendChild(row('Language of the app', 'Page and menu names switch language, right-to-left included.', uiSel));

  const note = document.createElement('div');
  note.className = 'tiny muted';
  note.style.marginTop = '4px';
  note.textContent = 'Page names, the page menu and the breadcrumb follow this setting today. The writing tools, prompts and panels are still in English.';
  ui.appendChild(note);
  root.appendChild(ui);

  // ── the language you write in ──
  const wr = card('Writing language', 'pencil');
  const wrSel = document.createElement('select');
  wrSel.className = 'sel';
  wrSel.style.minWidth = '220px';
    const all = [].concat(window.LANGS_INDIA || [], (window.LANGS_INTL || []).filter(l => l.code === 'en'));

  const seen = {};
  all.forEach(function(l){
    if(seen[l.code]) return;
    seen[l.code] = 1;
    const o = document.createElement('option');
    o.value = l.code;
    o.textContent = (l.native ? l.native + ' — ' : '') + l.name;
    if((S.config.defaultLang || 'en') === l.code) o.selected = true;
    wrSel.appendChild(o);
  });
  wrSel.onchange = function(){
    S.config.defaultLang = wrSel.value;
    save();
    document.querySelectorAll('[contenteditable="true"], textarea, input[type="text"]').forEach(function(el){
      el.setAttribute('lang', S.config.defaultLang);
    });
    toast('Writing language set');
  };
  wr.appendChild(row('You write in', 'Used for spell check, the dictionary and the AI context.', wrSel));

  const sp = document.createElement('div');
  sp.className = 'tgl';
  sp.classList.toggle('on', !!S.config.spellCheck);
  sp.onclick = function(){
    S.config.spellCheck = !S.config.spellCheck;
    sp.classList.toggle('on', S.config.spellCheck);
    save();
    if(typeof applyAllConfig === 'function') applyAllConfig();
  };
  wr.appendChild(row('Spell check', 'Underlines a word the writing language does not know.', sp));
  root.appendChild(wr);

  // ── the language AI answers in ──
  const out = card('AI replies in', 'stars');
  const outSel = document.createElement('select');
  outSel.className = 'sel';
  outSel.style.minWidth = '220px';
      [ ['auto','Match the writing language'], ['en','English'], ['hi','हिन्दी — Hindi'] ].forEach(function(pair){

    const o = document.createElement('option');
    o.value = pair[0];
    o.textContent = pair[1];
    if((S.config.outputLang || 'auto') === pair[0]) o.selected = true;
    outSel.appendChild(o);
  });
  outSel.onchange = function(){ S.config.outputLang = outSel.value; save(); toast('AI reply language set'); };
  out.appendChild(row('Reply language', 'Improve, rewrite and translate follow this.', outSel));

  const hg = document.createElement('div');
  hg.className = 'tgl';
  hg.classList.toggle('on', !!(S.config.plugins && S.config.plugins.hinglish));
  hg.onclick = function(){
    if(!S.config.plugins) S.config.plugins = {};
    S.config.plugins.hinglish = !S.config.plugins.hinglish;
    hg.classList.toggle('on', S.config.plugins.hinglish);
    save();
  };
  out.appendChild(row('Hinglish conversions', 'Hinglish ⇄ Hindi ⇄ English in the right-click options.', hg));
  root.appendChild(out);

  // ── the Merriam-Webster key, moved here from the old Environment tab ──
  const lk = card('Lookup keys', 'key');
  const wrap = document.createElement('div');
  wrap.className = 'set-row';
  wrap.innerHTML = '<div><div style="font-size:12.5px;font-weight:600;">Merriam-Webster dictionary</div>'
    + '<div style="font-size:11px;color:var(--ink-3);margin-top:2px;">Free Collegiate key from dictionaryapi.com. Used by Utilities → Dictionary lookup.</div></div>';
  const line = document.createElement('div');
  line.style.cssText = 'display:flex;gap:8px;align-items:center;margin-top:8px;';
  const inp = document.createElement('input');
  inp.className = 'inp';
  inp.type = 'password';
  inp.placeholder = 'MW_API_KEY';
  inp.style.cssText = 'flex:1;min-width:0;';
  inp.value = String(S.config.mwApiKey || '');
  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-primary';
  saveBtn.type = 'button';
  saveBtn.innerHTML = '<i class="bi bi-check-lg"></i> Save';
  const clearBtn = document.createElement('button');
  clearBtn.className = 'btn btn-ghost';
  clearBtn.type = 'button';
  clearBtn.innerHTML = '<i class="bi bi-x-lg"></i> Clear';
  line.appendChild(inp); line.appendChild(saveBtn); line.appendChild(clearBtn);
  const note2 = document.createElement('div');
  note2.style.cssText = 'font-size:11px;color:var(--ink-4);margin-top:6px;';
  note2.textContent = 'Saved in this browser. Without a key the open dictionary answers instead, so lookup always works.';
  wrap.appendChild(line); wrap.appendChild(note2);
  lk.appendChild(wrap);
  saveBtn.onclick = function(){
    S.config.mwApiKey = String(inp.value || '').trim();
    save();
    note2.textContent = S.config.mwApiKey ? 'Saved in this browser.' : 'Cleared.';
  };
  clearBtn.onclick = function(){
    S.config.mwApiKey = '';
    inp.value = '';
    save();
    note2.textContent = 'Cleared — the open dictionary answers again.';
  };
  root.appendChild(lk);
};

// ═══ Per-mode Format page ═══
SETTINGS.renderFormat = function(){
  const root = $('formatBody');
  if(!root) return;
  root.innerHTML = '';

  const mode = MODES.find(m => m.id === S.mode);
  const c1 = card('Writing mode', 'collection');
  const grid = document.createElement('div');
  grid.className = 'grid-auto';
  MODES.forEach(m => {
    const tile = document.createElement('div');
    tile.className = 'tile' + (m.id === S.mode ? ' on' : '');
    tile.dataset.modeSwitch = m.id;
    tile.innerHTML = `<i class="bi bi-${m.icon}" style="font-size:24px;color:var(--accent-2);display:block;margin-bottom:8px;"></i>
      <div style="font-size:13px;font-weight:700;">${m.name}</div>
      <div style="font-size:10.5px;color:var(--ink-3);margin-top:2px;">${m.desc}</div>`;
    grid.appendChild(tile);
  });
  grid.addEventListener('click', e => {
    const el = e.target.closest('[data-mode-switch]');
    if(el) switchMode(el.dataset.modeSwitch);
  });
  c1.appendChild(grid);
  root.appendChild(c1);

  const c2 = card('Canvas layout', 'layout-text-window');
  const layouts = [
    ['classic', 'Classic', 'Centered 760px'],
    ['wide', 'Wide', 'Up to 1100px'],
    ['narrow', 'Narrow', 'Focused 540px'],
    ['fullbleed', 'Full bleed', 'Edge to edge'],
    ['typewriter', 'Typewriter', 'Cursor always centered'],
    ['twocolumn', 'Two column', 'Newspaper feel']
  ];
  const lg = document.createElement('div');
  lg.className = 'grid-auto';
  layouts.forEach(([id, name, desc]) => {
    const tile = document.createElement('div');
    tile.className = 'tile' + (id === S.config.layout ? ' on' : '');
    tile.dataset.layoutPick = id;
    tile.innerHTML = `<div style="font-size:13px;font-weight:700;">${name}</div>
      <div style="font-size:10.5px;color:var(--ink-3);margin-top:4px;">${desc}</div>`;
    lg.appendChild(tile);
  });
  lg.addEventListener('click', e => {
    const el = e.target.closest('[data-layout-pick]');
    if(!el) return;
    S.config.layout = el.dataset.layoutPick;
    document.body.setAttribute('data-layout', S.config.layout);
    document.querySelectorAll('[data-layout-pick]').forEach(x => x.classList.toggle('on', x.dataset.layoutPick === S.config.layout));
    save();
  });
  c2.appendChild(lg);
  root.appendChild(c2);

  const c3 = card('Font override', 'fonts');
  const fsel = document.createElement('select');
  fsel.className = 'sel';
  fsel.style.minWidth = '200px';
  const defaults = document.createElement('option');
  defaults.value = '';
  defaults.textContent = `Auto (${mode?.name || 'mode'} default)`;
  fsel.appendChild(defaults);
  FONTS.forEach(f => {
    const o = document.createElement('option');
    o.value = f.name; o.textContent = f.name;
    if(f.name === S.config.font) o.selected = true;
    fsel.appendChild(o);
  });
  fsel.onchange = () => { S.config.font = fsel.value; applyConfig('font'); save(); };
  c3.appendChild(row('Override font', 'Leave on Auto to use the mode default', fsel));

  const size = document.createElement('input');
  size.type = 'number';
  size.className = 'inp sm';
  size.value = S.config.fontSize;
  size.oninput = () => { S.config.fontSize = parseInt(size.value) || 17; applyConfig('fontSize'); save(); };
  c3.appendChild(row('Font size', '', size));
  root.appendChild(c3);

  const c4 = card('Quick access', 'lightning');
  const quick = document.createElement('div');
  quick.className = 'chips';
  ['write','read','draft','notebook','plan','board','timeline','cast','research','canvas'].forEach(pid => {
    const p = PAGES.find(x => x.id === pid);
    if(!p) return;
    const b = document.createElement('button');
    b.className = 'chip';
    b.dataset.page = p.id;
    b.innerHTML = `<i class="bi bi-${p.icon}"></i> ${p.name}`;
    quick.appendChild(b);
  });
  c4.appendChild(quick);
  root.appendChild(c4);
};

// ═══ PRIVACY ═══
SETTINGS.renderers.privacy = function(root){
  const c1 = card('Local storage', 'shield-lock');

  const info = document.createElement('div');
  info.style.cssText = 'font-size:12.5px;line-height:1.7;color:var(--ink-2);padding:4px 0;';
  info.innerHTML =
    'Everything you write is stored <strong>locally in your browser</strong>. ' +
    'Nothing is uploaded to any server. AI features only send text when you explicitly click an AI action.';
  c1.appendChild(info);

  const clearCache = document.createElement('button');
  clearCache.className = 'btn btn-ghost';
  clearCache.innerHTML = '<i class="bi bi-x-circle"></i> Clear session cache';
  clearCache.onclick = function(){
    if(!confirm('Clear temporary session data? Your projects are safe.')) return;
    sessionStorage.clear();
    toast('Session cache cleared');
  };
  c1.appendChild(row('Clear session cache', 'Removes temporary data only — projects untouched', clearCache));

  const wipe = document.createElement('button');
  wipe.className = 'btn btn-ghost';
  wipe.style.color = 'var(--err)';
  wipe.innerHTML = '<i class="bi bi-trash"></i> Clear all';
  wipe.onclick = function(){
    if(!confirm('Delete ALL data? Cannot be undone.')) return;
    if(!confirm('Really delete everything?')) return;
    localStorage.removeItem(STORE.CFG);
    localStorage.removeItem(STORE.DATA);
    localStorage.removeItem('sf6_theme');
    location.reload();
  };
  c1.appendChild(row('Clear all data', 'Wipe projects, chapters and notes', wipe));

  root.appendChild(c1);

  const c2 = card('AI data', 'stars');

  const disableAI = document.createElement('div');
  disableAI.className = 'tgl';
  disableAI.classList.toggle('on', !!S.config.aiDisabled);
  disableAI.onclick = function(){
    S.config.aiDisabled = !S.config.aiDisabled;
    disableAI.classList.toggle('on', S.config.aiDisabled);
    save();
    toast(S.config.aiDisabled ? 'AI disabled' : 'AI enabled');
  };
  c2.appendChild(row('Disable all AI', 'Prevents sending text to any AI provider', disableAI));

  const noHistory = document.createElement('div');
  noHistory.className = 'tgl';
  noHistory.classList.toggle('on', S.config.noAIHistory !== false);
  noHistory.onclick = function(){
    S.config.noAIHistory = !(S.config.noAIHistory !== false);
    noHistory.classList.toggle('on', S.config.noAIHistory);
    save();
  };
  c2.appendChild(row('Don\'t save AI results', 'AI responses never persist to storage', noHistory));

  root.appendChild(c2);

  const c3 = card('Network', 'globe');
  const offline = document.createElement('div');
  offline.className = 'tgl';
  offline.classList.toggle('on', !!S.config.offlineMode);
  offline.onclick = function(){
    S.config.offlineMode = !S.config.offlineMode;
    offline.classList.toggle('on', S.config.offlineMode);
    save();
    toast(S.config.offlineMode ? 'Offline mode on' : 'Offline mode off');
  };
  c3.appendChild(row('Offline mode', 'Blocks all external requests (AI, plugins, music streams)', offline));
  root.appendChild(c3);
};

// ═══ EXPERIMENTAL ═══
// ═══ Global click delegation for settings ═══
document.addEventListener('click', e => {
  const t = e.target;

  const tabEl = t.closest('[data-set-tab]');
  if(tabEl){ renderSetTab(tabEl.dataset.setTab); return; }

  if(t.closest('[data-act="set-close"]')){ closeModal(); return; }

  if(t.closest('[data-act="set-save"]')){
    save();
    toast('Settings saved');
    closeModal();
    return;
  }

  // Format page shortcuts
  const pgEl = t.closest('[data-page]');
  if(pgEl && pgEl.classList.contains('chip')){ goPage(pgEl.dataset.page); return; }
}, true);

// ═══ Expose ═══
window.SETTINGS = SETTINGS;
window.enhanceSelects = enhanceSelects;
window.renderSetTab = renderSetTab;
window.applyConfig = applyConfig;
window.applyAllConfig = applyAllConfig;
window.buildModelDropdown = buildModelDropdown;
window.getDefaultModels = getDefaultModels;
window.row = row;
window.card = card;

console.log('%c ✓ settings.js loaded', 'color:#10b981;font-weight:600;');
