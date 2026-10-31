import React, { useState } from 'react';
import { StrandAppearance, StrandOpenIn, StrandPrefs } from '../types';
import { ConfirmDialog } from './ConfirmDialog';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsContentProps {
  email: string | null;
  appearance: StrandAppearance;
  setAppearance: (a: StrandAppearance) => void;
  openIn: StrandOpenIn;
  setOpenIn: (o: StrandOpenIn) => void;
  prefs: StrandPrefs;
  updatePrefs: (p: StrandPrefs) => void;
  linkCount: number;
  onExportCSV: () => void;
  onExportJSON: () => void;
  onImportJSON: (json: string) => void;
  onDeleteAll: () => void;
  onSignOut: () => void;
}

export const SettingsContent: React.FC<SettingsContentProps> = ({
  email,
  appearance,
  setAppearance,
  openIn,
  setOpenIn,
  prefs,
  updatePrefs,
  linkCount,
  onExportCSV,
  onExportJSON,
  onImportJSON,
  onDeleteAll,
  onSignOut,
}) => {
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <div className="p-5 flex flex-col gap-4">
      <h1 className="text-3xl font-semibold">Settings</h1>

      <div className="flex items-center justify-between border border-[var(--line)] p-3">
        <div className="flex flex-col">
          <span className="text-[10.5px] tracking-wider uppercase text-[var(--muted)] font-semibold">
            Signed in as
          </span>
          <span className="text-sm font-medium">{email}</span>
        </div>
        <button
          onClick={onSignOut}
          data-testid="sign-out"
          className="h-9 px-3 border border-[var(--line)] bg-transparent text-[var(--acc)] text-xs font-semibold cursor-pointer hover:bg-rose-500/10"
        >
          Sign out
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[11px] tracking-wider uppercase text-[var(--muted)] font-semibold">Appearance</span>
        <div className="grid grid-cols-3 border border-[var(--line)] h-9">
          {(['Light', 'Dark', 'System'] as StrandAppearance[]).map(opt => (
            <button
              key={opt}
              onClick={() => setAppearance(opt)}
              className={`border-0 text-xs font-semibold cursor-pointer transition ${
                appearance === opt ? 'bg-[var(--p)] text-[var(--on-p)]' : 'bg-transparent text-[var(--text)]'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[11px] tracking-wider uppercase text-[var(--muted)] font-semibold">Open links in</span>
        <div className="grid grid-cols-2 border border-[var(--line)] h-9">
          {(['In app', 'Browser'] as StrandOpenIn[]).map(opt => (
            <button
              key={opt}
              onClick={() => setOpenIn(opt)}
              className={`border-0 text-xs font-semibold cursor-pointer transition ${
                openIn === opt ? 'bg-[var(--p)] text-[var(--on-p)]' : 'bg-transparent text-[var(--text)]'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col border-t border-[var(--line)]">
        {[
          { key: 'fetch' as const, label: 'Fetch previews', sub: 'Title, metadata and images when you save a URL' },
          { key: 'thumbs' as const, label: 'Show thumbnails', sub: 'Turn off for a denser text list' },
          { key: 'unread' as const, label: 'Mark unread', sub: 'Highlight links you haven’t opened yet' },
        ].map(t => {
          const on = prefs[t.key];
          return (
            <button
              key={t.key}
              onClick={() => updatePrefs({ ...prefs, [t.key]: !on })}
              className="flex items-center justify-between py-3 border-b border-[var(--line)] bg-transparent text-left cursor-pointer"
            >
              <div className="flex-1 pr-3">
                <div className="text-sm font-medium">{t.label}</div>
                <div className="text-xs text-[var(--muted)]">{t.sub}</div>
              </div>
              <span
                className={`w-11 h-6 flex items-center p-0.5 border transition ${
                  on ? 'bg-[var(--p)] border-[var(--p)] justify-end' : 'bg-transparent border-[var(--line)] justify-start'
                }`}
              >
                <span className={`w-4 h-4 transition ${on ? 'bg-[var(--on-p)]' : 'bg-[var(--muted)]'}`}></span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[11px] tracking-wider uppercase text-[var(--muted)] font-semibold">Install app</span>
        <PWAInstallButton />
      </div>

      <div className="flex flex-col border-t border-[var(--line)]">
        <button
          onClick={onExportCSV}
          className="flex items-center justify-between h-12 border-b border-[var(--line)] bg-transparent text-sm font-medium cursor-pointer"
        >
          <span>Export links (.csv)</span>
          <span className="text-[var(--muted)]">→</span>
        </button>

        <button
          onClick={onExportJSON}
          className="flex items-center justify-between h-12 border-b border-[var(--line)] bg-transparent text-sm font-medium cursor-pointer"
        >
          <span>Backup vault (.json)</span>
          <span className="text-[var(--muted)]">→</span>
        </button>

        <label className="flex items-center justify-between h-12 border-b border-[var(--line)] bg-transparent text-sm font-medium cursor-pointer">
          <span>Restore vault backup (.json)</span>
          <input
            type="file"
            accept=".json"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = ev => {
                const content = ev.target?.result as string;
                if (content) onImportJSON(content);
              };
              reader.readAsText(file);
              e.target.value = '';
            }}
          />
          <span className="text-[var(--muted)]">→</span>
        </label>

        <button
          onClick={() => setConfirmClear(true)}
          className="flex items-center h-12 border-b border-[var(--line)] bg-transparent text-sm font-medium text-[var(--acc)] cursor-pointer"
        >
          Delete all links
        </button>
      </div>

      <span className="text-xs text-[var(--muted)] text-center pt-2">Strand 1.0 · Three Strand Labs</span>

      {confirmClear && (
        <ConfirmDialog
          title="Delete all links?"
          message={`All ${linkCount} saved links, collections, and notes will be permanently removed.`}
          confirmLabel="Delete all"
          onCancel={() => setConfirmClear(false)}
          onConfirm={() => {
            setConfirmClear(false);
            onDeleteAll();
          }}
        />
      )}
    </div>
  );
};
