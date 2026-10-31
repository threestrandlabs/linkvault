import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import { CategoryDef, NewLinkDraft, SavedPost, StrandAppearance, StrandOpenIn, StrandPrefs } from '../types';
import {
  createCategory,
  createLink,
  deleteAllLinks as deleteAllLinksRemote,
  deleteLink as deleteLinkRemote,
  importLinksAndCategories,
  seedDefaultCategoriesIfEmpty,
  subscribeCategories,
  subscribeLinks,
  updateLink as updateLinkRemote,
} from '../services/firestoreStore';
import { DEFAULT_CATEGORIES, DEFAULT_CATEGORY_IMAGES, domainOf } from '../services/defaultData';
import {
  getStoredAppearance,
  getStoredPrefs,
  saveStoredAppearance,
  saveStoredPrefs,
  exportVaultCSV as exportVaultCSVRaw,
  exportVaultJSON as exportVaultJSONRaw,
  parseVaultJSON,
} from '../services/storage';
import { SearchFilterState, filterAndSortPosts, extractUniqueTags } from '../services/searchFilter';
import { checkIncomingShare, cleanTrackingParams, detectPlatformFromUrl, IncomingSharePayload } from '../services/shareTarget';

const TINTS = ['#1F6B4F', '#E8553D', '#F2B33D', '#3DA881', '#C93F28'];

export function useVault(user: User | null) {
  const [links, setLinks] = useState<SavedPost[]>([]);
  const [categories, setCategories] = useState<CategoryDef[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [prefs, setPrefs] = useState<StrandPrefs>(getStoredPrefs());
  const [appearance, setAppearance] = useState<StrandAppearance>(
    (getStoredAppearance() as StrandAppearance) || 'Light'
  );
  const [openIn, setOpenIn] = useState<StrandOpenIn>('In app');

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [incomingShare, setIncomingShare] = useState<IncomingSharePayload | null>(null);

  const flash = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(msg);
    toastTimerRef.current = setTimeout(() => setToast(null), 2200);
  }, []);

  // Subscribe to Firestore for the signed-in user
  useEffect(() => {
    if (!user) {
      setLinks([]);
      setCategories([]);
      setSelectedId(null);
      setDataLoading(false);
      return;
    }

    setDataLoading(true);
    seedDefaultCategoriesIfEmpty(user.uid, DEFAULT_CATEGORIES).catch(() => {
      // Non-fatal: user can still create categories manually
    });

    const unsubLinks = subscribeLinks(user.uid, setLinks);
    const unsubCategories = subscribeCategories(user.uid, cats => {
      setCategories(cats);
      setDataLoading(false);
    });

    return () => {
      unsubLinks();
      unsubCategories();
    };
  }, [user]);

  // Appearance: persist + apply to <html>
  useEffect(() => {
    const isDarkTheme =
      appearance === 'Dark' ||
      (appearance === 'System' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDarkTheme);
    saveStoredAppearance(appearance);
  }, [appearance]);

  // Check for an incoming Web Share Target payload once on mount
  useEffect(() => {
    const incoming = checkIncomingShare();
    if (incoming) setIncomingShare(incoming);
  }, []);

  const updatePrefs = useCallback((next: StrandPrefs) => {
    setPrefs(next);
    saveStoredPrefs(next);
  }, []);

  const collectionNames = useMemo(() => categories.map(c => c.name), [categories]);

  const tagMap = useMemo(() => extractUniqueTags(links), [links]);

  const searchState: SearchFilterState = useMemo(() => ({ query, filter }), [query, filter]);

  const filteredLinks = useMemo(() => filterAndSortPosts(links, searchState), [links, searchState]);

  const currentDetail = useMemo(
    () => links.find(l => l.id === selectedId) || null,
    [links, selectedId]
  );

  const selectLink = useCallback(
    (id: string) => {
      setSelectedId(id);
      const link = links.find(l => l.id === id);
      if (link && link.unread && user) {
        updateLinkRemote(user.uid, id, { unread: false, isRead: true }).catch(() => {});
      }
    },
    [links, user]
  );

  const createLinkFromDraft = useCallback(
    async (draft: NewLinkDraft) => {
      if (!user) return;
      const cleaned = cleanTrackingParams(draft.url.trim());
      const d = domainOf(cleaned);
      const platform = detectPlatformFromUrl(cleaned);
      const previewImg = draft.image || DEFAULT_CATEGORY_IMAGES[draft.collection];

      const newPost: SavedPost = {
        id: `strand-${Date.now()}`,
        url: cleaned,
        title: draft.title.trim() || d,
        domain: d,
        description: draft.note || 'Saved to offline vault.',
        contentSnapshot: draft.note,
        image: previewImg,
        siteName: d,
        platform,
        category: draft.collection,
        collection: draft.collection,
        tags: draft.tags.length ? draft.tags : ['reading'],
        notes: draft.note,
        date: 'Today',
        unread: true,
        isStarred: false,
        isArchived: false,
        isRead: false,
        tint: TINTS[links.length % TINTS.length],
        readTimeEstimate: '3 min read',
        savedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        offlineAvailable: true,
      };

      await createLink(user.uid, newPost);
      flash(`Saved to ${draft.collection}`);
    },
    [user, links.length, flash]
  );

  const saveIncomingShare = useCallback(
    async (post: SavedPost) => {
      if (!user) return;
      const enriched: SavedPost = {
        ...post,
        domain: domainOf(post.url),
        collection: post.category,
        date: 'Today',
        unread: true,
        tint: TINTS[links.length % TINTS.length],
      };
      await createLink(user.uid, enriched);
      setIncomingShare(null);
      flash(`Saved from ${post.platform} to ${post.category}`);
    },
    [user, links.length, flash]
  );

  const toggleStar = useCallback(
    (id: string) => {
      if (!user) return;
      const link = links.find(l => l.id === id);
      if (!link) return;
      updateLinkRemote(user.uid, id, { isStarred: !link.isStarred }).catch(() => {});
      flash(link.isStarred ? 'Removed from starred' : 'Starred');
    },
    [user, links, flash]
  );

  const toggleRead = useCallback(
    (id: string) => {
      if (!user) return;
      const link = links.find(l => l.id === id);
      if (!link) return;
      updateLinkRemote(user.uid, id, { isRead: !link.isRead, unread: link.isRead }).catch(() => {});
    },
    [user, links]
  );

  const toggleArchive = useCallback(
    (id: string) => {
      if (!user) return;
      const link = links.find(l => l.id === id);
      if (!link) return;
      updateLinkRemote(user.uid, id, { isArchived: !link.isArchived }).catch(() => {});
      flash(link.isArchived ? 'Restored from archive' : 'Archived');
    },
    [user, links, flash]
  );

  const deleteLinkById = useCallback(
    (id: string) => {
      if (!user) return;
      deleteLinkRemote(user.uid, id).catch(() => {});
      if (selectedId === id) setSelectedId(null);
      flash('Link deleted');
    },
    [user, selectedId, flash]
  );

  const deleteAllLinks = useCallback(() => {
    if (!user) return;
    deleteAllLinksRemote(user.uid, links.map(l => l.id)).catch(() => {});
    setSelectedId(null);
    setFilter('all');
    setQuery('');
    flash('All links deleted');
  }, [user, links, flash]);

  const addCategoryByName = useCallback(
    async (name: string, emoji = '📁') => {
      if (!user) return;
      const clean = name.trim();
      if (!clean || collectionNames.includes(clean)) return;
      const cat: CategoryDef = {
        id: clean,
        name: clean,
        emoji,
        color: 'indigo',
        isDefault: false,
      };
      await createCategory(user.uid, cat);
      flash(`Created collection "${clean}"`);
    },
    [user, collectionNames, flash]
  );

  const exportCSV = useCallback(() => {
    const csv = exportVaultCSVRaw(links);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `strand-links-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    flash(`${links.length} links exported to CSV`);
  }, [links, flash]);

  const exportJSON = useCallback(() => {
    const json = exportVaultJSONRaw(links, categories);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `strand-vault-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    flash('Vault backup exported');
  }, [links, categories, flash]);

  const importJSON = useCallback(
    async (jsonString: string) => {
      if (!user) return;
      const result = parseVaultJSON(jsonString);
      if (!result.success) {
        flash('Failed to import backup');
        return;
      }
      const existingIds = new Set(links.map(l => l.id));
      const existingCatIds = new Set(categories.map(c => c.id));
      const newLinks = result.posts.filter(p => p && p.id && p.url && !existingIds.has(p.id));
      const newCats = result.categories.filter(c => c && c.id && !existingCatIds.has(c.id));
      await importLinksAndCategories(user.uid, newLinks, newCats);
      flash(`Imported ${newLinks.length} links`);
    },
    [user, links, categories, flash]
  );

  const handleResetFilters = useCallback(() => {
    setQuery('');
    setFilter('all');
  }, []);

  return {
    links,
    categories,
    collectionNames,
    dataLoading,
    prefs,
    updatePrefs,
    appearance,
    setAppearance,
    openIn,
    setOpenIn,
    query,
    setQuery,
    filter,
    setFilter,
    selectedId,
    selectLink,
    setSelectedId,
    currentDetail,
    filteredLinks,
    tagMap,
    toast,
    flash,
    incomingShare,
    setIncomingShare,
    saveIncomingShare,
    createLinkFromDraft,
    toggleStar,
    toggleRead,
    toggleArchive,
    deleteLinkById,
    deleteAllLinks,
    addCategoryByName,
    exportCSV,
    exportJSON,
    importJSON,
    handleResetFilters,
  };
}

export type VaultApi = ReturnType<typeof useVault>;
