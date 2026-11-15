import { Trash2, X } from 'lucide-react';
import { STARTER_PRESETS } from '../data/catalog';
import { TRANSLATIONS } from '../i18n/translations';
import { BouquetState, Language, SavedBouquetEntry } from '../types/bouquet';

interface GalleryModalProps {
  lang: Language;
  savedEntries: SavedBouquetEntry[];
  onLoadPreset: (state: BouquetState) => void;
  onDeleteSaved: (id: string) => void;
  onClose: () => void;
}

export function GalleryModal({
  lang,
  savedEntries,
  onLoadPreset,
  onDeleteSaved,
  onClose,
}: GalleryModalProps) {
  const t = TRANSLATIONS[lang];

  return (
    <div className="fixed inset-0 bg-[#352b29]/55 z-50 flex items-center justify-center p-4">
      <div className="pixel-panel w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="px-4 py-3 border-b-2 border-[#4b3b36] bg-[#f2e8d7] flex items-center justify-between">
          <h2 className="text-base font-bold">{t.actions.gallery}</h2>
          <button type="button" onClick={onClose} className="pixel-btn p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto pixel-scroll space-y-5">
          {/* Starter Presets */}
          <section className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#70605a]">
              {t.labels.starterPresets}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {STARTER_PRESETS.map((preset) => (
                <div
                  key={preset.name}
                  className="border-2 border-[#4b3b36] bg-[#fffdf8] p-3 flex flex-col justify-between gap-2"
                >
                  <div>
                    <div className="flex gap-1 mb-2">
                      {preset.flowers.slice(0, 5).map((fl) => (
                        <span
                          key={fl.id}
                          className="w-4 h-4 border border-[#4b3b36]"
                          style={{ backgroundColor: fl.color }}
                        />
                      ))}
                    </div>
                    <div className="font-bold text-sm">{preset.name}</div>
                    <div className="text-[11px] text-[#70605a]">
                      {preset.flowers.length} {t.labels.stemCount}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onLoadPreset(structuredClone(preset));
                      onClose();
                    }}
                    className="pixel-btn pixel-btn-sage w-full py-1.5 text-xs font-bold"
                  >
                    {t.actions.loadBouquet}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Local Saved Bouquets */}
          <section className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#70605a]">
              {t.labels.savedBouquets}
            </h3>
            {savedEntries.length === 0 ? (
              <div className="p-4 border-2 border-dashed border-[#4b3b36]/50 text-xs text-[#70605a] text-center">
                {t.labels.noSavedYet}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {savedEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="border-2 border-[#4b3b36] bg-[#fffdf8] p-2.5 flex gap-3 items-center"
                  >
                    {entry.thumbnail ? (
                      <img
                        src={entry.thumbnail}
                        alt={entry.state.name}
                        className="w-16 h-16 object-cover border-2 border-[#4b3b36] bg-[#f4ecdc] pixel-canvas shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 border-2 border-[#4b3b36] bg-[#f4ecdc] shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">{entry.state.name}</div>
                      <div className="text-[11px] text-[#70605a]">
                        {entry.state.flowers.length} {t.labels.stemCount} •{' '}
                        {new Date(entry.savedAt).toLocaleDateString()}
                      </div>
                      <div className="flex gap-1.5 mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            onLoadPreset(structuredClone(entry.state));
                            onClose();
                          }}
                          className="pixel-btn pixel-btn-primary px-2.5 py-1 text-xs font-bold"
                        >
                          {t.actions.loadBouquet}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteSaved(entry.id)}
                          className="pixel-btn px-2 py-1 text-xs text-[#b9324e]"
                          title={t.actions.deleteSaved}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
