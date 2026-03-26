import React from "react";
import { Box, Typography, Paper, Grid } from "@mui/material";
import { TbUsers, TbFolder } from "react-icons/tb";

type WorkspaceStatisticsProps = {
  membersCount?: number;
  membersLength?: number;
  fileCount?: number;
  filesLength?: number;
};

const WorkspaceStatistics: React.FC<WorkspaceStatisticsProps> = ({
  membersCount,
  membersLength,
  fileCount,
  filesLength,
}) => {
  // Display logic matching the original implementation
  const membersDisplay = membersCount === 0 && (membersLength ?? 0) > 0 
    ? "—" 
    : (membersCount ?? "—");
  
  const filesDisplay = fileCount === 0 && (filesLength ?? 0) > 0 
    ? "—" 
    : (fileCount ?? "—");

  return (
    <>
      <Typography variant="h6" className="text-white-100" sx={{ mb: 2 }}>
        Statistics
      </Typography>
      <Paper
        sx={{
          backgroundColor: "#1a1a1a",
          border: "1px solid #2a2a2a",
          borderRadius: 2,
          p: 2,
          mb: 3,
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box display="flex" flexDirection="column" gap={2}>
              {/* Members stat tile */}
              <Box
                sx={{
                  flex: 1,
                  minWidth: 220,
                  backgroundColor: "#141414",
                  border: "1px solid #2a2a2a",
                  borderRadius: 2,
                  p: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    backgroundColor: "rgba(59,130,246,0.15)",
                    border: "1px solid rgba(59,130,246,0.35)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#60a5fa",
                  }}
                >
                  <TbUsers size={22} />
                </Box>
                <Box flex={1} minWidth={0}>
                  <Typography variant="caption" sx={{ color: "#bfbfbf" }}>
                    Total Members
                  </Typography>
                  <Typography variant="h5" className="text-white-100" noWrap>
                    {membersDisplay}
                  </Typography>
                </Box>
              </Box>

              {/* Files stat tile */}
              <Box
                sx={{
                  flex: 1,
                  minWidth: 220,
                  backgroundColor: "#141414",
                  border: "1px solid #2a2a2a",
                  borderRadius: 2,
                  p: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    backgroundColor: "rgba(34,197,94,0.15)",
                    border: "1px solid rgba(34,197,94,0.35)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#22c55e",
                  }}
                >
                  <TbFolder size={22} />
                </Box>
                <Box flex={1} minWidth={0}>
                  <Typography variant="caption" sx={{ color: "#bfbfbf" }}>
                    Total Files
                  </Typography>
                  <Typography variant="h5" className="text-white-100" noWrap>
                    {filesDisplay}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </>
  );
};

export default WorkspaceStatistics;