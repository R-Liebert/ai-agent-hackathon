import React, { useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Chip, 
  IconButton, 
  Tooltip,
  CircularProgress,
  Button
} from '@mui/material';
import { TbCopy, TbRefresh } from 'react-icons/tb';
import { 
  CloudOutlined, 
  BusinessOutlined, 
  PersonOutlined,
  ErrorOutline
} from '@mui/icons-material';
import { WorkspaceFileDto } from '../../../../../services/admin/types/adminWorkspace.types';
import { useAdminSharePointMetadata } from '../../../hooks/useAdminSharePointMetadata';
import { useSubscriptionsQuery } from '../../../hooks/useSubscriptionQueries';
import SubscriptionIndicator from './SubscriptionIndicator';
import { formatBytes, formatDateTime, groupSharePointFiles } from '../utils';

interface SharePointFilesListProps {
  files: WorkspaceFileDto[];
  inactiveFiles: WorkspaceFileDto[];
  search: string;
  workspaceId: string;
}

const SharePointFilesList: React.FC<SharePointFilesListProps> = ({
  files,
  inactiveFiles,
  search,
  workspaceId
}) => {
  // Use shared logic for grouping SharePoint files
  const sharepointGroups = useMemo(() => groupSharePointFiles(files, inactiveFiles), [files, inactiveFiles]);

  // Get SharePoint files for metadata enhancement
  const allSharePointFiles = useMemo(() => {
    const all = [...files, ...inactiveFiles];
    return all.filter((f: any) => (f.fileSource || "").toLowerCase() === "sharepoint");
  }, [files, inactiveFiles]);

  // Use admin SharePoint metadata hook
  const {
    filesWithMetadata,
    isLoading: metadataLoading,
    driveInfoError,
    fileMetadataError,
    getDriveInfo,
    getFileMetadata,
    refreshDriveInfo,
    refreshFileMetadata,
    refreshAllSharePointData,
  } = useAdminSharePointMetadata(allSharePointFiles);

  // Use subscriptions hook for sync status
  const { getSubscriptionStatus, refetch: refetchSubscriptions } = useSubscriptionsQuery();

  // Create a map for quick metadata lookup
  const metadataMap = useMemo(() => {
    const map = new Map();
    filesWithMetadata.forEach(file => {
      map.set(file.id, file);
    });
    return map;
  }, [filesWithMetadata]);

  // Comprehensive refresh handler
  const handleRefreshAll = async () => {
    try {
      // Refresh subscriptions (React Query)
      await refetchSubscriptions();
      
      // Refresh SharePoint metadata (local cache)
      await refreshAllSharePointData();
    } catch (error) {
      // Error handled silently
    }
  };


  // Existing utility functions

  const truncateId = (id?: string) => {
    if (!id) return "—";
    return id.length > 14 ? `${id.slice(0, 6)}…${id.slice(-6)}` : id;
  };

  const copyToClipboard = (text?: string) => {
    if (!text) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
  };

  // Use shared formatter

  const getDriveTypeIcon = (driveType?: 'personal' | 'business' | 'documentLibrary') => {
    switch (driveType) {
      case 'personal':
        return <PersonOutlined fontSize="small" sx={{ color: '#9ca3af' }} />;
      case 'business':
        return <BusinessOutlined fontSize="small" sx={{ color: '#9ca3af' }} />;
      case 'documentLibrary':
        return <CloudOutlined fontSize="small" sx={{ color: '#9ca3af' }} />;
      default:
        return <CloudOutlined fontSize="small" sx={{ color: '#9ca3af' }} />;
    }
  };

  const renderDriveHeader = (driveId: string) => {
    const driveInfo = getDriveInfo(driveId);
    const isError = driveInfo instanceof Error;
    const hasValidInfo = driveInfo && !isError;
    const subscriptionStatus = getSubscriptionStatus(driveId);

    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {/* Subscription Status Indicator */}
          <SubscriptionIndicator status={subscriptionStatus} driveId={driveId} />
          
          <Typography variant="subtitle2" className="text-white-100">Drive:</Typography>
          
          {hasValidInfo ? (
            <>
              {getDriveTypeIcon(driveInfo.driveType)}
              <Typography variant="body2" className="text-white-100">
                {driveInfo.name}
              </Typography>
              <Chip
                label={driveInfo.driveType}
                size="small"
                sx={{
                  backgroundColor: '#2a2a2a',
                  color: '#9ca3af',
                  fontSize: '0.7rem',
                  height: '18px',
                }}
              />
              <Tooltip title={driveId}>
                <Typography variant="caption" sx={{ color: "#bfbfbf" }}>
                  ({truncateId(driveId)})
                </Typography>
              </Tooltip>
            </>
          ) : isError ? (
            <>
              <ErrorOutline fontSize="small" sx={{ color: '#ef4444' }} />
              <Tooltip title={driveInfo.message}>
                <Typography variant="body2" sx={{ color: '#ef4444' }}>
                  Drive Error
                </Typography>
              </Tooltip>
              <IconButton 
                size="small" 
                onClick={() => refreshDriveInfo(driveId)}
                sx={{ color: "#9ca3af", '&:hover': { color: '#EDEDED' } }}
              >
                <TbRefresh size={14} />
              </IconButton>
              <Tooltip title={driveId}>
                <Typography variant="caption" sx={{ color: "#bfbfbf" }}>
                  ({truncateId(driveId)})
                </Typography>
              </Tooltip>
            </>
          ) : (
            <>
              <Tooltip title={driveId === "unknown" ? "Unknown drive" : driveId}>
                <Typography variant="body2" className="text-white-100">
                  {truncateId(driveId === "unknown" ? undefined : driveId)}
                </Typography>
              </Tooltip>
              {metadataLoading && (
                <CircularProgress size={12} sx={{ color: '#f92a4b' }} />
              )}
            </>
          )}
          
          {driveId !== "unknown" && (
            <IconButton 
              size="small" 
              onClick={() => copyToClipboard(driveId)} 
              sx={{ color: "#a3a3a3", '&:hover': { color: '#EDEDED' } }}
            >
              <TbCopy size={16} />
            </IconButton>
          )}
        </Box>
      </Box>
    );
  };

  const renderSharePointStatus = (f: any) => {
    const fileMetadata = metadataMap.get(f.id);
    const graphMeta = fileMetadata?.graphMetadata;
    const fileError = fileMetadata?.fileMetadataError;

    if (fileMetadata?.fileMetadataLoading) {
      return (
        <Box display="flex" alignItems="center" gap={0.5}>
          <CircularProgress size={12} sx={{ color: '#f92a4b' }} />
          <Typography variant="caption" sx={{ color: "#a3a3a3" }}>Loading...</Typography>
        </Box>
      );
    }

    if (fileError) {
      return (
        <Box display="flex" alignItems="center" gap={0.5}>
          <ErrorOutline fontSize="small" sx={{ color: '#ef4444' }} />
          <IconButton 
            size="small" 
            onClick={() => f.driveId && f.itemId && refreshFileMetadata(f.driveId, f.itemId)}
            sx={{ color: "#9ca3af", '&:hover': { color: '#EDEDED' }, p: 0 }}
          >
            <TbRefresh size={12} />
          </IconButton>
        </Box>
      );
    }

    if (graphMeta) {
      // File found successfully
      const isFound = !graphMeta.isMissing;
      return (
        <Chip
          label={isFound ? "Found" : "Missing"}
          size="small"
          sx={{
            backgroundColor: isFound ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)",
            color: isFound ? "#22c55e" : "#ef4444",
            border: `1px solid ${isFound ? "#22c55e" : "#ef4444"}`,
            fontWeight: 500,
            fontSize: '0.7rem',
            height: '22px',
          }}
        />
      );
    }

    // Unknown status
    return (
      <Typography variant="caption" sx={{ color: "#a3a3a3" }}>—</Typography>
    );
  };

  const renderFileRow = (f: any) => {
    const fileMetadata = metadataMap.get(f.id);
    const graphMeta = fileMetadata?.graphMetadata;
    const fileError = fileMetadata?.fileMetadataError;

    return (
      <Box key={f.id} display="grid" gridTemplateColumns="minmax(200px,2fr) 120px 100px 100px 140px 140px" gap={2} px={2} py={0.75} alignItems="center">
        <Typography variant="body2" className="text-white-100" noWrap title={f.fileName}>
          {f.fileName}
        </Typography>
        
        {/* SharePoint Status */}
        <Box display="flex" justifyContent="center">
          {renderSharePointStatus(f)}
        </Box>
        
        <Typography variant="caption" sx={{ color: "#bfbfbf", textAlign: "center" }} noWrap title={f.itemId || "—"}>
          {f.itemId || "—"}
        </Typography>
        
        <Typography variant="caption" sx={{ color: "#bfbfbf", textAlign: "center" }}>
          {formatBytes(f.contentLength)}
        </Typography>
        
        {/* Last Modified (Graph) */}
        <Box>
          {fileMetadata?.fileMetadataLoading ? (
            <Box display="flex" alignItems="center" gap={0.5}>
              <CircularProgress size={12} sx={{ color: '#f92a4b' }} />
              <Typography variant="caption" sx={{ color: "#a3a3a3" }}>Loading...</Typography>
            </Box>
          ) : fileError ? (
            <Box display="flex" alignItems="center" gap={0.5}>
              <ErrorOutline fontSize="small" sx={{ color: '#ef4444' }} />
              <IconButton 
                size="small" 
                onClick={() => f.driveId && f.itemId && refreshFileMetadata(f.driveId, f.itemId)}
                sx={{ color: "#9ca3af", '&:hover': { color: '#EDEDED' }, p: 0 }}
              >
                <TbRefresh size={12} />
              </IconButton>
            </Box>
          ) : graphMeta && !graphMeta.isMissing ? (
            <Tooltip title={`Modified by: ${graphMeta.lastModifiedBy?.user?.displayName || 'Unknown'}`}>
              <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                {formatDateTime(graphMeta.lastModifiedDateTime)}
              </Typography>
            </Tooltip>
          ) : (
            <Typography variant="caption" sx={{ color: "#a3a3a3" }}>—</Typography>
          )}
        </Box>
        
        {/* Uploaded At (Backend) */}
        <Typography variant="caption" sx={{ color: "#bfbfbf" }}>
          {formatDateTime(f.uploadedAt)}
        </Typography>
      </Box>
    );
  };

  if (sharepointGroups.size === 0) {
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" className="text-white-100">
            SharePoint files
          </Typography>
        </Box>
        <Paper sx={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 2, p: 3 }}>
          <Box sx={{ minHeight: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: 'rgba(59,130,246,0.15)',
              border: '1px solid rgba(59,130,246,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#60a5fa',
            }}>
              <CloudOutlined sx={{ fontSize: 28 }} />
            </Box>
            <Typography variant="subtitle1" className="text-white-100" sx={{ mt: 0.5 }}>
              No SharePoint files
            </Typography>
            <Typography variant="body2" sx={{ color: '#bfbfbf', textAlign: 'center' }}>
              Connect a SharePoint source or upload files linked to SharePoint to see them here.
            </Typography>
          </Box>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" className="text-white-100">
          SharePoint files
        </Typography>
        <Button 
          onClick={handleRefreshAll}
          variant="outlined"
          size="small"
          sx={{
            textTransform: "none",
            borderRadius: "9999px",
            backgroundColor: "rgba(59,130,246,0.15)",
            border: "1px solid rgba(59,130,246,0.35)",
            color: "#60a5fa",
            py: 0.25,
            px: 1.5,
            '&:hover': {
              backgroundColor: "rgba(59,130,246,0.25)",
              border: "1px solid rgba(59,130,246,0.55)",
            },
          }}
        >
          Refresh SharePoint Data
        </Button>
      </Box>
      <Paper sx={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 2, p: 3 }}>
      {(driveInfoError || fileMetadataError) && (
        <Box 
          sx={{ 
            p: 2, 
            mb: 2,
            backgroundColor: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid #ef4444',
            borderRadius: 1 
          }}
        >
          {driveInfoError && (
            <Typography variant="body2" sx={{ color: '#ef4444', mb: 1 }}>
              Drive Info Error: {driveInfoError}
            </Typography>
          )}
          {fileMetadataError && (
            <Typography variant="body2" sx={{ color: '#ef4444' }}>
              File Metadata Error: {fileMetadataError}
            </Typography>
          )}
        </Box>
      )}

      {Array.from(sharepointGroups.entries()).map(([driveId, driveFiles]) => {
        const filesCount = driveFiles.length;
        const filteredFiles = driveFiles.filter((f: any) => 
          !search || f.fileName.toLowerCase().includes(search.toLowerCase()) || (f.blobName || "").toLowerCase().includes(search.toLowerCase())
        );

        return (
          <Box key={driveId} sx={{ mb: 2 }}>
            {renderDriveHeader(driveId)}
            
            <Typography variant="caption" sx={{ color: "#bfbfbf", mb: 1, display: 'block' }}>
              {filesCount} file(s) {search && filteredFiles.length !== filesCount && `(${filteredFiles.length} shown)`}
            </Typography>
            
            <Box sx={{ 
              maxHeight: 520, 
              overflow: "auto", 
              border: "1px solid #2a2a2a", 
              borderRadius: 1,
              '&::-webkit-scrollbar': {
                height: 6,
                width: 6,
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: '#1a1a1a',
                borderRadius: 3,
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: '#4a4a4a',
                borderRadius: 3,
                '&:hover': {
                  backgroundColor: '#5a5a5a',
                },
              },
            }}>
              <Box 
                display="grid" 
                gridTemplateColumns="minmax(200px,2fr) 120px 100px 100px 140px 140px" 
                gap={2} 
                px={2} 
                py={0.75} 
                sx={{ 
                  position: "sticky", 
                  top: 0, 
                  zIndex: 1, 
                  backgroundColor: "#1a1a1a", 
                  borderBottom: "1px solid #2a2a2a" 
                }}
              >
                <Typography variant="caption" sx={{ color: "#bfbfbf" }}>Name</Typography>
                <Typography variant="caption" sx={{ color: "#bfbfbf", textAlign: "center" }}>SharePoint</Typography>
                <Typography variant="caption" sx={{ color: "#bfbfbf", textAlign: "center" }}>Item ID</Typography>
                <Typography variant="caption" sx={{ color: "#bfbfbf", textAlign: "center" }}>Size</Typography>
                <Typography variant="caption" sx={{ color: "#bfbfbf" }}>Last Modified</Typography>
                <Typography variant="caption" sx={{ color: "#bfbfbf" }}>Uploaded At</Typography>
              </Box>
              
              {filteredFiles.map((f: any) => renderFileRow(f))}
            </Box>
          </Box>
        );
      })}
      
      {metadataLoading && (
        <Box display="flex" justifyContent="center" alignItems="center" mt={2}>
          <CircularProgress size={16} sx={{ color: '#f92a4b', mr: 1 }} />
          <Typography variant="caption" sx={{ color: '#a3a3a3' }}>
            Loading SharePoint metadata...
          </Typography>
        </Box>
      )}
      </Paper>
    </Box>
  );
};

export default SharePointFilesList;