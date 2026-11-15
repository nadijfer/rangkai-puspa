import LZString from 'lz-string';
import {
  BouquetState,
  FlowerSpeciesId,
  PetalMotif,
  PlacedFlower,
  RibbonStyle,
  WrapperMotif,
  WrapperShape,
} from '../types/bouquet';
import { SPECIES_BY_ID } from '../data/catalog';

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

type CompactFlower = [
  string, // species
  string, // color
  string, // secondaryColor
  string, // motif
  number, // x
  number, // y
  number, // z
  number, // scale
  number, // spin
  number, // tilt
];

interface CompactPayload {
  v: 1;
  n: string;
  f: CompactFlower[];
  w: [string, string, string, string, string, string, string, string];
  c: [string, string, string];
}

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

export function encodeBouquetToHash(state: BouquetState): string {
  const payload: CompactPayload = {
    v: 1,
    n: state.name.slice(0, 48),
    f: state.flowers.map((fl) => [
      fl.species,
      fl.color,
      fl.secondaryColor,
      fl.motif,
      round2(fl.position[0]),
      round2(fl.position[1]),
      round2(fl.position[2]),
      round2(fl.scale),
      round2(fl.spin),
      round2(fl.tilt),
    ]),
    w: [
      state.wrapper.shape,
      state.wrapper.outerColor,
      state.wrapper.innerColor,
      state.wrapper.motif,
      state.wrapper.motifColor,
      state.wrapper.ribbonStyle,
      state.wrapper.ribbonColor,
      state.wrapper.tagText.slice(0, 18),
    ],
    c: [
      state.card.to.slice(0, 40),
      state.card.from.slice(0, 40),
      state.card.message.slice(0, 220),
    ],
  };

  const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(payload));
  return `#b=${compressed}`;
}

export function decodeBouquetFromHash(hash: string): BouquetState | null {
  try {
    const clean = hash.startsWith('#') ? hash.slice(1) : hash;
    const match = clean.match(/(?:^|&)b=([^&]+)/);
    if (!match) return null;

    const jsonStr = LZString.decompressFromEncodedURIComponent(match[1]);
    if (!jsonStr) return null;

    const parsed = JSON.parse(jsonStr) as Partial<CompactPayload>;
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
