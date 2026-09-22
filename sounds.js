/* ═══════════════════════════════════════════════════════════
   ScriptForge — Sound
   Master volume · typing clicks · generated ambience.
   Everything is synthesised with WebAudio, so there are no audio
   files to ship and it works offline.
   ═══════════════════════════════════════════════════════════ */

const SOUND = {};

SOUND.cfg = function(){
  if(!S.config.sound || typeof S.config.sound !== 'object')
    S.config.sound = { volume:.6, typing:false, typingVol:.35, ambience:null, ambVol:.45 };
  const c = S.config.sound;
  if(c.volume == null) c.volume = .6;
  if(c.typing == null) c.typing = false;
  if(c.typingVol == null) c.typingVol = .35;
  if(c.ambVol == null) c.ambVol = .45;
  if(c.ambience === undefined) c.ambience = null;
  return c;
};

SOUND.ctx = function(){
  if(!SOUND._ctx){
    const C = window.AudioContext || window.webkitAudioContext;
    if(!C) return null;
    SOUND._ctx = new C();
    SOUND._master = SOUND._ctx.createGain();
    SOUND._master.gain.value = SOUND.cfg().volume;
    SOUND._master.connect(SOUND._ctx.destination);
  }
  if(SOUND._ctx.state === 'suspended') SOUND._ctx.resume();
  return SOUND._ctx;
};

SOUND.volume = function(v){
  const c = SOUND.cfg();
  if(v != null) c.volume = Math.max(0, Math.min(1, v));
  if(SOUND._master) SOUND._master.gain.value = c.volume;
  return c.volume;
};

/* 2 s of noise — 'white' or 'brown' */
SOUND._noise = function(ctx, kind){
  const len = Math.floor(ctx.sampleRate * 2);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for(let i = 0; i < len; i++){
    const w = Math.random() * 2 - 1;
    if(kind === 'brown'){ last = (last + .02 * w) / 1.02; d[i] = last * 3.2; }
    else d[i] = w * .5;
  }
  return buf;
};

/* ── typing click: a 25 ms filtered burst ── */
SOUND.click = function(){
  if(window.SF_VIEW) return;
  const ctx = SOUND.ctx(); if(!ctx) return;
  const c = SOUND.cfg();
  const src = ctx.createBufferSource(); src.buffer = SOUND._noise(ctx, 'white');
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 1.4;
  const g = ctx.createGain();
  const t = ctx.currentTime;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(.0002, c.typingVol * c.volume * .5), t + .004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + .045);
  src.connect(bp); bp.connect(g); g.connect(SOUND._master);
  src.start(t); src.stop(t + .06);
};

/* ── ambience: rain · wind · fire · cafe ── */
SOUND.AMBIENCE = ['Rain', 'Wind', 'Fire', 'Cafe'];

SOUND.stopAmbience = function(){
  if(!SOUND._amb) return;
  try{ SOUND._amb.src.stop(); }catch(e){}
  try{ SOUND._amb.gain.disconnect(); }catch(e){}
  if(SOUND._amb.timer) clearInterval(SOUND._amb.timer);
  SOUND._amb = null;
};

SOUND.ambience = function(name){
  SOUND.stopAmbience();
  SOUND.cfg().ambience = name || null;
  if(!name) return;
  const ctx = SOUND.ctx(); if(!ctx) return;

  const src = ctx.createBufferSource();
  src.buffer = SOUND._noise(ctx, name === 'Rain' ? 'white' : 'brown');
  src.loop = true;

  const filt = ctx.createBiquadFilter();
  if(name === 'Rain'){ filt.type = 'highpass'; filt.frequency.value = 900; }
  else if(name === 'Wind'){ filt.type = 'lowpass'; filt.frequency.value = 520; }
  else if(name === 'Fire'){ filt.type = 'lowpass'; filt.frequency.value = 1100; }
  else { filt.type = 'bandpass'; filt.frequency.value = 480; filt.Q.value = .7; }

  const gain = ctx.createGain();
  gain.gain.value = 0.0001;
  src.connect(filt); filt.connect(gain); gain.connect(SOUND._master);
  src.start();

  const c = SOUND.cfg();
  gain.gain.exponentialRampToValueAtTime(Math.max(.0002, c.ambVol * .5), ctx.currentTime + 1.2);

  SOUND._amb = { src:src, gain:gain, name:name, timer:null };

  /* fire crackles · a slow swell for wind */
  if(name === 'Fire'){
    SOUND._amb.timer = setInterval(function(){
      if(!SOUND._amb || !SOUND._ctx) return;
      const t = SOUND._ctx.currentTime;
      const g2 = SOUND._ctx.createGain();
      g2.gain.setValueAtTime(0.0001, t);
      g2.gain.exponentialRampToValueAtTime(.08, t + .01);
      g2.gain.exponentialRampToValueAtTime(0.0001, t + .12);
      const o = SOUND._ctx.createOscillator();
      o.type = 'triangle'; o.frequency.value = 90 + Math.random() * 160;
      o.connect(g2); g2.connect(SOUND._master);
      o.start(t); o.stop(t + .14);
    }, 420);
  }
  if(name === 'Wind'){
    let up = true;
    SOUND._amb.timer = setInterval(function(){
      if(!SOUND._amb || !SOUND._ctx) return;
      const g = SOUND._amb.gain, t = SOUND._ctx.currentTime;
      up = !up;
      g.gain.exponentialRampToValueAtTime(up ? Math.max(.0002, c.ambVol * .6) : Math.max(.0002, c.ambVol * .28), t + 3);
    }, 3000);
  }
};

SOUND.ambVolume = function(v){
  const c = SOUND.cfg();
  if(v != null) c.ambVol = Math.max(0, Math.min(1, v));
  if(SOUND._amb && SOUND._ctx)
    SOUND._amb.gain.gain.exponentialRampToValueAtTime(Math.max(.0002, c.ambVol * .5), SOUND._ctx.currentTime + .3);
  return c.ambVol;
};

/* ── keystrokes in the editor ── */
document.addEventListener('keydown', function(e){
  const c = SOUND.cfg();
  if(!c.typing || window.SF_VIEW) return;
  if(e.ctrlKey || e.metaKey || e.altKey) return;
  const t = e.target;
  const inEd = t && (t.id === 'editor' || (t.closest && t.closest('#editor')));
  if(!inEd) return;
  if(e.key === 'Backspace' || e.key === 'Enter' || e.key === ' ' || e.key.length === 1) SOUND.click();
}, true);

/* ═══ Settings tab ═══ */
function sndRow(label, sub, control){
  const r = document.createElement('div');
  r.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:14px;padding:10px 0;';
  r.innerHTML = '<div style="min-width:0"><div style="font-size:12.5px;color:var(--ink);">' + label +
    '</div><div style="font-size:10.5px;color:var(--ink-4);margin-top:2px;">' + sub + '</div></div>';
  r.appendChild(control);
  return r;
}
function sndToggle(id, get, set){
  const b = document.createElement('button');
  b.type = 'button'; b.id = id; b.className = 'tgl';
  const paint = () => b.classList.toggle('on', !!get());
  paint();
  b.addEventListener('click', function(){ set(!get()); paint(); save(); });
  return b;
}
function sndRange(val, set, w){
  const i = document.createElement('input');
  i.type = 'range'; i.min = 0; i.max = 100; i.value = Math.round(val() * 100);
  i.style.cssText = 'width:' + (w || 140) + 'px;';
  i.addEventListener('input', function(){ set(i.value / 100); });
  i.addEventListener('change', function(){ save(); });
  return i;
}

SETTINGS.renderers.sound = function(root){
  const c = SOUND.cfg();

  const c1 = card('Master', 'volume-up');
  c1.appendChild(sndRow('Volume', 'Applies to every sound in the app',
    sndRange(function(){ return c.volume; }, function(v){ c.volume = v; SOUND.volume(v); })));
  root.appendChild(c1);

  const c2 = card('Typing', 'keyboard');
  c2.appendChild(sndRow('Typing sound', 'A soft click for every keystroke',
    sndToggle('sndType', function(){ return c.typing; }, function(v){ c.typing = v; })));
  c2.appendChild(sndRow('Click volume', '', sndRange(function(){ return c.typingVol; },
    function(v){ c.typingVol = v; if(SOUND._master) SOUND.volume(c.volume); })));
  const test = document.createElement('button');
  test.className = 'btn btn-ghost'; test.style.marginTop = '10px';
  test.innerHTML = '<i class="bi bi-play-fill"></i> Test click';
  test.addEventListener('click', function(){ SOUND.click(); });
  c2.appendChild(test);
  root.appendChild(c2);
};

/* Ambience no longer has a control, so it is never resumed — a sound you
   couldn't switch off would be worse than one that resets on reload. */
(function(){ SOUND.stopAmbience(); })();
