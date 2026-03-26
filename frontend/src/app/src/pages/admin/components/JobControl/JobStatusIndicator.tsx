import React from "react";
import { Box, Typography, Chip } from "@mui/material";
import { JobResponse } from "../../../../models/subscription-models";
import { format } from "date-fns";

interface JobStatusIndicatorProps {
  job: JobResponse;
  label?: string;
}

const JobStatusIndicator: React.FC<JobStatusIndicatorProps> = ({
  job,
  label = "Job status",
}) => {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "failed":
        return "error";
      case "processing":
        return "warning";
      case "queued":
        return "info";
      default:
        return "default";
    }
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return "N/A";
    try {
      return format(new Date(timeString), "MMM dd, HH:mm:ss");
    } catch {
      return timeString;
    }
  };

  return (
    <Box 
      className="!bg-gray-650 !border !border-gray-500"
      sx={{ mt: 1, p: 1, borderRadius: 1 }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography variant="caption" className="!text-gray-300 !font-body">
          {label}
        </Typography>
        {job.status && (
          <Chip
            label={job.status.toUpperCase()}
            size="small"
            sx={{
              backgroundColor: getStatusColor(job.status) === "success" ? "#16692D" : 
                              getStatusColor(job.status) === "error" ? "#A6363D" :
                              getStatusColor(job.status) === "warning" ? "#977A24" : "#424242",
              color: "#EDEDED",
              fontWeight: 600
            }}
          />
        )}
      </Box>
      <Typography variant="caption" className="!text-white-100 !font-body !font-mono" display="block" sx={{ mt: 0.5 }}>
        ID: {job.jobId.substring(0, 8)}...
      </Typography>
      {job.startedAt && (
        <Typography variant="caption" className="!text-gray-300 !font-body" display="block">
          Started: {formatTime(job.startedAt)}
        </Typography>
      )}
      {job.completedAt && (
        <Typography variant="caption" className="!text-gray-300 !font-body" display="block">
          Completed: {formatTime(job.completedAt)}
        </Typography>
      )}
    </Box>
  );
};

export default JobStatusIndicator;