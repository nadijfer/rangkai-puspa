import { describe, expect, it } from 'vitest';
import { STARTER_PRESETS } from '../data/catalog';
import { decodeBouquetFromHash, encodeBouquetToHash } from './shareCodec';

describe('shareCodec', () => {
  it('round-trips a full bouquet state including Unicode card text', () => {
    const original = structuredClone(STARTER_PRESETS[0]);
    original.card.message = 'Selamat ulang tahun! 🌸 Semoga bahagia selalu.';
    original.wrapper.tagText = 'Spesial ✨';

    const hash = encodeBouquetToHash(original);
    expect(hash.startsWith('#b=')).toBe(true);

    const decoded = decodeBouquetFromHash(hash);
    expect(decoded).not.toBeNull();
    expect(decoded!.name).toBe(original.name);
    expect(decoded!.flowers.length).toBe(original.flowers.length);
    expect(decoded!.wrapper).toEqual(original.wrapper);
    expect(decoded!.card).toEqual(original.card);
    decoded!.flowers.forEach((f, idx) => {
      expect(f.species).toBe(original.flowers[idx].species);
      expect(f.color).toBe(original.flowers[idx].color);
      expect(f.motif).toBe(original.flowers[idx].motif);
      expect(f.position[0]).toBeCloseTo(original.flowers[idx].position[0], 1);
      expect(f.position[1]).toBeCloseTo(original.flowers[idx].position[1], 1);
      expect(f.position[2]).toBeCloseTo(original.flowers[idx].position[2], 1);
    });
  });

  it('returns null safely on invalid or empty hashes', () => {
    expect(decodeBouquetFromHash('')).toBeNull();
    expect(decodeBouquetFromHash('#other=123')).toBeNull();
    expect(decodeBouquetFromHash('#b=not-valid-lz-data!!!')).toBeNull();
  });
});
