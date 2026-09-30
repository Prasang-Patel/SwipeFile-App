import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Trash2, 
  Folder as FolderIcon, 
  Tag, 
  HardDrive, 
  Edit2,
  Save,
  Play
} from 'lucide-react';
import { Ad, Folder, Label } from '../types';
import { getMediaUrl } from '../services/api';

interface AdDetailModalProps {
  ad: Ad | null;
  isOpen: boolean;
  onClose: () => void;
  folders: Folder[];
  labels: Label[];
  onUpdateAd: (id: number, params: {
    advertiserName?: string;
    primaryText?: string;
    headline?: string;
    ctaText?: string;
    folderId?: number | null;
    labelIds?: number[];
  }) => Promise<void>;
  onDeleteAd: (id: number, name: string) => void;
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

export const AdDetailModal: React.FC<AdDetailModalProps> = ({
  ad,
  isOpen,
  onClose,
  folders,
  labels,
  onUpdateAd,
  onDeleteAd
}) => {
  if (!isOpen || !ad) return null;

  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Facebook Ad fields
  const [editedAdvertiser, setEditedAdvertiser] = useState(ad.advertiser_name || '');
  const [editedPrimaryText, setEditedPrimaryText] = useState(ad.primary_text || '');
  const [editedHeadline, setEditedHeadline] = useState(ad.headline || '');
  const [editedCtaText, setEditedCtaText] = useState(ad.cta_text || 'See Details');

  const [editedFolderId, setEditedFolderId] = useState<number | null>(ad.folder_id);
  const [editedLabelIds, setEditedLabelIds] = useState<number[]>(
    ad.labels.map((l) => l.id)
  );
  const [isSaving, setIsSaving] = useState(false);

  const isVideo = /\.(mp4|webm|mov|ogg)$/i.test(ad.media_filename);
  const mediaUrl = getMediaUrl(ad.media_filename);
  const advertiser = ad.advertiser_name || ad.folder_name || 'Advertiser';

  const handleCopy = () => {
    const textToCopy = [
      ad.primary_text ? `[Primary Text]\n${ad.primary_text}` : '',
      ad.headline ? `\n[Headline]\n${ad.headline}` : '',
      ad.cta_text ? `\n[CTA]: ${ad.cta_text}` : ''
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(textToCopy || ad.text_copy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = async () => {
    try {
      setIsSaving(true);
      await onUpdateAd(ad.id, {
        advertiserName: editedAdvertiser.trim(),
        primaryText: editedPrimaryText.trim(),
        headline: editedHeadline.trim(),
        ctaText: editedCtaText,
        folderId: editedFolderId,
        labelIds: editedLabelIds
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update ad:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleLabel = (id: number) => {
    setEditedLabelIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-5xl h-[88vh] bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: Facebook Ad Live Card & Media Showcase */}
        <div className="flex-1 bg-neutral-950 flex flex-col justify-between p-6 relative overflow-y-auto">
          <button
            onClick={onClose}
            className="md:hidden absolute top-3 right-3 p-1.5 text-neutral-400 hover:text-white bg-neutral-900/80 rounded-full z-10"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Facebook Ad Card Presentation */}
          <div className="max-w-md mx-auto w-full bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl my-auto">
            {/* Header: Brand Name + Sponsored */}
            <div className="p-3.5 pb-2.5 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-400 font-bold text-sm shrink-0">
                {(isEditing ? editedAdvertiser || 'A' : advertiser).charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-xs text-neutral-100">
                  {isEditing ? (editedAdvertiser || 'Advertiser') : advertiser}
                </div>
                <div className="text-[11px] text-neutral-400">
                  Sponsored
                </div>
              </div>
            </div>

            {/* Description / Primary Text (Above Media) */}
            <div className="px-3.5 pb-3 text-xs text-neutral-200 leading-relaxed font-sans whitespace-pre-wrap select-text">
              {isEditing ? editedPrimaryText : ad.primary_text}
            </div>

            {/* Media */}
            <div className="relative w-full bg-neutral-950 flex items-center justify-center overflow-hidden border-y border-neutral-800/80">
              {isVideo ? (
                <div className="relative w-full aspect-4/5 sm:aspect-square bg-neutral-950 flex items-center justify-center">
                  <video
                    src={mediaUrl}
                    controls
                    className="max-h-full max-w-full object-cover"
                  />
                </div>
              ) : (
                <img
                  src={mediaUrl}
                  alt={ad.headline || ad.media_filename}
                  className="max-h-[460px] w-full object-cover"
                />
              )}
            </div>

            {/* Bottom Bar: Headline + CTA Button */}
            <div className="p-3.5 bg-neutral-900 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-neutral-100 truncate">
                  {isEditing ? editedHeadline : ad.headline}
                </div>
                <div className="text-[10px] text-neutral-500 font-mono truncate mt-0.5">
                  {ad.folder_name || 'Swipefile Creative'}
                </div>
              </div>

              <div className="px-3.5 py-1.5 bg-neutral-800 text-neutral-100 border border-neutral-700 text-xs font-medium rounded-md shrink-0 shadow-xs">
                {isEditing ? editedCtaText : ad.cta_text || 'See Details'}
              </div>
            </div>
          </div>

          {/* Absolute File Path Overlay */}
          <div className="mt-4 flex items-center justify-between text-[11px] text-neutral-500 font-mono bg-neutral-900/80 px-3 py-1.5 rounded-lg border border-neutral-800/80">
            <span className="truncate max-w-[80%] flex items-center gap-1.5">
              <HardDrive className="w-3 h-3 text-neutral-400 shrink-0" />
              <span className="truncate">{ad.media_path}</span>
            </span>
            <span className="shrink-0 text-neutral-400">Offline SQLite Path</span>
          </div>
        </div>

        {/* Right: Inspector Details & Separate Headline/Description Editors */}
        <div className="w-full md:w-96 bg-neutral-900 border-l border-neutral-800 flex flex-col justify-between overflow-y-auto">
          {/* Top Inspector Header */}
          <div>
            <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-neutral-200">Creative Properties</h3>
                <span className="text-[10px] font-mono text-neutral-500">
                  ID: #{ad.id} · {new Date(ad.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    isEditing
                      ? 'bg-neutral-800 text-neutral-100'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                  }`}
                  title={isEditing ? 'Cancel Edit' : 'Edit Fields'}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={onClose}
                  className="hidden md:flex p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Editing Mode: Separate Headline and Description Inputs */}
            {isEditing ? (
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Brand / Advertiser
                  </label>
                  <input
                    type="text"
                    value={editedAdvertiser}
                    onChange={(e) => setEditedAdvertiser(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-neutral-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Description / Primary Text (Above Media)
                  </label>
                  <textarea
                    value={editedPrimaryText}
                    onChange={(e) => setEditedPrimaryText(e.target.value)}
                    rows={4}
                    className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs rounded-xl p-3 focus:outline-none focus:border-neutral-700 leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Headline (Below Media)
                  </label>
                  <input
                    type="text"
                    value={editedHeadline}
                    onChange={(e) => setEditedHeadline(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-neutral-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    CTA Button
                  </label>
                  <select
                    value={editedCtaText}
                    onChange={(e) => setEditedCtaText(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs rounded-lg p-2.5 focus:outline-none"
                  >
                    {CTA_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Folder
                  </label>
                  <select
                    value={editedFolderId ?? ''}
                    onChange={(e) =>
                      setEditedFolderId(e.target.value ? Number(e.target.value) : null)
                    }
                    className="w-full bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs rounded-xl p-2.5 focus:outline-none"
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
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Labels
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {labels.map((lbl) => {
                      const isSel = editedLabelIds.includes(lbl.id);
                      return (
                        <button
                          key={lbl.id}
                          type="button"
                          onClick={() => toggleLabel(lbl.id)}
                          className={`text-xs px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition-colors ${
                            isSel
                              ? 'bg-neutral-800 text-neutral-100 border-neutral-700'
                              : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                          }`}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: lbl.color }}
                          />
                          <span>{lbl.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={isSaving}
                    className="px-4 py-1.5 bg-neutral-100 text-neutral-950 hover:bg-white text-xs font-medium rounded-lg shadow-sm"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            ) : (
              /* View Mode */
              <div className="p-5 space-y-6">
                <div>
                  <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block mb-1">
                    Folder
                  </span>
                  <div className="flex items-center gap-2 text-xs text-neutral-200">
                    <FolderIcon className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{ad.folder_name || 'Uncategorized'}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block mb-1">
                    Labels
                  </span>
                  {ad.labels.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {ad.labels.map((lbl) => (
                        <span
                          key={lbl.id}
                          className="inline-flex items-center gap-1.5 text-xs text-neutral-300"
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: lbl.color }}
                          />
                          <span>{lbl.name}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-neutral-500 italic">No labels</span>
                  )}
                </div>

                {/* Primary Text / Description Box */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                      Description (Above Media)
                    </span>
                  </div>
                  <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 text-xs text-neutral-300 leading-relaxed font-sans whitespace-pre-wrap select-text">
                    {ad.primary_text || <span className="text-neutral-500 italic">No description</span>}
                  </div>
                </div>

                {/* Headline Box */}
                <div>
                  <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block mb-1.5">
                    Headline (Below Media)
                  </span>
                  <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 text-xs font-medium text-neutral-200 select-text">
                    {ad.headline || <span className="text-neutral-500 italic">No headline</span>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="p-5 border-t border-neutral-800 flex items-center justify-between bg-neutral-950/40">
            <button
              onClick={() => {
                onDeleteAd(ad.id, ad.headline || advertiser);
                onClose();
              }}
              className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-rose-400 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Creative</span>
            </button>

            <button
              onClick={handleCopy}
              className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy All Copy'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
