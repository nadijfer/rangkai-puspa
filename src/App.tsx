import { useCallback, useEffect, useRef, useState } from 'react';
import { FlowerInspector } from './components/FlowerInspector';
import { GalleryModal } from './components/GalleryModal';
import { GiftViewOverlay } from './components/GiftViewOverlay';
import { ShareExportModal } from './components/ShareExportModal';
import { StudioSidebar } from './components/StudioSidebar';
import { TopBar } from './components/TopBar';
import { SPECIES_BY_ID, STARTER_PRESETS } from './data/catalog';
import { BouquetViewport, BouquetViewportHandle } from './engine/BouquetViewport';
import { TRANSLATIONS } from './i18n/translations';
import {
  BouquetState,
  FlowerSpeciesId,
  GiftCardConfig,
  Language,
  PetalMotif,
  PixelDensity,
  PlacedFlower,
  SavedBouquetEntry,
  WrapperConfig,
} from './types/bouquet';
import { autoArrangeFlowers, clampToBouquetDome } from './utils/autoArrange';
import {
  deleteBouquetFromGallery,
  listSavedBouquets,
  saveBouquetToGallery,
} from './utils/galleryStorage';
import { decodeBouquetFromHash } from './utils/shareCodec';
import { soundFx } from './utils/soundFx';

function getInitialSetup(): { initialBouquet: BouquetState; isGift: boolean } {
  if (typeof window !== 'undefined' && window.location.hash.includes('b=')) {
    const decoded = decodeBouquetFromHash(window.location.hash);
    if (decoded) {
      return { initialBouquet: decoded, isGift: true };
    }
  }
  return { initialBouquet: structuredClone(STARTER_PRESETS[0]), isGift: false };
}

export function App() {
  const [{ initialBouquet, isGift }] = useState(getInitialSetup);
  const [giftMode, setGiftMode] = useState(isGift);
  const [lang, setLang] = useState<Language>('id');
  const [pixelDensity, setPixelDensity] = useState<PixelDensity>('balanced');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Undo/Redo history stack
  const [history, setHistory] = useState<BouquetState[]>([initialBouquet]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const bouquet = history[historyIdx];

  const [selectedFlowerId, setSelectedFlowerId] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [savedEntries, setSavedEntries] = useState<SavedBouquetEntry[]>(() => listSavedBouquets());
  const [toast, setToast] = useState<string | null>(null);

  const viewportRef = useRef<BouquetViewportHandle>(null);
  const dragSnapshotRef = useRef<BouquetState | null>(null);

  const t = TRANSLATIONS[lang];

  const commitState = useCallback(
    (updater: (prev: BouquetState) => BouquetState) => {
      setHistory((prevHist) => {
        const current = prevHist[historyIdx];
        const next = updater(current);
        const sliced = prevHist.slice(0, historyIdx + 1);
        const merged = [...sliced, next].slice(-40);
        setHistoryIdx(merged.length - 1);
        return merged;
      });
    },
    [historyIdx],
  );

  /** Mutates the active state entry in-place for live 60fps dragging before committing */
  const previewState = useCallback(
    (updater: (prev: BouquetState) => BouquetState) => {
      setHistory((prevHist) => {
        if (!dragSnapshotRef.current) {
          dragSnapshotRef.current = prevHist[historyIdx];
        }
        const next = updater(prevHist[historyIdx]);
        const copy = [...prevHist];
        copy[historyIdx] = next;
        return copy;
      });
    },
    [historyIdx],
  );

  const finalizePreviewCommit = useCallback(
    (updater: (prev: BouquetState) => BouquetState) => {
      const baseSnapshot = dragSnapshotRef.current;
      dragSnapshotRef.current = null;
      setHistory((prevHist) => {
        const baseline = baseSnapshot ?? prevHist[historyIdx];
        const next = updater(prevHist[historyIdx]);
        const sliced = prevHist.slice(0, historyIdx);
        const merged = [...sliced, baseline, next].slice(-40);
        setHistoryIdx(merged.length - 1);
        return merged;
      });
    },
    [historyIdx],
  );

  // Hash navigation listener
  useEffect(() => {
    const onHashChange = () => {
      if (window.location.hash.includes('b=')) {
        const decoded = decodeBouquetFromHash(window.location.hash);
        if (decoded) {
          setHistory([decoded]);
          setHistoryIdx(0);
          setSelectedFlowerId(null);
          setGiftMode(true);
        }
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleUndo = useCallback(() => {
    if (historyIdx > 0) {
      setHistoryIdx((i) => i - 1);
      soundFx.playSnip();
    }
  }, [historyIdx]);

  const handleRedo = useCallback(() => {
    if (historyIdx < history.length - 1) {
      setHistoryIdx((i) => i + 1);
      soundFx.playPop(1);
    }
  }, [historyIdx, history.length]);

  const handleRemoveSelected = useCallback(() => {
    if (!selectedFlowerId) return;
    soundFx.playSnip();
    commitState((prev) => ({
      ...prev,
      flowers: prev.flowers.filter((f) => f.id !== selectedFlowerId),
    }));
    setSelectedFlowerId(null);
  }, [selectedFlowerId, commitState]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (giftMode) return;
      const target = e.target as HTMLElement | null;
      const isEditingText =
        target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;
      if (isEditingText) return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedFlowerId) {
        e.preventDefault();
        handleRemoveSelected();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [giftMode, handleUndo, handleRedo, selectedFlowerId, handleRemoveSelected]);

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  const handleAddFlower = (specInput: {
    species: FlowerSpeciesId;
    color: string;
    secondaryColor: string;
    motif: PetalMotif;
  }) => {
    const spec = SPECIES_BY_ID[specInput.species];
    const count = bouquet.flowers.length;
    const angle = count * 2.39996;
    const radius = count === 0 ? 0 : Math.min(0.65, 0.16 + count * 0.045);
    const pos = clampToBouquetDome([
      Math.cos(angle) * radius,
      spec.recommendedY + ((count % 3) - 1) * 0.07,
      Math.sin(angle) * radius * 0.85,
    ]);

    const newFlower: PlacedFlower = {
      id: `fl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      species: specInput.species,
      color: specInput.color,
      secondaryColor: specInput.secondaryColor,
      motif: specInput.motif,
      position: pos,
      scale: 1,
      spin: ((count % 5) - 2) * 0.25,
      tilt: 0,
    };

    soundFx.playPop(count % 5);
    commitState((prev) => ({
      ...prev,
      flowers: [...prev.flowers, newFlower],
    }));
    setSelectedFlowerId(newFlower.id);
  };

  const handleMoveFlower = useCallback(
    (id: string, nextPos: [number, number, number], commit: boolean) => {
      const apply = (prev: BouquetState): BouquetState => ({
        ...prev,
        flowers: prev.flowers.map((f) => (f.id === id ? { ...f, position: nextPos } : f)),
      });
      if (commit) {
        finalizePreviewCommit(apply);
        soundFx.playPop(0);
      } else {
        previewState(apply);
      }
    },
    [previewState, finalizePreviewCommit],
  );

  const handleUpdateFlower = useCallback(
    (id: string, patch: Partial<PlacedFlower>, commit: boolean) => {
      const apply = (prev: BouquetState): BouquetState => ({
        ...prev,
        flowers: prev.flowers.map((f) => (f.id === id ? { ...f, ...patch } : f)),
      });
      if (commit) finalizePreviewCommit(apply);
      else previewState(apply);
    },
    [previewState, finalizePreviewCommit],
  );

  const handleDuplicateSelected = () => {
    const sel = bouquet.flowers.find((f) => f.id === selectedFlowerId);
    if (!sel) return;
    const clone: PlacedFlower = {
      ...sel,
      id: `fl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      position: clampToBouquetDome([
        sel.position[0] + 0.18,
        sel.position[1] + 0.05,
        sel.position[2] + 0.14,
      ]),
    };
    soundFx.playPop(2);
    commitState((prev) => ({
      ...prev,
      flowers: [...prev.flowers, clone],
    }));
    setSelectedFlowerId(clone.id);
  };

  const handleAutoArrange = () => {
    soundFx.playChime();
    commitState((prev) => ({
      ...prev,
      flowers: autoArrangeFlowers(prev.flowers),
    }));
  };

  const handleChangeWrapper = (patch: Partial<WrapperConfig>) => {
    soundFx.playRustle();
    commitState((prev) => ({
      ...prev,
      wrapper: { ...prev.wrapper, ...patch },
    }));
  };

  const handleChangeCard = (patch: Partial<GiftCardConfig>) => {
    commitState((prev) => ({
      ...prev,
      card: { ...prev.card, ...patch },
    }));
  };

  const handleSaveGallery = () => {
    const thumb = viewportRef.current?.capturePng({ width: 240, height: 240 }) ?? '';
    saveBouquetToGallery(bouquet, thumb);
    setSavedEntries(listSavedBouquets());
    soundFx.playChime();
    showToastMsg(t.actions.savedToast);
  };

  const handleRemix = () => {
    setGiftMode(false);
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    soundFx.playChime();
  };

  const selectedFlower = bouquet.flowers.find((f) => f.id === selectedFlowerId) ?? null;

  return (
    <div className="w-full h-full flex flex-col bg-[#f4ecdc] overflow-hidden">
      {!giftMode && (
        <TopBar
          lang={lang}
          pixelDensity={pixelDensity}
          soundEnabled={soundEnabled}
          canUndo={historyIdx > 0}
          canRedo={historyIdx < history.length - 1}
          stemCount={bouquet.flowers.length}
          onToggleLang={() => setLang((l) => (l === 'id' ? 'en' : 'id'))}
          onChangePixelDensity={setPixelDensity}
          onToggleSound={() => {
            const next = !soundEnabled;
            soundFx.enabled = next;
            setSoundEnabled(next);
          }}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onAutoArrange={handleAutoArrange}
          onResetCamera={() => viewportRef.current?.resetCamera()}
          onSaveGallery={handleSaveGallery}
          onOpenGallery={() => {
            setSavedEntries(listSavedBouquets());
            setShowGallery(true);
          }}
          onOpenShare={() => setShowShare(true)}
        />
      )}

      {/* Main Studio Area */}
      <div className="flex-1 flex flex-col-reverse md:flex-row min-h-0 relative">
        {!giftMode && (
          <StudioSidebar
            lang={lang}
            bouquetName={bouquet.name}
            wrapper={bouquet.wrapper}
            card={bouquet.card}
            selectedFlower={selectedFlower}
            onChangeName={(name) => commitState((prev) => ({ ...prev, name }))}
            onAddFlower={handleAddFlower}
            onUpdateSelectedFlower={(patch, commit) => {
              if (selectedFlowerId) handleUpdateFlower(selectedFlowerId, patch, commit);
            }}
            onChangeWrapper={handleChangeWrapper}
            onChangeCard={handleChangeCard}
            onClearFlowers={() => {
              soundFx.playSnip();
              commitState((prev) => ({ ...prev, flowers: [] }));
              setSelectedFlowerId(null);
            }}
          />
        )}

        {/* 3D Pixelated Viewport */}
        <main className="flex-1 relative min-h-0">
          <BouquetViewport
            ref={viewportRef}
            bouquet={bouquet}
            selectedFlowerId={selectedFlowerId}
            pixelDensity={pixelDensity}
            readOnly={giftMode}
            autoRotate={giftMode}
            onSelectFlower={setSelectedFlowerId}
            onMoveFlower={handleMoveFlower}
          />

          {/* Floating Hint Pill */}
          {!giftMode && (
            <div className="absolute bottom-3 left-3 right-3 flex justify-center pointer-events-none">
              <div className="bg-[#fffaf0]/90 border-2 border-[#4b3b36] px-3 py-1 text-[11px] font-semibold text-[#5c4b45] shadow-sm text-center">
                {t.labels.dragHint}
              </div>
            </div>
          )}

          {/* Selected Flower Inspector */}
          {!giftMode && selectedFlower && (
            <div className="absolute top-3 right-3">
              <FlowerInspector
                flower={selectedFlower}
                lang={lang}
                onUpdate={(patch, commit) =>
                  handleUpdateFlower(selectedFlower.id, patch, commit)
                }
                onDuplicate={handleDuplicateSelected}
                onRemove={handleRemoveSelected}
                onClose={() => setSelectedFlowerId(null)}
              />
            </div>
          )}
        </main>
      </div>

      {/* Gift Mode Presentation Overlay */}
      {giftMode && (
        <GiftViewOverlay
          lang={lang}
          bouquet={bouquet}
          onToggleLang={() => setLang((l) => (l === 'id' ? 'en' : 'id'))}
          onRemix={handleRemix}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-50 pixel-panel px-4 py-2 text-xs font-bold bg-[#588a63] text-[#fffaf5]">
          {toast}
        </div>
      )}

      {/* Gallery Modal */}
      {showGallery && (
        <GalleryModal
          lang={lang}
          savedEntries={savedEntries}
          onLoadPreset={(preset) => {
            soundFx.playChime();
            commitState(() => preset);
            setSelectedFlowerId(null);
          }}
          onDeleteSaved={(id) => {
            soundFx.playSnip();
            setSavedEntries(deleteBouquetFromGallery(id));
          }}
          onClose={() => setShowGallery(false)}
        />
      )}

      {/* Share & Export Modal */}
      {showShare && (
        <ShareExportModal
          lang={lang}
          bouquet={bouquet}
          onCapturePng={(transparent) =>
            viewportRef.current?.capturePng({ transparent, width: 960 }) ?? ''
          }
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}

export default App;
