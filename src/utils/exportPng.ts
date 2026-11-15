import { GiftCardConfig } from '../types/bouquet';

export function triggerDownloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Composites a crisp pixelated bouquet snapshot onto a warm pixel-bordered postcard
 * with the recipient, message, and sender printed below.
 */
export async function buildPostcardDataUrl(
  bouquetDataUrl: string,
  bouquetName: string,
  card: GiftCardConfig,
): Promise<string> {
  const img = await loadImage(bouquetDataUrl);

  const width = 900;
  const height = 1140;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  // Warm parchment paper background
  ctx.fillStyle = '#f8f1e5';
  ctx.fillRect(0, 0, width, height);

  // Subtle pixel dot pattern in corners
  ctx.fillStyle = '#e5d8c3';
  for (let y = 16; y < height - 16; y += 24) {
    for (let x = 16; x < width - 16; x += 24) {
      ctx.fillRect(x, y, 4, 4);
    }
  }

  // Outer pixel frame
  ctx.strokeStyle = '#4b3b36';
  ctx.lineWidth = 8;
  ctx.strokeRect(24, 24, width - 48, height - 48);

  // Inner bouquet window
  const frameX = 64;
  const frameY = 64;
  const frameW = width - 128;
  const frameH = 660;
  ctx.fillStyle = '#ede4d3';
  ctx.fillRect(frameX, frameY, frameW, frameH);
  ctx.strokeStyle = '#4b3b36';
  ctx.lineWidth = 6;
  ctx.strokeRect(frameX, frameY, frameW, frameH);

  // Fit bouquet snapshot cleanly inside window preserving aspect ratio & crisp pixels
  const scale = Math.min(frameW / img.width, frameH / img.height);
  const drawW = Math.round(img.width * scale);
  const drawH = Math.round(img.height * scale);
  const drawX = Math.round(frameX + (frameW - drawW) / 2);
  const drawY = Math.round(frameY + (frameH - drawH) / 2);
  ctx.drawImage(img, drawX, drawY, drawW, drawH);

  // Bouquet title ribbon
  ctx.fillStyle = '#d95d79';
  ctx.fillRect(frameX + 24, frameY + frameH - 26, 320, 44);
  ctx.strokeStyle = '#4b3b36';
  ctx.lineWidth = 4;
  ctx.strokeRect(frameX + 24, frameY + frameH - 26, 320, 44);
  ctx.fillStyle = '#fffaf5';
  ctx.font = 'bold 22px "Pixelify Sans", monospace';
  ctx.textBaseline = 'middle';
  ctx.fillText((bouquetName || 'Rangkai Puspa').slice(0, 24), frameX + 42, frameY + frameH - 4);

  // Gift Note Area
  const noteY = frameY + frameH + 54;
  ctx.fillStyle = '#fffaf0';
  ctx.fillRect(frameX, noteY, frameW, 290);
  ctx.strokeStyle = '#4b3b36';
  ctx.lineWidth = 4;
  ctx.strokeRect(frameX, noteY, frameW, 290);

  ctx.fillStyle = '#4b3b36';
  ctx.font = 'bold 26px "Pixelify Sans", monospace';
  ctx.textBaseline = 'top';
  const toLine = card.to.trim() ? `To: ${card.to.trim()}` : 'For Someone Special';
  ctx.fillText(toLine, frameX + 28, noteY + 26);

  // Message wrap
  ctx.fillStyle = '#5c4b45';
  ctx.font = '24px "Pixelify Sans", monospace';
  const msg = card.message.trim() || 'A tiny pixel bouquet crafted with care.';
  const lines = wrapText(ctx, msg, frameW - 56, 4);
  lines.forEach((line, idx) => {
    ctx.fillText(line, frameX + 28, noteY + 76 + idx * 36);
  });

  // Signature
  ctx.fillStyle = '#d95d79';
  ctx.font = 'bold 24px "Pixelify Sans", monospace';
  const fromLine = card.from.trim() ? `— ${card.from.trim()}` : '— Rangkai Puspa';
  ctx.fillText(fromLine, frameX + 28, noteY + 236);

  // Footer stamp
  ctx.fillStyle = '#8b7972';
  ctx.font = '18px monospace';
  ctx.fillText('RANGKAI PUSPA • 3D PIXEL FLORIST', frameX, height - 58);

  return canvas.toDataURL('image/png');
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length >= maxLines) break;
    }
  }
  if (current && lines.length < maxLines) {
    lines.push(current);
  }
  return lines;
}
