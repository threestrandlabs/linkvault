import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  ExternalLink,
  CheckCircle,
  Circle,
  Copy,
  Check,
  Tag as TagIcon,
  FileText,
  Sparkles,
  Clock,
  Layers,
  Share2,
  Trash2,
  Plus
} from 'lucide-react';
import { SavedPost, CategoryDef } from '../types';

interface ReaderModalProps {
  post: SavedPost | null;
  isOpen: boolean;
  categories: CategoryDef[];
  onClose: () => void;
  onUpdatePost: (id: string, updates: Partial<SavedPost>) => void;
  onDeletePost: (id: string) => void;
  onAddCategory?: (category: CategoryDef) => void;
}

export const ReaderModal: React.FC<ReaderModalProps> = ({
  post,
  isOpen,
  categories,
  onClose,
  onUpdatePost,
  onDeletePost,
  onAddCategory,
}) => {
  const [notes, setNotes] = useState('');
  const [newTagInput, setNewTagInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isCreatingNewCat, setIsCreatingNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  useEffect(() => {
    if (post) {
      setNotes(post.notes || '');
      setIsCreatingNewCat(false);
    }
  }, [post]);

  if (!isOpen || !post) return null;

  const currentCategory = categories.find(c => c.id === post.category);

  const handleNotesChange = (val: string) => {
    setNotes(val);
    setIsSavingNotes(true);
    onUpdatePost(post.id, { notes: val });
    setTimeout(() => setIsSavingNotes(false), 600);
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const tagClean = newTagInput.trim().toLowerCase().replace(/^#/, '');
    if (!tagClean) return;
    const existing = post.tags || [];
    if (!existing.includes(tagClean)) {
      onUpdatePost(post.id, { tags: [...existing, tagClean] });
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const existing = post.tags || [];
    onUpdatePost(post.id, { tags: existing.filter(t => t !== tagToRemove) });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(post.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCategoryChange = (catId: string) => {
    if (catId === '__new__') {
      setIsCreatingNewCat(true);
    } else {
      onUpdatePost(post.id, { category: catId });
    }
  };

  const handleSaveInlineCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCatName.trim();
    if (!name) return;

    const newCat: CategoryDef = {
      id: name,
      name,
      emoji: '📁',
      color: 'indigo',
      bgLight: 'bg-indigo-50',
      bgDark: 'dark:bg-indigo-950/40',
      textColor: 'text-indigo-700',
      borderColor: 'border-indigo-200',
      description: `${name} links`,
      isDefault: false,
    };

    if (onAddCategory) {
      onAddCategory(newCat);
    }
    onUpdatePost(post.id, { category: newCat.id });
    setIsCreatingNewCat(false);
    setNewCatName('');
  };

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(new Date(post.savedAt));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-3xl my-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Sticky Bar */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
              {post.platform}
            </span>

            {/* Category Selector */}
            {isCreatingNewCat ? (
              <form onSubmit={handleSaveInlineCategory} className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder="New category..."
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  autoFocus
                  className="px-2 py-0.5 text-xs rounded-lg border border-indigo-400 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none w-28"
                />
                <button
                  type="submit"
                  className="px-2 py-0.5 rounded-lg bg-indigo-600 text-white text-xs font-bold"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingNewCat(false)}
                  className="p-0.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <select
                value={post.category}
                onChange={e => handleCategoryChange(e.target.value)}
                className="py-1 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.emoji} {cat.name}
                  </option>
                ))}
                <option value="__new__">+ Create New Category...</option>
              </select>
            )}

            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Offline Ready
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Star button */}
            <button
              onClick={() => onUpdatePost(post.id, { isStarred: !post.isStarred })}
              className={`p-2 rounded-xl transition cursor-pointer ${
                post.isStarred
                  ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                  : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Toggle Favorite"
            >
              <Star className={`w-4 h-4 ${post.isStarred ? 'fill-current' : ''}`} />
            </button>

            {/* Read status toggle */}
            <button
              onClick={() => onUpdatePost(post.id, { isRead: !post.isRead })}
              className={`p-2 rounded-xl transition cursor-pointer ${
                post.isRead
                  ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                  : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={post.isRead ? 'Mark Unread' : 'Mark Read'}
            >
              <CheckCircle className={`w-4 h-4 ${post.isRead ? 'fill-current' : ''}`} />
            </button>

            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
              title="Copy URL"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>

            {/* Open External */}
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              title="Open source website"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Reader Content */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6 flex-1">
          {/* Post Header */}
          <div className="space-y-3">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 leading-snug">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1">
              {post.author && (
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {post.author}
                </span>
              )}
              <span>•</span>
              <span className="font-mono">{new URL(post.url).hostname}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Saved {formattedDate}
              </span>
            </div>
          </div>

          {/* Cover Image if available */}
          {post.image && (
            <div className="rounded-2xl overflow-hidden max-h-80 w-full bg-slate-100 dark:bg-slate-800 shadow-sm border border-slate-200/50 dark:border-slate-800/50">
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* AI or Smart Key Takeaways */}
          {post.takeaways && post.takeaways.length > 0 && (
            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span>Key Offline Takeaways</span>
              </div>
              <ul className="space-y-1.5 text-xs sm:text-sm text-indigo-950 dark:text-indigo-200">
                {post.takeaways.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-indigo-500 font-bold">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Main Reading Content Snapshot */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Offline Post Content
            </h3>
            <div className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line font-normal p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800/70">
              {post.contentSnapshot || post.description || 'No additional content provided.'}
            </div>
          </div>

          {/* User Added Personal Notes Section */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-500" />
                <span>Your Personal Notes & Action Items</span>
              </label>
              {isSavingNotes && (
                <span className="text-[11px] text-emerald-600 font-medium">Autosaved</span>
              )}
            </div>
            <textarea
              value={notes}
              onChange={e => handleNotesChange(e.target.value)}
              placeholder="Add your own thoughts, recipes, itinerary notes, key quotes or to-dos for this link..."
              rows={4}
              className="w-full p-3.5 text-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
            />
            <p className="text-[11px] text-slate-400">
              Notes are stored 100% offline in your browser's private vault and searchable anytime!
            </p>
          </div>

          {/* Tags Editor */}
          <div className="space-y-2.5 pt-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <TagIcon className="w-3.5 h-3.5 text-indigo-500" />
              <span>User Tags (Searchable)</span>
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {(post.tags || []).map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  #{tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-rose-500 transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              <form onSubmit={handleAddTag} className="inline-flex items-center gap-1">
                <input
                  type="text"
                  placeholder="Add tag..."
                  value={newTagInput}
                  onChange={e => setNewTagInput(e.target.value)}
                  className="py-1 px-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-24 sm:w-28"
                />
                <button
                  type="submit"
                  className="p-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                  title="Add tag"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <button
            onClick={() => {
              if (confirm('Delete this saved link from your offline vault?')) {
                onDeletePost(post.id);
                onClose();
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Post</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold transition shadow-sm"
          >
            Done Reading
          </button>
        </div>
      </div>
    </div>
  );
};
