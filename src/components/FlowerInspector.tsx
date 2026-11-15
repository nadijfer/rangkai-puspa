import { Copy, Trash2, X } from 'lucide-react';
import { SPECIES_BY_ID } from '../data/catalog';
import { TRANSLATIONS } from '../i18n/translations';
import { Language, PlacedFlower } from '../types/bouquet';
import { clampToBouquetDome } from '../utils/autoArrange';

interface FlowerInspectorProps {
  flower: PlacedFlower;
  lang: Language;
  onUpdate: (patch: Partial<PlacedFlower>, commit: boolean) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onClose: () => void;
}

export function FlowerInspector({
  flower,
  lang,
  onUpdate,
  onDuplicate,
  onRemove,
  onClose,
}: FlowerInspectorProps) {
  const t = TRANSLATIONS[lang];
  const spec = SPECIES_BY_ID[flower.species];

  const updatePos = (axis: 1 | 2, value: number, commit: boolean) => {
    const next: [number, number, number] = [...flower.position];
    next[axis] = value;
    onUpdate({ position: clampToBouquetDome(next) }, commit);
  };

  return (
    <div className="pixel-panel p-3 w-64 space-y-2.5 text-xs z-10">
      <div className="flex items-center justify-between border-b-2 border-[#4b3b36]/20 pb-1.5">
        <div className="font-bold flex items-center gap-1.5">
          <span
            className="w-3 h-3 inline-block border border-[#4b3b36]"
            style={{ backgroundColor: flower.color }}
          />
          <span>{spec.name[lang]}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-0.5 hover:bg-[#f2e8d7] cursor-pointer"
          aria-label={t.actions.close}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Height */}
      <label className="block space-y-0.5">
        <div className="flex justify-between text-[11px] text-[#70605a]">
          <span>{t.labels.height}</span>
          <span className="font-pixel-mono text-sm">{flower.position[1].toFixed(2)}</span>
        </div>
        <input
          type="range"
          min={0.75}
          max={1.95}
          step={0.02}
          value={flower.position[1]}
          onChange={(e) => updatePos(1, parseFloat(e.target.value), false)}
          onMouseUp={(e) => updatePos(1, parseFloat((e.target as HTMLInputElement).value), true)}
          onTouchEnd={(e) => updatePos(1, parseFloat((e.target as HTMLInputElement).value), true)}
          className="w-full accent-[#d95d79]"
        />
      </label>

      {/* Depth (Front / Back) */}
      <label className="block space-y-0.5">
        <div className="flex justify-between text-[11px] text-[#70605a]">
          <span>{t.labels.depth}</span>
          <span className="font-pixel-mono text-sm">{flower.position[2].toFixed(2)}</span>
        </div>
        <input
          type="range"
          min={-0.75}
          max={0.75}
          step={0.02}
          value={flower.position[2]}
          onChange={(e) => updatePos(2, parseFloat(e.target.value), false)}
          onMouseUp={(e) => updatePos(2, parseFloat((e.target as HTMLInputElement).value), true)}
          onTouchEnd={(e) => updatePos(2, parseFloat((e.target as HTMLInputElement).value), true)}
          className="w-full accent-[#d95d79]"
        />
      </label>

      {/* Spin */}
      <label className="block space-y-0.5">
        <div className="flex justify-between text-[11px] text-[#70605a]">
          <span>{t.labels.spin}</span>
          <span className="font-pixel-mono text-sm">
            {Math.round((flower.spin * 180) / Math.PI)}°
          </span>
        </div>
        <input
          type="range"
          min={-3.14}
          max={3.14}
          step={0.08}
          value={flower.spin}
          onChange={(e) => onUpdate({ spin: parseFloat(e.target.value) }, false)}
          onMouseUp={(e) =>
            onUpdate({ spin: parseFloat((e.target as HTMLInputElement).value) }, true)
          }
          onTouchEnd={(e) =>
            onUpdate({ spin: parseFloat((e.target as HTMLInputElement).value) }, true)
          }
          className="w-full accent-[#588a63]"
        />
      </label>

      {/* Scale */}
      <label className="block space-y-0.5">
        <div className="flex justify-between text-[11px] text-[#70605a]">
          <span>{t.labels.scale}</span>
          <span className="font-pixel-mono text-sm">{flower.scale.toFixed(2)}x</span>
        </div>
        <input
          type="range"
          min={0.75}
          max={1.35}
          step={0.03}
          value={flower.scale}
          onChange={(e) => onUpdate({ scale: parseFloat(e.target.value) }, false)}
          onMouseUp={(e) =>
            onUpdate({ scale: parseFloat((e.target as HTMLInputElement).value) }, true)
          }
          onTouchEnd={(e) =>
            onUpdate({ scale: parseFloat((e.target as HTMLInputElement).value) }, true)
          }
          className="w-full accent-[#588a63]"
        />
      </label>

      <div className="flex gap-1.5 pt-1">
        <button
          type="button"
          onClick={onDuplicate}
          className="pixel-btn flex-1 py-1.5 font-semibold flex items-center justify-center gap-1"
        >
          <Copy className="w-3.5 h-3.5" />
          {t.actions.duplicate}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="pixel-btn px-2.5 py-1.5 font-semibold text-[#b9324e] flex items-center justify-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          {t.actions.remove}
        </button>
      </div>
    </div>
  );
}
