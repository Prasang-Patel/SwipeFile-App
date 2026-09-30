import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  Image as ImageIcon, 
  Play, 
  Folder as FolderIcon, 
  Tag, 
  Check, 
  AlertCircle,
  Eye
} from 'lucide-react';
import { Folder, Label } from '../types';

interface AddAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: Folder[];
  labels: Label[];
  defaultFolderId?: number | null;
  onUpload: (params: {
    file: File;
    advertiserName: string;
    primaryText: string;
    headline: string;
    ctaText: string;
    folderId: number | null;
    labelIds: number[];
  }) => Promise<void>;
  onOpenNewFolder: () => void;
  onOpenNewLabel: () => void;
}

const CTA_OPTIONS = [
  'See Details',
  'Learn More',
  'Get Offer',
  'Sign Up',
  'Shop Now',
  'Contact Us',
  'Apply Now',
  'Download',
  'Book Now'
];

export const AddAdModal: React.FC<AddAdModalProps> = ({
  isOpen,
  onClose,
  folders,
  labels,
  defaultFolderId,
  onUpload,
  onOpenNewFolder,
  onOpenNewLabel
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Facebook Ads 2 separate copy fields + brand + CTA
  const [advertiserName, setAdvertiserName] = useState('');
  const [primaryText, setPrimaryText] = useState('');
  const [headline, setHeadline] = useState('');
  const [ctaText, setCtaText] = useState('See Details');
  
  const [folderId, setFolderId] = useState<number | null>(defaultFolderId ?? null);
  const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setError(null);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setError(null);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const toggleLabel = (id: number) => {
    setSelectedLabelIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select an image or video creative file.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onUpload({
        file: selectedFile,
        advertiserName: advertiserName.trim() || 'Advertiser',
        primaryText: primaryText.trim(),
        headline: headline.trim() || 'Learn More',
        ctaText,
        folderId,
        labelIds: selectedLabelIds
      });

      // Reset
      setSelectedFile(null);
      setPreviewUrl(null);
      setAdvertiserName('');
      setPrimaryText('');
      setHeadline('');
      setCtaText('See Details');
      setSelectedLabelIds([]);
      onClose();
    } catch (err: any) {
      console.error('Failed to upload ad:', err);
      setError(err.message || 'Failed to save ad creative');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isVideo = selectedFile ? /\.(mp4|webm|mov)$/i.test(selectedFile.name) : false;
  const displayBrand = advertiserName.trim() || (folderId ? folders.find(f => f.id === folderId)?.name : 'BetterHelp') || 'Advertiser';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-5xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-neutral-100">Add New Creative</h2>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Facebook Ads Library Format · Local SQLite Storage
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2-Column Layout: Left Form Inputs | Right Facebook Ad Live Preview */}
        <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row">
          {/* Left: Input Form */}
          <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-4 border-b lg:border-b-0 lg:border-r border-neutral-800">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Media Upload Area */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                1. Media File (Image or Video) <span className="text-rose-400">*</span>
              </label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,video/mp4,video/quicktime,video/webm"
                className="hidden"
              />

              {!selectedFile ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-neutral-800 hover:border-neutral-700 bg-neutral-950/60 hover:bg-neutral-950 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
                >
                  <UploadCloud className="w-6 h-6 text-neutral-400 group-hover:text-neutral-200 mb-2 group-hover:scale-105 transition-transform" />
                  <div className="text-xs font-medium text-neutral-200">
                    Click to browse or drop ad image/video
                  </div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">
                    Images (JPG, PNG, WebP) or Videos (MP4, MOV)
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <ImageIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="truncate font-mono text-[11px] text-neutral-300">
                      {selectedFile.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className="text-xs text-neutral-400 hover:text-rose-400 font-medium shrink-0 ml-3"
                  >
                    Change
                  </button>
                </div>
              )}
            </div>

            {/* Brand / Advertiser Name */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Brand / Page Name
              </label>
              <input
                type="text"
                value={advertiserName}
                onChange={(e) => setAdvertiserName(e.target.value)}
                placeholder="e.g. BetterHelp, Nike, GoHighLevel"
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-neutral-700 text-neutral-200 placeholder-neutral-600 text-xs rounded-lg p-2.5 focus:outline-none transition-colors"
              />
            </div>

            {/* SEPARATE INPUT 1: Description / Primary Text (Above Media) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-neutral-200">
                  2. Description / Primary Text (Above Media)
                </label>
                <span className="text-[10px] text-neutral-500 font-mono">
                  {primaryText.length} chars
                </span>
              </div>
              <textarea
                value={primaryText}
                onChange={(e) => setPrimaryText(e.target.value)}
                placeholder="e.g. Stop waiting for things to slow down. BetterHelp matches you with a therapist—and insurance options may be available to help with the cost."
                rows={3}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-neutral-700 text-neutral-200 placeholder-neutral-600 text-xs rounded-xl p-3 focus:outline-none transition-colors leading-relaxed"
              />
            </div>

            {/* SEPARATE INPUT 2: Headline (Below Media) + CTA Button */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-neutral-200 mb-1.5">
                  3. Headline (Below Media)
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Life won't slow down"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-neutral-700 text-neutral-200 placeholder-neutral-600 text-xs rounded-lg p-2.5 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  CTA Button
                </label>
                <select
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs rounded-lg p-2.5 focus:outline-none cursor-pointer"
                >
                  {CTA_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Folder & Labels */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-neutral-300">
                    Folder
                  </label>
                  <button
                    type="button"
                    onClick={onOpenNewFolder}
                    className="text-[11px] text-neutral-400 hover:text-neutral-200"
                  >
                    + New
                  </button>
                </div>
                <select
                  value={folderId ?? ''}
                  onChange={(e) => setFolderId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs rounded-lg p-2.5 focus:outline-none"
                >
                  <option value="">Uncategorized</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-neutral-300">
                    Labels
                  </label>
                  <button
                    type="button"
                    onClick={onOpenNewLabel}
                    className="text-[11px] text-neutral-400 hover:text-neutral-200"
                  >
                    + New
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {labels.map((lbl) => {
                    const isSelected = selectedLabelIds.includes(lbl.id);
                    return (
                      <button
                        key={lbl.id}
                        type="button"
                        onClick={() => toggleLabel(lbl.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                          isSelected
                            ? 'bg-neutral-800 text-white border-neutral-600'
                            : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: lbl.color }} />
                        <span>{lbl.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedFile}
                className="px-5 py-2 bg-neutral-100 hover:bg-white disabled:opacity-50 text-neutral-950 text-xs font-medium rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                {isSubmitting ? 'Saving Creative...' : 'Save Ad to Swipefile'}
              </button>
            </div>
          </form>

          {/* Right: Live Facebook Ads Library Preview */}
          <div className="w-full lg:w-96 p-6 bg-neutral-950/60 flex flex-col justify-start">
            <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-medium mb-3">
              <Eye className="w-3.5 h-3.5 text-neutral-500" />
              <span>Facebook Ad Library Preview</span>
            </div>

            {/* Facebook Ad Card Mockup */}
            <div className="w-full bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-lg flex flex-col">
              {/* Header */}
              <div className="p-3 pb-2 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-400 font-bold text-xs">
                  {displayBrand.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-xs text-neutral-100 leading-tight">
                    {displayBrand}
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    Sponsored
                  </div>
                </div>
              </div>

              {/* Primary Text / Description (Above Media) */}
              <div className="px-3 pb-2.5 text-xs text-neutral-200 leading-relaxed min-h-[38px]">
                {primaryText || (
                  <span className="text-neutral-600 italic">
                    Stop waiting for things to slow down. BetterHelp matches you with a therapist...
                  </span>
                )}
              </div>

              {/* Media Container */}
              <div className="relative aspect-4/3 w-full bg-neutral-950 flex items-center justify-center overflow-hidden border-y border-neutral-800/80">
                {previewUrl ? (
                  isVideo ? (
                    <video src={previewUrl} className="w-full h-full object-cover" />
                  ) : (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center text-neutral-600 p-4 text-center">
                    <ImageIcon className="w-8 h-8 stroke-1 mb-1" />
                    <span className="text-[11px]">Upload media to preview</span>
                  </div>
                )}

                {isVideo && (
                  <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-neutral-900/80 border border-white/40 flex items-center justify-center text-white">
                      <Play className="w-4 h-4 ml-0.5 fill-white text-white" />
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Bar: Headline + CTA Button */}
              <div className="p-3 flex items-center justify-between gap-3 bg-neutral-900">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-neutral-100 truncate">
                    {headline || "Life won't slow down"}
                  </div>
                  <div className="text-[10px] text-neutral-500 font-mono truncate mt-0.5">
                    swipefile.local
                  </div>
                </div>

                <div className="px-3 py-1.5 bg-neutral-800 text-neutral-100 border border-neutral-700 text-xs font-medium rounded-md shrink-0 shadow-xs">
                  {ctaText}
                </div>
              </div>
            </div>

            <div className="text-[11px] text-neutral-500 mt-4 leading-relaxed">
              Matches the exact layout of Facebook Ads Library: Brand header on top, description copy above the creative media, and punchy headline + CTA button on the bottom bar.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
