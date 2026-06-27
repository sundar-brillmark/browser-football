import Matter from 'matter-js';

const { Engine, Render, Runner, Bodies, Body, Composite, Events } = Matter;

// ============================================================
// CONSTANTS
// ============================================================
const W = 800;
const H = 510;
const GOAL_W    = 200;
const GOAL_DEPTH = 68;
const GOAL_X1   = (W - GOAL_W) / 2;   // 300
const GOAL_X2   = GOAL_X1 + GOAL_W;   // 500
const BALL_R    = 30;
const WALL_T    = 20;

// ============================================================
// 48 TEAMS
// ============================================================
const teams = [
  { name: 'Argentina',     flag: '🇦🇷', color: '#74ACDF' },
  { name: 'Brazil',        flag: '🇧🇷', color: '#FFDF00' },
  { name: 'France',        flag: '🇫🇷', color: '#002395' },
  { name: 'Germany',       flag: '🇩🇪', color: '#FFCC00' },
  { name: 'England',       flag: '🇬🇧', color: '#CF081F' },
  { name: 'Spain',         flag: '🇪🇸', color: '#AA151B' },
  { name: 'Portugal',      flag: '🇵🇹', color: '#006600' },
  { name: 'Netherlands',   flag: '🇳🇱', color: '#FF4F00' },
  { name: 'Italy',         flag: '🇮🇹', color: '#003087' },
  { name: 'Belgium',       flag: '🇧🇪', color: '#ED2939' },
  { name: 'Uruguay',       flag: '🇺🇾', color: '#5FA6D9' },
  { name: 'Colombia',      flag: '🇨🇴', color: '#C8932A' },
  { name: 'Mexico',        flag: '🇲🇽', color: '#006847' },
  { name: 'USA',           flag: '🇺🇸', color: '#3C3B6E' },
  { name: 'Canada',        flag: '🇨🇦', color: '#FF0000' },
  { name: 'Japan',         flag: '🇯🇵', color: '#003087' },
  { name: 'South Korea',   flag: '🇰🇷', color: '#CE0E2D' },
  { name: 'Australia',     flag: '🇦🇺', color: '#FFB700' },
  { name: 'Morocco',       flag: '🇲🇦', color: '#C1272D' },
  { name: 'Senegal',       flag: '🇸🇳', color: '#00853F' },
  { name: 'Ghana',         flag: '🇬🇭', color: '#FCD116' },
  { name: 'Nigeria',       flag: '🇳🇬', color: '#008751' },
  { name: 'Cameroon',      flag: '🇨🇲', color: '#007A5E' },
  { name: 'Egypt',         flag: '🇪🇬', color: '#CE1126' },
  { name: 'Saudi Arabia',  flag: '🇸🇦', color: '#165D31' },
  { name: 'Iran',          flag: '🇮🇷', color: '#239F40' },
  { name: 'Qatar',         flag: '🇶🇦', color: '#8D153A' },
  { name: 'Ecuador',       flag: '🇪🇨', color: '#FFD100' },
  { name: 'Chile',         flag: '🇨🇱', color: '#D52B1E' },
  { name: 'Peru',          flag: '🇵🇪', color: '#B22222' },
  { name: 'Venezuela',     flag: '🇻🇪', color: '#CC3333' },
  { name: 'Paraguay',      flag: '🇵🇾', color: '#D51F27' },
  { name: 'Bolivia',       flag: '🇧🇴', color: '#D52B1E' },
  { name: 'Croatia',       flag: '🇭🇷', color: '#FF3333' },
  { name: 'Serbia',        flag: '🇷🇸', color: '#C6363C' },
  { name: 'Denmark',       flag: '🇩🇰', color: '#C8102E' },
  { name: 'Switzerland',   flag: '🇨🇭', color: '#FF0000' },
  { name: 'Austria',       flag: '🇦🇹', color: '#ED2939' },
  { name: 'Poland',        flag: '🇵🇱', color: '#DC143C' },
  { name: 'Ukraine',       flag: '🇺🇦', color: '#005BBB' },
  { name: 'Turkey',        flag: '🇹🇷', color: '#E30A17' },
  { name: 'Czech Republic',flag: '🇨🇿', color: '#D7141A' },
  { name: 'Hungary',       flag: '🇭🇺', color: '#CE2939' },
  { name: 'Scotland',      flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', color: '#003087' },
  { name: 'Wales',         flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', color: '#C8102E' },
  { name: 'New Zealand',   flag: '🇳🇿', color: '#000066' },
  { name: 'Costa Rica',    flag: '🇨🇷', color: '#002B7F' },
  { name: 'Panama',        flag: '🇵🇦', color: '#DA121A' },
];

// ============================================================
// GAME STATE
// ============================================================
let playerTeam   = teams[1];   // Brazil
let cpuTeam      = teams[3];   // Germany
let playerScore  = 0;
let cpuScore     = 0;
let timeRemaining = 60;
let gameInterval = null;
let isPlaying    = false;
let goalCooldown = false;

// Visual state
let shakeIntensity = 0;
let goalFlash      = 0;
let goalTextTimer  = 0;
let goalTextTeam   = null;
const particles    = [];

// ============================================================
// AUDIO (Web Audio API — lazy init on first user gesture)
// ============================================================
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playCollisionSound(relSpeed) {
  if (!audioCtx) return;
  const intensity = Math.min(3, relSpeed / 5);
  const osc  = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(160 * (1 + intensity * 0.4), audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(35, audioCtx.currentTime + 0.28);
  gain.gain.setValueAtTime(0.35 + intensity * 0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.28);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.28);
}

function playGoalSound() {
  if (!audioCtx) return;
  [523, 659, 784, 1047, 1319].forEach((freq, i) => {
    const osc   = audioCtx.createOscillator();
    const gain  = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.value = freq;
    const t = audioCtx.currentTime + i * 0.13;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.28, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    osc.start(t);
    osc.stop(t + 0.55);
  });
}

// ============================================================
// PARTICLE SYSTEM
// ============================================================
class Particle {
  constructor(x, y, color, type) {
    this.x     = x;
    this.y     = y;
    this.color = color;
    this.type  = type;

    if (type === 'goal') {
      this.vx      = (Math.random() - 0.5) * 14;
      this.vy      = Math.random() * -12 - 2;
      this.size    = Math.random() * 9 + 3;
      this.gravity = 0.28;
      this.decay   = 0.013;
    } else {
      this.vx      = (Math.random() - 0.5) * 8;
      this.vy      = (Math.random() - 0.5) * 8;
      this.size    = Math.random() * 5 + 2;
      this.gravity = 0.08;
      this.decay   = 0.028;
    }

    this.alpha    = 1;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 0.22;
  }

  update() {
    this.x  += this.vx;
    this.y  += this.vy;
    this.vy += this.gravity;
    this.vx *= 0.975;
    this.alpha    -= this.decay;
    this.rotation += this.rotSpeed;
  }

  draw(ctx) {
    if (this.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.fillStyle   = this.color;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    if (this.type === 'goal') {
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  isDead() { return this.alpha <= 0; }
}

function spawnGoalParticles(x, y, teamColor) {
  const palette = [teamColor, '#FFD700', '#FFFFFF', '#FF6B6B', '#4FC3F7', '#69F0AE', '#FF8A65'];
  for (let i = 0; i < 90; i++) {
    particles.push(new Particle(x, y, palette[Math.floor(Math.random() * palette.length)], 'goal'));
  }
}

function spawnCollisionParticles(x, y, colorA, colorB) {
  for (let i = 0; i < 18; i++) {
    particles.push(new Particle(x, y, i % 2 === 0 ? colorA : colorB, 'spark'));
  }
}

// ============================================================
// PHYSICS ENGINE SETUP
// ============================================================
const engine = Engine.create();
engine.gravity.y = 0;
engine.gravity.x = 0;

const render = Render.create({
  element: document.getElementById('game-container'),
  engine,
  options: { width: W, height: H, wireframes: false, background: '#0d3d12' },
});

// ============================================================
// MOBILE SCALING
// ============================================================
function scaleGameToFit() {
  const wrapper = document.getElementById('wrapper');
  const scale = Math.min(window.innerWidth / 800, window.innerHeight / 600, 1);
  wrapper.style.transform      = `scale(${scale})`;
  wrapper.style.transformOrigin = 'center center';
}
window.addEventListener('resize', scaleGameToFit);
scaleGameToFit();

// ============================================================
// KEYBOARD + TOUCH INPUT
// ============================================================
const keys = {};
// Use window + capture:true so events fire BEFORE any focused element
// (slider, button, etc.) consumes them on Mac.
window.addEventListener('keydown', (e) => {
  keys[e.key] = true;
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) {
    e.preventDefault();
  }
}, { capture: true });
window.addEventListener('keyup', (e) => { keys[e.key] = false; }, { capture: true });

// Virtual joystick (touch devices only)
const JOYSTICK_BASE = { x: 72, y: H - 78 };
const JOYSTICK_R    = 54;   // outer ring radius
const KNOB_R        = 21;   // thumb knob radius
const MAX_KNOB_DIST = JOYSTICK_R - KNOB_R - 4;

const joystick = {
  active:  false,
  touchId: null,
  kx: 72,        // knob x (canvas coords)
  ky: H - 78,    // knob y
  dx: 0,         // force direction × magnitude, -1..1
  dy: 0,
};

const isTouchDevice = navigator.maxTouchPoints > 0;

// Touch events are added after the canvas exists (end of file)

// Perfectly elastic walls
const wallOpts = {
  isStatic: true,
  render:   { fillStyle: 'transparent' },
  friction: 0, frictionStatic: 0, frictionAir: 0, restitution: 1.0,
};

const leftTopW  = GOAL_X1;          // 300
const rightTopW = W - GOAL_X2;      // 300

const walls = [
  Bodies.rectangle(W / 2,             H + WALL_T / 2,   W,          WALL_T, wallOpts), // Bottom
  Bodies.rectangle(-WALL_T / 2,       H / 2,            WALL_T,     H,      wallOpts), // Left
  Bodies.rectangle(W + WALL_T / 2,    H / 2,            WALL_T,     H,      wallOpts), // Right
  Bodies.rectangle(leftTopW / 2,      -WALL_T / 2,      leftTopW,   WALL_T, wallOpts), // Top-Left
  Bodies.rectangle(GOAL_X2 + rightTopW / 2, -WALL_T / 2, rightTopW, WALL_T, wallOpts), // Top-Right
];

const ballOpts = {
  restitution:   1.0,
  friction:      0,
  frictionAir:   0.004,
  frictionStatic: 0,
  density:       0.04,
  render:        { fillStyle: 'transparent' },
};

const player   = Bodies.circle(180,     H - 80, BALL_R, ballOpts);
const computer = Bodies.circle(W - 180, H - 80, BALL_R, ballOpts);

Composite.add(engine.world, [...walls, player, computer]);

// ============================================================
// DRAW HELPERS
// ============================================================
function hexToRgb(hex) {
  if (hex.length === 4) {
    hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }
  return {
    r: parseInt(hex.slice(1, 3), 16) || 0,
    g: parseInt(hex.slice(3, 5), 16) || 0,
    b: parseInt(hex.slice(5, 7), 16) || 0,
  };
}

function lighten(hex, amt) {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${Math.min(255, r + amt)},${Math.min(255, g + amt)},${Math.min(255, b + amt)})`;
}

function rgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ============================================================
// CANVAS DRAWING FUNCTIONS
// ============================================================
function drawField(ctx) {
  // Base gradient
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0,   '#0b3810');
  grad.addColorStop(0.5, '#145218');
  grad.addColorStop(1,   '#0b3810');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Alternating stripe texture
  for (let i = 0; i < W / 80; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(0,0,0,0.055)' : 'rgba(255,255,255,0.018)';
    ctx.fillRect(i * 80, 0, 80, H);
  }

  // Field markings
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth   = 2;

  // Boundary box
  ctx.strokeRect(22, GOAL_DEPTH + 12, W - 44, H - GOAL_DEPTH - 34);

  // Center dashed line
  ctx.setLineDash([9, 7]);
  ctx.beginPath();
  ctx.moveTo(W / 2, GOAL_DEPTH + 12);
  ctx.lineTo(W / 2, H - 22);
  ctx.stroke();
  ctx.setLineDash([]);

  // Center circle
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath();
  ctx.arc(W / 2, H / 2 + 30, 68, 0, Math.PI * 2);
  ctx.stroke();

  // Center dot
  ctx.beginPath();
  ctx.arc(W / 2, H / 2 + 30, 5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fill();

  // Penalty box (below goal)
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.strokeRect((W - 250) / 2, GOAL_DEPTH + 12, 250, 90);
}

function drawGoal(ctx, isScoring) {
  const postW = 9;

  // Net background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(GOAL_X1, 0, GOAL_W, GOAL_DEPTH);

  // Net grid
  ctx.lineWidth   = 1;
  ctx.strokeStyle = isScoring ? 'rgba(255, 215, 0, 0.45)' : 'rgba(255, 255, 255, 0.13)';
  for (let x = GOAL_X1; x <= GOAL_X2; x += 20) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, GOAL_DEPTH); ctx.stroke();
  }
  for (let y = 0; y <= GOAL_DEPTH; y += 16) {
    ctx.beginPath(); ctx.moveTo(GOAL_X1, y); ctx.lineTo(GOAL_X2, y); ctx.stroke();
  }

  // Ambient goal glow
  const glowY = isScoring ? 'rgba(255,215,0,0.5)' : 'rgba(255,215,0,0.07)';
  const ambGrad = ctx.createLinearGradient(GOAL_X1, 0, GOAL_X2, 0);
  ambGrad.addColorStop(0,   'rgba(255,215,0,0)');
  ambGrad.addColorStop(0.5, glowY);
  ambGrad.addColorStop(1,   'rgba(255,215,0,0)');
  ctx.fillStyle = ambGrad;
  ctx.fillRect(GOAL_X1, 0, GOAL_W, GOAL_DEPTH);

  // Posts + crossbar
  const postColor = isScoring ? '#FFD700' : '#EEEEEE';
  const postGlow  = isScoring ? 'rgba(255,215,0,0.9)' : 'rgba(255,255,255,0.5)';

  ctx.save();
  ctx.shadowColor = postGlow;
  ctx.shadowBlur  = isScoring ? 22 : 12;
  ctx.fillStyle   = postColor;

  ctx.fillRect(GOAL_X1 - postW / 2,  0,          postW,  GOAL_DEPTH + postW / 2);  // left post
  ctx.fillRect(GOAL_X2 - postW / 2,  0,          postW,  GOAL_DEPTH + postW / 2);  // right post
  ctx.fillRect(GOAL_X1 - postW / 2,  GOAL_DEPTH, GOAL_W + postW, postW);           // crossbar
  ctx.restore();

  // Post end-caps
  ctx.fillStyle = isScoring ? '#FFD700' : '#CCCCCC';
  [GOAL_X1, GOAL_X2].forEach(px => {
    ctx.beginPath();
    ctx.arc(px, GOAL_DEPTH + postW / 2, 5.5, 0, Math.PI * 2);
    ctx.fill();
  });

  // "GOAL" label inside net
  ctx.save();
  ctx.font         = 'bold 10px "Exo 2", sans-serif';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle    = 'rgba(255,215,0,0.4)';
  ctx.fillText('⚽  GOAL  ⚽', W / 2, 4);
  ctx.restore();
}

// ============================================================
// EMOJI OFFSCREEN CACHE
// fillText emoji is unreliable on mobile canvas (iOS/Android).
// Pre-rendering to an offscreen canvas + drawImage is bulletproof.
// ============================================================
const emojiCache = new Map();

function getEmojiCanvas(flag) {
  if (emojiCache.has(flag)) return emojiCache.get(flag);

  const size = BALL_R * 3; // generous padding so tall flags aren't clipped
  const off  = document.createElement('canvas');
  off.width  = size;
  off.height = size;
  const c    = off.getContext('2d');

  // Explicit emoji font stack maximises mobile compatibility
  c.font         = `${Math.floor(BALL_R * 1.25)}px 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji','Segoe UI Symbol',sans-serif`;
  c.textAlign    = 'center';
  c.textBaseline = 'middle';
  c.fillText(flag, size / 2, size / 2 + 1);

  emojiCache.set(flag, off);
  return off;
}

function warmEmojiCache() {
  getEmojiCanvas(playerTeam.flag);
  getEmojiCanvas(cpuTeam.flag);
}

function drawBall(ctx, body, team) {
  const { x, y } = body.position;

  ctx.save();

  // Drop shadow (elliptical)
  ctx.save();
  ctx.translate(x + 5, y + 7);
  ctx.scale(1, 0.38);
  ctx.beginPath();
  ctx.arc(0, 0, BALL_R + 3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fill();
  ctx.restore();

  // Body gradient
  const bodyGrad = ctx.createRadialGradient(
    x - BALL_R * 0.3, y - BALL_R * 0.3, BALL_R * 0.08,
    x, y, BALL_R
  );
  bodyGrad.addColorStop(0,   lighten(team.color, 65));
  bodyGrad.addColorStop(0.55, team.color);
  bodyGrad.addColorStop(1,   rgba(team.color, 0.85));

  ctx.beginPath();
  ctx.arc(x, y, BALL_R, 0, Math.PI * 2);
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  // White border with glow
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth   = 3.5;
  ctx.shadowColor = 'rgba(255,255,255,0.35)';
  ctx.shadowBlur  = 10;
  ctx.stroke();
  ctx.shadowBlur  = 0;

  // Glossy highlight
  const hlGrad = ctx.createRadialGradient(
    x - BALL_R * 0.38, y - BALL_R * 0.38, 1,
    x - BALL_R * 0.15, y - BALL_R * 0.15, BALL_R * 0.72
  );
  hlGrad.addColorStop(0, 'rgba(255,255,255,0.68)');
  hlGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.beginPath();
  ctx.arc(x, y, BALL_R, 0, Math.PI * 2);
  ctx.fillStyle = hlGrad;
  ctx.fill();

  // Flag emoji — rotates with ball, drawn from offscreen cache for mobile reliability
  const emojiOff  = getEmojiCanvas(team.flag);
  const emojiSize = emojiOff.width;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(body.angle);
  ctx.shadowBlur = 0;
  ctx.drawImage(emojiOff, -emojiSize / 2, -emojiSize / 2, emojiSize, emojiSize);
  ctx.restore();

  ctx.restore();
}

function drawGoalText(ctx) {
  if (goalTextTimer <= 0) return;

  const prog  = 1 - goalTextTimer / 120;
  const alpha = Math.min(1, goalTextTimer / 25);
  const scale = 1 + prog * 0.4;

  ctx.save();
  ctx.translate(W / 2, H / 2 - 20);
  ctx.scale(scale, scale);
  ctx.globalAlpha  = alpha;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  ctx.font        = '900 italic 76px "Exo 2", sans-serif';
  ctx.strokeStyle = 'rgba(0,0,0,0.8)';
  ctx.lineWidth   = 10;
  ctx.strokeText('GOAL!', 0, 0);

  const teamColor = goalTextTeam === 'player' ? playerTeam.color : cpuTeam.color;
  const grd = ctx.createLinearGradient(-160, -40, 160, 40);
  grd.addColorStop(0, '#FFD700');
  grd.addColorStop(0.5, '#FFFFFF');
  grd.addColorStop(1, teamColor);
  ctx.fillStyle = grd;
  ctx.fillText('GOAL!', 0, 0);

  const scorerName = goalTextTeam === 'player' ? playerTeam.name : cpuTeam.name;
  ctx.font      = '700 20px "Exo 2", sans-serif';
  ctx.fillStyle = '#FFD700';
  ctx.fillText(`${scorerName.toUpperCase()} SCORES!`, 0, 56);

  ctx.restore();
}

// ============================================================
// VIRTUAL JOYSTICK DRAW
// ============================================================
function drawJoystick(ctx) {
  if (!isTouchDevice) return;

  const { x: bx, y: by } = JOYSTICK_BASE;
  ctx.save();

  // Outer ring
  ctx.beginPath();
  ctx.arc(bx, by, JOYSTICK_R, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fill();
  ctx.strokeStyle = joystick.active ? 'rgba(218,25,30,0.9)' : 'rgba(218,25,30,0.45)';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Cardinal arrows
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = '#DA191E';
  ctx.font = 'bold 13px "Exo 2", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const ad = JOYSTICK_R - 13;
  ctx.fillText('▲', bx,      by - ad);
  ctx.fillText('▼', bx,      by + ad);
  ctx.fillText('◀', bx - ad, by);
  ctx.fillText('▶', bx + ad, by);
  ctx.globalAlpha = 1;

  // Knob
  const knobGrad = ctx.createRadialGradient(
    joystick.kx - 5, joystick.ky - 5, 2,
    joystick.kx, joystick.ky, KNOB_R
  );
  knobGrad.addColorStop(0, '#FF5565');
  knobGrad.addColorStop(1, '#8B1020');
  ctx.beginPath();
  ctx.arc(joystick.kx, joystick.ky, KNOB_R, 0, Math.PI * 2);
  ctx.fillStyle = knobGrad;
  ctx.shadowColor = 'rgba(218,25,30,0.8)';
  ctx.shadowBlur  = joystick.active ? 16 : 6;
  ctx.fill();
  ctx.shadowBlur  = 0;
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth   = 2;
  ctx.stroke();

  ctx.restore();
}

// ============================================================
// RENDER EVENTS
// ============================================================
Events.on(render, 'afterRender', () => {
  const ctx = render.context;
  if (!ctx) return;

  // Apply screen shake
  let sx = 0, sy = 0;
  if (shakeIntensity > 0.5) {
    sx = (Math.random() - 0.5) * shakeIntensity;
    sy = (Math.random() - 0.5) * shakeIntensity;
    shakeIntensity *= 0.82;
  } else {
    shakeIntensity = 0;
  }

  ctx.save();
  ctx.translate(sx, sy);

  drawField(ctx);
  drawGoal(ctx, goalFlash > 0);

  // Goal color wash
  if (goalFlash > 0) {
    const tc = goalTextTeam === 'player' ? playerTeam.color : cpuTeam.color;
    ctx.save();
    ctx.globalAlpha = (goalFlash / 30) * 0.3;
    ctx.fillStyle   = tc;
    ctx.fillRect(-10, -10, W + 20, H + 20);
    ctx.restore();
    goalFlash--;
  }

  // Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].draw(ctx);
    if (particles[i].isDead()) particles.splice(i, 1);
  }

  // Balls
  drawBall(ctx, player, playerTeam);
  drawBall(ctx, computer, cpuTeam);

  // Virtual joystick (touch only)
  drawJoystick(ctx);

  // Goal text overlay
  drawGoalText(ctx);
  if (goalTextTimer > 0) goalTextTimer--;

  ctx.restore();
});

// ============================================================
// COLLISION EVENTS
// ============================================================
Events.on(engine, 'collisionStart', (event) => {
  for (const pair of event.pairs) {
    const isOurCollision =
      (pair.bodyA === player && pair.bodyB === computer) ||
      (pair.bodyA === computer && pair.bodyB === player);

    if (!isOurCollision) continue;

    const rvx   = player.velocity.x - computer.velocity.x;
    const rvy   = player.velocity.y - computer.velocity.y;
    const speed = Math.sqrt(rvx * rvx + rvy * rvy);

    playCollisionSound(speed);

    const mx = (player.position.x + computer.position.x) / 2;
    const my = (player.position.y + computer.position.y) / 2;
    spawnCollisionParticles(mx, my, playerTeam.color, cpuTeam.color);

    if (speed > 6) shakeIntensity = Math.min(12, speed * 0.7);
  }
});

// ============================================================
// GOAL LOGIC
// ============================================================
function scoreGoal(who) {
  if (goalCooldown) return;
  goalCooldown = true;
  isPlaying    = false;

  if (who === 'player') playerScore++;
  else                   cpuScore++;

  document.getElementById('player-score-val').innerText = playerScore;
  document.getElementById('cpu-score-val').innerText    = cpuScore;

  const pos = who === 'player' ? player.position : computer.position;
  const tc  = who === 'player' ? playerTeam.color : cpuTeam.color;
  spawnGoalParticles(Math.min(Math.max(pos.x, GOAL_X1 + 20), GOAL_X2 - 20), Math.max(pos.y, 40), tc);
  playGoalSound();

  goalFlash     = 30;
  goalTextTimer = 120;
  goalTextTeam  = who;
  shakeIntensity = 20;

  setTimeout(() => {
    resetPositions();
    goalCooldown = false;
    isPlaying    = true;
  }, 2200);
}

// ============================================================
// PHYSICS LOOP
// ============================================================
const speedSlider = document.getElementById('speed-slider');
const CPU_FORCE   = 0.28;

Events.on(engine, 'beforeUpdate', () => {
  if (!isPlaying) return;

  // Goal detection — ball center past the top of canvas means it went through the goal gap
  if (!goalCooldown) {
    if (player.position.y < -BALL_R) {
      scoreGoal('cpu');
      return;
    }
    if (computer.position.y < -BALL_R) {
      scoreGoal('player');
      return;
    }
  }

  // Out-of-bounds safety reset
  const oob = (b) =>
    b.position.x < -120 || b.position.x > W + 120 || b.position.y > H + 120;
  if (oob(player) || oob(computer)) {
    resetPositions();
    return;
  }

  const t      = engine.timing.timestamp;
  const pForce = parseFloat(speedSlider.value);

  // 2D wobble — different frequencies on X and Y create chaotic approach angles
  // that produce collisions at all angles, including diagonal ones toward the goal
  const wobbleX = Math.sin(t * 0.006) * 65;
  const wobbleY = Math.cos(t * 0.004) * 48; // different frequency + cos offset

  const cpuForce = CPU_FORCE * (1 + Math.sin(t * 0.003) * 0.09);

  // Auto-chase: player ball pursues computer (with 2D wobble for chaos)
  const pdx   = (computer.position.x + wobbleX) - player.position.x;
  const pdy   = (computer.position.y + wobbleY) - player.position.y;
  const pDist = Math.sqrt(pdx * pdx + pdy * pdy);
  if (pDist > 0) {
    Body.applyForce(player, player.position, {
      x: (pdx / pDist) * pForce,
      y: (pdy / pDist) * pForce,
    });
  }

  // Directional boost — keyboard (desktop) or touch (mobile) steer the ball.
  // Fixed force of 1.5 so it's always noticeably stronger than auto-chase.
  const BOOST = 1.5;
  if (keys['ArrowUp']    || keys['w'] || keys['W']) Body.applyForce(player, player.position, { x: 0,      y: -BOOST });
  if (keys['ArrowDown']  || keys['s'] || keys['S']) Body.applyForce(player, player.position, { x: 0,      y:  BOOST });
  if (keys['ArrowLeft']  || keys['a'] || keys['A']) Body.applyForce(player, player.position, { x: -BOOST, y: 0 });
  if (keys['ArrowRight'] || keys['d'] || keys['D']) Body.applyForce(player, player.position, { x:  BOOST, y: 0 });

  // Joystick steering (mobile)
  if (joystick.active) {
    Body.applyForce(player, player.position, {
      x: joystick.dx * BOOST,
      y: joystick.dy * BOOST,
    });
  }

  // CPU auto-chase: pursues player with opposite wobble
  const cdx   = (player.position.x - wobbleX) - computer.position.x;
  const cdy   = (player.position.y - wobbleY) - computer.position.y;
  const cDist = Math.sqrt(cdx * cdx + cdy * cdy);
  if (cDist > 0) {
    Body.applyForce(computer, computer.position, {
      x: (cdx / cDist) * cpuForce,
      y: (cdy / cDist) * cpuForce,
    });
  }

  // Speed cap to prevent tunnelling
  const capSpeed = (b, maxV) => {
    const spd = Math.sqrt(b.velocity.x * b.velocity.x + b.velocity.y * b.velocity.y);
    if (spd > maxV) {
      Body.setVelocity(b, { x: (b.velocity.x / spd) * maxV, y: (b.velocity.y / spd) * maxV });
    }
  };
  capSpeed(player,   18);
  capSpeed(computer, 18);
});

// ============================================================
// GAME MANAGEMENT
// ============================================================
function resetPositions() {
  // Stagger Y heights so balls approach each other diagonally,
  // creating vertical momentum that eventually drives play toward the goal.
  Body.setPosition(player,   { x: 160,     y: H - 90 });
  Body.setVelocity(player,   { x: 0, y: 0 });
  Body.setAngularVelocity(player, 0);

  Body.setPosition(computer, { x: W - 160, y: H / 2 - 40 });
  Body.setVelocity(computer, { x: 0, y: 0 });
  Body.setAngularVelocity(computer, 0);
}

// Populate selectors
const playerSelect = document.getElementById('player-select');
const cpuSelect    = document.getElementById('cpu-select');

teams.forEach((team, i) => {
  playerSelect.add(new Option(`${team.flag}  ${team.name}`, i));
  cpuSelect.add(new Option(`${team.flag}  ${team.name}`, i));
});
playerSelect.value = 1;   // Brazil
cpuSelect.value    = 3;   // Germany

document.getElementById('start-btn').addEventListener('click', () => {
  initAudio();
  startGame();
});

document.getElementById('restart-btn').addEventListener('click', () => {
  document.getElementById('gameover-screen').className = 'screen hidden';
  document.getElementById('menu-screen').className     = 'screen';
});

function startGame() {
  playerTeam = teams[parseInt(playerSelect.value)];
  cpuTeam    = teams[parseInt(cpuSelect.value)];
  emojiCache.clear(); // rebuild cache for newly selected team flags

  document.getElementById('hud-player-flag').innerText = playerTeam.flag;
  document.getElementById('hud-player-name').innerText = playerTeam.name.toUpperCase();
  document.getElementById('hud-cpu-flag').innerText    = cpuTeam.flag;
  document.getElementById('hud-cpu-name').innerText    = cpuTeam.name.toUpperCase();

  playerScore   = 0;
  cpuScore      = 0;
  timeRemaining = 60;
  document.getElementById('player-score-val').innerText = 0;
  document.getElementById('cpu-score-val').innerText    = 0;
  document.getElementById('time-val').innerText         = 60;

  document.getElementById('menu-screen').className   = 'screen hidden';
  document.getElementById('game-hud').className      = '';

  speedSlider.value = 0.25;
  particles.length  = 0;
  goalCooldown      = false;

  // Pre-render emoji to offscreen canvases before the first frame
  warmEmojiCache();

  // Give the canvas focus so keyboard events aren't swallowed by form elements
  render.canvas.focus();
  goalFlash         = 0;
  goalTextTimer     = 0;
  shakeIntensity    = 0;

  resetPositions();
  isPlaying = true;

  if (gameInterval) clearInterval(gameInterval);
  gameInterval = setInterval(() => {
    if (goalCooldown) return;  // Pause timer during goal replay
    timeRemaining--;
    document.getElementById('time-val').innerText = timeRemaining;
    if (timeRemaining <= 0) endGame();
  }, 1000);
}

function endGame() {
  isPlaying = false;
  clearInterval(gameInterval);

  document.getElementById('game-hud').className        = 'hidden';
  document.getElementById('gameover-screen').className = 'screen';

  const pd = document.getElementById('final-score-display');
  pd.innerText  = `${playerScore}  —  ${cpuScore}`;
  pd.style.color =
    playerScore > cpuScore ? '#00FF80' :
    cpuScore > playerScore ? '#FF5252' : '#FFD700';

  const h2 = document.getElementById('gameover-title');
  h2.innerText =
    playerScore > cpuScore ? '🏆 VICTORY!' :
    cpuScore > playerScore ? '💀 DEFEAT!'  : '🤝 DRAW!';

  document.getElementById('final-score-text').innerText =
    playerScore > cpuScore ? `${playerTeam.name} crushes ${cpuTeam.name}! Outstanding!` :
    cpuScore > playerScore ? `${cpuTeam.name} defeats ${playerTeam.name}. Try again!`   :
    `Incredible draw! Neither side could be separated.`;
}

// ============================================================
// START RENDER + RUNNER
// ============================================================
Render.run(render);
Runner.run(Runner.create(), engine);

// ============================================================
// TOUCH CONTROLS (wired after canvas exists)
// ============================================================
const canvas = render.canvas;
canvas.setAttribute('tabindex', '0');
canvas.style.outline = 'none'; // No visible focus ring

function getCanvasPos(touch) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (touch.clientX - rect.left) / rect.width  * W,
    y: (touch.clientY - rect.top)  / rect.height * H,
  };
}

function updateJoystickKnob(pos) {
  let dx = pos.x - JOYSTICK_BASE.x;
  let dy = pos.y - JOYSTICK_BASE.y;
  const dist  = Math.sqrt(dx * dx + dy * dy);
  const ratio = dist > 0 ? Math.min(dist / MAX_KNOB_DIST, 1) : 0;
  if (dist > 0) {
    joystick.dx = (dx / dist) * ratio;
    joystick.dy = (dy / dist) * ratio;
    joystick.kx = JOYSTICK_BASE.x + (dx / dist) * Math.min(dist, MAX_KNOB_DIST);
    joystick.ky = JOYSTICK_BASE.y + (dy / dist) * Math.min(dist, MAX_KNOB_DIST);
  } else {
    joystick.dx = joystick.dy = 0;
    joystick.kx = JOYSTICK_BASE.x;
    joystick.ky = JOYSTICK_BASE.y;
  }
}

function resetJoystick() {
  joystick.active  = false;
  joystick.touchId = null;
  joystick.kx = JOYSTICK_BASE.x;
  joystick.ky = JOYSTICK_BASE.y;
  joystick.dx = joystick.dy = 0;
}

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  for (const t of e.changedTouches) {
    if (joystick.active) continue; // already tracking a finger
    const pos = getCanvasPos(t);
    const dx  = pos.x - JOYSTICK_BASE.x;
    const dy  = pos.y - JOYSTICK_BASE.y;
    // Accept touch anywhere in or near the joystick base
    if (Math.sqrt(dx * dx + dy * dy) < JOYSTICK_R + 28) {
      joystick.active  = true;
      joystick.touchId = t.identifier;
      updateJoystickKnob(pos);
    }
  }
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  for (const t of e.changedTouches) {
    if (t.identifier === joystick.touchId) {
      updateJoystickKnob(getCanvasPos(t));
    }
  }
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
  for (const t of e.changedTouches) {
    if (t.identifier === joystick.touchId) resetJoystick();
  }
}, { passive: false });

canvas.addEventListener('touchcancel', (e) => {
  for (const t of e.changedTouches) {
    if (t.identifier === joystick.touchId) resetJoystick();
  }
}, { passive: false });

// Controls hint
const hintEl = document.getElementById('controls-hint');
if (hintEl) {
  hintEl.innerText = isTouchDevice
    ? 'JOYSTICK (bottom-left) to steer · SLIDER to adjust power'
    : 'ARROW KEYS / WASD to boost · SLIDER to adjust power';
}
