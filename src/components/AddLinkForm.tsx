import React, { useRef, useState } from 'react';
import { CategoryDef, NewLinkDraft } from '../types';
import { domainOf } from '../services/defaultData';
import { analyzeCategoryForLink, CategorySuggestion } from '../services/categoryEngine';

interface AddLinkFormProps {
  categories: CategoryDef[];
  onSave: (draft: NewLinkDraft) => void;
  onCancel?: () => void;
}

export const AddLinkForm: React.FC<AddLinkFormProps> = ({ categories, onSave, onCancel }) => {
  const [addUrl, setAddUrl] = useState('');
  const [addStage, setAddStage] = useState<'idle' | 'fetching' | 'ready'>('idle');
  const [addTitle, setAddTitle] = useState('');
  const [addImage, setAddImage] = useState('');
  const [addCollection, setAddCollection] = useState(categories[0]?.name || 'Read later');
  const [addTags, setAddTags] = useState<string[]>(['reading']);
  const [addNote, setAddNote] = useState('');
  const [addSuggestion, setAddSuggestion] = useState<CategorySuggestion | null>(null);
  const [newTagInput, setNewTagInput] = useState('');
  const fetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleUrlChange = (val: string) => {
    setAddUrl(val);
    setAddImage('');
    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);

    const d = domainOf(val);
    if (!val.trim() || !d) {
      setAddStage('idle');
      setAddSuggestion(null);
      return;
    }

    const instantSuggestion = analyzeCategoryForLink({ url: val, title: addTitle, description: addNote });
    setAddSuggestion(instantSuggestion);
    if (instantSuggestion.isClearMatch && instantSuggestion.category) {
      setAddCollection(instantSuggestion.category);
    }

    setAddStage('fetching');

    fetchTimerRef.current = setTimeout(async () => {
      let fetchedTitle = `Page on ${d}`;
      try {
        const res = await (import.meta.env.VITE_API_BASE === undefined && import.meta.env.PROD
          ? Promise.reject(new Error('No metadata server on static hosting'))
          : fetch(`${import.meta.env.VITE_API_BASE ?? ''}/api/scrape-metadata`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: val }),
            }));
        if (res.ok) {
          const data = await res.json();
          if (data.title) fetchedTitle = data.title;
          if (data.image) setAddImage(data.image);
          if (data.category) setAddCollection(data.category);
          if (data.tags && data.tags.length > 0) setAddTags(data.tags);
        }
      } catch {
        // Offline / fallback to domain name
      }
      setAddTitle(fetchedTitle);
      setAddStage('ready');
    }, 700);
  };

  const handlePasteUrl = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) handleUrlChange(text);
    } catch {
      // Clipboard permission denied; user can paste manually
    }
  };

  const handleAddNewTag = () => {
    const clean = newTagInput.trim().toLowerCase().replace(/^#/, '').replace(/\s+/g, '-');
    if (!clean) return;
    if (!addTags.includes(clean)) setAddTags([...addTags, clean]);
    setNewTagInput('');
  };

  const canSave = addStage === 'ready' || !!addUrl.trim();

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      url: addUrl.trim(),
      title: addTitle,
      image: addImage,
      note: addNote,
      collection: addCollection,
      tags: addTags,
    });
  };

  return (
    <div className="p-5 flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] tracking-wider uppercase text-[var(--muted)] font-semibold">URL</span>
        <div className="flex gap-1.5">
          <input
            type="url"
            value={addUrl}
            onChange={e => handleUrlChange(e.target.value)}
            placeholder="https://"
            data-testid="add-url-input"
            className="flex-1 min-w-0 h-10 px-3 border border-[var(--line)] bg-[var(--surf)] text-[var(--text)] text-sm outline-none focus:border-[var(--p)]"
          />
          <button
            type="button"
            onClick={handlePasteUrl}
            className="flex-none h-10 px-3 border border-[var(--p)] bg-transparent text-[var(--p)] text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-[var(--ptint)]"
          >
            Paste
          </button>
        </div>
      </div>

      {addStage === 'idle' && (
        <div className="border border-dashed border-[var(--line)] p-5 text-center text-xs text-[var(--muted)]">
          Paste or type a URL. The title, preview, and category are suggested automatically.
        </div>
      )}

      {addStage === 'fetching' && (
        <div className="border border-[var(--line)] p-5 flex items-center justify-center gap-2.5 text-xs text-[var(--muted)]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--p)" strokeWidth="1.5" strokeLinecap="round" className="animate-spin-slow">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
          </svg>
          <span>Fetching preview from {domainOf(addUrl)}...</span>
        </div>
      )}

      {addStage === 'ready' && (
        <div className="blueprint grid grid-cols-[88px_1fr]">
          <i className="corner tl"></i>
          <i className="corner tr"></i>
          <i className="corner bl"></i>
          <i className="corner br"></i>
          <div
            className="border-r border-[var(--line)] overflow-hidden flex items-center justify-center text-2xl font-semibold min-h-[92px] relative bg-[var(--surf)]"
            style={{
              background: addImage
                ? undefined
                : `repeating-linear-gradient(135deg, var(--line) 0 1px, transparent 1px 7px), color-mix(in oklch, var(--hl) 22%, transparent)`,
            }}
          >
            {addImage ? (
              <img src={addImage} alt={addTitle} className="w-full h-full object-cover" />
            ) : (
              <span>{((domainOf(addUrl) || addTitle || 'Strand').replace(/^https?:\/\//i, '').replace(/^www\./i, '')[0] || 'S').toUpperCase()}</span>
            )}
          </div>
          <div className="p-2.5 flex flex-col gap-1 min-w-0">
            <span className="text-[10px] tracking-wider uppercase text-[var(--p)] font-semibold">Preview fetched</span>
            <input
              value={addTitle}
              onChange={e => setAddTitle(e.target.value)}
              className="border-0 border-b border-[var(--line)] bg-transparent text-[var(--text)] text-sm font-semibold py-0.5 outline-none focus:border-[var(--p)]"
            />
            <span className="text-xs text-[var(--muted)]">{domainOf(addUrl)}</span>
          </div>
        </div>
      )}

      {addSuggestion && (
        <div
          className={`p-2.5 text-xs border ${
            addSuggestion.isClearMatch
              ? 'bg-[var(--surf)] border-[var(--p)] text-[var(--text)]'
              : 'bg-amber-500/10 border-amber-500/30 text-[var(--text)]'
          }`}
        >
          <div className="font-semibold mb-0.5">
            {addSuggestion.isClearMatch ? `Auto-Assigned: ${addSuggestion.category}` : 'No Clear Category Determined'}
          </div>
          <div className="text-[11px] opacity-80">{addSuggestion.reason}</div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-[11px] tracking-wider uppercase text-[var(--muted)] font-semibold">Collection</span>
        <div className="flex gap-1.5 flex-wrap">
          {categories.map(c => {
            const isSel = addCollection === c.name;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setAddCollection(c.name)}
                className={`h-[30px] px-3 border text-xs font-medium cursor-pointer transition ${
                  isSel
                    ? 'bg-[var(--p)] text-[var(--on-p)] border-[var(--p)]'
                    : 'bg-transparent text-[var(--text)] border-[var(--line)] hover:bg-[var(--ptint)]'
                }`}
              >
                {c.emoji} {c.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[11px] tracking-wider uppercase text-[var(--muted)] font-semibold">Tags</span>
        <div className="flex gap-1.5 flex-wrap">
          {addTags.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setAddTags(addTags.filter(x => x !== t))}
              className="h-[30px] px-2.5 border border-[var(--p)] bg-[var(--p)] text-[var(--on-p)] text-xs font-medium cursor-pointer"
            >
              #{t} ×
            </button>
          ))}
          <div className="flex h-[30px] border border-dashed border-[var(--line)]">
            <input
              type="text"
              value={newTagInput}
              onChange={e => setNewTagInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddNewTag();
                }
              }}
              placeholder="New tag"
              className="w-20 border-0 bg-transparent text-[var(--text)] text-xs px-2 outline-none"
            />
            <button
              type="button"
              onClick={handleAddNewTag}
              className="w-7 border-0 border-l border-dashed border-[var(--line)] bg-transparent text-[var(--p)] flex items-center justify-center cursor-pointer"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] tracking-wider uppercase text-[var(--muted)] font-semibold">Note</span>
        <textarea
          value={addNote}
          onChange={e => setAddNote(e.target.value)}
          placeholder="Why you saved it (optional)"
          rows={3}
          className="border border-[var(--line)] bg-[var(--surf)] text-[var(--text)] text-sm p-2.5 resize-none outline-none focus:border-[var(--p)]"
        ></textarea>
      </div>

      <div className="flex gap-2 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="h-11 px-4 border border-[var(--line)] bg-transparent text-[var(--text)] text-sm font-medium cursor-pointer hover:bg-[var(--ptint)]"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          data-testid="add-save"
          className="blueprint flex-1 h-11 bg-[var(--btn)] text-white border-0 text-base font-semibold cursor-pointer hover:brightness-105 active:scale-95 disabled:opacity-50"
        >
          <i className="corner tl"></i>
          <i className="corner tr"></i>
          <i className="corner bl"></i>
          <i className="corner br"></i>
          Save link
        </button>
      </div>
    </div>
  );
};
