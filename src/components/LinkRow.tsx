import React from 'react';
import { SavedPost, StrandPrefs } from '../types';
import { favFg } from '../services/defaultData';

interface LinkRowProps {
  post: SavedPost;
  prefs: StrandPrefs;
  onSelect: (id: string) => void;
}

export const LinkRow: React.FC<LinkRowProps> = ({ post: r, prefs, onSelect }) => {
  const cleanHost = (r.domain || r.title || 'Strand')
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .trim();
  const domainInitial = (cleanHost[0] || 'S').toUpperCase();
  const fgColor = favFg(r.tint || '#1F6B4F');
  const hasUnread = prefs.unread && r.unread;

  return (
    <button
      onClick={() => onSelect(r.id)}
      data-testid="link-card"
      className={`grid gap-3 px-5 py-3 border-b border-[var(--line)] bg-transparent text-left cursor-pointer transition hover:bg-[var(--ptint)] ${
        prefs.thumbs ? 'grid-cols-[64px_1fr]' : 'grid-cols-1'
      }`}
    >
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
          {hasUnread && <span className="flex-none w-1.5 h-1.5 bg-[var(--hl)]"></span>}
          <span className="text-[15px] font-semibold leading-tight line-clamp-2">{r.title}</span>
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
          {r.isStarred && <span className="flex-none">· ⭐</span>}
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs pt-0.5">
          {(r.tags || []).slice(0, 3).map(t => (
            <span key={t} className="text-[var(--p)] font-medium">
              #{t.replace(/^#/, '')}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
};
