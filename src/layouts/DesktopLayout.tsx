import React, { useState } from 'react';
import type { User } from 'firebase/auth';
import { VaultApi } from '../hooks/useVault';
import { LinkGridCard } from '../components/LinkGridCard';
import { LinkRow } from '../components/LinkRow';
import { AddLinkForm } from '../components/AddLinkForm';
import { LinkDetailContent } from '../components/LinkDetailContent';
import { SettingsContent } from '../components/SettingsContent';
import { Toast } from '../components/Toast';
import { IncomingShareToast } from '../components/IncomingShareToast';
import { OfflineIndicator } from '../components/OfflineIndicator';

interface DesktopLayoutProps {
  vault: VaultApi;
  user: User;
  onSignOut: () => void;
}

export const DesktopLayout: React.FC<DesktopLayoutProps> = ({ vault, user, onSignOut }) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const {
    links,
    categories,
    prefs,
    appearance,
    setAppearance,
    openIn,
    setOpenIn,
    updatePrefs,
    query,
    setQuery,
    filter,
    setFilter,
    selectLink,
    setSelectedId,
    currentDetail,
    filteredLinks,
    tagMap,
    toast,
    incomingShare,
    setIncomingShare,
    saveIncomingShare,
    createLinkFromDraft,
    toggleStar,
    deleteLinkById,
    deleteAllLinks,
    addCategoryByName,
    exportCSV,
    exportJSON,
    importJSON,
  } = vault;

  const navItems: { id: string; label: string; onClick: () => void }[] = [
    { id: 'all', label: 'All links', onClick: () => setFilter('all') },
    { id: 'unread', label: 'Unread', onClick: () => setFilter('unread') },
    { id: 'starred', label: 'Starred', onClick: () => setFilter('starred') },
    { id: 'archived', label: 'Archive', onClick: () => setFilter('archived') },
  ];

  return (
    <div data-testid="layout-desktop" className="h-[100dvh] w-full flex bg-[var(--bg)] text-[var(--text)]">
      {/* Sidebar */}
      <aside className="w-64 flex-none border-r border-[var(--line)] flex flex-col h-full">
        <div className="px-5 pt-6 pb-4 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--p)]"></span>
          <span className="font-semibold text-lg tracking-tight">Strand</span>
        </div>

        <div className="px-4 pb-3">
          <button
            onClick={() => setIsAddOpen(true)}
            data-testid="add-link-button"
            className="blueprint w-full h-10 bg-[var(--btn)] text-white border-0 text-sm font-semibold cursor-pointer hover:brightness-105 active:scale-95 flex items-center justify-center gap-2"
          >
            <i className="corner tl"></i>
            <i className="corner tr"></i>
            <i className="corner bl"></i>
            <i className="corner br"></i>
            + Add link
          </button>
        </div>

        <nav className="flex flex-col px-2 gap-0.5">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={item.onClick}
              className={`h-9 px-3 text-left text-sm font-medium cursor-pointer transition ${
                filter === item.id ? 'bg-[var(--ptint)] text-[var(--p)]' : 'bg-transparent text-[var(--text)] hover:bg-[var(--ptint)]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-4 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] tracking-wider uppercase text-[var(--muted)] font-semibold">
                Collections
              </span>
              <button
                onClick={() => {
                  const name = prompt('New collection name:');
                  if (name && name.trim()) addCategoryByName(name.trim());
                }}
                className="text-[var(--p)] text-sm font-semibold cursor-pointer leading-none"
                title="New collection"
              >
                +
              </button>
            </div>
            <div className="flex flex-col gap-0.5">
              {categories.map(col => {
                const count = links.filter(l => l.collection === col.name || l.category === col.name).length;
                const active = filter === `c:${col.name}`;
                return (
                  <button
                    key={col.id}
                    onClick={() => setFilter(active ? 'all' : `c:${col.name}`)}
                    className={`flex items-center justify-between h-8 px-2 text-sm cursor-pointer transition ${
                      active ? 'bg-[var(--ptint)] text-[var(--p)] font-medium' : 'text-[var(--text)] hover:bg-[var(--ptint)]'
                    }`}
                  >
                    <span className="truncate flex items-center gap-1.5">
                      <span>{col.emoji}</span>
                      <span>{col.name}</span>
                    </span>
                    <span className="text-xs text-[var(--muted)]">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] tracking-wider uppercase text-[var(--muted)] font-semibold">Tags</span>
            <div className="flex flex-col gap-0.5">
              {Object.keys(tagMap)
                .sort()
                .map(t => {
                  const active = filter === `t:${t}`;
                  return (
                    <button
                      key={t}
                      onClick={() => setFilter(active ? 'all' : `t:${t}`)}
                      className={`flex items-center justify-between h-8 px-2 text-sm cursor-pointer transition ${
                        active ? 'bg-[var(--ptint)] text-[var(--p)] font-medium' : 'text-[var(--text)] hover:bg-[var(--ptint)]'
                      }`}
                    >
                      <span className="truncate">#{t}</span>
                      <span className="text-xs text-[var(--muted)]">{tagMap[t]}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--line)] px-4 py-3 flex items-center justify-between gap-2">
          <span className="text-xs text-[var(--muted)] truncate">{user.email}</span>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="h-8 px-2.5 border border-[var(--line)] bg-transparent text-[var(--text)] text-xs font-semibold cursor-pointer hover:bg-[var(--ptint)]"
          >
            Settings
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 h-full flex flex-col">
        <div className="flex-none flex items-center gap-3 px-6 py-4 border-b border-[var(--line)]">
          <div className="flex-1 flex items-center gap-2 h-10 px-3 border border-[var(--line)] bg-[var(--surf)] text-[var(--muted)] max-w-xl">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
            </svg>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search titles, sites, tags, notes"
              className="flex-1 min-w-0 border-0 outline-none bg-transparent text-[var(--text)] text-sm placeholder:text-[var(--muted)]"
            />
            {query && (
              <button onClick={() => setQuery('')} className="p-1 text-[var(--muted)] hover:text-[var(--text)] cursor-pointer">
                ✕
              </button>
            )}
          </div>

          <span className="text-xs text-[var(--muted)]">
            {filteredLinks.length === links.length ? `${links.length} links` : `${filteredLinks.length} of ${links.length}`}
          </span>

          <div className="flex border border-[var(--line)] h-9">
            <button
              onClick={() => setViewMode('grid')}
              className={`w-9 text-sm cursor-pointer ${viewMode === 'grid' ? 'bg-[var(--p)] text-[var(--on-p)]' : 'bg-transparent text-[var(--text)]'}`}
              title="Grid view"
            >
              ▦
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`w-9 text-sm cursor-pointer border-l border-[var(--line)] ${viewMode === 'list' ? 'bg-[var(--p)] text-[var(--on-p)]' : 'bg-transparent text-[var(--text)]'}`}
              title="List view"
            >
              ☰
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {filteredLinks.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-center px-6">
              <h2 className="text-xl font-semibold">
                {links.length === 0 ? 'Nothing saved yet' : 'No matches'}
              </h2>
              <p className="text-sm text-[var(--muted)] max-w-sm">
                {links.length === 0
                  ? 'Paste a link from anywhere. Strand fetches its title and preview so you can find it later.'
                  : `Nothing saved matches "${query}" in this filter.`}
              </p>
              <button
                onClick={() => setIsAddOpen(true)}
                className="blueprint h-10 px-4 bg-[var(--btn)] text-white border-0 text-sm font-semibold cursor-pointer hover:brightness-105"
              >
                <i className="corner tl"></i>
                <i className="corner tr"></i>
                <i className="corner bl"></i>
                <i className="corner br"></i>
                Add your first link
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 p-6">
              {filteredLinks.map(r => (
                <LinkGridCard key={r.id} post={r} onSelect={selectLink} onToggleStar={toggleStar} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col max-w-3xl">
              {filteredLinks.map(r => (
                <LinkRow key={r.id} post={r} prefs={prefs} onSelect={selectLink} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add Link Modal */}
      {isAddOpen && (
        <div onClick={() => setIsAddOpen(false)} className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
          <div
            onClick={e => e.stopPropagation()}
            className="blueprint bg-[var(--bg)] w-full max-w-lg max-h-[85vh] overflow-y-auto relative"
          >
            <i className="corner tl"></i>
            <i className="corner tr"></i>
            <i className="corner bl"></i>
            <i className="corner br"></i>
            <div className="flex items-center justify-between px-5 pt-5">
              <span className="font-semibold text-lg">Add link</span>
              <button onClick={() => setIsAddOpen(false)} className="text-[var(--muted)] hover:text-[var(--text)] cursor-pointer">
                ✕
              </button>
            </div>
            <AddLinkForm
              categories={categories}
              onCancel={() => setIsAddOpen(false)}
              onSave={draft => {
                createLinkFromDraft(draft);
                setIsAddOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Detail side panel */}
      {currentDetail && (
        <div onClick={() => setSelectedId(null)} className="fixed inset-0 z-50 bg-black/40 flex justify-end">
          <div onClick={e => e.stopPropagation()} className="w-full max-w-md h-full bg-[var(--bg)] border-l border-[var(--line)] overflow-y-auto">
            <LinkDetailContent
              post={currentDetail}
              onToggleStar={toggleStar}
              onDelete={id => deleteLinkById(id)}
              onClose={() => setSelectedId(null)}
            />
          </div>
        </div>
      )}

      {/* Settings modal */}
      {isSettingsOpen && (
        <div onClick={() => setIsSettingsOpen(false)} className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
          <div
            onClick={e => e.stopPropagation()}
            className="blueprint bg-[var(--bg)] w-full max-w-lg max-h-[85vh] overflow-y-auto relative"
          >
            <i className="corner tl"></i>
            <i className="corner tr"></i>
            <i className="corner bl"></i>
            <i className="corner br"></i>
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="absolute top-5 right-5 text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
            >
              ✕
            </button>
            <SettingsContent
              email={user.email}
              appearance={appearance}
              setAppearance={setAppearance}
              openIn={openIn}
              setOpenIn={setOpenIn}
              prefs={prefs}
              updatePrefs={updatePrefs}
              linkCount={links.length}
              onExportCSV={exportCSV}
              onExportJSON={exportJSON}
              onImportJSON={importJSON}
              onDeleteAll={deleteAllLinks}
              onSignOut={onSignOut}
            />
          </div>
        </div>
      )}

      <Toast message={toast} />

      <IncomingShareToast
        payload={incomingShare}
        categories={categories}
        onConfirmSave={saveIncomingShare}
        onDismiss={() => setIncomingShare(null)}
        onAddCategory={addCategoryByName}
      />

      <OfflineIndicator />
    </div>
  );
};
