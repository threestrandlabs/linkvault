import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  SavedPost,
  CategoryDef,
  StrandScreen,
  StrandAppearance,
  StrandOpenIn,
  StrandPrefs,
} from './types';
import {
  getStoredPosts,
  saveStoredPosts,
  getStoredCollections,
  saveStoredCollections,
  getStoredCategories,
  saveStoredCategories,
  getStoredPrefs,
  saveStoredPrefs,
  exportVaultCSV,
  exportVaultJSON,
  importVaultJSON,
} from './services/storage';
import {
  INITIAL_SEED_POSTS,
  DEFAULT_COLLECTIONS,
  DEFAULT_CATEGORIES,
  DEFAULT_CATEGORY_IMAGES,
  favFg,
  domainOf,
} from './services/defaultData';
import {
  SearchFilterState,
  INITIAL_SEARCH_FILTER,
  filterAndSortPosts,
  extractUniqueTags,
} from './services/searchFilter';
import {
  checkIncomingShare,
  IncomingSharePayload,
  detectPlatformFromUrl,
  cleanTrackingParams,
  predictCategory,
} from './services/shareTarget';
import { analyzeCategoryForLink, CategorySuggestion } from './services/categoryEngine';
import { ShareSimulatorModal } from './components/ShareSimulatorModal';
import { IncomingShareToast } from './components/IncomingShareToast';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  // Navigation & View State
  const [screen, setScreen] = useState<StrandScreen>('home');
  const [selectedId, setSelectedId] = useState<string>('strand-1');
  const [isPhoneFrame, setIsPhoneFrame] = useState<boolean>(true);

  // Data State
  const [links, setLinks] = useState<SavedPost[]>([]);
  const [collections, setCollections] = useState<string[]>([]);
  const [categories, setCategories] = useState<CategoryDef[]>([]);
  const [prefs, setPrefs] = useState<StrandPrefs>(getStoredPrefs());
  const [appearance, setAppearance] = useState<StrandAppearance>('Light');
  const [openIn, setOpenIn] = useState<StrandOpenIn>('In app');

  // Search & Filter State
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  // Add Link State
  const [addUrl, setAddUrl] = useState('');
  const [addStage, setAddStage] = useState<'idle' | 'fetching' | 'ready'>('idle');
  const [addTitle, setAddTitle] = useState('');
  const [addImage, setAddImage] = useState('');
  const [addCollection, setAddCollection] = useState('Read later');
  const [addTags, setAddTags] = useState<string[]>(['reading']);
  const [addNote, setAddNote] = useState('');
  const [addSuggestion, setAddSuggestion] = useState<CategorySuggestion | null>(null);
  const [newTagInput, setNewTagInput] = useState('');

  // Organise View Sub-tab
  const [orgTab, setOrgTab] = useState<'collections' | 'tags'>('collections');

  // Modals / Feedback
  const [toast, setToast] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<'delete' | 'clear' | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [incomingShare, setIncomingShare] = useState<IncomingSharePayload | null>(null);

  const fetchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize data on mount
  useEffect(() => {
    const loadedPosts = getStoredPosts();
    const loadedCollections = getStoredCollections();
    const loadedCats = getStoredCategories();
    const loadedPrefs = getStoredPrefs();

    setLinks(loadedPosts);
    setCollections(loadedCollections);
    setCategories(loadedCats);
    setPrefs(loadedPrefs);

    // Initial selected post
    if (loadedPosts.length > 0) {
      setSelectedId(loadedPosts[0].id);
    }

    // Appearance from localStorage
    const savedTheme = localStorage.getItem('strand_appearance') as StrandAppearance;
    if (savedTheme) {
      setAppearance(savedTheme);
    }

    // Check for incoming Web Share Target from social media apps
    const incoming = checkIncomingShare();
    if (incoming) {
      setIncomingShare(incoming);
    }
  }, []);

  // Sync Appearance (Dark / Light / System)
  useEffect(() => {
    const isDarkTheme =
      appearance === 'Dark' ||
      (appearance === 'System' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDarkTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('strand_appearance', appearance);
  }, [appearance]);

  // Flash toast message
  const flash = (msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(msg);
    toastTimerRef.current = setTimeout(() => setToast(null), 2000);
  };

  // Sync state helpers
  const updateLinks = (newLinks: SavedPost[]) => {
    setLinks(newLinks);
    saveStoredPosts(newLinks);
  };

  const updateCollections = (newColls: string[]) => {
    setCollections(newColls);
    saveStoredCollections(newColls);
  };

  const updateCategories = (newCats: CategoryDef[]) => {
    setCategories(newCats);
    saveStoredCategories(newCats);
  };

  const updatePrefs = (newPrefs: StrandPrefs) => {
    setPrefs(newPrefs);
    saveStoredPrefs(newPrefs);
  };

  // Add Link Logic with auto-categorization and preview fetch
  const handleUrlChange = (val: string) => {
    setAddUrl(val);
    setAddImage('');
    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);

    const d = domainOf(val);
    if (!val.trim() || !d) {
      setAddStage('idle');
      setAddSuggestion(null);
      return;
    }

    // Immediate preview analysis
    const instantSuggestion = analyzeCategoryForLink({
      url: val,
      title: addTitle,
      description: addNote,
    });
    setAddSuggestion(instantSuggestion);
    if (instantSuggestion.isClearMatch && instantSuggestion.category) {
      setAddCollection(instantSuggestion.category);
    }

    setAddStage('fetching');

    // Simulate or call server metadata fetch
    fetchTimerRef.current = setTimeout(async () => {
      let fetchedTitle = `Page on ${d}`;
      try {
        const res = await (import.meta.env.VITE_API_BASE === undefined && import.meta.env.PROD
          ? Promise.reject(new Error('No metadata server on static hosting'))
          : fetch(`${import.meta.env.VITE_API_BASE ?? ''}/api/scrape-metadata`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: val }),
        }));
        if (res.ok) {
          const data = await res.json();
          if (data.title) fetchedTitle = data.title;
          if (data.image) setAddImage(data.image);
          if (data.category) setAddCollection(data.category);
          if (data.tags && data.tags.length > 0) setAddTags(data.tags);
        }
      } catch {
        // Offline / fallback to domain name
      }
      setAddTitle(fetchedTitle);
      setAddStage('ready');
    }, 700);
  };

  const handlePasteUrl = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        handleUrlChange(text);
      }
    } catch {
      flash('Please paste URL directly');
    }
  };

  const handleAddNewTag = () => {
    const clean = newTagInput.trim().toLowerCase().replace(/^#/, '').replace(/\s+/g, '-');
    if (!clean) return;
    if (!addTags.includes(clean)) {
      setAddTags([...addTags, clean]);
    }
    setNewTagInput('');
  };

  const handleSaveAdd = () => {
    if (addStage !== 'ready' && !addUrl.trim()) return;

    const cleaned = cleanTrackingParams(addUrl.trim());
    const d = domainOf(cleaned);
    const platform = detectPlatformFromUrl(cleaned);
    const tints = ['#1F6B4F', '#E8553D', '#F2B33D', '#3DA881', '#C93F28'];

    const previewImg = addImage || DEFAULT_CATEGORY_IMAGES[addCollection];

    const newPost: SavedPost = {
      id: `strand-${Date.now()}`,
      url: cleaned,
      title: addTitle.trim() || d,
      domain: d,
      description: addNote || 'Saved to offline vault.',
      contentSnapshot: addNote,
      image: previewImg,
      siteName: d,
      platform,
      category: addCollection,
      collection: addCollection,
      tags: addTags.length ? addTags : ['reading'],
      notes: addNote,
      date: 'Today',
      unread: true,
      isStarred: false,
      isArchived: false,
      isRead: false,
      tint: tints[links.length % tints.length],
      readTimeEstimate: '3 min read',
      savedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      offlineAvailable: true,
    };

    updateLinks([newPost, ...links]);
    setScreen('home');
    setFilter('all');
    setQuery('');
    setAddUrl('');
    setAddStage('idle');
    setAddTitle('');
    setAddImage('');
    setAddNote('');
    flash(`Saved to ${addCollection}`);
  };

  // Incoming Share Handler (Web Share Target / Simulator)
  const handleConfirmIncomingShare = (post: SavedPost) => {
    const tints = ['#1F6B4F', '#E8553D', '#F2B33D', '#3DA881'];
    const enriched: SavedPost = {
      ...post,
      domain: domainOf(post.url),
      collection: post.category,
      date: 'Today',
      unread: true,
      tint: tints[links.length % tints.length],
    };
    updateLinks([enriched, ...links]);
    setIncomingShare(null);
    flash(`Saved from ${post.platform} to ${post.category}`);
  };

  // Tag dictionary and filtered items
  const tagMap = useMemo(() => extractUniqueTags(links), [links]);

  const filteredLinks = useMemo(() => {
    return filterAndSortPosts(links, { query, filter });
  }, [links, query, filter]);

  // Selected link for detail view
  const currentDetail = useMemo(() => {
    return links.find(l => l.id === selectedId) || links[0] || null;
  }, [links, selectedId]);

  // Reset search / filter
  const handleResetFilters = () => {
    setQuery('');
    setFilter('all');
  };

  // Restore sample links
  const handleRestoreSamples = () => {
    updateLinks(INITIAL_SEED_POSTS);
    setFilter('all');
    setQuery('');
    flash('Sample links restored');
  };

  // Delete actions
  const handleDeleteCurrent = () => {
    if (!currentDetail) return;
    const updated = links.filter(l => l.id !== currentDetail.id);
    updateLinks(updated);
    setConfirmDialog(null);
    setScreen('home');
    flash('Link deleted');
  };

  const handleDeleteAll = () => {
    updateLinks([]);
    setConfirmDialog(null);
    setScreen('home');
    setFilter('all');
    setQuery('');
    flash('All links deleted');
  };

  // Export CSV
  const handleExportCSV = () => {
    const csv = exportVaultCSV(links);
    const blob = new Blob([csv], { type: 'text/csv' });
    const u = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = u;
    a.download = `strand-links-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(u);
    flash(`${links.length} links exported to CSV`);
  };

  // Render Filter Chips
  const filterChips = useMemo(() => {
    const list = [];
    if (filter.startsWith('c:')) {
      const cName = filter.slice(2);
      list.push({
        id: 'active-coll',
        label: `${cName}  ×`,
        isActive: true,
        onClick: () => setFilter('all'),
      });
    }
    list.push({
      id: 'all',
      label: 'All',
      isActive: filter === 'all',
      onClick: () => setFilter(filter === 'all' ? 'all' : 'all'),
    });
    list.push({
      id: 'unread',
      label: 'Unread',
      isActive: filter === 'unread',
      onClick: () => setFilter(filter === 'unread' ? 'all' : 'unread'),
    });
    // Top tags
    Object.keys(tagMap)
      .sort((a, b) => tagMap[b] - tagMap[a])
      .forEach(tag => {
        const key = `t:${tag}`;
        list.push({
          id: key,
          label: `#${tag}`,
          isActive: filter === key,
          onClick: () => setFilter(filter === key ? 'all' : key),
        });
      });
    return list;
  }, [filter, tagMap]);

  return (
    <div className="min-h-screen py-6 sm:py-10 px-3 sm:px-6 flex flex-col items-center justify-center font-sans transition-colors duration-200">
      {/* Canvas Top Bar for Desktop Preview / Viewport Controls */}
      <div className="w-full max-w-[840px] mb-4 sm:mb-6 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold px-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#1F6B4F]"></span>
          <span className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Three Strand Labs
          </span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-600 dark:text-slate-400">Strand Link Vault</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Frame mode toggle */}
          <button
            onClick={() => setIsPhoneFrame(!isPhoneFrame)}
            className="px-2.5 py-1 rounded-lg border border-[var(--line)] bg-[var(--surf)] hover:bg-[var(--ptint)] text-[var(--text)] transition"
          >
            {isPhoneFrame ? 'Expand Layout' : 'Phone Mockup'}
          </button>

          {/* Simulate Share Sheet Trigger */}
          <button
            onClick={() => setIsSimulatorOpen(true)}
            className="px-2.5 py-1 rounded-lg border border-[var(--line)] bg-[var(--surf)] text-[var(--text)] hover:bg-[var(--ptint)] transition"
          >
            Simulate Share
          </button>

          {/* PWA Install */}
          <PWAInstallButton />
        </div>
      </div>

      {/* Main Strand Applet Phone Container */}
      <div
        className={`relative flex flex-col bg-[var(--bg)] text-[var(--text)] transition-all duration-300 overflow-hidden ${
          isPhoneFrame
            ? 'w-[390px] h-[844px] rounded-[44px] border border-[var(--line)] shadow-[0_0_0_1px_var(--line),0_0_0_9px_var(--frame),0_30px_60px_-20px_rgba(30,42,38,0.35)]'
            : 'w-full max-w-2xl min-h-[750px] rounded-3xl border border-[var(--line)] shadow-xl'
        }`}
      >
        {/* iOS Status Bar (9:41) */}
        <div className="h-[46px] flex-none flex items-center justify-between px-8 text-sm font-semibold select-none">
          <span>9:41</span>
          <div className="flex items-center gap-1.5">
            <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor">
              <rect x="0" y="7" width="3" height="4"></rect>
              <rect x="4.5" y="5" width="3" height="6"></rect>
              <rect x="9" y="2.5" width="3" height="8.5"></rect>
              <rect x="13.5" y="0" width="3" height="11"></rect>
            </svg>
            <svg width="25" height="12" viewBox="0 0 25 12" fill="none" stroke="currentColor">
              <rect x="0.5" y="0.5" width="21" height="11" rx="2.5"></rect>
              <rect x="2.5" y="2.5" width="15" height="7" rx="1" fill="currentColor" stroke="none"></rect>
              <path d="M23.5 4v4"></path>
            </svg>
          </div>
        </div>

        {/* Scrollable View Content */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col">
          {/* SCREEN 1: HOME (Saved Links) */}
          {screen === 'home' && (
            <div className="flex-1 flex flex-col">
              {/* Header */}
              <div className="px-5 pt-1.5 pb-2.5 flex flex-col gap-3">
                <div className="flex items-end justify-between">
                  <div>
                    <span className="block text-[11px] tracking-[0.14em] uppercase text-[var(--muted)] font-medium">
                      Strand
                    </span>
                    <h1 className="text-3xl font-semibold leading-none tracking-tight">
                      Saved links
                    </h1>
                  </div>
                  <span className="text-xs text-[var(--muted)] pb-0.5">
                    {links.length > 0 &&
                      (filteredLinks.length === links.length
                        ? `${links.length} links`
                        : `${filteredLinks.length} of ${links.length}`)}
                  </span>
                </div>

                {links.length > 0 && (
                  <div className="flex flex-col gap-2.5">
                    {/* Search input */}
                    <div className="flex items-center gap-2 h-10 px-3 border border-[var(--line)] bg-[var(--surf)] text-[var(--muted)]">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.3-4.3"></path>
                      </svg>
                      <input
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search titles, sites, tags, notes"
                        className="flex-1 min-w-0 border-0 outline-none bg-transparent text-[var(--text)] text-sm placeholder:text-[var(--muted)]"
                      />
                      {query && (
                        <button
                          onClick={() => setQuery('')}
                          className="p-1 text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          >
                            <path d="M18 6 6 18"></path>
                            <path d="m6 6 12 12"></path>
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Filter chips */}
                    <div className="flex gap-1.5 overflow-x-auto -mx-5 px-5 py-0.5 no-scrollbar scrollbar-none">
                      {filterChips.map(c => (
                        <button
                          key={c.id}
                          onClick={c.onClick}
                          className={`flex-none h-[30px] px-3 flex items-center gap-1.5 text-xs font-medium cursor-pointer transition border ${
                            c.isActive
                              ? 'bg-[var(--p)] text-[var(--on-p)] border-[var(--p)]'
                              : 'bg-transparent text-[var(--text)] border-[var(--line)] hover:bg-[var(--ptint)]'
                          }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* List of Links */}
              {filteredLinks.length > 0 && (
                <div className="flex flex-col border-t border-[var(--line)]">
                  {filteredLinks.map(r => {
                    const cleanHost = (r.domain || r.title || 'Strand')
                      .replace(/^https?:\/\//i, '')
                      .replace(/^www\./i, '')
                      .trim();
                    const domainInitial = (cleanHost[0] || 'S').toUpperCase();
                    const fgColor = favFg(r.tint || '#1F6B4F');
                    const hasUnread = prefs.unread && r.unread;

                    return (
                      <button
                        key={r.id}
                        onClick={() => {
                          setSelectedId(r.id);
                          // mark read on open
                          setLinks(prev =>
                            prev.map(x => (x.id === r.id ? { ...x, unread: false, isRead: true } : x))
                          );
                          setScreen('detail');
                        }}
                        className={`grid gap-3 px-5 py-3 border-b border-[var(--line)] bg-transparent text-left cursor-pointer transition hover:bg-[var(--ptint)] ${
                          prefs.thumbs ? 'grid-cols-[64px_1fr]' : 'grid-cols-1'
                        }`}
                      >
                        {/* Thumbnail with preview image or diagonal hatch + initial */}
                        {prefs.thumbs && (
                          <div
                            className="w-16 h-16 border border-[var(--line)] overflow-hidden flex-none relative flex items-center justify-center font-semibold text-2xl bg-[var(--surf)]"
                            style={{
                              background: r.image
                                ? undefined
                                : `repeating-linear-gradient(135deg, var(--line) 0 1px, transparent 1px 7px), color-mix(in oklch, ${r.tint || '#1F6B4F'} 22%, transparent)`,
                            }}
                          >
                            {r.image ? (
                              <img
                                src={r.image}
                                alt={r.title}
                                loading="lazy"
                                className="w-full h-full object-cover"
                                onError={e => {
                                  const target = e.currentTarget;
                                  target.style.display = 'none';
                                  const fallback = target.nextElementSibling as HTMLElement | null;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <span
                              style={{ display: r.image ? 'none' : 'flex' }}
                              className="w-full h-full items-center justify-center"
                            >
                              {domainInitial}
                            </span>
                          </div>
                        )}

                        <div className="flex flex-col gap-1 min-w-0">
                          <div className="flex items-baseline gap-1.5">
                            {hasUnread && (
                              <span className="flex-none w-1.5 h-1.5 bg-[var(--hl)]"></span>
                            )}
                            <span className="text-[15px] font-semibold leading-tight line-clamp-2">
                              {r.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                            <span
                              className="w-3.5 h-3.5 flex-none font-bold text-[9px] flex items-center justify-center"
                              style={{ backgroundColor: r.tint || '#1F6B4F', color: fgColor }}
                            >
                              {domainInitial}
                            </span>
                            <span className="truncate">{r.domain}</span>
                            <span>·</span>
                            <span className="flex-none">{r.date}</span>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap text-xs pt-0.5">
                            {(r.tags || []).slice(0, 3).map(t => (
                              <span key={t} className="text-[var(--p)] font-medium">
                                #{t.replace(/^#/, '')}
                              </span>
                            ))}
                            <span className="text-[9.5px] tracking-[0.12em] font-semibold px-1 py-0.5 border border-[var(--line)] text-[var(--muted)]">
                              SAMPLE
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* No search matches */}
              {links.length > 0 && filteredLinks.length === 0 && (
                <div className="p-12 text-center flex flex-col items-center gap-2">
                  <span className="font-semibold text-lg">No matches</span>
                  <span className="text-xs text-[var(--muted)]">
                    Nothing saved matches "{query}" in this filter.
                  </span>
                  <button
                    onClick={handleResetFilters}
                    className="mt-2 h-9 px-3.5 border border-[var(--line)] bg-transparent text-xs cursor-pointer hover:bg-[var(--ptint)]"
                  >
                    Clear search and filters
                  </button>
                </div>
              )}

              {/* Empty State */}
              {links.length === 0 && (
                <div className="flex-1 flex flex-col justify-center px-7 pb-10">
                  <div className="blueprint p-8 flex flex-col items-center gap-2.5 text-center">
                    <i className="corner tl"></i>
                    <i className="corner tr"></i>
                    <i className="corner bl"></i>
                    <i className="corner br"></i>
                    <div className="w-16 h-16 border border-[var(--line)] hatch-bg flex items-center justify-center text-[var(--p)] mb-2">
                      <svg
                        width="30"
                        height="30"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                      </svg>
                    </div>
                    <h2 className="text-xl font-semibold">Nothing saved yet</h2>
                    <p className="text-xs leading-relaxed text-[var(--muted)] max-w-[260px]">
                      Paste a link from anywhere. Strand fetches its title and preview so you can
                      find it later.
                    </p>
                    <button
                      onClick={() => setScreen('add')}
                      className="blueprint mt-3 h-11 px-5 bg-[var(--btn)] text-white border-0 text-sm font-semibold flex items-center gap-2 cursor-pointer hover:brightness-105 active:scale-95"
                    >
                      <i className="corner tl"></i>
                      <i className="corner tr"></i>
                      <i className="corner bl"></i>
                      <i className="corner br"></i>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      >
                        <path d="M5 12h14"></path>
                        <path d="M12 5v14"></path>
                      </svg>
                      Add your first link
                    </button>
                    <button
                      onClick={handleRestoreSamples}
                      className="h-8 px-2 border-0 bg-transparent text-[var(--p)] text-xs font-medium cursor-pointer hover:underline"
                    >
                      Restore sample links
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SCREEN 2: ADD LINK */}
          {screen === 'add' && (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--line)]">
                <button
                  onClick={() => {
                    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
                    setScreen('home');
                    setAddStage('idle');
                    setAddUrl('');
                  }}
                  className="h-9 px-2 text-sm text-[var(--text)] bg-transparent border-0 cursor-pointer"
                >
                  Cancel
                </button>
                <span className="font-semibold text-base">Add link</span>
                <button
                  onClick={handleSaveAdd}
                  disabled={addStage !== 'ready' && !addUrl.trim()}
                  className="h-9 px-2 text-sm font-semibold text-[var(--p)] bg-transparent border-0 cursor-pointer disabled:opacity-45"
                >
                  Save
                </button>
              </div>

              <div className="p-5 flex flex-col gap-4">
                {/* URL Input Row */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] tracking-wider uppercase text-[var(--muted)] font-semibold">
                    URL
                  </span>
                  <div className="flex gap-1.5">
                    <input
                      type="url"
                      value={addUrl}
                      onChange={e => handleUrlChange(e.target.value)}
                      placeholder="https://"
                      className="flex-1 min-w-0 h-10 px-3 border border-[var(--line)] bg-[var(--surf)] text-[var(--text)] text-sm outline-none focus:border-[var(--p)]"
                    />
                    <button
                      type="button"
                      onClick={handlePasteUrl}
                      className="flex-none h-10 px-3 border border-[var(--p)] bg-transparent text-[var(--p)] text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-[var(--ptint)]"
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="8" y="2" width="8" height="4" rx="1"></rect>
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                      </svg>
                      Paste
                    </button>
                  </div>
                </div>

                {/* Stages: Idle / Fetching / Ready */}
                {addStage === 'idle' && (
                  <div className="border border-dashed border-[var(--line)] p-5 text-center text-xs text-[var(--muted)]">
                    Paste or type a URL. The title, preview, and category are suggested automatically.
                  </div>
                )}

                {addStage === 'fetching' && (
                  <div className="border border-[var(--line)] p-5 flex items-center justify-center gap-2.5 text-xs text-[var(--muted)]">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--p)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      className="animate-spin-slow"
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                    </svg>
                    <span>Fetching preview from {domainOf(addUrl)}...</span>
                  </div>
                )}

                {addStage === 'ready' && (
                  <div className="blueprint grid grid-cols-[88px_1fr]">
                    <i className="corner tl"></i>
                    <i className="corner tr"></i>
                    <i className="corner bl"></i>
                    <i className="corner br"></i>
                    <div
                      className="border-r border-[var(--line)] overflow-hidden flex items-center justify-center text-2xl font-semibold min-h-[92px] relative bg-[var(--surf)]"
                      style={{
                        background: addImage
                          ? undefined
                          : `repeating-linear-gradient(135deg, var(--line) 0 1px, transparent 1px 7px), color-mix(in oklch, var(--hl) 22%, transparent)`,
                      }}
                    >
                      {addImage ? (
                        <img
                          src={addImage}
                          alt={addTitle}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{((domainOf(addUrl) || addTitle || 'Strand').replace(/^https?:\/\//i, '').replace(/^www\./i, '')[0] || 'S').toUpperCase()}</span>
                      )}
                    </div>
                    <div className="p-2.5 flex flex-col gap-1 min-w-0">
                      <span className="text-[10px] tracking-wider uppercase text-[var(--p)] font-semibold flex items-center gap-1">
                        <svg
                          width="11"
                          height="11"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        >
                          <path d="M20 6 9 17l-5-5"></path>
                        </svg>
                        Preview fetched
                      </span>
                      <input
                        value={addTitle}
                        onChange={e => setAddTitle(e.target.value)}
                        className="border-0 border-b border-[var(--line)] bg-transparent text-[var(--text)] text-sm font-semibold py-0.5 outline-none focus:border-[var(--p)]"
                      />
                      <span className="text-xs text-[var(--muted)]">
                        {domainOf(addUrl)} · sample
                      </span>
                    </div>
                  </div>
                )}

                {/* Auto-Category suggestion banner */}
                {addSuggestion && (
                  <div
                    className={`p-2.5 text-xs border ${
                      addSuggestion.isClearMatch
                        ? 'bg-[var(--surf)] border-[var(--p)] text-[var(--text)]'
                        : 'bg-amber-500/10 border-amber-500/30 text-[var(--text)]'
                    }`}
                  >
                    <div className="font-semibold mb-0.5">
                      {addSuggestion.isClearMatch
                        ? `Auto-Assigned: ${addSuggestion.category}`
                        : 'No Clear Category Determined'}
                    </div>
                    <div className="text-[11px] opacity-80">{addSuggestion.reason}</div>
                  </div>
                )}

                {/* Collection Chips */}
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] tracking-wider uppercase text-[var(--muted)] font-semibold">
                    Collection
                  </span>
                  <div className="flex gap-1.5 flex-wrap">
                    {collections.map(c => {
                      const isSel = addCollection === c;
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setAddCollection(c)}
                          className={`h-[30px] px-3 border text-xs font-medium cursor-pointer transition ${
                            isSel
                              ? 'bg-[var(--p)] text-[var(--on-p)] border-[var(--p)]'
                              : 'bg-transparent text-[var(--text)] border-[var(--line)] hover:bg-[var(--ptint)]'
                          }`}
                        >
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tags Chips & Add Tag */}
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] tracking-wider uppercase text-[var(--muted)] font-semibold">
                    Tags
                  </span>
                  <div className="flex gap-1.5 flex-wrap">
                    {addTags.map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setAddTags(addTags.filter(x => x !== t))}
                        className="h-[30px] px-2.5 border border-[var(--p)] bg-[var(--p)] text-[var(--on-p)] text-xs font-medium cursor-pointer"
                      >
                        #{t} ×
                      </button>
                    ))}
                    <div className="flex h-[30px] border border-dashed border-[var(--line)]">
                      <input
                        type="text"
                        value={newTagInput}
                        onChange={e => setNewTagInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddNewTag();
                          }
                        }}
                        placeholder="New tag"
                        className="w-20 border-0 bg-transparent text-[var(--text)] text-xs px-2 outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddNewTag}
                        className="w-7 border-0 border-l border-dashed border-[var(--line)] bg-transparent text-[var(--p)] flex items-center justify-center cursor-pointer"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        >
                          <path d="M5 12h14"></path>
                          <path d="M12 5v14"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Note Field */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] tracking-wider uppercase text-[var(--muted)] font-semibold">
                    Note
                  </span>
                  <textarea
                    value={addNote}
                    onChange={e => setAddNote(e.target.value)}
                    placeholder="Why you saved it (optional)"
                    rows={3}
                    className="border border-[var(--line)] bg-[var(--surf)] text-[var(--text)] text-sm p-2.5 resize-none outline-none focus:border-[var(--p)]"
                  ></textarea>
                </div>

                {/* Save Blueprint Button */}
                <button
                  type="button"
                  onClick={handleSaveAdd}
                  className="blueprint h-11 bg-[var(--btn)] text-white border-0 text-base font-semibold cursor-pointer hover:brightness-105 active:scale-95"
                >
                  <i className="corner tl"></i>
                  <i className="corner tr"></i>
                  <i className="corner bl"></i>
                  <i className="corner br"></i>
                  Save link
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 3: LINK DETAIL (Offline Reader) */}
          {screen === 'detail' && currentDetail && (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between px-2 pt-1 pb-1.5">
                <button
                  onClick={() => setScreen('home')}
                  className="h-9 px-1 text-[var(--p)] text-sm font-medium bg-transparent border-0 flex items-center gap-0.5 cursor-pointer"
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m15 18-6-6 6-6"></path>
                  </svg>
                  Links
                </button>

                <div className="flex items-center gap-2 pr-3">
                  <button
                    onClick={() => {
                      updateLinks(
                        links.map(x =>
                          x.id === currentDetail.id ? { ...x, isStarred: !x.isStarred } : x
                        )
                      );
                      flash(currentDetail.isStarred ? 'Removed from starred' : 'Starred');
                    }}
                    className="p-1 text-[var(--muted)] hover:text-amber-500 cursor-pointer"
                  >
                    <span className="text-base">{currentDetail.isStarred ? '⭐' : '☆'}</span>
                  </button>
                  <span className="text-[9.5px] tracking-wider font-semibold px-1.5 py-0.5 border border-[var(--line)] text-[var(--muted)]">
                    SAMPLE
                  </span>
                </div>
              </div>

              <div className="px-5 pb-6 flex flex-col gap-4">
                {/* Hero Box */}
                <div
                  className="blueprint h-44 flex items-center justify-center overflow-hidden"
                  style={{
                    background: currentDetail.image
                      ? `url(${currentDetail.image}) center/cover no-repeat`
                      : `repeating-linear-gradient(135deg, var(--line) 0 1px, transparent 1px 8px), color-mix(in oklch, ${currentDetail.tint || '#1F6B4F'} 22%, transparent)`,
                  }}
                >
                  <i className="corner tl"></i>
                  <i className="corner tr"></i>
                  <i className="corner bl"></i>
                  <i className="corner br"></i>
                  {!currentDetail.image && (
                    <span className="font-semibold text-6xl opacity-85">
                      {((currentDetail.domain || currentDetail.title || 'Strand').replace(/^https?:\/\//i, '').replace(/^www\./i, '')[0] || 'S').toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Title & Metadata */}
                <div className="flex flex-col gap-1.5">
                  <h1 className="text-2xl font-semibold leading-snug">
                    {currentDetail.title}
                  </h1>
                  <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                    <span
                      className="w-4 h-4 flex-none font-bold text-[10px] flex items-center justify-center"
                      style={{
                        backgroundColor: currentDetail.tint || '#1F6B4F',
                        color: favFg(currentDetail.tint || '#1F6B4F'),
                      }}
                    >
                      {((currentDetail.domain || currentDetail.title || 'Strand').replace(/^https?:\/\//i, '').replace(/^www\./i, '')[0] || 'S').toUpperCase()}
                    </span>
                    <span>{currentDetail.domain}</span>
                    <span>·</span>
                    <span>Saved {currentDetail.date}</span>
                    <span>·</span>
                    <span className="font-medium text-[var(--text)]">{currentDetail.platform}</span>
                  </div>
                </div>

                {/* 2-Column Info Grid */}
                <div className="grid grid-cols-2 border border-[var(--line)]">
                  <div className="p-2.5 border-r border-[var(--line)] flex flex-col gap-1">
                    <span className="text-[10.5px] tracking-wider uppercase text-[var(--muted)] font-semibold">
                      Collection
                    </span>
                    <span className="text-sm font-medium">
                      {currentDetail.collection || currentDetail.category}
                    </span>
                  </div>
                  <div className="p-2.5 flex flex-col gap-1">
                    <span className="text-[10.5px] tracking-wider uppercase text-[var(--muted)] font-semibold">
                      Tags
                    </span>
                    <div className="flex gap-1.5 flex-wrap text-sm">
                      {(currentDetail.tags || []).map(t => (
                        <span key={t} className="text-[var(--p)] font-medium">
                          #{t.replace(/^#/, '')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Note Box */}
                <div className="bg-[var(--surf)] border border-[var(--line)] p-3 flex flex-col gap-1">
                  <span className="text-[10.5px] tracking-wider uppercase text-[var(--muted)] font-semibold">
                    Note
                  </span>
                  <span className="text-sm leading-relaxed">
                    {currentDetail.notes || 'No note yet.'}
                  </span>
                </div>

                {/* Offline Content / Excerpt */}
                <div className="bg-[var(--surf)] border border-[var(--line)] p-3 flex flex-col gap-1.5 text-xs leading-relaxed whitespace-pre-line">
                  <span className="text-[10.5px] tracking-wider uppercase text-[var(--muted)] font-semibold">
                    Offline Snapshot
                  </span>
                  <div>{currentDetail.contentSnapshot || currentDetail.description}</div>
                </div>

                {/* Action Buttons Row */}
                <div className="grid grid-cols-[1fr_46px_46px] gap-2 pt-1">
                  <a
                    href={currentDetail.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="blueprint h-11 bg-[var(--btn)] text-white border-0 text-sm font-semibold flex items-center justify-center gap-2 no-underline hover:brightness-105 active:scale-95"
                  >
                    <i className="corner tl"></i>
                    <i className="corner tr"></i>
                    <i className="corner bl"></i>
                    <i className="corner br"></i>
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M15 3h6v6"></path>
                      <path d="M10 14 21 3"></path>
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    </svg>
                    Open link
                  </a>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(currentDetail.url);
                      flash('Link copied to clipboard');
                    }}
                    className="h-11 border border-[var(--line)] bg-transparent text-[var(--text)] flex items-center justify-center cursor-pointer hover:bg-[var(--ptint)]"
                    title="Share / Copy Link"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                      <path d="m16 6-4-4-4 4"></path>
                      <path d="M12 2v13"></path>
                    </svg>
                  </button>

                  <button
                    onClick={() => setConfirmDialog('delete')}
                    className="h-11 border border-[var(--line)] bg-transparent text-[var(--acc)] flex items-center justify-center cursor-pointer hover:bg-rose-500/10"
                    title="Delete link"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 4: ORGANISE (Collections & Tags) */}
          {screen === 'collections' && (
            <div className="p-5 flex flex-col gap-4">
              <h1 className="text-3xl font-semibold">Organise</h1>

              {/* Segmented Control */}
              <div className="grid grid-cols-2 border border-[var(--line)] h-9">
                <button
                  onClick={() => setOrgTab('collections')}
                  className={`border-0 text-xs font-semibold cursor-pointer transition ${
                    orgTab === 'collections'
                      ? 'bg-[var(--p)] text-[var(--on-p)]'
                      : 'bg-transparent text-[var(--text)]'
                  }`}
                >
                  Collections
                </button>
                <button
                  onClick={() => setOrgTab('tags')}
                  className={`border-0 text-xs font-semibold cursor-pointer transition ${
                    orgTab === 'tags'
                      ? 'bg-[var(--p)] text-[var(--on-p)]'
                      : 'bg-transparent text-[var(--text)]'
                  }`}
                >
                  Tags
                </button>
              </div>

              {/* Collections Grid */}
              {orgTab === 'collections' && (
                <div className="grid grid-cols-2 gap-3.5 pt-1">
                  {collections.map(col => {
                    const count = links.filter(
                      l => l.collection === col || l.category === col
                    ).length;

                    return (
                      <button
                        key={col}
                        onClick={() => {
                          setFilter(`c:${col}`);
                          setQuery('');
                          setScreen('home');
                        }}
                        className="blueprint h-[118px] p-3 bg-transparent text-[var(--text)] text-left flex flex-col justify-between cursor-pointer hover:bg-[var(--ptint)] transition"
                      >
                        <i className="corner tl"></i>
                        <i className="corner tr"></i>
                        <i className="corner bl"></i>
                        <i className="corner br"></i>
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="var(--p)"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"></path>
                        </svg>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-base truncate">{col}</span>
                          <span className="text-xs text-[var(--muted)]">
                            {count} {count === 1 ? 'link' : 'links'}
                          </span>
                        </div>
                      </button>
                    );
                  })}

                  {/* New Collection Button */}
                  <button
                    onClick={() => {
                      const name = prompt('New collection name:');
                      if (name && name.trim()) {
                        const clean = name.trim();
                        if (!collections.includes(clean)) {
                          updateCollections([...collections, clean]);
                          flash(`Created collection "${clean}"`);
                        }
                      }
                    }}
                    className="h-[118px] border border-dashed border-[var(--line)] bg-transparent text-[var(--p)] text-xs font-semibold flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:bg-[var(--ptint)] transition"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    >
                      <path d="M5 12h14"></path>
                      <path d="M12 5v14"></path>
                    </svg>
                    New collection
                  </button>
                </div>
              )}

              {/* Tags View */}
              {orgTab === 'tags' && (
                <div className="flex flex-col border-t border-[var(--line)]">
                  {Object.keys(tagMap)
                    .sort()
                    .map(t => (
                      <button
                        key={t}
                        onClick={() => {
                          setFilter(`t:${t}`);
                          setQuery('');
                          setScreen('home');
                        }}
                        className="flex items-center justify-between h-12 px-1 border-b border-[var(--line)] bg-transparent text-sm cursor-pointer hover:bg-[var(--ptint)] transition"
                      >
                        <span className="font-medium text-[var(--p)]">#{t}</span>
                        <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                          <span>{tagMap[t]}</span>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="m9 18 6-6-6-6"></path>
                          </svg>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* SCREEN 5: SETTINGS */}
          {screen === 'settings' && (
            <div className="p-5 flex flex-col gap-4">
              <h1 className="text-3xl font-semibold">Settings</h1>

              {/* Appearance */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] tracking-wider uppercase text-[var(--muted)] font-semibold">
                  Appearance
                </span>
                <div className="grid grid-cols-3 border border-[var(--line)] h-9">
                  {(['Light', 'Dark', 'System'] as StrandAppearance[]).map(opt => (
                    <button
                      key={opt}
                      onClick={() => setAppearance(opt)}
                      className={`border-0 text-xs font-semibold cursor-pointer transition ${
                        appearance === opt
                          ? 'bg-[var(--p)] text-[var(--on-p)]'
                          : 'bg-transparent text-[var(--text)]'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Open Links In */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] tracking-wider uppercase text-[var(--muted)] font-semibold">
                  Open links in
                </span>
                <div className="grid grid-cols-2 border border-[var(--line)] h-9">
                  {(['In app', 'Browser'] as StrandOpenIn[]).map(opt => (
                    <button
                      key={opt}
                      onClick={() => setOpenIn(opt)}
                      className={`border-0 text-xs font-semibold cursor-pointer transition ${
                        openIn === opt
                          ? 'bg-[var(--p)] text-[var(--on-p)]'
                          : 'bg-transparent text-[var(--text)]'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-col border-t border-[var(--line)]">
                {[
                  {
                    key: 'fetch' as const,
                    label: 'Fetch previews',
                    sub: 'Title, metadata and images when you save a URL',
                  },
                  {
                    key: 'thumbs' as const,
                    label: 'Show thumbnails',
                    sub: 'Turn off for a denser text list',
                  },
                  {
                    key: 'unread' as const,
                    label: 'Mark unread',
                    sub: 'Highlight links you haven’t opened yet',
                  },
                ].map(t => {
                  const on = prefs[t.key];
                  return (
                    <button
                      key={t.key}
                      onClick={() => updatePrefs({ ...prefs, [t.key]: !on })}
                      className="flex items-center justify-between py-3 border-b border-[var(--line)] bg-transparent text-left cursor-pointer"
                    >
                      <div className="flex-1 pr-3">
                        <div className="text-sm font-medium">{t.label}</div>
                        <div className="text-xs text-[var(--muted)]">{t.sub}</div>
                      </div>
                      <span
                        className={`w-11 h-6 flex items-center p-0.5 border transition ${
                          on
                            ? 'bg-[var(--p)] border-[var(--p)] justify-end'
                            : 'bg-transparent border-[var(--line)] justify-start'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 transition ${
                            on ? 'bg-[var(--on-p)]' : 'bg-[var(--muted)]'
                          }`}
                        ></span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Export / Backups / Clear */}
              <div className="flex flex-col border-t border-[var(--line)]">
                <button
                  onClick={handleExportCSV}
                  className="flex items-center justify-between h-12 border-b border-[var(--line)] bg-transparent text-sm font-medium cursor-pointer"
                >
                  <span>Export links (.csv)</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--muted)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m9 18 6-6-6-6"></path>
                  </svg>
                </button>

                <button
                  onClick={() => {
                    const json = exportVaultJSON();
                    const blob = new Blob([json], { type: 'application/json' });
                    const u = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = u;
                    a.download = `strand-vault-${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                    URL.revokeObjectURL(u);
                    flash('Vault backup exported');
                  }}
                  className="flex items-center justify-between h-12 border-b border-[var(--line)] bg-transparent text-sm font-medium cursor-pointer"
                >
                  <span>Backup vault (.json)</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--muted)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m9 18 6-6-6-6"></path>
                  </svg>
                </button>

                <label className="flex items-center justify-between h-12 border-b border-[var(--line)] bg-transparent text-sm font-medium cursor-pointer">
                  <span>Restore vault backup (.json)</span>
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = ev => {
                        const content = ev.target?.result as string;
                        if (content) {
                          const res = importVaultJSON(content);
                          if (res.success) {
                            setLinks(getStoredPosts());
                            setCollections(getStoredCollections());
                            flash(`Imported ${res.count} links`);
                          } else {
                            flash('Failed to import backup');
                          }
                        }
                      };
                      reader.readAsText(file);
                    }}
                  />
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--muted)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m9 18 6-6-6-6"></path>
                  </svg>
                </label>

                <button
                  onClick={() => setConfirmDialog('clear')}
                  className="flex items-center h-12 border-b border-[var(--line)] bg-transparent text-sm font-medium text-[var(--acc)] cursor-pointer"
                >
                  Delete all links
                </button>
              </div>

              <span className="text-xs text-[var(--muted)] text-center pt-2">
                Strand 1.0 · Three Strand Labs
              </span>
            </div>
          )}
        </div>

        {/* BOTTOM NAVIGATION (4 Tabs) */}
        {screen !== 'add' && (
          <div className="flex-none grid grid-cols-4 items-center h-[62px] pb-[18px] border-t border-[var(--line)] bg-[var(--bg)]">
            {/* Tab 1: Links */}
            <button
              onClick={() => setScreen('home')}
              className={`h-14 border-0 bg-transparent flex flex-col items-center justify-center gap-1 text-[11px] font-semibold cursor-pointer ${
                screen === 'home' || screen === 'detail'
                  ? 'text-[var(--p)]'
                  : 'text-[var(--muted)]'
              }`}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
              <span>Links</span>
            </button>

            {/* Tab 2: Organise */}
            <button
              onClick={() => setScreen('collections')}
              className={`h-14 border-0 bg-transparent flex flex-col items-center justify-center gap-1 text-[11px] font-semibold cursor-pointer ${
                screen === 'collections' ? 'text-[var(--p)]' : 'text-[var(--muted)]'
              }`}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"></path>
              </svg>
              <span>Organise</span>
            </button>

            {/* Tab 3: Center Add Button (Terracotta Blueprint) */}
            <button
              onClick={() => {
                setScreen('add');
                setAddStage('idle');
                setAddUrl('');
                setAddTitle('');
                setAddNote('');
              }}
              className="h-14 border-0 bg-transparent flex items-center justify-center cursor-pointer"
            >
              <span className="blueprint w-10 h-8 bg-[var(--btn)] text-white border-0 flex items-center justify-center shadow-sm">
                <i className="corner tl"></i>
                <i className="corner tr"></i>
                <i className="corner bl"></i>
                <i className="corner br"></i>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                >
                  <path d="M5 12h14"></path>
                  <path d="M12 5v14"></path>
                </svg>
              </span>
            </button>

            {/* Tab 4: Settings */}
            <button
              onClick={() => setScreen('settings')}
              className={`h-14 border-0 bg-transparent flex flex-col items-center justify-center gap-1 text-[11px] font-semibold cursor-pointer ${
                screen === 'settings' ? 'text-[var(--p)]' : 'text-[var(--muted)]'
              }`}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4"></path>
              </svg>
              <span>Settings</span>
            </button>
          </div>
        )}

        {/* Home Indicator Bar */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 rounded-full bg-[var(--text)] opacity-80 pointer-events-none"></div>

        {/* Toast Overlay */}
        {toast && (
          <div className="absolute left-1/2 bottom-24 -translate-x-1/2 bg-[var(--text)] text-[var(--bg)] text-xs font-semibold px-3.5 py-2 whitespace-nowrap flex items-center gap-2 shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--hl)"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M20 6 9 17l-5-5"></path>
            </svg>
            <span>{toast}</span>
          </div>
        )}

        {/* Bottom Sheet Confirm Dialog */}
        {confirmDialog && (
          <div
            onClick={() => setConfirmDialog(null)}
            className="absolute inset-0 bg-black/40 z-50 flex items-end animate-in fade-in"
          >
            <div
              onClick={e => e.stopPropagation()}
              className="w-full bg-[var(--sheet)] border-t border-[var(--line)] p-5 pb-9 flex flex-col gap-2"
            >
              <span className="font-semibold text-lg">
                {confirmDialog === 'delete' ? 'Delete this link?' : 'Delete all links?'}
              </span>
              <span className="text-xs leading-relaxed text-[var(--muted)]">
                {confirmDialog === 'delete'
                  ? `"${currentDetail?.title}" will be removed from your offline vault.`
                  : `All ${links.length} saved links, collections, and notes will be permanently removed.`}
              </span>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="h-11 border border-[var(--line)] bg-transparent text-[var(--text)] text-sm font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDialog === 'delete' ? handleDeleteCurrent : handleDeleteAll}
                  className="blueprint h-11 bg-[var(--btn)] text-white border-0 text-sm font-semibold cursor-pointer"
                >
                  <i className="corner tl"></i>
                  <i className="corner tr"></i>
                  <i className="corner bl"></i>
                  <i className="corner br"></i>
                  {confirmDialog === 'delete' ? 'Delete' : 'Delete all'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Share Simulator Modal */}
      <ShareSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onSimulateShare={payload => {
          const clean = cleanTrackingParams(payload.url || payload.text);
          const platform = detectPlatformFromUrl(clean);
          const suggestion = predictCategory(payload.text, payload.title, clean);
          setIncomingShare({
            url: payload.url,
            cleanUrl: clean,
            rawText: payload.text,
            title: payload.title,
            platform,
            suggestedCategory: suggestion.category,
            categoryReason: suggestion.reason,
            isClearMatch: suggestion.isClearMatch,
          });
        }}
      />

      {/* Incoming Share Toast Banner */}
      <IncomingShareToast
        payload={incomingShare}
        categories={categories}
        onConfirmSave={handleConfirmIncomingShare}
        onDismiss={() => setIncomingShare(null)}
        onAddCategory={cat => {
          if (!collections.includes(cat.name)) {
            updateCollections([...collections, cat.name]);
          }
          updateCategories([...categories, cat]);
        }}
      />

      {/* Offline Mode Indicator */}
      <OfflineIndicator />
    </div>
  );
}
