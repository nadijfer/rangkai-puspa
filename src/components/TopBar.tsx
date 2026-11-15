import {
  BookmarkPlus,
  FolderHeart,
  RotateCcw,
  Share2,
  Sparkles,
  Undo2,
  Redo2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';
import { Language, PixelDensity } from '../types/bouquet';

interface TopBarProps {
  lang: Language;
  pixelDensity: PixelDensity;
  soundEnabled: boolean;
  canUndo: boolean;
  canRedo: boolean;
  stemCount: number;
  onToggleLang: () => void;
  onChangePixelDensity: (d: PixelDensity) => void;
  onToggleSound: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onAutoArrange: () => void;
  onResetCamera: () => void;
  onSaveGallery: () => void;
  onOpenGallery: () => void;
  onOpenShare: () => void;
}

export function TopBar({
  lang,
  pixelDensity,
  soundEnabled,
  canUndo,
  canRedo,
  stemCount,
  onToggleLang,
  onChangePixelDensity,
  onToggleSound,
  onUndo,
  onRedo,
  onAutoArrange,
  onResetCamera,
  onSaveGallery,
  onOpenGallery,
  onOpenShare,
}: TopBarProps) {
  const t = TRANSLATIONS[lang];

  return (
    <header className="h-14 px-3 bg-[#fffaf0] border-b-2 border-[#4b3b36] flex items-center justify-between gap-2 shrink-0 z-20">
      {/* Brand */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 bg-[#f7d6df] border-2 border-[#4b3b36] flex items-center justify-center shrink-0">
          <svg viewBox="0 0 16 16" className="w-6 h-6 pixel-canvas" shapeRendering="crispEdges">
            <rect x="7" y="8" width="2" height="7" fill="#4c8c57" />
            <rect x="4" y="10" width="3" height="2" fill="#4c8c57" />
            <rect x="9" y="9" width="3" height="2" fill="#4c8c57" />
            <rect x="4" y="3" width="8" height="6" fill="#e55c7a" />
            <rect x="6" y="2" width="4" height="2" fill="#f59bb0" />
            <rect x="7" y="5" width="2" height="2" fill="#f7d560" />
          </svg>
        </div>
        <div className="leading-tight truncate">
          <h1 className="text-base sm:text-lg font-bold tracking-tight truncate">{t.appTitle}</h1>
          <p className="text-[11px] text-[#70605a] hidden sm:block">
            {t.subtitle} • {stemCount} {t.labels.stemCount}
          </p>
        </div>
      </div>

      {/* Center Studio Tools */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          title={t.actions.undo}
          className="pixel-btn px-2 py-1.5 text-xs flex items-center gap-1"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          title={t.actions.redo}
          className="pixel-btn px-2 py-1.5 text-xs flex items-center gap-1"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onAutoArrange}
          disabled={stemCount === 0}
          className="pixel-btn pixel-btn-sage px-2.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden md:inline">{t.actions.autoArrange}</span>
        </button>
        <button
          type="button"
          onClick={onResetCamera}
          title={t.actions.resetCamera}
          className="pixel-btn px-2 py-1.5 text-xs flex items-center gap-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Pixel Density Cycle */}
        <div className="hidden lg:flex items-center border-2 border-[#4b3b36] bg-[#f2e8d7] text-[11px] font-semibold">
          {(['chunky', 'balanced', 'fine'] as PixelDensity[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onChangePixelDensity(d)}
              className={`px-2 py-1 cursor-pointer transition-colors ${
                pixelDensity === d ? 'bg-[#4b3b36] text-[#fffaf0]' : 'hover:bg-[#e5d8c3]'
              }`}
            >
              {t.labels[d]}
            </button>
          ))}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onToggleSound}
          title="Sound FX"
          className="pixel-btn px-2 py-1.5 text-xs hidden sm:flex items-center"
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>
        <button
          type="button"
          onClick={onToggleLang}
          className="pixel-btn px-2 py-1.5 text-xs font-bold uppercase"
          title="Switch Language (ID/EN)"
        >
          {lang}
        </button>
        <button
          type="button"
          onClick={onSaveGallery}
          title={t.actions.saveGallery}
          className="pixel-btn px-2.5 py-1.5 text-xs flex items-center gap-1"
        >
          <BookmarkPlus className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onOpenGallery}
          title={t.actions.gallery}
          className="pixel-btn px-2.5 py-1.5 text-xs font-semibold flex items-center gap-1"
        >
          <FolderHeart className="w-3.5 h-3.5" />
          <span className="hidden md:inline">{t.actions.gallery}</span>
        </button>
        <button
          type="button"
          onClick={onOpenShare}
          className="pixel-btn pixel-btn-primary px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t.actions.shareExport}</span>
        </button>
      </div>
    </header>
  );
}
