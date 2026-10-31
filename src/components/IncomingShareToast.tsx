import React, { useState, useEffect } from 'react';
import { Share2, Check, X, Sparkles, Layers, HardDrive, AlertCircle, Plus } from 'lucide-react';
import { IncomingSharePayload } from '../services/shareTarget';
import { CategoryDef, SavedPost } from '../types';

interface IncomingShareToastProps {
  payload: IncomingSharePayload | null;
  categories: CategoryDef[];
  onConfirmSave: (post: SavedPost) => void;
  onDismiss: () => void;
  onAddCategory?: (category: CategoryDef) => void;
}

export const IncomingShareToast: React.FC<IncomingShareToastProps> = ({
  payload,
  categories,
  onConfirmSave,
  onDismiss,
  onAddCategory,
}) => {
  if (!payload) return null;

  const [selectedCat, setSelectedCat] = useState<string>(payload.suggestedCategory || '');
  const [customTitle, setCustomTitle] = useState(payload.title || '');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('📁');
  const [errorMessage, setErrorMessage] = useState('');

  // Update selected category when payload changes
  useEffect(() => {
    if (payload) {
      setSelectedCat(payload.suggestedCategory || (categories.length > 0 ? categories[0].id : 'Food'));
      setCustomTitle(payload.title || '');
      setIsCreatingNew(false);
      setErrorMessage('');
    }
  }, [payload, categories]);

  const handleCreateNewCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newCatName.trim();
    if (!cleanName) return;

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
    setSelectedCat(newCategory.id);
    setIsCreatingNew(false);
    setNewCatName('');
  };

  const handleSave = () => {
    if (!selectedCat) {
      setErrorMessage('Please select or create a category for this link');
      return;
    }

    const post: SavedPost = {
      id: `share-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      url: payload.cleanUrl,
      title: customTitle.trim() || payload.title || `${payload.platform} Share`,
      description: payload.rawText || 'Saved directly from social media share sheet.',
      contentSnapshot: payload.rawText,
      siteName: payload.platform,
      platform: payload.platform,
      category: selectedCat,
      tags: [selectedCat.toLowerCase(), payload.platform.toLowerCase().replace(/[^a-z]/g, '')],
      isStarred: false,
      isArchived: false,
      isRead: false,
      readTimeEstimate: '2 min read',
      savedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      offlineAvailable: true,
    };

    onConfirmSave(post);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in slide-in-from-bottom-5 duration-200">
      <div className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-indigo-500 shadow-2xl p-5 text-slate-900 dark:text-slate-100 max-h-[85vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/20">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Share Sheet Received
              </span>
              <h3 className="text-sm font-bold truncate max-w-[240px]">
                {payload.title || `${payload.platform} Link`}
              </h3>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 font-mono mb-3">
          {payload.cleanUrl}
        </p>

        {/* Category Auto-Detection Banner */}
        <div
          className={`p-2.5 rounded-xl text-xs mb-3 flex items-start gap-2 border ${
            payload.isClearMatch
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800'
          }`}
        >
          {payload.isClearMatch ? (
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          )}
          <div className="text-[11px] leading-snug">
            {payload.isClearMatch ? (
              <span>
                <strong>Auto-assigned to {payload.suggestedCategory}:</strong> {payload.categoryReason}
              </span>
            ) : (
              <span>
                <strong>No clear category determined.</strong> Please manually select below or create a new category.
              </span>
            )}
          </div>
        </div>

        {errorMessage && (
          <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mb-2">
            {errorMessage}
          </p>
        )}

        {/* Category Selection / Creation */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3 h-3 text-indigo-500" />
              <span>Category: {selectedCat && `(${selectedCat})`}</span>
            </label>

            <button
              type="button"
              onClick={() => setIsCreatingNew(!isCreatingNew)}
              className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>+ New Category</span>
            </button>
          </div>

          {/* Inline category creation form */}
          {isCreatingNew && (
            <form onSubmit={handleCreateNewCategory} className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 space-y-2 text-xs">
              <span className="font-semibold text-indigo-900 dark:text-indigo-200">
                New Category Name:
              </span>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="e.g. Podcasts, Architecture"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg font-bold text-xs shadow-sm hover:bg-indigo-700"
                >
                  Create
                </button>
              </div>
            </form>
          )}

          {/* Category Chips */}
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCat(cat.id);
                  setErrorMessage('');
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                  selectedCat === cat.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.name}</span>
                {selectedCat === cat.id && <Check className="w-3 h-3" />}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <HardDrive className="w-3 h-3" />
            Saves offline to vault
          </span>

          <div className="flex gap-2">
            <button
              onClick={onDismiss}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Dismiss
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-500/20 active:scale-95 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Save Offline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
