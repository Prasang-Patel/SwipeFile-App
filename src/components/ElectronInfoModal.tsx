import React, { useState } from 'react';
import { X, Copy, Check, Terminal, HardDrive, Cpu, FolderTree, Database } from 'lucide-react';
import { StorageInfo } from '../types';
import { formatBytes } from '../services/api';

interface ElectronInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  storageInfo: StorageInfo | null;
}

export const ElectronInfoModal: React.FC<ElectronInfoModalProps> = ({
  isOpen,
  onClose,
  storageInfo,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const copyCommand = (cmd: string, idx: number) => {
    navigator.clipboard.writeText(cmd);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1800);
  };

  const commands = [
    {
      label: '1. Install Dependencies for Electron Desktop',
      cmd: 'npm install electron electron-builder concurrently wait-on --save-dev'
    },
    {
      label: '2. Run Locally in Dev Mode (Vite + Electron)',
      cmd: 'npm run electron:dev'
    },
    {
      label: '3. Package Standalone Desktop App (Mac .dmg / Win .exe / Linux)',
      cmd: 'npm run electron:build'
    }
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-200">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-100">
                Swipefile Desktop & Local SQLite Architecture
              </h2>
              <span className="text-[11px] text-neutral-500 font-mono">
                Fully offline · Zero cloud dependence · Native filesystem
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-neutral-300">
          {/* Storage Snapshot */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800/80">
              <div className="flex items-center gap-2 text-neutral-400 mb-1">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] font-mono uppercase tracking-wider">Database</span>
              </div>
              <div className="font-semibold text-neutral-100 text-sm">SQLite 3</div>
              <div className="text-[11px] text-neutral-500 font-mono truncate mt-0.5">
                {storageInfo?.dbPath || '~/SwipefileData/swipefile.db'}
              </div>
            </div>

            <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800/80">
              <div className="flex items-center gap-2 text-neutral-400 mb-1">
                <FolderTree className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-[10px] font-mono uppercase tracking-wider">Media Folder</span>
              </div>
              <div className="font-semibold text-neutral-100 text-sm">
                {storageInfo?.totalAds ?? 0} media files
              </div>
              <div className="text-[11px] text-neutral-500 font-mono truncate mt-0.5">
                {storageInfo?.mediaDir || '~/SwipefileData/media'}
              </div>
            </div>

            <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800/80">
              <div className="flex items-center gap-2 text-neutral-400 mb-1">
                <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-mono uppercase tracking-wider">Storage Footprint</span>
              </div>
              <div className="font-semibold text-neutral-100 text-sm">
                {storageInfo ? formatBytes(storageInfo.storageSizeBytes) : 'Local disk'}
              </div>
              <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
                {storageInfo?.totalFolders ?? 0} folders · {storageInfo?.totalLabels ?? 0} labels
              </div>
            </div>
          </div>

          {/* SQLite Schema Verification */}
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
            <div className="text-xs font-semibold text-neutral-200 mb-2">
              SQLite Tables Configured:
            </div>
            <ul className="space-y-1.5 font-mono text-[11px] text-neutral-400">
              <li className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span className="text-neutral-200">Folders</span>
                <span className="text-neutral-500">(id, name)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span className="text-neutral-200">Labels</span>
                <span className="text-neutral-500">(id, name, color)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span className="text-neutral-200">Ads</span>
                <span className="text-neutral-500">(id, media_path, text_copy, folder_id, created_at)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span className="text-neutral-200">AdLabels</span>
                <span className="text-neutral-500">(ad_id, label_id)</span>
              </li>
            </ul>
          </div>

          {/* Terminal Commands */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-neutral-200">
              Running Electron Desktop Locally on your Computer:
            </div>

            {commands.map((c, idx) => (
              <div key={idx} className="bg-neutral-950 rounded-xl border border-neutral-800 p-3">
                <div className="text-[11px] text-neutral-400 font-medium mb-1.5">
                  {c.label}
                </div>
                <div className="flex items-center justify-between gap-3 bg-neutral-900/90 px-3 py-2 rounded-lg font-mono text-[11px] text-neutral-300">
                  <span className="truncate select-all">{c.cmd}</span>
                  <button
                    onClick={() => copyCommand(c.cmd, idx)}
                    className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-neutral-200 shrink-0 cursor-pointer"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Electron Boilerplate Files Included */}
          <div className="text-[11px] text-neutral-500 leading-relaxed">
            The project includes <code className="text-neutral-300 bg-neutral-950 px-1 py-0.5 rounded">/electron/main.cjs</code> for the Electron main process, <code className="text-neutral-300 bg-neutral-950 px-1 py-0.5 rounded">/electron/preload.cjs</code> with contextBridge, and <code className="text-neutral-300 bg-neutral-950 px-1 py-0.5 rounded">server.ts</code> managing the SQLite database file and local media filesystem.
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
