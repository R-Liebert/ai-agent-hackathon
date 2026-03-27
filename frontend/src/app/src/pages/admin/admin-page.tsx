import React, { useState, useCallback, useMemo } from "react";
import AppHeader from "../../components/Global/AppHeader";
import { useTranslation } from "react-i18next";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Button,
  Grid,
} from "@mui/material";
import { TbTrash, TbRefresh } from "react-icons/tb";
import { StyledPopover } from "../../components/StyledPopover";
import DropdownMenuButton from "../../components/Global/DropdownMenuButton";
import ConfirmActionDialog from "../../components/Global/ConfirmActionDialog";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useMsal } from "../../hooks/useMsalMock";
import { Config } from "../../interfaces/interfaces";
import PageTransitionContainer from "../../components/Global/PageTransitionContainer";

// Import custom components
import SubscriptionTable from "./components/SubscriptionTable";
import AdminSidebar from "./components/AdminSidebar";

// Import custom hooks
import { useSubscriptionsWithRetries } from "./hooks/useSubscriptionQueries";

// Import new components
import PendingRetriesTable from "./components/RetryManagement/PendingRetriesTable";
import OverdueAlert from "./components/RetryManagement/OverdueAlert";
import StatsOverview from "./components/Statistics/StatsOverview";
import FailureReasonChart from "./components/Statistics/FailureReasonChart";
import RetryDistribution from "./components/Statistics/RetryDistribution";
import JobControlPanel from "./components/JobControl/JobControlPanel";

// Import workspace components
import WorkspacesBrowse from "./components/Workspaces/WorkspacesBrowse";
import WorkspaceDetails from "./components/Workspaces/WorkspaceDetails";
import AdminLanding from "./components/Landing/AdminLanding";

// Import ratings components
import { RatingsBrowse } from "./components/Ratings";

// Import migrations components
import { ChatMessageVersionsMigration } from "./components/Migrations";

// Import background jobs components
import { BackgroundJobsBrowse } from "./components/BackgroundJobs";

// Import maintenance alerts components
import { MaintenanceAlertsBrowse } from "./components/MaintenanceAlerts";
import { ResearchExportsBrowse } from "./components/ResearchExports";
import { LaunchpadSettingsBrowse } from "./components/LaunchpadSettings";

// Import constants
import { SECTIONS, UI_TEXT, STYLES } from "./constants";

const AdminPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Derive activeSection from URL as single source of truth
  const activeSection = useMemo(() => {
    const section = searchParams.get("section");
    // Validate that the section exists in our SECTIONS constant
    return Object.values(SECTIONS).includes(section as string)
      ? (section as string)
      : SECTIONS.LANDING;
  }, [searchParams]);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [activeSubscriptionId, setActiveSubscriptionId] = useState<
    string | null
  >(null);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState<
    string | null
  >(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [showRenewAllDialog, setShowRenewAllDialog] = useState<boolean>(false);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(
    searchParams.get("workspaceId")
  );

  // Use new TanStack Query hooks for enhanced data management
  const {
    subscriptions: newSubscriptions,
    subscriptionsLoading: newLoading,
    subscriptionsError: newError,
    stats,
    statsLoading,
    pendingRetries,
    pendingRetriesLoading,
    dueForRetry,
    refetchSubscriptionsOnly,
    refetchRetryManagementOnly,
    refetchStatisticsOnly,
    deleteSubscription: deleteSubscriptionNew,
    renewSubscription: renewSubscriptionNew,
    clearRetryState,
    processRetries,
    triggerCleanup,
    isDeletingSubscription,
    isRenewingSubscription,
    isProcessingRetries,
    isTriggeringCleanup,
    processRetriesData,
    cleanupData,
  } = useSubscriptionsWithRetries();

  // Authorization and redirects are handled in AdminRouter

  // Memoized event handlers - URL is the single source of truth
  const handleSectionChange = useCallback(
    (section: string) => {
      // Preserve other existing query parameters
      const next = new URLSearchParams(searchParams);
      next.set("section", section);
      setSearchParams(next);
    },
    [searchParams, setSearchParams]
  );

  const handleShowOptions = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>, subscriptionId: string) => {
      event.stopPropagation();
      setAnchorEl(event.currentTarget);
      setActiveSubscriptionId(subscriptionId);
    },
    []
  );

  const handleCloseMenu = useCallback(() => {
    setAnchorEl(null);
    setActiveSubscriptionId(null);
  }, []);

  const handleDeleteClick = useCallback(() => {
    setSubscriptionToDelete(activeSubscriptionId);
    setShowDeleteDialog(true);
    setAnchorEl(null);
    setActiveSubscriptionId(null);
  }, [activeSubscriptionId]);

  const handleDeleteCancel = useCallback(() => {
    setShowDeleteDialog(false);
    setSubscriptionToDelete(null);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (subscriptionToDelete) {
      const subscription = newSubscriptions.find(
        (sub) => sub.subscriptionId === subscriptionToDelete
      );
      deleteSubscriptionNew({
        id: subscriptionToDelete,
        resource: subscription?.resource,
      });
      setShowDeleteDialog(false);
      setSubscriptionToDelete(null);
    }
  }, [subscriptionToDelete, deleteSubscriptionNew, newSubscriptions]);

  const handleRenewClick = useCallback(async () => {
    if (activeSubscriptionId) {
      const subscription = newSubscriptions.find(
        (sub) => sub.subscriptionId === activeSubscriptionId
      );
      renewSubscriptionNew({
        id: activeSubscriptionId,
        resource: subscription?.resource,
      });
    }
    handleCloseMenu();
  }, [
    activeSubscriptionId,
    renewSubscriptionNew,
    handleCloseMenu,
    newSubscriptions,
  ]);

  const handleRenewAllClick = useCallback(() => {
    setShowRenewAllDialog(true);
  }, []);

  const handleRenewAllCancel = useCallback(() => {
    setShowRenewAllDialog(false);
  }, []);

  const handleRenewAllConfirm = useCallback(async () => {
    renewSubscriptionNew({});
    setShowRenewAllDialog(false);
  }, [renewSubscriptionNew]);

  // Function to handle workspace selection
  const handleWorkspaceClick = useCallback(
    (workspaceId: string) => {
      setSelectedWorkspaceId(workspaceId);
      const next = new URLSearchParams(searchParams);
      next.set("section", SECTIONS.WORKSPACE_DETAILS);
      next.set("workspaceId", workspaceId);
      setSearchParams(next);
    },
    [setSearchParams, searchParams]
  );

  // Function to go back to workspace browse
  const handleBackToWorkspaces = useCallback(() => {
    setSelectedWorkspaceId(null);
    const next = new URLSearchParams(searchParams);
    next.set("section", SECTIONS.WORKSPACES_BROWSE);
    next.delete("workspaceId");
    setSearchParams(next);
  }, [setSearchParams, searchParams]);

  // Removed unauthorized fallback UI; AdminRouter handles redirect

  const renderContent = () => {
    switch (activeSection) {
      case SECTIONS.GRAPH_SUBSCRIPTIONS:
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
                  {t(UI_TEXT.GRAPH_SUBSCRIPTIONS)}
                </Typography>
                <Typography variant="body2" sx={{ color: "#bfbfbf" }}>
                  Manage Microsoft Graph API subscriptions and notifications
                </Typography>
              </Box>
            </Box>

            {newLoading ? (
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                height="200px"
              >
                <CircularProgress sx={{ color: "white" }} />
              </Box>
            ) : newError ? (
              <Paper className="p-4 bg-red-50 rounded-xl border-2 border-notification-error">
                <Typography color="error">{newError.message}</Typography>
              </Paper>
            ) : (
              <SubscriptionTable
                subscriptions={newSubscriptions}
                onShowOptions={handleShowOptions}
                refreshButton={
                  <Button
                    variant="outlined"
                    size="medium"
                    startIcon={<TbRefresh size={18} />}
                    onClick={refetchSubscriptionsOnly}
                    sx={{
                      textTransform: "none",
                      borderRadius: "9999px",
                      backgroundColor: "rgba(59,130,246,0.15)",
                      border: "1px solid rgba(59,130,246,0.35)",
                      color: "#60a5fa",
                      py: 1,
                      px: 3,
                      fontSize: "1rem",
                      minWidth: "auto",
                      "&:hover": {
                        backgroundColor: "rgba(59,130,246,0.25)",
                        border: "1px solid rgba(59,130,246,0.55)",
                      },
                    }}
                  >
                    Refresh
                  </Button>
                }
                renewAllButton={
                  <Button
                    variant="outlined"
                    size="medium"
                    startIcon={<TbRefresh size={18} />}
                    onClick={handleRenewAllClick}
                    disabled={
                      newLoading ||
                      newSubscriptions.length === 0 ||
                      isRenewingSubscription
                    }
                    sx={{
                      textTransform: "none",
                      borderRadius: "9999px",
                      backgroundColor: "rgba(59,130,246,0.15)",
                      border: "1px solid rgba(59,130,246,0.35)",
                      color: "#60a5fa",
                      py: 1,
                      px: 3,
                      fontSize: "1rem",
                      minWidth: "auto",
                      "&:hover": {
                        backgroundColor: "rgba(59,130,246,0.25)",
                        border: "1px solid rgba(59,130,246,0.55)",
                      },
                      "&.Mui-disabled": {
                        backgroundColor: "rgba(59,130,246,0.1)",
                        border: "1px solid rgba(59,130,246,0.25)",
                        color: "#60a5fa",
                        opacity: 0.7,
                      },
                    }}
                  >
                    {t(UI_TEXT.RENEW_ALL)}
                  </Button>
                }
              />
            )}
          </Box>
        );

      case SECTIONS.RETRY_MANAGEMENT:
        return (
          <div>
            <Box sx={{ mb: 3 }}>
              <OverdueAlert
                overdueCount={stats?.overdueRetries || 0}
                onProcessRetries={() => processRetries(undefined)}
                isProcessing={isProcessingRetries}
              />
            </Box>

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
                  {t(UI_TEXT.RETRY_MANAGEMENT)}
                </Typography>
                <Typography variant="body2" sx={{ color: "#bfbfbf" }}>
                  Manage failed subscription retries and renewal attempts
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="medium"
                startIcon={<TbRefresh size={18} />}
                onClick={refetchRetryManagementOnly}
                sx={{
                  textTransform: "none",
                  borderRadius: "9999px",
                  backgroundColor: "rgba(59,130,246,0.15)",
                  border: "1px solid rgba(59,130,246,0.35)",
                  color: "#60a5fa",
                  py: 1,
                  px: 3,
                  fontSize: "1rem",
                  minWidth: "auto",
                  "&:hover": {
                    backgroundColor: "rgba(59,130,246,0.25)",
                    border: "1px solid rgba(59,130,246,0.55)",
                  },
                }}
              >
                Refresh
              </Button>
            </Box>

            <PendingRetriesTable
              retries={pendingRetries}
              loading={pendingRetriesLoading}
              onClearRetry={(subscriptionId, resource) =>
                clearRetryState({ id: subscriptionId, resource })
              }
              onRetryNow={(subscriptionId, resource) =>
                renewSubscriptionNew({ id: subscriptionId, resource })
              }
              isDeleting={isDeletingSubscription}
              isRetrying={isRenewingSubscription}
            />
          </div>
        );

      case SECTIONS.STATISTICS:
        return (
          <div>
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
                  {t(UI_TEXT.STATISTICS)}
                </Typography>
                <Typography variant="body2" sx={{ color: "#bfbfbf" }}>
                  View subscription statistics and failure analysis
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="medium"
                startIcon={<TbRefresh size={18} />}
                onClick={refetchStatisticsOnly}
                sx={{
                  textTransform: "none",
                  borderRadius: "9999px",
                  backgroundColor: "rgba(59,130,246,0.15)",
                  border: "1px solid rgba(59,130,246,0.35)",
                  color: "#60a5fa",
                  py: 1,
                  px: 3,
                  fontSize: "1rem",
                  minWidth: "auto",
                  "&:hover": {
                    backgroundColor: "rgba(59,130,246,0.25)",
                    border: "1px solid rgba(59,130,246,0.55)",
                  },
                }}
              >
                Refresh
              </Button>
            </Box>

            <StatsOverview stats={stats} loading={statsLoading} />

            <Grid container spacing={3} sx={{ mt: 2 }}>
              <Grid item xs={12} md={6}>
                <Box sx={{ height: 400 }}>
                  <FailureReasonChart
                    failureReasons={stats?.topFailureReasons}
                    loading={statsLoading}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ height: 400 }}>
                  <RetryDistribution
                    distribution={stats?.retryCountDistribution}
                    loading={statsLoading}
                  />
                </Box>
              </Grid>
            </Grid>
          </div>
        );

      case SECTIONS.JOB_CONTROL:
        return (
          <div>
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
                  {t(UI_TEXT.JOB_CONTROL)}
                </Typography>
                <Typography variant="body2" sx={{ color: "#bfbfbf" }}>
                  Execute maintenance tasks and system operations
                </Typography>
              </Box>
            </Box>

            <JobControlPanel
              onProcessRetries={() => processRetries(undefined)}
              onCleanup={() => triggerCleanup(undefined)}
              onRenewAll={() => renewSubscriptionNew({})}
              isProcessingRetries={isProcessingRetries}
              isTriggeringCleanup={isTriggeringCleanup}
              isRenewingAll={isRenewingSubscription}
              lastProcessRetriesJob={processRetriesData}
              lastCleanupJob={cleanupData}
              pendingRetriesCount={pendingRetries.length}
              overdueRetriesCount={stats?.overdueRetries || 0}
            />
          </div>
        );

      case SECTIONS.WORKSPACES_BROWSE:
        return <WorkspacesBrowse onWorkspaceClick={handleWorkspaceClick} />;

      case SECTIONS.WORKSPACE_DETAILS:
        return (
          <WorkspaceDetails
            workspaceId={selectedWorkspaceId || undefined}
            onBackToList={handleBackToWorkspaces}
          />
        );

      case SECTIONS.LANDING:
        return <AdminLanding />;

      case SECTIONS.MESSAGE_RATINGS:
        return <RatingsBrowse />;

      case SECTIONS.MIGRATIONS:
        return <ChatMessageVersionsMigration />;

      case SECTIONS.BACKGROUND_JOBS:
        return <BackgroundJobsBrowse />;

      case SECTIONS.RESEARCH_EXPORTS:
        return <ResearchExportsBrowse />;

      case SECTIONS.MAINTENANCE_ALERTS:
        return <MaintenanceAlertsBrowse />;

      case SECTIONS.LAUNCHPAD_SETTINGS:
        return <LaunchpadSettingsBrowse />;

      default:
        return <div>Section not found</div>;
    }
  };

  return (
    <div className="h-screen">
      {/* Admin Sidebar - Full height */}
      <AdminSidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
      />

      {/* Main Content Area */}
      <Box
        sx={{
          marginLeft: "280px", // Account for fixed sidebar width
          backgroundColor: "transparent",
          minHeight: "100vh",
        }}
      >
        {/* Apply custom styling to fix the header layout issue */}
        <AppHeader
          title={t(UI_TEXT.ADMIN_DASHBOARD)}
          handleReset={() => {}}
          moduleName={t(UI_TEXT.ADMIN_DASHBOARD)}
          returnBtnText={t(UI_TEXT.RETURN_TO_HOME)}
          hideHomeBtn={true}
        />

        {/* Content Area */}
        <Box
          sx={{
            backgroundColor: "transparent",
            marginTop: "64px", // Account for the fixed header
            px: 8,
            pb: 6,
          }}
        >
          {/* Content based on active section */}
          {renderContent()}
        </Box>
      </Box>

      {/* Context Menu Popover */}
      <StyledPopover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <DropdownMenuButton
          Icon={<TbRefresh fontSize={20} strokeWidth={1.2} />}
          label={t(UI_TEXT.RENEW)}
          onClick={handleRenewClick}
          gap={2}
          disabled={isRenewingSubscription}
        />
        <DropdownMenuButton
          Icon={<TbTrash fontSize={20} strokeWidth={1.2} />}
          label={t(UI_TEXT.DELETE)}
          onClick={handleDeleteClick}
          gap={2}
          disabled={isDeletingSubscription}
        />
      </StyledPopover>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <ConfirmActionDialog
          title={t(UI_TEXT.DELETE_SUBSCRIPTION)}
          message={t(UI_TEXT.DELETE_CONFIRMATION)}
          cancelBtn={t(UI_TEXT.CANCEL)}
          confirmBtn={t(UI_TEXT.DELETE)}
          open={showDeleteDialog}
          onCancel={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          onClose={() => setShowDeleteDialog(false)}
          isLoading={isDeletingSubscription}
        />
      )}

      {/* Renew All Confirmation Dialog */}
      {showRenewAllDialog && (
        <ConfirmActionDialog
          title={t(UI_TEXT.RENEW_ALL_SUBSCRIPTIONS)}
          message={t(UI_TEXT.RENEW_ALL_CONFIRMATION)}
          cancelBtn={t(UI_TEXT.CANCEL)}
          confirmBtn={t(UI_TEXT.RENEW_ALL)}
          open={showRenewAllDialog}
          onCancel={handleRenewAllCancel}
          onConfirm={handleRenewAllConfirm}
          onClose={() => setShowRenewAllDialog(false)}
          confirmButtonColor="primary"
          isLoading={isRenewingSubscription}
        />
      )}
    </div>
  );
};

export default AdminPage;
