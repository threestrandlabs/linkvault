import React from 'react';

export const Toast: React.FC<{ message: string | null }> = ({ message }) => {
  if (!message) return null;
  return (
    <div className="fixed left-1/2 bottom-24 sm:bottom-8 -translate-x-1/2 bg-[var(--text)] text-[var(--bg)] text-xs font-semibold px-3.5 py-2 whitespace-nowrap flex items-center gap-2 shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--hl)" strokeWidth="2" strokeLinecap="round">
        <path d="M20 6 9 17l-5-5"></path>
      </svg>
      <span>{message}</span>
    </div>
  );
};
