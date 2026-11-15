export type FlowerSpeciesId =
  | 'rose'
  | 'tulip'
  | 'sunflower'
  | 'daisy'
  | 'lily'
  | 'lavender'
  | 'hydrangea'
  | 'peony'
  | 'babys-breath'
  | 'eucalyptus'
  | 'fern';

export type FlowerCategory = 'focal' | 'accent' | 'foliage';

export type PetalMotif = 'solid' | 'ombre' | 'speckled' | 'tipped';

export type WrapperShape =
  | 'korean-layered'
  | 'classic-cone'
  | 'ruffled'
  | 'kraft-sleeve';

export type WrapperMotif =
  | 'solid'
  | 'kraft'
  | 'gingham'
  | 'polkadot'
  | 'stripes'
  | 'stars'
  | 'floral';

export type RibbonStyle = 'classic-bow' | 'double-bow' | 'twine';

export type PixelDensity = 'chunky' | 'balanced' | 'fine';

export type Language = 'id' | 'en';

export interface PlacedFlower {
  id: string;
  species: FlowerSpeciesId;
  color: string;
  secondaryColor: string;
  motif: PetalMotif;
  /** Flower head 3D position relative to bouquet origin */
  position: [number, number, number];
  /** Scale multiplier (0.75 - 1.35) */
  scale: number;
  /** Spin around stem axis in radians */
  spin: number;
  /** Subtle manual head tilt offset in radians */
  tilt: number;
}

export interface WrapperConfig {
  shape: WrapperShape;
  outerColor: string;
  innerColor: string;
  motif: WrapperMotif;
  motifColor: string;
  ribbonStyle: RibbonStyle;
  ribbonColor: string;
  tagText: string;
}

export interface GiftCardConfig {
  to: string;
  from: string;
  message: string;
}

export interface BouquetState {
  name: string;
  flowers: PlacedFlower[];
  wrapper: WrapperConfig;
  card: GiftCardConfig;
}

export interface SavedBouquetEntry {
  id: string;
  savedAt: number;
  thumbnail: string;
  state: BouquetState;
}
