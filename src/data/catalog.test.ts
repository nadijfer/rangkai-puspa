import { describe, expect, it } from 'vitest';
import {
  COLOR_SWATCHES,
  FLOWER_SPECIES,
  PETAL_MOTIFS,
  RIBBON_STYLES,
  SPECIES_BY_ID,
  STARTER_PRESETS,
  WRAPPER_MOTIFS,
  WRAPPER_SHAPES,
} from './catalog';

describe('catalog integrity', () => {
  it('exposes all 11 flower and foliage species with valid hex colors', () => {
    expect(FLOWER_SPECIES.length).toBe(11);
    FLOWER_SPECIES.forEach((spec) => {
      expect(SPECIES_BY_ID[spec.id]).toBeDefined();
      expect(spec.defaultColor).toMatch(/^#[0-9a-f]{6}$/i);
      expect(spec.defaultSecondary).toMatch(/^#[0-9a-f]{6}$/i);
      expect(spec.name.id.length).toBeGreaterThan(0);
      expect(spec.name.en.length).toBeGreaterThan(0);
    });
  });

  it('provides diverse motifs, wrappers, ribbons, and starter presets', () => {
    expect(COLOR_SWATCHES.length).toBeGreaterThanOrEqual(12);
    expect(PETAL_MOTIFS.length).toBe(4);
    expect(WRAPPER_SHAPES.length).toBe(4);
    expect(WRAPPER_MOTIFS.length).toBe(7);
    expect(RIBBON_STYLES.length).toBe(3);
    expect(STARTER_PRESETS.length).toBe(3);

    STARTER_PRESETS.forEach((preset) => {
      expect(preset.flowers.length).toBeGreaterThan(0);
      preset.flowers.forEach((fl) => {
        expect(SPECIES_BY_ID[fl.species]).toBeDefined();
      });
    });
  });
});
