import { SPECIES_BY_ID } from '../data/catalog';
import { PlacedFlower } from '../types/bouquet';

/**
 * Distributes flowers harmoniously in a 3D phyllotaxis bouquet dome:
 * - Foliage forms an airy upper/rear halo
 * - Focal blooms anchor the lush center dome
 * - Accent blooms fill mid-tier gaps and forward rim
 */
export function autoArrangeFlowers(flowers: PlacedFlower[]): PlacedFlower[] {
  if (flowers.length === 0) return [];

  const foliage = flowers.filter((f) => SPECIES_BY_ID[f.species].category === 'foliage');
  const focal = flowers.filter((f) => SPECIES_BY_ID[f.species].category === 'focal');
  const accent = flowers.filter((f) => SPECIES_BY_ID[f.species].category === 'accent');

  const result = new Map<string, PlacedFlower>();
  const goldenAngle = 2.399963229728653;

  // 1. Place foliage along back & side collar
  foliage.forEach((f, idx) => {
    const t = foliage.length === 1 ? 0.5 : idx / (foliage.length - 1);
    const angle = -Math.PI * 0.88 + t * Math.PI * 0.76; // rear arc (-158deg to -22deg)
    const radius = 0.62 + (idx % 2) * 0.14;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius * 0.78 - 0.08;
    const y = 1.48 + (idx % 2) * 0.14;
    result.set(f.id, {
      ...f,
      position: [round2(x), round2(y), round2(z)],
      spin: round2(angle * 0.35),
      tilt: 0,
    });
  });

  // 2. Place focal blooms in a central dome spiral
  focal.forEach((f, idx) => {
    const n = focal.length;
    const rNorm = n === 1 ? 0 : Math.sqrt((idx + 0.35) / n);
    const theta = idx * goldenAngle;
    const radius = rNorm * 0.52;
    const x = Math.cos(theta) * radius;
    const z = Math.sin(theta) * radius * 0.85 + 0.06;
    const domeDrop = rNorm * rNorm * 0.24;
    const y = 1.38 - domeDrop + (idx === 0 ? 0.06 : 0);
    result.set(f.id, {
      ...f,
      position: [round2(x), round2(y), round2(z)],
      spin: round2(((idx % 5) - 2) * 0.18),
      tilt: 0,
    });
  });

  // 3. Place accent flowers in outer rim & airy gaps
  accent.forEach((f, idx) => {
    const n = accent.length;
    const theta = idx * goldenAngle + 0.9;
    const radius = 0.38 + (n > 1 ? ((idx % 3) / 3) * 0.28 : 0.1);
    const x = Math.cos(theta) * radius;
    const z = Math.sin(theta) * radius * 0.86 + 0.04;
    const y = 1.18 + (1 - Math.min(1, radius / 0.72)) * 0.28 + (idx % 2 === 0 ? 0.12 : -0.05);
    result.set(f.id, {
      ...f,
      position: [round2(x), round2(y), round2(z)],
      spin: round2(((idx % 4) - 1.5) * 0.22),
      tilt: 0,
    });
  });

  return flowers.map((f) => result.get(f.id) ?? f);
}

/** Clamps a 3D flower head position safely within the bouquet cone/dome */
export function clampToBouquetDome(pos: [number, number, number]): [number, number, number] {
  const y = Math.max(0.68, Math.min(2.05, pos[1]));
  const maxRadius = 0.82;
  const r = Math.hypot(pos[0], pos[2]);
  let x = pos[0];
  let z = pos[2];
  if (r > maxRadius) {
    const scale = maxRadius / r;
    x *= scale;
    z *= scale;
  }
  return [round2(x), round2(y), round2(z)];
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
