import React, { useState } from 'react';
import { SavedPost } from '../types';
import { favFg } from '../services/defaultData';
import { ConfirmDialog } from './ConfirmDialog';

interface LinkDetailContentProps {
  post: SavedPost;
  onToggleStar: (id: string) => void;
  onDelete: (id: string) => void;
  onClose?: () => void;
}

export const LinkDetailContent: React.FC<LinkDetailContentProps> = ({ post, onToggleStar, onDelete, onClose }) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const initial = ((post.domain || post.title || 'Strand')
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')[0] || 'S'
  ).toUpperCase();

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center justify-between px-2 pt-1 pb-1.5">
        {onClose ? (
          <button
            onClick={onClose}
            className="h-9 px-1 text-[var(--p)] text-sm font-medium bg-transparent border-0 flex items-center gap-0.5 cursor-pointer"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"></path>
            </svg>
            Links
          </button>
        ) : (
          <span />
        )}

        <button
          onClick={() => onToggleStar(post.id)}
          className="p-1 text-[var(--muted)] hover:text-amber-500 cursor-pointer mr-3"
        >
          <span className="text-base">{post.isStarred ? '⭐' : '☆'}</span>
        </button>
      </div>

      <div className="px-5 pb-6 flex flex-col gap-4">
        <div
          className="blueprint h-44 flex items-center justify-center overflow-hidden"
          style={{
            background: post.image
              ? `url(${post.image}) center/cover no-repeat`
              : `repeating-linear-gradient(135deg, var(--line) 0 1px, transparent 1px 8px), color-mix(in oklch, ${post.tint || '#1F6B4F'} 22%, transparent)`,
          }}
        >
          <i className="corner tl"></i>
          <i className="corner tr"></i>
          <i className="corner bl"></i>
          <i className="corner br"></i>
          {!post.image && <span className="font-semibold text-6xl opacity-85">{initial}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold leading-snug">{post.title}</h1>
          <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
            <span
              className="w-4 h-4 flex-none font-bold text-[10px] flex items-center justify-center"
              style={{ backgroundColor: post.tint || '#1F6B4F', color: favFg(post.tint || '#1F6B4F') }}
            >
              {initial}
            </span>
            <span>{post.domain}</span>
            <span>·</span>
            <span>Saved {post.date}</span>
            <span>·</span>
            <span className="font-medium text-[var(--text)]">{post.platform}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 border border-[var(--line)]">
          <div className="p-2.5 border-r border-[var(--line)] flex flex-col gap-1">
            <span className="text-[10.5px] tracking-wider uppercase text-[var(--muted)] font-semibold">Collection</span>
            <span className="text-sm font-medium">{post.collection || post.category}</span>
          </div>
          <div className="p-2.5 flex flex-col gap-1">
            <span className="text-[10.5px] tracking-wider uppercase text-[var(--muted)] font-semibold">Tags</span>
            <div className="flex gap-1.5 flex-wrap text-sm">
              {(post.tags || []).map(t => (
                <span key={t} className="text-[var(--p)] font-medium">
                  #{t.replace(/^#/, '')}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[var(--surf)] border border-[var(--line)] p-3 flex flex-col gap-1">
          <span className="text-[10.5px] tracking-wider uppercase text-[var(--muted)] font-semibold">Note</span>
          <span className="text-sm leading-relaxed">{post.notes || 'No note yet.'}</span>
        </div>

        <div className="bg-[var(--surf)] border border-[var(--line)] p-3 flex flex-col gap-1.5 text-xs leading-relaxed whitespace-pre-line">
          <span className="text-[10.5px] tracking-wider uppercase text-[var(--muted)] font-semibold">Offline Snapshot</span>
          <div>{post.contentSnapshot || post.description}</div>
        </div>

        <div className="grid grid-cols-[1fr_46px_46px] gap-2 pt-1">
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="blueprint h-11 bg-[var(--btn)] text-white border-0 text-sm font-semibold flex items-center justify-center gap-2 no-underline hover:brightness-105 active:scale-95"
          >
            <i className="corner tl"></i>
            <i className="corner tr"></i>
            <i className="corner bl"></i>
            <i className="corner br"></i>
            Open link
          </a>

          <button
            onClick={() => {
              navigator.clipboard.writeText(post.url);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="h-11 border border-[var(--line)] bg-transparent text-[var(--text)] flex items-center justify-center cursor-pointer hover:bg-[var(--ptint)]"
            title="Copy link"
          >
            {copied ? '✓' : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                <path d="m16 6-4-4-4 4"></path>
                <path d="M12 2v13"></path>
              </svg>
            )}
          </button>

          <button
            onClick={() => setConfirmOpen(true)}
            data-testid="link-delete"
            className="h-11 border border-[var(--line)] bg-transparent text-[var(--acc)] flex items-center justify-center cursor-pointer hover:bg-rose-500/10"
            title="Delete link"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"></path>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>

      {confirmOpen && (
        <ConfirmDialog
          title="Delete this link?"
          message={`"${post.title}" will be removed from your vault.`}
          confirmLabel="Delete"
          confirmTestId="link-delete-confirm"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => {
            setConfirmOpen(false);
            onDelete(post.id);
          }}
        />
      )}
    </div>
  );
};
