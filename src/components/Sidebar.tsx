import React from 'react';
import { 
  Folder as FolderIcon, 
  Tag, 
  Plus, 
  HardDrive,
  Trash2,
  Terminal,
  Grid
} from 'lucide-react';
import { Folder, Label, ViewFilter, StorageInfo } from '../types';

interface SidebarProps {
  folders: Folder[];
  labels: Label[];
  activeFilter: ViewFilter;
  onSelectFilter: (filter: ViewFilter) => void;
  onOpenAddAd: () => void;
  onOpenNewFolder: () => void;
  onOpenNewLabel: () => void;
  onDeleteFolder: (id: number, name: string) => void;
  onDeleteLabel: (id: number, name: string) => void;
  storageInfo: StorageInfo | null;
  onOpenElectronInfo: () => void;
  totalAdCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  folders,
  labels,
  activeFilter,
  onSelectFilter,
  onOpenAddAd,
  onOpenNewFolder,
  onOpenNewLabel,
  onDeleteFolder,
  onDeleteLabel,
  storageInfo,
  onOpenElectronInfo,
  totalAdCount,
}) => {
  const isAllActive = activeFilter.type === 'all';

  return (
    <aside className="w-64 h-screen bg-neutral-950 border-r border-neutral-800/80 flex flex-col justify-between select-none shrink-0 text-neutral-300">
      {/* Top Header & Primary Action */}
      <div className="flex flex-col">
        {/* Brand Lockup */}
        <div className="px-5 pt-5 pb-4 flex items-center justify-between border-b border-neutral-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-neutral-900 border border-neutral-700/80 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
              S
            </div>
            <div>
              <span className="font-semibold text-sm tracking-tight text-neutral-100 block">
                Swipefile
              </span>
              <span className="text-[10px] text-neutral-500 font-mono tracking-wider">
                OFFLINE · SQLITE
              </span>
            </div>
          </div>
          <button
            onClick={onOpenElectronInfo}
            title="Desktop Electron CLI & Info"
            className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 rounded-md transition-colors cursor-pointer"
          >
            <Terminal className="w-4 h-4" />
          </button>
        </div>

        {/* Primary CTA Button */}
        <div className="p-3.5">
          <button
            onClick={onOpenAddAd}
            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-neutral-100 text-neutral-950 hover:bg-white rounded-lg font-medium text-xs tracking-tight transition-all duration-150 shadow-sm active:scale-[0.99] group cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-neutral-900" />
              <span>Add New Ad</span>
            </span>
            <kbd className="text-[10px] font-mono text-neutral-500 bg-neutral-200/80 px-1.5 py-0.5 rounded font-normal group-hover:text-neutral-700">
              ⌘N
            </kbd>
          </button>
        </div>

        {/* Global Navigation */}
        <div className="px-3 pb-2">
          <button
            onClick={() => onSelectFilter({ type: 'all' })}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              isAllActive
                ? 'bg-neutral-900 text-white font-semibold border border-neutral-800'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Grid className="w-3.5 h-3.5 text-neutral-400" />
              <span>All Creatives</span>
            </span>
            <span className="text-[11px] font-mono tabular-nums text-neutral-500">
              {totalAdCount}
            </span>
          </button>
        </div>

        {/* Scrollable Navigation Sections */}
        <div className="px-3 space-y-5 overflow-y-auto max-h-[calc(100vh-270px)] scrollbar-thin scrollbar-thumb-neutral-800">
          {/* Folders Section */}
          <div>
            <div className="flex items-center justify-between px-2 mb-1.5">
              <span className="text-[11px] font-medium text-neutral-500 tracking-wider">
                FOLDERS
              </span>
              <button
                onClick={onOpenNewFolder}
                title="Create Folder"
                className="p-1 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 rounded transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-0.5">
              {folders.length === 0 ? (
                <div className="px-3 py-2 text-[11px] text-neutral-500 italic">
                  No folders yet
                </div>
              ) : (
                folders.map((folder) => {
                  const isActive =
                    activeFilter.type === 'folder' && activeFilter.id === folder.id;
                  return (
                    <div
                      key={folder.id}
                      className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                        isActive
                          ? 'bg-neutral-900 text-neutral-100 font-medium border border-neutral-800/90'
                          : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40'
                      }`}
                    >
                      <button
                        onClick={() =>
                          onSelectFilter({
                            type: 'folder',
                            id: folder.id,
                            name: folder.name,
                          })
                        }
                        className="flex items-center gap-2 flex-1 text-left truncate cursor-pointer"
                      >
                        <FolderIcon
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isActive ? 'text-neutral-200' : 'text-neutral-500'
                          }`}
                        />
                        <span className="truncate">{folder.name}</span>
                      </button>

                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[11px] font-mono tabular-nums text-neutral-500 group-hover:hidden">
                          {folder.ad_count ?? 0}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onDeleteFolder(folder.id, folder.name);
                          }}
                          title={`Delete folder "${folder.name}"`}
                          className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Labels Section */}
          <div>
            <div className="flex items-center justify-between px-2 mb-1.5">
              <span className="text-[11px] font-medium text-neutral-500 tracking-wider">
                LABELS
              </span>
              <button
                onClick={onOpenNewLabel}
                title="Create Label"
                className="p-1 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 rounded transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-0.5">
              {labels.length === 0 ? (
                <div className="px-3 py-2 text-[11px] text-neutral-500 italic">
                  No labels yet
                </div>
              ) : (
                labels.map((label) => {
                  const isActive =
                    activeFilter.type === 'label' && activeFilter.id === label.id;
                  return (
                    <div
                      key={label.id}
                      className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                        isActive
                          ? 'bg-neutral-900 text-neutral-100 font-medium border border-neutral-800/90'
                          : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40'
                      }`}
                    >
                      <button
                        onClick={() =>
                          onSelectFilter({
                            type: 'label',
                            id: label.id,
                            name: label.name,
                            color: label.color,
                          })
                        }
                        className="flex items-center gap-2 flex-1 text-left truncate cursor-pointer"
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: label.color }}
                        />
                        <span className="truncate">{label.name}</span>
                      </button>

                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[11px] font-mono tabular-nums text-neutral-500 group-hover:hidden">
                          {label.ad_count ?? 0}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onDeleteLabel(label.id, label.name);
                          }}
                          title={`Delete label "${label.name}"`}
                          className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Storage & System Status Bar */}
      <div className="p-3 border-t border-neutral-800/80 bg-neutral-950/60">
        <button
          onClick={onOpenElectronInfo}
          className="w-full text-left p-2 rounded-lg hover:bg-neutral-900/70 border border-neutral-800/40 transition-colors group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="flex items-center gap-1.5 text-xs text-neutral-300 font-medium">
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
              <span>Offline SQLite DB</span>
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="text-[10px] text-neutral-500 truncate font-mono">
            ~/SwipefileData/swipefile.db
          </div>
        </button>
      </div>
    </aside>
  );
};
