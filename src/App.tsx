import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MasonryGrid } from './components/MasonryGrid';
import { AddAdModal } from './components/AddAdModal';
import { AdDetailModal } from './components/AdDetailModal';
import { NewFolderModal } from './components/NewFolderModal';
import { NewLabelModal } from './components/NewLabelModal';
import { ElectronInfoModal } from './components/ElectronInfoModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { Folder, Label, Ad, ViewFilter, ViewLayout, StorageInfo } from './types';
import * as api from './services/api';

interface DeleteTarget {
  type: 'folder' | 'label' | 'ad';
  id: number;
  name: string;
}

export default function App() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);

  const [activeFilter, setActiveFilter] = useState<ViewFilter>({ type: 'all' });
  const [searchQuery, setSearchQuery] = useState('');
  const [layout, setLayout] = useState<ViewLayout>('masonry');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [isNewLabelModalOpen, setIsNewLabelModalOpen] = useState(false);
  const [isElectronModalOpen, setIsElectronModalOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);

  // In-app reliable delete confirmation modal (no window.confirm iframe issues)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  // Load all initial data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [foldersData, labelsData, storageData] = await Promise.all([
        api.fetchFolders(),
        api.fetchLabels(),
        api.fetchStorageInfo()
      ]);
      setFolders(foldersData);
      setLabels(labelsData);
      setStorageInfo(storageData);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch ads according to current filter & search
  const loadAds = useCallback(async () => {
    try {
      let folderId: number | undefined;
      let labelId: number | undefined;

      if (activeFilter.type === 'folder') {
        folderId = activeFilter.id;
      } else if (activeFilter.type === 'label') {
        labelId = activeFilter.id;
      }

      const adsData = await api.fetchAds({
        folderId,
        labelId,
        search: searchQuery
      });
      setAds(adsData);
    } catch (err) {
      console.error('Failed to load ads:', err);
    }
  }, [activeFilter, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadAds();
  }, [loadAds]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setIsAddModalOpen(true);
      }
      if (e.key === 'Escape') {
        setIsAddModalOpen(false);
        setIsNewFolderModalOpen(false);
        setIsNewLabelModalOpen(false);
        setIsElectronModalOpen(false);
        setSelectedAd(null);
        setDeleteTarget(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handlers for Folders
  const handleCreateFolder = async (name: string) => {
    const newFolder = await api.createFolder(name);
    setFolders((prev) => [...prev, newFolder].sort((a, b) => a.name.localeCompare(b.name)));
    setActiveFilter({ type: 'folder', id: newFolder.id, name: newFolder.name });
  };

  const requestDeleteFolder = (id: number, name: string) => {
    setDeleteTarget({ type: 'folder', id, name });
  };

  // Handlers for Labels
  const handleCreateLabel = async (name: string, color: string) => {
    const newLabel = await api.createLabel(name, color);
    setLabels((prev) => [...prev, newLabel].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const requestDeleteLabel = (id: number, name: string) => {
    setDeleteTarget({ type: 'label', id, name });
  };

  // Handler for Ads
  const requestDeleteAd = (id: number, name: string) => {
    setDeleteTarget({ type: 'ad', id, name });
  };

  // Confirmed Delete execution (called by DeleteConfirmModal)
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      if (deleteTarget.type === 'folder') {
        await api.deleteFolder(deleteTarget.id);
        setFolders((prev) => prev.filter((f) => f.id !== deleteTarget.id));
        if (activeFilter.type === 'folder' && activeFilter.id === deleteTarget.id) {
          setActiveFilter({ type: 'all' });
        }
        await loadAds();
        await loadData();
      } else if (deleteTarget.type === 'label') {
        await api.deleteLabel(deleteTarget.id);
        setLabels((prev) => prev.filter((l) => l.id !== deleteTarget.id));
        if (activeFilter.type === 'label' && activeFilter.id === deleteTarget.id) {
          setActiveFilter({ type: 'all' });
        }
        await loadAds();
        await loadData();
      } else if (deleteTarget.type === 'ad') {
        await api.deleteAd(deleteTarget.id, true);
        setAds((prev) => prev.filter((a) => a.id !== deleteTarget.id));
        if (selectedAd?.id === deleteTarget.id) {
          setSelectedAd(null);
        }
        await loadData();
      }
      setDeleteTarget(null);
    } catch (err) {
      console.error('Failed to execute delete:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Upload ad with separate Headline and Description
  const handleUploadAd = async (params: {
    file: File;
    advertiserName: string;
    primaryText: string;
    headline: string;
    ctaText: string;
    folderId: number | null;
    labelIds: number[];
  }) => {
    const newAd = await api.uploadAd({
      file: params.file,
      advertiserName: params.advertiserName,
      primaryText: params.primaryText,
      headline: params.headline,
      ctaText: params.ctaText,
      folderId: params.folderId,
      labelIds: params.labelIds
    });
    setAds((prev) => [newAd, ...prev]);
    loadData();
  };

  // Update ad
  const handleUpdateAd = async (
    id: number,
    params: {
      advertiserName?: string;
      primaryText?: string;
      headline?: string;
      ctaText?: string;
      folderId?: number | null;
      labelIds?: number[];
    }
  ) => {
    const updatedAd = await api.updateAd(id, params);
    setAds((prev) => prev.map((a) => (a.id === id ? updatedAd : a)));
    setSelectedAd(updatedAd);
    loadData();
  };

  const totalAdCount = storageInfo?.totalAds ?? ads.length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-950 font-sans text-neutral-100 antialiased selection:bg-neutral-800 selection:text-white">
      {/* Left Sidebar */}
      <Sidebar
        folders={folders}
        labels={labels}
        activeFilter={activeFilter}
        onSelectFilter={setActiveFilter}
        onOpenAddAd={() => setIsAddModalOpen(true)}
        onOpenNewFolder={() => setIsNewFolderModalOpen(true)}
        onOpenNewLabel={() => setIsNewLabelModalOpen(true)}
        onDeleteFolder={requestDeleteFolder}
        onDeleteLabel={requestDeleteLabel}
        storageInfo={storageInfo}
        onOpenElectronInfo={() => setIsElectronModalOpen(true)}
        totalAdCount={totalAdCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-neutral-950">
        <Header
          activeFilter={activeFilter}
          itemCount={ads.length}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          layout={layout}
          onLayoutChange={setLayout}
          onOpenAddAd={() => setIsAddModalOpen(true)}
          onOpenElectronInfo={() => setIsElectronModalOpen(true)}
        />

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-800">
          <MasonryGrid
            ads={ads}
            layout={layout}
            onSelectAd={(ad) => setSelectedAd(ad)}
            onEditAd={(ad) => setSelectedAd(ad)}
            onDeleteAd={requestDeleteAd}
            onOpenAddAd={() => setIsAddModalOpen(true)}
            hasFilterActive={activeFilter.type !== 'all' || !!searchQuery}
            onClearFilters={() => {
              setActiveFilter({ type: 'all' });
              setSearchQuery('');
            }}
          />
        </div>
      </main>

      {/* Modals */}
      <AddAdModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        folders={folders}
        labels={labels}
        defaultFolderId={activeFilter.type === 'folder' ? activeFilter.id : null}
        onUpload={handleUploadAd}
        onOpenNewFolder={() => setIsNewFolderModalOpen(true)}
        onOpenNewLabel={() => setIsNewLabelModalOpen(true)}
      />

      <AdDetailModal
        ad={selectedAd}
        isOpen={!!selectedAd}
        onClose={() => setSelectedAd(null)}
        folders={folders}
        labels={labels}
        onUpdateAd={handleUpdateAd}
        onDeleteAd={requestDeleteAd}
      />

      <NewFolderModal
        isOpen={isNewFolderModalOpen}
        onClose={() => setIsNewFolderModalOpen(false)}
        onCreate={handleCreateFolder}
      />

      <NewLabelModal
        isOpen={isNewLabelModalOpen}
        onClose={() => setIsNewLabelModalOpen(false)}
        onCreate={handleCreateLabel}
      />

      <ElectronInfoModal
        isOpen={isElectronModalOpen}
        onClose={() => setIsElectronModalOpen(false)}
        storageInfo={storageInfo}
      />

      {/* Safe In-App Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        title={
          deleteTarget?.type === 'folder'
            ? `Delete folder "${deleteTarget.name}"?`
            : deleteTarget?.type === 'label'
            ? `Delete label "${deleteTarget.name}"?`
            : `Delete creative "${deleteTarget?.name || 'this ad'}"?`
        }
        description={
          deleteTarget?.type === 'folder'
            ? 'Ads in this folder will NOT be lost—they will simply become Uncategorized in your swipefile.'
            : deleteTarget?.type === 'label'
            ? 'This label will be detached from all creatives in your library.'
            : 'This will permanently remove this creative from your SQLite database and delete the local file from disk.'
        }
        confirmLabel={
          deleteTarget?.type === 'folder'
            ? 'Delete Folder'
            : deleteTarget?.type === 'label'
            ? 'Delete Label'
            : 'Delete Ad'
        }
      />
    </div>
  );
}
