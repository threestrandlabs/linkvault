import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 bg-[var(--text)] text-[var(--bg)] px-3 py-2 text-xs font-semibold shadow-xl">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--hl)] opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--hl)]"></span>
      </span>
      <span>Offline — showing links from local vault cache</span>
    </div>
  );
};
