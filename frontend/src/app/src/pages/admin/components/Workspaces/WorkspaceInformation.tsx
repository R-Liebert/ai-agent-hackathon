import React from "react";
import { Box, Typography, Paper, Grid, Chip, IconButton } from "@mui/material";
import { TbCopy } from "react-icons/tb";
import { notificationsService } from "../../../../services/notificationsService";

type WorkspaceInformationProps = {
  name?: string;
  id?: string;
  processingStatus?: string;
  description?: string;
};

const WorkspaceInformation: React.FC<WorkspaceInformationProps> = ({
  name,
  id,
  processingStatus,
  description,
}) => {
  const copyToClipboard = (text: string | undefined, label: string) => {
    if (!text) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        notificationsService.success(`${label} copied`);
      }).catch(() => {});
    }
  };

  const getStatusStyles = (status?: string) => {
    const styles: Record<string, any> = {
      Pending: { bg: "#1f1f1f", fg: "#a3a3a3", bd: "#a3a3a3" },
      Processing: { bg: "rgba(245, 158, 11, 0.2)", fg: "#f59e0b", bd: "#f59e0b" },
      Completed: { bg: "rgba(34, 197, 94, 0.2)", fg: "#22c55e", bd: "#22c55e" },
      Failed: { bg: "rgba(239, 68, 68, 0.2)", fg: "#ef4444", bd: "#ef4444" },
      Unknown: { bg: "#1f1f1f", fg: "#a3a3a3", bd: "#a3a3a3" },
    };
    const c = status && styles[status] ? styles[status] : styles.Unknown;
    return {
      backgroundColor: c.bg,
      color: c.fg,
      border: `1px solid ${c.bd}`,
      mt: 0.5,
    };
  };

  return (
    <>
      <Typography variant="h6" className="text-white-100" sx={{ mb: 2 }}>
        Workspace Information
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
              Workspace Name
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body1" className="text-white-100">
                {name ?? "—"}
              </Typography>
              {name && (
                <IconButton 
                  size="small" 
                  onClick={() => copyToClipboard(name, "Workspace name")}
                  sx={{ 
                    color: "#a3a3a3", 
                    p: 0.5,
                    '&:hover': { 
                      color: '#EDEDED',
                      backgroundColor: 'rgba(255,255,255,0.05)'
                    } 
                  }}
                >
                  <TbCopy size={16} />
                </IconButton>
              )}
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" sx={{ color: "#bfbfbf" }}>
              Workspace ID
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body1" className="text-white-100">
                {id ?? "—"}
              </Typography>
              {id && (
                <IconButton 
                  size="small" 
                  onClick={() => copyToClipboard(id, "Workspace ID")}
                  sx={{ 
                    color: "#a3a3a3", 
                    p: 0.5,
                    '&:hover': { 
                      color: '#EDEDED',
                      backgroundColor: 'rgba(255,255,255,0.05)'
                    } 
                  }}
                >
                  <TbCopy size={16} />
                </IconButton>
              )}
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" sx={{ color: "#bfbfbf" }}>
              Processing Status
            </Typography>
            <Chip
              label={processingStatus ?? "Unknown"}
              size="small"
              sx={getStatusStyles(processingStatus)}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" sx={{ color: "#bfbfbf" }}>
              Description
            </Typography>
            <Typography variant="body1" className="text-white-100">
              {description ?? "—"}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </>
  );
};

export default WorkspaceInformation;