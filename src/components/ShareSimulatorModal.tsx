import React, { useState } from 'react';
import { X, Share2, Sparkles, Send, Globe, Check } from 'lucide-react';
import { IncomingSharePayload } from '../services/shareTarget';

interface ShareSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulateShare: (payload: { title: string; text: string; url: string }) => void;
}

const SAMPLE_SHARES = [
  {
    platform: 'Threads',
    appColor: 'bg-black text-white',
    title: 'Top 5 Hidden Izakayas in Osaka (Local Guide)',
    text: 'Check out these hidden gems! Deep fried kushikatsu and secret highball bars in Dotonbori alleys. https://www.threads.net/@osakafoodie/post/DFe92k91',
    url: 'https://www.threads.net/@osakafoodie/post/DFe92k91',
    category: 'Food',
    emoji: '🍔',
  },
  {
    platform: 'Instagram',
    appColor: 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white',
    title: 'Sunrise hike above the clouds in Madeira, Portugal',
    text: 'Pico do Arieiro to Pico Ruivo trail guide! Pack warm layers and start at 6:30am. https://www.instagram.com/p/C_abc8812/',
    url: 'https://www.instagram.com/p/C_abc8812/',
    category: 'Travel',
    emoji: '✈️',
  },
  {
    platform: 'Facebook',
    appColor: 'bg-blue-600 text-white',
    title: 'Why local WebAssembly and PWA offline storage are beating native apps',
    text: 'A deep dive into zero-latency client state and local SQLite/IndexedDB syncing. https://facebook.com/techtrends/posts/882736192',
    url: 'https://facebook.com/techtrends/posts/882736192',
    category: 'Tech',
    emoji: '💻',
  },
  {
    platform: 'Threads',
    appColor: 'bg-black text-white',
    title: 'Tokyo Streetwear: How to style wide pleated trousers in 2026',
    text: 'Proportions guide: boxy cropped tee + high-rise drape trousers + clean derbies. https://www.threads.net/@tokyostreet/post/C9x8172',
    url: 'https://www.threads.net/@tokyostreet/post/C9x8172',
    category: 'Fashion',
    emoji: '👗',
  },
  {
    platform: 'Web Link',
    appColor: 'bg-slate-800 text-white',
    title: 'General reflections and personal daily notes',
    text: 'Scattered thoughts and general reflections on life. https://example.org/daily-notes/post-9',
    url: 'https://example.org/daily-notes/post-9',
    category: null,
    emoji: '❓',
  },
];

export const ShareSimulatorModal: React.FC<ShareSimulatorModalProps> = ({
  isOpen,
  onClose,
  onSimulateShare,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<number>(0);
  const [customTitle, setCustomTitle] = useState('');
  const [customText, setCustomText] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCustom) {
      if (!customUrl && !customText) return;
      onSimulateShare({
        title: customTitle || 'Shared Social Post',
        text: customText || customUrl,
        url: customUrl || customText,
      });
    } else {
      const preset = SAMPLE_SHARES[selectedPreset];
      onSimulateShare({
        title: preset.title,
        text: preset.text,
        url: preset.url,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl relative text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center shadow-md">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Simulate OS Share Sheet</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Test how PocketShare handles incoming shares from Threads, Instagram & Facebook
            </p>
          </div>
        </div>

        <div className="my-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
          <div>
            When you tap <strong>Share</strong> inside Threads, Instagram, or Facebook on an installed phone, the operating system launches PocketShare and passes the link payload. Click below to simulate that action instantly!
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setIsCustom(false)}
              className={`flex-1 py-1.5 rounded-lg transition ${
                !isCustom
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Preset Social Posts
            </button>
            <button
              type="button"
              onClick={() => setIsCustom(true)}
              className={`flex-1 py-1.5 rounded-lg transition ${
                isCustom
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Custom Link / Post
            </button>
          </div>

          {!isCustom ? (
            <div className="space-y-2.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Select a simulated share event:
              </label>
              <div className="space-y-2">
                {SAMPLE_SHARES.map((preset, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedPreset(index)}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                      selectedPreset === index
                        ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/40 dark:bg-indigo-950/30'
                        : 'border-slate-200 dark:border-slate-700/70 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${preset.appColor}`}>
                          {preset.platform}
                        </span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <span>{preset.emoji}</span>
                          <span>
                            {preset.category
                              ? `Auto-detects as ${preset.category}`
                              : 'No clear category (Prompts manual selection/creation)'}
                          </span>
                        </span>
                      </div>
                      {selectedPreset === index && (
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                      {preset.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 font-mono">
                      {preset.url}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Social Media Post URL
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="url"
                    placeholder="https://www.threads.net/@user/post/..."
                    value={customUrl}
                    onChange={e => setCustomUrl(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Post Caption / Text (Optional)
                </label>
                <textarea
                  placeholder="The best ramen in Tokyo you must try..."
                  value={customText}
                  onChange={e => setCustomText(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="w-2/3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20"
            >
              <Send className="w-4 h-4" />
              <span>Simulate Share Sheet</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
