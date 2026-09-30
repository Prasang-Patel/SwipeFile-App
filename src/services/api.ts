import { Folder, Label, Ad, StorageInfo } from '../types';

export const API_BASE = '/api';

export async function fetchFolders(): Promise<Folder[]> {
  const res = await fetch(`${API_BASE}/folders`);
  if (!res.ok) throw new Error('Failed to fetch folders');
  return res.json();
}

export async function createFolder(name: string): Promise<Folder> {
  const res = await fetch(`${API_BASE}/folders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create folder');
  }
  return res.json();
}

export async function deleteFolder(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/folders/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete folder');
}

export async function fetchLabels(): Promise<Label[]> {
  const res = await fetch(`${API_BASE}/labels`);
  if (!res.ok) throw new Error('Failed to fetch labels');
  return res.json();
}

export async function createLabel(name: string, color: string): Promise<Label> {
  const res = await fetch(`${API_BASE}/labels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, color })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create label');
  }
  return res.json();
}

export async function deleteLabel(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/labels/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete label');
}

export async function fetchAds(options?: {
  folderId?: number;
  labelId?: number;
  search?: string;
}): Promise<Ad[]> {
  const params = new URLSearchParams();
  if (options?.folderId !== undefined) {
    params.set('folder_id', options.folderId.toString());
  }
  if (options?.labelId !== undefined) {
    params.set('label_id', options.labelId.toString());
  }
  if (options?.search) {
    params.set('search', options.search);
  }

  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${API_BASE}/ads${query}`);
  if (!res.ok) throw new Error('Failed to fetch ads');
  return res.json();
}

export async function uploadAd(params: {
  file: File;
  advertiserName?: string;
  primaryText: string;
  headline: string;
  ctaText?: string;
  textCopy?: string;
  folderId: number | null;
  labelIds: number[];
}): Promise<Ad> {
  const formData = new FormData();
  formData.append('media', params.file);
  formData.append('advertiser_name', params.advertiserName || '');
  formData.append('primary_text', params.primaryText || '');
  formData.append('headline', params.headline || '');
  formData.append('cta_text', params.ctaText || 'See Details');
  formData.append('text_copy', params.textCopy || `${params.primaryText}\n\n${params.headline}`.trim());
  if (params.folderId !== null && params.folderId !== undefined) {
    formData.append('folder_id', params.folderId.toString());
  }
  formData.append('label_ids', JSON.stringify(params.labelIds));

  const res = await fetch(`${API_BASE}/ads`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to upload ad creative');
  }

  return res.json();
}

export async function updateAd(
  id: number,
  params: {
    advertiserName?: string;
    primaryText?: string;
    headline?: string;
    ctaText?: string;
    textCopy?: string;
    folderId?: number | null;
    labelIds?: number[];
  }
): Promise<Ad> {
  const res = await fetch(`${API_BASE}/ads/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      advertiser_name: params.advertiserName,
      primary_text: params.primaryText,
      headline: params.headline,
      cta_text: params.ctaText,
      text_copy: params.textCopy,
      folder_id: params.folderId,
      label_ids: params.labelIds
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update ad');
  }

  return res.json();
}

export async function deleteAd(id: number, deleteLocalFile: boolean = true): Promise<void> {
  const res = await fetch(`${API_BASE}/ads/${id}?delete_file=${deleteLocalFile}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete ad');
}

export async function fetchStorageInfo(): Promise<StorageInfo> {
  const res = await fetch(`${API_BASE}/system/info`);
  if (!res.ok) throw new Error('Failed to fetch storage info');
  return res.json();
}

export function getMediaUrl(filename: string): string {
  return `${API_BASE}/media/${encodeURIComponent(filename)}`;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
