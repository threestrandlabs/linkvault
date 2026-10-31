import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return <span className="text-xs text-[var(--muted)]">Installed as an app on this device.</span>;
  }

  return (
    <>
      {isInstallable ? (
        <button
          onClick={install}
          className="h-9 px-3 border border-[var(--p)] bg-transparent text-[var(--p)] text-xs font-semibold cursor-pointer hover:bg-[var(--ptint)]"
        >
          Install app
        </button>
      ) : (
        <button
          onClick={() => setShowGuide(true)}
          className="h-9 px-3 border border-[var(--line)] bg-transparent text-[var(--text)] text-xs font-semibold cursor-pointer hover:bg-[var(--ptint)]"
        >
          {isIOS ? 'Install on iPhone' : 'How to install'}
        </button>
      )}

      {showGuide && (
        <div
          onClick={() => setShowGuide(false)}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="blueprint w-full max-w-sm bg-[var(--bg)] text-[var(--text)] p-5 flex flex-col gap-3"
          >
            <i className="corner tl"></i>
            <i className="corner tr"></i>
            <i className="corner bl"></i>
            <i className="corner br"></i>
            <h3 className="text-base font-semibold">Add Strand to your home screen</h3>
            {isIOS ? (
              <ol className="list-decimal list-inside text-sm space-y-1 text-[var(--muted)]">
                <li>Tap the Share icon in Safari's toolbar</li>
                <li>Scroll down and tap "Add to Home Screen"</li>
                <li>Tap "Add" in the top right</li>
              </ol>
            ) : (
              <ol className="list-decimal list-inside text-sm space-y-1 text-[var(--muted)]">
                <li>Open the browser menu</li>
                <li>Tap "Install app" or "Add to Home Screen"</li>
              </ol>
            )}
            <button
              onClick={() => setShowGuide(false)}
              className="h-10 border border-[var(--line)] bg-transparent text-sm font-semibold cursor-pointer hover:bg-[var(--ptint)] mt-1"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
