/* ============================================================
   MOTION
============================================================ */
const mainMotionStore = {};
const miniMotionStore = {};

function renderMotionEffect(c2, W, H, effect, speed, intensity, store, color){
    try {
        c2.clearRect(0, 0, W, H);
        if (effect === 'none' || !effect) return;
        const accent = color || '#fab387';
        const hexA = (h,a)=>{ try { const x=h.replace('#',''); return `rgba(${parseInt(x.substring(0,2),16)},${parseInt(x.substring(2,4),16)},${parseInt(x.substring(4,6),16)},${a})`; } catch(e){ return `rgba(201,168,106,${a})`; } };

        if (effect === 'waves'){
            store.waveOffset = (store.waveOffset || 0) + 0.04*speed;
            for (let layer = 0; layer < 3; layer++){
                c2.beginPath(); c2.strokeStyle = hexA(accent, 0.35*intensity); c2.lineWidth = 1.5;
                for (let x = 0; x <= W; x += 6){
                    const y = H/2 + Math.sin(x*0.012 + store.waveOffset + layer*0.8)*(18+layer*6);
                    x===0 ? c2.moveTo(x,y) : c2.lineTo(x,y);
                }
                c2.stroke();
            }
        } else if (['particles','sakura','fireflies','leaves','snow','stardust','ash','embers','sparks','mist','fog','haze','fireflies2','snow2'].includes(effect)){
            if (!store.particles || store.particles.length === 0){
                store.particles = [];
                const count = (effect === 'mist' || effect === 'fog' || effect === 'haze') ? 25 : 70;
                for (let i = 0; i < count; i++) store.particles.push({ x:Math.random()*W, y:Math.random()*H, r:Math.random()*2.5+0.5, vx:(Math.random()-0.5)*1.4, vy:(Math.random()-0.5)*1.4, a:Math.random()*0.7+0.2, size:Math.random()*4+1, rot:Math.random()*Math.PI*2, rotSpeed:(Math.random()-0.5)*0.05, life: Math.random() });
            }
            store.particles.forEach(p => {
                p.x += p.vx*speed; p.y += p.vy*speed;
                if (p.x < -10) p.x = W+10; if (p.x > W+10) p.x = -10;
                if (p.y < -10) p.y = H+10; if (p.y > H+10) p.y = -10;
                if (effect === 'snow' || effect === 'snow2'){ p.vy = Math.max(0.3, Math.abs(p.vy)); p.vx = Math.sin(p.y*0.01)*0.5; }
                if (effect === 'stardust' || effect === 'sparks'){ p.life += 0.01*speed; if (p.life > 1) p.life = 0; }
                if (effect === 'ash' || effect === 'embers'){ p.vy = -Math.abs(p.vy)*0.6; }
                if (effect === 'mist' || effect === 'fog' || effect === 'haze'){ p.size = 60 + Math.random()*40; }
                c2.beginPath();
                if (effect === 'sakura' || effect === 'leaves'){
                    p.rot += p.rotSpeed;
                    c2.save(); c2.translate(p.x,p.y); c2.rotate(p.rot);
                    c2.fillStyle = effect === 'sakura' ? `rgba(244,114,182,${p.a})` : `rgba(52,211,153,${p.a})`;
                    c2.ellipse(0,0,p.size,p.size*0.5,0,0,Math.PI*2); c2.fill(); c2.restore();
                } else if (effect === 'snow' || effect === 'snow2'){
                    c2.fillStyle = `rgba(255,255,255,${p.a})`;
                    c2.arc(p.x, p.y, p.r, 0, Math.PI*2); c2.fill();
                } else if (effect === 'stardust' || effect === 'sparks'){
                    c2.fillStyle = hexA(accent, Math.sin(p.life*Math.PI));
                    c2.arc(p.x, p.y, p.r*2, 0, Math.PI*2); c2.fill();
                } else if (effect === 'ash' || effect === 'embers'){
                    c2.fillStyle = effect === 'embers' ? `rgba(251,146,60,${p.a})` : `rgba(120,120,120,${p.a})`;
                    c2.arc(p.x, p.y, p.r, 0, Math.PI*2); c2.fill();
                } else if (effect === 'mist' || effect === 'fog' || effect === 'haze'){
                    const grad = c2.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
                    const col = effect === 'mist' ? '200,220,240' : (effect === 'fog' ? '180,190,200' : '220,210,200');
                    grad.addColorStop(0, `rgba(${col},${p.a*0.15*intensity})`);
                    grad.addColorStop(1, `rgba(${col},0)`);
                    c2.fillStyle = grad;
                    c2.arc(p.x, p.y, p.size, 0, Math.PI*2); c2.fill();
                } else {
                    c2.arc(p.x,p.y,p.r,0,Math.PI*2);
                    c2.fillStyle = effect === 'fireflies' || effect === 'fireflies2' ? `rgba(251,191,36,${p.a})` : hexA(accent, p.a);
                    c2.fill();
                }
            });
        } else if (effect === 'rain' || effect === 'rain2'){
            if (!store.particles || store.particles.length === 0){
                store.particles = [];
                const count = effect === 'rain2' ? 150 : 80;
                for (let i = 0; i < count; i++) store.particles.push({ x:Math.random()*W, y:Math.random()*H, r:Math.random()*2+0.5 });
            }
            c2.strokeStyle = `rgba(148,163,184,${0.55*intensity})`; c2.lineWidth = effect === 'rain2' ? 1.6 : 1.2;
            store.particles.forEach(p => {
                p.y += (p.r*3+2)*speed*2;
                if (p.y > H){ p.y = -10; p.x = Math.random()*W; }
                c2.beginPath(); c2.moveTo(p.x,p.y); c2.lineTo(p.x-1.5,p.y+12); c2.stroke();
            });
        } else if (effect === 'drops'){
            if (!store.particles || store.particles.length === 0){
                store.particles = [];
                for (let i = 0; i < 40; i++) store.particles.push({ x:Math.random()*W, y:Math.random()*H, r:Math.random()*30+20, t:Math.random()*Math.PI*2 });
            }
            c2.strokeStyle = hexA(accent, 0.4*intensity); c2.lineWidth = 1;
            store.particles.forEach(p => {
                p.t += 0.02 * speed;
                c2.beginPath();
                c2.arc(p.x, p.y, Math.abs(Math.sin(p.t))*p.r, 0, Math.PI*2); c2.stroke();
            });
        } else if (effect === 'ripple'){
            if (!store.particles || store.particles.length === 0){
                store.particles = [];
                for (let i = 0; i < 6; i++) store.particles.push({ x:Math.random()*W, y:Math.random()*H, r:0, t:Math.random() });
            }
            c2.strokeStyle = hexA(accent, 0.5*intensity);
            store.particles.forEach(p => {
                p.t += 0.005 * speed;
                if (p.t > 1){ p.t = 0; p.x = Math.random()*W; p.y = Math.random()*H; }
                c2.lineWidth = 2 * (1-p.t);
                c2.beginPath();
                c2.arc(p.x, p.y, p.t * Math.max(W,H)*0.5, 0, Math.PI*2); c2.stroke();
            });
        } else if (effect === 'matrix' || effect === 'digitalrain2' || effect === 'morse'){
            if (!store.matrixCols || store.matrixCols.length === 0){
                store.matrixCols = [];
                const cols = Math.floor(W/16);
                for (let i = 0; i < cols; i++) store.matrixCols.push({ x:i*16, y:Math.random()*H, speed:Math.random()*2+1, hue: Math.random()*360, chars:Array.from({length:20},()=>String.fromCharCode(0x30A0+Math.random()*96)) });
            }
            c2.font = '12px monospace';
            store.matrixCols.forEach(col => {
                col.y += col.speed*speed*2;
                if (col.y > H+100) col.y = -Math.random()*200;
                col.chars.forEach((ch,i) => {
                    const y = col.y + i*14;
                    if (y < 0 || y > H) return;
                    const a = i === 0 ? 0.95 : Math.max(0, 0.4 - i*0.02);
                    c2.fillStyle = effect === 'digitalrain2' ? `hsla(${col.hue},80%,60%,${a})` : (i === 0 ? hexA(accent, 0.95) : hexA(accent, a));
                    const char = effect === 'morse' ? (Math.random() > 0.5 ? '·' : '—') : col.chars[Math.floor(Math.random()*col.chars.length)];
                    c2.fillText(char, col.x, y);
                });
            });
        } else if (effect === 'circuits'){
            if (!store.waveOffset) store.waveOffset = 0;
            store.waveOffset += 0.03*speed;
            const step = 30;
            c2.strokeStyle = hexA(accent, 0.3*intensity); c2.lineWidth = 1;
            for (let y = 0; y < H; y += step){
                for (let x = 0; x < W; x += step){
                    const pulse = Math.sin((x+y)*0.02 + store.waveOffset*3) > 0.7 ? 1 : 0;
                    if (pulse){
                        c2.beginPath();
                        c2.moveTo(x, y); c2.lineTo(x+step, y);
                        c2.moveTo(x, y); c2.lineTo(x, y+step);
                        c2.stroke();
                    }
                }
            }
        } else if (effect === 'aurora'){
            store.auroraOffset = (store.auroraOffset || 0) + 0.008*speed;
            for (let i = 0; i < 4; i++){
                const g = c2.createLinearGradient(0, H*0.3+i*30, W, H*0.7+i*30);
                g.addColorStop(0, `hsla(${180+i*30+Math.sin(store.auroraOffset+i)*20},80%,60%,${0.12*intensity})`);
                g.addColorStop(1, `hsla(${280+i*20},80%,60%,0)`);
                c2.fillStyle = g; c2.beginPath();
                for (let x = 0; x <= W; x += 10){
                    const y = H*0.45+i*25 + Math.sin(x*0.008+store.auroraOffset*2+i)*35;
                    x===0 ? c2.moveTo(x,y) : c2.lineTo(x,y);
                }
                c2.lineTo(W,H); c2.lineTo(0,H); c2.closePath(); c2.fill();
            }
        } else if (effect === 'thunder' || effect === 'lightning2'){
            if (Math.random() < (effect === 'lightning2' ? 0.04 : 0.015)*speed){
                c2.fillStyle = `rgba(200,220,255,${0.35*intensity})`;
                c2.fillRect(0,0,W,H);
                if (effect === 'lightning2'){
                    c2.strokeStyle = `rgba(255,255,255,${0.8*intensity})`;
                    c2.lineWidth = 2;
                    c2.beginPath();
                    let lx = Math.random()*W, ly = 0;
                    c2.moveTo(lx, ly);
                    while (ly < H){
                        lx += (Math.random()-0.5)*60;
                        ly += 20 + Math.random()*40;
                        c2.lineTo(lx, ly);
                    }
                    c2.stroke();
                }
            }
            c2.strokeStyle = `rgba(148,163,184,${0.4*intensity})`; c2.lineWidth = 1;
            if (!store.particles || store.particles.length === 0){
                store.particles = [];
                for (let i = 0; i < 60; i++) store.particles.push({ x:Math.random()*W, y:Math.random()*H, r:Math.random()*2+0.5 });
            }
            store.particles.forEach(p => {
                p.y += (p.r*3+4)*speed*2;
                if (p.y > H){ p.y = -10; p.x = Math.random()*W; }
                c2.beginPath(); c2.moveTo(p.x,p.y); c2.lineTo(p.x-2,p.y+16); c2.stroke();
            });
        } else if (effect === 'earthquake'){
            store.shakeT = (store.shakeT || 0) + 0.15*speed;
            const sx = Math.sin(store.shakeT*13)*4*intensity;
            const sy = Math.cos(store.shakeT*17)*3*intensity;
            c2.save(); c2.translate(sx,sy);
            c2.strokeStyle = `rgba(239,68,68,${0.3*intensity})`; c2.lineWidth = 1;
            for (let i = 0; i < 8; i++){
                c2.beginPath();
                c2.moveTo(0, (i/8)*H + Math.sin(store.shakeT+i)*8);
                c2.lineTo(W, (i/8)*H + Math.cos(store.shakeT+i)*8);
                c2.stroke();
            }
            c2.restore();
        } else if (effect === 'confetti'){
            if (!store.particles || store.particles.length === 0){
                store.particles = [];
                for (let i = 0; i < 50; i++) store.particles.push({ x:Math.random()*W, y:-20, r:Math.random()*3+1, vx:(Math.random()-0.5)*1.5, vy:Math.random()*2+1, rot:Math.random()*6, rotSpeed:(Math.random()-0.5)*0.15, color:['#c9a86a','#f43f5e','#38bdf8','#34d399','#fbbf24','#a855f7'][Math.floor(Math.random()*6)] });
            }
            store.particles.forEach(p => {
                p.y += p.vy*speed; p.x += p.vx*speed;
                p.rot += p.rotSpeed;
                if (p.y > H+20){ p.y = -20; p.x = Math.random()*W; }
                c2.save(); c2.translate(p.x,p.y); c2.rotate(p.rot);
                c2.fillStyle = p.color;
                c2.fillRect(-p.r,-p.r*0.4,p.r*2,p.r*0.8);
                c2.restore();
            });
        } else if (effect === 'blackhole' || effect === 'galaxies'){
            if (!store.particles || store.particles.length === 0){
                store.particles = [];
                const count = effect === 'galaxies' ? 200 : 90;
                for (let i = 0; i < count; i++) store.particles.push({ angle: Math.random()*Math.PI*2, dist: 40 + Math.random()*Math.max(W,H), speed: 0.4 + Math.random()*0.8, size: Math.random()*2+0.5 });
            }
            const cx = W/2, cy = H/2;
            store.particles.forEach(p => {
                p.angle += (effect === 'galaxies' ? 0.008 : (1.2 - p.dist/400) * 0.02) * speed;
                p.dist += (effect === 'galaxies' ? -0.3 : -p.speed*1.5) * speed;
                if (effect === 'galaxies' && p.dist < 20) p.dist = Math.max(W,H);
                if (p.dist < 10){ p.dist = Math.max(W,H); p.angle = Math.random()*Math.PI*2; }
                const px = cx + Math.cos(p.angle)*p.dist;
                const py = cy + Math.sin(p.angle)*p.dist;
                const alpha = Math.min(1, (1 - p.dist/Math.max(W,H)) * intensity);
                c2.beginPath();
                c2.fillStyle = effect === 'galaxies' ? `hsla(${(p.angle*57)%360},80%,70%,${alpha})` : hexA(accent, alpha);
                c2.arc(px, py, p.size, 0, Math.PI*2); c2.fill();
            });
        } else if (effect === 'hyperspace'){
            if (!store.stars || store.stars.length === 0){
                store.stars = [];
                for (let i = 0; i < 80; i++) store.stars.push({ angle: Math.random()*Math.PI*2, dist: Math.random()*Math.max(W,H), speed: 2 + Math.random()*4, len: 10 + Math.random()*30 });
            }
            const cx = W/2, cy = H/2;
            store.stars.forEach(s => {
                s.dist += s.speed * speed;
                if (s.dist > Math.max(W,H)){ s.dist = 5; s.angle = Math.random()*Math.PI*2; }
                const x1 = cx + Math.cos(s.angle)*s.dist;
                const y1 = cy + Math.sin(s.angle)*s.dist;
                const x2 = cx + Math.cos(s.angle)*(s.dist - s.len);
                const y2 = cy + Math.sin(s.angle)*(s.dist - s.len);
                c2.beginPath(); c2.strokeStyle = hexA(accent, Math.min(1, s.dist/300)*intensity);
                c2.lineWidth = 1.5;
                c2.moveTo(x1, y1); c2.lineTo(x2, y2); c2.stroke();
            });
        } else if (effect === 'vortex'){
            if (!store.particles || store.particles.length === 0){
                store.particles = [];
                for (let i = 0; i < 70; i++) store.particles.push({ angle: Math.random()*Math.PI*2, radius: 20 + Math.random()*Math.max(W,H)/2, angularSpeed: 0.01 + Math.random()*0.03, size: Math.random()*2+0.5 });
            }
            const cx = W/2, cy = H/2;
            store.particles.forEach(p => {
                p.angle += p.angularSpeed * speed;
                p.radius -= 0.3 * speed;
                if (p.radius < 10) p.radius = Math.max(W,H)/2 + Math.random()*100;
                const px = cx + Math.cos(p.angle)*p.radius;
                const py = cy + Math.sin(p.angle)*p.radius;
                c2.beginPath(); c2.fillStyle = hexA(accent, intensity * 0.7);
                c2.arc(px, py, p.size, 0, Math.PI*2); c2.fill();
            });
        } else if (effect === 'pulsegrid'){
            if (!store.waveOffset) store.waveOffset = 0;
            store.waveOffset += 0.03 * speed;
            const gridSize = 24;
            for (let x = 0; x < W; x += gridSize){
                for (let y = 0; y < H; y += gridSize){
                    const dist = Math.sqrt((x-W/2)**2 + (y-H/2)**2);
                    const pulse = (Math.sin(dist*0.02 - store.waveOffset*3) + 1) / 2;
                    c2.strokeStyle = hexA(accent, pulse * 0.3 * intensity);
                    c2.lineWidth = 1;
                    c2.strokeRect(x, y, gridSize, gridSize);
                }
            }
        } else if (effect === 'plasma'){
            store.waveOffset = (store.waveOffset || 0) + 0.02 * speed;
            const t = store.waveOffset;
            for (let i = 0; i < 5; i++){
                const cx = W/2 + Math.sin(t + i*1.5) * W/3;
                const cy = H/2 + Math.cos(t * 0.8 + i*2) * H/3;
                const r = 60 + Math.sin(t + i) * 40;
                const grad = c2.createRadialGradient(cx, cy, 0, cx, cy, r);
                grad.addColorStop(0, `hsla(${(i*60 + t*30) % 360}, 80%, 60%, ${0.3*intensity})`);
                grad.addColorStop(1, 'rgba(0,0,0,0)');
                c2.fillStyle = grad;
                c2.beginPath(); c2.arc(cx, cy, r, 0, Math.PI*2); c2.fill();
            }
        } else if (effect === 'breath' || effect === 'heartbeat'){
            store.waveOffset = (store.waveOffset || 0) + 0.02 * speed;
            const t = store.waveOffset;
            const scale = effect === 'heartbeat' 
                ? 1 + Math.pow(Math.max(0, Math.sin(t*3)), 8) * 0.4
                : 1 + Math.sin(t)*0.2;
            const grad = c2.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W,H)/2*scale);
            grad.addColorStop(0, hexA(accent, 0.25*intensity));
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            c2.fillStyle = grad;
            c2.fillRect(0,0,W,H);
        } else if (effect === 'dna'){
            if (!store.waveOffset) store.waveOffset = 0;
            store.waveOffset += 0.03*speed;
            const t = store.waveOffset;
            c2.strokeStyle = hexA(accent, 0.6*intensity); c2.lineWidth = 2;
            for (let y = 0; y < H; y += 4){
                const a = Math.sin(y*0.05 + t*2)*40;
                c2.beginPath();
                c2.moveTo(W/2 + a, y);
                c2.lineTo(W/2, y);
                c2.lineTo(W/2 - a, y);
                c2.stroke();
            }
        } else if (effect === 'fire'){
            if (!store.particles || store.particles.length === 0){
                store.particles = [];
                for (let i = 0; i < 60; i++) store.particles.push({ x: Math.random()*W, y: H - Math.random()*20, vy: -1 - Math.random()*3, vx: (Math.random()-0.5)*1.2, size: 8 + Math.random()*20, life: 1, hue: 20 + Math.random()*30 });
            }
            if (Math.random() < 0.6*speed){
                store.particles.push({ x: Math.random()*W, y: H - 5, vy: -1 - Math.random()*3, vx: (Math.random()-0.5)*1.2, size: 8 + Math.random()*20, life: 1, hue: 20 + Math.random()*30 });
            }
            if (store.particles.length > 120) store.particles.splice(0, store.particles.length - 120);
            store.particles.forEach(p => {
                p.x += p.vx*speed; p.y += p.vy*speed; p.life -= 0.015*speed;
                if (p.life <= 0 || p.y < -p.size){ p.life = 1; p.y = H - 5; p.x = Math.random()*W; }
                const alpha = Math.max(0, p.life);
                const grad = c2.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
                grad.addColorStop(0, `hsla(${p.hue},100%,70%,${alpha})`);
                grad.addColorStop(1, `hsla(${p.hue},100%,30%,0)`);
                c2.fillStyle = grad;
                c2.beginPath(); c2.arc(p.x, p.y, p.size, 0, Math.PI*2); c2.fill();
            });
        } else if (effect === 'smoke'){
            if (!store.particles || store.particles.length === 0){
                store.particles = [];
                for (let i = 0; i < 40; i++) store.particles.push({ x: Math.random()*W, y: H - Math.random()*30, vy: -0.5 - Math.random()*1.2, vx: (Math.random()-0.5)*0.6, size: 40 + Math.random()*50, life: 1 });
            }
            if (Math.random() < 0.3*speed){
                store.particles.push({ x: Math.random()*W, y: H - 5, vy: -0.5 - Math.random()*1.2, vx: (Math.random()-0.5)*0.6, size: 40 + Math.random()*50, life: 1 });
            }
            if (store.particles.length > 100) store.particles.splice(0, store.particles.length - 100);
            store.particles.forEach(p => {
                p.x += p.vx*speed; p.y += p.vy*speed; p.size += 0.2*speed; p.life -= 0.004*speed;
                if (p.life <= 0 || p.y < -p.size){ p.life = 1; p.y = H - 5; p.x = Math.random()*W; }
                const alpha = Math.max(0, p.life * 0.35 * intensity);
                const grad = c2.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
                grad.addColorStop(0, `rgba(160,160,170,${alpha})`);
                grad.addColorStop(1, `rgba(80,80,90,0)`);
                c2.fillStyle = grad;
                c2.beginPath(); c2.arc(p.x, p.y, p.size, 0, Math.PI*2); c2.fill();
            });
        }
    } catch(e){ console.warn('motion error:', e); }
}

function drawMotion(){
    try {
        const W = motionCanvas.width, H = motionCanvas.height;
        if (state.motionDisplay !== 'none'){
            renderMotionEffect(ctx, W, H, state.motionEffect, state.motionSpeed, state.motionIntensity, mainMotionStore);
        } else ctx.clearRect(0,0,W,H);
    } catch(e){}
    requestAnimationFrame(drawMotion);
}
/* ═══════════════════════════════════════════════════════════
   MOTION — adapter: canvas + picker + lifecycle
   ═══════════════════════════════════════════════════════════ */

const MOTION = { store:{}, raf:0, running:false, canvas:null, ctx:null,
                 w:0, h:0, ro:null, effect:'', _wasOn:false };

MOTION.EFFECTS = ['waves','particles','leaves','sakura','rain','rain2','snow','snow2',
  'fireflies','fireflies2','stardust','sparks','ash','embers','mist','fog','haze',
  'drops','ripple','aurora','thunder','lightning2','confetti','blackhole','galaxies',
  'hyperspace','vortex','pulsegrid','digitalrain2','matrix','plasma','fire','smoke',
  'breath','heartbeat','dna','circuits','morse','earthquake','none'];

MOTION.cfg = function(){
  const c = S.config;
  if(c.motionOn === undefined) c.motionOn = true;   /* motion is ON by default */
  if(!c.motionEffect)          c.motionEffect = 'rain';
  if(!c.motionSpeed)           c.motionSpeed = 1;
  if(!c.motionIntensity)       c.motionIntensity = 1;
  if(!c.motionColor)           c.motionColor = '#fab387';
  if(c.motionSync === undefined)  c.motionSync = true;
  if(c.motionReact === undefined) c.motionReact = 1
  return c;
};

MOTION.panel = function(){ return document.getElementById('musicPanel'); };
MOTION.viz   = function(){ return document.querySelector('#musicPanel .mv-visualizer'); };
/* A track has to be actually playing — nothing animates on an idle player,
   and pressing play with no track loaded draws nothing. */
MOTION.playing = function(){
  const a = window.Music && window.Music.audio;
  return !!(a && !a.paused && (a.currentSrc || a.src));
};
MOTION.on    = function(){
  const c = MOTION.cfg(), p = MOTION.panel();
  return !!(c.motionOn && p && !p.hidden && MOTION.playing() && c.motionEffect && c.motionEffect !== 'none');
};

/* ── canvas ── */
MOTION.attach = function(){
  const viz = MOTION.viz();
  if(!viz) return null;
  let cv = viz.querySelector(':scope > canvas.mp-motion');
  if(!cv){
    cv = document.createElement('canvas');
    cv.className = 'mp-motion';
    viz.appendChild(cv);
  }
  if(cv !== MOTION.canvas){
    MOTION.canvas = cv;
    MOTION.ctx = cv.getContext('2d');
  }
  return cv;
};

MOTION.resize = function(){
  const cv = MOTION.canvas;
  if(!cv || !MOTION.ctx) return;
  const r = cv.getBoundingClientRect();
  const w = Math.max(1, Math.round(r.width));
  const h = Math.max(1, Math.round(r.height));
  if(w < 2 || h < 2) return;                      /* hidden — keep last size */
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  if(cv.width !== Math.round(w*dpr) || cv.height !== Math.round(h*dpr)){
    cv.width  = Math.round(w*dpr);
    cv.height = Math.round(h*dpr);
  }
  MOTION.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);  /* draw in CSS px */
  MOTION.w = w; MOTION.h = h;
};

MOTION.clear = function(){
  if(MOTION.ctx && MOTION.canvas && MOTION.w && MOTION.h){
    MOTION.ctx.clearRect(0, 0, MOTION.w, MOTION.h);
  }
};
/* ── audio reactivity ── */
MOTION.audio = { level:0, bass:0, pulse:0, floor:0.06 };

MOTION.resumeAudio = function(){
  if(_audioCtx && _audioCtx.state === 'suspended') _audioCtx.resume().catch(function(){});
};

MOTION.readAudio = function(){
  const a = MOTION.audio;
  const playing = window.Music && Music.audio && !Music.audio.paused;
  if(!playing || !_analyser || !_dataArray){
    a.level *= 0.7; a.bass *= 0.6; a.pulse *= 0.82;   /* decay to silence */
    return a;
  }
  _analyser.getByteFrequencyData(_dataArray);

  /* kick lives in bins 1–6 of a 64-bin frame (~under 400 Hz) */
  let sum = 0, low = 0, lowN = 0;
  for(let i = 0; i < _dataArray.length; i++){
    const v = _dataArray[i] / 255;
    sum += v;
    if(i >= 1 && i <= 6){ low += v; lowN++; }
  }
  const rawLevel = sum / _dataArray.length;
  const rawBass  = lowN ? low / lowN : 0;

  a.level = a.level * 0.7 + rawLevel * 0.3;
  a.bass  = a.bass  * 0.6 + rawBass  * 0.4;

  a.floor = a.floor * 0.98 + rawBass * 0.02;            /* adaptive noise floor */
  const kick = Math.max(0, rawBass - a.floor * 1.3) * 4;
  a.pulse = Math.max(a.pulse * 0.82, Math.min(kick, 1));/* decaying beat hit */
  return a;
};

/* ── one loop, start/stop idempotent ── */
MOTION.frame = function(){
  if(!MOTION.running) return;
  const c = MOTION.cfg();
  if(!MOTION.on()){ MOTION.stop(); MOTION.clear(); return; }
  if(MOTION.effect !== c.motionEffect){          /* effect changed → fresh store */
    MOTION.effect = c.motionEffect;
    MOTION.store = {};
  }
    MOTION.resize();

  const A = MOTION.readAudio();
  let spd  = c.motionSpeed;
  let ints = c.motionIntensity;
  if(c.motionSync){
    const k = c.motionReact;
    spd  = Math.min(c.motionSpeed * (1 + A.bass * 0.35 * k), 3);
    ints = Math.min(c.motionIntensity * (1 + A.level * 0.7 * k + A.pulse * 0.8 * k), 2.5);
  }

  renderMotionEffect(MOTION.ctx, MOTION.w, MOTION.h,
                     c.motionEffect, spd, ints,
                     MOTION.store, c.motionColor);

  MOTION.raf = requestAnimationFrame(MOTION.frame);
};

MOTION.start = function(){
  if(MOTION.running) return;
  if(window.Music && Music.audio && typeof initBeatAnalyser === 'function') initBeatAnalyser();
  MOTION.resumeAudio();
  MOTION.running = true;
  MOTION.raf = requestAnimationFrame(MOTION.frame);
};

MOTION.stop = function(){
  MOTION.running = false;
  if(MOTION.raf) cancelAnimationFrame(MOTION.raf);
  MOTION.raf = 0;
};

MOTION.watch = function(){
  if(MOTION.ro || typeof ResizeObserver !== 'function') return;
  const viz = MOTION.viz();
  if(!viz) return;
  MOTION.ro = new ResizeObserver(function(){ if(MOTION.on()) MOTION.resize(); });
  MOTION.ro.observe(viz);
};

/* ── motion controls — none in the UI; motion is toggled from Settings ── */
MOTION.buildControls = function(){
  const panel = MOTION.panel();
  if(!panel) return;
  /* the corner dot was removed — clean up any left-over instance */
  const old = panel.querySelector(':scope > #vizDot');
  if(old) old.remove();
};



/* ── picker ── */
MOTION.buildPicker = function(){
  if(document.getElementById('motionPicker')) return;
  const el = document.createElement('div');
  el.id = 'motionPicker';
  el.hidden = true;
  el.innerHTML =
    '<div class="motion-picker-head"><span>Motion effect</span>' +
    '<button data-act="motion-close" title="Close">✕</button></div>' +
    '<div class="motion-row"><span>Effect</span><select id="motionEffectSel"></select></div>' +
    '<div class="motion-row"><span>Speed</span><input type="range" id="motionSpeedRng" min="0.2" max="2.5" step="0.1"></div>' +
    '<div class="motion-row"><span>Intensity</span><input type="range" id="motionIntensityRng" min="0.2" max="2" step="0.1"></div>' +
    '<div class="motion-row"><span>Colour</span><input type="color" id="motionColorInp"></div>' +
    '<div class="motion-row"><span>Sync to music</span><button class="tgl" id="motionSyncTgl"></button></div>' +
    '<div class="motion-row"><span>Reactivity</span><input type="range" id="motionReactRng" min="0" max="2" step="0.1"></div>' +
    '<div class="motion-row"><span>On</span><button class="tgl" id="motionToggle"></button></div>';
  document.body.appendChild(el);

  const sel = el.querySelector('#motionEffectSel');
  MOTION.EFFECTS.forEach(function(id){
    const o = document.createElement('option');
    o.value = id; o.textContent = id;
    sel.appendChild(o);
  });
  sel.addEventListener('change', function(){
    const c = MOTION.cfg();
    c.motionEffect = sel.value;
    if(c.motionEffect === 'none') c.motionOn = false;   /* none = the normal bars */
    save(); MOTION.sync();
  });
  el.querySelector('#motionSpeedRng').addEventListener('input', function(){
    MOTION.cfg().motionSpeed = parseFloat(this.value); save();
  });
  el.querySelector('#motionIntensityRng').addEventListener('input', function(){
    MOTION.cfg().motionIntensity = parseFloat(this.value); save();
  });
  el.querySelector('#motionColorInp').addEventListener('input', function(){
    MOTION.cfg().motionColor = this.value; save();
  });
  el.querySelector('#motionToggle').addEventListener('click', function(){ MOTION.toggle(); });
  el.querySelector('#motionSyncTgl').addEventListener('click', function(){
    const c = MOTION.cfg(); c.motionSync = !c.motionSync; save(); MOTION.fillPicker();
  });
  el.querySelector('#motionReactRng').addEventListener('input', function(){
    MOTION.cfg().motionReact = parseFloat(this.value); save();
  });
};

MOTION.fillPicker = function(){
  const el = document.getElementById('motionPicker');
  if(!el) return;
  const c = MOTION.cfg();
  el.querySelector('#motionEffectSel').value = c.motionEffect;
  el.querySelector('#motionSpeedRng').value = c.motionSpeed;
  el.querySelector('#motionIntensityRng').value = c.motionIntensity;
  el.querySelector('#motionColorInp').value = c.motionColor;
  el.querySelector('#motionSyncTgl').classList.toggle('on', !!c.motionSync);
  el.querySelector('#motionReactRng').value = c.motionReact;
  el.querySelector('#motionToggle').classList.toggle('on', !!c.motionOn);
};

MOTION.openPicker = function(){
  MOTION.buildPicker();
  MOTION.fillPicker();
  const el = document.getElementById('motionPicker');
  const dot = document.getElementById('vizDot');
  el.hidden = false;
  const r = dot ? dot.getBoundingClientRect() : null;
  if(r){
    el.style.left = Math.max(8, Math.min(window.innerWidth - el.offsetWidth - 8, r.right - el.offsetWidth)) + 'px';
    el.style.top  = Math.max(8, r.top - el.offsetHeight - 10) + 'px';
  }
};
MOTION.closePicker = function(){
  const el = document.getElementById('motionPicker');
  if(el) el.hidden = true;
};


MOTION.toggle = function(){
  const c = MOTION.cfg();
  c.motionOn = !c.motionOn;
  if(c.motionOn && c.motionEffect === 'none') c.motionEffect = 'rain';
  save(); MOTION.sync();
  toast(c.motionOn ? 'Motion: ' + c.motionEffect : 'Motion off');
};

/* ── the canvas follows the audio element, so play/pause drives it ── */
MOTION.bindAudio = function(){
  const a = window.Music && window.Music.audio;
  if(!a || a === MOTION._audio) return;
  MOTION._audio = a;
  ['play', 'playing', 'pause', 'ended', 'emptied', 'error'].forEach(function(ev){
    a.addEventListener(ev, function(){ MOTION.sync(); });
  });
};

/* ── the one entry point everything else calls ── */
MOTION.sync = function(){
  const c = MOTION.cfg();
  MOTION.attach();
  MOTION.bindAudio();
  MOTION.watch();
  MOTION.buildControls();
  MOTION.buildPicker();

  const on = MOTION.on();
  const viz = MOTION.viz();
  if(viz) viz.classList.toggle('motion-on', on);

  if(on){ MOTION.resize(); MOTION.start(); }
  else  { MOTION.stop(); MOTION.clear(); MOTION.closePicker(); }

  const dot = document.getElementById('vizDot');
  if(dot){
    dot.classList.toggle('active', !!c.motionOn);
    dot.setAttribute('aria-pressed', String(!!c.motionOn));
  }
  MOTION.fillPicker();

  /* hand the bars back to the audio analyser when motion goes off */
  if(!on && MOTION._wasOn && typeof startBeatVisualizer === 'function'){
    setTimeout(function(){ startBeatVisualizer(); }, 0);
  }
  MOTION._wasOn = on;
};
window.MOTION = MOTION;

/* ── clicks ── */
document.addEventListener('click', function(e){
  if(e.target.closest('#musicPanel .viz-dot')){
    e.preventDefault(); e.stopPropagation();
    MOTION.toggle();
    return;
  }
  if(e.target.closest('#musicPanel .viz-picker-btn')){
    e.preventDefault(); e.stopPropagation();
    const el = document.getElementById('motionPicker');
    if(el && !el.hidden) MOTION.closePicker(); else MOTION.openPicker();
    return;
  }
  if(e.target.closest('[data-act="motion-close"]')){
    e.preventDefault(); e.stopPropagation();
    MOTION.closePicker();
    return;
  }
  const el = document.getElementById('motionPicker');
  if(el && !el.hidden && !e.target.closest('#motionPicker')) MOTION.closePicker();
}, true);

/* right-click the dot also opens the picker */
document.addEventListener('contextmenu', function(e){
  if(e.target.closest('#musicPanel .viz-dot')){
    e.preventDefault();
    MOTION.openPicker();
  }
}, true);

/* re-measure when the panel is shown/hidden or the window resizes */
window.addEventListener('resize', function(){ if(MOTION.on()) MOTION.resize(); });
document.addEventListener('visibilitychange', function(){ if(document.hidden) MOTION.stop(); });
