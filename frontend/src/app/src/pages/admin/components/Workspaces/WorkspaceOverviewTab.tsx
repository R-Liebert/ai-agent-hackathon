import React, { useMemo } from "react";
import { Box, Grid } from "@mui/material";
import WorkspaceInformation from "./WorkspaceInformation";
import WorkspaceConfiguration from "./WorkspaceConfiguration";
import WorkspaceIntegrityTable from "./WorkspaceIntegrityTable";
import WorkspaceStatistics from "./WorkspaceStatistics";
import IntegritySummary from "./IntegritySummary";
import type { IntegrityRow as IntegrityRowType } from "./WorkspaceIntegrityTable";
import type { OpenAiRowStatusById, OpenAiState } from "./types";
import { WorkspaceFileDto } from "../../../../services/admin/types/adminWorkspace.types";
import { buildIntegritySummary, isIndexApplicable } from "./utils";

type WorkspaceOverviewTabProps = {
  // Workspace basic info
  workspaceName?: string;
  workspaceId?: string;
  processingStatus?: string;
  description?: string;
  
  // Workspace configuration
  showCitations?: boolean;
  advancedFileAnalysis?: boolean;
  systemMessageOverride?: boolean;
  isConservative?: boolean | null;
  isFileAccessRestrictedForMembers?: boolean;
  emailNotificationsDisabled?: boolean;
  createdById?: string;
  createdAt?: string;
  updatedAt?: string;
  
  // Statistics
  membersCount?: number;
  membersLength?: number;
  fileCount?: number;
  filesLength?: number;
  
  // Integrity data
  integrityRows: IntegrityRowType[];
  showAnomaliesOnly: boolean;
  onToggleAnomaliesOnly: () => void;
  dbFilesCount: number;
  blobCount: number;
  indexFilesCount: number;
  openAiCheckedCount: number;
  openAiRowStatusById: OpenAiRowStatusById;
  onCheckFile: (fileId: string) => void;
  onCancelCheck?: (fileId: string) => void;
  
  // Integrity Summary data
  blobSet: Set<string>;
  indexSet: Set<string>;
  files?: WorkspaceFileDto[];
  inactiveFiles?: WorkspaceFileDto[];
  onCheckUnknown: () => void;
  isMassCheckRunning?: boolean;
};

const WorkspaceOverviewTab: React.FC<WorkspaceOverviewTabProps> = ({
  workspaceName,
  workspaceId,
  processingStatus,
  description,
  showCitations,
  advancedFileAnalysis,
  systemMessageOverride,
  isConservative,
  isFileAccessRestrictedForMembers,
  emailNotificationsDisabled,
  createdById,
  createdAt,
  updatedAt,
  membersCount,
  membersLength,
  fileCount,
  filesLength,
  integrityRows,
  showAnomaliesOnly,
  onToggleAnomaliesOnly,
  dbFilesCount,
  blobCount,
  indexFilesCount,
  openAiCheckedCount,
  openAiRowStatusById,
  onCheckFile,
  onCancelCheck,
  blobSet,
  indexSet,
  files,
  inactiveFiles,
  onCheckUnknown,
  isMassCheckRunning,
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
      blobTotalAll: blobCount || (files?.length ?? 0),
      indexTotalAll: indexFilesCount,
    };
    
    return buildIntegritySummary(
      integrityRows,
      openAiRowStatusById,
      totals,
      (inactiveFiles || []).length
    );
  }, [files, fileCount, blobCount, indexFilesCount, inactiveFiles, blobSet, indexSet, openAiRowStatusById]);

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <WorkspaceInformation
            name={workspaceName}
            id={workspaceId}
            processingStatus={processingStatus}
            description={description ?? undefined}
          />

          <WorkspaceConfiguration
            showCitations={showCitations}
            advancedFileAnalysis={advancedFileAnalysis}
            systemMessageOverride={systemMessageOverride}
            isConservative={isConservative ?? undefined}
            isFileAccessRestrictedForMembers={isFileAccessRestrictedForMembers}
            emailNotificationsDisabled={emailNotificationsDisabled}
            createdById={createdById}
            createdAt={createdAt}
            updatedAt={updatedAt}
          />

          <WorkspaceIntegrityTable
            rows={integrityRows}
            showAnomaliesOnly={showAnomaliesOnly}
            onToggleAnomaliesOnly={onToggleAnomaliesOnly}
            dbFilesCount={dbFilesCount}
            blobCount={blobCount}
            indexFilesCount={indexFilesCount}
            openAiCheckedCount={openAiCheckedCount}
            openAiRowStatusById={openAiRowStatusById}
            onCheckFile={onCheckFile}
            onCancelCheck={onCancelCheck}
            isMassCheckRunning={isMassCheckRunning}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <WorkspaceStatistics
            membersCount={membersCount}
            membersLength={membersLength}
            fileCount={fileCount}
            filesLength={filesLength}
          />
          
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

export default WorkspaceOverviewTab;
