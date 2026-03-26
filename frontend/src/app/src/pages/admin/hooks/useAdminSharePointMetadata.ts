import { useState, useEffect, useMemo, useRef } from 'react';
import { WorkspaceFileDto } from '../../../services/admin/types/adminWorkspace.types';
import { 
  AdminSharePointFileWithMetadata, 
  AdminSharePointMetadataState,
  AdminDriveInfo,
  AdminFileItemDetails 
} from '../../../services/admin/types/adminSharePoint.types';
import { useAdminSharePointApi } from '../../../services/admin/adminSharePointService';

export const useAdminSharePointMetadata = (files: WorkspaceFileDto[]) => {
  const { getMultipleAdminDriveInfos, getMultipleAdminFileDetails } = useAdminSharePointApi();
  
  const [state, setState] = useState<AdminSharePointMetadataState>({
    driveInfoCache: new Map(),
    driveInfoLoading: false,
    driveInfoError: undefined,
    fileMetadataCache: new Map(),
    fileMetadataLoading: false,
    fileMetadataError: undefined,
    isLoading: false,
  });

  // Use refs to track what we've already loaded to prevent infinite loops
  const loadedDriveIds = useRef<Set<string>>(new Set());
  const loadedFileKeys = useRef<Set<string>>(new Set());

  // Filter SharePoint files and extract unique drive IDs
  const sharePointFiles = useMemo(() => {
    return files.filter(file => 
      file.fileSource === 'Sharepoint' && 
      file.driveId && 
      file.itemId
    );
  }, [files]);

  const uniqueDriveIds = useMemo(() => {
    return [...new Set(sharePointFiles.map(file => file.driveId!).filter(Boolean))];
  }, [sharePointFiles]);

  // Load drive information
  useEffect(() => {
    const loadDriveInfo = async () => {
      if (uniqueDriveIds.length === 0) return;

      // Check which drives we haven't loaded yet
      const uncachedDriveIds = uniqueDriveIds.filter(driveId => 
        !loadedDriveIds.current.has(driveId)
      );

      if (uncachedDriveIds.length === 0) return;

      // Mark these drives as being loaded
      uncachedDriveIds.forEach(driveId => loadedDriveIds.current.add(driveId));

      setState(prev => ({ ...prev, driveInfoLoading: true, driveInfoError: undefined }));

      try {
        const driveInfoMap = await getMultipleAdminDriveInfos(uncachedDriveIds);
        
        setState(prev => ({
          ...prev,
          driveInfoCache: new Map([...prev.driveInfoCache, ...driveInfoMap]),
          driveInfoLoading: false,
        }));
      } catch (error) {
        console.error('Failed to load drive information:', error);
        // Remove from loaded set on error so they can be retried
        uncachedDriveIds.forEach(driveId => loadedDriveIds.current.delete(driveId));
        setState(prev => ({
          ...prev,
          driveInfoLoading: false,
          driveInfoError: error instanceof Error ? error.message : 'Failed to load drive information',
        }));
      }
    };

    loadDriveInfo();
  }, [uniqueDriveIds.join(','), getMultipleAdminDriveInfos]); // Use join to create stable dependency

  // Create a stable key for SharePoint files to avoid infinite re-renders
  const sharePointFilesKey = useMemo(() => {
    return sharePointFiles.map(file => `${file.id}-${file.driveId}-${file.itemId}`).sort().join('|');
  }, [sharePointFiles]);

  // Load file metadata
  useEffect(() => {
    const loadFileMetadata = async () => {
      if (sharePointFiles.length === 0) return;

      // Create file requests for files we haven't loaded yet
      const fileRequests = sharePointFiles
        .filter(file => {
          const key = `${file.driveId}:${file.itemId}`;
          return !loadedFileKeys.current.has(key);
        })
        .map(file => ({
          driveId: file.driveId!,
          itemId: file.itemId!,
          key: `${file.driveId}:${file.itemId}`,
        }));

      if (fileRequests.length === 0) return;

      // Mark these files as being loaded
      fileRequests.forEach(req => loadedFileKeys.current.add(req.key));

      setState(prev => ({ ...prev, fileMetadataLoading: true, fileMetadataError: undefined }));

      try {
        // Process in smaller chunks to avoid overwhelming the API
        const chunkSize = 5; // Reduced from 20 to 5
        const chunks = [];
        for (let i = 0; i < fileRequests.length; i += chunkSize) {
          chunks.push(fileRequests.slice(i, i + chunkSize));
        }

        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          console.log(`Admin SharePoint: Processing file metadata chunk ${i + 1}/${chunks.length} (${chunk.length} files)`);
          
          const fileMetadataMap = await getMultipleAdminFileDetails(chunk);
          
          setState(prev => ({
            ...prev,
            fileMetadataCache: new Map([...prev.fileMetadataCache, ...fileMetadataMap]),
          }));

          // Add delay between chunks to avoid rate limiting
          if (i < chunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }

        setState(prev => ({ ...prev, fileMetadataLoading: false }));
      } catch (error) {
        console.error('Failed to load file metadata:', error);
        // Remove from loaded set on error so they can be retried
        fileRequests.forEach(req => loadedFileKeys.current.delete(req.key));
        setState(prev => ({
          ...prev,
          fileMetadataLoading: false,
          fileMetadataError: error instanceof Error ? error.message : 'Failed to load file metadata',
        }));
      }
    };

    loadFileMetadata();
  }, [sharePointFilesKey, getMultipleAdminFileDetails]); // Use stable key instead of array

  // Update overall loading state
  useEffect(() => {
    setState(prev => ({
      ...prev,
      isLoading: prev.driveInfoLoading || prev.fileMetadataLoading,
    }));
  }, [state.driveInfoLoading, state.fileMetadataLoading]);

  // Merge files with metadata
  const filesWithMetadata = useMemo((): AdminSharePointFileWithMetadata[] => {
    return sharePointFiles.map(file => {
      const driveInfo = file.driveId ? state.driveInfoCache.get(file.driveId) : undefined;
      const fileMetadataKey = `${file.driveId}:${file.itemId}`;
      const fileMetadata = state.fileMetadataCache.get(fileMetadataKey);

      const enhancedFile: AdminSharePointFileWithMetadata = {
        ...file,
        driveInfoLoading: state.driveInfoLoading,
        fileMetadataLoading: state.fileMetadataLoading,
      };

      // Add drive info if available and not an error
      if (driveInfo && !(driveInfo instanceof Error)) {
        enhancedFile.driveInfo = driveInfo;
      } else if (driveInfo instanceof Error) {
        enhancedFile.driveInfoError = driveInfo.message;
      }

      // Add file metadata if available and not an error
      if (fileMetadata && !(fileMetadata instanceof Error)) {
        enhancedFile.graphMetadata = {
          lastModifiedDateTime: fileMetadata.lastModifiedDateTime,
          createdDateTime: fileMetadata.createdDateTime,
          size: fileMetadata.size,
          createdBy: fileMetadata.createdBy,
          lastModifiedBy: fileMetadata.lastModifiedBy,
          webUrl: fileMetadata.webUrl,
        };
      } else if (fileMetadata instanceof Error) {
        enhancedFile.fileMetadataError = fileMetadata.message;
      }

      return enhancedFile;
    });
  }, [sharePointFiles, state.driveInfoCache, state.fileMetadataCache, state.driveInfoLoading, state.fileMetadataLoading]);

  // Helper functions
  const getDriveInfo = (driveId: string): AdminDriveInfo | Error | undefined => {
    return state.driveInfoCache.get(driveId);
  };

  const getFileMetadata = (driveId: string, itemId: string): AdminFileItemDetails | Error | undefined => {
    return state.fileMetadataCache.get(`${driveId}:${itemId}`);
  };

  const refreshDriveInfo = async (driveId: string) => {
    setState(prev => ({ ...prev, driveInfoLoading: true }));
    try {
      const driveInfoMap = await getMultipleAdminDriveInfos([driveId]);
      setState(prev => ({
        ...prev,
        driveInfoCache: new Map([...prev.driveInfoCache, ...driveInfoMap]),
        driveInfoLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        driveInfoLoading: false,
        driveInfoError: error instanceof Error ? error.message : 'Failed to refresh drive information',
      }));
    }
  };

  const refreshFileMetadata = async (driveId: string, itemId: string) => {
    setState(prev => ({ ...prev, fileMetadataLoading: true }));
    try {
      const fileMetadataMap = await getMultipleAdminFileDetails([{
        driveId,
        itemId,
        key: `${driveId}:${itemId}`,
      }]);
      setState(prev => ({
        ...prev,
        fileMetadataCache: new Map([...prev.fileMetadataCache, ...fileMetadataMap]),
        fileMetadataLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        fileMetadataLoading: false,
        fileMetadataError: error instanceof Error ? error.message : 'Failed to refresh file metadata',
      }));
    }
  };

  // Force refresh all SharePoint data
  const refreshAllSharePointData = async () => {
    console.log('Admin SharePoint: Force refreshing all data...');
    
    // Clear all caches
    setState(prev => ({
      ...prev,
      driveInfoCache: new Map(),
      fileMetadataCache: new Map(),
      driveInfoError: undefined,
      fileMetadataError: undefined,
    }));
    
    // Clear tracking refs
    loadedDriveIds.current.clear();
    loadedFileKeys.current.clear();
    
    // Force reload by triggering the effects
    // The useEffects will re-run because we cleared the ref tracking
  };

  return {
    filesWithMetadata,
    isLoading: state.isLoading,
    driveInfoLoading: state.driveInfoLoading,
    fileMetadataLoading: state.fileMetadataLoading,
    driveInfoError: state.driveInfoError,
    fileMetadataError: state.fileMetadataError,
    getDriveInfo,
    getFileMetadata,
    refreshDriveInfo,
    refreshFileMetadata,
    refreshAllSharePointData, // New comprehensive refresh function
  };
};