import React from "react";
import { Typography, Paper, Grid } from "@mui/material";

type WorkspaceConfigurationProps = {
  showCitations?: boolean;
  advancedFileAnalysis?: boolean;
  systemMessageOverride?: boolean;
  isConservative?: boolean;
  isFileAccessRestrictedForMembers?: boolean;
  emailNotificationsDisabled?: boolean;
  createdById?: string;
  createdAt?: string;
  updatedAt?: string;
};

const WorkspaceConfiguration: React.FC<WorkspaceConfigurationProps> = ({
  showCitations,
  advancedFileAnalysis,
  systemMessageOverride,
  isConservative,
  isFileAccessRestrictedForMembers,
  emailNotificationsDisabled,
  createdById,
  createdAt,
  updatedAt,
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString();
  };

  const formatBoolean = (value?: boolean) => {
    if (value === true) return "Yes";
    if (value === false) return "No";
    return "—";
  };

  const formatConservative = (value?: boolean) => {
    if (value === true) return "Yes";
    if (value === false) return "No";
    return "—";
  };

  return (
    <>
      <Typography variant="h6" className="text-white-100" sx={{ mb: 2 }}>
        Workspace Configuration
      </Typography>
      <Paper
        sx={{
          backgroundColor: "#1a1a1a",
          border: "1px solid #2a2a2a",
          borderRadius: 2,
          p: 3,
          mb: 3,
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body2" sx={{ color: "#bfbfbf" }}>
              Show Citations
            </Typography>
            <Typography variant="body1" className="text-white-100">
              {formatBoolean(showCitations)}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" sx={{ color: "#bfbfbf" }}>
              Advanced File Analysis
            </Typography>
            <Typography variant="body1" className="text-white-100">
              {formatBoolean(advancedFileAnalysis)}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" sx={{ color: "#bfbfbf" }}>
              Chat Instructions Override
            </Typography>
            <Typography variant="body1" className="text-white-100">
              {formatBoolean(systemMessageOverride)}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" sx={{ color: "#bfbfbf" }}>
              Conservative Mode
            </Typography>
            <Typography variant="body1" className="text-white-100">
              {formatConservative(isConservative)}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" sx={{ color: "#bfbfbf" }}>
              Restrict File Access to Members
            </Typography>
            <Typography variant="body1" className="text-white-100">
              {formatBoolean(isFileAccessRestrictedForMembers)}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" sx={{ color: "#bfbfbf" }}>
              Email Notifications Disabled
            </Typography>
            <Typography variant="body1" className="text-white-100">
              {formatBoolean(emailNotificationsDisabled)}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" sx={{ color: "#bfbfbf" }}>
              Created By
            </Typography>
            <Typography variant="body1" className="text-white-100">
              {createdById ?? "—"}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" sx={{ color: "#bfbfbf" }}>
              Created At
            </Typography>
            <Typography variant="body1" className="text-white-100">
              {formatDate(createdAt)}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" sx={{ color: "#bfbfbf" }}>
              Updated At
            </Typography>
            <Typography variant="body1" className="text-white-100">
              {formatDate(updatedAt)}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </>
  );
};

export default WorkspaceConfiguration;
