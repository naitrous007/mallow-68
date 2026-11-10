import * as THREE from "three";

/* ------------------------------------------------------------------
   Canvas-painted textures keep the whole experience self-contained.
------------------------------------------------------------------- */

function canvas2d(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return { canvas, ctx: canvas.getContext("2d") };
}

function seeded(seed) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

let labelAtlasCache = null;

/** Draw every key legend once into a 9x8 atlas, with per-key UV cells. */
export function getKeyLabelAtlas(labels) {
  if (labelAtlasCache) return labelAtlasCache;
  const cols = 9;
  const rows = 8;
  const cell = 128;
  const { canvas, ctx } = canvas2d(cols * cell, rows * cell);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = '600 56px "Nunito", "Segoe UI", sans-serif';

  labels.forEach((label, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const cx = col * cell + cell / 2;
    const cy = row * cell + cell / 2 + 1;
    let size = 56;
    while (size > 22 && ctx.measureText(label).width > 96) {
      size -= 2;
      ctx.font = `600 ${size}px "Nunito", "Segoe UI", sans-serif`;
    }
    ctx.fillText(label, cx, cy);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;

  const uvAt = (index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const u0 = col / cols;
    const u1 = (col + 1) / cols;
    const v0 = 1 - (row + 1) / rows;
    const v1 = 1 - row / rows;
    return { u0, u1, v0, v1 };
  };

  labelAtlasCache = { texture, uvAt };
  return labelAtlasCache;
}

let keyGeometryUvCache = new WeakMap();

/** Clone a XY plane and remap its UVs to one atlas cell. */
export function makeLabelPlaneGeometry(uv) {
  const geometry = new THREE.PlaneGeometry(1, 1);
  const attr = geometry.attributes.uv;
  const seq = [
    [0, 1],
    [1, 1],
    [0, 0],
    [1, 0],
  ];
  for (let i = 0; i < attr.count; i += 1) {
    const [u, v] = seq[i];
    attr.setXY(i, u === 0 ? uv.u0 : uv.u1, v === 0 ? uv.v0 : uv.v1);
  }
  attr.needsUpdate = true;
  keyGeometryUvCache.set(geometry, true);
  return geometry;
}

let badgeCache = null;

export function getCaseBadgeTexture() {
  if (badgeCache) return badgeCache;
  const { canvas, ctx } = canvas2d(640, 160);
  ctx.clearRect(0, 0, 640, 160);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = '600 64px "Fredoka", "Segoe UI", sans-serif';
  ctx.fillText("mallow 68", 320, 78);
  ctx.font = '500 24px "Nunito", "Segoe UI", sans-serif';
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillText("softly mechanical", 320, 124);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  badgeCache = texture;
  return texture;
}

let pcbCache = null;

export function getPcbTexture() {
  if (pcbCache) return pcbCache;
  const { canvas, ctx } = canvas2d(1400, 520);
  ctx.clearRect(0, 0, 1400, 520);
  const rand = seeded(68);

  // delicate gold traces
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(219, 190, 120, 0.72)";
  ctx.lineWidth = 3;
  for (let i = 0; i < 54; i += 1) {
    const y = 25 + rand() * 470;
    const x = 60 + rand() * 1150;
    const len = 50 + rand() * 150;
    const bend = (rand() - 0.5) * 80;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len * 0.42, y);
    ctx.lineTo(x + len * 0.42 + 20, y + bend);
    ctx.lineTo(x + len + 20, y + bend);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + len + 20, y + bend, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(233, 205, 138, 0.8)";
    ctx.fill();
  }

  // silkscreen keys and component outlines
  ctx.strokeStyle = "rgba(255, 244, 222, 0.32)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 22; i += 1) {
    const x = 180 + rand() * 1000;
    const y = 80 + rand() * 330;
    ctx.strokeRect(x, y, 44 + rand() * 48, 28 + rand() * 22);
  }

  ctx.fillStyle = "rgba(255, 246, 224, 0.8)";
  ctx.font = '600 44px "Fredoka", "Segoe UI", sans-serif';
  ctx.textAlign = "left";
  ctx.fillText("MALLOW 68", 72, 456);
  ctx.font = '500 24px "Nunito", "Segoe UI", sans-serif';
  ctx.fillStyle = "rgba(255, 246, 224, 0.52)";
  ctx.fillText("QMK · HOTSWAP · REV.01", 76, 490);

  // a tiny heart
  ctx.fillStyle = "rgba(255, 241, 222, 0.55)";
  ctx.beginPath();
  ctx.moveTo(1280, 110);
  ctx.bezierCurveTo(1272, 98, 1254, 102, 1254, 118);
  ctx.bezierCurveTo(1254, 137, 1280, 148, 1280, 148);
  ctx.bezierCurveTo(1280, 148, 1306, 137, 1306, 118);
  ctx.bezierCurveTo(1306, 102, 1288, 98, 1280, 110);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  pcbCache = texture;
  return texture;
}

let foamCache = null;

export function getFoamTexture() {
  if (foamCache) return foamCache;
  const { canvas, ctx } = canvas2d(1024, 512);
  ctx.clearRect(0, 0, 1024, 512);
  const rand = seeded(21);
  for (let i = 0; i < 1400; i += 1) {
    const x = rand() * 1024;
    const y = rand() * 512;
    const r = 0.8 + rand() * 2.2;
    ctx.fillStyle = `rgba(128, 104, 82, ${0.025 + rand() * 0.06})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 80; i += 1) {
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.05 + rand() * 0.12})`;
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    const x = rand() * 1024;
    const y = rand() * 512;
    ctx.moveTo(x, y);
    ctx.lineTo(x + 3 + rand() * 8, y + (rand() - 0.5) * 4);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  foamCache = texture;
  return texture;
}

let matTextureCache = null;

export function getDeskMatTexture() {
  if (matTextureCache) return matTextureCache;
  const { canvas, ctx } = canvas2d(1024, 1024);
  const gradient = ctx.createLinearGradient(0, 0, 1024, 1024);
  gradient.addColorStop(0, "#e2bdc0");
  gradient.addColorStop(0.52, "#e6c7c3");
  gradient.addColorStop(1, "#d7b1bc");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 1024);
  const rand = seeded(9);
  for (let i = 0; i < 9000; i += 1) {
    const x = rand() * 1024;
    const y = rand() * 1024;
    const a = 0.015 + rand() * 0.035;
    ctx.fillStyle = rand() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(95,65,70,${a})`;
    ctx.fillRect(x, y, 1.2, 1.2);
  }
  // stitched edge
  ctx.strokeStyle = "rgba(255, 244, 234, 0.38)";
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 9]);
  ctx.strokeRect(17, 17, 990, 990);
  ctx.setLineDash([]);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  matTextureCache = texture;
  return texture;
}
