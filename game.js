const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

const scoreEl = document.getElementById('score');
const waveEl = document.getElementById('wave');
const aliveEl = document.getElementById('alive');
const healthFill = document.getElementById('healthFill');
const overlay = document.getElementById('overlay');
const gameOver = document.getElementById('gameOver');
const startBtn = document.getElementById('startBtn');
const retryBtn = document.getElementById('retryBtn');
const fireBtn = document.getElementById('fireBtn');
const finalScore = document.getElementById('finalScore');
const finalWave = document.getElementById('finalWave');

// ===== STATE =====
let gameState = 'menu';
let player = null, bullets = [], demons = [], pickups = [], particles = [];
let score, wave, kills, alive, spawnTimer, spawnInterval;
let fireCooldown = 0, shootInterval = 0.28;
let damageCooldown = 0;
let pointer = { x: W/2, y: H/2, active: false };
let keys = {};
let lastTime = 0;
let shake = 0;
let audioCtx = null;
let soundOn = true;
let highScore = 0;

function ensureAudio(){ if(!audioCtx){ try{audioCtx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){audioCtx=null;} } return audioCtx; }
function beep(freq,dur,type='square',vol=0.07){ if(!soundOn) return; const c=ensureAudio(); if(!c) return; try{ const o=c.createOscillator(),g=c.createGain(); o.type=type; o.frequency.value=freq; g.gain.setValueAtTime(vol,c.currentTime); g.gain.exponentialRampToValueAtTime(0.0001,c.currentTime+dur); o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime+dur);}catch(e){} }

function resetGame() {
  player = { x: W/2, y: H*0.75, r: 13, speed: 170, health: 120, maxHealth: 120, angle: -Math.PI/2, invuln: 2 };
  bullets = []; demons = []; pickups = []; particles = [];
  score = 0; wave = 1; kills = 0; alive = 0; spawnTimer = 2.0; spawnInterval = 1.6;
  fireCooldown = 0; damageCooldown = 0; shake = 0; pointer.active = false;
  scoreEl.textContent = '0'; waveEl.textContent = '1'; aliveEl.textContent = '0';
  healthFill.style.width = '100%';
  overlay.hidden = true; gameOver.hidden = true;
  gameState = 'playing';
  ensureAudio();
}

function dist(a,b){ const dx=a.x-b.x, dy=a.y-b.y; return Math.hypot(dx,dy); }

function spawnDemon() {
  const side = Math.floor(Math.random()*4);
  let x,y;
  if (side===0){ x=Math.random()*W; y=-20; }
  else if (side===1){ x=W+20; y=Math.random()*H; }
  else if (side===2){ x=Math.random()*W; y=H+20; }
  else { x=-20; y=Math.random()*H; }
  const speed = 46 + wave*9 + Math.random()*18;
  demons.push({ x,y, r:11+Math.random()*3, speed, health: 1+Math.floor(wave/4), maxHealth: 1+Math.floor(wave/4), flash:0 });
}

function spawnPickup(x,y) {
  pickups.push({ x, y, r: 9, type: Math.random()<0.8 ? 'health' : 'score', pulse: Math.random()*Math.PI*2 });
}

function makeParticle(x,y,color) {
  particles.push({ x,y, vx:(Math.random()-0.5)*140, vy:(Math.random()-0.5)*140, life:0.35, max:0.35, color, r: Math.random()*3+1 });
}

function shootAt(target) {
  if (!target) return;
  const a = Math.atan2(target.y-player.y, target.x-player.x);
  bullets.push({ x: player.x + Math.cos(a)*player.r*1.3, y: player.y + Math.sin(a)*player.r*1.3, vx: Math.cos(a)*420, vy: Math.sin(a)*420, life: 1.1, r: 3 });
  beep(760, 0.05, 'square', 0.05);
}

function nearestDemon() {
  if (demons.length===0) return null;
  let best=null, bestD=Infinity;
  for (const d of demons) {
    const dd = dist(d, player);
    if (dd < bestD) { bestD=dd; best=d; }
  }
  return (bestD <= 320) ? best : null;
}

function nextWave() {
  wave++;
  waveEl.textContent = wave;
  spawnInterval = Math.max(0.5, 1.2 - (wave-1)*0.06);
  beep(620,0.1,'triangle',0.07); setTimeout(()=>beep(820,0.14,'triangle',0.07),100);
}

function gameOverState() {
  gameState = 'gameover';
  finalScore.textContent = score;
  finalWave.textContent = wave;
  gameOver.hidden = false;
  beep(70, 0.45, 'sawtooth', 0.11);
  if (score > highScore) { highScore = score; try { localStorage.setItem('infernoBest', String(highScore)); } catch(e){} }
}

function update(dt) {
  if (gameState !== 'playing') return;

  // desktop keys
  let vx=0, vy=0;
  if (keys['ArrowUp']||keys['KeyW']) vy -= 1;
  if (keys['ArrowDown']||keys['KeyS']) vy += 1;
  if (keys['ArrowLeft']||keys['KeyA']) vx -= 1;
  if (keys['ArrowRight']||keys['KeyD']) vx += 1;
  // finger follow
  if (pointer.active) {
    const dx = pointer.x - player.x, dy = pointer.y - player.y;
    const d = Math.hypot(dx,dy);
    if (d > 6) { vx += dx/d; vy += dy/d; }
  }
  const len = Math.hypot(vx,vy);
  if (len > 0) {
    vx/=len; vy/=len;
    player.x = Math.max(player.r, Math.min(W-player.r, player.x + vx*player.speed*dt));
    player.y = Math.max(player.r, Math.min(H-player.r, player.y + vy*player.speed*dt));
    player.angle = Math.atan2(vy, vx);
  }
  if (player.invuln > 0) player.invuln -= dt;
  if (damageCooldown > 0) damageCooldown -= dt;

  // spawn
  spawnTimer -= dt;
  if (spawnTimer <= 0) { spawnDemon(); spawnTimer = spawnInterval; }

  // auto fire
  fireCooldown -= dt;
  if (fireCooldown <= 0) {
    const t = nearestDemon();
    if (t) { shootAt(t); fireCooldown = shootInterval; }
  }

  // bullets
  for (let i=bullets.length-1;i>=0;i--) {
    const b=bullets[i];
    b.x+=b.vx*dt; b.y+=b.vy*dt; b.life-=dt;
    if (b.life<=0 || b.x<0||b.x>W||b.y<0||b.y>H) bullets.splice(i,1);
  }

  // demons
  for (let i=demons.length-1;i>=0;i--) {
    const d=demons[i];
    const dx=player.x-d.x, dy=player.y-d.y;
    const dd=Math.hypot(dx,dy)||1;
    d.x += (dx/dd)*d.speed*dt;
    d.y += (dy/dd)*d.speed*dt;
    if (d.flash>0) d.flash -= dt;

    // bullet hits
    for (let j=bullets.length-1;j>=0;j--) {
      const b=bullets[j];
      if (Math.hypot(b.x-d.x,b.y-d.y) < d.r+b.r) {
        d.health -= 1; d.flash = 0.1;
        makeParticle(b.x,b.y,'#fbbf24'); bullets.splice(j,1);
        beep(260,0.04,'square',0.04);
        if (d.health<=0) {
          score += 10*wave;
          killIncrement();
          for (let k=0;k<8;k++) makeParticle(d.x,d.y,'#f97316');
          demons.splice(i,1);
          if (Math.random()<0.12) spawnPickup(d.x,d.y);
          beep(140,0.1,'sawtooth',0.05);
          break;
        }
      }
    }
    // contact damage
    if (demons[i] && dist(demons[i],player) < demons[i].r+player.r) {
      if (player.invuln<=0 && damageCooldown<=0) {
        player.health = Math.max(0, player.health-10);
        player.invuln=0.7; damageCooldown=0.7; shake=0.18;
        makeParticle(player.x,player.y,'#ef4444');
        healthFill.style.width=(player.health/player.maxHealth*100)+'%';
        beep(90,0.18,'sawtooth',0.08);
        if (player.health<=0) gameOverState();
      }
    }
  }

  // pickups
  for (let i=pickups.length-1;i>=0;i--) {
    const p=pickups[i];
    p.pulse += dt*4;
    if (dist(p,player) < p.r + player.r) {
      if (p.type==='health') { player.health = Math.min(player.maxHealth, player.health+25); healthFill.style.width=(player.health/player.maxHealth*100)+'%'; beep(520,0.1,'triangle',0.07); }
      else { score += 25*wave; beep(660,0.09,'triangle',0.07); }
      makeParticle(p.x,p.y,'#a78bfa');
      pickups.splice(i,1);
      scoreEl.textContent = score;
    }
  }

  // particles
  for (let i=particles.length-1;i>=0;i--) {
    const p=particles[i];
    p.x+=p.vx*dt; p.y+=p.vy*dt; p.vx*=0.88; p.vy*=0.88; p.life-=dt;
    if (p.life<=0) particles.splice(i,1);
  }
  if (shake>0) shake -= dt;
  scoreEl.textContent = score;
  aliveEl.textContent = demons.length;
  waveEl.textContent = wave;
}

function killIncrement() {
  kills++;
  if (kills % 10 === 0) nextWave();
}

function render() {
  ctx.save();
  if (shake>0) ctx.translate((Math.random()-0.5)*shake*8, (Math.random()-0.5)*shake*8);
  ctx.fillStyle = '#05020a';
  ctx.fillRect(0,0,W,H);

  // background grid (infernal)
  ctx.strokeStyle = 'rgba(139,92,246,0.06)';
  ctx.lineWidth = 1;
  for (let x=0;x<W;x+=36){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
  for (let y=0;y<H;y+=36){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

  // vignette
  const grd = ctx.createRadialGradient(W/2,H/2,60,W/2,H/2,420);
  grd.addColorStop(0,'rgba(0,0,0,0)'); grd.addColorStop(1,'rgba(0,0,0,0.65)');
  ctx.fillStyle=grd; ctx.fillRect(0,0,W,H);

  if (!player) { ctx.restore(); return; }

  // pickups
  pickups?.forEach(p => {
    ctx.save();
    ctx.translate(p.x,p.y);
    const s = 1 + Math.sin(p.pulse)*0.15;
    ctx.scale(s,s);
    ctx.fillStyle = p.type==='health' ? '#10b981' : '#a78bfa';
    ctx.beginPath(); ctx.arc(0,0,p.r,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px system-ui';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(p.type==='health' ? '❤️' : '💎', 0, 1);
    ctx.restore();
  });

  // particles
  particles?.forEach(p => {
    ctx.globalAlpha = Math.max(0, p.life/p.max);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
  });
  ctx.globalAlpha = 1;

  // demons
  demons?.forEach(d => {
    ctx.save();
    ctx.translate(d.x,d.y);
    ctx.fillStyle = d.flash>0 ? '#fbbf24' : '#7f1d1d';
    ctx.beginPath(); ctx.arc(0,0,d.r,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#ef4444'; ctx.lineWidth=2; ctx.stroke();
    ctx.fillStyle = '#fca5a5';
    ctx.beginPath(); ctx.arc(-4,-3,2.2,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(4,-3,2.2,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(0,0,0,.5)'; ctx.fillRect(-d.r,-d.r-6,d.r*2,3);
    ctx.fillStyle='#22c55e'; ctx.fillRect(-d.r,-d.r-6,d.r*2*(d.health/d.maxHealth),3);
    ctx.restore();
  });

  // bullets
  bullets?.forEach(b => {
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2); ctx.fill();
  });

  // player
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);
  ctx.fillStyle = player.invuln>0 ? 'rgba(139,92,246,.6)' : '#8b5cf6';
  ctx.beginPath(); ctx.arc(0,0,player.r,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#c4b5fd'; ctx.lineWidth=2; ctx.stroke();
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(player.r-2, -4, 14, 8);
  ctx.restore();

  // crosshair pointer
  if (pointer.active) {
    ctx.strokeStyle = 'rgba(249,115,22,.6)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.arc(pointer.x,pointer.y,8,0,Math.PI*2); ctx.stroke();
  }

  ctx.restore();
}

function loop(ts) {
  const dt = Math.min((ts-lastTime)/1000, 0.05);
  lastTime = ts;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

// ===== INPUT =====
window.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function setPointer(x,y,active) {
  pointer.x = x; pointer.y = y; pointer.active = active;
}
canvas.addEventListener('pointerdown', e => {
  e.preventDefault(); canvas.setPointerCapture(e.pointerId);
  const rect = canvas.getBoundingClientRect();
  setPointer((e.clientX-rect.left)*(W/rect.width), (e.clientY-rect.top)*(H/rect.height), true);
}, {passive:false});
canvas.addEventListener('pointermove', e => {
  if (e.pressure === 0 && e.pointerType !== 'touch') return;
  const rect = canvas.getBoundingClientRect();
  setPointer((e.clientX-rect.left)*(W/rect.width), (e.clientY-rect.top)*(H/rect.height), true);
}, {passive:false});
canvas.addEventListener('pointerup', () => { pointer.active = false; }, {passive:false});
canvas.addEventListener('pointercancel', () => { pointer.active = false; }, {passive:false});

fireBtn.addEventListener('pointerdown', e => { e.preventDefault(); fireCooldown = 0; }, {passive:false});
document.getElementById('startBtn').addEventListener('click', () => { ensureAudio(); if (gameState==='menu' || gameState==='gameover') resetGame(); });
document.getElementById('retryBtn').addEventListener('click', () => { ensureAudio(); resetGame(); });
window.resetGame = resetGame;

// service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(()=>{}));
}

requestAnimationFrame(loop);
