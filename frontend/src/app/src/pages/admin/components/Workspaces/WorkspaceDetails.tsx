import React, { useEffect, useState, useMemo } from "react";
import { Box, Typography, Button, IconButton, Breadcrumbs, Link, CircularProgress, Alert, Tabs, Tab } from "@mui/material";
import { TbArrowLeft, TbRefresh } from "react-icons/tb";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useWorkspaceDetails, useWorkspaceDiagnostics, useOpenAIFilesCheck } from "../../hooks/useWorkspaceQueries";
import { notificationsService } from "../../../../services/notificationsService";
import type { IntegrityRow as IntegrityRowType } from "./WorkspaceIntegrityTable";
import type { OpenAiState, OpenAiRowStatusById } from "./types";
import { formatBytes, getOpenAiChipStyles, getDbStatusChipStyles, groupSharePointFiles, buildIntegritySummary, isIndexApplicable, type IntegrityRow } from "./utils";
import WorkspaceMembersTab from "./WorkspaceMembersTab";
import WorkspaceFilesTab from "./WorkspaceFilesTab";
import WorkspaceOverviewTab from "./WorkspaceOverviewTab";

interface WorkspaceDetailsProps {
  workspaceId?: string;
  onBackToList?: () => void;
}

const WorkspaceDetails: React.FC<WorkspaceDetailsProps> = ({ 
  workspaceId: propWorkspaceId, 
  onBackToList 
}) => {
  const navigate = useNavigate();
  const { workspaceId: paramWorkspaceId } = useParams<{ workspaceId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryWorkspaceId = searchParams.get("workspaceId") || undefined;
  const workspaceId = propWorkspaceId || paramWorkspaceId || queryWorkspaceId;
  const [membersToken, setMembersToken] = useState<string | undefined>(undefined);
  const [filesToken, setFilesToken] = useState<string | undefined>(undefined);
  const [inactiveFilesToken, setInactiveFilesToken] = useState<string | undefined>(undefined);
  const { data, isLoading, isError, error, refetch } = useWorkspaceDetails(workspaceId, {
    membersPageSize: 10,
    membersContinuationToken: membersToken,
    // Switch to fetch all files; allow continuation tokens if backend supports resume
    fetchAllFiles: true,
    filesContinuationToken: filesToken,
    inactiveFilesContinuationToken: inactiveFilesToken,
    includeChatTotals: false,
  });
  // searchParams already initialized above
  const diagnostics = useWorkspaceDiagnostics(workspaceId);
  const openAiCheck = useOpenAIFilesCheck(workspaceId);
  const [showAnomaliesOnly, setShowAnomaliesOnly] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"overview" | "members" | "files" | "settings">("overview");
  // Sync active tab with URL ?tab=... for refresh and deep-linking
  useEffect(() => {
    const tabParam = (searchParams.get("tab") || "").toLowerCase();
    const validTabs = new Set(["overview", "members", "files"]);
    if (tabParam && validTabs.has(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam as typeof activeTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleTabChange = (_e: any, value: "overview" | "members" | "files" | "settings") => {
    setActiveTab(value);
    const next = new URLSearchParams(searchParams);
    next.set("tab", value);
    setSearchParams(next);
  };
  const [openAiRowStatusById, setOpenAiRowStatusById] = useState<OpenAiRowStatusById>({});
  const [search, setSearch] = useState<string>("");
  const [isMassCheckRunning, setIsMassCheckRunning] = useState<boolean>(false);

  const cancelOpenAiCheck = (fileId: string) => {
    // Mark as not pending and set state back to unknown
    setOpenAiRowStatusById(prev => ({ ...prev, [fileId]: { state: "unknown", pending: false } }));
  };

  const cancelAllOpenAiChecks = () => {
    // Clear all pending states
    setOpenAiRowStatusById(prev => {
      const newState = { ...prev };
      Object.keys(newState).forEach(key => {
        if (newState[key].pending) {
          newState[key] = { ...newState[key], pending: false };
        }
      });
      return newState;
    });
    setIsMassCheckRunning(false);
  };

  const runOpenAiCheckForFile = (fileId: string) => {
    const file = data?.files?.find(f => f.id === fileId);
    if (!file) return;
    
    setOpenAiRowStatusById(prev => ({ ...prev, [fileId]: { state: prev[fileId]?.state ?? "unknown", pending: true } }));
    openAiCheck.mutate(
      [{ fileName: file.fileName, blobName: file.blobName, externalId: file.externalId }],
      {
        onSuccess: (res: any) => {
          let newState: "present" | "missing" | "mismatched" | "noExternalId" | "unknown" | "error" = "unknown";
          const result = res?.results?.[0];
          
          if (result) {
            // Check existsAndMatches first
            if (result.existsAndMatches === true) {
              newState = "present";
            }
            // Check if missing
            else if (result.missing === true) {
              newState = "missing";
            }
            // Check reason for specific states
            else if (result.reason === "No externalId provided") {
              newState = "noExternalId";
            } else if (result.reason === "Not found in OpenAI") {
              newState = "missing";
            } else if (result.reason === "Filename mismatch") {
              newState = "mismatched";
            } else if (result.reason === "Error during OpenAI lookup") {
              newState = "error";
            }
          }
          
          setOpenAiRowStatusById(prev => ({ ...prev, [fileId]: { state: newState, pending: false } }));
        },
        onError: () => {
          setOpenAiRowStatusById(prev => ({ ...prev, [fileId]: { state: "error", pending: false } }));
        }
      }
    );
  };

  // Integrity presence sets (Phase A - client computed)
  const blobSet = useMemo(() => {
    const set = new Set<string>();
    const files = diagnostics.blobs.data?.files || [];
    for (const f of files) set.add(f);
    return set;
  }, [diagnostics.blobs.data?.files]);

  const indexSet = useMemo(() => {
    const set = new Set<string>();
    const files = diagnostics.indexFiles.data?.files || [];
    for (const f of files) set.add(f);
    return set;
  }, [diagnostics.indexFiles.data?.files]);
  const indexFilesList = useMemo(() => diagnostics.indexFiles.data?.files || [], [diagnostics.indexFiles.data?.files]);



  const sharepointGroups = useMemo(() => groupSharePointFiles(data?.files || [], data?.inactiveFiles || []), [data?.files, data?.inactiveFiles]);

  const truncateId = (id?: string) => {
    if (!id) return "—";
    return id.length > 14 ? `${id.slice(0, 6)}…${id.slice(-6)}` : id;
  };

  const copyToClipboard = (text?: string) => {
    if (!text) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        notificationsService.success("Drive ID copied");
      }).catch(() => {});
    }
  };


  const integrityRows: IntegrityRowType[] = useMemo(() => {
    const dbFiles = data?.files || [];
    const indexFileAndCount = diagnostics.indexFiles.data?.fileAndCount || [];
    const indexCounts: Record<string, number> = Object.fromEntries(
      indexFileAndCount.map((x: { fileName: string; count: number }) => [x.fileName, x.count])
    );
    const rows: IntegrityRowType[] = dbFiles.map((f) => {
      const indexApplicable = isIndexApplicable(f.fileName);
      const blobExists = f.blobName ? blobSet.has(f.blobName) : false;
      let indexExists = false;
      let indexDocCount: number | undefined = undefined;
      // Prefer blobName for index matching (index uses blob names with ticks prefix)
      if (indexApplicable && f.blobName && indexSet.has(f.blobName)) {
        indexExists = true;
        indexDocCount = indexCounts[f.blobName];
      } else if (indexApplicable && indexSet.has(f.fileName)) {
        indexExists = true;
        indexDocCount = indexCounts[f.fileName];
      } else if (indexApplicable) {
        // Fallback: endsWith match against index filenames (tick prefix case)
        const fuzzy = indexFileAndCount.find((x: { fileName?: string; count: number }) => {
          const ix = x?.fileName;
          const ff = f?.fileName;
          return typeof ix === "string" && typeof ff === "string" && ix.endsWith(ff);
        });
        if (fuzzy) {
          indexExists = true;
          indexDocCount = fuzzy.count;
        } else if (
          typeof f.fileName === "string" &&
          indexFilesList.some((name: any) => typeof name === "string" && name.endsWith(f.fileName))
        ) {
          indexExists = true;
        }
      }
      let openAiState: IntegrityRowType["openAiState"] = "unknown";
      if (!f.externalId) openAiState = "noExternalId";
      // Note: deeper OpenAI states require array payloads; placeholder for Phase A

      const anomalyTags: string[] = [];
      if (!blobExists) anomalyTags.push("db-missing-blob");
      if (indexApplicable && !indexExists && blobExists) anomalyTags.push("index-missing");
      // We cannot detect orphans (blob-only / index-only) without full DB list; Phase B server
      if (openAiState === "noExternalId") anomalyTags.push("openai-no-externalId");

      return {
        fileName: f.fileName,
        dbId: f.id,
        dbStatus: f.status,
        blobExists,
        indexExists,
        indexApplicable,
        indexDocCount,
        externalId: f.externalId,
        openAiState,
        size: f.contentLength,
        uploadedAt: f.uploadedAt,
        anomalyTags,
      };
    });
    return rows;
  }, [data?.files, blobSet, indexSet, diagnostics.indexFiles.data?.fileAndCount, indexFilesList]);

  const integritySummary = useMemo(() => {
    const dbTotalAll = typeof data?.fileCount === "number" ? data.fileCount : ((data?.files?.length ?? 0));
    const blobTotalAll = (diagnostics.blobs.data?.count ?? (diagnostics.blobs.data?.files?.length ?? 0)) as number;
    const indexTotalAll = (diagnostics.indexFiles.data?.files || []).length;
    
    return buildIntegritySummary(
      integrityRows,
      openAiRowStatusById,
      { dbTotalAll, blobTotalAll, indexTotalAll },
      (data?.inactiveFiles?.length ?? 0)
    );
  }, [integrityRows, openAiRowStatusById, data?.fileCount, data?.files?.length, data?.inactiveFiles?.length, diagnostics.blobs.data?.count, diagnostics.blobs.data?.files, diagnostics.indexFiles.data?.files]);

  const runOpenAiCheckForAllFiles = () => {
    const filesToCheck = (data?.files || [])
      .filter(f => !openAiRowStatusById[f.id]?.pending);
    
    if (filesToCheck.length === 0) return;
    
    setIsMassCheckRunning(true);
    
    // Prepare all files for single request
    const filesData = filesToCheck.map(f => ({
      fileName: f.fileName,
      blobName: f.blobName,
      externalId: f.externalId
    }));
    
    // Mark all files as pending
    filesToCheck.forEach(f => {
      setOpenAiRowStatusById(prev => ({ ...prev, [f.id]: { state: prev[f.id]?.state ?? "unknown", pending: true } }));
    });
    
    // Send single request with all files
    openAiCheck.mutate(filesData, {
      onSuccess: (res: any) => {
        const results = res?.results || [];
        const updates: Record<string, { state: OpenAiState; pending: boolean }> = {};
        
        // Process each result
        results.forEach((result: any) => {
          // Find the matching file by comparing fileName and blobName
          const matchingFile = filesToCheck.find(f => 
            f.fileName === result.fileName && 
            (f.blobName === result.blobName || (!f.blobName && !result.blobName))
          );
          
          if (matchingFile) {
            let newState: "present" | "missing" | "mismatched" | "noExternalId" | "unknown" | "error" = "unknown";
            
            // Check existsAndMatches first
            if (result.existsAndMatches === true) {
              newState = "present";
            }
            // Check if missing
            else if (result.missing === true) {
              newState = "missing";
            }
            // Check reason for specific states
            else if (result.reason === "No externalId provided") {
              newState = "noExternalId";
            } else if (result.reason === "Not found in OpenAI") {
              newState = "missing";
            } else if (result.reason === "Filename mismatch") {
              newState = "mismatched";
            } else if (result.reason === "Error during OpenAI lookup") {
              newState = "error";
            }
            
            updates[matchingFile.id] = { state: newState, pending: false };
          }
        });
        
        // Ensure all files that were checked have their pending state cleared
        filesToCheck.forEach(file => {
          if (!updates[file.id]) {
            updates[file.id] = { state: "unknown", pending: false };
          }
        });
        
        // Apply all updates at once
        setOpenAiRowStatusById(prev => ({ ...prev, ...updates }));
        setIsMassCheckRunning(false);
      },
      onError: () => {
        // Make sure ALL files get their pending state cleared
        filesToCheck.forEach(f => {
          setOpenAiRowStatusById(prev => ({ ...prev, [f.id]: { state: "error", pending: false } }));
        });
        setIsMassCheckRunning(false);
      }
    });
  };

  const runOpenAiCheckForAllUnknown = () => {
    const filesToCheck = (data?.files || []).filter(f => {
      const st = (openAiRowStatusById[f.id]?.state || "unknown") as OpenAiState;
      const pending = openAiRowStatusById[f.id]?.pending;
      return st === "unknown" && !pending;
    });
    
    if (filesToCheck.length === 0) return;
    
    setIsMassCheckRunning(true);
    
    // Prepare all files for single request
    const filesData = filesToCheck.map(f => ({
      fileName: f.fileName,
      blobName: f.blobName,
      externalId: f.externalId
    }));
    
    // Mark all files as pending
    filesToCheck.forEach(f => {
      setOpenAiRowStatusById(prev => ({ ...prev, [f.id]: { state: prev[f.id]?.state ?? "unknown", pending: true } }));
    });
    
    // Send single request with all files
    openAiCheck.mutate(filesData, {
      onSuccess: (res: any) => {
        const results = res?.results || [];
        const updates: Record<string, { state: OpenAiState; pending: boolean }> = {};
        
        // Process each result
        results.forEach((result: any) => {
          // Find the matching file by comparing fileName and blobName
          const matchingFile = filesToCheck.find(f => 
            f.fileName === result.fileName && 
            (f.blobName === result.blobName || (!f.blobName && !result.blobName))
          );
          
          if (matchingFile) {
            let newState: "present" | "missing" | "mismatched" | "noExternalId" | "unknown" | "error" = "unknown";
            
            // Check existsAndMatches first
            if (result.existsAndMatches === true) {
              newState = "present";
            }
            // Check if missing
            else if (result.missing === true) {
              newState = "missing";
            }
            // Check reason for specific states
            else if (result.reason === "No externalId provided") {
              newState = "noExternalId";
            } else if (result.reason === "Not found in OpenAI") {
              newState = "missing";
            } else if (result.reason === "Filename mismatch") {
              newState = "mismatched";
            } else if (result.reason === "Error during OpenAI lookup") {
              newState = "error";
            }
            
            updates[matchingFile.id] = { state: newState, pending: false };
          }
        });
        
        // Ensure all files that were checked have their pending state cleared
        filesToCheck.forEach(file => {
          if (!updates[file.id]) {
            updates[file.id] = { state: "unknown", pending: false };
          }
        });
        
        // Apply all updates at once
        setOpenAiRowStatusById(prev => ({ ...prev, ...updates }));
        setIsMassCheckRunning(false);
      },
      onError: () => {
        // Make sure ALL files get their pending state cleared
        filesToCheck.forEach(f => {
          setOpenAiRowStatusById(prev => ({ ...prev, [f.id]: { state: "error", pending: false } }));
        });
        setIsMassCheckRunning(false);
      }
    });
  };

  // Integrity matrix counts (partial - current DB page)
  const matrixCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of integrityRows) {
      const key = `${r.blobExists ? 1 : 0}-${r.indexExists ? 1 : 0}-${r.openAiState ?? "unknown"}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return counts;
  }, [integrityRows]);

  const matrixColumns = [
    { b: true, i: true, label: "Blob✓ Index✓" },
    { b: true, i: false, label: "Blob✓ Index✗" },
    { b: false, i: true, label: "Blob✗ Index✓" },
    { b: false, i: false, label: "Blob✗ Index✗" },
  ];

  const matrixRows: Array<IntegrityRowType["openAiState"]> = [
    "present",
    "missing",
    "noExternalId",
    "unknown",
  ];


  useEffect(() => {
    if (diagnostics.blobs.isError) {
      notificationsService.error("Failed to load blob files");
    }
  }, [diagnostics.blobs.isError]);

  useEffect(() => {
    if (diagnostics.indexFiles.isError) {
      notificationsService.error("Failed to load index files");
    }
  }, [diagnostics.indexFiles.isError]);

  useEffect(() => {
    if (openAiCheck.isSuccess) {
      const results = openAiCheck.data?.results || [];
      const matches = results.filter((r: any) => r.existsAndMatches).length;
      const missing = results.filter((r: any) => r.reason === "Not found in OpenAI").length;
      const mismatched = results.filter((r: any) => r.reason === "Filename mismatch").length;
      const noExternalId = results.filter((r: any) => r.reason === "No externalId provided").length;
      
      if (results.length > 0) {
        let message = `Checked ${results.length} file(s): ${matches} matched`;
        if (mismatched > 0) message += `, ${mismatched} mismatched`;
        if (missing > 0) message += `, ${missing} missing`;
        if (noExternalId > 0) message += `, ${noExternalId} no external ID`;
        notificationsService.success(message);
      } else {
        notificationsService.success("OpenAI file check completed");
      }
    }
  }, [openAiCheck.isSuccess, openAiCheck.data]);

  useEffect(() => {
    if (openAiCheck.isError) {
      notificationsService.error("OpenAI file check failed");
    }
  }, [openAiCheck.isError]);

  const handleBack = () => {
    if (onBackToList) {
      onBackToList();
    } else {
      const returnTo = searchParams.get("returnTo");
      if (returnTo) {
        navigate(returnTo);
        return;
      }
      const next = new URLSearchParams(searchParams);
      next.set("section", "workspaces-browse");
      next.delete("workspaceId");
      navigate(`/admin?${next.toString()}`);
    }
  };

  const handleRefresh = () => {
    setMembersToken(undefined);
    setFilesToken(undefined);
    setInactiveFilesToken(undefined);
    refetch();
    diagnostics.blobs.refetch();
    diagnostics.indexFiles.refetch();
  };

  return (
    <Box className="h-screen">
      <Box 
        sx={{
          backgroundColor: "transparent",
          minHeight: "100vh",
          px: 3,
        }}
      >
        <Box mb={3}>
          <Breadcrumbs sx={{ color: "#EDEDED" }}>
            <Link
              component="button"
              variant="body2"
              onClick={() => navigate("/admin")}
              sx={{ 
                color: "#EDEDED", 
                textDecoration: "none",
                "&:hover": { textDecoration: "underline" }
              }}
            >
              Admin
            </Link>
            <Link
              component="button"
              variant="body2"
              onClick={handleBack}
              sx={{ 
                color: "#EDEDED", 
                textDecoration: "none",
                "&:hover": { textDecoration: "underline" }
              }}
            >
              Workspaces
            </Link>
            <Typography variant="body2" sx={{ color: "#6a6a6a" }}>
              {workspaceId || "Details"}
            </Typography>
          </Breadcrumbs>
        </Box>

        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={4}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton
              onClick={handleBack}
              sx={{
                color: "#EDEDED",
                "&:hover": {
                  backgroundColor: "#262626",
                },
              }}
            >
              <TbArrowLeft size={24} />
            </IconButton>
            <Box>
              <Typography
                variant="h4"
                component="h1"
                className="font-headers text-white-100"
              >
                {data?.name || `Workspace ${workspaceId}`}
              </Typography>
              {data && (
                <Typography variant="body2" sx={{ color: "#bfbfbf" }}>
                  {(() => {
                    const membersDisplay = data.membersCount === 0 && (data.members?.length ?? 0) > 0 ? "—" : (data.membersCount ?? "—");
                    const filesDisplay = data.fileCount === 0 && (data.files?.length ?? 0) > 0 ? "—" : (data.fileCount ?? "—");
                    return `ID: ${data.id} · Members: ${membersDisplay} · Files: ${filesDisplay}`;
                  })()}
                </Typography>
              )}
            </Box>
          </Box>
          <Button
            variant="outlined"
            startIcon={<TbRefresh />}
            onClick={handleRefresh}
            sx={{
              textTransform: "none",
              borderRadius: "9999px",
              backgroundColor: "rgba(59,130,246,0.15)",
              border: "1px solid rgba(59,130,246,0.35)",
              color: "#60a5fa",
              py: 0.75,
              px: 2,
              fontSize: '0.95rem',
              '&:hover': {
                backgroundColor: "rgba(59,130,246,0.25)",
                border: "1px solid rgba(59,130,246,0.55)",
              },
            }}
          >
            Refresh
          </Button>
        </Box>

        {isLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height={240}>
            <CircularProgress sx={{ color: "#f92a4b" }} />
          </Box>
        ) : isError ? (
          <Alert severity="error">{(error as Error)?.message || "Failed to load workspace"}</Alert>
        ) : (
        <>
        <Box mb={2}>
          <Tabs value={activeTab} onChange={handleTabChange} textColor="inherit" sx={{ minHeight: 36, "& .MuiTab-root": { minHeight: 36, textTransform: "none", color: "#a3a3a3" }, "& .MuiTab-root.Mui-selected": { color: "#EDEDED" }, "& .MuiTabs-indicator": { backgroundColor: "#a3a3a3" } }}>
            <Tab value="overview" label="Overview" />
            <Tab value="members" label="Members" />
            <Tab value="files" label="Files" />
          </Tabs>
        </Box>
        <Box sx={{ display: activeTab === "overview" ? "block" : "none" }}>
          <WorkspaceOverviewTab
            workspaceName={data?.name}
            workspaceId={data?.id}
            processingStatus={data?.processingStatus}
            description={data?.description ?? undefined}
            showCitations={data?.showCitations}
            advancedFileAnalysis={data?.advancedFileAnalysis}
            systemMessageOverride={data?.systemMessageOverride}
            isConservative={data?.isConservative}
            isFileAccessRestrictedForMembers={data?.isFileAccessRestrictedForMembers}
            emailNotificationsDisabled={data?.emailNotificationsDisabled}
            createdById={data?.createdById}
            createdAt={data?.createdAt}
            updatedAt={data?.updatedAt}
            membersCount={data?.membersCount}
            membersLength={data?.members?.length}
            fileCount={data?.fileCount}
            filesLength={data?.files?.length}
            integrityRows={integrityRows as IntegrityRowType[]}
            showAnomaliesOnly={showAnomaliesOnly}
            onToggleAnomaliesOnly={() => setShowAnomaliesOnly(v => !v)}
            dbFilesCount={(data?.files || []).length}
            blobCount={diagnostics.blobs.data?.count ?? 0}
            indexFilesCount={(diagnostics.indexFiles.data?.files || []).length}
            openAiCheckedCount={Object.values(openAiRowStatusById).filter(v => v.state !== "unknown").length}
            openAiRowStatusById={openAiRowStatusById}
            onCheckFile={runOpenAiCheckForFile}
            onCancelCheck={cancelOpenAiCheck}
            blobSet={blobSet}
            indexSet={indexSet}
            files={data?.files}
            inactiveFiles={data?.inactiveFiles}
            onCheckUnknown={isMassCheckRunning ? cancelAllOpenAiChecks : runOpenAiCheckForAllUnknown}
            isMassCheckRunning={isMassCheckRunning}
          />
        </Box>

        {/* Members tab */}
        <Box sx={{ display: activeTab === "members" ? "block" : "none" }}>
          <WorkspaceMembersTab
            members={data?.members}
            hasMore={data?.membersHasMore}
            continuationToken={data?.membersContinuationToken}
            onLoadMore={(token) => setMembersToken(token)}
          />
        </Box>

        {/* Files tab */}
        <Box sx={{ display: activeTab === "files" ? "block" : "none" }}>
          <WorkspaceFilesTab
            files={data?.files}
            filesHasMore={data?.filesHasMore}
            filesContinuationToken={data?.filesContinuationToken ?? undefined}
            inactiveFiles={data?.inactiveFiles}
            inactiveFilesHasMore={data?.inactiveFilesHasMore}
            inactiveFilesContinuationToken={data?.inactiveFilesContinuationToken ?? undefined}
            blobFiles={diagnostics.blobs.data?.files}
            blobLoading={diagnostics.blobs.isLoading}
            blobError={diagnostics.blobs.isError}
            blobCount={diagnostics.blobs.data?.count}
            indexFiles={diagnostics.indexFiles.data?.files}
            indexLoading={diagnostics.indexFiles.isLoading}
            indexError={diagnostics.indexFiles.isError}
            search={search}
            onSearchChange={setSearch}
            openAiRowStatusById={openAiRowStatusById}
            openAiCheckedCount={Object.values(openAiRowStatusById).filter(v => v.state !== "unknown").length}
            onLoadMoreFiles={(token) => setFilesToken(token ?? undefined)}
            onLoadMoreInactiveFiles={(token) => setInactiveFilesToken(token ?? undefined)}
            onCheckFile={runOpenAiCheckForFile}
            onCheckAllFiles={isMassCheckRunning ? cancelAllOpenAiChecks : runOpenAiCheckForAllFiles}
            onCheckUnknown={isMassCheckRunning ? cancelAllOpenAiChecks : runOpenAiCheckForAllUnknown}
            onCancelCheck={cancelOpenAiCheck}
            isMassCheckRunning={isMassCheckRunning}
            getDbStatusChipStyles={getDbStatusChipStyles}
            getOpenAiChipStyles={getOpenAiChipStyles}
            blobSet={blobSet}
            indexSet={indexSet}
            fileCount={data?.fileCount}
            workspaceId={workspaceId!}
          />
        </Box>

        {/* Settings tab removed for now */}
        </>
        )}
      </Box>
    </Box>
  );
};

export default WorkspaceDetails;
