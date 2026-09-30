import React from 'react';
import { 
  Search, 
  X, 
  LayoutGrid, 
  Rows, 
  Plus, 
  Folder, 
  Tag, 
  HardDrive,
  Download
} from 'lucide-react';
import { ViewFilter, ViewLayout } from '../types';

interface HeaderProps {
  activeFilter: ViewFilter;
  itemCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  layout: ViewLayout;
  onLayoutChange: (l: ViewLayout) => void;
  onOpenAddAd: () => void;
  onOpenElectronInfo: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeFilter,
  itemCount,
  searchQuery,
  onSearchChange,
  layout,
  onLayoutChange,
  onOpenAddAd,
  onOpenElectronInfo
}) => {
  const getTitle = () => {
    if (activeFilter.type === 'folder') return activeFilter.name;
    if (activeFilter.type === 'label') return activeFilter.name;
    return 'All Swipefile Creatives';
  };

  const getSubtitle = () => {
    if (activeFilter.type === 'folder') return 'Folder';
    if (activeFilter.type === 'label') return 'Label';
    return 'Library';
  };

  return (
    <header className="h-16 px-6 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800/80 flex items-center justify-between sticky top-0 z-20 shrink-0">
      {/* Title & Metadata */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2">
          {activeFilter.type === 'folder' && (
            <Folder className="w-4 h-4 text-neutral-400 shrink-0" />
          )}
          {activeFilter.type === 'label' && (
            <span 
              className="w-3 h-3 rounded-full shrink-0" 
              style={{ backgroundColor: activeFilter.color }}
            />
          )}
          <h1 className="text-base font-semibold text-neutral-100 truncate tracking-tight">
            {getTitle()}
          </h1>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-neutral-500 font-mono">
          <span>·</span>
          <span className="tabular-nums font-mono text-neutral-400">
            {itemCount} {itemCount === 1 ? 'creative' : 'creatives'}
          </span>
        </div>
      </div>

      {/* Right Controls: Search, View Switcher & Action */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Search Input */}
        <div className="relative w-52 sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search copy or title..."
            className="w-full bg-neutral-900/90 border border-neutral-800 focus:border-neutral-700 text-neutral-200 placeholder-neutral-500 text-xs rounded-lg pl-8 pr-7 py-1.5 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Layout Switcher */}
        <div className="hidden md:flex items-center bg-neutral-900 border border-neutral-800/80 rounded-lg p-0.5">
          <button
            onClick={() => onLayoutChange('masonry')}
            title="Masonry Layout"
            className={`p-1.5 rounded text-xs transition-colors ${
              layout === 'masonry'
                ? 'bg-neutral-800 text-neutral-100 shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onLayoutChange('compact')}
            title="Compact Grid"
            className={`p-1.5 rounded text-xs transition-colors ${
              layout === 'compact'
                ? 'bg-neutral-800 text-neutral-100 shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Rows className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Primary Add Button (Header) */}
        <button
          onClick={onOpenAddAd}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-white text-neutral-950 font-medium text-xs rounded-lg transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add Ad</span>
        </button>
      </div>
    </header>
  );
};
