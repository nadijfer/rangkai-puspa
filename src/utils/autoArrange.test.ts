import { describe, expect, it } from 'vitest';
import { STARTER_PRESETS } from '../data/catalog';
import { autoArrangeFlowers, clampToBouquetDome } from './autoArrange';

describe('autoArrange', () => {
  it('arranges all flowers within bouquet bounds without losing items', () => {
    const input = STARTER_PRESETS[0].flowers;
    const arranged = autoArrangeFlowers(input);

    expect(arranged).toHaveLength(input.length);
    arranged.forEach((flower) => {
      const [x, y, z] = flower.position;
      expect(Math.hypot(x, z)).toBeLessThanOrEqual(0.85);
      expect(y).toBeGreaterThanOrEqual(0.68);
      expect(y).toBeLessThanOrEqual(2.05);
    });

    // Ensure distinct flowers do not collapse to identical coordinates
    const coords = new Set(arranged.map((f) => f.position.join(',')));
    expect(coords.size).toBe(arranged.length);
  });

  it('handles empty arrays gracefully', () => {
    expect(autoArrangeFlowers([])).toEqual([]);
  });

  it('clamps extreme positions into the bouquet dome', () => {
    const [x, y, z] = clampToBouquetDome([10, 99, -10]);
    expect(Math.hypot(x, z)).toBeLessThanOrEqual(0.83);
    expect(y).toBe(2.05);

    const [, yMin] = clampToBouquetDome([0, -5, 0]);
    expect(yMin).toBe(0.68);
  });
});
