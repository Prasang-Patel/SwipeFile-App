import React from 'react';
import { Plus, Image as ImageIcon, FilterX } from 'lucide-react';
import { Ad, ViewLayout } from '../types';
import { AdCard } from './AdCard';

interface MasonryGridProps {
  ads: Ad[];
  layout: ViewLayout;
  onSelectAd: (ad: Ad) => void;
  onEditAd: (ad: Ad) => void;
  onDeleteAd: (id: number, name: string) => void;
  onOpenAddAd: () => void;
  hasFilterActive: boolean;
  onClearFilters: () => void;
}

export const MasonryGrid: React.FC<MasonryGridProps> = ({
  ads,
  layout,
  onSelectAd,
  onEditAd,
  onDeleteAd,
  onOpenAddAd,
  hasFilterActive,
  onClearFilters
}) => {
  // Empty State
  if (ads.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[50vh]">
        <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500 mb-4 shadow-xs">
          <ImageIcon className="w-6 h-6 stroke-[1.5]" />
        </div>
        <h3 className="text-sm font-semibold text-neutral-200 mb-1">
          {hasFilterActive ? 'No matching creatives found' : 'Your swipefile is empty'}
        </h3>
        <p className="text-xs text-neutral-500 max-w-sm mb-6 leading-relaxed">
          {hasFilterActive
            ? 'No ads match your current folder or label filter. Try clearing the filter or adding a new creative here.'
            : 'Save high-converting ad visuals, video hooks, landing page inspirations, and copy to your local offline library.'}
        </p>

        <div className="flex items-center gap-3">
          {hasFilterActive ? (
            <button
              onClick={onClearFilters}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-2"
            >
              <FilterX className="w-3.5 h-3.5" />
              <span>Show All Creatives</span>
            </button>
          ) : null}
          <button
            onClick={onOpenAddAd}
            className="px-4 py-2 bg-neutral-100 hover:bg-white text-neutral-950 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add First Ad</span>
          </button>
        </div>
      </div>
    );
  }

  // Compact Grid Layout
  if (layout === 'compact') {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {ads.map((ad) => (
            <AdCard
              key={ad.id}
              ad={ad}
              onSelect={onSelectAd}
              onEdit={onEditAd}
              onDelete={onDeleteAd}
            />
          ))}
        </div>
      </div>
    );
  }

  // True Masonry Layout using CSS Columns
  return (
    <div className="p-6">
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-5 [column-fill:_balance] space-y-5">
        {ads.map((ad) => (
          <div key={ad.id} className="break-inside-avoid">
            <AdCard
              ad={ad}
              onSelect={onSelectAd}
              onEdit={onEditAd}
              onDelete={onDeleteAd}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
