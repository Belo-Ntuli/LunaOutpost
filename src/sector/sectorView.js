import { BUILDINGS } from '../data/buildings.js';
import { buildingImage } from '../ui/icons.js';
import { getSector } from '../data/sectors.js';
import { generateSectorMap, TERRAIN } from '../game/sectorMap.js';
import { createRng } from '../game/rng.js';
import { isLunarDaylight } from '../game/state.js';

const SQRT3 = Math.sqrt(3);

/**
 * 2D top-down management view of one sector (pointy-top hex grid, odd-r offset).
 * The caller provides getView() => { state, sectorId, selectedCell, placingType, canPlace(cell) }.
 */
export class SectorView {
  constructor(canvas, { getView, onCellClick, onCellHover }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.getView = getView;
    this.onCellClick = onCellClick;
    this.onCellHover = onCellHover;
    this.hoverCell = null;
    this.running = false;
    this.layout = null;
    this.speckles = null;

    canvas.addEventListener('pointermove', (e) => {
      const cell = this.cellAt(e);
      if (cell !== this.hoverCell) {
        this.hoverCell = cell;
        this.onCellHover?.(cell);
      }
    });
    canvas.addEventListener('pointerleave', () => {
      this.hoverCell = null;
      this.onCellHover?.(null);
    });
    canvas.addEventListener('click', (e) => {
      const cell = this.cellAt(e);
      if (cell !== null) this.onCellClick?.(cell);
    });
    window.addEventListener('resize', () => this.running && this.resize());
  }

  start() {
    this.running = true;
    this.resize();
    const loop = (t) => {
      if (!this.running) return;
      this.draw(t / 1000);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    this.hoverCell = null;
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio, 2);
    const { clientWidth: w, clientHeight: h } = this.canvas;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.width = w;
    this.height = h;
    this.layout = null;
  }

  computeLayout(map) {
    // Leave room for the hint bar (top) and the Astro helper (bottom).
    const padX = 20, padTop = 56, padBottom = 96;
    const gridW = (n) => SQRT3 * (map.cols + 0.5) * n;
    const gridH = (n) => (1.5 * (map.rows - 1) + 2) * n;
    const size = Math.max(10, Math.min((this.width - padX * 2) / gridW(1), (this.height - padTop - padBottom) / gridH(1)));
    const ox = (this.width - gridW(size)) / 2 + (SQRT3 / 2) * size;
    const oy = padTop + (this.height - padTop - padBottom - gridH(size)) / 2 + size;
    const centers = map.cells.map((c) => ({
      x: ox + SQRT3 * size * (c.col + 0.5 * (c.row & 1)),
      y: oy + 1.5 * size * c.row,
    }));
    return { size, centers, sectorId: map.sectorId };
  }

  cellAt(e) {
    if (!this.layout) return null;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    let best = null, bestD = Infinity;
    this.layout.centers.forEach((c, i) => {
      const d = (c.x - x) ** 2 + (c.y - y) ** 2;
      if (d < bestD) { bestD = d; best = i; }
    });
    return bestD <= (this.layout.size * 0.95) ** 2 ? best : null;
  }

  draw(time) {
    const view = this.getView();
    if (!view?.state) return;
    const { state, sectorId } = view;
    const map = generateSectorMap(sectorId);
    if (!this.layout || this.layout.sectorId !== sectorId) {
      this.layout = this.computeLayout(map);
      this.speckles = makeSpeckles(sectorId, this.width, this.height);
    }
    const ctx = this.ctx;
    const sector = getSector(sectorId);
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    for (const s of this.speckles) ctx.fillRect(s.x, s.y, s.r, s.r);

    const buildings = new Map(state.sectors[sectorId].buildings.map((b) => [b.cell, b]));
    const { size, centers } = this.layout;

    map.cells.forEach((cell, i) => {
      const { x, y } = centers[i];
      const terrain = TERRAIN[cell.terrain];
      hexPath(ctx, x, y, size * 0.96);
      ctx.fillStyle = mix(terrain.color, sector.color, cell.terrain === 'plain' ? 0.45 : 0.15);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.45)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      drawTerrainDetail(ctx, cell.terrain, x, y, size, i);

      const b = buildings.get(i);
      if (b) drawBuilding(ctx, b, x, y, size);
    });

    // Placement preview / hover / selection outlines.
    const outline = (i, color, width) => {
      if (i === null || i === undefined) return;
      hexPath(ctx, centers[i].x, centers[i].y, size * 0.92);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.stroke();
    };
    if (view.placingType && this.hoverCell !== null) {
      const ok = view.canPlace(this.hoverCell);
      hexPath(ctx, centers[this.hoverCell].x, centers[this.hoverCell].y, size * 0.92);
      ctx.fillStyle = ok ? 'rgba(102,255,153,0.25)' : 'rgba(255,90,90,0.25)';
      ctx.fill();
      outline(this.hoverCell, ok ? '#66ff99' : '#ff5a5a', 3);
      if (!buildings.has(this.hoverCell)) {
        ctx.globalAlpha = 0.6;
        drawBuildingIcon(ctx, BUILDINGS[view.placingType], centers[this.hoverCell].x, centers[this.hoverCell].y - size * 0.08, size * 1.55);
        ctx.globalAlpha = 1;
      }
    } else {
      outline(this.hoverCell, 'rgba(255,255,255,0.6)', 2);
    }
    outline(view.selectedCell, '#7fb8ff', 3);

    // Lunar night overlay: a visual reminder that solar arrays are offline.
    const dark = sector.traits.sunlight === 0 || (!sector.traits.constantSun && !isLunarDaylight(state.day));
    if (dark) {
      ctx.fillStyle = 'rgba(10,20,60,0.35)';
      ctx.fillRect(0, 0, this.width, this.height);
    }
  }
}

function hexPath(ctx, x, y, r) {
  ctx.beginPath();
  for (let k = 0; k < 6; k++) {
    const a = (Math.PI / 180) * (60 * k - 30);
    const px = x + r * Math.cos(a), py = y + r * Math.sin(a);
    if (k === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawTerrainDetail(ctx, terrain, x, y, size, seed) {
  ctx.save();
  if (terrain === 'crater') {
    ctx.beginPath();
    ctx.arc(x, y, size * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = '#2e2f35';
    ctx.fill();
    ctx.strokeStyle = '#6b6b72';
    ctx.lineWidth = size * 0.08;
    ctx.stroke();
  } else if (terrain === 'ice') {
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (let k = 0; k < 4; k++) {
      const a = seed * 1.7 + k * 1.57;
      ctx.fillRect(x + Math.cos(a) * size * 0.45, y + Math.sin(a) * size * 0.45, 3, 3);
    }
  } else if (terrain === 'ore') {
    ctx.fillStyle = '#e0a060';
    for (let k = 0; k < 5; k++) {
      const a = seed * 2.3 + k * 1.25;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * size * 0.5, y + Math.sin(a) * size * 0.5, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (terrain === 'peak') {
    ctx.beginPath();
    ctx.moveTo(x - size * 0.5, y + size * 0.35);
    ctx.lineTo(x - size * 0.1, y - size * 0.4);
    ctx.lineTo(x + size * 0.15, y);
    ctx.lineTo(x + size * 0.3, y - size * 0.2);
    ctx.lineTo(x + size * 0.55, y + size * 0.35);
    ctx.strokeStyle = 'rgba(255,240,180,0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
  } else if (terrain === 'tube') {
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.15, size * 0.5, size * 0.25, 0, Math.PI, 0);
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = size * 0.12;
    ctx.stroke();
  }
  ctx.restore();
}

function drawIcon(ctx, icon, x, y, size) {
  ctx.font = `${Math.round(size * 0.8)}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(icon, x, y + size * 0.04);
}

/** Draws a building's picture standing on its hexagon. */
function drawBuilding(ctx, b, x, y, size) {
  drawBuildingIcon(ctx, BUILDINGS[b.type], x, y - size * 0.08, size * 1.55);
}

/** Draws a building's custom picture (e.g. the Moon dome) or, if it has none, its emoji. */
function drawBuildingIcon(ctx, def, x, y, size) {
  const img = buildingImage(def);
  if (img?.complete && img.naturalWidth) {
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 6;
    ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
    ctx.restore();
  } else {
    drawIcon(ctx, def.icon, x, y, size);
  }
}

function makeSpeckles(seed, w, h) {
  const rng = createRng(seed * 977);
  return Array.from({ length: 400 }, () => ({ x: rng() * w, y: rng() * h, r: 1 + rng() * 2 }));
}

function mix(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (p, s) => (p >> s) & 255;
  const c = (s) => Math.round(ch(pa, s) * (1 - t) + ch(pb, s) * t);
  return `rgb(${c(16)},${c(8)},${c(0)})`;
}
