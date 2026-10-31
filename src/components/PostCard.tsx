import React from 'react';
import {
  Star,
  ExternalLink,
  BookOpen,
  CheckCircle,
  Circle,
  FileText,
  Clock,
  MoreVertical,
  Trash2,
  Share2,
  Copy,
  Check,
  FolderSync
} from 'lucide-react';
import { SavedPost, CategoryDef } from '../types';

interface PostCardProps {
  post: SavedPost;
  categoryDef?: CategoryDef;
  searchQuery?: string;
  onOpenReader: (post: SavedPost) => void;
  onToggleStar: (id: string) => void;
  onToggleRead: (id: string) => void;
  onDelete: (id: string) => void;
  onSelectTag: (tag: string) => void;
  onSelectCategory: (category: string) => void;
}

// Highlight matching words from search query
function highlightMatches(text: string, query?: string) {
  if (!query || !query.trim() || !text) return text;
  const words = query.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return text;

  const escaped = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-yellow-200 dark:bg-yellow-900/60 text-slate-900 dark:text-yellow-100 rounded px-0.5 font-semibold">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  categoryDef,
  searchQuery,
  onOpenReader,
  onToggleStar,
  onToggleRead,
  onDelete,
  onSelectTag,
  onSelectCategory,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(post.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(post.savedAt));

  // Determine platform visual badge
  const getPlatformBadge = () => {
    switch (post.platform) {
      case 'Threads':
        return 'bg-black text-white';
      case 'Instagram':
        return 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white';
      case 'Facebook':
        return 'bg-blue-600 text-white';
      case 'X / Twitter':
        return 'bg-zinc-900 text-white';
      case 'YouTube':
        return 'bg-red-600 text-white';
      case 'TikTok':
        return 'bg-slate-900 text-white';
      case 'Reddit':
        return 'bg-orange-600 text-white';
      default:
        return 'bg-indigo-600 text-white';
    }
  };

  return (
    <div
      onClick={() => onOpenReader(post)}
      className="group relative flex flex-col rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-slate-900 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-200 cursor-pointer overflow-hidden"
    >
      {/* Top Media / Thumbnail Section */}
      {post.image ? (
        <div className="relative h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
          <img
            src={post.image}
            alt={post.title}
            loading="lazy"
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              // Hide image container on broken image
              (e.target as HTMLElement).parentElement?.classList.add('hidden');
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

          {/* Platform Tag Badge & Offline Pill */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm ${getPlatformBadge()}`}>
              {post.platform}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-600/90 text-white backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Offline
            </span>
          </div>

          {/* Star Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleStar(post.id);
            }}
            className={`absolute top-3 right-3 p-1.5 rounded-full backdrop-blur-md transition ${
              post.isStarred
                ? 'bg-amber-400 text-slate-900 shadow-md'
                : 'bg-black/40 text-white/80 hover:text-white hover:bg-black/60'
            }`}
            title={post.isStarred ? 'Remove from favorites' : 'Star favorite'}
          >
            <Star className={`w-4 h-4 ${post.isStarred ? 'fill-current' : ''}`} />
          </button>

          {/* Category Badge overlay on image */}
          <div className="absolute bottom-2.5 left-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectCategory(post.category);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs font-semibold backdrop-blur-md transition"
            >
              <span>{categoryDef?.emoji || '📁'}</span>
              <span>{post.category}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Non-image header */
        <div className="p-4 pb-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${getPlatformBadge()}`}>
              {post.platform}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectCategory(post.category);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
            >
              <span>{categoryDef?.emoji || '📁'}</span>
              <span>{post.category}</span>
            </button>
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Offline
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleStar(post.id);
            }}
            className={`p-1.5 rounded-full transition ${
              post.isStarred
                ? 'text-amber-500 hover:text-amber-600'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <Star className={`w-4 h-4 ${post.isStarred ? 'fill-current' : ''}`} />
          </button>
        </div>
      )}

      {/* Card Content Body */}
      <div className="p-4 flex flex-col flex-1">
        {/* Title */}
        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {highlightMatches(post.title, searchQuery)}
        </h3>

        {/* Author / Source */}
        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          {post.author && (
            <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
              {highlightMatches(post.author, searchQuery)}
            </span>
          )}
          <span>•</span>
          <span className="truncate">{highlightMatches(new URL(post.url).hostname.replace('www.', ''), searchQuery)}</span>
          <span>•</span>
          <span className="flex-shrink-0">{formattedDate}</span>
        </div>

        {/* Excerpt or Content snippet */}
        <p className="mt-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
          {highlightMatches(post.description || post.contentSnapshot || '', searchQuery)}
        </p>

        {/* User Added Notes indicator / preview */}
        {post.notes && post.notes.trim().length > 0 && (
          <div className="mt-2.5 p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-1.5">
            <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="line-clamp-1 italic font-medium">
              Note: {highlightMatches(post.notes, searchQuery)}
            </p>
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {post.tags.slice(0, 4).map(tag => (
              <button
                key={tag}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectTag(tag);
                }}
                className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-300 text-slate-600 dark:text-slate-400 transition"
              >
                #{highlightMatches(tag, searchQuery)}
              </button>
            ))}
            {post.tags.length > 4 && (
              <span className="text-[10px] text-slate-400 self-center">
                +{post.tags.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Card Footer Actions */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          {/* Read status toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleRead(post.id);
            }}
            className={`inline-flex items-center gap-1.5 font-medium transition cursor-pointer ${
              post.isRead
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'hover:text-slate-900 dark:hover:text-slate-100'
            }`}
            title={post.isRead ? 'Mark as unread' : 'Mark as read'}
          >
            {post.isRead ? (
              <>
                <CheckCircle className="w-4 h-4 fill-emerald-100 dark:fill-emerald-950" />
                <span>Read</span>
              </>
            ) : (
              <>
                <Circle className="w-4 h-4" />
                <span>Unread</span>
              </>
            )}
          </button>

          {/* Quick buttons: Copy URL, Open Reader, External Link */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleCopyLink}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
              title="Copy original link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              title="Open source website"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(post.id);
              }}
              className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition"
              title="Delete from vault"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
