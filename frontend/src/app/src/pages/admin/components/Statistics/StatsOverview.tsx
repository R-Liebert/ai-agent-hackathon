import React from "react";
import { Grid } from "@mui/material";
import {
  TbGraph,
  TbClock,
  TbAlertTriangle,
  TbRefresh,
  TbChartBar,
  TbActivity,
} from "react-icons/tb";
import { RetryStatistics } from "../../../../models/subscription-models";
import RetryStatCard from "../RetryManagement/RetryStatCard";

interface StatsOverviewProps {
  stats: RetryStatistics | undefined;
  loading?: boolean;
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ stats, loading }) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <RetryStatCard
          title="Total with Retry State"
          value={stats?.totalSubscriptionsWithRetryState ?? "-"}
          icon={<TbGraph size={24} />}
          color="primary"
          loading={loading}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <RetryStatCard
          title="Pending Retries"
          value={stats?.pendingRetries ?? "-"}
          icon={<TbClock size={24} />}
          color="warning"
          loading={loading}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <RetryStatCard
          title="Overdue Retries"
          value={stats?.overdueRetries ?? "-"}
          icon={<TbAlertTriangle size={24} />}
          color="error"
          loading={loading}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <RetryStatCard
          title="Next 30 Minutes"
          value={stats?.retriesScheduledNext30Min ?? "-"}
          icon={<TbRefresh size={24} />}
          color="info"
          subtitle="Scheduled retries"
          loading={loading}
        />
      </Grid>
    </Grid>
  );
};

export default StatsOverview;