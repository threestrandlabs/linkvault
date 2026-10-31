import { SavedPost } from '../types';

export type DateRangeFilter = 'all' | 'today' | 'week' | 'month' | 'year';
export type StatusFilter = 'all' | 'starred' | 'unread' | 'read' | 'archived' | 'has-notes';
export type SortOption = 'newest' | 'oldest' | 'alphabetical' | 'platform';

export interface SearchFilterState {
  query: string;
  filter?: string; // 'all' | 'unread' | 't:<tag>' | 'c:<collection>'
  category?: string;
  platform?: string;
  dateRange?: DateRangeFilter;
  status?: StatusFilter;
  sortBy?: SortOption;
  selectedTag?: string | null;
}

export const INITIAL_SEARCH_FILTER: SearchFilterState = {
  query: '',
  filter: 'all',
  category: 'all',
  platform: 'all',
  dateRange: 'all',
  status: 'all',
  sortBy: 'newest',
  selectedTag: null,
};

export function filterAndSortPosts(posts: SavedPost[], filters: SearchFilterState): SavedPost[] {
  const queryTrimmed = filters.query.trim().toLowerCase();
  const queryTokens = queryTrimmed.length > 0 ? queryTrimmed.split(/\s+/) : [];

  const now = new Date().getTime();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const ONE_WEEK = 7 * ONE_DAY;
  const ONE_MONTH = 30 * ONE_DAY;
  const ONE_YEAR = 365 * ONE_DAY;

  return posts
    .filter(post => {
      // 1. Text keyword search across title, domain, url, tags, and notes
      if (queryTokens.length > 0) {
        const titleText = (post.title || '').toLowerCase();
        const domainText = (post.domain || '').toLowerCase();
        const urlText = (post.url || '').toLowerCase();
        const tagsText = (post.tags || []).join(' ').toLowerCase();
        const notesText = (post.notes || '').toLowerCase();
        const descText = (post.description || '').toLowerCase();

        const matchesAllTokens = queryTokens.every(token => {
          return (
            titleText.includes(token) ||
            domainText.includes(token) ||
            urlText.includes(token) ||
            tagsText.includes(token) ||
            notesText.includes(token) ||
            descText.includes(token)
          );
        });

        if (!matchesAllTokens) return false;
      }

      // 2. Strand Chip filters
      if (filters.filter) {
        if (filters.filter === 'unread' && !post.unread) return false;
        if (filters.filter === 'starred' && !post.isStarred) return false;
        if (filters.filter === 'archived' && !post.isArchived) return false;
        if (filters.filter.startsWith('t:')) {
          const tag = filters.filter.slice(2).toLowerCase();
          const postTags = (post.tags || []).map(t => t.toLowerCase());
          if (!postTags.includes(tag)) return false;
        } else if (filters.filter.startsWith('c:')) {
          const coll = filters.filter.slice(2);
          if (post.collection !== coll && post.category !== coll) return false;
        }
      }

      // 3. Category filter
      if (filters.category && filters.category !== 'all') {
        if (post.category !== filters.category && post.collection !== filters.category) return false;
      }

      // 4. Platform filter
      if (filters.platform && filters.platform !== 'all') {
        if (post.platform !== filters.platform) return false;
      }

      // 5. Selected Tag filter
      if (filters.selectedTag) {
        const cleanTag = filters.selectedTag.toLowerCase();
        const postTags = (post.tags || []).map(t => t.toLowerCase());
        if (!postTags.includes(cleanTag)) return false;
      }

      // 6. Status filter
      if (filters.status) {
        if (filters.status === 'starred' && !post.isStarred) return false;
        if (filters.status === 'unread' && !post.unread) return false;
        if (filters.status === 'read' && !post.isRead) return false;
        if (filters.status === 'archived' && !post.isArchived) return false;
        if (filters.status === 'has-notes' && (!post.notes || post.notes.trim().length === 0)) return false;
      }

      // 7. Date range filter
      if (filters.dateRange && filters.dateRange !== 'all') {
        const savedTime = new Date(post.savedAt).getTime();
        const diff = now - savedTime;
        if (filters.dateRange === 'today' && diff > ONE_DAY) return false;
        if (filters.dateRange === 'week' && diff > ONE_WEEK) return false;
        if (filters.dateRange === 'month' && diff > ONE_MONTH) return false;
        if (filters.dateRange === 'year' && diff > ONE_YEAR) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (filters.sortBy === 'newest') {
        return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
      }
      if (filters.sortBy === 'oldest') {
        return new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime();
      }
      if (filters.sortBy === 'alphabetical') {
        return (a.title || '').localeCompare(b.title || '');
      }
      if (filters.sortBy === 'platform') {
        return (a.platform || '').localeCompare(b.platform || '');
      }
      return 0;
    });
}

// Extract unique tags with counts
export function extractUniqueTags(posts: SavedPost[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const post of posts) {
    if (post.tags) {
      for (const t of post.tags) {
        const clean = t.trim().toLowerCase().replace(/^#/, '');
        if (clean) {
          map[clean] = (map[clean] || 0) + 1;
        }
      }
    }
  }
  return map;
}
