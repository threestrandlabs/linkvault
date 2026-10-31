import { SavedPost, CategoryDef, StrandPrefs } from '../types';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_COLLECTIONS,
  INITIAL_SEED_POSTS,
  DEFAULT_CATEGORY_IMAGES,
} from './defaultData';

const POSTS_STORAGE_KEY = 'strand_links_v1';
const LEGACY_STORAGE_KEY = 'pocketshare_posts_v1';
const COLLECTIONS_STORAGE_KEY = 'strand_collections_v1';
const CATEGORIES_STORAGE_KEY = 'strand_categories_v1';
const PREFS_STORAGE_KEY = 'strand_prefs_v1';

export const DEFAULT_PREFS: StrandPrefs = {
  fetch: true,
  thumbs: true,
  unread: true,
};

export function getStoredPosts(): SavedPost[] {
  try {
    const raw = localStorage.getItem(POSTS_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(INITIAL_SEED_POSTS));
      return INITIAL_SEED_POSTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return INITIAL_SEED_POSTS;
    }

    let modified = false;
    const enriched: SavedPost[] = parsed.map((p: SavedPost) => {
      let img = p.image;
      if (!img) {
        const seedMatch = INITIAL_SEED_POSTS.find(s => s.id === p.id || s.url === p.url);
        if (seedMatch?.image) {
          img = seedMatch.image;
          modified = true;
        } else {
          const fallback = DEFAULT_CATEGORY_IMAGES[p.category || p.collection || 'Read later'];
          if (fallback) {
            img = fallback;
            modified = true;
          }
        }
      }
      return img !== p.image ? { ...p, image: img } : p;
    });

    if (modified) {
      try {
        localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(enriched));
      } catch {
        // ignore
      }
    }

    return enriched;
  } catch (err) {
    console.error('Failed to load posts from storage:', err);
    return INITIAL_SEED_POSTS;
  }
}

export function saveStoredPosts(posts: SavedPost[]): void {
  try {
    localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
  } catch (err) {
    console.error('Failed to save posts to storage:', err);
  }
}

export function getStoredCollections(): string[] {
  try {
    const raw = localStorage.getItem(COLLECTIONS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(COLLECTIONS_STORAGE_KEY, JSON.stringify(DEFAULT_COLLECTIONS));
      return DEFAULT_COLLECTIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_COLLECTIONS;
  } catch {
    return DEFAULT_COLLECTIONS;
  }
}

export function saveStoredCollections(collections: string[]): void {
  try {
    localStorage.setItem(COLLECTIONS_STORAGE_KEY, JSON.stringify(collections));
  } catch (err) {
    console.error('Failed to save collections to storage:', err);
  }
}

export function getStoredCategories(): CategoryDef[] {
  try {
    const raw = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(DEFAULT_CATEGORIES));
      return DEFAULT_CATEGORIES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export function saveStoredCategories(categories: CategoryDef[]): void {
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
  } catch (err) {
    console.error('Failed to save categories:', err);
  }
}

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

export function exportVaultJSON(): string {
  const posts = getStoredPosts();
  const categories = getStoredCategories();
  const collections = getStoredCollections();
  const exportPayload = {
    app: 'Strand',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    collections,
    categories,
    posts,
  };
  return JSON.stringify(exportPayload, null, 2);
}

export function importVaultJSON(jsonString: string): { success: boolean; count: number; error?: string } {
  try {
    const data = JSON.parse(jsonString);
    if (!data.posts || !Array.isArray(data.posts)) {
      return { success: false, count: 0, error: 'Invalid backup file format' };
    }
    const existing = getStoredPosts();
    const existingIds = new Set(existing.map(p => p.id));
    const merged = [...existing];
    let addedCount = 0;

    for (const post of data.posts) {
      if (post && post.id && post.url) {
        if (!existingIds.has(post.id)) {
          merged.push(post);
          addedCount++;
        }
      }
    }

    saveStoredPosts(merged);

    if (data.collections && Array.isArray(data.collections)) {
      const current = getStoredCollections();
      const set = new Set(current);
      for (const col of data.collections) {
        if (!set.has(col)) {
          current.push(col);
        }
      }
      saveStoredCollections(current);
    }

    return { success: true, count: addedCount };
  } catch (err) {
    return { success: false, count: 0, error: err instanceof Error ? err.message : 'Invalid JSON file' };
  }
}
