import * as THREE from 'three';
import { PetalMotif, WrapperMotif } from '../types/bouquet';

const textureCache = new Map<string, THREE.CanvasTexture>();

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const num = parseInt(clean.length === 3 ? clean.replace(/(.)/g, '$1$1') : clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbStr(r: number, g: number, b: number): string {
  return `rgb(${Math.max(0, Math.min(255, Math.round(r)))}, ${Math.max(0, Math.min(255, Math.round(g)))}, ${Math.max(0, Math.min(255, Math.round(b)))})`;
}

function mixRgb(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function shadeRgb(rgb: [number, number, number], factor: number): [number, number, number] {
  return [rgb[0] * factor, rgb[1] * factor, rgb[2] * factor];
}

function makeNearestTexture(canvas: HTMLCanvasElement, repeat = 1): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  if (repeat !== 1) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat, repeat);
  }
  tex.needsUpdate = true;
  return tex;
}

/** Deterministic pseudo-random helper for crisp pixel textures */
function hash2d(x: number, y: number, seed = 13): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123;
  return n - Math.floor(n);
}

export function getPetalTexture(
  primaryHex: string,
  secondaryHex: string,
  motif: PetalMotif,
): THREE.CanvasTexture {
  const key = `petal:${primaryHex}:${secondaryHex}:${motif}`;
  const cached = textureCache.get(key);
  if (cached) return cached;

  const size = 16;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const primary = hexToRgb(primaryHex);
  const secondary = hexToRgb(secondaryHex);
  const bayer4 = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
  ];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let col: [number, number, number] = primary;
      const isEdge = x === 0 || y === 0 || x === size - 1 || y === size - 1;
      const noise = hash2d(x, y, 7);

      if (motif === 'solid') {
        col = isEdge ? shadeRgb(primary, 0.9) : noise > 0.72 ? shadeRgb(primary, 1.05) : primary;
      } else if (motif === 'ombre') {
        const t = y / (size - 1);
        const threshold = bayer4[y % 4][x % 4] / 16;
        const mixT = t > threshold ? Math.min(1, t + 0.18) : Math.max(0, t - 0.15);
        col = mixRgb(secondary, primary, mixT);
        if (isEdge) col = shadeRgb(col, 0.92);
      } else if (motif === 'speckled') {
        const dot =
          ((x % 5 === 1 && y % 5 === 2) ||
            (x % 7 === 4 && y % 6 === 0) ||
            (noise > 0.87 && !isEdge));
        col = dot ? secondary : isEdge ? shadeRgb(primary, 0.9) : primary;
      } else if (motif === 'tipped') {
        const distCenter = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
        if (distCenter >= 5.2 || (distCenter >= 4.2 && (x + y) % 2 === 0)) {
          col = secondary;
        } else {
          col = noise > 0.78 ? shadeRgb(primary, 0.94) : primary;
        }
      }

      ctx.fillStyle = rgbStr(col[0], col[1], col[2]);
      ctx.fillRect(x, y, 1, 1);
    }
  }

  const tex = makeNearestTexture(canvas, 1);
  textureCache.set(key, tex);
  return tex;
}

export function getWrapperTexture(
  baseHex: string,
  motifHex: string,
  motif: WrapperMotif,
): THREE.CanvasTexture {
  const key = `wrap:${baseHex}:${motifHex}:${motif}`;
  const cached = textureCache.get(key);
  if (cached) return cached;

  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const base = hexToRgb(baseHex);
  const accent = hexToRgb(motifHex);
  const darkBase = shadeRgb(base, 0.88);
  const lightBase = shadeRgb(base, 1.07);
  const midBlend = mixRgb(base, accent, 0.52);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let col: [number, number, number] = base;
      const n = hash2d(x, y, 29);

      switch (motif) {
        case 'solid': {
          col = (x + y) % 8 === 0 && n > 0.5 ? lightBase : n > 0.85 ? darkBase : base;
          break;
        }
        case 'kraft': {
          if (n > 0.92) col = accent;
          else if (n < 0.14) col = darkBase;
          else if ((x + y * 2) % 11 === 0 && n > 0.5) col = lightBase;
          break;
        }
        case 'gingham': {
          const bandX = Math.floor(x / 4) % 2 === 0;
          const bandY = Math.floor(y / 4) % 2 === 0;
          if (bandX && bandY) col = accent;
          else if (bandX || bandY) col = midBlend;
          else col = base;
          break;
        }
        case 'polkadot': {
          const cx = ((x % 8) - 3.5);
          const cy = ((y % 8) - 3.5);
          const ox = (((x + 4) % 8) - 3.5);
          const oy = (((y + 4) % 8) - 3.5);
          const d1 = Math.abs(cx) + Math.abs(cy);
          const d2 = Math.abs(ox) + Math.abs(oy);
          if ((d1 <= 1.8 && Math.floor(y / 8) % 2 === 0) || (d2 <= 1.8 && Math.floor(y / 8) % 2 === 1)) {
            col = accent;
          }
          break;
        }
        case 'stripes': {
          if ((x + y) % 6 < 2) {
            col = accent;
          } else if ((x + y) % 6 === 2) {
            col = midBlend;
          }
          break;
        }
        case 'stars': {
          // Draw crisp 5x5 pixel stars on 16x16 grid
          const gx = x % 16;
          const gy = y % 16;
          const isStar1 =
            (gx === 4 && gy >= 2 && gy <= 6) ||
            (gy === 4 && gx >= 2 && gx <= 6);
          const isStar2 =
            (gx === 12 && gy >= 10 && gy <= 14) ||
            (gy === 12 && gx >= 10 && gx <= 14);
          const isSpark = (gx === 12 && gy === 3) || (gx === 3 && gy === 12);
          if (isStar1 || isStar2 || isSpark) {
            col = accent;
          }
          break;
        }
        case 'floral': {
          // Mini 5x5 pixel blossom with golden/contrast center
          const gx = x % 16;
          const gy = y % 16;
          const flowerCenter = (gx === 4 && gy === 4) || (gx === 12 && gy === 12);
          const flowerPetals =
            (Math.abs(gx - 4) + Math.abs(gy - 4) === 1) ||
            (Math.abs(gx - 12) + Math.abs(gy - 12) === 1);
          const tinyLeaf =
            (gx === 6 && gy === 5) ||
            (gx === 5 && gy === 6) ||
            (gx === 14 && gy === 13);
          if (flowerCenter) col = shadeRgb(accent, 1.2);
          else if (flowerPetals) col = accent;
          else if (tinyLeaf) col = mixRgb(base, [90, 145, 95], 0.75);
          break;
        }
      }

      ctx.fillStyle = rgbStr(col[0], col[1], col[2]);
      ctx.fillRect(x, y, 1, 1);
    }
  }

  const tex = makeNearestTexture(canvas, 2);
  textureCache.set(key, tex);
  return tex;
}

export function getSeedCenterTexture(hex = '#4f3321'): THREE.CanvasTexture {
  const key = `center:${hex}`;
  const cached = textureCache.get(key);
  if (cached) return cached;

  const size = 16;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const base = hexToRgb(hex);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const checker = (x + y) % 2 === 0;
      const n = hash2d(x, y, 41);
      const col = checker
        ? shadeRgb(base, n > 0.6 ? 1.18 : 1.05)
        : shadeRgb(base, n > 0.5 ? 0.85 : 0.75);
      ctx.fillStyle = rgbStr(col[0], col[1], col[2]);
      ctx.fillRect(x, y, 1, 1);
    }
  }

  const tex = makeNearestTexture(canvas, 1);
  textureCache.set(key, tex);
  return tex;
}

export function getTagTexture(text: string): THREE.CanvasTexture {
  const clean = (text || 'PUSPA').slice(0, 16);
  const key = `tag:${clean}`;
  const cached = textureCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 32;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#fff6e5';
  ctx.fillRect(0, 0, 64, 32);
  ctx.strokeStyle = '#c89e6f';
  ctx.lineWidth = 2;
  ctx.strokeRect(2, 2, 60, 28);

  // Small pixel flower mark
  ctx.fillStyle = '#e55c7a';
  ctx.fillRect(6, 12, 4, 4);
  ctx.fillStyle = '#4c8c57';
  ctx.fillRect(7, 16, 2, 4);

  ctx.fillStyle = '#4b3b36';
  ctx.font = 'bold 10px monospace';
  ctx.textBaseline = 'middle';
  ctx.fillText(clean, 14, 16, 44);

  const tex = makeNearestTexture(canvas, 1);
  textureCache.set(key, tex);
  return tex;
}
