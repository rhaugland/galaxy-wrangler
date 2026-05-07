const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'public', 'art');
const SIZE = 280;

function save(canvas, name) {
  fs.writeFileSync(path.join(OUT, `${name}.png`), canvas.toBuffer('image/png'));
  console.log(`  wrote ${name}.png`);
}

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

function star(ctx, cx, cy, points, outerR, innerR) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
  }
  ctx.closePath(); ctx.fill();
}

function ellipse(ctx, cx, cy, rx, ry) {
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
}

function make(drawFn) {
  const c = createCanvas(SIZE, SIZE), ctx = c.getContext('2d');
  drawFn(ctx, SIZE / 2, SIZE / 2);
  return c;
}

// ═══ LAND CREATURES ═══

function drawRockBeetle(ctx, cx, cy) {
  radialGlow(ctx, cx, cy, 90, 0x88aa44, 0.08);
  // Shell
  const shellGrad = ctx.createRadialGradient(cx, cy - 10, 5, cx, cy, 50);
  shellGrad.addColorStop(0, withAlpha(0x996633, 0.9));
  shellGrad.addColorStop(0.5, withAlpha(0x664422, 0.85));
  shellGrad.addColorStop(1, withAlpha(0x443311, 0.8));
  ctx.fillStyle = shellGrad;
  ellipse(ctx, cx, cy - 5, 42, 35);
  // Shell line
  ctx.strokeStyle = withAlpha(0x332211, 0.5); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx, cy - 40); ctx.lineTo(cx, cy + 28); ctx.stroke();
  // Shell segments
  ctx.strokeStyle = withAlpha(0x553322, 0.3); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx - 38, cy - 5); ctx.lineTo(cx + 38, cy - 5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - 32, cy + 12); ctx.lineTo(cx + 32, cy + 12); ctx.stroke();
  // Moss patches
  ctx.fillStyle = withAlpha(0x66aa33, 0.4);
  ellipse(ctx, cx - 18, cy - 18, 10, 6);
  ellipse(ctx, cx + 14, cy + 5, 8, 5);
  ctx.fillStyle = withAlpha(0x88cc44, 0.3);
  ellipse(ctx, cx - 12, cy - 15, 5, 3);
  // Head
  ctx.fillStyle = withAlpha(0x554422, 0.95);
  ellipse(ctx, cx, cy - 38, 18, 14);
  // Mandibles
  ctx.fillStyle = withAlpha(0x443311, 1);
  ctx.beginPath(); ctx.moveTo(cx - 12, cy - 40); ctx.bezierCurveTo(cx - 22, cy - 50, cx - 26, cy - 42, cx - 18, cy - 36); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx + 12, cy - 40); ctx.bezierCurveTo(cx + 22, cy - 50, cx + 26, cy - 42, cx + 18, cy - 36); ctx.fill();
  // Antennae
  ctx.strokeStyle = withAlpha(0x665533, 0.7); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx - 8, cy - 48); ctx.bezierCurveTo(cx - 15, cy - 60, cx - 18, cy - 70, cx - 12, cy - 72); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 8, cy - 48); ctx.bezierCurveTo(cx + 15, cy - 60, cx + 18, cy - 70, cx + 12, cy - 72); ctx.stroke();
  // Eyes
  ctx.fillStyle = withAlpha(0xddaa44, 0.95);
  ctx.beginPath(); ctx.arc(cx - 7, cy - 40, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 7, cy - 40, 4, 0, Math.PI * 2); ctx.fill();
  radialGlow(ctx, cx - 7, cy - 40, 8, 0xddaa44, 0.3);
  radialGlow(ctx, cx + 7, cy - 40, 8, 0xddaa44, 0.3);
  ctx.fillStyle = withAlpha(0x221100, 1);
  ctx.beginPath(); ctx.arc(cx - 7, cy - 40, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 7, cy - 40, 2, 0, Math.PI * 2); ctx.fill();
  // Legs
  ctx.strokeStyle = withAlpha(0x554422, 0.8); ctx.lineWidth = 3;
  [[-30, -10, -48, 5], [-35, 5, -52, 20], [-32, 18, -46, 38],
   [30, -10, 48, 5], [35, 5, 52, 20], [32, 18, 46, 38]].forEach(([x1,y1,x2,y2]) => {
    ctx.beginPath(); ctx.moveTo(cx+x1, cy+y1); ctx.lineTo(cx+x2, cy+y2); ctx.stroke();
  });
  // Amber crystal on shell
  ctx.fillStyle = withAlpha(0xddaa44, 0.6);
  star(ctx, cx + 2, cy - 5, 6, 8, 4);
  radialGlow(ctx, cx + 2, cy - 5, 12, 0xddaa44, 0.2);
}

function drawStoneWyrm(ctx, cx, cy) {
  radialGlow(ctx, cx, cy, 100, 0x66884a, 0.07);
  // Segmented body — serpentine S-curve
  const segments = [
    { x: cx - 30, y: cy + 55, r: 16 },
    { x: cx - 35, y: cy + 35, r: 17 },
    { x: cx - 28, y: cy + 15, r: 18 },
    { x: cx - 15, y: cy - 2, r: 19 },
    { x: cx, y: cy - 18, r: 20 },
    { x: cx + 12, y: cy - 32, r: 19 },
    { x: cx + 18, y: cy - 48, r: 17 },
  ];
  // Body segments
  segments.forEach((seg, i) => {
    const shade = 0.7 + (i % 2) * 0.15;
    ctx.fillStyle = withAlpha(0x665533, shade);
    ctx.beginPath(); ctx.arc(seg.x, seg.y, seg.r, 0, Math.PI * 2); ctx.fill();
    // Stone texture
    ctx.strokeStyle = withAlpha(0x554422, 0.3); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(seg.x, seg.y, seg.r * 0.7, 0.3, 1.8); ctx.stroke();
  });
  // Moss on segments
  ctx.fillStyle = withAlpha(0x66aa33, 0.35);
  ellipse(ctx, cx - 32, cy + 30, 8, 4);
  ellipse(ctx, cx - 10, cy - 5, 10, 5);
  ellipse(ctx, cx + 16, cy - 40, 7, 4);
  // Spines along back
  ctx.fillStyle = withAlpha(0x887744, 0.8);
  [[-34, 40, -40, 28], [-30, 20, -38, 8], [-18, 2, -28, -10], [-2, -15, -10, -28], [10, -30, 4, -44], [17, -45, 12, -58]].forEach(([x1,y1,x2,y2]) => {
    ctx.beginPath();
    ctx.moveTo(cx + (x1-cx+cx), cy + (y1-cy+cy) - cy + y1);
    // Simpler spine drawing
    ctx.fillStyle = withAlpha(0x887744, 0.7);
    ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x1 + 4, y1); ctx.fill();
  });
  // Actually draw spines properly
  ctx.fillStyle = withAlpha(0x887744, 0.8);
  [[cx-34, cy+40, cx-40, cy+30], [cx-30, cy+18, cx-38, cy+8], [cx-18, cy, cx-28, cy-10],
   [cx, cy-18, cx-8, cy-30], [cx+12, cy-32, cx+5, cy-44]].forEach(([x1,y1,x2,y2]) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x1+5, y1-2); ctx.closePath(); ctx.fill();
  });
  // Head
  ctx.fillStyle = withAlpha(0x776644, 0.95);
  ctx.beginPath(); ctx.arc(cx + 18, cy - 52, 15, 0, Math.PI * 2); ctx.fill();
  // Amber markings
  ctx.strokeStyle = withAlpha(0xddaa44, 0.4); ctx.lineWidth = 1.5;
  segments.forEach(seg => {
    ctx.beginPath(); ctx.arc(seg.x, seg.y, seg.r * 0.5, 0, Math.PI * 0.8); ctx.stroke();
  });
  // Eyes
  ctx.fillStyle = withAlpha(0xddaa44, 0.95);
  ctx.beginPath(); ctx.arc(cx + 13, cy - 55, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 23, cy - 55, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = withAlpha(0x221100, 1);
  ctx.beginPath(); ctx.arc(cx + 13, cy - 55, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 23, cy - 55, 2, 0, Math.PI * 2); ctx.fill();
  // Mouth
  ctx.strokeStyle = withAlpha(0x443322, 0.8); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx + 18, cy - 46, 6, 0.3, Math.PI - 0.3); ctx.stroke();
}

function drawTerraColossus(ctx, cx, cy) {
  radialGlow(ctx, cx, cy, 110, 0x448833, 0.08);
  // Ground
  ctx.fillStyle = withAlpha(0x443322, 0.3);
  ellipse(ctx, cx, cy + 68, 60, 10);
  // Legs
  ctx.fillStyle = withAlpha(0x443322, 0.9);
  ctx.fillRect(cx - 25, cy + 30, 18, 35);
  ctx.fillRect(cx + 7, cy + 30, 18, 35);
  // Feet
  ctx.fillStyle = withAlpha(0x554433, 0.9);
  ctx.fillRect(cx - 28, cy + 60, 24, 10);
  ctx.fillRect(cx + 4, cy + 60, 24, 10);
  // Body
  ctx.fillStyle = withAlpha(0x554433, 0.9);
  ctx.beginPath();
  ctx.moveTo(cx - 40, cy + 35); ctx.lineTo(cx - 42, cy - 18);
  ctx.bezierCurveTo(cx - 35, cy - 35, cx + 35, cy - 35, cx + 42, cy - 18);
  ctx.lineTo(cx + 40, cy + 35); ctx.closePath(); ctx.fill();
  // Root patterns on body
  ctx.strokeStyle = withAlpha(0x66aa33, 0.4); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx - 25, cy - 15); ctx.bezierCurveTo(cx - 30, cy + 5, cx - 28, cy + 20, cx - 35, cy + 30); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 20, cy - 10); ctx.bezierCurveTo(cx + 25, cy + 10, cx + 22, cy + 22, cx + 32, cy + 32); ctx.stroke();
  ctx.strokeStyle = withAlpha(0x88cc44, 0.3); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx - 8, cy - 20); ctx.bezierCurveTo(cx - 12, cy + 5, cx - 10, cy + 20, cx - 5, cy + 30); ctx.stroke();
  // Arms
  ctx.fillStyle = withAlpha(0x554433, 0.85);
  ctx.fillRect(cx - 60, cy - 15, 22, 50);
  ctx.fillRect(cx + 38, cy - 15, 22, 50);
  // Fists
  ctx.fillStyle = withAlpha(0x665544, 0.9);
  ctx.beginPath(); ctx.arc(cx - 49, cy + 38, 15, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 49, cy + 38, 15, 0, Math.PI * 2); ctx.fill();
  // Shoulder trees/moss
  ctx.fillStyle = withAlpha(0x448833, 0.7);
  ellipse(ctx, cx - 45, cy - 22, 14, 10);
  ellipse(ctx, cx + 45, cy - 22, 14, 10);
  ctx.fillStyle = withAlpha(0x55aa44, 0.5);
  ellipse(ctx, cx - 45, cy - 26, 10, 6);
  ellipse(ctx, cx + 45, cy - 26, 10, 6);
  // Tree trunks on shoulders
  ctx.fillStyle = withAlpha(0x443322, 0.7);
  ctx.fillRect(cx - 47, cy - 18, 4, 12);
  ctx.fillRect(cx + 43, cy - 18, 4, 12);
  // Head
  ctx.fillStyle = withAlpha(0x665544, 0.95);
  ctx.beginPath(); ctx.arc(cx, cy - 38, 24, 0, Math.PI * 2); ctx.fill();
  // Moss on head
  ctx.fillStyle = withAlpha(0x448833, 0.5);
  ellipse(ctx, cx, cy - 55, 18, 8);
  // Eyes
  ctx.fillStyle = withAlpha(0x44dd66, 0.95);
  ellipse(ctx, cx - 10, cy - 40, 7, 5);
  ellipse(ctx, cx + 10, cy - 40, 7, 5);
  radialGlow(ctx, cx - 10, cy - 40, 10, 0x44dd66, 0.3);
  radialGlow(ctx, cx + 10, cy - 40, 10, 0x44dd66, 0.3);
  ctx.fillStyle = withAlpha(0x113311, 1);
  ctx.beginPath(); ctx.arc(cx - 10, cy - 40, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 10, cy - 40, 2.5, 0, Math.PI * 2); ctx.fill();
  // Crystal core in chest
  ctx.fillStyle = withAlpha(0x44dd66, 0.7);
  star(ctx, cx, cy + 8, 6, 14, 7);
  radialGlow(ctx, cx, cy + 8, 20, 0x44dd66, 0.3);
  ctx.fillStyle = withAlpha(0xffffff, 0.3);
  star(ctx, cx, cy + 8, 6, 6, 3);
}

// ═══ ELECTRIC CREATURES ═══

function drawSparkMote(ctx, cx, cy) {
  // Outer glow
  radialGlow(ctx, cx, cy, 100, 0x44aaff, 0.12);
  radialGlow(ctx, cx, cy, 60, 0xffee44, 0.08);
  // Lightning arcs radiating outward
  ctx.strokeStyle = withAlpha(0x44aaff, 0.5); ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    let px = cx, py = cy;
    for (let j = 0; j < 4; j++) {
      const dist = 25 + j * 18;
      const jitter = (Math.random() - 0.5) * 15;
      const nx = cx + Math.cos(angle + jitter * 0.02) * dist + jitter;
      const ny = cy + Math.sin(angle + jitter * 0.02) * dist + jitter;
      ctx.lineTo(nx, ny);
      px = nx; py = ny;
    }
    ctx.stroke();
  }
  // Core sphere
  const coreGrad = ctx.createRadialGradient(cx, cy, 3, cx, cy, 30);
  coreGrad.addColorStop(0, withAlpha(0xffffff, 0.95));
  coreGrad.addColorStop(0.3, withAlpha(0xffee44, 0.8));
  coreGrad.addColorStop(0.6, withAlpha(0x44aaff, 0.5));
  coreGrad.addColorStop(1, withAlpha(0x2244aa, 0.2));
  ctx.fillStyle = coreGrad;
  ctx.beginPath(); ctx.arc(cx, cy, 30, 0, Math.PI * 2); ctx.fill();
  // Inner core
  ctx.fillStyle = withAlpha(0xffffff, 0.7);
  ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI * 2); ctx.fill();
  // Eyes (in the energy)
  ctx.fillStyle = withAlpha(0x001144, 0.9);
  ctx.beginPath(); ctx.arc(cx - 7, cy - 2, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 7, cy - 2, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = withAlpha(0xffffff, 0.8);
  ctx.beginPath(); ctx.arc(cx - 8, cy - 4, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 6, cy - 4, 1.5, 0, Math.PI * 2); ctx.fill();
  // Smile
  ctx.strokeStyle = withAlpha(0x001144, 0.6); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, cy + 6, 5, 0.3, Math.PI - 0.3); ctx.stroke();
}

function drawVoltSerpent(ctx, cx, cy) {
  radialGlow(ctx, cx, cy, 100, 0x6644ff, 0.08);
  // Sinuous energy body
  const bodyPoints = [
    { x: cx - 30, y: cy + 60 }, { x: cx - 35, y: cy + 40 }, { x: cx - 25, y: cy + 20 },
    { x: cx - 10, y: cy + 5 }, { x: cx + 5, y: cy - 10 }, { x: cx + 18, y: cy - 25 },
    { x: cx + 25, y: cy - 42 }, { x: cx + 20, y: cy - 55 },
  ];
  // Body glow trail
  bodyPoints.forEach((pt, i) => {
    const sz = 14 - i * 0.8;
    radialGlow(ctx, pt.x, pt.y, sz + 5, 0x6644ff, 0.15);
  });
  // Body segments with electric gradient
  bodyPoints.forEach((pt, i) => {
    const sz = 14 - i * 0.8;
    const bodyGrad = ctx.createRadialGradient(pt.x, pt.y, 2, pt.x, pt.y, sz);
    bodyGrad.addColorStop(0, withAlpha(0xddaaff, 0.8));
    bodyGrad.addColorStop(0.5, withAlpha(0x6644ff, 0.6));
    bodyGrad.addColorStop(1, withAlpha(0x4422cc, 0.4));
    ctx.fillStyle = bodyGrad;
    ctx.beginPath(); ctx.arc(pt.x, pt.y, sz, 0, Math.PI * 2); ctx.fill();
  });
  // Lightning bolt patterns along body
  ctx.strokeStyle = withAlpha(0xffee44, 0.5); ctx.lineWidth = 1.5;
  for (let i = 0; i < bodyPoints.length - 1; i++) {
    const a = bodyPoints[i], b = bodyPoints[i + 1];
    const mx = (a.x + b.x) / 2 + (Math.random() - 0.5) * 8;
    const my = (a.y + b.y) / 2 + (Math.random() - 0.5) * 8;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mx, my); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  // Crackling arcs around body
  ctx.strokeStyle = withAlpha(0x44aaff, 0.3); ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const pt = bodyPoints[i * 1.5 | 0];
    if (!pt) continue;
    const angle = Math.random() * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
    ctx.lineTo(pt.x + Math.cos(angle) * 20, pt.y + Math.sin(angle) * 20);
    ctx.lineTo(pt.x + Math.cos(angle + 0.3) * 30, pt.y + Math.sin(angle + 0.3) * 30);
    ctx.stroke();
  }
  // Head
  ctx.fillStyle = withAlpha(0x8855ff, 0.9);
  ctx.beginPath(); ctx.arc(cx + 20, cy - 55, 13, 0, Math.PI * 2); ctx.fill();
  // Crown/horns
  ctx.fillStyle = withAlpha(0xffee44, 0.7);
  ctx.beginPath(); ctx.moveTo(cx + 14, cy - 62); ctx.lineTo(cx + 10, cy - 78); ctx.lineTo(cx + 18, cy - 62); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx + 22, cy - 64); ctx.lineTo(cx + 24, cy - 80); ctx.lineTo(cx + 28, cy - 64); ctx.fill();
  // Eyes — bright yellow
  ctx.fillStyle = withAlpha(0xffee44, 0.95);
  ctx.beginPath(); ctx.arc(cx + 15, cy - 57, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 25, cy - 57, 4, 0, Math.PI * 2); ctx.fill();
  radialGlow(ctx, cx + 15, cy - 57, 8, 0xffee44, 0.4);
  radialGlow(ctx, cx + 25, cy - 57, 8, 0xffee44, 0.4);
  ctx.fillStyle = withAlpha(0x110022, 1);
  ellipse(ctx, cx + 15, cy - 57, 2, 3.5);
  ellipse(ctx, cx + 25, cy - 57, 2, 3.5);
  // Tail spark
  ctx.fillStyle = withAlpha(0xffee44, 0.6);
  star(ctx, cx - 30, cy + 62, 4, 6, 2.5);
}

function drawStormTitan(ctx, cx, cy) {
  radialGlow(ctx, cx, cy, 110, 0x4422aa, 0.1);
  radialGlow(ctx, cx, cy, 70, 0x44aaff, 0.06);
  // Storm cloud base (lower body)
  ctx.fillStyle = withAlpha(0x221144, 0.6);
  ellipse(ctx, cx, cy + 45, 50, 25);
  ctx.fillStyle = withAlpha(0x331166, 0.4);
  ellipse(ctx, cx - 15, cy + 50, 30, 15);
  ellipse(ctx, cx + 20, cy + 48, 25, 14);
  // Lightning from cloud base
  ctx.strokeStyle = withAlpha(0xffee44, 0.4); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx - 15, cy + 60); ctx.lineTo(cx - 20, cy + 75); ctx.lineTo(cx - 12, cy + 72); ctx.lineTo(cx - 18, cy + 88); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 10, cy + 58); ctx.lineTo(cx + 15, cy + 72); ctx.lineTo(cx + 8, cy + 70); ctx.lineTo(cx + 14, cy + 85); ctx.stroke();
  // Upper body — storm clouds
  const bodyGrad = ctx.createLinearGradient(cx, cy - 40, cx, cy + 30);
  bodyGrad.addColorStop(0, withAlpha(0x4422aa, 0.9));
  bodyGrad.addColorStop(0.5, withAlpha(0x331188, 0.8));
  bodyGrad.addColorStop(1, withAlpha(0x221155, 0.6));
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.moveTo(cx - 38, cy + 35); ctx.lineTo(cx - 40, cy - 15);
  ctx.bezierCurveTo(cx - 32, cy - 35, cx + 32, cy - 35, cx + 40, cy - 15);
  ctx.lineTo(cx + 38, cy + 35); ctx.closePath(); ctx.fill();
  // Lightning coursing through body
  ctx.strokeStyle = withAlpha(0x44aaff, 0.5); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx - 20, cy - 10); ctx.lineTo(cx - 15, cy + 5); ctx.lineTo(cx - 22, cy + 8); ctx.lineTo(cx - 18, cy + 22); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 15, cy - 5); ctx.lineTo(cx + 20, cy + 8); ctx.lineTo(cx + 14, cy + 12); ctx.lineTo(cx + 20, cy + 25); ctx.stroke();
  // Arms
  ctx.fillStyle = withAlpha(0x4422aa, 0.8);
  ctx.fillRect(cx - 58, cy - 15, 22, 48);
  ctx.fillRect(cx + 36, cy - 15, 22, 48);
  // Crackling fists
  ctx.fillStyle = withAlpha(0x44aaff, 0.7);
  ctx.beginPath(); ctx.arc(cx - 47, cy + 36, 14, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 47, cy + 36, 14, 0, Math.PI * 2); ctx.fill();
  radialGlow(ctx, cx - 47, cy + 36, 20, 0x44aaff, 0.3);
  radialGlow(ctx, cx + 47, cy + 36, 20, 0x44aaff, 0.3);
  // Head
  ctx.fillStyle = withAlpha(0x3322aa, 0.95);
  ctx.beginPath(); ctx.arc(cx, cy - 38, 24, 0, Math.PI * 2); ctx.fill();
  // Crown lightning
  ctx.fillStyle = withAlpha(0xffee44, 0.7);
  ctx.beginPath(); ctx.moveTo(cx - 12, cy - 56); ctx.lineTo(cx - 8, cy - 72); ctx.lineTo(cx - 4, cy - 60); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx - 2, cy - 58); ctx.lineTo(cx + 2, cy - 78); ctx.lineTo(cx + 6, cy - 58); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx + 8, cy - 56); ctx.lineTo(cx + 12, cy - 70); ctx.lineTo(cx + 16, cy - 56); ctx.fill();
  // Visor — glowing yellow
  const visorGrad = ctx.createLinearGradient(cx - 18, cy - 40, cx + 18, cy - 36);
  visorGrad.addColorStop(0, withAlpha(0xffee44, 0.9));
  visorGrad.addColorStop(0.5, withAlpha(0xffffff, 0.8));
  visorGrad.addColorStop(1, withAlpha(0xffee44, 0.9));
  ctx.fillStyle = visorGrad;
  ellipse(ctx, cx, cy - 40, 18, 5);
  radialGlow(ctx, cx, cy - 40, 25, 0xffee44, 0.3);
  // Core
  ctx.fillStyle = withAlpha(0xffee44, 0.5);
  star(ctx, cx, cy + 8, 6, 12, 6);
  radialGlow(ctx, cx, cy + 8, 18, 0xffee44, 0.25);
}

// ═══ SHIPS ═══

function drawLandBeetleShip(ctx, cx, cy) {
  radialGlow(ctx, cx, cy + 20, 25, 0xddaa44, 0.2);
  // Shell-shaped hull
  const hGrad = ctx.createLinearGradient(cx - 25, cy, cx + 25, cy);
  hGrad.addColorStop(0, withAlpha(0x554422, 0.9));
  hGrad.addColorStop(0.5, withAlpha(0x776644, 0.85));
  hGrad.addColorStop(1, withAlpha(0x554422, 0.9));
  ctx.fillStyle = hGrad;
  ellipse(ctx, cx, cy, 32, 42);
  // Wings
  ctx.fillStyle = withAlpha(0x665533, 0.8);
  ctx.beginPath(); ctx.moveTo(cx - 28, cy + 10); ctx.lineTo(cx - 55, cy + 35); ctx.lineTo(cx - 20, cy + 25); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx + 28, cy + 10); ctx.lineTo(cx + 55, cy + 35); ctx.lineTo(cx + 20, cy + 25); ctx.closePath(); ctx.fill();
  // Amber wing tips
  ctx.fillStyle = withAlpha(0xddaa44, 0.7);
  ctx.beginPath(); ctx.arc(cx - 53, cy + 34, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 53, cy + 34, 3, 0, Math.PI * 2); ctx.fill();
  // Cockpit
  ctx.fillStyle = withAlpha(0xddaa44, 0.5);
  ctx.beginPath(); ctx.moveTo(cx, cy - 32); ctx.lineTo(cx - 6, cy - 5); ctx.lineTo(cx + 6, cy - 5); ctx.closePath(); ctx.fill();
  // Engine
  ctx.fillStyle = withAlpha(0x88aa44, 0.5); ctx.fillRect(cx - 6, cy + 38, 12, 10);
  // Center line
  ctx.strokeStyle = withAlpha(0x443322, 0.4); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx, cy - 38); ctx.lineTo(cx, cy + 35); ctx.stroke();
  // Moss patches
  ctx.fillStyle = withAlpha(0x66aa33, 0.3);
  ellipse(ctx, cx - 12, cy - 8, 6, 4);
  ellipse(ctx, cx + 10, cy + 8, 5, 3);
}

function drawLandWyrmShip(ctx, cx, cy) {
  radialGlow(ctx, cx, cy, 50, 0x66884a, 0.08);
  // Segmented hull
  ctx.fillStyle = withAlpha(0x665533, 0.85);
  ctx.beginPath();
  ctx.moveTo(cx, cy - 55); ctx.bezierCurveTo(cx - 12, cy - 35, cx - 25, cy + 15, cx - 22, cy + 38);
  ctx.lineTo(cx + 22, cy + 38); ctx.bezierCurveTo(cx + 25, cy + 15, cx + 12, cy - 35, cx, cy - 55);
  ctx.fill();
  // Segment lines
  ctx.strokeStyle = withAlpha(0x554422, 0.4); ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    const y = cy - 30 + i * 12;
    ctx.beginPath(); ctx.moveTo(cx - 20, y); ctx.lineTo(cx + 20, y); ctx.stroke();
  }
  // Stone wings
  ctx.fillStyle = withAlpha(0x776644, 0.7);
  ctx.beginPath(); ctx.moveTo(cx - 22, cy + 8); ctx.lineTo(cx - 48, cy + 30); ctx.lineTo(cx - 15, cy + 20); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx + 22, cy + 8); ctx.lineTo(cx + 48, cy + 30); ctx.lineTo(cx + 15, cy + 20); ctx.closePath(); ctx.fill();
  // Amber cockpit
  ctx.fillStyle = withAlpha(0xddaa44, 0.5);
  ctx.beginPath(); ctx.moveTo(cx, cy - 42); ctx.lineTo(cx - 5, cy - 15); ctx.lineTo(cx + 5, cy - 15); ctx.closePath(); ctx.fill();
  // Engine
  ctx.fillStyle = withAlpha(0x88aa44, 0.5); ctx.fillRect(cx - 5, cy + 38, 4, 8); ctx.fillRect(cx + 1, cy + 38, 4, 8);
}

function drawLandColossusShip(ctx, cx, cy) {
  radialGlow(ctx, cx, cy, 55, 0x44dd66, 0.08);
  // Massive fortress hull
  ctx.fillStyle = withAlpha(0x554433, 0.9);
  ctx.fillRect(cx - 32, cy - 40, 64, 80);
  ctx.fillStyle = withAlpha(0x665544, 0.7);
  ctx.beginPath(); ctx.moveTo(cx, cy - 55); ctx.lineTo(cx - 32, cy - 40); ctx.lineTo(cx + 32, cy - 40); ctx.closePath(); ctx.fill();
  // Side root structures
  ctx.fillStyle = withAlpha(0x448833, 0.6);
  ctx.fillRect(cx - 50, cy - 25, 20, 45); ctx.fillRect(cx + 30, cy - 25, 20, 45);
  // Root tendrils
  ctx.strokeStyle = withAlpha(0x66aa33, 0.4); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx - 50, cy - 20); ctx.bezierCurveTo(cx - 58, cy - 10, cx - 55, cy + 5, cx - 48, cy + 15); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 50, cy - 20); ctx.bezierCurveTo(cx + 58, cy - 10, cx + 55, cy + 5, cx + 48, cy + 15); ctx.stroke();
  // Crystal core
  ctx.fillStyle = withAlpha(0x44dd66, 0.6); ctx.beginPath(); ctx.arc(cx, cy, 12, 0, Math.PI * 2); ctx.fill();
  radialGlow(ctx, cx, cy, 18, 0x44dd66, 0.3);
  // Engine
  ctx.fillStyle = withAlpha(0x44dd66, 0.5); ctx.fillRect(cx - 12, cy + 40, 24, 12);
  ctx.strokeStyle = withAlpha(0x665544, 0.4); ctx.lineWidth = 1; ctx.strokeRect(cx - 32, cy - 40, 64, 80);
}

function drawElectricMoteShip(ctx, cx, cy) {
  radialGlow(ctx, cx, cy, 55, 0x44aaff, 0.12);
  // Energy hull
  const hGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 35);
  hGrad.addColorStop(0, withAlpha(0xffee44, 0.5));
  hGrad.addColorStop(0.5, withAlpha(0x44aaff, 0.4));
  hGrad.addColorStop(1, withAlpha(0x2244aa, 0.6));
  ctx.fillStyle = hGrad;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 48); ctx.bezierCurveTo(cx - 10, cy - 30, cx - 22, cy + 10, cx - 18, cy + 32);
  ctx.lineTo(cx + 18, cy + 32); ctx.bezierCurveTo(cx + 22, cy + 10, cx + 10, cy - 30, cx, cy - 48);
  ctx.fill();
  // Lightning wings
  ctx.strokeStyle = withAlpha(0x44aaff, 0.6); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx - 18, cy); ctx.lineTo(cx - 35, cy - 12); ctx.lineTo(cx - 30, cy + 5); ctx.lineTo(cx - 48, cy - 5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 18, cy); ctx.lineTo(cx + 35, cy - 12); ctx.lineTo(cx + 30, cy + 5); ctx.lineTo(cx + 48, cy - 5); ctx.stroke();
  // Core
  ctx.fillStyle = withAlpha(0xffffff, 0.7);
  ctx.beginPath(); ctx.arc(cx, cy - 10, 7, 0, Math.PI * 2); ctx.fill();
  // Lightning trail engine
  ctx.strokeStyle = withAlpha(0xffee44, 0.5); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx, cy + 32); ctx.lineTo(cx - 5, cy + 48); ctx.lineTo(cx + 3, cy + 45); ctx.lineTo(cx - 2, cy + 60); ctx.stroke();
}

function drawElectricSerpentShip(ctx, cx, cy) {
  radialGlow(ctx, cx, cy, 55, 0x6644ff, 0.1);
  // Sleek hull
  ctx.fillStyle = withAlpha(0x221144, 0.85);
  ctx.beginPath();
  ctx.moveTo(cx, cy - 55); ctx.bezierCurveTo(cx - 10, cy - 35, cx - 24, cy + 10, cx - 20, cy + 35);
  ctx.lineTo(cx + 20, cy + 35); ctx.bezierCurveTo(cx + 24, cy + 10, cx + 10, cy - 35, cx, cy - 55);
  ctx.fill();
  ctx.fillStyle = withAlpha(0x6644ff, 0.3);
  ctx.beginPath();
  ctx.moveTo(cx, cy - 45); ctx.bezierCurveTo(cx - 6, cy - 28, cx - 15, cy + 5, cx - 12, cy + 25);
  ctx.lineTo(cx + 12, cy + 25); ctx.bezierCurveTo(cx + 15, cy + 5, cx + 6, cy - 28, cx, cy - 45);
  ctx.fill();
  // Energy wings
  ctx.fillStyle = withAlpha(0x6644ff, 0.6);
  ctx.beginPath(); ctx.moveTo(cx - 20, cy); ctx.bezierCurveTo(cx - 40, cy - 20, cx - 60, cy - 35, cx - 55, cy - 5);
  ctx.bezierCurveTo(cx - 48, cy + 8, cx - 32, cy + 12, cx - 18, cy + 8); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx + 20, cy); ctx.bezierCurveTo(cx + 40, cy - 20, cx + 60, cy - 35, cx + 55, cy - 5);
  ctx.bezierCurveTo(cx + 48, cy + 8, cx + 32, cy + 12, cx + 18, cy + 8); ctx.fill();
  // Lightning on hull
  ctx.strokeStyle = withAlpha(0xffee44, 0.4); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx, cy - 40); ctx.lineTo(cx - 3, cy - 20); ctx.lineTo(cx + 3, cy - 18); ctx.lineTo(cx, cy); ctx.stroke();
  // Cockpit
  ctx.fillStyle = withAlpha(0xffee44, 0.6);
  ctx.beginPath(); ctx.arc(cx, cy - 20, 6, 0, Math.PI * 2); ctx.fill();
  // Engine
  ctx.fillStyle = withAlpha(0x44aaff, 0.6);
  ctx.beginPath(); ctx.moveTo(cx - 8, cy + 35); ctx.bezierCurveTo(cx - 10, cy + 50, cx, cy + 58, cx, cy + 55);
  ctx.bezierCurveTo(cx, cy + 58, cx + 10, cy + 50, cx + 8, cy + 35); ctx.fill();
}

function drawElectricTitanShip(ctx, cx, cy) {
  radialGlow(ctx, cx, cy, 60, 0x4422aa, 0.1);
  // Storm battleship hull
  ctx.fillStyle = withAlpha(0x221144, 0.9);
  ctx.fillRect(cx - 35, cy - 42, 70, 84);
  ctx.fillStyle = withAlpha(0x331166, 0.7);
  ctx.beginPath(); ctx.moveTo(cx, cy - 58); ctx.lineTo(cx - 35, cy - 42); ctx.lineTo(cx + 35, cy - 42); ctx.closePath(); ctx.fill();
  // Lightning cannon side pods
  ctx.fillStyle = withAlpha(0x3322aa, 0.85);
  ctx.fillRect(cx - 55, cy - 30, 22, 55); ctx.fillRect(cx + 33, cy - 30, 22, 55);
  // Lightning bolts from cannons
  ctx.strokeStyle = withAlpha(0xffee44, 0.5); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx - 55, cy - 30); ctx.lineTo(cx - 60, cy - 48); ctx.lineTo(cx - 52, cy - 45); ctx.lineTo(cx - 58, cy - 58); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 55, cy - 30); ctx.lineTo(cx + 60, cy - 48); ctx.lineTo(cx + 52, cy - 45); ctx.lineTo(cx + 58, cy - 58); ctx.stroke();
  // Body lightning veins
  ctx.strokeStyle = withAlpha(0x44aaff, 0.4); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx - 15, cy - 30); ctx.lineTo(cx - 18, cy + 10); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 12, cy - 25); ctx.lineTo(cx + 16, cy + 15); ctx.stroke();
  // Core
  ctx.fillStyle = withAlpha(0xffee44, 0.5); ctx.beginPath(); ctx.arc(cx, cy, 12, 0, Math.PI * 2); ctx.fill();
  radialGlow(ctx, cx, cy, 18, 0xffee44, 0.3);
  // Engine
  ctx.fillStyle = withAlpha(0x44aaff, 0.6); ctx.fillRect(cx - 14, cy + 42, 28, 14);
  ctx.fillStyle = withAlpha(0xffee44, 0.4); ctx.fillRect(cx - 8, cy + 42, 16, 8);
  ctx.strokeStyle = withAlpha(0x44aaff, 0.3); ctx.lineWidth = 1; ctx.strokeRect(cx - 35, cy - 42, 70, 84);
}

// ═══ Generate all ═══
console.log('Generating Land creatures...');
save(make(drawRockBeetle), 'creature_land_beetle');
save(make(drawStoneWyrm), 'creature_land_wyrm');
save(make(drawTerraColossus), 'creature_land_colossus');

console.log('Generating Electric creatures...');
save(make(drawSparkMote), 'creature_electric_mote');
save(make(drawVoltSerpent), 'creature_electric_serpent');
save(make(drawStormTitan), 'creature_electric_titan');

console.log('Generating Land ships...');
save(make(drawLandBeetleShip), 'ship_land_beetle');
save(make(drawLandWyrmShip), 'ship_land_wyrm');
save(make(drawLandColossusShip), 'ship_land_colossus');

console.log('Generating Electric ships...');
save(make(drawElectricMoteShip), 'ship_electric_mote');
save(make(drawElectricSerpentShip), 'ship_electric_serpent');
save(make(drawElectricTitanShip), 'ship_electric_titan');

console.log('Done!');
