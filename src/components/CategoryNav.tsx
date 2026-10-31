import React from 'react';
import { Plus, Folder } from 'lucide-react';
import { CategoryDef, SavedPost } from '../types';

interface CategoryNavProps {
  categories: CategoryDef[];
  selectedCategory: string;
  onSelectCategory: (catId: string) => void;
  posts: SavedPost[];
  onOpenAddCategory: () => void;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  posts,
  onOpenAddCategory,
}) => {
  // Compute counts per category
  const counts: Record<string, number> = {};
  for (const post of posts) {
    counts[post.category] = (counts[post.category] || 0) + 1;
  }

  return (
    <div className="w-full flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none no-scrollbar">
      {/* "All" Button */}
      <button
        onClick={() => onSelectCategory('all')}
        className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
          selectedCategory === 'all'
            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md'
            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
        }`}
      >
        <Folder className="w-4 h-4" />
        <span>All Posts</span>
        <span
          className={`text-[11px] px-1.5 py-0.2 rounded-full font-semibold ${
            selectedCategory === 'all'
              ? 'bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
          }`}
        >
          {posts.length}
        </span>
      </button>

      {/* Category Pills */}
      {categories.map(cat => {
        const isSelected = selectedCategory === cat.id;
        const count = counts[cat.id] || 0;

        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer border ${
              isSelected
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 border-slate-200 dark:border-slate-800'
            }`}
          >
            <span>{cat.emoji}</span>
            <span>{cat.name}</span>
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded-full font-semibold ${
                isSelected
                  ? 'bg-indigo-800 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}

      {/* Add Custom Category button */}
      <button
        onClick={onOpenAddCategory}
        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs sm:text-sm font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer border border-dashed border-slate-300 dark:border-slate-700"
        title="Add custom category"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>New Category</span>
      </button>
    </div>
  );
};
