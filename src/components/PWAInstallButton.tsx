import React, { useState } from 'react';
import { Download, Share2, Smartphone, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // If already running as an installed PWA standalone app, render nothing or a mini indicator
  if (isInstalled) {
    return null;
  }

  return (
    <>
      {isInstallable ? (
        <button
          onClick={install}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer"
          title="Install app to share directly from Threads, Instagram, and Facebook"
        >
          <Download className="w-4 h-4" />
          <span>Install App</span>
        </button>
      ) : (
        <button
          onClick={() => setShowGuide(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
          title="How to install on phone for direct sharing"
        >
          <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
          <span>{isIOS ? 'Install on iPhone' : 'Enable Share Sheet'}</span>
        </button>
      )}

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl relative text-slate-900 dark:text-slate-100">
            <button
              onClick={() => setShowGuide(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">How Direct Sharing Works</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Install to receive shares from Threads & Instagram</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50">
                <p className="font-semibold text-indigo-900 dark:text-indigo-200 mb-1">
                  1. Add PocketShare to your Home Screen:
                </p>
                {isIOS ? (
                  <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300">
                    <li>Tap the <span className="font-semibold text-indigo-600 dark:text-indigo-400">Share icon</span> in Safari's bottom toolbar</li>
                    <li>Scroll down and tap <span className="font-semibold">Add to Home Screen</span></li>
                    <li>Tap <span className="font-semibold">Add</span> in the top right</li>
                  </ol>
                ) : (
                  <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300">
                    <li>Open browser menu (⋮ three dots in Chrome)</li>
                    <li>Tap <span className="font-semibold">Install App</span> or <span className="font-semibold">Add to Home Screen</span></li>
                  </ol>
                )}
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <p className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                  2. Share anytime from your social apps:
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  When browsing Threads, Instagram, or Facebook, tap <strong>Share</strong> on any post and select <strong>PocketShare</strong>. The post automatically saves offline into Food, Travel, or Tech!
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 pt-1">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>Once installed, it appears in your system share sheet!</span>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setShowGuide(false)}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-semibold text-xs sm:text-sm text-white transition shadow-sm"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
