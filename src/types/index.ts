export interface Folder {
  id: number;
  name: string;
  ad_count?: number;
}

export interface Label {
  id: number;
  name: string;
  color: string;
  ad_count?: number;
}

export interface Ad {
  id: number;
  media_path: string;
  media_filename: string;
  advertiser_name: string;
  primary_text: string;
  headline: string;
  cta_text: string;
  text_copy: string;
  folder_id: number | null;
  folder_name?: string | null;
  created_at: string;
  labels: Label[];
}

export interface StorageInfo {
  baseDir: string;
  mediaDir: string;
  dbPath: string;
  totalAds: number;
  totalFolders: number;
  totalLabels: number;
  storageSizeBytes: number;
}

export type ViewFilter = 
  | { type: 'all' }
  | { type: 'folder'; id: number; name: string }
  | { type: 'label'; id: number; name: string; color: string };

export type ViewLayout = 'masonry' | 'compact' | 'feed';

export interface ElectronAPI {
  isElectron: boolean;
  openMediaFile: () => Promise<{
    originalPath: string;
    storedPath: string;
    filename: string;
  } | null>;
  getStoragePaths: () => Promise<{
    baseDir: string;
    mediaDir: string;
    dbPath: string;
  }>;
  openMediaFolder: () => Promise<boolean>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
