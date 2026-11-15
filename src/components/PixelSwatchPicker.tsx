import { COLOR_SWATCHES } from '../data/catalog';
import { FlowerSpeciesId, Language, WrapperMotif } from '../types/bouquet';

interface PixelColorPickerProps {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  lang: Language;
}

export function PixelColorPicker({ label, value, onChange, lang }: PixelColorPickerProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs font-semibold">
        <span>{label}</span>
        <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-[#70605a] hover:text-[#352b29]">
          <span className="font-pixel-mono text-sm uppercase">{value}</span>
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-5 h-5 p-0 border-2 border-[#4b3b36] cursor-pointer bg-transparent"
            aria-label={label}
          />
        </label>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {COLOR_SWATCHES.map((swatch) => {
          const active = value.toLowerCase() === swatch.hex.toLowerCase();
          return (
            <button
              key={swatch.id}
              type="button"
              title={swatch.name[lang]}
              onClick={() => onChange(swatch.hex)}
              className={`h-6 border-2 transition-transform cursor-pointer ${
                active
                  ? 'border-[#352b29] scale-110 ring-2 ring-[#d95d79]'
                  : 'border-[#4b3b36]/70 hover:scale-105'
              }`}
              style={{ backgroundColor: swatch.hex }}
            />
          );
        })}
      </div>
    </div>
  );
}

/** Crisp 16x16 pixel SVG badge representing each flower or foliage species */
export function PixelFlowerIcon({
  species,
  colors,
}: {
  species: FlowerSpeciesId;
  colors: [string, string, string];
}) {
  const [c1, c2, stem] = colors;
  return (
    <svg
      viewBox="0 0 16 16"
      className="w-8 h-8 shrink-0 pixel-canvas"
      shapeRendering="crispEdges"
    >
      {/* Stem */}
      <rect x="7" y="9" width="2" height="6" fill={stem} />
      <rect x="5" y="11" width="2" height="2" fill={stem} />
      <rect x="9" y="10" width="2" height="2" fill={stem} />

      {species === 'rose' && (
        <>
          <rect x="4" y="3" width="8" height="6" fill={c1} />
          <rect x="5" y="2" width="6" height="2" fill={c1} />
          <rect x="6" y="4" width="4" height="3" fill={c2} />
          <rect x="7" y="5" width="2" height="1" fill={c1} />
        </>
      )}
      {species === 'peony' && (
        <>
          <rect x="3" y="4" width="10" height="5" fill={c1} />
          <rect x="4" y="2" width="8" height="3" fill={c1} />
          <rect x="5" y="3" width="6" height="4" fill={c2} />
          <rect x="7" y="4" width="2" height="2" fill="#f6c33b" />
        </>
      )}
      {species === 'tulip' && (
        <>
          <rect x="5" y="3" width="6" height="6" fill={c1} />
          <rect x="4" y="2" width="2" height="5" fill={c1} />
          <rect x="10" y="2" width="2" height="5" fill={c1} />
          <rect x="6" y="2" width="4" height="2" fill={c2} />
        </>
      )}
      {species === 'sunflower' && (
        <>
          <rect x="3" y="3" width="10" height="6" fill={c1} />
          <rect x="4" y="2" width="8" height="8" fill={c1} />
          <rect x="6" y="4" width="4" height="4" fill={c2} />
        </>
      )}
      {species === 'lily' && (
        <>
          <rect x="2" y="4" width="12" height="3" fill={c1} />
          <rect x="5" y="2" width="6" height="6" fill={c1} />
          <rect x="6" y="4" width="4" height="2" fill={c2} />
          <rect x="7" y="3" width="2" height="2" fill="#f6c33b" />
        </>
      )}
      {species === 'hydrangea' && (
        <>
          <rect x="3" y="3" width="10" height="6" fill={c1} />
          <rect x="5" y="2" width="6" height="7" fill={c1} />
          <rect x="4" y="4" width="2" height="2" fill={c2} />
          <rect x="9" y="3" width="2" height="2" fill={c2} />
          <rect x="7" y="6" width="2" height="2" fill={c2} />
        </>
      )}
      {species === 'daisy' && (
        <>
          <rect x="4" y="3" width="8" height="6" fill={c1} />
          <rect x="6" y="2" width="4" height="8" fill={c1} />
          <rect x="6" y="5" width="4" height="2" fill={c2} />
        </>
      )}
      {species === 'lavender' && (
        <>
          <rect x="7" y="1" width="2" height="9" fill={c1} />
          <rect x="5" y="3" width="2" height="2" fill={c2} />
          <rect x="9" y="4" width="2" height="2" fill={c2} />
          <rect x="5" y="6" width="2" height="2" fill={c1} />
          <rect x="9" y="7" width="2" height="2" fill={c1} />
        </>
      )}
      {species === 'babys-breath' && (
        <>
          <rect x="4" y="2" width="2" height="2" fill={c1} />
          <rect x="10" y="2" width="2" height="2" fill={c1} />
          <rect x="7" y="4" width="2" height="2" fill={c1} />
          <rect x="3" y="6" width="2" height="2" fill={c1} />
          <rect x="11" y="6" width="2" height="2" fill={c1} />
          <rect x="7" y="5" width="2" height="1" fill={c2} />
        </>
      )}
      {species === 'eucalyptus' && (
        <>
          <rect x="4" y="2" width="3" height="2" fill={c1} />
          <rect x="9" y="3" width="3" height="2" fill={c2} />
          <rect x="4" y="5" width="3" height="2" fill={c2} />
          <rect x="9" y="6" width="3" height="2" fill={c1} />
          <rect x="7" y="1" width="2" height="2" fill={c1} />
        </>
      )}
      {species === 'fern' && (
        <>
          <rect x="7" y="1" width="2" height="8" fill={c1} />
          <rect x="4" y="7" width="8" height="2" fill={c1} />
          <rect x="5" y="5" width="6" height="1" fill={c2} />
          <rect x="6" y="3" width="4" height="1" fill={c2} />
        </>
      )}
    </svg>
  );
}

export function WrapperMotifPreview({
  motif,
  outerColor,
  motifColor,
}: {
  motif: WrapperMotif;
  outerColor: string;
  motifColor: string;
}) {
  return (
    <span
      className="w-6 h-6 inline-block border-2 border-[#4b3b36] shrink-0"
      style={{
        backgroundColor: outerColor,
        backgroundImage:
          motif === 'gingham'
            ? `linear-gradient(90deg, ${motifColor}88 50%, transparent 50%), linear-gradient(${motifColor}88 50%, transparent 50%)`
            : motif === 'stripes'
              ? `repeating-linear-gradient(45deg, ${motifColor}, ${motifColor} 3px, transparent 3px, transparent 6px)`
              : motif === 'polkadot'
                ? `radial-gradient(${motifColor} 2px, transparent 2px)`
                : motif === 'stars' || motif === 'floral'
                  ? `radial-gradient(${motifColor} 2px, transparent 2px)`
                  : motif === 'kraft'
                    ? `radial-gradient(${motifColor} 1px, transparent 1px)`
                    : 'none',
        backgroundSize:
          motif === 'gingham'
            ? '8px 8px'
            : motif === 'polkadot' || motif === 'stars' || motif === 'floral'
              ? '8px 8px'
              : motif === 'kraft'
                ? '5px 5px'
                : undefined,
      }}
    />
  );
}
