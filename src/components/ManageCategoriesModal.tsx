import React, { useState } from 'react';
import { X, Plus, Trash2, FolderPlus, Check } from 'lucide-react';
import { CategoryDef } from '../types';

interface ManageCategoriesModalProps {
  isOpen: boolean;
  categories: CategoryDef[];
  onClose: () => void;
  onAddCategory: (category: CategoryDef) => void;
  onDeleteCategory: (catId: string) => void;
}

const EMOJI_OPTIONS = ['🍔', '✈️', '💻', '👗', '🏋️', '🎬', '💡', '📚', '☕', '🎵', '🎨', '💼', '🏡', '🎮', '🚗', '🌿'];
const COLOR_OPTIONS = [
  { name: 'Indigo', color: 'indigo', bgLight: 'bg-indigo-50', bgDark: 'dark:bg-indigo-950/40', text: 'text-indigo-700', border: 'border-indigo-200' },
  { name: 'Emerald', color: 'emerald', bgLight: 'bg-emerald-50', bgDark: 'dark:bg-emerald-950/40', text: 'text-emerald-700', border: 'border-emerald-200' },
  { name: 'Amber', color: 'amber', bgLight: 'bg-amber-50', bgDark: 'dark:bg-amber-950/40', text: 'text-amber-700', border: 'border-amber-200' },
  { name: 'Rose', color: 'rose', bgLight: 'bg-rose-50', bgDark: 'dark:bg-rose-950/40', text: 'text-rose-700', border: 'border-rose-200' },
  { name: 'Purple', color: 'purple', bgLight: 'bg-purple-50', bgDark: 'dark:bg-purple-950/40', text: 'text-purple-700', border: 'border-purple-200' },
  { name: 'Cyan', color: 'cyan', bgLight: 'bg-cyan-50', bgDark: 'dark:bg-cyan-950/40', text: 'text-cyan-700', border: 'border-cyan-200' },
];

export const ManageCategoriesModal: React.FC<ManageCategoriesModalProps> = ({
  isOpen,
  categories,
  onClose,
  onAddCategory,
  onDeleteCategory,
}) => {
  const [name, setName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('📚');
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError('Category name cannot be empty');
      return;
    }
    if (categories.some(c => c.name.toLowerCase() === cleanName.toLowerCase())) {
      setError('A category with this name already exists');
      return;
    }

    const colorConfig = COLOR_OPTIONS[selectedColorIdx];
    const newCategory: CategoryDef = {
      id: cleanName,
      name: cleanName,
      emoji: selectedEmoji,
      color: colorConfig.color,
      bgLight: colorConfig.bgLight,
      bgDark: colorConfig.bgDark,
      textColor: colorConfig.text,
      borderColor: colorConfig.border,
      description: description.trim() || `${cleanName} links`,
      isDefault: false,
    };

    onAddCategory(newCategory);
    setName('');
    setDescription('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-lg my-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl relative text-slate-900 dark:text-slate-100 max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
            <FolderPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Manage Categories</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Organize your links neatly (Food, Travel, Tech, Custom collections)
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleAdd} className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Category Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Coffee Shops, Books, Gaming, Fitness"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Emoji Icon
            </label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map(em => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setSelectedEmoji(em)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition ${
                    selectedEmoji === em
                      ? 'bg-indigo-600 text-white ring-2 ring-indigo-500/30'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Theme Color
            </label>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((c, i) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setSelectedColorIdx(i)}
                  className={`w-8 h-8 rounded-full border-2 transition flex items-center justify-center ${
                    selectedColorIdx === i ? 'ring-2 ring-indigo-500 scale-110' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor:
                      c.color === 'indigo'
                        ? '#4f46e5'
                        : c.color === 'emerald'
                        ? '#10b981'
                        : c.color === 'amber'
                        ? '#f59e0b'
                        : c.color === 'rose'
                        ? '#f43f5e'
                        : c.color === 'purple'
                        ? '#a855f7'
                        : '#06b6d4',
                  }}
                >
                  {selectedColorIdx === i && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Short Description
            </label>
            <input
              type="text"
              placeholder="e.g. My favorite espresso recipes and roasteries"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Category</span>
          </button>
        </form>

        {/* Existing Categories list */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Current Categories
          </h3>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {categories.map(cat => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{cat.emoji}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{cat.name}</span>
                  {cat.isDefault && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-500">
                      Default
                    </span>
                  )}
                </div>

                {!cat.isDefault && (
                  <button
                    onClick={() => onDeleteCategory(cat.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 transition"
                    title="Delete category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
