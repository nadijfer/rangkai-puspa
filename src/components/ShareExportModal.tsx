import { useMemo, useState } from 'react';
import { Check, Copy, Download, ImageDown, X } from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';
import { BouquetState, Language } from '../types/bouquet';
import { buildPostcardDataUrl, triggerDownloadDataUrl } from '../utils/exportPng';
import { encodeBouquetToHash } from '../utils/shareCodec';

interface ShareExportModalProps {
  lang: Language;
  bouquet: BouquetState;
  onCapturePng: (transparent: boolean) => string;
  onClose: () => void;
}

export function ShareExportModal({
  lang,
  bouquet,
  onCapturePng,
  onClose,
}: ShareExportModalProps) {
  const t = TRANSLATIONS[lang];
  const [copied, setCopied] = useState(false);
  const [transparentBg, setTransparentBg] = useState(false);
  const [busy, setBusy] = useState(false);

  const shareUrl = useMemo(() => {
    const hash = encodeBouquetToHash(bouquet);
    const base = `${window.location.origin}${window.location.pathname}`;
    return `${base}${hash}`;
  }, [bouquet]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback select
      const input = document.getElementById('share-link-input') as HTMLInputElement | null;
      if (input) {
        input.select();
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      }
    }
  };

  const handleDownloadPng = () => {
    const dataUrl = onCapturePng(transparentBg);
    if (!dataUrl) return;
    const slug = (bouquet.name || 'bouquet').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    triggerDownloadDataUrl(dataUrl, `${slug}-pixel.png`);
  };

  const handleDownloadPostcard = async () => {
    setBusy(true);
    try {
      const snap = onCapturePng(false);
      if (!snap) return;
      const postcard = await buildPostcardDataUrl(snap, bouquet.name, bouquet.card);
      const slug = (bouquet.name || 'bouquet').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      triggerDownloadDataUrl(postcard, `${slug}-postcard.png`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#352b29]/55 z-50 flex items-center justify-center p-4">
      <div className="pixel-panel w-full max-w-md">
        <div className="px-4 py-3 border-b-2 border-[#4b3b36] bg-[#f2e8d7] flex items-center justify-between">
          <h2 className="text-base font-bold">{t.actions.shareExport}</h2>
          <button type="button" onClick={onClose} className="pixel-btn p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4 text-xs">
          <p className="text-[#5c4b45] leading-relaxed">{t.labels.shareDescription}</p>

          {/* Share Link */}
          <div className="p-3 bg-[#f6efe2] border-2 border-[#4b3b36] space-y-2">
            <div className="flex gap-2">
              <input
                id="share-link-input"
                type="text"
                readOnly
                value={shareUrl}
                onFocus={(e) => e.target.select()}
                className="pixel-input flex-1 text-[11px] font-pixel-mono"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="pixel-btn pixel-btn-primary px-3 py-1.5 font-bold flex items-center gap-1.5 shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? t.actions.copied : t.actions.copyLink}
              </button>
            </div>
          </div>

          {/* PNG Export Options */}
          <div className="p-3 bg-[#f6efe2] border-2 border-[#4b3b36] space-y-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTransparentBg(false)}
                className={`flex-1 py-1.5 border-2 border-[#4b3b36] font-semibold cursor-pointer ${
                  !transparentBg ? 'bg-[#4b3b36] text-[#fffaf0]' : 'bg-[#fffaf0]'
                }`}
              >
                {t.labels.studioBg}
              </button>
              <button
                type="button"
                onClick={() => setTransparentBg(true)}
                className={`flex-1 py-1.5 border-2 border-[#4b3b36] font-semibold cursor-pointer ${
                  transparentBg ? 'bg-[#4b3b36] text-[#fffaf0]' : 'bg-[#fffaf0]'
                }`}
              >
                {t.labels.transparentBg}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDownloadPng}
                className="pixel-btn py-2 px-3 font-bold flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                {t.actions.downloadPng}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={handleDownloadPostcard}
                className="pixel-btn pixel-btn-sage py-2 px-3 font-bold flex items-center justify-center gap-1.5"
              >
                <ImageDown className="w-4 h-4" />
                {t.actions.downloadPostcard}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
