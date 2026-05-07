const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'public', 'art');
const SIZE = 280; // px square

function save(canvas, name) {
  fs.writeFileSync(path.join(OUT, `${name}.png`), canvas.toBuffer('image/png'));
  console.log(`  wrote ${name}.png`);
}

// ─── Helpers ───
function radialGlow(ctx, cx, cy, r, color, alpha) {
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  grad.addColorStop(0, withAlpha(color, alpha));
  grad.addColorStop(1, withAlpha(color, 0));
  ctx.fillStyle = grad;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
}

function withAlpha(hex, a) {
  const r = (hex >> 16) & 0xff, g = (hex >> 8) & 0xff, b = hex & 0xff;
  return `rgba(${r},${g},${b},${a})`;
}

function hex(c) {
  const r = (c >> 16) & 0xff, g = (c >> 8) & 0xff, b = c & 0xff;
  return `rgb(${r},${g},${b})`;
}

function star(ctx, cx, cy, points, outerR, innerR) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const px = cx + Math.cos(angle) * r;
    const py = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function ellipse(ctx, cx, cy, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function strokeEllipse(ctx, cx, cy, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
}

// ═══════════════════════════════════════════
// CREATURES
// ═══════════════════════════════════════════

function drawCommander() {
  const c = createCanvas(SIZE, SIZE), ctx = c.getContext('2d');
  const cx = SIZE / 2, cy = SIZE / 2;

  // Background glow
  radialGlow(ctx, cx, cy - 10, 100, 0x00ffff, 0.08);

  // Body / space suit
  ctx.fillStyle = withAlpha(0x1a1a3e, 0.95);
  ctx.beginPath();
  ctx.moveTo(cx, cy + 5);
  ctx.bezierCurveTo(cx - 35, cy + 10, cx - 40, cy + 70, cx - 30, cy + 85);
  ctx.lineTo(cx + 30, cy + 85);
  ctx.bezierCurveTo(cx + 40, cy + 70, cx + 35, cy + 10, cx, cy + 5);
  ctx.fill();

  // Suit detail lines
  ctx.strokeStyle = withAlpha(0x00ffff, 0.2);
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx, cy + 8); ctx.lineTo(cx, cy + 80); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - 18, cy + 35); ctx.lineTo(cx + 18, cy + 35); ctx.stroke();

  // Belt
  ctx.fillStyle = withAlpha(0x333366, 0.8);
  ctx.fillRect(cx - 25, cy + 42, 50, 6);
  ctx.fillStyle = withAlpha(0xffdd44, 0.9);
  ctx.fillRect(cx - 5, cy + 41, 10, 8);

  // Shoulders / epaulettes
  ctx.fillStyle = withAlpha(0x333366, 0.9);
  ellipse(ctx, cx - 30, cy + 15, 14, 10);
  ellipse(ctx, cx + 30, cy + 15, 14, 10);
  // Shoulder stars
  ctx.fillStyle = withAlpha(0xffdd44, 0.8);
  star(ctx, cx - 30, cy + 15, 5, 5, 2.5);
  star(ctx, cx + 30, cy + 15, 5, 5, 2.5);

  // Helmet base
  ctx.fillStyle = withAlpha(0x2a2a4e, 1);
  ctx.beginPath();
  ctx.arc(cx, cy - 22, 38, 0, Math.PI * 2);
  ctx.fill();

  // Helmet rim
  ctx.strokeStyle = withAlpha(0x444488, 0.6);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy - 22, 38, 0, Math.PI * 2);
  ctx.stroke();

  // Visor glass
  const visorGrad = ctx.createLinearGradient(cx - 25, cy - 45, cx + 25, cy - 15);
  visorGrad.addColorStop(0, withAlpha(0x00ffff, 0.8));
  visorGrad.addColorStop(0.5, withAlpha(0x00aacc, 0.6));
  visorGrad.addColorStop(1, withAlpha(0x006688, 0.7));
  ctx.fillStyle = visorGrad;
  ellipse(ctx, cx, cy - 24, 28, 20);

  // Visor reflection
  ctx.fillStyle = withAlpha(0xffffff, 0.25);
  ellipse(ctx, cx - 8, cy - 30, 12, 6);

  // Antenna
  ctx.strokeStyle = withAlpha(0x888888, 0.8);
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx + 15, cy - 58); ctx.lineTo(cx + 20, cy - 78); ctx.stroke();
  ctx.fillStyle = withAlpha(0xff4444, 0.9);
  ctx.beginPath(); ctx.arc(cx + 20, cy - 80, 4, 0, Math.PI * 2); ctx.fill();
  radialGlow(ctx, cx + 20, cy - 80, 10, 0xff4444, 0.3);

  // Chest badge
  ctx.fillStyle = withAlpha(0xffdd44, 0.9);
  star(ctx, cx, cy + 22, 5, 10, 5);
  radialGlow(ctx, cx, cy + 22, 15, 0xffdd44, 0.2);

  // Arms
  ctx.fillStyle = withAlpha(0x1a1a3e, 0.9);
  // Left arm
  ctx.beginPath();
  ctx.moveTo(cx - 33, cy + 18);
  ctx.bezierCurveTo(cx - 48, cy + 30, cx - 50, cy + 55, cx - 42, cy + 70);
  ctx.lineTo(cx - 34, cy + 68);
  ctx.bezierCurveTo(cx - 38, cy + 55, cx - 38, cy + 35, cx - 28, cy + 22);
  ctx.fill();
  // Right arm
  ctx.beginPath();
  ctx.moveTo(cx + 33, cy + 18);
  ctx.bezierCurveTo(cx + 48, cy + 30, cx + 50, cy + 55, cx + 42, cy + 70);
  ctx.lineTo(cx + 34, cy + 68);
  ctx.bezierCurveTo(cx + 38, cy + 55, cx + 38, cy + 35, cx + 28, cy + 22);
  ctx.fill();

  // Gloves
  ctx.fillStyle = withAlpha(0x333366, 0.9);
  ctx.beginPath(); ctx.arc(cx - 42, cy + 72, 8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 42, cy + 72, 8, 0, Math.PI * 2); ctx.fill();

  // Boots
  ctx.fillStyle = withAlpha(0x222244, 1);
  ctx.fillRect(cx - 28, cy + 78, 18, 14);
  ctx.fillRect(cx + 10, cy + 78, 18, 14);

  save(c, 'creature_base');
}

function drawJellyfish() {
  const c = createCanvas(SIZE, SIZE), ctx = c.getContext('2d');
  const cx = SIZE / 2, cy = SIZE / 2 - 15;

  // Massive ambient glow
  radialGlow(ctx, cx, cy, 120, 0xcc44ff, 0.1);
  radialGlow(ctx, cx, cy, 80, 0xff66ff, 0.08);

  // Tentacles (drawn first, behind bell)
  const tentColors = [0xcc44ff, 0xaa22dd, 0xff66ee, 0x8833cc, 0xdd55ff, 0xbb33ee, 0xff88ff];
  for (let i = 0; i < 9; i++) {
    const tx = cx - 32 + i * 8;
    const col = tentColors[i % tentColors.length];
    ctx.strokeStyle = withAlpha(col, 0.6);
    ctx.lineWidth = 2.5 - (i % 3) * 0.3;
    ctx.beginPath();
    ctx.moveTo(tx, cy + 30);
    const amp = 8 + (i % 3) * 4;
    const len = 60 + (i % 2) * 25;
    for (let j = 0; j <= len; j += 2) {
      ctx.lineTo(tx + Math.sin(j * 0.12 + i * 0.8) * amp, cy + 30 + j);
    }
    ctx.stroke();

    // Glow dots along tentacles
    if (i % 2 === 0) {
      for (let j = 15; j < len; j += 20) {
        ctx.fillStyle = withAlpha(0xff88ff, 0.5);
        ctx.beginPath();
        ctx.arc(tx + Math.sin(j * 0.12 + i * 0.8) * amp, cy + 30 + j, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Bell / dome — layered for depth
  const bellGrad = ctx.createRadialGradient(cx, cy - 5, 10, cx, cy + 5, 55);
  bellGrad.addColorStop(0, withAlpha(0xff88ff, 0.7));
  bellGrad.addColorStop(0.4, withAlpha(0xcc44ff, 0.6));
  bellGrad.addColorStop(0.8, withAlpha(0x8822cc, 0.5));
  bellGrad.addColorStop(1, withAlpha(0x6611aa, 0.3));
  ctx.fillStyle = bellGrad;
  ellipse(ctx, cx, cy, 50, 38);

  // Bell inner pattern — concentric rings
  ctx.strokeStyle = withAlpha(0xff88ff, 0.15);
  ctx.lineWidth = 1;
  for (let r = 10; r < 40; r += 8) {
    strokeEllipse(ctx, cx, cy, r, r * 0.7);
  }

  // Bioluminescent spots
  ctx.fillStyle = withAlpha(0xffffff, 0.35);
  [[- 15, -12, 5], [10, -8, 4], [-5, -18, 3], [18, -15, 3], [-20, 2, 3], [22, 0, 2.5]].forEach(([ox, oy, r]) => {
    ctx.beginPath(); ctx.arc(cx + ox, cy + oy, r, 0, Math.PI * 2); ctx.fill();
  });

  // Eyes — large, expressive
  // Eye whites
  ctx.fillStyle = withAlpha(0xffffff, 0.9);
  ellipse(ctx, cx - 14, cy - 5, 9, 8);
  ellipse(ctx, cx + 14, cy - 5, 9, 8);
  // Irises
  ctx.fillStyle = withAlpha(0x6600aa, 1);
  ellipse(ctx, cx - 13, cy - 4, 5, 6);
  ellipse(ctx, cx + 13, cy - 4, 5, 6);
  // Pupils
  ctx.fillStyle = withAlpha(0x220044, 1);
  ctx.beginPath(); ctx.arc(cx - 13, cy - 3, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 13, cy - 3, 2.5, 0, Math.PI * 2); ctx.fill();
  // Eye shine
  ctx.fillStyle = withAlpha(0xffffff, 0.7);
  ctx.beginPath(); ctx.arc(cx - 15, cy - 7, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 11, cy - 7, 2, 0, Math.PI * 2); ctx.fill();

  // Cute mouth
  ctx.strokeStyle = withAlpha(0xff88ff, 0.5);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy + 10, 5, 0.3, Math.PI - 0.3);
  ctx.stroke();

  // Crown bumps on top
  ctx.fillStyle = withAlpha(0xdd55ff, 0.7);
  ctx.beginPath(); ctx.arc(cx, cy - 36, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = withAlpha(0xcc44ff, 0.6);
  ctx.beginPath(); ctx.arc(cx - 16, cy - 32, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 16, cy - 32, 5, 0, Math.PI * 2); ctx.fill();

  save(c, 'creature_nebula_jelly');
}

function drawWisp() {
  const c = createCanvas(SIZE, SIZE), ctx = c.getContext('2d');
  const cx = SIZE / 2, cy = SIZE / 2;

  // Multiple layered glows
  radialGlow(ctx, cx, cy, 110, 0xaa88ff, 0.08);
  radialGlow(ctx, cx, cy, 70, 0xccaaff, 0.12);
  radialGlow(ctx, cx, cy, 40, 0xeeccff, 0.15);

  // Wispy trailing body
  ctx.globalAlpha = 0.4;
  for (let i = 0; i < 5; i++) {
    const ox = Math.sin(i * 1.2) * 8;
    ctx.strokeStyle = withAlpha(0xaa88ff, 0.3 - i * 0.04);
    ctx.lineWidth = 4 - i * 0.5;
    ctx.beginPath();
    ctx.moveTo(cx + ox - 15, cy + 15);
    ctx.bezierCurveTo(cx + ox - 20, cy + 40, cx + ox - 10 - i * 3, cy + 70, cx + ox - 8 - i * 5, cy + 100);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + ox + 15, cy + 15);
    ctx.bezierCurveTo(cx + ox + 20, cy + 40, cx + ox + 10 + i * 3, cy + 70, cx + ox + 8 + i * 5, cy + 100);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + ox, cy + 20);
    ctx.bezierCurveTo(cx + ox - 3, cy + 50, cx + ox + 2, cy + 80, cx + ox, cy + 110);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Core body — luminous orb
  const coreGrad = ctx.createRadialGradient(cx, cy - 5, 5, cx, cy, 35);
  coreGrad.addColorStop(0, withAlpha(0xffffff, 0.9));
  coreGrad.addColorStop(0.3, withAlpha(0xeeccff, 0.7));
  coreGrad.addColorStop(0.6, withAlpha(0xaa88ff, 0.5));
  coreGrad.addColorStop(1, withAlpha(0x6644aa, 0.2));
  ctx.fillStyle = coreGrad;
  ctx.beginPath(); ctx.arc(cx, cy - 5, 35, 0, Math.PI * 2); ctx.fill();

  // Inner core
  ctx.fillStyle = withAlpha(0xeeddff, 0.6);
  ctx.beginPath(); ctx.arc(cx, cy - 8, 18, 0, Math.PI * 2); ctx.fill();

  // Eyes — bright ethereal
  ctx.fillStyle = withAlpha(0xffffff, 0.95);
  ellipse(ctx, cx - 10, cy - 10, 7, 6);
  ellipse(ctx, cx + 10, cy - 10, 7, 6);
  ctx.fillStyle = withAlpha(0x4400aa, 1);
  ctx.beginPath(); ctx.arc(cx - 10, cy - 10, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 10, cy - 10, 3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = withAlpha(0xffffff, 0.7);
  ctx.beginPath(); ctx.arc(cx - 11, cy - 12, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 9, cy - 12, 1.5, 0, Math.PI * 2); ctx.fill();

  // Sparkles
  ctx.fillStyle = withAlpha(0xffffff, 0.7);
  [[-35, -30], [32, -25], [-28, 25], [30, 35], [0, -50], [-40, 5], [38, 10]].forEach(([ox, oy]) => {
    star(ctx, cx + ox, cy + oy, 4, 3, 1.2);
  });

  save(c, 'creature_nebula_wisp');
}

function drawTitan() {
  const c = createCanvas(SIZE, SIZE), ctx = c.getContext('2d');
  const cx = SIZE / 2, cy = SIZE / 2;

  radialGlow(ctx, cx, cy, 110, 0x8844cc, 0.1);

  // Massive armored body
  ctx.fillStyle = withAlpha(0x4422aa, 0.9);
  ctx.beginPath();
  ctx.moveTo(cx - 38, cy + 60);
  ctx.lineTo(cx - 32, cy - 10);
  ctx.bezierCurveTo(cx - 20, cy - 30, cx + 20, cy - 30, cx + 32, cy - 10);
  ctx.lineTo(cx + 38, cy + 60);
  ctx.closePath();
  ctx.fill();

  // Armor plates
  ctx.fillStyle = withAlpha(0x5533bb, 0.7);
  ctx.fillRect(cx - 30, cy + 5, 60, 8);
  ctx.fillRect(cx - 28, cy + 25, 56, 6);

  // Shoulder armor
  ctx.fillStyle = withAlpha(0x6644cc, 0.9);
  ctx.beginPath();
  ctx.moveTo(cx - 32, cy - 5);
  ctx.lineTo(cx - 58, cy - 15);
  ctx.lineTo(cx - 50, cy + 15);
  ctx.lineTo(cx - 30, cy + 10);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 32, cy - 5);
  ctx.lineTo(cx + 58, cy - 15);
  ctx.lineTo(cx + 50, cy + 15);
  ctx.lineTo(cx + 30, cy + 10);
  ctx.closePath();
  ctx.fill();

  // Shoulder spikes
  ctx.fillStyle = withAlpha(0x9966ee, 0.9);
  ctx.beginPath();
  ctx.moveTo(cx - 55, cy - 15); ctx.lineTo(cx - 62, cy - 35); ctx.lineTo(cx - 48, cy - 12); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 55, cy - 15); ctx.lineTo(cx + 62, cy - 35); ctx.lineTo(cx + 48, cy - 12); ctx.fill();

  // Head
  ctx.fillStyle = withAlpha(0x3322aa, 1);
  ctx.beginPath(); ctx.arc(cx, cy - 35, 22, 0, Math.PI * 2); ctx.fill();
  // Helmet crest
  ctx.fillStyle = withAlpha(0x7755dd, 0.8);
  ctx.beginPath();
  ctx.moveTo(cx, cy - 62); ctx.lineTo(cx - 8, cy - 40); ctx.lineTo(cx + 8, cy - 40);
  ctx.closePath(); ctx.fill();

  // Glowing eye visor
  const visorGrad = ctx.createLinearGradient(cx - 18, cy - 38, cx + 18, cy - 32);
  visorGrad.addColorStop(0, withAlpha(0xff44aa, 0.9));
  visorGrad.addColorStop(0.5, withAlpha(0xff88cc, 0.8));
  visorGrad.addColorStop(1, withAlpha(0xff44aa, 0.9));
  ctx.fillStyle = visorGrad;
  ellipse(ctx, cx, cy - 36, 18, 5);
  radialGlow(ctx, cx, cy - 36, 25, 0xff44aa, 0.3);

  // Core crystal in chest
  ctx.fillStyle = withAlpha(0xff44aa, 0.7);
  star(ctx, cx, cy + 15, 6, 14, 7);
  radialGlow(ctx, cx, cy + 15, 20, 0xff44aa, 0.3);
  ctx.fillStyle = withAlpha(0xffffff, 0.4);
  star(ctx, cx, cy + 15, 6, 7, 3);

  // Fists
  ctx.fillStyle = withAlpha(0x5533bb, 0.9);
  ctx.beginPath(); ctx.arc(cx - 50, cy + 40, 12, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 50, cy + 40, 12, 0, Math.PI * 2); ctx.fill();

  save(c, 'creature_nebula_titan');
}

function drawIceShard() {
  const c = createCanvas(SIZE, SIZE), ctx = c.getContext('2d');
  const cx = SIZE / 2, cy = SIZE / 2;

  radialGlow(ctx, cx, cy, 100, 0x44eeff, 0.08);

  // Frost particles
  ctx.fillStyle = withAlpha(0xffffff, 0.4);
  [[-40, -45], [38, -38], [-45, 10], [42, 15], [-30, 50], [35, 55], [0, -60]].forEach(([ox, oy]) => {
    star(ctx, cx + ox, cy + oy, 4, 3, 1);
  });

  // Base ice platform
  ctx.fillStyle = withAlpha(0x115566, 0.7);
  ellipse(ctx, cx, cy + 45, 45, 14);

  // Side crystals
  ctx.fillStyle = withAlpha(0x22ccdd, 0.6);
  ctx.beginPath();
  ctx.moveTo(cx - 28, cy + 5); ctx.lineTo(cx - 48, cy - 20); ctx.lineTo(cx - 38, cy + 40);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 28, cy + 5); ctx.lineTo(cx + 48, cy - 20); ctx.lineTo(cx + 38, cy + 40);
  ctx.closePath(); ctx.fill();

  // Small side crystals
  ctx.fillStyle = withAlpha(0x66ddee, 0.5);
  ctx.beginPath();
  ctx.moveTo(cx - 38, cy + 20); ctx.lineTo(cx - 50, cy + 5); ctx.lineTo(cx - 42, cy + 40);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 38, cy + 20); ctx.lineTo(cx + 50, cy + 5); ctx.lineTo(cx + 42, cy + 40);
  ctx.closePath(); ctx.fill();

  // Main crystal body
  const crystGrad = ctx.createLinearGradient(cx - 15, cy - 65, cx + 15, cy + 20);
  crystGrad.addColorStop(0, withAlpha(0x88ffff, 0.7));
  crystGrad.addColorStop(0.3, withAlpha(0x44eeff, 0.6));
  crystGrad.addColorStop(0.7, withAlpha(0x22aacc, 0.7));
  crystGrad.addColorStop(1, withAlpha(0x116677, 0.8));
  ctx.fillStyle = crystGrad;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 65); ctx.lineTo(cx - 22, cy + 20); ctx.lineTo(cx + 22, cy + 20);
  ctx.closePath(); ctx.fill();

  // Crystal facet highlight
  ctx.fillStyle = withAlpha(0xffffff, 0.15);
  ctx.beginPath();
  ctx.moveTo(cx - 2, cy - 60); ctx.lineTo(cx - 14, cy + 10); ctx.lineTo(cx + 2, cy + 10);
  ctx.closePath(); ctx.fill();

  // Face
  ctx.fillStyle = withAlpha(0xffffff, 0.9);
  ellipse(ctx, cx - 7, cy - 15, 5, 4);
  ellipse(ctx, cx + 7, cy - 15, 5, 4);
  ctx.fillStyle = withAlpha(0x004455, 1);
  ctx.beginPath(); ctx.arc(cx - 7, cy - 15, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 7, cy - 15, 2, 0, Math.PI * 2); ctx.fill();

  // Crystal edge glow
  ctx.strokeStyle = withAlpha(0x88ffff, 0.4);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 65); ctx.lineTo(cx - 22, cy + 20); ctx.lineTo(cx + 22, cy + 20); ctx.closePath();
  ctx.stroke();

  save(c, 'creature_ice_shard');
}

function drawIcePrism() {
  const c = createCanvas(SIZE, SIZE), ctx = c.getContext('2d');
  const cx = SIZE / 2, cy = SIZE / 2;

  radialGlow(ctx, cx, cy, 100, 0x88ddff, 0.07);

  // Refraction beams
  ctx.lineWidth = 2.5;
  const beamColors = [0xff4488, 0xff8844, 0xffdd44, 0x44ff88, 0x4488ff, 0x8844ff];
  beamColors.forEach((col, i) => {
    ctx.strokeStyle = withAlpha(col, 0.35);
    const angle = (i / beamColors.length) * Math.PI * 0.8 + Math.PI * 0.6;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * 35, cy + Math.sin(angle) * 35);
    ctx.lineTo(cx + Math.cos(angle) * 90, cy + Math.sin(angle) * 90);
    ctx.stroke();
  });

  // Main hexagonal prism
  const r = 42;
  const hexGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, r);
  hexGrad.addColorStop(0, withAlpha(0xccffff, 0.5));
  hexGrad.addColorStop(0.5, withAlpha(0x88ddff, 0.4));
  hexGrad.addColorStop(1, withAlpha(0x4488aa, 0.6));
  ctx.fillStyle = hexGrad;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
    const px = cx + Math.cos(angle) * r, py = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath(); ctx.fill();

  // Inner facets
  ctx.fillStyle = withAlpha(0xaaeeff, 0.2);
  ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx - 18, cy); ctx.lineTo(cx + 18, cy); ctx.closePath(); ctx.fill();
  ctx.fillStyle = withAlpha(0xccffee, 0.15);
  ctx.beginPath(); ctx.moveTo(cx, cy + r); ctx.lineTo(cx - 18, cy); ctx.lineTo(cx + 18, cy); ctx.closePath(); ctx.fill();

  // Edge glow
  ctx.strokeStyle = withAlpha(0x88ddff, 0.6);
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
    const px = cx + Math.cos(angle) * r, py = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath(); ctx.stroke();

  // Central eye
  ctx.fillStyle = withAlpha(0xffffff, 0.95);
  ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = withAlpha(0x004466, 1);
  ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = withAlpha(0xffffff, 0.6);
  ctx.beginPath(); ctx.arc(cx - 2, cy - 3, 2, 0, Math.PI * 2); ctx.fill();

  save(c, 'creature_ice_prism');
}

function drawIceGolem() {
  const c = createCanvas(SIZE, SIZE), ctx = c.getContext('2d');
  const cx = SIZE / 2, cy = SIZE / 2 + 5;

  radialGlow(ctx, cx, cy, 100, 0x2299bb, 0.08);

  // Legs
  ctx.fillStyle = withAlpha(0x1a4455, 0.85);
  ctx.fillRect(cx - 22, cy + 30, 16, 30);
  ctx.fillRect(cx + 6, cy + 30, 16, 30);
  // Feet
  ctx.fillStyle = withAlpha(0x226677, 0.9);
  ctx.fillRect(cx - 25, cy + 55, 22, 10);
  ctx.fillRect(cx + 3, cy + 55, 22, 10);

  // Massive body
  ctx.fillStyle = withAlpha(0x1a4455, 0.9);
  ctx.beginPath();
  ctx.moveTo(cx - 35, cy + 35);
  ctx.lineTo(cx - 38, cy - 15);
  ctx.bezierCurveTo(cx - 30, cy - 30, cx + 30, cy - 30, cx + 38, cy - 15);
  ctx.lineTo(cx + 35, cy + 35);
  ctx.closePath();
  ctx.fill();

  // Body ice texture
  ctx.strokeStyle = withAlpha(0x88ffff, 0.15);
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx - 20, cy - 10); ctx.lineTo(cx - 28, cy + 25); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 15, cy - 5); ctx.lineTo(cx + 25, cy + 28); ctx.stroke();

  // Arms
  ctx.fillStyle = withAlpha(0x1a4455, 0.85);
  ctx.fillRect(cx - 55, cy - 15, 22, 50);
  ctx.fillRect(cx + 33, cy - 15, 22, 50);

  // Fists
  ctx.fillStyle = withAlpha(0x226677, 0.9);
  ctx.beginPath(); ctx.arc(cx - 44, cy + 38, 14, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 44, cy + 38, 14, 0, Math.PI * 2); ctx.fill();

  // Head
  ctx.fillStyle = withAlpha(0x226677, 0.9);
  ctx.fillRect(cx - 22, cy - 52, 44, 32);

  // Ice crystal crown
  ctx.fillStyle = withAlpha(0x88ffff, 0.7);
  ctx.beginPath(); ctx.moveTo(cx - 18, cy - 52); ctx.lineTo(cx - 12, cy - 72); ctx.lineTo(cx - 6, cy - 52); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx - 5, cy - 52); ctx.lineTo(cx, cy - 78); ctx.lineTo(cx + 5, cy - 52); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx + 6, cy - 52); ctx.lineTo(cx + 12, cy - 70); ctx.lineTo(cx + 18, cy - 52); ctx.closePath(); ctx.fill();

  // Eyes — glowing rectangles
  ctx.fillStyle = withAlpha(0x88ffff, 0.95);
  ctx.fillRect(cx - 15, cy - 44, 10, 6);
  ctx.fillRect(cx + 5, cy - 44, 10, 6);
  radialGlow(ctx, cx - 10, cy - 41, 12, 0x88ffff, 0.3);
  radialGlow(ctx, cx + 10, cy - 41, 12, 0x88ffff, 0.3);

  // Chest rune
  ctx.strokeStyle = withAlpha(0x88ffff, 0.6);
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy + 5, 14, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = withAlpha(0x88ffff, 0.35);
  ctx.beginPath(); ctx.arc(cx, cy + 5, 7, 0, Math.PI * 2); ctx.fill();
  radialGlow(ctx, cx, cy + 5, 20, 0x88ffff, 0.2);

  save(c, 'creature_ice_golem');
}

function drawFlameSprite() {
  const c = createCanvas(SIZE, SIZE), ctx = c.getContext('2d');
  const cx = SIZE / 2, cy = SIZE / 2;

  radialGlow(ctx, cx, cy, 100, 0xff6600, 0.1);
  radialGlow(ctx, cx, cy - 15, 60, 0xffaa00, 0.08);

  // Flame tips (top)
  ctx.fillStyle = withAlpha(0xff4400, 0.6);
  ctx.beginPath();
  ctx.moveTo(cx - 10, cy - 30); ctx.bezierCurveTo(cx - 18, cy - 55, cx - 8, cy - 65, cx - 5, cy - 70);
  ctx.bezierCurveTo(cx - 8, cy - 50, cx - 2, cy - 40, cx, cy - 30);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 3, cy - 35); ctx.bezierCurveTo(cx + 5, cy - 58, cx + 15, cy - 72, cx + 8, cy - 80);
  ctx.bezierCurveTo(cx + 15, cy - 55, cx + 10, cy - 42, cx + 5, cy - 32);
  ctx.fill();
  ctx.fillStyle = withAlpha(0xff6600, 0.5);
  ctx.beginPath();
  ctx.moveTo(cx - 18, cy - 20); ctx.bezierCurveTo(cx - 25, cy - 42, cx - 15, cy - 55, cx - 12, cy - 58);
  ctx.bezierCurveTo(cx - 18, cy - 40, cx - 12, cy - 28, cx - 8, cy - 18);
  ctx.fill();

  // Main flame body
  const flameGrad = ctx.createRadialGradient(cx, cy + 5, 8, cx, cy, 40);
  flameGrad.addColorStop(0, withAlpha(0xffffff, 0.7));
  flameGrad.addColorStop(0.2, withAlpha(0xffdd00, 0.7));
  flameGrad.addColorStop(0.5, withAlpha(0xff8800, 0.6));
  flameGrad.addColorStop(0.8, withAlpha(0xff4400, 0.5));
  flameGrad.addColorStop(1, withAlpha(0xcc2200, 0.3));
  ctx.fillStyle = flameGrad;
  ctx.beginPath();
  ctx.arc(cx, cy + 8, 32, 0, Math.PI * 2);
  ctx.fill();

  // Inner glow
  ctx.fillStyle = withAlpha(0xffdd44, 0.5);
  ctx.beginPath(); ctx.arc(cx, cy + 5, 18, 0, Math.PI * 2); ctx.fill();

  // Eyes — big expressive
  ctx.fillStyle = withAlpha(0xffffff, 0.95);
  ellipse(ctx, cx - 10, cy, 8, 7);
  ellipse(ctx, cx + 10, cy, 8, 7);
  ctx.fillStyle = withAlpha(0x440000, 1);
  ctx.beginPath(); ctx.arc(cx - 10, cy + 1, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 10, cy + 1, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = withAlpha(0xffffff, 0.7);
  ctx.beginPath(); ctx.arc(cx - 12, cy - 2, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 8, cy - 2, 1.5, 0, Math.PI * 2); ctx.fill();

  // Happy mouth
  ctx.strokeStyle = withAlpha(0x661100, 0.8);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy + 14, 8, 0.2, Math.PI - 0.2);
  ctx.stroke();

  // Ember particles
  ctx.fillStyle = withAlpha(0xffaa00, 0.6);
  [[-30, -25], [28, -20], [-25, 35], [30, 30], [-15, -50], [20, -48]].forEach(([ox, oy]) => {
    ctx.beginPath(); ctx.arc(cx + ox, cy + oy, 2.5, 0, Math.PI * 2); ctx.fill();
  });

  save(c, 'creature_flame_sprite');
}

function drawFlameDrake() {
  const c = createCanvas(SIZE, SIZE), ctx = c.getContext('2d');
  const cx = SIZE / 2, cy = SIZE / 2;

  radialGlow(ctx, cx, cy, 110, 0xff5522, 0.08);

  // Wings
  ctx.fillStyle = withAlpha(0xaa2200, 0.75);
  ctx.beginPath();
  ctx.moveTo(cx - 18, cy - 10);
  ctx.bezierCurveTo(cx - 40, cy - 30, cx - 70, cy - 55, cx - 65, cy - 15);
  ctx.bezierCurveTo(cx - 58, cy + 5, cx - 40, cy + 10, cx - 20, cy + 5);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 18, cy - 10);
  ctx.bezierCurveTo(cx + 40, cy - 30, cx + 70, cy - 55, cx + 65, cy - 15);
  ctx.bezierCurveTo(cx + 58, cy + 5, cx + 40, cy + 10, cx + 20, cy + 5);
  ctx.fill();

  // Wing membrane lines
  ctx.strokeStyle = withAlpha(0xff6600, 0.3);
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    const t = 0.2 + i * 0.2;
    ctx.beginPath();
    ctx.moveTo(cx - 20, cy - 5);
    ctx.lineTo(cx - 20 - t * 45, cy - 50 + t * 40);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 20, cy - 5);
    ctx.lineTo(cx + 20 + t * 45, cy - 50 + t * 40);
    ctx.stroke();
  }

  // Body
  const bodyGrad = ctx.createLinearGradient(cx, cy - 30, cx, cy + 40);
  bodyGrad.addColorStop(0, withAlpha(0xcc3300, 0.9));
  bodyGrad.addColorStop(1, withAlpha(0x882200, 0.8));
  ctx.fillStyle = bodyGrad;
  ellipse(ctx, cx, cy + 5, 22, 35);

  // Belly scales
  ctx.fillStyle = withAlpha(0xff8844, 0.3);
  for (let i = 0; i < 5; i++) {
    ellipse(ctx, cx, cy - 8 + i * 10, 12, 4);
  }

  // Head
  ctx.fillStyle = withAlpha(0xcc3300, 0.95);
  ctx.beginPath(); ctx.arc(cx, cy - 32, 18, 0, Math.PI * 2); ctx.fill();

  // Horns
  ctx.fillStyle = withAlpha(0x881100, 1);
  ctx.beginPath();
  ctx.moveTo(cx - 12, cy - 42); ctx.bezierCurveTo(cx - 18, cy - 55, cx - 22, cy - 65, cx - 16, cy - 68);
  ctx.bezierCurveTo(cx - 14, cy - 58, cx - 8, cy - 48, cx - 8, cy - 42);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 12, cy - 42); ctx.bezierCurveTo(cx + 18, cy - 55, cx + 22, cy - 65, cx + 16, cy - 68);
  ctx.bezierCurveTo(cx + 14, cy - 58, cx + 8, cy - 48, cx + 8, cy - 42);
  ctx.fill();

  // Eyes — fierce slitted
  ctx.fillStyle = withAlpha(0xffdd00, 0.95);
  ellipse(ctx, cx - 7, cy - 34, 6, 4);
  ellipse(ctx, cx + 7, cy - 34, 6, 4);
  ctx.fillStyle = withAlpha(0x220000, 1);
  ellipse(ctx, cx - 7, cy - 34, 2, 4);
  ellipse(ctx, cx + 7, cy - 34, 2, 4);

  // Snout / nostrils
  ctx.fillStyle = withAlpha(0xbb2200, 0.9);
  ctx.beginPath();
  ctx.moveTo(cx, cy - 20); ctx.lineTo(cx - 8, cy - 16); ctx.lineTo(cx + 8, cy - 16);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = withAlpha(0x220000, 0.6);
  ctx.beginPath(); ctx.arc(cx - 3, cy - 19, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 3, cy - 19, 1.5, 0, Math.PI * 2); ctx.fill();

  // Tail
  ctx.strokeStyle = withAlpha(0xcc3300, 0.8);
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(cx, cy + 35);
  ctx.bezierCurveTo(cx + 15, cy + 50, cx + 25, cy + 65, cx + 22, cy + 75);
  ctx.stroke();
  // Tail flame tip
  ctx.fillStyle = withAlpha(0xff6600, 0.8);
  ctx.beginPath();
  ctx.moveTo(cx + 22, cy + 72); ctx.lineTo(cx + 14, cy + 85); ctx.lineTo(cx + 30, cy + 80);
  ctx.closePath(); ctx.fill();

  save(c, 'creature_flame_drake');
}

function drawFlameColossus() {
  const c = createCanvas(SIZE, SIZE), ctx = c.getContext('2d');
  const cx = SIZE / 2, cy = SIZE / 2 + 5;

  radialGlow(ctx, cx, cy, 120, 0xdd2200, 0.1);
  radialGlow(ctx, cx, cy, 80, 0xff4400, 0.06);

  // Ground fire
  ctx.fillStyle = withAlpha(0xff4400, 0.25);
  ellipse(ctx, cx, cy + 65, 60, 12);
  ctx.fillStyle = withAlpha(0xff8800, 0.15);
  ellipse(ctx, cx, cy + 62, 40, 8);

  // Legs
  ctx.fillStyle = withAlpha(0x661100, 0.85);
  ctx.fillRect(cx - 25, cy + 30, 18, 30);
  ctx.fillRect(cx + 7, cy + 30, 18, 30);

  // Massive body
  ctx.fillStyle = withAlpha(0x661100, 0.9);
  ctx.beginPath();
  ctx.moveTo(cx - 40, cy + 35);
  ctx.lineTo(cx - 42, cy - 20);
  ctx.bezierCurveTo(cx - 35, cy - 35, cx + 35, cy - 35, cx + 42, cy - 20);
  ctx.lineTo(cx + 40, cy + 35);
  ctx.closePath();
  ctx.fill();

  // Lava cracks
  ctx.strokeStyle = withAlpha(0xff4400, 0.6);
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx - 22, cy - 10); ctx.bezierCurveTo(cx - 25, cy + 5, cx - 28, cy + 20, cx - 26, cy + 32); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 18, cy - 5); ctx.bezierCurveTo(cx + 22, cy + 10, cx + 24, cy + 25, ctx.lineWidth = 1.5, cx + 20, cy + 30); ctx.stroke();
  ctx.strokeStyle = withAlpha(0xffaa00, 0.4);
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx - 5, cy); ctx.lineTo(cx - 8, cy + 30); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 8, cy + 5); ctx.lineTo(cx + 5, cy + 32); ctx.stroke();

  // Arms
  ctx.fillStyle = withAlpha(0x661100, 0.85);
  ctx.fillRect(cx - 60, cy - 18, 22, 52);
  ctx.fillRect(cx + 38, cy - 18, 22, 52);

  // Fists
  ctx.fillStyle = withAlpha(0x882200, 0.95);
  ctx.beginPath(); ctx.arc(cx - 49, cy + 38, 16, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 49, cy + 38, 16, 0, Math.PI * 2); ctx.fill();

  // Head
  ctx.fillStyle = withAlpha(0x881100, 0.95);
  ctx.beginPath(); ctx.arc(cx, cy - 40, 26, 0, Math.PI * 2); ctx.fill();

  // Molten cracks in head
  ctx.strokeStyle = withAlpha(0xff6600, 0.7);
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(cx - 14, cy - 55); ctx.lineTo(cx - 10, cy - 28); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 10, cy - 53); ctx.lineTo(cx + 14, cy - 30); ctx.stroke();
  ctx.strokeStyle = withAlpha(0xffaa00, 0.5);
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx, cy - 58); ctx.lineTo(cx + 2, cy - 25); ctx.stroke();

  // Eyes — burning
  ctx.fillStyle = withAlpha(0xffaa00, 1);
  ellipse(ctx, cx - 12, cy - 42, 8, 5);
  ellipse(ctx, cx + 12, cy - 42, 8, 5);
  radialGlow(ctx, cx - 12, cy - 42, 12, 0xffaa00, 0.4);
  radialGlow(ctx, cx + 12, cy - 42, 12, 0xffaa00, 0.4);
  ctx.fillStyle = withAlpha(0xffffff, 0.5);
  ctx.beginPath(); ctx.arc(cx - 12, cy - 42, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 12, cy - 42, 2.5, 0, Math.PI * 2); ctx.fill();

  // Core
  ctx.fillStyle = withAlpha(0xff4400, 0.7);
  ctx.beginPath(); ctx.arc(cx, cy + 10, 16, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = withAlpha(0xffaa00, 0.5);
  ctx.beginPath(); ctx.arc(cx, cy + 10, 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = withAlpha(0xffffff, 0.3);
  ctx.beginPath(); ctx.arc(cx, cy + 10, 5, 0, Math.PI * 2); ctx.fill();
  radialGlow(ctx, cx, cy + 10, 25, 0xff4400, 0.3);

  save(c, 'creature_flame_colossus');
}

// ═══════════════════════════════════════════
// SHIPS
// ═══════════════════════════════════════════

function drawShip(name, drawFn) {
  const c = createCanvas(SIZE, SIZE), ctx = c.getContext('2d');
  drawFn(ctx, SIZE / 2, SIZE / 2);
  save(c, name);
}

function baseShipDraw(ctx, cx, cy) {
  radialGlow(ctx, cx, cy + 20, 30, 0xff6600, 0.3);
  // Engine flames
  ctx.fillStyle = withAlpha(0xff6600, 0.7);
  ctx.beginPath(); ctx.moveTo(cx - 8, cy + 42); ctx.bezierCurveTo(cx - 12, cy + 60, cx - 2, cy + 70, cx, cy + 65); ctx.bezierCurveTo(cx + 2, cy + 70, cx + 12, cy + 60, cx + 8, cy + 42); ctx.fill();
  ctx.fillStyle = withAlpha(0xffaa00, 0.5);
  ctx.beginPath(); ctx.moveTo(cx - 4, cy + 42); ctx.bezierCurveTo(cx - 6, cy + 55, cx, cy + 58, cx, cy + 55); ctx.bezierCurveTo(cx, cy + 58, cx + 6, cy + 55, cx + 4, cy + 42); ctx.fill();

  // Wings
  ctx.fillStyle = withAlpha(0x4400aa, 0.9);
  ctx.beginPath();
  ctx.moveTo(cx - 22, cy + 20); ctx.lineTo(cx - 55, cy + 45); ctx.lineTo(cx - 50, cy + 38); ctx.lineTo(cx - 15, cy + 8);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 22, cy + 20); ctx.lineTo(cx + 55, cy + 45); ctx.lineTo(cx + 50, cy + 38); ctx.lineTo(cx + 15, cy + 8);
  ctx.closePath(); ctx.fill();

  // Wing tip glow
  ctx.fillStyle = withAlpha(0xff1493, 0.8);
  ctx.beginPath(); ctx.arc(cx - 53, cy + 42, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 53, cy + 42, 3, 0, Math.PI * 2); ctx.fill();
  radialGlow(ctx, cx - 53, cy + 42, 8, 0xff1493, 0.4);
  radialGlow(ctx, cx + 53, cy + 42, 8, 0xff1493, 0.4);

  // Hull
  const hullGrad = ctx.createLinearGradient(cx - 20, cy, cx + 20, cy);
  hullGrad.addColorStop(0, withAlpha(0x2a2a4e, 1));
  hullGrad.addColorStop(0.5, withAlpha(0x3a3a6e, 1));
  hullGrad.addColorStop(1, withAlpha(0x2a2a4e, 1));
  ctx.fillStyle = hullGrad;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 52);
  ctx.bezierCurveTo(cx - 8, cy - 40, cx - 24, cy + 10, cx - 24, cy + 38);
  ctx.lineTo(cx + 24, cy + 38);
  ctx.bezierCurveTo(cx + 24, cy + 10, cx + 8, cy - 40, cx, cy - 52);
  ctx.fill();

  // Hull edge
  ctx.strokeStyle = withAlpha(0xff69b4, 0.3);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 52);
  ctx.bezierCurveTo(cx - 8, cy - 40, cx - 24, cy + 10, cx - 24, cy + 38);
  ctx.lineTo(cx + 24, cy + 38);
  ctx.bezierCurveTo(cx + 24, cy + 10, cx + 8, cy - 40, cx, cy - 52);
  ctx.stroke();

  // Cockpit
  const cockGrad = ctx.createLinearGradient(cx - 6, cy - 35, cx + 6, cy - 10);
  cockGrad.addColorStop(0, withAlpha(0x00ffff, 0.8));
  cockGrad.addColorStop(0.5, withAlpha(0x00aacc, 0.6));
  cockGrad.addColorStop(1, withAlpha(0x006688, 0.4));
  ctx.fillStyle = cockGrad;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 38); ctx.lineTo(cx - 7, cy - 5); ctx.lineTo(cx + 7, cy - 5);
  ctx.closePath(); ctx.fill();
  // Cockpit reflection
  ctx.fillStyle = withAlpha(0xffffff, 0.2);
  ctx.beginPath();
  ctx.moveTo(cx - 1, cy - 34); ctx.lineTo(cx - 4, cy - 12); ctx.lineTo(cx + 1, cy - 12);
  ctx.closePath(); ctx.fill();

  // Center line detail
  ctx.strokeStyle = withAlpha(0x00ffff, 0.15);
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx, cy - 45); ctx.lineTo(cx, cy + 35); ctx.stroke();
}

// ─── Generate all ───

console.log('Generating creatures...');
drawCommander();
drawJellyfish();
drawWisp();
drawTitan();
drawIceShard();
drawIcePrism();
drawIceGolem();
drawFlameSprite();
drawFlameDrake();
drawFlameColossus();

console.log('Generating ships...');
drawShip('ship_base', baseShipDraw);

// For other ships, create themed variants
function jellyShipDraw(ctx, cx, cy) {
  radialGlow(ctx, cx, cy, 70, 0xcc44ff, 0.12);
  // Organic dome
  const domeGrad = ctx.createRadialGradient(cx, cy - 12, 5, cx, cy, 45);
  domeGrad.addColorStop(0, withAlpha(0xcc44ff, 0.5));
  domeGrad.addColorStop(0.5, withAlpha(0x550066, 0.7));
  domeGrad.addColorStop(1, withAlpha(0x330044, 0.8));
  ctx.fillStyle = domeGrad;
  ellipse(ctx, cx, cy - 8, 48, 34);
  // Inner glow
  ctx.fillStyle = withAlpha(0xee66ff, 0.3);
  ellipse(ctx, cx, cy - 12, 30, 20);
  // Trailing tendrils
  const tentCols = [0xcc44ff, 0xff66ee, 0xaa22dd, 0xdd55ff];
  for (let i = 0; i < 5; i++) {
    const tx = cx - 20 + i * 10;
    ctx.strokeStyle = withAlpha(tentCols[i % tentCols.length], 0.5);
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(tx, cy + 22);
    for (let j = 0; j < 45; j += 3) ctx.lineTo(tx + Math.sin(j * 0.15 + i) * 5, cy + 22 + j);
    ctx.stroke();
  }
  // Glow core
  ctx.fillStyle = withAlpha(0xff88ff, 0.7);
  ctx.beginPath(); ctx.arc(cx, cy - 10, 10, 0, Math.PI * 2); ctx.fill();
  radialGlow(ctx, cx, cy - 10, 18, 0xff88ff, 0.3);
  // Edge
  ctx.strokeStyle = withAlpha(0xcc44ff, 0.4);
  ctx.lineWidth = 1.5;
  strokeEllipse(ctx, cx, cy - 8, 48, 34);
}

function wispShipDraw(ctx, cx, cy) {
  radialGlow(ctx, cx, cy, 60, 0xaa88ff, 0.1);
  // Ethereal hull
  ctx.fillStyle = withAlpha(0x220044, 0.7);
  ctx.beginPath();
  ctx.moveTo(cx, cy - 50); ctx.bezierCurveTo(cx - 10, cy - 35, cx - 28, cy + 15, cx - 22, cy + 30);
  ctx.lineTo(cx + 22, cy + 30); ctx.bezierCurveTo(cx + 28, cy + 15, cx + 10, cy - 35, cx, cy - 50);
  ctx.fill();
  // Energy wings
  ctx.strokeStyle = withAlpha(0xaa88ff, 0.5); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx - 22, cy + 5); ctx.bezierCurveTo(cx - 40, cy - 10, cx - 55, cy - 20, cx - 48, cy + 15); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 22, cy + 5); ctx.bezierCurveTo(cx + 40, cy - 10, cx + 55, cy - 20, cx + 48, cy + 15); ctx.stroke();
  // Core
  ctx.fillStyle = withAlpha(0xccaaff, 0.6); ctx.beginPath(); ctx.arc(cx, cy - 10, 10, 0, Math.PI * 2); ctx.fill();
  radialGlow(ctx, cx, cy - 10, 15, 0xccaaff, 0.3);
  ctx.fillStyle = withAlpha(0xffffff, 0.5);
  [[-20, -25], [22, -22], [0, -42]].forEach(([ox, oy]) => star(ctx, cx + ox, cy + oy, 4, 2.5, 1));
}

function titanShipDraw(ctx, cx, cy) {
  radialGlow(ctx, cx, cy, 50, 0xff44aa, 0.1);
  // Heavy battlecruiser
  ctx.fillStyle = withAlpha(0x3322aa, 0.9);
  ctx.fillRect(cx - 22, cy - 48, 44, 85);
  ctx.fillStyle = withAlpha(0x4433bb, 0.7);
  ctx.beginPath(); ctx.moveTo(cx, cy - 58); ctx.lineTo(cx - 22, cy - 48); ctx.lineTo(cx + 22, cy - 48); ctx.closePath(); ctx.fill();
  // Side armor
  ctx.fillStyle = withAlpha(0x5533cc, 0.8);
  ctx.fillRect(cx - 45, cy - 22, 25, 52); ctx.fillRect(cx + 20, cy - 22, 25, 52);
  // Cannons
  ctx.fillStyle = withAlpha(0x6644dd, 0.9);
  ctx.fillRect(cx - 52, cy - 28, 10, 22); ctx.fillRect(cx + 42, cy - 28, 10, 22);
  // Core
  ctx.fillStyle = withAlpha(0xff44aa, 0.6); ctx.beginPath(); ctx.arc(cx, cy, 12, 0, Math.PI * 2); ctx.fill();
  radialGlow(ctx, cx, cy, 18, 0xff44aa, 0.3);
  // Engine
  ctx.fillStyle = withAlpha(0xff44aa, 0.7); ctx.fillRect(cx - 10, cy + 37, 20, 14);
  ctx.strokeStyle = withAlpha(0xff44aa, 0.4); ctx.lineWidth = 1; ctx.strokeRect(cx - 22, cy - 48, 44, 85);
}

function iceShardShipDraw(ctx, cx, cy) {
  radialGlow(ctx, cx, cy, 55, 0x44eeff, 0.08);
  // Crystal dart hull
  const hGrad = ctx.createLinearGradient(cx - 18, cy, cx + 18, cy);
  hGrad.addColorStop(0, withAlpha(0x113344, 0.9)); hGrad.addColorStop(0.5, withAlpha(0x225566, 0.8)); hGrad.addColorStop(1, withAlpha(0x113344, 0.9));
  ctx.fillStyle = hGrad;
  ctx.beginPath(); ctx.moveTo(cx, cy - 58); ctx.lineTo(cx - 22, cy + 35); ctx.lineTo(cx + 22, cy + 35); ctx.closePath(); ctx.fill();
  // Inner glow
  ctx.fillStyle = withAlpha(0x44eeff, 0.2);
  ctx.beginPath(); ctx.moveTo(cx, cy - 48); ctx.lineTo(cx - 12, cy + 25); ctx.lineTo(cx + 12, cy + 25); ctx.closePath(); ctx.fill();
  // Crystal wings
  ctx.fillStyle = withAlpha(0x22ccdd, 0.65);
  ctx.beginPath(); ctx.moveTo(cx - 22, cy + 12); ctx.lineTo(cx - 50, cy + 38); ctx.lineTo(cx - 15, cy + 28); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx + 22, cy + 12); ctx.lineTo(cx + 50, cy + 38); ctx.lineTo(cx + 15, cy + 28); ctx.closePath(); ctx.fill();
  // Wing tips
  ctx.fillStyle = withAlpha(0x88ffff, 0.7);
  ctx.beginPath(); ctx.arc(cx - 48, cy + 37, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 48, cy + 37, 2.5, 0, Math.PI * 2); ctx.fill();
  // Engine
  ctx.fillStyle = withAlpha(0x44eeff, 0.5); ctx.fillRect(cx - 5, cy + 35, 4, 10); ctx.fillRect(cx + 1, cy + 35, 4, 10);
  ctx.strokeStyle = withAlpha(0x44eeff, 0.4); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx, cy - 58); ctx.lineTo(cx - 22, cy + 35); ctx.lineTo(cx + 22, cy + 35); ctx.closePath(); ctx.stroke();
}

function prismShipDraw(ctx, cx, cy) {
  radialGlow(ctx, cx, cy, 50, 0x88ddff, 0.08);
  const r = 35;
  // Hexagonal hull
  const hGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, r);
  hGrad.addColorStop(0, withAlpha(0x88ddff, 0.3)); hGrad.addColorStop(1, withAlpha(0x224455, 0.8));
  ctx.fillStyle = hGrad;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) { const a = (i/6)*Math.PI*2 - Math.PI/2; if(i===0) ctx.moveTo(cx+Math.cos(a)*r, cy+Math.sin(a)*r); else ctx.lineTo(cx+Math.cos(a)*r, cy+Math.sin(a)*r); }
  ctx.closePath(); ctx.fill();
  // Refraction beams
  ctx.lineWidth = 2;
  [0xff4488, 0x44ff88, 0x4488ff].forEach((col, i) => {
    ctx.strokeStyle = withAlpha(col, 0.45);
    ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx - 18 + i * 18, cy - r - 28); ctx.stroke();
  });
  // Core
  ctx.fillStyle = withAlpha(0xffffff, 0.7); ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = withAlpha(0x88ddff, 0.6); ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) { const a = (i/6)*Math.PI*2 - Math.PI/2; if(i===0) ctx.moveTo(cx+Math.cos(a)*r, cy+Math.sin(a)*r); else ctx.lineTo(cx+Math.cos(a)*r, cy+Math.sin(a)*r); }
  ctx.closePath(); ctx.stroke();
}

function golemShipDraw(ctx, cx, cy) {
  radialGlow(ctx, cx, cy, 50, 0x88ffff, 0.06);
  // Fortress hull
  ctx.fillStyle = withAlpha(0x1a4455, 0.9); ctx.fillRect(cx - 30, cy - 38, 60, 75);
  ctx.fillStyle = withAlpha(0x226677, 0.7);
  ctx.beginPath(); ctx.moveTo(cx, cy - 55); ctx.lineTo(cx - 30, cy - 38); ctx.lineTo(cx + 30, cy - 38); ctx.closePath(); ctx.fill();
  // Ice turrets
  ctx.fillStyle = withAlpha(0x226677, 0.85);
  ctx.fillRect(cx - 48, cy - 28, 20, 44); ctx.fillRect(cx + 28, cy - 28, 20, 44);
  ctx.fillStyle = withAlpha(0x88ffff, 0.6);
  ctx.beginPath(); ctx.moveTo(cx - 48, cy - 28); ctx.lineTo(cx - 38, cy - 44); ctx.lineTo(cx - 28, cy - 28); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx + 28, cy - 28); ctx.lineTo(cx + 38, cy - 44); ctx.lineTo(cx + 48, cy - 28); ctx.closePath(); ctx.fill();
  // Core
  ctx.fillStyle = withAlpha(0x88ffff, 0.5); ctx.beginPath(); ctx.arc(cx, cy - 5, 12, 0, Math.PI * 2); ctx.fill();
  radialGlow(ctx, cx, cy - 5, 18, 0x88ffff, 0.25);
  ctx.strokeStyle = withAlpha(0x88ffff, 0.35); ctx.lineWidth = 1; ctx.strokeRect(cx - 30, cy - 38, 60, 75);
  // Engine
  ctx.fillStyle = withAlpha(0x44ccdd, 0.6); ctx.fillRect(cx - 8, cy + 37, 16, 12);
}

function spriteShipDraw(ctx, cx, cy) {
  radialGlow(ctx, cx, cy, 55, 0xff8844, 0.1);
  // Sleek hull
  ctx.fillStyle = withAlpha(0x331100, 0.85);
  ctx.beginPath();
  ctx.moveTo(cx, cy - 55); ctx.bezierCurveTo(cx - 8, cy - 38, cx - 22, cy + 15, cx - 20, cy + 35);
  ctx.lineTo(cx + 20, cy + 35); ctx.bezierCurveTo(cx + 22, cy + 15, cx + 8, cy - 38, cx, cy - 55);
  ctx.fill();
  ctx.fillStyle = withAlpha(0xff6600, 0.3);
  ctx.beginPath();
  ctx.moveTo(cx, cy - 45); ctx.bezierCurveTo(cx - 5, cy - 30, cx - 14, cy + 8, cx - 12, cy + 25);
  ctx.lineTo(cx + 12, cy + 25); ctx.bezierCurveTo(cx + 14, cy + 8, cx + 5, cy - 30, cx, cy - 45);
  ctx.fill();
  // Flame wings
  ctx.fillStyle = withAlpha(0xcc3300, 0.75);
  ctx.beginPath(); ctx.moveTo(cx - 20, cy + 15); ctx.lineTo(cx - 50, cy + 40); ctx.lineTo(cx - 14, cy + 8); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx + 20, cy + 15); ctx.lineTo(cx + 50, cy + 40); ctx.lineTo(cx + 14, cy + 8); ctx.closePath(); ctx.fill();
  // Cockpit
  ctx.fillStyle = withAlpha(0xffdd00, 0.6); ctx.beginPath(); ctx.arc(cx, cy - 18, 7, 0, Math.PI * 2); ctx.fill();
  // Big engine flame
  ctx.fillStyle = withAlpha(0xff4400, 0.7);
  ctx.beginPath(); ctx.moveTo(cx - 10, cy + 35); ctx.bezierCurveTo(cx - 14, cy + 55, cx, cy + 65, cx, cy + 60);
  ctx.bezierCurveTo(cx, cy + 65, cx + 14, cy + 55, cx + 10, cy + 35); ctx.fill();
  ctx.fillStyle = withAlpha(0xffaa00, 0.5);
  ctx.beginPath(); ctx.moveTo(cx - 5, cy + 35); ctx.bezierCurveTo(cx - 7, cy + 48, cx, cy + 55, cx, cy + 52);
  ctx.bezierCurveTo(cx, cy + 55, cx + 7, cy + 48, cx + 5, cy + 35); ctx.fill();
}

function drakeShipDraw(ctx, cx, cy) {
  radialGlow(ctx, cx, cy, 60, 0xff5522, 0.08);
  // Dragon warship hull
  ctx.fillStyle = withAlpha(0x661100, 0.85);
  ctx.beginPath();
  ctx.moveTo(cx, cy - 55); ctx.bezierCurveTo(cx - 12, cy - 35, cx - 32, cy + 10, cx - 28, cy + 30);
  ctx.lineTo(cx + 28, cy + 30); ctx.bezierCurveTo(cx + 32, cy + 10, cx + 12, cy - 35, cx, cy - 55);
  ctx.fill();
  ctx.fillStyle = withAlpha(0x882200, 0.6);
  ctx.beginPath();
  ctx.moveTo(cx, cy - 45); ctx.bezierCurveTo(cx - 8, cy - 28, cx - 22, cy + 5, cx - 18, cy + 22);
  ctx.lineTo(cx + 18, cy + 22); ctx.bezierCurveTo(cx + 22, cy + 5, cx + 8, cy - 28, cx, cy - 45);
  ctx.fill();
  // Dragon wings
  ctx.fillStyle = withAlpha(0xaa2200, 0.8);
  ctx.beginPath(); ctx.moveTo(cx - 25, cy - 5); ctx.bezierCurveTo(cx - 45, cy - 25, cx - 65, cy - 45, cx - 58, cy - 10);
  ctx.bezierCurveTo(cx - 52, cy + 8, cx - 35, cy + 15, cx - 22, cy + 10); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx + 25, cy - 5); ctx.bezierCurveTo(cx + 45, cy - 25, cx + 65, cy - 45, cx + 58, cy - 10);
  ctx.bezierCurveTo(cx + 52, cy + 8, cx + 35, cy + 15, cx + 22, cy + 10); ctx.fill();
  // Horns at front
  ctx.fillStyle = withAlpha(0x881100, 0.9);
  ctx.beginPath(); ctx.moveTo(cx - 8, cy - 48); ctx.lineTo(cx - 15, cy - 68); ctx.lineTo(cx - 3, cy - 48); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx + 8, cy - 48); ctx.lineTo(cx + 15, cy - 68); ctx.lineTo(cx + 3, cy - 48); ctx.fill();
  // Eyes
  ctx.fillStyle = withAlpha(0xffdd00, 0.9);
  ellipse(ctx, cx - 8, cy - 38, 4, 3); ellipse(ctx, cx + 8, cy - 38, 4, 3);
  // Belly glow
  ctx.fillStyle = withAlpha(0xff8844, 0.3);
  for (let i = 0; i < 4; i++) ellipse(ctx, cx, cy - 10 + i * 10, 10, 4);
  // Engine
  ctx.fillStyle = withAlpha(0xff4400, 0.6);
  ctx.beginPath(); ctx.moveTo(cx - 8, cy + 30); ctx.bezierCurveTo(cx - 10, cy + 50, cx, cy + 55, cx, cy + 52);
  ctx.bezierCurveTo(cx, cy + 55, cx + 10, cy + 50, cx + 8, cy + 30); ctx.fill();
}

function colossusShipDraw(ctx, cx, cy) {
  radialGlow(ctx, cx, cy, 60, 0xff4400, 0.1);
  // Massive hull
  ctx.fillStyle = withAlpha(0x661100, 0.9);
  ctx.fillRect(cx - 35, cy - 40, 70, 80);
  ctx.fillStyle = withAlpha(0x882200, 0.7);
  ctx.beginPath(); ctx.moveTo(cx, cy - 55); ctx.lineTo(cx - 35, cy - 40); ctx.lineTo(cx + 35, cy - 40); ctx.closePath(); ctx.fill();
  // Armor side panels
  ctx.fillStyle = withAlpha(0x551100, 0.8);
  ctx.fillRect(cx - 52, cy - 30, 20, 55); ctx.fillRect(cx + 32, cy - 30, 20, 55);
  // Lava veins
  ctx.strokeStyle = withAlpha(0xff4400, 0.5); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx - 15, cy - 30); ctx.lineTo(cx - 20, cy + 20); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 12, cy - 25); ctx.lineTo(cx + 18, cy + 25); ctx.stroke();
  ctx.strokeStyle = withAlpha(0xffaa00, 0.3); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx, cy - 35); ctx.lineTo(cx + 3, cy + 15); ctx.stroke();
  // Core
  ctx.fillStyle = withAlpha(0xff4400, 0.6); ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = withAlpha(0xffaa00, 0.4); ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2); ctx.fill();
  radialGlow(ctx, cx, cy, 22, 0xff4400, 0.3);
  // Massive engine
  ctx.fillStyle = withAlpha(0xff4400, 0.6); ctx.fillRect(cx - 15, cy + 40, 30, 15);
  ctx.fillStyle = withAlpha(0xffaa00, 0.4); ctx.fillRect(cx - 10, cy + 40, 20, 10);
  ctx.strokeStyle = withAlpha(0xff4400, 0.3); ctx.lineWidth = 1; ctx.strokeRect(cx - 35, cy - 40, 70, 80);
}

drawShip('ship_nebula_jelly', jellyShipDraw);
drawShip('ship_nebula_wisp', wispShipDraw);
drawShip('ship_nebula_titan', titanShipDraw);
drawShip('ship_ice_shard', iceShardShipDraw);
drawShip('ship_ice_prism', prismShipDraw);
drawShip('ship_ice_golem', golemShipDraw);
drawShip('ship_flame_sprite', spriteShipDraw);
drawShip('ship_flame_drake', drakeShipDraw);
drawShip('ship_flame_colossus', colossusShipDraw);

console.log('Done! All art in public/art/');
