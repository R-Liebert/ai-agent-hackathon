import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
  Box,
  Divider,
} from "@mui/material";
import {
  TbSettings,
  TbRefresh,
  TbTrash,
  TbPlayerPlay,
  TbTrashX,
} from "react-icons/tb";
import JobButton from "./JobButton";
import JobStatusIndicator from "./JobStatusIndicator";
import { JobResponse } from "../../../../models/subscription-models";

interface JobControlPanelProps {
  onProcessRetries?: () => void;
  onCleanup?: () => void;
  onRenewAll?: () => void;
  isProcessingRetries?: boolean;
  isTriggeringCleanup?: boolean;
  isRenewingAll?: boolean;
  lastProcessRetriesJob?: JobResponse;
  lastCleanupJob?: JobResponse;
  pendingRetriesCount?: number;
  overdueRetriesCount?: number;
}

const JobControlPanel: React.FC<JobControlPanelProps> = ({
  onProcessRetries,
  onCleanup,
  onRenewAll,
  isProcessingRetries,
  isTriggeringCleanup,
  isRenewingAll,
  lastProcessRetriesJob,
  lastCleanupJob,
  pendingRetriesCount = 0,
  overdueRetriesCount = 0,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <Card 
      className="!bg-transparent !border-2 !border-gray-500 !shadow-none"
      sx={{ backgroundImage: "none" }}
    >
      <CardHeader
        title={
          <Box display="flex" alignItems="center" gap={1}>
            <TbSettings className="text-white-100" />
            <Typography variant="h6" className="!text-white-100 !font-headers">Job Control Panel</Typography>
          </Box>
        }
        subheader={
          <Typography variant="body2" className="!text-gray-300 !font-body">
            Manage subscription maintenance jobs
          </Typography>
        }
      />
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <JobButton
              title="Process Pending Retries"
              description={`Process ${pendingRetriesCount} pending retries${
                overdueRetriesCount > 0 ? ` (${overdueRetriesCount} overdue)` : ""
              }`}
              icon={<TbPlayerPlay />}
              onClick={onProcessRetries}
              disabled={!onProcessRetries || pendingRetriesCount === 0}
              loading={isProcessingRetries}
              color="primary"
            />
            {lastProcessRetriesJob && (
              <JobStatusIndicator
                job={lastProcessRetriesJob}
                label="Last retry job"
              />
            )}
          </Grid>

          <Grid item xs={12} md={6}>
            <JobButton
              title="Renew All Subscriptions"
              description="Renew all active Graph subscriptions"
              icon={<TbRefresh />}
              onClick={onRenewAll}
              disabled={!onRenewAll}
              loading={isRenewingAll}
              color="success"
            />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1, borderColor: "#3A3A3D" }}>
              <Typography variant="caption" className="!text-gray-300 !font-body">
                Maintenance Operations
              </Typography>
            </Divider>
          </Grid>

          <Grid item xs={12} md={6}>
            <JobButton
              title="Run Cleanup"
              description="Remove expired and inactive subscriptions"
              icon={<TbTrashX />}
              onClick={onCleanup}
              disabled={!onCleanup}
              loading={isTriggeringCleanup}
              color="warning"
              requiresConfirmation
              confirmationMessage="This will permanently delete expired subscriptions. Are you sure?"
            />
            {lastCleanupJob && (
              <JobStatusIndicator job={lastCleanupJob} label="Last cleanup job" />
            )}
          </Grid>
        </Grid>

        <Box mt={3}>
          <Typography variant="caption" className="!text-gray-300 !font-body">
            Note: All jobs run asynchronously in the background. Check the status
            indicators for job progress.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default JobControlPanel;