import LZString from 'lz-string';
import { describe, expect, it } from 'vitest';
import { STARTER_PRESETS } from '../data/catalog';
import { decodeBouquetFromHash, encodeBouquetToHash } from './shareCodec';

describe('shareCodec', () => {
  it('round-trips a full bouquet state with compact binary v2 (#p=)', () => {
    const original = structuredClone(STARTER_PRESETS[0]);
    original.bgColor = '#dfe9f5';
    original.card.message = 'Selamat ulang tahun! 🌸 Semoga bahagia selalu.';
    original.wrapper.tagText = 'Spesial ✨';

    const hash = encodeBouquetToHash(original);
    expect(hash.startsWith('#p=')).toBe(true);
    // Compact v2 should be substantially shorter than ~260 chars for an 8-flower preset
    expect(hash.length).toBeLessThan(260);

    const decoded = decodeBouquetFromHash(hash);
    expect(decoded).not.toBeNull();
    expect(decoded!.name).toBe(original.name);
    expect(decoded!.bgColor).toBe(original.bgColor);
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

  it('decodes legacy v1 (#b=) LZString links for backwards compatibility', () => {
    const preset = STARTER_PRESETS[1];
    const v1Payload = {
      v: 1,
      n: preset.name,
      f: preset.flowers.map((fl) => [
        fl.species,
        fl.color,
        fl.secondaryColor,
        fl.motif,
        fl.position[0],
        fl.position[1],
        fl.position[2],
        fl.scale,
        fl.spin,
        fl.tilt,
      ]),
      w: [
        preset.wrapper.shape,
        preset.wrapper.outerColor,
        preset.wrapper.innerColor,
        preset.wrapper.motif,
        preset.wrapper.motifColor,
        preset.wrapper.ribbonStyle,
        preset.wrapper.ribbonColor,
        preset.wrapper.tagText,
      ],
      c: [preset.card.to, preset.card.from, preset.card.message],
    };
    const legacyHash = `#b=${LZString.compressToEncodedURIComponent(JSON.stringify(v1Payload))}`;
    const decoded = decodeBouquetFromHash(legacyHash);
    expect(decoded).not.toBeNull();
    expect(decoded!.name).toBe(preset.name);
    expect(decoded!.bgColor).toBe('#f4ecdc');
    expect(decoded!.flowers.length).toBe(preset.flowers.length);
  });

  it('returns null safely on invalid or empty hashes', () => {
    expect(decodeBouquetFromHash('')).toBeNull();
    expect(decodeBouquetFromHash('#other=123')).toBeNull();
    expect(decodeBouquetFromHash('#p=!!!invalid!!!')).toBeNull();
    expect(decodeBouquetFromHash('#b=not-valid-lz-data!!!')).toBeNull();
  });
});
