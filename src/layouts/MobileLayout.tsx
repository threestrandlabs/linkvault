import React, { useState } from 'react';
import type { User } from 'firebase/auth';
import { VaultApi } from '../hooks/useVault';
import { LinkRow } from '../components/LinkRow';
import { AddLinkForm } from '../components/AddLinkForm';
import { LinkDetailContent } from '../components/LinkDetailContent';
import { SettingsContent } from '../components/SettingsContent';
import { Toast } from '../components/Toast';
import { IncomingShareToast } from '../components/IncomingShareToast';
import { OfflineIndicator } from '../components/OfflineIndicator';

type MobileScreen = 'home' | 'add' | 'detail' | 'collections' | 'settings';

interface MobileLayoutProps {
  vault: VaultApi;
  user: User;
  onSignOut: () => void;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({ vault, user, onSignOut }) => {
  const [screen, setScreen] = useState<MobileScreen>('home');
  const [orgTab, setOrgTab] = useState<'collections' | 'tags'>('collections');

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
    handleResetFilters,
  } = vault;

  const filterChips = (() => {
    const list: { id: string; label: string; isActive: boolean; onClick: () => void }[] = [];
    if (filter.startsWith('c:')) {
      const cName = filter.slice(2);
      list.push({ id: 'active-coll', label: `${cName}  ×`, isActive: true, onClick: () => setFilter('all') });
    }
    list.push({ id: 'all', label: 'All', isActive: filter === 'all', onClick: () => setFilter('all') });
    list.push({ id: 'unread', label: 'Unread', isActive: filter === 'unread', onClick: () => setFilter(filter === 'unread' ? 'all' : 'unread') });
    Object.keys(tagMap)
      .sort((a, b) => tagMap[b] - tagMap[a])
      .forEach(tag => {
        const key = `t:${tag}`;
        list.push({ id: key, label: `#${tag}`, isActive: filter === key, onClick: () => setFilter(filter === key ? 'all' : key) });
      });
    return list;
  })();

  return (
    <div data-testid="layout-mobile" className="h-[100dvh] w-full flex flex-col bg-[var(--bg)] text-[var(--text)]">
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col">
        {screen === 'home' && (
          <div className="flex-1 flex flex-col">
            <div className="px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-2.5 flex flex-col gap-3">
              <div className="flex items-end justify-between">
                <div>
                  <span className="block text-[11px] tracking-[0.14em] uppercase text-[var(--muted)] font-medium">
                    Strand
                  </span>
                  <h1 className="text-3xl font-semibold leading-none tracking-tight">Saved links</h1>
                </div>
                <span className="text-xs text-[var(--muted)] pb-0.5">
                  {links.length > 0 &&
                    (filteredLinks.length === links.length ? `${links.length} links` : `${filteredLinks.length} of ${links.length}`)}
                </span>
              </div>

              {links.length > 0 && (
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-2 h-10 px-3 border border-[var(--line)] bg-[var(--surf)] text-[var(--muted)]">
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

                  <div className="flex gap-1.5 overflow-x-auto -mx-5 px-5 py-0.5 no-scrollbar scrollbar-none">
                    {filterChips.map(c => (
                      <button
                        key={c.id}
                        onClick={c.onClick}
                        className={`flex-none h-[30px] px-3 flex items-center gap-1.5 text-xs font-medium cursor-pointer transition border ${
                          c.isActive
                            ? 'bg-[var(--p)] text-[var(--on-p)] border-[var(--p)]'
                            : 'bg-transparent text-[var(--text)] border-[var(--line)] hover:bg-[var(--ptint)]'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {filteredLinks.length > 0 && (
              <div className="flex flex-col border-t border-[var(--line)]">
                {filteredLinks.map(r => (
                  <LinkRow
                    key={r.id}
                    post={r}
                    prefs={prefs}
                    onSelect={id => {
                      selectLink(id);
                      setScreen('detail');
                    }}
                  />
                ))}
              </div>
            )}

            {links.length > 0 && filteredLinks.length === 0 && (
              <div className="p-12 text-center flex flex-col items-center gap-2">
                <span className="font-semibold text-lg">No matches</span>
                <span className="text-xs text-[var(--muted)]">Nothing saved matches "{query}" in this filter.</span>
                <button
                  onClick={handleResetFilters}
                  className="mt-2 h-9 px-3.5 border border-[var(--line)] bg-transparent text-xs cursor-pointer hover:bg-[var(--ptint)]"
                >
                  Clear search and filters
                </button>
              </div>
            )}

            {links.length === 0 && (
              <div className="flex-1 flex flex-col justify-center px-7 pb-10">
                <div className="blueprint p-8 flex flex-col items-center gap-2.5 text-center">
                  <i className="corner tl"></i>
                  <i className="corner tr"></i>
                  <i className="corner bl"></i>
                  <i className="corner br"></i>
                  <h2 className="text-xl font-semibold">Nothing saved yet</h2>
                  <p className="text-xs leading-relaxed text-[var(--muted)] max-w-[260px]">
                    Paste a link from anywhere. Strand fetches its title and preview so you can find it later.
                  </p>
                  <button
                    onClick={() => setScreen('add')}
                    data-testid="add-link-button"
                    className="blueprint mt-3 h-11 px-5 bg-[var(--btn)] text-white border-0 text-sm font-semibold flex items-center gap-2 cursor-pointer hover:brightness-105 active:scale-95"
                  >
                    <i className="corner tl"></i>
                    <i className="corner tr"></i>
                    <i className="corner bl"></i>
                    <i className="corner br"></i>
                    Add your first link
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {screen === 'add' && (
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between px-3 pt-[max(0.5rem,env(safe-area-inset-top))] py-2 border-b border-[var(--line)]">
              <button
                onClick={() => setScreen('home')}
                className="h-9 px-2 text-sm text-[var(--text)] bg-transparent border-0 cursor-pointer"
              >
                Cancel
              </button>
              <span className="font-semibold text-base">Add link</span>
              <span className="w-10" />
            </div>
            <AddLinkForm
              categories={categories}
              onSave={draft => {
                createLinkFromDraft(draft);
                setScreen('home');
                setFilter('all');
                setQuery('');
              }}
            />
          </div>
        )}

        {screen === 'detail' && currentDetail && (
          <LinkDetailContent
            post={currentDetail}
            onToggleStar={toggleStar}
            onDelete={id => {
              deleteLinkById(id);
              setScreen('home');
            }}
            onClose={() => setScreen('home')}
          />
        )}

        {screen === 'collections' && (
          <div className="p-5 flex flex-col gap-4">
            <h1 className="text-3xl font-semibold">Organise</h1>

            <div className="grid grid-cols-2 border border-[var(--line)] h-9">
              <button
                onClick={() => setOrgTab('collections')}
                className={`border-0 text-xs font-semibold cursor-pointer transition ${
                  orgTab === 'collections' ? 'bg-[var(--p)] text-[var(--on-p)]' : 'bg-transparent text-[var(--text)]'
                }`}
              >
                Collections
              </button>
              <button
                onClick={() => setOrgTab('tags')}
                className={`border-0 text-xs font-semibold cursor-pointer transition ${
                  orgTab === 'tags' ? 'bg-[var(--p)] text-[var(--on-p)]' : 'bg-transparent text-[var(--text)]'
                }`}
              >
                Tags
              </button>
            </div>

            {orgTab === 'collections' && (
              <div className="grid grid-cols-2 gap-3.5 pt-1">
                {categories.map(col => {
                  const count = links.filter(l => l.collection === col.name || l.category === col.name).length;
                  return (
                    <button
                      key={col.id}
                      onClick={() => {
                        setFilter(`c:${col.name}`);
                        setQuery('');
                        setScreen('home');
                      }}
                      className="blueprint h-[118px] p-3 bg-transparent text-[var(--text)] text-left flex flex-col justify-between cursor-pointer hover:bg-[var(--ptint)] transition"
                    >
                      <i className="corner tl"></i>
                      <i className="corner tr"></i>
                      <i className="corner bl"></i>
                      <i className="corner br"></i>
                      <span className="text-xl">{col.emoji}</span>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-base truncate">{col.name}</span>
                        <span className="text-xs text-[var(--muted)]">
                          {count} {count === 1 ? 'link' : 'links'}
                        </span>
                      </div>
                    </button>
                  );
                })}

                <button
                  onClick={() => {
                    const name = prompt('New collection name:');
                    if (name && name.trim()) addCategoryByName(name.trim());
                  }}
                  className="h-[118px] border border-dashed border-[var(--line)] bg-transparent text-[var(--p)] text-xs font-semibold flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:bg-[var(--ptint)] transition"
                >
                  + New collection
                </button>
              </div>
            )}

            {orgTab === 'tags' && (
              <div className="flex flex-col border-t border-[var(--line)]">
                {Object.keys(tagMap)
                  .sort()
                  .map(t => (
                    <button
                      key={t}
                      onClick={() => {
                        setFilter(`t:${t}`);
                        setQuery('');
                        setScreen('home');
                      }}
                      className="flex items-center justify-between h-12 px-1 border-b border-[var(--line)] bg-transparent text-sm cursor-pointer hover:bg-[var(--ptint)] transition"
                    >
                      <span className="font-medium text-[var(--p)]">#{t}</span>
                      <span className="text-xs text-[var(--muted)]">{tagMap[t]}</span>
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}

        {screen === 'settings' && (
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
        )}
      </div>

      {screen !== 'add' && (
        <div className="flex-none grid grid-cols-4 items-center h-[62px] pb-[max(18px,env(safe-area-inset-bottom))] border-t border-[var(--line)] bg-[var(--bg)]">
          <button
            onClick={() => setScreen('home')}
            className={`h-14 border-0 bg-transparent flex flex-col items-center justify-center gap-1 text-[11px] font-semibold cursor-pointer ${
              screen === 'home' || screen === 'detail' ? 'text-[var(--p)]' : 'text-[var(--muted)]'
            }`}
          >
            <span>Links</span>
          </button>

          <button
            onClick={() => setScreen('collections')}
            className={`h-14 border-0 bg-transparent flex flex-col items-center justify-center gap-1 text-[11px] font-semibold cursor-pointer ${
              screen === 'collections' ? 'text-[var(--p)]' : 'text-[var(--muted)]'
            }`}
          >
            <span>Organise</span>
          </button>

          <button
            onClick={() => setScreen('add')}
            data-testid="add-link-button"
            className="h-14 border-0 bg-transparent flex items-center justify-center cursor-pointer"
          >
            <span className="blueprint w-10 h-8 bg-[var(--btn)] text-white border-0 flex items-center justify-center shadow-sm">
              <i className="corner tl"></i>
              <i className="corner tr"></i>
              <i className="corner bl"></i>
              <i className="corner br"></i>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg>
            </span>
          </button>

          <button
            onClick={() => setScreen('settings')}
            className={`h-14 border-0 bg-transparent flex flex-col items-center justify-center gap-1 text-[11px] font-semibold cursor-pointer ${
              screen === 'settings' ? 'text-[var(--p)]' : 'text-[var(--muted)]'
            }`}
          >
            <span>Settings</span>
          </button>
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
