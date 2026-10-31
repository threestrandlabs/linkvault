import React, { useState, useEffect } from 'react';
import {
  X,
  Link as LinkIcon,
  Sparkles,
  Layers,
  Tag as TagIcon,
  FileText,
  Loader2,
  Clipboard,
  CheckCircle2,
  AlertCircle,
  Plus,
  Check,
  ChevronDown,
  Info
} from 'lucide-react';
import { SavedPost, CategoryDef, PlatformType } from '../types';
import { detectPlatformFromUrl, cleanTrackingParams } from '../services/shareTarget';
import { analyzeCategoryForLink, CategorySuggestion } from '../services/categoryEngine';

interface AddEditPostModalProps {
  isOpen: boolean;
  categories: CategoryDef[];
  onClose: () => void;
  onSave: (post: SavedPost) => void;
  onAddCategory?: (category: CategoryDef) => void;
}

const QUICK_EMOJIS = ['🍔', '✈️', '💻', '👗', '🏋️', '🎬', '💡', '📚', '☕', '🎮', '🏡', '🎨', '🚗', '🌿', '🎵', '💼'];

export const AddEditPostModal: React.FC<AddEditPostModalProps> = ({
  isOpen,
  categories,
  onClose,
  onSave,
  onAddCategory,
}) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [category, setCategory] = useState<string>('');
  const [tagsInput, setTagsInput] = useState('');
  const [notes, setNotes] = useState('');
  const [author, setAuthor] = useState('');
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-categorization state & explanation
  const [suggestion, setSuggestion] = useState<CategorySuggestion | null>(null);

  // Inline "Create New Category" state
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('📚');
  const [catError, setCatError] = useState('');

  // Re-run category analysis whenever url, title, or description changes
  const runCategoryAnalysis = (currentUrl: string, currentTitle: string, currentDesc: string) => {
    if (!currentUrl.trim()) {
      setSuggestion(null);
      return;
    }
    const result = analyzeCategoryForLink({
      url: currentUrl,
      title: currentTitle,
      description: currentDesc,
    });
    setSuggestion(result);

    if (result.isClearMatch && result.category) {
      setCategory(result.category);
    } else {
      // If no clear match and current category hasn't been explicitly selected by user, keep unselected or clear
      if (!category) {
        setCategory('');
      }
    }
  };

  const handleUrlBlurOrPaste = async (inputUrl: string) => {
    const trimmed = inputUrl.trim();
    if (!trimmed) return;

    const cleaned = cleanTrackingParams(trimmed);

    // Initial instant heuristic analysis
    runCategoryAnalysis(cleaned, title, description);

    // Fetch rich metadata from server
    setIsLoadingMetadata(true);
    setErrorMsg('');

    try {
      const response = await (import.meta.env.VITE_API_BASE === undefined && import.meta.env.PROD
          ? Promise.reject(new Error('No metadata server on static hosting'))
          : fetch(`${import.meta.env.VITE_API_BASE ?? ''}/api/scrape-metadata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cleaned, titleFallback: title, textFallback: description }),
      }));

      if (response.ok) {
        const data = await response.json();
        const newTitle = data.title && !title ? data.title : title;
        const newDesc = data.description && !description ? data.description : description;

        if (data.title && !title) setTitle(data.title);
        if (data.description && !description) setDescription(data.description);
        if (data.image && !image) setImage(data.image);
        if (data.author && !author) setAuthor(data.author);

        if (data.tags && data.tags.length > 0 && !tagsInput) {
          setTagsInput(data.tags.join(', '));
        }

        // Re-run analysis with the newly scraped title and meta description
        const refinedResult = analyzeCategoryForLink({
          url: cleaned,
          title: newTitle,
          description: newDesc,
        });
        setSuggestion(refinedResult);

        if (refinedResult.isClearMatch && refinedResult.category) {
          setCategory(refinedResult.category);
        }
      }
    } catch {
      console.log('Scraping skipped or blocked, utilizing local category engine.');
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        await handleUrlBlurOrPaste(text);
      }
    } catch {
      setErrorMsg('Clipboard access denied. Please paste manually.');
    }
  };

  const handleCreateNewCategoryInline = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newCatName.trim();
    if (!cleanName) {
      setCatError('Category name is required');
      return;
    }

    if (categories.some(c => c.name.toLowerCase() === cleanName.toLowerCase())) {
      setCatError('This category already exists');
      return;
    }

    const newCategory: CategoryDef = {
      id: cleanName,
      name: cleanName,
      emoji: newCatEmoji,
      color: 'indigo',
      bgLight: 'bg-indigo-50',
      bgDark: 'dark:bg-indigo-950/40',
      textColor: 'text-indigo-700',
      borderColor: 'border-indigo-200',
      description: `${cleanName} links`,
      isDefault: false,
    };

    if (onAddCategory) {
      onAddCategory(newCategory);
    }

    // Immediately select this newly created category!
    setCategory(newCategory.id);
    setIsCreatingCategory(false);
    setNewCatName('');
    setCatError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setErrorMsg('Please enter a valid link');
      return;
    }

    if (!category) {
      setErrorMsg('Please select a category or create a new one to keep your links organized');
      return;
    }

    const cleanUrl = cleanTrackingParams(url.trim());
    const platform = detectPlatformFromUrl(cleanUrl);
    const parsedTags = tagsInput
      .split(',')
      .map(t => t.trim().toLowerCase().replace(/^#/, ''))
      .filter(Boolean);

    const newPost: SavedPost = {
      id: `post-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      url: cleanUrl,
      title: title.trim() || new URL(cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`).hostname,
      description: description.trim() || 'Saved directly to offline vault.',
      contentSnapshot: description.trim(),
      image: image.trim() || undefined,
      siteName: new URL(cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`).hostname,
      author: author.trim() || undefined,
      platform,
      category,
      tags: parsedTags.length > 0 ? parsedTags : [category.toLowerCase()],
      notes: notes.trim() || undefined,
      isStarred: false,
      isArchived: false,
      isRead: false,
      readTimeEstimate: '2 min read',
      savedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      offlineAvailable: true,
    };

    onSave(newPost);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-xl my-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl relative text-slate-900 dark:text-slate-100 max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
            <LinkIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Save Link Offline</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Save from Threads, Instagram, Facebook, or any website with auto-categorization
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* URL Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Link URL *
              </label>
              <button
                type="button"
                onClick={handlePasteFromClipboard}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Clipboard className="w-3.5 h-3.5" />
                Paste from Clipboard
              </button>
            </div>
            <div className="relative">
              <input
                type="url"
                required
                placeholder="https://www.threads.net/@user/post/... or https://instagram.com/..."
                value={url}
                onChange={e => {
                  setUrl(e.target.value);
                  runCategoryAnalysis(e.target.value, title, description);
                }}
                onBlur={e => handleUrlBlurOrPaste(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {isLoadingMetadata && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs text-indigo-600 font-medium">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Fetching...</span>
                </div>
              )}
            </div>
          </div>

          {/* Auto-Category Suggestion Status Card */}
          {url.trim() && (
            <div
              className={`p-3 rounded-2xl border text-xs transition-all ${
                suggestion?.isClearMatch
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
                  : 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {suggestion?.isClearMatch ? (
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                )}

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">
                      {suggestion?.isClearMatch
                        ? `Auto-Assigned Category: ${suggestion.category}`
                        : 'No Clear Category Determined'}
                    </span>
                    {suggestion?.confidence && suggestion.confidence !== 'none' && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                        {suggestion.confidence} Confidence
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] opacity-90 leading-relaxed">
                    {suggestion?.reason ||
                      'No obvious domain or keyword pattern matched. Please manually select a category or create a new one below.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Category Picker with Inline "+ Create New" */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                <span>Category * {category ? `(${category})` : '(Please select or create)'}</span>
              </label>

              <button
                type="button"
                onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Category</span>
              </button>
            </div>

            {/* Inline Category Creator Box */}
            {isCreatingCategory && (
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 mb-3 space-y-3 animate-in slide-in-from-top-2">
                <div className="flex items-center justify-between text-xs font-bold text-indigo-950 dark:text-indigo-200">
                  <span>Create Custom Category</span>
                  <button
                    type="button"
                    onClick={() => setIsCreatingCategory(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {catError && (
                  <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                    {catError}
                  </p>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Architecture, Coffee, Gaming, Real Estate"
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleCreateNewCategoryInline}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3 h-3" />
                    <span>Create & Assign</span>
                  </button>
                </div>

                <div>
                  <span className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Pick an Emoji
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_EMOJIS.map(em => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setNewCatEmoji(em)}
                        className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition ${
                          newCatEmoji === em
                            ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-400'
                            : 'bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Existing Category Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {categories.map(cat => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer text-left ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/90 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/30'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 bg-white dark:bg-slate-800/60'
                    }`}
                  >
                    <span className="text-base">{cat.emoji}</span>
                    <span className="truncate flex-1">{cat.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Title
            </label>
            <input
              type="text"
              placeholder="e.g., Best Tonkotsu Ramen in Tokyo"
              value={title}
              onChange={e => {
                setTitle(e.target.value);
                runCategoryAnalysis(url, e.target.value, description);
              }}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Snippet / Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Offline Description / Excerpt (Keywords analyzed for category)
            </label>
            <textarea
              placeholder="Post snippet, instructions, caption or summary..."
              value={description}
              onChange={e => {
                setDescription(e.target.value);
                runCategoryAnalysis(url, title, e.target.value);
              }}
              rows={2}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* User Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <TagIcon className="w-3.5 h-3.5 text-indigo-500" />
              Tags (comma separated, e.g. ramen, recipe, tokyo)
            </label>
            <input
              type="text"
              placeholder="ramen, recipe, dinner"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Personal Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              Personal Notes & Thoughts (Searchable)
            </label>
            <textarea
              placeholder="Private notes (e.g. Try this place on Saturday, buy ingredients, etc.)..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-3 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-2/3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save to Offline Vault</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
