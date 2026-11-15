import LZString from 'lz-string';
import {
  BG_SWATCHES,
  COLOR_SWATCHES,
  DEFAULT_BG_COLOR,
  FLOWER_SPECIES,
  PETAL_MOTIFS,
  RIBBON_STYLES,
  SPECIES_BY_ID,
  STARTER_PRESETS,
  WRAPPER_MOTIFS,
  WRAPPER_SHAPES,
} from '../data/catalog';
import {
  BouquetState,
  FlowerSpeciesId,
  PetalMotif,
  PlacedFlower,
  RibbonStyle,
  WrapperMotif,
  WrapperShape,
} from '../types/bouquet';

const VALID_PETAL_MOTIFS: Set<PetalMotif> = new Set(['solid', 'ombre', 'speckled', 'tipped']);
const VALID_WRAPPER_SHAPES: Set<WrapperShape> = new Set([
  'korean-layered',
  'classic-cone',
  'ruffled',
  'kraft-sleeve',
]);
const VALID_WRAPPER_MOTIFS: Set<WrapperMotif> = new Set([
  'solid',
  'kraft',
  'gingham',
  'polkadot',
  'stripes',
  'stars',
  'floral',
]);
const VALID_RIBBONS: Set<RibbonStyle> = new Set(['classic-bow', 'double-bow', 'twine']);

// Lookup table of up to 128 known hex colors for 1-byte color compression
const KNOWN_COLORS: string[] = (() => {
  const seen = new Set<string>();
  const list: string[] = [];
  const push = (hex: string) => {
    const norm = hex.toLowerCase();
    if (!seen.has(norm) && /^#[0-9a-f]{6}$/.test(norm) && list.length < 128) {
      seen.add(norm);
      list.push(norm);
    }
  };
  COLOR_SWATCHES.forEach((s) => push(s.hex));
  BG_SWATCHES.forEach((s) => push(s.hex));
  FLOWER_SPECIES.forEach((s) => {
    push(s.defaultColor);
    push(s.defaultSecondary);
  });
  STARTER_PRESETS.forEach((p) => {
    push(p.wrapper.outerColor);
    push(p.wrapper.innerColor);
    push(p.wrapper.motifColor);
    push(p.wrapper.ribbonColor);
    p.flowers.forEach((f) => {
      push(f.color);
      push(f.secondaryColor);
    });
  });
  return list;
})();

const KNOWN_COLOR_INDEX = new Map(KNOWN_COLORS.map((hex, i) => [hex, i]));

const SPECIES_LIST = FLOWER_SPECIES.map((s) => s.id);
const PETAL_MOTIF_LIST = PETAL_MOTIFS.map((m) => m.id);
const WRAPPER_SHAPE_LIST = WRAPPER_SHAPES.map((w) => w.id);
const WRAPPER_MOTIF_LIST = WRAPPER_MOTIFS.map((w) => w.id);
const RIBBON_STYLE_LIST = RIBBON_STYLES.map((r) => r.id);

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function sanitizeHex(hex: unknown, fallback: string): string {
  if (typeof hex === 'string' && /^#[0-9a-fA-F]{6}$/.test(hex)) {
    return hex.toLowerCase();
  }
  return fallback;
}

function quantize(val: number, min: number, max: number): number {
  const t = clamp((val - min) / (max - min), 0, 1);
  return Math.round(t * 255);
}

function dequantize(byte: number, min: number, max: number): number {
  return round2(min + (byte / 255) * (max - min));
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str: string): Uint8Array | null {
  try {
    let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4 !== 0) b64 += '=';
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      bytes[i] = bin.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

class ByteWriter {
  private buf: number[] = [];

  u8(v: number) {
    this.buf.push(v & 0xff);
  }

  color(hex: string) {
    const norm = sanitizeHex(hex, '#ffffff');
    const idx = KNOWN_COLOR_INDEX.get(norm);
    if (idx !== undefined) {
      this.u8(idx);
    } else {
      this.u8(0xff);
      this.u8(parseInt(norm.slice(1, 3), 16));
      this.u8(parseInt(norm.slice(3, 5), 16));
      this.u8(parseInt(norm.slice(5, 7), 16));
    }
  }

  str(s: string, maxLen: number) {
    const encoded = textEncoder.encode(s.slice(0, maxLen));
    const len = Math.min(255, encoded.length);
    this.u8(len);
    for (let i = 0; i < len; i++) {
      this.u8(encoded[i]);
    }
  }

  toUint8Array(): Uint8Array {
    return new Uint8Array(this.buf);
  }
}

class ByteReader {
  private pos = 0;
  constructor(private bytes: Uint8Array) {}

  u8(): number {
    if (this.pos >= this.bytes.length) throw new Error('EOF');
    return this.bytes[this.pos++];
  }

  color(fallback: string): string {
    const tag = this.u8();
    if (tag < KNOWN_COLORS.length) {
      return KNOWN_COLORS[tag];
    }
    if (tag === 0xff) {
      const r = this.u8().toString(16).padStart(2, '0');
      const g = this.u8().toString(16).padStart(2, '0');
      const b = this.u8().toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    }
    return fallback;
  }

  str(): string {
    const len = this.u8();
    if (this.pos + len > this.bytes.length) throw new Error('EOF');
    const slice = this.bytes.subarray(this.pos, this.pos + len);
    this.pos += len;
    return textDecoder.decode(slice);
  }
}

/**
 * Encodes a BouquetState into a compact binary Base64URL hash (`#p=...`).
 * ~2.5-3.5x shorter than JSON+LZString while remaining 100% stateless & permanent.
 */
export function encodeBouquetToHash(state: BouquetState): string {
  const w = new ByteWriter();
  w.u8(2); // version 2

  const shapeIdx = Math.max(0, WRAPPER_SHAPE_LIST.indexOf(state.wrapper.shape));
  const motifIdx = Math.max(0, WRAPPER_MOTIF_LIST.indexOf(state.wrapper.motif));
  const ribbonIdx = Math.max(0, RIBBON_STYLE_LIST.indexOf(state.wrapper.ribbonStyle));
  w.u8((shapeIdx & 0x3) | ((motifIdx & 0x7) << 2) | ((ribbonIdx & 0x3) << 5));

  w.color(state.wrapper.outerColor);
  w.color(state.wrapper.innerColor);
  if (state.wrapper.motif !== 'solid') {
    w.color(state.wrapper.motifColor);
  }
  w.color(state.wrapper.ribbonColor);
  w.color(state.bgColor || DEFAULT_BG_COLOR);

  w.str(state.name, 48);
  w.str(state.wrapper.tagText, 18);
  w.str(state.card.to, 40);
  w.str(state.card.from, 40);
  w.str(state.card.message, 220);

  const flowers = state.flowers.slice(0, 40);
  w.u8(flowers.length);

  for (const fl of flowers) {
    const spIdx = Math.max(0, SPECIES_LIST.indexOf(fl.species));
    const pmIdx = Math.max(0, PETAL_MOTIF_LIST.indexOf(fl.motif));
    const hasCustomScaleTilt = Math.abs(fl.scale - 1) > 0.015 || Math.abs(fl.tilt) > 0.015;
    const omitSecondary =
      fl.motif === 'solid' || fl.secondaryColor.toLowerCase() === fl.color.toLowerCase();

    w.u8(
      (spIdx & 0x0f) |
        ((pmIdx & 0x03) << 4) |
        (hasCustomScaleTilt ? 0x40 : 0) |
        (omitSecondary ? 0x80 : 0),
    );

    w.color(fl.color);
    if (!omitSecondary) {
      w.color(fl.secondaryColor);
    }

    w.u8(quantize(fl.position[0], -1.5, 1.5));
    w.u8(quantize(fl.position[1], 0.3, 2.3));
    w.u8(quantize(fl.position[2], -1.2, 1.2));

    const wrappedSpin = ((((fl.spin + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI;
    w.u8(quantize(wrappedSpin, -Math.PI, Math.PI));

    if (hasCustomScaleTilt) {
      w.u8(quantize(fl.scale, 0.65, 1.45));
      w.u8(quantize(fl.tilt, -0.5, 0.5));
    }
  }

  return `#p=${toBase64Url(w.toUint8Array())}`;
}

function decodeV2Binary(encoded: string): BouquetState | null {
  const bytes = fromBase64Url(encoded);
  if (!bytes || bytes.length < 10) return null;

  try {
    const r = new ByteReader(bytes);
    const version = r.u8();
    if (version !== 2) return null;

    const wPack = r.u8();
    const shape = WRAPPER_SHAPE_LIST[wPack & 0x3] ?? 'korean-layered';
    const motif = WRAPPER_MOTIF_LIST[(wPack >> 2) & 0x7] ?? 'solid';
    const ribbonStyle = RIBBON_STYLE_LIST[(wPack >> 5) & 0x3] ?? 'classic-bow';

    const outerColor = r.color('#f7d6df');
    const innerColor = r.color('#fff7ee');
    const motifColor = motif !== 'solid' ? r.color('#e49db3') : outerColor;
    const ribbonColor = r.color('#d9455f');
    const bgColor = r.color(DEFAULT_BG_COLOR);

    const name = r.str() || 'Shared Bouquet';
    const tagText = r.str();
    const to = r.str();
    const from = r.str();
    const message = r.str();

    const count = Math.min(40, r.u8());
    const flowers: PlacedFlower[] = [];

    for (let i = 0; i < count; i++) {
      const meta = r.u8();
      const species = SPECIES_LIST[meta & 0x0f];
      if (!species || !SPECIES_BY_ID[species]) return null;
      const petalMotif = PETAL_MOTIF_LIST[(meta >> 4) & 0x03] ?? 'solid';
      const hasCustomScaleTilt = (meta & 0x40) !== 0;
      const omitSecondary = (meta & 0x80) !== 0;

      const color = r.color(SPECIES_BY_ID[species].defaultColor);
      const secondaryColor = omitSecondary
        ? color
        : r.color(SPECIES_BY_ID[species].defaultSecondary);

      const x = dequantize(r.u8(), -1.5, 1.5);
      const y = dequantize(r.u8(), 0.3, 2.3);
      const z = dequantize(r.u8(), -1.2, 1.2);
      const spin = dequantize(r.u8(), -Math.PI, Math.PI);

      let scale = 1;
      let tilt = 0;
      if (hasCustomScaleTilt) {
        scale = dequantize(r.u8(), 0.65, 1.45);
        tilt = dequantize(r.u8(), -0.5, 0.5);
      }

      flowers.push({
        id: `shared-${i}-${Math.random().toString(36).slice(2, 6)}`,
        species,
        color,
        secondaryColor,
        motif: petalMotif,
        position: [x, y, z],
        scale,
        spin,
        tilt,
      });
    }

    return {
      name,
      bgColor,
      flowers,
      wrapper: {
        shape,
        outerColor,
        innerColor,
        motif,
        motifColor,
        ribbonStyle,
        ribbonColor,
        tagText,
      },
      card: { to, from, message },
    };
  } catch {
    return null;
  }
}

type LegacyCompactFlower = [
  string,
  string,
  string,
  string,
  number,
  number,
  number,
  number,
  number,
  number,
];

interface LegacyCompactPayload {
  v: 1;
  n: string;
  bg?: string;
  f: LegacyCompactFlower[];
  w: [string, string, string, string, string, string, string, string];
  c: [string, string, string];
}

function decodeV1Legacy(encoded: string): BouquetState | null {
  try {
    const jsonStr = LZString.decompressFromEncodedURIComponent(encoded);
    if (!jsonStr) return null;

    const parsed = JSON.parse(jsonStr) as Partial<LegacyCompactPayload>;
    if (parsed.v !== 1 || !Array.isArray(parsed.f) || !Array.isArray(parsed.w) || !Array.isArray(parsed.c)) {
      return null;
    }

    const flowers: PlacedFlower[] = [];
    for (let i = 0; i < Math.min(parsed.f.length, 40); i++) {
      const item = parsed.f[i];
      if (!Array.isArray(item) || item.length < 10) continue;
      const species = item[0] as FlowerSpeciesId;
      if (!SPECIES_BY_ID[species]) continue;

      const motif = VALID_PETAL_MOTIFS.has(item[3] as PetalMotif) ? (item[3] as PetalMotif) : 'solid';
      flowers.push({
        id: `shared-${i}-${Math.random().toString(36).slice(2, 6)}`,
        species,
        color: sanitizeHex(item[1], SPECIES_BY_ID[species].defaultColor),
        secondaryColor: sanitizeHex(item[2], SPECIES_BY_ID[species].defaultSecondary),
        motif,
        position: [
          clamp(Number(item[4]) || 0, -1.5, 1.5),
          clamp(Number(item[5]) || 1.2, 0.3, 2.3),
          clamp(Number(item[6]) || 0, -1.2, 1.2),
        ],
        scale: clamp(Number(item[7]) || 1, 0.65, 1.45),
        spin: Number(item[8]) || 0,
        tilt: clamp(Number(item[9]) || 0, -0.5, 0.5),
      });
    }

    const [shapeRaw, outerRaw, innerRaw, wMotifRaw, wMotifColorRaw, ribbonRaw, ribbonColorRaw, tagRaw] =
      parsed.w;

    const shape = VALID_WRAPPER_SHAPES.has(shapeRaw as WrapperShape)
      ? (shapeRaw as WrapperShape)
      : 'korean-layered';
    const motif = VALID_WRAPPER_MOTIFS.has(wMotifRaw as WrapperMotif)
      ? (wMotifRaw as WrapperMotif)
      : 'solid';
    const ribbonStyle = VALID_RIBBONS.has(ribbonRaw as RibbonStyle)
      ? (ribbonRaw as RibbonStyle)
      : 'classic-bow';

    return {
      name: typeof parsed.n === 'string' && parsed.n.trim() ? parsed.n.slice(0, 48) : 'Shared Bouquet',
      bgColor: sanitizeHex(parsed.bg, DEFAULT_BG_COLOR),
      flowers,
      wrapper: {
        shape,
        outerColor: sanitizeHex(outerRaw, '#f7d6df'),
        innerColor: sanitizeHex(innerRaw, '#fff7ee'),
        motif,
        motifColor: sanitizeHex(wMotifColorRaw, '#e49db3'),
        ribbonStyle,
        ribbonColor: sanitizeHex(ribbonColorRaw, '#d9455f'),
        tagText: typeof tagRaw === 'string' ? tagRaw.slice(0, 18) : '',
      },
      card: {
        to: typeof parsed.c[0] === 'string' ? parsed.c[0].slice(0, 40) : '',
        from: typeof parsed.c[1] === 'string' ? parsed.c[1].slice(0, 40) : '',
        message: typeof parsed.c[2] === 'string' ? parsed.c[2].slice(0, 220) : '',
      },
    };
  } catch {
    return null;
  }
}

export function decodeBouquetFromHash(hash: string): BouquetState | null {
  if (!hash) return null;
  const clean = hash.startsWith('#') ? hash.slice(1) : hash;

  const v2Match = clean.match(/(?:^|&)p=([^&]+)/);
  if (v2Match) {
    return decodeV2Binary(v2Match[1]);
  }

  const v1Match = clean.match(/(?:^|&)b=([^&]+)/);
  if (v1Match) {
    return decodeV1Legacy(v1Match[1]);
  }

  return null;
}
