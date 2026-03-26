import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Box,
  Typography,
  CircularProgress,
} from "@mui/material";
import { useSearchParams } from "react-router-dom";
import {
  useRatingsList,
  useRatingDetails,
  useExportRatings,
} from "../../hooks/useRatingsQueries";
import {
  AdminRatingSummaryDto,
  GetAllRatingsRequest,
} from "../../../../services/admin/types/adminRatings.types";
import { UserRating } from "../../../../models/message-rating.types";
import RatingsTable from "./RatingsTable";
import RatingsFilters from "./RatingsFilters";
import RatingDetailModal from "./RatingDetailModal";
import ExportRatingsPanel, { ExportParams } from "./ExportRatingsPanel";
import { UI_TEXT } from "../../constants";

const RatingsBrowse: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [pageSize] = useState<number>(20);
  const [sortBy, setSortBy] = useState<"CreatedAt" | "UserRating">("CreatedAt");
  const [sortDescending, setSortDescending] = useState<boolean>(true);
  const [createdAfter, setCreatedAfter] = useState<string | undefined>(undefined);
  const [createdBefore, setCreatedBefore] = useState<string | undefined>(undefined);
  const [ratingType, setRatingType] = useState<UserRating | undefined>(undefined);
  const [consent, setConsent] = useState<boolean | undefined>(undefined);
  const [generatedByAgent, setGeneratedByAgent] = useState<boolean | undefined>(undefined);
  const [agentName, setAgentName] = useState<string | undefined>(undefined);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [continuationToken, setContinuationToken] = useState<string | undefined>(undefined);
  const [items, setItems] = useState<AdminRatingSummaryDto[]>([]);

  // Detail modal state
  const [selectedRatingId, setSelectedRatingId] = useState<string | undefined>(undefined);
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Initialize state from URL only once
  const initializedFromUrl = useRef(false);
  useEffect(() => {
    if (initializedFromUrl.current) return;
    initializedFromUrl.current = true;

    const q = searchParams;
    const qSortBy = (q.get("sortBy") as typeof sortBy) || "CreatedAt";
    const qSortDir = q.get("sortDir");
    const qAfter = q.get("createdAfter") || undefined;
    const qBefore = q.get("createdBefore") || undefined;
    const qRatingType = q.get("ratingType");
    const qConsent = q.get("consent");
    const qAgent = q.get("generatedByAgent");
    const qAgentName = q.get("agentName")?.trim() || undefined;
    const qUserId = q.get("userId") || undefined;

    setSortBy(qSortBy);
    setSortDescending(qSortDir ? qSortDir.toLowerCase() === "desc" : true);
    setCreatedAfter(qAfter);
    setCreatedBefore(qBefore);
    if (qRatingType) setRatingType(Number(qRatingType) as UserRating);
    if (qConsent !== null) setConsent(qConsent === "true");
    if (qAgent !== null) setGeneratedByAgent(qAgent === "true");
    setAgentName(qAgentName);
    setUserId(qUserId);
  }, [searchParams]);

  // Debounced filters
  const [debouncedCreatedAfter, setDebouncedCreatedAfter] = useState<string | undefined>(undefined);
  const [debouncedCreatedBefore, setDebouncedCreatedBefore] = useState<string | undefined>(undefined);
  const [debouncedRatingType, setDebouncedRatingType] = useState<UserRating | undefined>(undefined);
  const [debouncedConsent, setDebouncedConsent] = useState<boolean | undefined>(undefined);
  const [debouncedGeneratedByAgent, setDebouncedGeneratedByAgent] = useState<boolean | undefined>(undefined);
  const [debouncedAgentName, setDebouncedAgentName] = useState<string | undefined>(undefined);
  const [debouncedUserId, setDebouncedUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedCreatedAfter(createdAfter);
      setDebouncedCreatedBefore(createdBefore);
      setDebouncedRatingType(ratingType);
      setDebouncedConsent(consent);
      setDebouncedGeneratedByAgent(generatedByAgent);
      setDebouncedAgentName(agentName);
      setDebouncedUserId(userId);
    }, 300);
    return () => clearTimeout(handle);
  }, [createdAfter, createdBefore, ratingType, consent, generatedByAgent, agentName, userId]);

  // Build query params
  const queryParams: GetAllRatingsRequest = {
    pageSize,
    continuationToken,
    sortBy,
    sortDescending,
    createdAfter: debouncedCreatedAfter,
    createdBefore: debouncedCreatedBefore,
    ratingType: debouncedRatingType,
    consent: debouncedConsent,
    generatedByAgent: debouncedGeneratedByAgent,
    agentName: debouncedAgentName,
    userId: debouncedUserId,
  };

  const listQuery = useRatingsList(queryParams);
  const detailQuery = useRatingDetails(selectedRatingId, selectedUserId);
  const exportMutation = useExportRatings();

  // Sync debounced filters to URL
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (!next.get("section")) next.set("section", "message-ratings");

    next.set("sortBy", sortBy);
    next.set("sortDir", sortDescending ? "desc" : "asc");

    if (debouncedCreatedAfter) next.set("createdAfter", debouncedCreatedAfter);
    else next.delete("createdAfter");
    if (debouncedCreatedBefore) next.set("createdBefore", debouncedCreatedBefore);
    else next.delete("createdBefore");
    if (debouncedRatingType !== undefined) next.set("ratingType", String(debouncedRatingType));
    else next.delete("ratingType");
    if (debouncedConsent !== undefined) next.set("consent", String(debouncedConsent));
    else next.delete("consent");
    if (debouncedGeneratedByAgent !== undefined) next.set("generatedByAgent", String(debouncedGeneratedByAgent));
    else next.delete("generatedByAgent");
    if (debouncedAgentName) next.set("agentName", debouncedAgentName);
    else next.delete("agentName");
    if (debouncedUserId) next.set("userId", debouncedUserId);
    else next.delete("userId");

    next.delete("continuationToken");
    setSearchParams(next, { replace: true });
  }, [
    sortBy,
    sortDescending,
    debouncedCreatedAfter,
    debouncedCreatedBefore,
    debouncedRatingType,
    debouncedConsent,
    debouncedGeneratedByAgent,
    debouncedAgentName,
    debouncedUserId,
    searchParams,
    setSearchParams,
  ]);

  // Reset items when filters change
  useEffect(() => {
    setContinuationToken(undefined);
    setItems([]);
  }, [
    sortBy,
    sortDescending,
    debouncedCreatedAfter,
    debouncedCreatedBefore,
    debouncedRatingType,
    debouncedConsent,
    debouncedGeneratedByAgent,
    debouncedAgentName,
    debouncedUserId,
  ]);

  // Accumulate items on pagination
  useEffect(() => {
    if (!listQuery.data) return;

    const ratings = listQuery.data.ratings;
    if (!continuationToken) {
      setItems(ratings);
    } else {
      setItems((prev) => {
        const existingIds = new Set(prev.map((item) => item.id));
        const newItems = ratings.filter((item) => !existingIds.has(item.id));
        return [...prev, ...newItems];
      });
    }
  }, [listQuery.data, continuationToken]);

  const handleRatingClick = useCallback((id: string, userId: string) => {
    setSelectedRatingId(id);
    setSelectedUserId(userId);
    setDetailModalOpen(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setDetailModalOpen(false);
    setSelectedRatingId(undefined);
    setSelectedUserId(undefined);
  }, []);

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

  const handleSortChange = useCallback(
    (field: "CreatedAt" | "UserRating", descending: boolean) => {
      setSortBy(field);
      setSortDescending(descending);
    },
    []
  );

  const handleExport = useCallback(
    (params: ExportParams) => {
      exportMutation.mutate({
        format: params.format,
        sortBy,
        sortDescending,
        createdAfter: params.startDate,
        createdBefore: params.endDate,
        includeContent: params.includeContent,
      });
    },
    [exportMutation, sortBy, sortDescending]
  );

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
            {UI_TEXT.MESSAGE_RATINGS}
          </Typography>
          <Typography variant="body2" sx={{ color: "#bfbfbf" }}>
            View and analyze user feedback on chat messages
          </Typography>
        </Box>
      </Box>

      <ExportRatingsPanel
        onExport={handleExport}
        isExporting={exportMutation.isPending}
      />

      <RatingsFilters
        createdAfter={createdAfter}
        onCreatedAfterChange={setCreatedAfter}
        createdBefore={createdBefore}
        onCreatedBeforeChange={setCreatedBefore}
        ratingType={ratingType}
        onRatingTypeChange={setRatingType}
        consent={consent}
        onConsentChange={setConsent}
        generatedByAgent={generatedByAgent}
        onGeneratedByAgentChange={setGeneratedByAgent}
        agentName={agentName}
        onAgentNameChange={setAgentName}
        userId={userId}
        onUserIdChange={setUserId}
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
            {listQuery.error?.message || "Failed to load ratings"}
          </Typography>
        </Box>
      ) : (
        <RatingsTable
          ratings={items}
          onRatingClick={handleRatingClick}
          isLoading={listQuery.isLoading || listQuery.isFetching}
          onLoadMore={handleLoadMore}
          hasMore={listQuery.data?.hasMore ?? false}
          totalCount={!continuationToken ? listQuery.data?.totalCount : undefined}
          sortBy={sortBy}
          sortDescending={sortDescending}
          onSortChange={handleSortChange}
        />
      )}

      <RatingDetailModal
        open={detailModalOpen}
        onClose={handleCloseDetail}
        rating={detailQuery.data ?? null}
        isLoading={detailQuery.isLoading}
        error={detailQuery.error}
      />
    </Box>
  );
};

export default RatingsBrowse;
