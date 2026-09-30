import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  Trash2, 
  Edit3, 
  Play, 
  Folder as FolderIcon,
  ExternalLink
} from 'lucide-react';
import { Ad } from '../types';
import { getMediaUrl } from '../services/api';

interface AdCardProps {
  ad: Ad;
  onSelect: (ad: Ad) => void;
  onEdit: (ad: Ad) => void;
  onDelete: (id: number, name: string) => void;
}

export const AdCard: React.FC<AdCardProps> = ({
  ad,
  onSelect,
  onEdit,
  onDelete
}) => {
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  const isVideo = /\.(mp4|webm|mov|ogg)$/i.test(ad.media_filename);
  const mediaUrl = getMediaUrl(ad.media_filename);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = [
      ad.primary_text ? `[Primary Text]\n${ad.primary_text}` : '',
      ad.headline ? `\n[Headline]\n${ad.headline}` : '',
      ad.cta_text ? `\n[CTA]: ${ad.cta_text}` : ''
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(textToCopy || ad.text_copy);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const advertiser = ad.advertiser_name || ad.folder_name || 'Sponsored Creative';
  const initial = advertiser.charAt(0).toUpperCase();

  return (
    <div 
      onClick={() => onSelect(ad)}
      className="group relative bg-neutral-900 border border-neutral-800/90 hover:border-neutral-700/80 rounded-xl overflow-hidden transition-all duration-200 cursor-pointer flex flex-col shadow-sm select-none"
    >
      {/* 1. Facebook Ads Library Header: Brand Avatar + Name + "Sponsored" */}
      <div className="p-3.5 pb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Circular Brand Avatar */}
          <div className="w-8 h-8 rounded-full bg-emerald-950/80 border border-emerald-700/50 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0 shadow-inner">
            {initial}
          </div>
          <div className="min-w-0">
            <span className="font-semibold text-xs text-neutral-100 block truncate tracking-tight">
              {advertiser}
            </span>
            <span className="text-[11px] text-neutral-400 font-sans block leading-none mt-0.5">
              Sponsored
            </span>
          </div>
        </div>

        {/* Quick action controls on hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(ad);
            }}
            title="Edit Ad"
            className="p-1 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(ad.id, ad.headline || advertiser);
            }}
            title="Delete Ad"
            className="p-1 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Facebook Primary Text / Description (Above Media) */}
      {ad.primary_text && (
        <div className="px-3.5 pb-3">
          <p className="text-xs text-neutral-200 leading-relaxed font-sans line-clamp-4 select-text">
            {ad.primary_text}
          </p>
        </div>
      )}

      {/* 3. Media Showcase (Center) */}
      <div className="relative w-full overflow-hidden bg-neutral-950 flex items-center justify-center">
        {isVideo ? (
          <div className="relative w-full aspect-4/5 sm:aspect-square bg-neutral-950 flex items-center justify-center">
            <video 
              src={mediaUrl} 
              preload="metadata"
              className="w-full h-full object-cover" 
            />
            {/* Center Play Button Overlay matching Facebook Ads Library */}
            <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-neutral-900/80 border border-white/40 backdrop-blur-xs flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
                <Play className="w-5 h-5 ml-0.5 fill-white text-white" />
              </div>
            </div>
          </div>
        ) : imgError ? (
          <div className="aspect-4/3 w-full bg-neutral-950 flex flex-col items-center justify-center p-4 text-center">
            <span className="text-xs text-neutral-400 font-medium">{ad.media_filename}</span>
            <span className="text-[11px] text-neutral-600 mt-1">Creative Media Asset</span>
          </div>
        ) : (
          <img
            src={mediaUrl}
            alt={ad.headline || ad.media_filename}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-auto object-cover max-h-[500px]"
            loading="lazy"
          />
        )}
      </div>

      {/* 4. Facebook Ad Bottom Bar: Headline (Left) + CTA Button (Right) */}
      <div className="p-3 bg-neutral-900/90 border-t border-neutral-800/70 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-semibold text-neutral-100 truncate leading-snug">
            {ad.headline || 'Learn More'}
          </h4>
          <span className="text-[10px] text-neutral-500 font-mono block truncate mt-0.5">
            {ad.folder_name ? `${ad.folder_name}` : 'Swipefile Creative'}
          </span>
        </div>

        {/* Facebook Style CTA Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(ad);
          }}
          className="shrink-0 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 hover:text-white border border-neutral-700/80 text-xs font-medium rounded-md transition-colors shadow-xs"
        >
          {ad.cta_text || 'See Details'}
        </button>
      </div>

      {/* 5. Swipefile Metadata & Copy Helper Footer */}
      <div className="px-3.5 py-2 bg-neutral-950/60 border-t border-neutral-800/40 flex items-center justify-between text-[11px] text-neutral-400">
        {/* Labels with subtle dots */}
        <div className="flex items-center gap-2 truncate max-w-[65%]">
          {ad.labels && ad.labels.length > 0 ? (
            ad.labels.slice(0, 2).map((lbl) => (
              <span key={lbl.id} className="inline-flex items-center gap-1 truncate">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: lbl.color }} />
                <span className="truncate">{lbl.name}</span>
              </span>
            ))
          ) : (
            <span className="text-neutral-500">Local Creative</span>
          )}
        </div>

        {/* 1-Click Copy Copy */}
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer shrink-0"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
