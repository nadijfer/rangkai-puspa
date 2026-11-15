import { BouquetState, SavedBouquetEntry } from '../types/bouquet';

const STORAGE_KEY = 'rangkai-puspa:gallery:v1';

export function listSavedBouquets(): SavedBouquetEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is SavedBouquetEntry =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof entry.id === 'string' &&
        typeof entry.savedAt === 'number' &&
        typeof entry.state === 'object',
    );
  } catch {
    return [];
  }
}

export function saveBouquetToGallery(state: BouquetState, thumbnail: string): SavedBouquetEntry {
  const existing = listSavedBouquets();
  const entry: SavedBouquetEntry = {
    id: `bq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    savedAt: Date.now(),
    thumbnail,
    state: structuredClone(state),
  };
  const next = [entry, ...existing].slice(0, 24);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Fallback without thumbnail if quota is tight
    const trimmed = [{ ...entry, thumbnail: '' }, ...existing.slice(0, 12)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  }
  return entry;
}

export function deleteBouquetFromGallery(id: string): SavedBouquetEntry[] {
  const next = listSavedBouquets().filter((e) => e.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage errors
  }
  return next;
}
