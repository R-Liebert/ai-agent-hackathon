import React, { useEffect, useState, useCallback, useRef } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useWorkspaceList } from "../../hooks/useWorkspaceQueries";
import { AdminWorkspaceSummaryDto, WorkspaceProcessingStatus } from "../../../../services/admin/types/adminWorkspace.types";
import WorkspaceTable from "./WorkspaceTable";
import WorkspaceFilters from "./WorkspaceFilters";

interface WorkspacesBrowseProps {
  onWorkspaceClick?: (workspaceId: string) => void;
}

const WorkspacesBrowse: React.FC<WorkspacesBrowseProps> = ({ onWorkspaceClick }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pageSize] = useState<number>(20);
  const [sortBy, setSortBy] = useState<"CreatedAt" | "UpdatedAt" | "Name" | "MembersCount" | "FileCount">("Name");
  const [sortDescending, setSortDescending] = useState<boolean>(true);
  const [forceRefresh, setForceRefresh] = useState<boolean>(false);
  const [showCitations, setShowCitations] = useState<boolean | undefined>(undefined);
  const [advancedFileAnalysis, setAdvancedFileAnalysis] = useState<boolean | undefined>(undefined);
  const [isConservative, setIsConservative] = useState<boolean | undefined>(undefined);
  const [isFileAccessRestrictedForMembers, setIsFileAccessRestrictedForMembers] = useState<boolean | undefined>(undefined);
  const [emailNotificationsDisabled, setEmailNotificationsDisabled] = useState<boolean | undefined>(undefined);
  const [createdAfter, setCreatedAfter] = useState<string | undefined>(undefined);
  const [createdBefore, setCreatedBefore] = useState<string | undefined>(undefined);
  const [processingStatus, setProcessingStatus] = useState<WorkspaceProcessingStatus[] | undefined>(undefined);
  const [continuationToken, setContinuationToken] = useState<string | undefined>(undefined);
  const [items, setItems] = useState<AdminWorkspaceSummaryDto[]>([]);

  // Initialize state from URL only once
  const initializedFromUrl = useRef(false);
  useEffect(() => {
    if (initializedFromUrl.current) return;
    initializedFromUrl.current = true;
    // Read params
    const q = searchParams;
    const qSearch = q.get("search") || "";
    const qSortBy = (q.get("sortBy") as typeof sortBy) || "Name";
    const qSortDir = q.get("sortDir");
    const qForce = q.get("forceRefresh");
    const tri = (v: string | null): boolean | undefined => (v === null ? undefined : v === "true" ? true : v === "false" ? false : undefined);
    const qShowCit = tri(q.get("showCitations"));
    const qAdv = tri(q.get("advancedFileAnalysis"));
    const qCons = tri(q.get("isConservative"));
    const qRestr = tri(q.get("isFileAccessRestrictedForMembers"));
    const qEmailDis = tri(q.get("emailNotificationsDisabled"));
    const qAfter = q.get("createdAfter") || undefined;
    const qBefore = q.get("createdBefore") || undefined;
    const qStatus = q.get("status");

    setSearch(qSearch);
    setSortBy(qSortBy);
    setSortDescending(qSortDir ? qSortDir.toLowerCase() === "desc" : true);
    setForceRefresh(qForce === "true");
    setShowCitations(qShowCit);
    setAdvancedFileAnalysis(qAdv);
    setIsConservative(qCons);
    setIsFileAccessRestrictedForMembers(qRestr);
    setEmailNotificationsDisabled(qEmailDis);
    setCreatedAfter(qAfter);
    setCreatedBefore(qBefore);
    if (qStatus) {
      const parts = qStatus.split(",").filter(Boolean) as WorkspaceProcessingStatus[];
      setProcessingStatus(parts.length > 0 ? parts : undefined);
    }
  }, [searchParams]);

  // Debounced search (300ms)
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(handle);
  }, [search]);

  // Debounced advanced filters (300ms)
  const [debouncedShowCitations, setDebouncedShowCitations] = useState<boolean | undefined>(undefined);
  const [debouncedAdvancedFileAnalysis, setDebouncedAdvancedFileAnalysis] = useState<boolean | undefined>(undefined);
  const [debouncedIsConservative, setDebouncedIsConservative] = useState<boolean | undefined>(undefined);
  const [debouncedIsFileAccessRestrictedForMembers, setDebouncedIsFileAccessRestrictedForMembers] = useState<boolean | undefined>(undefined);
  const [debouncedEmailNotificationsDisabled, setDebouncedEmailNotificationsDisabled] = useState<boolean | undefined>(undefined);
  const [debouncedCreatedAfter, setDebouncedCreatedAfter] = useState<string | undefined>(undefined);
  const [debouncedCreatedBefore, setDebouncedCreatedBefore] = useState<string | undefined>(undefined);
  const [debouncedProcessingStatus, setDebouncedProcessingStatus] = useState<WorkspaceProcessingStatus[] | undefined>(undefined);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedShowCitations(showCitations);
      setDebouncedAdvancedFileAnalysis(advancedFileAnalysis);
      setDebouncedIsConservative(isConservative);
      setDebouncedIsFileAccessRestrictedForMembers(isFileAccessRestrictedForMembers);
      setDebouncedEmailNotificationsDisabled(emailNotificationsDisabled);
      setDebouncedCreatedAfter(createdAfter);
      setDebouncedCreatedBefore(createdBefore);
      setDebouncedProcessingStatus(processingStatus);
    }, 300);
    return () => clearTimeout(handle);
  }, [showCitations, advancedFileAnalysis, isConservative, isFileAccessRestrictedForMembers, emailNotificationsDisabled, createdAfter, createdBefore, processingStatus]);

  const listQuery = useWorkspaceList({
    searchTerm: debouncedSearch || undefined,
    pageSize,
    continuationToken,
    sortBy,
    sortDescending,
    forceRefresh: forceRefresh || undefined,
    showCitations: debouncedShowCitations,
    advancedFileAnalysis: debouncedAdvancedFileAnalysis,
    isConservative: debouncedIsConservative,
    isFileAccessRestrictedForMembers: debouncedIsFileAccessRestrictedForMembers,
    emailNotificationsDisabled: debouncedEmailNotificationsDisabled,
    createdAfter: debouncedCreatedAfter,
    createdBefore: debouncedCreatedBefore,
    includeTotalCount: continuationToken ? undefined : true,
  });

  // Sync debounced filters and sort to URL
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    // Ensure section stays as-is
    if (!next.get("section")) next.set("section", "workspaces-browse");

    // Basic
    if (debouncedSearch) next.set("search", debouncedSearch); else next.delete("search");
    next.set("sortBy", sortBy);
    next.set("sortDir", sortDescending ? "desc" : "asc");
    if (forceRefresh) next.set("forceRefresh", "true"); else next.delete("forceRefresh");

    // Tri-state filters
    const setTri = (key: string, v: boolean | undefined) => {
      if (v === undefined) next.delete(key); else next.set(key, v ? "true" : "false");
    };
    setTri("showCitations", debouncedShowCitations);
    setTri("advancedFileAnalysis", debouncedAdvancedFileAnalysis);
    setTri("isConservative", debouncedIsConservative);
    setTri("isFileAccessRestrictedForMembers", debouncedIsFileAccessRestrictedForMembers);
    setTri("emailNotificationsDisabled", debouncedEmailNotificationsDisabled);

    // Dates
    if (debouncedCreatedAfter) next.set("createdAfter", debouncedCreatedAfter); else next.delete("createdAfter");
    if (debouncedCreatedBefore) next.set("createdBefore", debouncedCreatedBefore); else next.delete("createdBefore");

    // Status array
    if (debouncedProcessingStatus && debouncedProcessingStatus.length > 0) {
      next.set("status", debouncedProcessingStatus.join(","));
    } else {
      next.delete("status");
    }

    // Remove pagination token when filters change
    next.delete("continuationToken");

    setSearchParams(next, { replace: true });
  }, [
    debouncedSearch,
    sortBy,
    sortDescending,
    forceRefresh,
    debouncedShowCitations,
    debouncedAdvancedFileAnalysis,
    debouncedIsConservative,
    debouncedIsFileAccessRestrictedForMembers,
    debouncedEmailNotificationsDisabled,
    debouncedCreatedAfter,
    debouncedCreatedBefore,
    debouncedProcessingStatus,
    searchParams,
    setSearchParams,
  ]);

  useEffect(() => {
    setContinuationToken(undefined);
    setItems([]);
  }, [debouncedSearch, sortBy, sortDescending, debouncedShowCitations, debouncedAdvancedFileAnalysis, debouncedIsConservative, debouncedIsFileAccessRestrictedForMembers, debouncedEmailNotificationsDisabled, debouncedCreatedAfter, debouncedCreatedBefore, debouncedProcessingStatus]);

  useEffect(() => {
    if (!listQuery.data) return;
    
    let workspaces: AdminWorkspaceSummaryDto[] = listQuery.data.workspaces as AdminWorkspaceSummaryDto[];
    
    // Apply client-side status filtering
    if (debouncedProcessingStatus && debouncedProcessingStatus.length > 0) {
      workspaces = workspaces.filter((w: AdminWorkspaceSummaryDto) => debouncedProcessingStatus.includes(w.processingStatus));
    }
    
    if (!continuationToken) {
      setItems(workspaces);
    } else {
      setItems((prev: AdminWorkspaceSummaryDto[]) => {
        const existingIds = new Set(prev.map((item: AdminWorkspaceSummaryDto) => item.id));
        const newItems = workspaces.filter(
          (item: AdminWorkspaceSummaryDto) => !existingIds.has(item.id)
        );
        return [...prev, ...newItems];
      });
    }
  }, [listQuery.data, continuationToken, debouncedProcessingStatus]);

  const handleWorkspaceClick = useCallback((workspaceId: string) => {
    if (onWorkspaceClick) {
      onWorkspaceClick(workspaceId);
    } else {
      const returnTo = `/admin?${searchParams.toString() || "section=workspaces-browse"}`;
      navigate(`/admin/workspace/${workspaceId}?returnTo=${encodeURIComponent(returnTo)}`);
    }
  }, [onWorkspaceClick, navigate, searchParams]);

  const handleRefresh = useCallback(() => {
    setContinuationToken(undefined);
    setItems([]);
    listQuery.refetch();
  }, [listQuery]);

  const handleLoadMore = useCallback(() => {
    if (listQuery.data?.continuationToken) {
      setContinuationToken(listQuery.data.continuationToken);
    }
  }, [listQuery.data]);

  const handleSortChange = useCallback((field: "CreatedAt" | "UpdatedAt" | "Name" | "MembersCount" | "FileCount", descending: boolean) => {
    setSortBy(field);
    setSortDescending(descending);
  }, []);

  return (
    <Box 
      sx={{
        backgroundColor: "transparent",
        px: 3,
      }}
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            className="font-headers text-white-100"
            sx={{ mb: 0.5 }}
          >
            Browse Workspaces
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ color: "#bfbfbf" }}
          >
            Manage and view all workspaces in the system
          </Typography>
        </Box>
      </Box>

      <WorkspaceFilters
        searchTerm={search}
        onSearchChange={setSearch}
        forceRefresh={forceRefresh}
        onForceRefreshChange={setForceRefresh}
        showCitations={showCitations}
        onShowCitationsChange={setShowCitations}
        advancedFileAnalysis={advancedFileAnalysis}
        onAdvancedFileAnalysisChange={setAdvancedFileAnalysis}
        isConservative={isConservative}
        onIsConservativeChange={setIsConservative}
        isFileAccessRestrictedForMembers={isFileAccessRestrictedForMembers}
        onIsFileAccessRestrictedForMembersChange={setIsFileAccessRestrictedForMembers}
        emailNotificationsDisabled={emailNotificationsDisabled}
        onEmailNotificationsDisabledChange={setEmailNotificationsDisabled}
        createdAfter={createdAfter}
        onCreatedAfterChange={setCreatedAfter}
        createdBefore={createdBefore}
        onCreatedBeforeChange={setCreatedBefore}
        processingStatus={processingStatus}
        onProcessingStatusChange={setProcessingStatus}
        onRefresh={handleRefresh}
      />

      {listQuery.isLoading && !continuationToken ? (
        <Box display="flex" justifyContent="center" alignItems="center" height={400}>
          <CircularProgress sx={{ color: "#f92a4b" }} />
        </Box>
      ) : listQuery.isError ? (
        <Box 
          sx={{ 
            p: 3, 
            backgroundColor: "rgba(239, 68, 68, 0.1)", 
            border: "1px solid #ef4444",
            borderRadius: 2,
          }}
        >
          <Typography sx={{ color: "#ef4444" }}>
            {listQuery.error?.message || "Failed to load workspaces"}
          </Typography>
        </Box>
      ) : (
        <Box>
          <WorkspaceTable
            workspaces={items}
            onWorkspaceClick={handleWorkspaceClick}
            isLoading={listQuery.isLoading || listQuery.isFetching}
            onLoadMore={handleLoadMore}
            hasMore={listQuery.data?.hasMore ?? false}
            totalCount={!continuationToken ? listQuery.data?.totalCount : undefined}
            sortBy={sortBy}
            sortDescending={sortDescending}
            onSortChange={handleSortChange}
          />
        </Box>
      )}
    </Box>
  );
};

export default WorkspacesBrowse;