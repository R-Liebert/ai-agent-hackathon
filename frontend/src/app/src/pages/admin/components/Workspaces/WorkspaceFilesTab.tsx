import React, { useMemo } from "react";
import { Box, Typography, Paper, Grid } from "@mui/material";
import WorkspaceFilesLists from "./WorkspaceFilesLists";
import OpenAiFileCheck from "./OpenAiFileCheck";
import { SharePointFilesList } from "./SharePointMetadata";
import InactiveFilesList from "./InactiveFilesList";
import IntegritySummary from "./IntegritySummary";
import { WorkspaceFileDto } from "../../../../services/admin/types/adminWorkspace.types";
import type { OpenAiRowStatusById, OpenAiChipStyle, DbStatusChipStyle, OpenAiState } from "./types";
import { buildIntegritySummary, isIndexApplicable } from "./utils";

type WorkspaceFilesTabProps = {
  // Files data
  files?: WorkspaceFileDto[];
  filesHasMore?: boolean;
  filesContinuationToken?: string;
  inactiveFiles?: WorkspaceFileDto[];
  inactiveFilesHasMore?: boolean;
  inactiveFilesContinuationToken?: string;
  
  // Diagnostics data
  blobFiles?: string[];
  blobLoading?: boolean;
  blobError?: boolean;
  blobCount?: number;
  indexFiles?: string[];
  indexLoading?: boolean;
  indexError?: boolean;
  
  // Search and filtering
  search: string;
  onSearchChange: (value: string) => void;
  
  // OpenAI check data
  openAiRowStatusById: OpenAiRowStatusById;
  openAiCheckedCount?: number;
  
  // Callbacks
  onLoadMoreFiles: (token?: string) => void;
  onLoadMoreInactiveFiles: (token?: string) => void;
  onCheckFile: (fileId: string) => void;
  onCheckAllFiles: () => void;
  onCheckUnknown: () => void;
  onCancelCheck?: (fileId: string) => void;
  isMassCheckRunning?: boolean;
  
  // Helper functions
  getDbStatusChipStyles: (status?: string) => DbStatusChipStyle;
  getOpenAiChipStyles: (state: OpenAiState) => OpenAiChipStyle;
  
  // Integrity data
  blobSet: Set<string>;
  indexSet: Set<string>;
  fileCount?: number;
  
  // Workspace ID for SharePoint
  workspaceId: string;
};

const WorkspaceFilesTab: React.FC<WorkspaceFilesTabProps> = ({
  files,
  filesHasMore,
  filesContinuationToken,
  inactiveFiles,
  inactiveFilesHasMore,
  inactiveFilesContinuationToken,
  blobFiles,
  blobLoading,
  blobError,
  blobCount,
  indexFiles,
  indexLoading,
  indexError,
  search,
  onSearchChange,
  openAiRowStatusById,
  openAiCheckedCount,
  onLoadMoreFiles,
  onLoadMoreInactiveFiles,
  onCheckFile,
  onCheckAllFiles,
  onCheckUnknown,
  onCancelCheck,
  isMassCheckRunning,
  getDbStatusChipStyles,
  getOpenAiChipStyles,
  blobSet,
  indexSet,
  fileCount,
  workspaceId,
}) => {
  const integritySummary = useMemo(() => {
    const integrityRows = (files || []).map(f => ({
      fileName: f.fileName,
      dbId: f.id,
      blobExists: Boolean(f.blobName && blobSet.has(f.blobName)),
      indexExists: Boolean(f.blobName && indexSet.has(f.blobName)) || Boolean(indexSet.has(f.fileName)),
      indexApplicable: isIndexApplicable(f.fileName),
      openAiState: (openAiRowStatusById[f.id]?.state || "unknown") as OpenAiState
    }));
    
    const totals = {
      dbTotalAll: typeof fileCount === "number" ? fileCount : (files?.length ?? 0),
      blobTotalAll: (blobCount ?? (blobFiles?.length ?? 0)) as number,
      indexTotalAll: (indexFiles || []).length,
    };
    
    return buildIntegritySummary(
      integrityRows,
      openAiRowStatusById,
      totals,
      (inactiveFiles || []).length
    );
  }, [files, fileCount, blobCount, blobFiles, indexFiles, inactiveFiles, blobSet, indexSet, openAiRowStatusById]);

  return (
    <Box>
      <Typography variant="h6" className="text-white-100" sx={{ mb: 2 }}>
        Files
      </Typography>
      
      {/* Files lists at the top */}
      <Paper sx={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 2, p: 3, mb: 3 }}>
        <WorkspaceFilesLists
          dbFiles={files || []}
          dbHasMore={filesHasMore}
          onLoadMoreDb={() => onLoadMoreFiles(filesContinuationToken)}
          blobFiles={blobFiles || []}
          blobLoading={blobLoading}
          blobError={blobError}
          indexFiles={indexFiles || []}
          indexLoading={indexLoading}
          indexError={indexError}
          search={search}
          onSearchChange={onSearchChange}
          getDbStatusChipStyles={getDbStatusChipStyles}
          workspaceId={workspaceId}
        />
      </Paper>
      
      {/* Two column layout below */}
      <Grid container spacing={3}>
        {/* Left column */}
        <Grid item xs={12} md={6}>
          {/* OpenAI File Check */}
          <Box sx={{ mb: 3 }}>
            <OpenAiFileCheck
              files={(files || []).map(f => ({ 
                id: f.id, 
                fileName: f.fileName, 
                blobName: f.blobName 
              }))}
              search={search}
              rowStateById={openAiRowStatusById}
              getOpenAiChipStyles={getOpenAiChipStyles}
              onCheckFile={onCheckFile}
              onCheckAll={onCheckAllFiles}
              onCancelCheck={onCancelCheck}
              isMassCheckRunning={isMassCheckRunning}
            />
          </Box>
          
          {/* SharePoint Files */}
          <Box sx={{ mb: 3 }}>
            <SharePointFilesList 
              files={files || []}
              inactiveFiles={inactiveFiles || []}
              search={search}
              workspaceId={workspaceId}
            />
          </Box>
          
          {/* Inactive Files */}
          <Box>
            <Typography variant="h6" className="text-white-100" sx={{ mb: 2 }}>
              Inactive files
            </Typography>
            <InactiveFilesList
              files={inactiveFiles || []}
              search={search}
              hasMore={inactiveFilesHasMore}
              onLoadMore={() => onLoadMoreInactiveFiles(inactiveFilesContinuationToken)}
            />
          </Box>
        </Grid>
        
        {/* Right column */}
        <Grid item xs={12} md={6}>
          <IntegritySummary
            title="Integrity Summary"
            summary={integritySummary}
            onCheckUnknown={onCheckUnknown}
            isMassCheckRunning={isMassCheckRunning}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default WorkspaceFilesTab;