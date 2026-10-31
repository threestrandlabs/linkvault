import React, { useRef, useEffect, useState } from 'react';
import {
  Search,
  X,
  SlidersHorizontal,
  Calendar,
  Layers,
  Sparkles,
  Tag as TagIcon,
  RotateCcw,
  ArrowUpDown,
  BookOpen,
  Star,
  FileText,
  Check
} from 'lucide-react';
import { SearchFilterState, DateRangeFilter, StatusFilter, SortOption } from '../services/searchFilter';
import { CategoryDef } from '../types';

interface SearchBarProps {
  filters: SearchFilterState;
  onChangeFilters: (filters: SearchFilterState) => void;
  categories: CategoryDef[];
  availableTags: { tag: string; count: number }[];
  totalPostsCount: number;
  filteredCount: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  filters,
  onChangeFilters,
  categories,
  availableTags,
  totalPostsCount,
  filteredCount,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut '/' or 'Cmd+K' to focus search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) && document.activeElement !== inputRef.current) {
        if (!['INPUT', 'TEXTAREA'].includes((document.activeElement as HTMLElement)?.tagName)) {
          e.preventDefault();
          inputRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleQueryChange = (val: string) => {
    onChangeFilters({ ...filters, query: val });
  };

  const handleClearQuery = () => {
    onChangeFilters({ ...filters, query: '' });
    inputRef.current?.focus();
  };

  const handleResetFilters = () => {
    onChangeFilters({
      query: '',
      category: 'all',
      platform: 'all',
      dateRange: 'all',
      status: 'all',
      sortBy: 'newest',
      selectedTag: null,
    });
  };

  // Count active non-default filters
  const activeFiltersCount =
    (filters.category !== 'all' ? 1 : 0) +
    (filters.platform !== 'all' ? 1 : 0) +
    (filters.dateRange !== 'all' ? 1 : 0) +
    (filters.status !== 'all' ? 1 : 0) +
    (filters.selectedTag ? 1 : 0) +
    (filters.sortBy !== 'newest' ? 1 : 0);

  const platforms = ['all', 'Threads', 'Instagram', 'Facebook', 'X / Twitter', 'YouTube', 'TikTok', 'Reddit', 'Web Link'];

  return (
    <div className="w-full space-y-3">
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500">
          <Search className="w-4 h-4" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={filters.query}
          onChange={e => handleQueryChange(e.target.value)}
          placeholder="Search keywords in title, website URL, tags, notes... (Press /)"
          className="w-full pl-10 pr-28 py-2.5 sm:py-3 text-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all"
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {filters.query && (
            <button
              onClick={handleClearQuery}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              showAdvanced || activeFiltersCount > 0
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title="Toggle advanced search filters"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filters</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-white text-indigo-700 text-[10px] font-bold flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Active Filter Chips / Status summary */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 px-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span>
            Showing <strong className="text-slate-900 dark:text-slate-100 font-semibold">{filteredCount}</strong> of {totalPostsCount} links
          </span>

          {filters.selectedTag && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 font-medium">
              <TagIcon className="w-3 h-3" />
              #{filters.selectedTag}
              <button
                onClick={() => onChangeFilters({ ...filters, selectedTag: null })}
                className="hover:text-indigo-900 ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.category !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 font-medium">
              📁 {filters.category}
              <button
                onClick={() => onChangeFilters({ ...filters, category: 'all' })}
                className="hover:text-amber-900 ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.platform !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 font-medium">
              🌐 {filters.platform}
              <button
                onClick={() => onChangeFilters({ ...filters, platform: 'all' })}
                className="hover:text-purple-900 ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.dateRange !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-medium">
              <Calendar className="w-3 h-3" />
              {filters.dateRange === 'today' && 'Saved Today'}
              {filters.dateRange === 'week' && 'Saved This Week'}
              {filters.dateRange === 'month' && 'Saved This Month'}
              {filters.dateRange === 'year' && 'Saved This Year'}
              <button
                onClick={() => onChangeFilters({ ...filters, dateRange: 'all' })}
                className="hover:text-emerald-900 ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.status !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 font-medium">
              {filters.status === 'starred' && '⭐ Starred'}
              {filters.status === 'unread' && '📖 Unread'}
              {filters.status === 'read' && '✓ Read'}
              {filters.status === 'has-notes' && '📝 Has Notes'}
              {filters.status === 'archived' && '📦 Archived'}
              <button
                onClick={() => onChangeFilters({ ...filters, status: 'all' })}
                className="hover:text-blue-900 ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {(activeFiltersCount > 0 || filters.query) && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 hover:underline font-semibold ml-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset all
            </button>
          )}
        </div>

        {/* Quick sort dropdown */}
        <div className="flex items-center gap-1.5 ml-auto">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400 hidden sm:inline">Sort:</span>
          <select
            value={filters.sortBy}
            onChange={e => onChangeFilters({ ...filters, sortBy: e.target.value as SortOption })}
            className="bg-transparent font-medium text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer text-xs"
          >
            <option value="newest" className="dark:bg-slate-900">Newest Saved</option>
            <option value="oldest" className="dark:bg-slate-900">Oldest Saved</option>
            <option value="alphabetical" className="dark:bg-slate-900">Title (A-Z)</option>
            <option value="platform" className="dark:bg-slate-900">Platform</option>
          </select>
        </div>
      </div>

      {/* Advanced Filters Drawer */}
      {showAdvanced && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg space-y-4 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
              <span>Advanced Search Filters</span>
            </div>
            {activeFiltersCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-slate-400 hover:text-rose-500 font-semibold flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Clear Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Filter 1: Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-500" />
                Category
              </label>
              <select
                value={filters.category}
                onChange={e => onChangeFilters({ ...filters, category: e.target.value })}
                className="w-full py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.emoji} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter 2: Date Saved */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                Date Saved
              </label>
              <select
                value={filters.dateRange}
                onChange={e => onChangeFilters({ ...filters, dateRange: e.target.value as DateRangeFilter })}
                className="w-full py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Time</option>
                <option value="today">Saved Today (24 hrs)</option>
                <option value="week">Saved This Week (7 days)</option>
                <option value="month">Saved This Month (30 days)</option>
                <option value="year">Saved This Year</option>
              </select>
            </div>

            {/* Filter 3: Platform */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                Social Media Platform
              </label>
              <select
                value={filters.platform}
                onChange={e => onChangeFilters({ ...filters, platform: e.target.value })}
                className="w-full py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Platforms</option>
                {platforms.filter(p => p !== 'all').map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Filter 4: Status & Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                Reading & Vault Status
              </label>
              <select
                value={filters.status}
                onChange={e => onChangeFilters({ ...filters, status: e.target.value as StatusFilter })}
                className="w-full py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Statuses</option>
                <option value="starred">⭐ Starred Favorites</option>
                <option value="unread">📖 Unread Only</option>
                <option value="read">✓ Read Already</option>
                <option value="has-notes">📝 Has Personal Notes</option>
                <option value="archived">📦 Archived</option>
              </select>
            </div>
          </div>

          {/* Popular Tag Cloud Filter */}
          {availableTags.length > 0 && (
            <div className="pt-2">
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <TagIcon className="w-3 h-3 text-indigo-500" />
                Filter by User Tags
              </label>
              <div className="flex flex-wrap gap-1.5">
                {availableTags.slice(0, 15).map(({ tag, count }) => {
                  const isSelected = filters.selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() =>
                        onChangeFilters({
                          ...filters,
                          selectedTag: isSelected ? null : tag,
                        })
                      }
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>#{tag}</span>
                      <span className={`text-[10px] px-1 rounded-full ${isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
