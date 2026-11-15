import { useState } from 'react';
import { Flower2, Gift, Mail, Plus, Wand2 } from 'lucide-react';
import {
  FLOWER_SPECIES,
  PETAL_MOTIFS,
  RIBBON_STYLES,
  SPECIES_BY_ID,
  WRAPPER_MOTIFS,
  WRAPPER_SHAPES,
} from '../data/catalog';
import { TRANSLATIONS } from '../i18n/translations';
import {
  FlowerCategory,
  FlowerSpeciesId,
  GiftCardConfig,
  Language,
  PetalMotif,
  PlacedFlower,
  WrapperConfig,
} from '../types/bouquet';
import { PixelColorPicker, PixelFlowerIcon, WrapperMotifPreview } from './PixelSwatchPicker';

type TabId = 'flowers' | 'wrapper' | 'card';

interface StudioSidebarProps {
  lang: Language;
  bouquetName: string;
  wrapper: WrapperConfig;
  card: GiftCardConfig;
  selectedFlower: PlacedFlower | null;
  onChangeName: (name: string) => void;
  onAddFlower: (spec: {
    species: FlowerSpeciesId;
    color: string;
    secondaryColor: string;
    motif: PetalMotif;
  }) => void;
  onUpdateSelectedFlower: (patch: Partial<PlacedFlower>, commit: boolean) => void;
  onChangeWrapper: (patch: Partial<WrapperConfig>) => void;
  onChangeCard: (patch: Partial<GiftCardConfig>) => void;
  onClearFlowers: () => void;
}

export function StudioSidebar({
  lang,
  bouquetName,
  wrapper,
  card,
  selectedFlower,
  onChangeName,
  onAddFlower,
  onUpdateSelectedFlower,
  onChangeWrapper,
  onChangeCard,
  onClearFlowers,
}: StudioSidebarProps) {
  const t = TRANSLATIONS[lang];
  const [activeTab, setActiveTab] = useState<TabId>('flowers');
  const [catFilter, setCatFilter] = useState<'all' | FlowerCategory>('all');

  // Brush settings for adding new flowers
  const [draftSpecies, setDraftSpecies] = useState<FlowerSpeciesId>('rose');
  const [draftColor, setDraftColor] = useState('#e55c7a');
  const [draftSecondary, setDraftSecondary] = useState('#ffd6e0');
  const [draftMotif, setDraftMotif] = useState<PetalMotif>('ombre');

  const handlePickSpecies = (id: FlowerSpeciesId) => {
    const spec = SPECIES_BY_ID[id];
    setDraftSpecies(id);
    setDraftColor(spec.defaultColor);
    setDraftSecondary(spec.defaultSecondary);
    setDraftMotif(spec.defaultMotif);
  };

  // When a flower is selected, color/motif controls can edit it directly OR user can add new
  const activeColor = selectedFlower ? selectedFlower.color : draftColor;
  const activeSecondary = selectedFlower ? selectedFlower.secondaryColor : draftSecondary;
  const activeMotif = selectedFlower ? selectedFlower.motif : draftMotif;

  const handleColorChange = (hex: string) => {
    setDraftColor(hex);
    if (selectedFlower) onUpdateSelectedFlower({ color: hex }, true);
  };

  const handleSecondaryChange = (hex: string) => {
    setDraftSecondary(hex);
    if (selectedFlower) onUpdateSelectedFlower({ secondaryColor: hex }, true);
  };

  const handleMotifChange = (motif: PetalMotif) => {
    setDraftMotif(motif);
    if (selectedFlower) onUpdateSelectedFlower({ motif }, true);
  };

  const filteredSpecies = FLOWER_SPECIES.filter(
    (s) => catFilter === 'all' || s.category === catFilter,
  );

  return (
    <aside className="w-full md:w-[360px] lg:w-[390px] h-[44vh] md:h-full bg-[#fffaf0] border-t-2 md:border-t-0 md:border-r-2 border-[#4b3b36] flex flex-col shrink-0 z-10">
      {/* Tabs */}
      <div className="grid grid-cols-3 border-b-2 border-[#4b3b36] bg-[#f2e8d7]">
        {(
          [
            { id: 'flowers', icon: Flower2, label: t.tabs.flowers },
            { id: 'wrapper', icon: Gift, label: t.tabs.wrapper },
            { id: 'card', icon: Mail, label: t.tabs.card },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`py-2.5 px-2 text-xs font-bold flex items-center justify-center gap-1.5 border-r-2 last:border-r-0 border-[#4b3b36] cursor-pointer transition-colors ${
                active ? 'bg-[#fffaf0] text-[#d95d79]' : 'text-[#5c4b45] hover:bg-[#ebe0cd]'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto pixel-scroll p-3.5 space-y-4">
        {activeTab === 'flowers' && (
          <>
            {/* Category filter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">{t.labels.species}</span>
                <button
                  type="button"
                  onClick={onClearFlowers}
                  className="text-[11px] text-[#9b3d52] underline cursor-pointer"
                >
                  {t.actions.clearAll}
                </button>
              </div>
              <div className="flex gap-1">
                {(
                  [
                    ['all', t.labels.categoryAll],
                    ['focal', t.labels.categoryFocal],
                    ['accent', t.labels.categoryAccent],
                    ['foliage', t.labels.categoryFoliage],
                  ] as const
                ).map(([cat, label]) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCatFilter(cat)}
                    className={`px-2 py-1 text-[11px] font-semibold border-2 border-[#4b3b36] cursor-pointer ${
                      catFilter === cat
                        ? 'bg-[#4b3b36] text-[#fffaf0]'
                        : 'bg-[#f2e8d7] hover:bg-[#e5d8c3]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Species Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 gap-2">
              {filteredSpecies.map((spec) => {
                const active = draftSpecies === spec.id;
                return (
                  <button
                    key={spec.id}
                    type="button"
                    onClick={() => handlePickSpecies(spec.id)}
                    onDoubleClick={() =>
                      onAddFlower({
                        species: spec.id,
                        color: spec.defaultColor,
                        secondaryColor: spec.defaultSecondary,
                        motif: spec.defaultMotif,
                      })
                    }
                    className={`p-2 border-2 border-[#4b3b36] flex flex-col items-center gap-1 text-center cursor-pointer transition-all ${
                      active
                        ? 'bg-[#fde9ee] ring-2 ring-[#d95d79] -translate-y-0.5'
                        : 'bg-[#fffdf8] hover:bg-[#f6efe2]'
                    }`}
                  >
                    <PixelFlowerIcon species={spec.id} colors={spec.pixelIconColors} />
                    <span className="text-[11px] font-semibold leading-tight">
                      {spec.name[lang]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Add CTA */}
            <button
              type="button"
              onClick={() =>
                onAddFlower({
                  species: draftSpecies,
                  color: draftColor,
                  secondaryColor: draftSecondary,
                  motif: draftMotif,
                })
              }
              className="pixel-btn pixel-btn-primary w-full py-2.5 text-sm font-bold flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t.actions.addFlower} ({SPECIES_BY_ID[draftSpecies].name[lang]})
            </button>

            {/* Color & Motif Customizer */}
            <div className="p-3 bg-[#f6efe2] border-2 border-[#4b3b36] space-y-3">
              {selectedFlower && (
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#d95d79] bg-[#fffaf0] px-2 py-1 border border-[#4b3b36]">
                  <Wand2 className="w-3 h-3" />
                  <span>
                    {t.actions.applySelected}: {SPECIES_BY_ID[selectedFlower.species].name[lang]}
                  </span>
                </div>
              )}

              <PixelColorPicker
                label={t.labels.primaryColor}
                value={activeColor}
                onChange={handleColorChange}
                lang={lang}
              />

              {/* Petal Motif Selector */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold block">{t.labels.petalMotif}</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {PETAL_MOTIFS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleMotifChange(m.id)}
                      className={`px-2 py-1.5 text-xs font-semibold border-2 border-[#4b3b36] cursor-pointer ${
                        activeMotif === m.id
                          ? 'bg-[#588a63] text-[#fffaf5]'
                          : 'bg-[#fffaf0] hover:bg-[#eee2ce]'
                      }`}
                    >
                      {m.name[lang]}
                    </button>
                  ))}
                </div>
              </div>

              {activeMotif !== 'solid' && (
                <PixelColorPicker
                  label={t.labels.secondaryColor}
                  value={activeSecondary}
                  onChange={handleSecondaryChange}
                  lang={lang}
                />
              )}
            </div>
          </>
        )}

        {activeTab === 'wrapper' && (
          <>
            {/* Wrapper Shapes */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold block">{t.labels.wrapperShape}</span>
              <div className="grid grid-cols-2 gap-1.5">
                {WRAPPER_SHAPES.map((ws) => (
                  <button
                    key={ws.id}
                    type="button"
                    onClick={() => onChangeWrapper({ shape: ws.id })}
                    className={`px-2.5 py-2 text-xs font-semibold border-2 border-[#4b3b36] cursor-pointer text-left ${
                      wrapper.shape === ws.id
                        ? 'bg-[#d95d79] text-[#fffaf5]'
                        : 'bg-[#fffdf8] hover:bg-[#f2e8d7]'
                    }`}
                  >
                    {ws.name[lang]}
                  </button>
                ))}
              </div>
            </div>

            {/* Outer & Inner Colors */}
            <div className="p-3 bg-[#f6efe2] border-2 border-[#4b3b36] space-y-3">
              <PixelColorPicker
                label={t.labels.outerColor}
                value={wrapper.outerColor}
                onChange={(outerColor) => onChangeWrapper({ outerColor })}
                lang={lang}
              />
              <PixelColorPicker
                label={t.labels.innerColor}
                value={wrapper.innerColor}
                onChange={(innerColor) => onChangeWrapper({ innerColor })}
                lang={lang}
              />
            </div>

            {/* Wrapper Pixel Motifs */}
            <div className="p-3 bg-[#f6efe2] border-2 border-[#4b3b36] space-y-3">
              <span className="text-xs font-bold block">{t.labels.wrapperMotif}</span>
              <div className="grid grid-cols-2 gap-1.5">
                {WRAPPER_MOTIFS.map((wm) => (
                  <button
                    key={wm.id}
                    type="button"
                    onClick={() => onChangeWrapper({ motif: wm.id })}
                    className={`px-2 py-1.5 text-xs font-semibold border-2 border-[#4b3b36] cursor-pointer flex items-center gap-2 ${
                      wrapper.motif === wm.id
                        ? 'bg-[#4b3b36] text-[#fffaf0]'
                        : 'bg-[#fffaf0] hover:bg-[#eee2ce]'
                    }`}
                  >
                    <WrapperMotifPreview
                      motif={wm.id}
                      outerColor={wrapper.outerColor}
                      motifColor={wrapper.motifColor}
                    />
                    <span className="truncate">{wm.name[lang]}</span>
                  </button>
                ))}
              </div>

              {wrapper.motif !== 'solid' && (
                <PixelColorPicker
                  label={t.labels.motifColor}
                  value={wrapper.motifColor}
                  onChange={(motifColor) => onChangeWrapper({ motifColor })}
                  lang={lang}
                />
              )}
            </div>

            {/* Ribbon & Tag */}
            <div className="p-3 bg-[#f6efe2] border-2 border-[#4b3b36] space-y-3">
              <span className="text-xs font-bold block">{t.labels.ribbonStyle}</span>
              <div className="grid grid-cols-3 gap-1.5">
                {RIBBON_STYLES.map((rs) => (
                  <button
                    key={rs.id}
                    type="button"
                    onClick={() => onChangeWrapper({ ribbonStyle: rs.id })}
                    className={`px-2 py-1.5 text-[11px] font-semibold border-2 border-[#4b3b36] cursor-pointer ${
                      wrapper.ribbonStyle === rs.id
                        ? 'bg-[#588a63] text-[#fffaf5]'
                        : 'bg-[#fffaf0] hover:bg-[#eee2ce]'
                    }`}
                  >
                    {rs.name[lang]}
                  </button>
                ))}
              </div>

              <PixelColorPicker
                label={t.labels.ribbonColor}
                value={wrapper.ribbonColor}
                onChange={(ribbonColor) => onChangeWrapper({ ribbonColor })}
                lang={lang}
              />

              <label className="block space-y-1">
                <span className="text-xs font-semibold block">{t.labels.tagText}</span>
                <input
                  type="text"
                  maxLength={16}
                  value={wrapper.tagText}
                  onChange={(e) => onChangeWrapper({ tagText: e.target.value })}
                  placeholder="Untukmu / For You"
                  className="pixel-input w-full text-xs"
                />
              </label>
            </div>
          </>
        )}

        {activeTab === 'card' && (
          <div className="space-y-3">
            <label className="block space-y-1">
              <span className="text-xs font-bold block">{t.labels.bouquetName}</span>
              <input
                type="text"
                maxLength={40}
                value={bouquetName}
                onChange={(e) => onChangeName(e.target.value)}
                className="pixel-input w-full text-sm font-semibold"
              />
            </label>

            <div className="p-3 bg-[#f6efe2] border-2 border-[#4b3b36] space-y-3">
              <label className="block space-y-1">
                <span className="text-xs font-semibold block">{t.labels.cardTo}</span>
                <input
                  type="text"
                  maxLength={36}
                  value={card.to}
                  onChange={(e) => onChangeCard({ to: e.target.value })}
                  className="pixel-input w-full text-xs"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold block">{t.labels.cardFrom}</span>
                <input
                  type="text"
                  maxLength={36}
                  value={card.from}
                  onChange={(e) => onChangeCard({ from: e.target.value })}
                  className="pixel-input w-full text-xs"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold block">{t.labels.cardMessage}</span>
                <textarea
                  rows={4}
                  maxLength={200}
                  value={card.message}
                  onChange={(e) => onChangeCard({ message: e.target.value })}
                  className="pixel-input w-full text-xs resize-none"
                />
              </label>
            </div>

            {/* Live mini postcard preview */}
            <div className="p-3 bg-[#fffdf8] border-2 border-dashed border-[#4b3b36] space-y-1.5">
              <div className="text-[11px] font-bold text-[#d95d79]">
                {card.to ? `To: ${card.to}` : 'To: ...'}
              </div>
              <p className="text-xs text-[#352b29] whitespace-pre-wrap leading-relaxed">
                {card.message || '...'}
              </p>
              <div className="text-[11px] font-semibold text-right text-[#70605a]">
                — {card.from || 'Rangkai Puspa'}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
