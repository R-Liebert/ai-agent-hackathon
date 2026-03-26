import React from "react";
import { Box, Paper, Typography } from "@mui/material";

const AdminLanding: React.FC = () => {
  return (
    <Box>
      <Typography variant="h5" component="h2" className="font-headers text-white-100" gutterBottom>
        Admin Dashboard
      </Typography>
      <Paper sx={{ p: 3, backgroundColor: "rgba(66, 70, 84, 0.3)", border: "1px solid rgba(106,106,106,0.3)", borderRadius: 2 }}>
        <Typography variant="body1" className="text-gray-300">
          Select a section from the sidebar to manage subscriptions, view workspaces, or run maintenance tasks.
        </Typography>
      </Paper>
    </Box>
  );
};

export default AdminLanding;


