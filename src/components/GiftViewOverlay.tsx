import { Sparkles, Wand2 } from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';
import { BouquetState, Language } from '../types/bouquet';

interface GiftViewOverlayProps {
  lang: Language;
  bouquet: BouquetState;
  onToggleLang: () => void;
  onRemix: () => void;
}

export function GiftViewOverlay({
  lang,
  bouquet,
  onToggleLang,
  onRemix,
}: GiftViewOverlayProps) {
  const t = TRANSLATIONS[lang];
  const hasMessage =
    bouquet.card.to.trim() || bouquet.card.from.trim() || bouquet.card.message.trim();

  return (
    <>
      {/* Top Floating Banner */}
      <div className="fixed top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
        <div className="pixel-panel px-3.5 py-2 flex items-center gap-2 pointer-events-auto">
          <Sparkles className="w-4 h-4 text-[#d95d79]" />
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[#70605a] font-bold">
              {t.labels.giftBadge}
            </div>
            <div className="text-sm font-bold">{bouquet.name}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={onToggleLang}
            className="pixel-btn px-2.5 py-2 text-xs font-bold uppercase"
          >
            {lang}
          </button>
          <button
            type="button"
            onClick={onRemix}
            className="pixel-btn pixel-btn-primary px-3.5 py-2 text-xs font-bold flex items-center gap-1.5"
          >
            <Wand2 className="w-4 h-4" />
            {t.actions.remixBouquet}
          </button>
        </div>
      </div>

      {/* Bottom Gift Note Card */}
      {hasMessage && (
        <div className="fixed bottom-5 left-4 right-4 flex justify-center pointer-events-none z-20">
          <div className="pixel-panel p-4 max-w-md w-full pointer-events-auto space-y-2 bg-[#fffdf7]/95">
            {bouquet.card.to.trim() && (
              <div className="text-xs font-bold text-[#d95d79]">
                {t.labels.cardTo}: {bouquet.card.to}
              </div>
            )}
            {bouquet.card.message.trim() && (
              <p className="text-sm leading-relaxed text-[#352b29] whitespace-pre-wrap">
                {bouquet.card.message}
              </p>
            )}
            {bouquet.card.from.trim() && (
              <div className="text-xs font-semibold text-right text-[#70605a]">
                — {bouquet.card.from}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
