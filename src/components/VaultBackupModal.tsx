import React, { useState } from 'react';
import { X, Download, Upload, HardDrive, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { exportVaultJSON, importVaultJSON } from '../services/storage';
import { SavedPost } from '../types';

interface VaultBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  posts: SavedPost[];
  onReloadData: () => void;
  onResetDefaults: () => void;
}

export const VaultBackupModal: React.FC<VaultBackupModalProps> = ({
  isOpen,
  onClose,
  posts,
  onReloadData,
  onResetDefaults,
}) => {
  const [importStatus, setImportStatus] = useState<{ message: string; isError: boolean } | null>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    const jsonStr = exportVaultJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pocketshare-vault-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const result = importVaultJSON(content);
        if (result.success) {
          setImportStatus({
            message: `Successfully imported ${result.count} new link(s) into your vault!`,
            isError: false,
          });
          onReloadData();
        } else {
          setImportStatus({
            message: result.error || 'Failed to parse JSON backup file',
            isError: true,
          });
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-md my-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl relative text-slate-900 dark:text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Offline Vault Storage</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage your local offline backup and sync
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 mb-5 text-xs text-slate-600 dark:text-slate-300 space-y-1">
          <div className="flex justify-between font-medium">
            <span>Stored Links:</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{posts.length} links</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Offline Availability:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">100% (Local Database)</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Security:</span>
            <span className="text-slate-700 dark:text-slate-300">Private on this device</span>
          </div>
        </div>

        {importStatus && (
          <div
            className={`mb-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              importStatus.isError
                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300'
                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
            }`}
          >
            {importStatus.isError ? <AlertTriangle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
            <span>{importStatus.message}</span>
          </div>
        )}

        <div className="space-y-3">
          {/* Export Button */}
          <button
            onClick={handleExport}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 active:scale-95 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Offline Backup (.json)</span>
          </button>

          {/* Import Button */}
          <label className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer">
            <Upload className="w-4 h-4 text-indigo-500" />
            <span>Restore / Import Backup File</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {/* Reset to defaults */}
          <button
            onClick={() => {
              if (confirm('Reset your vault back to the initial sample social media posts?')) {
                onResetDefaults();
                onClose();
              }
            }}
            className="w-full py-2 px-4 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer pt-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset to Sample Social Posts</span>
          </button>
        </div>
      </div>
    </div>
  );
};
