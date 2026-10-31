import { CategoryDef, SavedPost, StrandPrefs } from '../types';

const PREFS_STORAGE_KEY = 'strand_prefs_v1';
const APPEARANCE_STORAGE_KEY = 'strand_appearance';

export const DEFAULT_PREFS: StrandPrefs = {
  fetch: true,
  thumbs: true,
  unread: true,
};

export function getStoredPrefs(): StrandPrefs {
  try {
    const raw = localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function saveStoredPrefs(prefs: StrandPrefs): void {
  try {
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch (err) {
    console.error('Failed to save prefs:', err);
  }
}

export function getStoredAppearance(): string | null {
  try {
    return localStorage.getItem(APPEARANCE_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveStoredAppearance(appearance: string): void {
  try {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, appearance);
  } catch {
    // ignore
  }
}

export function exportVaultCSV(posts: SavedPost[]): string {
  const headers = ['Title', 'URL', 'Domain', 'Collection', 'Tags', 'Date', 'Unread', 'Notes'];
  const rows = posts.map(p => [
    `"${(p.title || '').replace(/"/g, '""')}"`,
    `"${(p.url || '').replace(/"/g, '""')}"`,
    `"${(p.domain || '').replace(/"/g, '""')}"`,
    `"${(p.collection || p.category || '').replace(/"/g, '""')}"`,
    `"${(p.tags || []).join(', ')}"`,
    `"${p.date || ''}"`,
    `"${p.unread ? 'Yes' : 'No'}"`,
    `"${(p.notes || '').replace(/"/g, '""')}"`,
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function exportVaultJSON(posts: SavedPost[], categories: CategoryDef[]): string {
  const exportPayload = {
    app: 'Strand',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    categories,
    posts,
  };
  return JSON.stringify(exportPayload, null, 2);
}

export interface ParsedVault {
  success: boolean;
  posts: SavedPost[];
  categories: CategoryDef[];
  error?: string;
}

export function parseVaultJSON(jsonString: string): ParsedVault {
  try {
    const data = JSON.parse(jsonString);
    if (!data.posts || !Array.isArray(data.posts)) {
      return { success: false, posts: [], categories: [], error: 'Invalid backup file format' };
    }
    return {
      success: true,
      posts: data.posts,
      categories: Array.isArray(data.categories) ? data.categories : [],
    };
  } catch (err) {
    return {
      success: false,
      posts: [],
      categories: [],
      error: err instanceof Error ? err.message : 'Invalid JSON file',
    };
  }
}
