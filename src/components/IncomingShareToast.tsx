import React, { useEffect, useState } from 'react';
import { IncomingSharePayload } from '../services/shareTarget';
import { CategoryDef, SavedPost } from '../types';

interface IncomingShareToastProps {
  payload: IncomingSharePayload | null;
  categories: CategoryDef[];
  onConfirmSave: (post: SavedPost) => void;
  onDismiss: () => void;
  onAddCategory: (name: string, emoji?: string) => void;
}

export const IncomingShareToast: React.FC<IncomingShareToastProps> = ({
  payload,
  categories,
  onConfirmSave,
  onDismiss,
  onAddCategory,
}) => {
  const [selectedCat, setSelectedCat] = useState<string>(payload?.suggestedCategory || '');
  const [customTitle, setCustomTitle] = useState(payload?.title || '');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (payload) {
      setSelectedCat(payload.suggestedCategory || categories[0]?.name || '');
      setCustomTitle(payload.title || '');
      setIsCreatingNew(false);
      setErrorMessage('');
    }
  }, [payload, categories]);

  if (!payload) return null;

  const handleCreateNewCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newCatName.trim();
    if (!clean) return;
    onAddCategory(clean, '📁');
    setSelectedCat(clean);
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
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-50 sm:max-w-md w-auto sm:w-full">
      <div className="blueprint bg-[var(--bg)] text-[var(--text)] p-4 max-h-[75vh] overflow-y-auto">
        <i className="corner tl"></i>
        <i className="corner tr"></i>
        <i className="corner bl"></i>
        <i className="corner br"></i>

        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--p)]">
              Share Sheet Received
            </span>
            <h3 className="text-sm font-semibold truncate max-w-[240px]">
              {payload.title || `${payload.platform} link`}
            </h3>
          </div>
          <button
            onClick={onDismiss}
            className="p-1 text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-[var(--muted)] truncate mb-3">{payload.cleanUrl}</p>

        <div
          className={`p-2.5 text-xs mb-3 border ${
            payload.isClearMatch ? 'border-[var(--p)] bg-[var(--ptint)]' : 'border-amber-500/30 bg-amber-500/10'
          }`}
        >
          {payload.isClearMatch ? (
            <span>
              <strong>Auto-assigned to {payload.suggestedCategory}:</strong> {payload.categoryReason}
            </span>
          ) : (
            <span>No clear category determined. Please select or create one below.</span>
          )}
        </div>

        {errorMessage && <p className="text-xs font-semibold text-[var(--acc)] mb-2">{errorMessage}</p>}

        <div className="mb-3 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
              Category
            </label>
            <button
              type="button"
              onClick={() => setIsCreatingNew(!isCreatingNew)}
              className="text-[11px] font-semibold text-[var(--p)] cursor-pointer hover:underline"
            >
              + New category
            </button>
          </div>

          {isCreatingNew && (
            <form onSubmit={handleCreateNewCategory} className="flex gap-1.5">
              <input
                type="text"
                placeholder="e.g. Podcasts"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                className="flex-1 px-2.5 py-1 text-xs border border-[var(--line)] bg-[var(--surf)] text-[var(--text)] outline-none focus:border-[var(--p)]"
              />
              <button type="submit" className="px-2.5 py-1 bg-[var(--p)] text-[var(--on-p)] text-xs font-semibold cursor-pointer">
                Create
              </button>
            </form>
          )}

          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCat(cat.name);
                  setErrorMessage('');
                }}
                className={`px-2.5 py-1 text-xs font-medium border cursor-pointer transition ${
                  selectedCat === cat.name
                    ? 'bg-[var(--p)] text-[var(--on-p)] border-[var(--p)]'
                    : 'bg-transparent text-[var(--text)] border-[var(--line)] hover:bg-[var(--ptint)]'
                }`}
              >
                {cat.emoji} {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--line)]">
          <button
            onClick={onDismiss}
            className="px-3 py-1.5 text-xs font-semibold text-[var(--muted)] cursor-pointer hover:text-[var(--text)]"
          >
            Dismiss
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 bg-[var(--btn)] text-white text-xs font-semibold cursor-pointer hover:brightness-105"
          >
            Save offline
          </button>
        </div>
      </div>
    </div>
  );
};
