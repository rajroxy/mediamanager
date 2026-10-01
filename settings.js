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
    {id:'appearance', icon:'palette',     label:'Appearance'},
    {id:'general',    icon:'gear',        label:'General'},
    {id:'sound',      icon:'volume-up',   label:'Sound'},
    {id:'privacy',    icon:'shield-lock', label:'Privacy'}
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
    b.className = 'set-tab' + (t.id === 'appearance' ? ' active' : '');
    b.innerHTML = `<i class="bi bi-${t.icon}"></i> ${t.label}`;
    b.dataset.setTab = t.id;
    tabBar.appendChild(b);
  });

  renderSetTab('appearance');

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
  if(SETTINGS.renderers[id]) SETTINGS.renderers[id](body);
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
    case 'uiScale':
      root.style.setProperty('--ui-scale', c.uiScale);
      document.body.style.zoom = c.uiScale;
      break;
    case 'eyeComfort':
      // a warm light filter across the whole app — independent of the theme
      document.body.classList.toggle('eye-comfort', !!c.eyeComfort);
      root.style.setProperty('--eye-amount', eyeComfortAlpha());
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
  ['theme','uiScale','eyeComfort'].forEach(applyConfig);
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

};

// ═══ APPLY THEME IMMEDIATELY ═══
function applyThemeNow(){
  document.body.setAttribute('data-style', S.config.style || 'vercel');
  document.body.setAttribute('data-color', S.config.color || 'minimal');
  applyThemeVars(S.config.theme || 'night');
}
window.applyThemeNow = applyThemeNow;

SETTINGS.renderers.general = function(root){
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
};

// ═══ PRIVACY ═══
SETTINGS.renderers.privacy = function(root){
  const c1 = card('Local storage', 'shield-lock');

  const info = document.createElement('div');
  info.style.cssText = 'font-size:12.5px;line-height:1.7;color:var(--ink-2);padding:4px 0;';
  info.innerHTML =
    'Your library, playlists and settings are stored <strong>locally on this machine</strong>. ' +
    'Nothing is uploaded to any server.';
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
  c1.appendChild(row('Clear all data', 'Wipe the library, playlists and every saved setting', wipe));

  root.appendChild(c1);

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

}, true);

// ═══ Expose ═══
window.SETTINGS = SETTINGS;
window.enhanceSelects = enhanceSelects;
window.renderSetTab = renderSetTab;
window.applyConfig = applyConfig;
window.applyAllConfig = applyAllConfig;
window.row = row;
window.card = card;

console.log('%c ✓ settings.js loaded', 'color:#10b981;font-weight:600;');
