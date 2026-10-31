import React from 'react';
import { SavedPost } from '../types';
import { favFg } from '../services/defaultData';

interface LinkGridCardProps {
  post: SavedPost;
  onSelect: (id: string) => void;
  onToggleStar: (id: string) => void;
}

export const LinkGridCard: React.FC<LinkGridCardProps> = ({ post: r, onSelect, onToggleStar }) => {
  const cleanHost = (r.domain || r.title || 'Strand')
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .trim();
  const domainInitial = (cleanHost[0] || 'S').toUpperCase();
  const fgColor = favFg(r.tint || '#1F6B4F');

  return (
    <div
      onClick={() => onSelect(r.id)}
      data-testid="link-card"
      className="blueprint group flex flex-col bg-[var(--bg)] text-left cursor-pointer transition hover:border-[var(--p)] overflow-hidden"
    >
      <i className="corner tl"></i>
      <i className="corner tr"></i>
      <i className="corner bl"></i>
      <i className="corner br"></i>

      <div
        className="h-36 w-full overflow-hidden flex-none relative flex items-center justify-center text-3xl font-semibold border-b border-[var(--line)]"
        style={{
          background: r.image
            ? undefined
            : `repeating-linear-gradient(135deg, var(--line) 0 1px, transparent 1px 7px), color-mix(in oklch, ${r.tint || '#1F6B4F'} 22%, transparent)`,
        }}
      >
        {r.image ? (
          <img src={r.image} alt={r.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <span>{domainInitial}</span>
        )}

        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onToggleStar(r.id);
          }}
          className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-[var(--bg)]/85 border border-[var(--line)] text-sm cursor-pointer hover:bg-[var(--bg)]"
          title={r.isStarred ? 'Remove from starred' : 'Star'}
        >
          {r.isStarred ? '⭐' : '☆'}
        </button>

        {r.unread && (
          <span className="absolute top-2 left-2 w-2 h-2 bg-[var(--hl)]"></span>
        )}
      </div>

      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <h3 className="text-sm font-semibold leading-snug line-clamp-2">{r.title}</h3>

        <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
          <span
            className="w-3.5 h-3.5 flex-none font-bold text-[9px] flex items-center justify-center"
            style={{ backgroundColor: r.tint || '#1F6B4F', color: fgColor }}
          >
            {domainInitial}
          </span>
          <span className="truncate">{r.domain}</span>
        </div>

        <p className="text-xs text-[var(--muted)] line-clamp-2 leading-relaxed">
          {r.description || r.contentSnapshot}
        </p>

        {(r.tags || []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {(r.tags || []).slice(0, 3).map(t => (
              <span key={t} className="text-[11px] text-[var(--p)] font-medium">
                #{t.replace(/^#/, '')}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-2 flex items-center justify-between text-[11px] text-[var(--muted)]">
          <span className="px-1.5 py-0.5 border border-[var(--line)]">{r.collection || r.category}</span>
          <span>{r.date}</span>
        </div>
      </div>
    </div>
  );
};
