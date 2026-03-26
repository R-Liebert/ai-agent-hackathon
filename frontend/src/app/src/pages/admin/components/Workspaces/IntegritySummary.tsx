import React from "react";
import { Box, Button, Divider, Grid, Paper, Typography } from "@mui/material";
import { TbPlayerStop } from "react-icons/tb";
import type { IntegritySummary as IntegritySummaryType } from "./utils";

interface IntegritySummaryProps {
  title?: string;
  summary: IntegritySummaryType;
  onCheckUnknown?: () => void;
  headerOutside?: boolean;
  isMassCheckRunning?: boolean;
}

const IntegritySummary: React.FC<IntegritySummaryProps> = ({
  title = "Integrity Summary",
  summary,
  onCheckUnknown,
  headerOutside = true,
  isMassCheckRunning = false,
}) => {

  const Header = (
    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
      <Typography variant="h6" className="text-white-100">{title}</Typography>
      {(summary.openaiUnknown > 0 || isMassCheckRunning) && (
        <Button
          variant="outlined"
          size="small"
          onClick={onCheckUnknown}
          startIcon={isMassCheckRunning ? <TbPlayerStop size={16} /> : undefined}
          sx={{
            textTransform: "none",
            borderRadius: "9999px",
            backgroundColor: isMassCheckRunning ? "rgba(239,68,68,0.15)" : "rgba(59,130,246,0.15)",
            border: isMassCheckRunning ? "1px solid rgba(239,68,68,0.35)" : "1px solid rgba(59,130,246,0.35)",
            color: isMassCheckRunning ? "#ef4444" : "#60a5fa",
            py: 0.25,
            px: 1,
            transition: "all 0.3s ease",
            '&:hover': {
              backgroundColor: isMassCheckRunning ? "rgba(239,68,68,0.25)" : "rgba(59,130,246,0.25)",
              border: isMassCheckRunning ? "1px solid rgba(239,68,68,0.55)" : "1px solid rgba(59,130,246,0.55)",
            },
          }}
        >
          {isMassCheckRunning ? "Cancel" : `Check unknown (${summary.openaiUnknown})`}
        </Button>
      )}
    </Box>
  );

  const Content = (
    <Paper sx={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 2, p: 3, mb: 3 }}>
      {/* Status Banner */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
          p: 1.5,
          borderRadius: 1.5,
          backgroundColor: summary.issueCount > 0 ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
          border: `1px solid ${summary.issueCount > 0 ? "rgba(239,68,68,0.4)" : "rgba(34,197,94,0.4)"}`,
        }}
      >
        <Typography variant="body2" sx={{ color: summary.issueCount > 0 ? "#ef4444" : "#22c55e" }}>
          {summary.issueCount > 0 ? `${summary.issueCount} issue(s) detected` : "No issues detected on this page"}
          {(summary.blobOver > 0 || summary.indexOver > 0) && (
            <>
              {" · "}
              {summary.blobOver > 0 ? `Blob over by ${summary.blobOver}` : ""}
              {(summary.blobOver > 0 && summary.indexOver > 0) ? ", " : ""}
              {summary.indexOver > 0 ? `Index over by ${summary.indexOver}` : ""}
            </>
          )}
        </Typography>
      </Box>

      {/* Metric Tiles */}
      <Grid container spacing={1.5}>
        <Grid item xs={12}>
          <Box display="grid" gridTemplateColumns="repeat(2, minmax(0, 1fr))" gap={1.5}>
            <Box sx={{ backgroundColor: "#141414", border: "1px solid #2a2a2a", borderRadius: 1.5, p: 1.25 }}>
              <Typography variant="caption" sx={{ color: "#bfbfbf" }}>DB (page)</Typography>
              <Typography variant="h6" className="text-white-100">{summary.total}</Typography>
            </Box>
            <Box sx={{ backgroundColor: summary.missingBlob > 0 ? "rgba(239,68,68,0.1)" : "#141414", border: `1px solid ${summary.missingBlob > 0 ? "rgba(239,68,68,0.4)" : "#2a2a2a"}`, borderRadius: 1.5, p: 1.25 }}>
              <Typography variant="caption" sx={{ color: "#bfbfbf" }}>Blob present</Typography>
              <Typography variant="h6" className="text-white-100">{summary.blobPresent}/{summary.total}</Typography>
            </Box>
            <Box sx={{ backgroundColor: summary.missingIndex > 0 ? "rgba(239,68,68,0.1)" : "#141414", border: `1px solid ${summary.missingIndex > 0 ? "rgba(239,68,68,0.4)" : "#2a2a2a"}`, borderRadius: 1.5, p: 1.25 }}>
              <Typography variant="caption" sx={{ color: "#bfbfbf" }}>Index present</Typography>
              <Typography variant="h6" className="text-white-100">{summary.indexPresent}/{summary.indexApplicableTotal}</Typography>
            </Box>
            <Box sx={{ backgroundColor: (summary.openaiMissing + summary.openaiMismatched + summary.openaiError) > 0 ? "rgba(239,68,68,0.1)" : "#141414", border: `1px solid ${(summary.openaiMissing + summary.openaiMismatched + summary.openaiError) > 0 ? "rgba(239,68,68,0.4)" : "#2a2a2a"}`, borderRadius: 1.5, p: 1.25 }}>
              <Typography variant="caption" sx={{ color: "#bfbfbf" }}>OpenAI present</Typography>
              <Typography variant="h6" className="text-white-100">{summary.openaiPresent}/{summary.total}</Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Totals Comparison */}
      <Box mt={1.5}>
        <Grid container spacing={1.5}>
          <Grid item xs={12}>
            <Box display="grid" gridTemplateColumns="repeat(4, minmax(0, 1fr))" gap={1.5}>
              <Box sx={{ backgroundColor: "#141414", border: "1px solid #2a2a2a", borderRadius: 1.5, p: 1.25 }}>
                <Typography variant="caption" sx={{ color: "#bfbfbf" }}>DB total</Typography>
                <Typography variant="h6" className="text-white-100">{summary.dbTotalAll}</Typography>
              </Box>
              <Box sx={{ backgroundColor: summary.blobOver > 0 ? "rgba(239,68,68,0.1)" : "#141414", border: `1px solid ${summary.blobOver > 0 ? "rgba(239,68,68,0.4)" : "#2a2a2a"}`, borderRadius: 1.5, p: 1.25 }}>
                <Typography variant="caption" sx={{ color: "#bfbfbf" }}>Blob total</Typography>
                <Typography variant="h6" className="text-white-100">{summary.blobTotalAll}</Typography>
                {summary.blobOver > 0 && (
                  <Typography variant="caption" sx={{ color: "#ef4444" }}>Over by {summary.blobOver}</Typography>
                )}
              </Box>
              <Box sx={{ backgroundColor: summary.indexOver > 0 ? "rgba(239,68,68,0.1)" : "#141414", border: `1px solid ${summary.indexOver > 0 ? "rgba(239,68,68,0.4)" : "#2a2a2a"}`, borderRadius: 1.5, p: 1.25 }}>
                <Typography variant="caption" sx={{ color: "#bfbfbf" }}>Index total</Typography>
                <Typography variant="h6" className="text-white-100">{summary.indexTotalAll}</Typography>
                {summary.indexOver > 0 && (
                  <Typography variant="caption" sx={{ color: "#ef4444" }}>Over by {summary.indexOver}</Typography>
                )}
              </Box>
              <Box sx={{ backgroundColor: summary.inactiveCount > 0 ? "rgba(239,68,68,0.1)" : "#141414", border: `1px solid ${summary.inactiveCount > 0 ? "rgba(239,68,68,0.4)" : "#2a2a2a"}`, borderRadius: 1.5, p: 1.25 }}>
                <Typography variant="caption" sx={{ color: "#bfbfbf" }}>Inactive files</Typography>
                <Typography variant="h6" className="text-white-100">{summary.inactiveCount}</Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Details */}
      <Divider sx={{ my: 2, borderColor: "#2a2a2a" }} />
      <Grid container spacing={1.5}>
        <Grid item xs={12}>
          <Box display="grid" gridTemplateColumns="repeat(2, minmax(0, 1fr))" gap={1.5}>
            <Box sx={{ backgroundColor: summary.missingBlob > 0 ? "rgba(239,68,68,0.08)" : "#141414", border: `1px solid ${summary.missingBlob > 0 ? "rgba(239,68,68,0.35)" : "#2a2a2a"}`, borderRadius: 1.5, p: 1.25 }}>
              <Typography variant="caption" sx={{ color: "#bfbfbf" }}>Missing Blob</Typography>
              <Typography variant="body2" className="text-white-100">{summary.missingBlob}</Typography>
            </Box>
            <Box sx={{ backgroundColor: summary.missingIndex > 0 ? "rgba(239,68,68,0.08)" : "#141414", border: `1px solid ${summary.missingIndex > 0 ? "rgba(239,68,68,0.35)" : "#2a2a2a"}`, borderRadius: 1.5, p: 1.25 }}>
              <Typography variant="caption" sx={{ color: "#bfbfbf" }}>Missing Index</Typography>
              <Typography variant="body2" className="text-white-100">{summary.missingIndex}</Typography>
            </Box>
            <Box sx={{ backgroundColor: summary.openaiMissing > 0 ? "rgba(245,158,11,0.08)" : "#141414", border: `1px solid ${summary.openaiMissing > 0 ? "rgba(245,158,11,0.35)" : "#2a2a2a"}`, borderRadius: 1.5, p: 1.25 }}>
              <Typography variant="caption" sx={{ color: "#bfbfbf" }}>OpenAI Missing</Typography>
              <Typography variant="body2" className="text-white-100">{summary.openaiMissing}</Typography>
            </Box>
            <Box sx={{ backgroundColor: summary.openaiMismatched > 0 ? "rgba(245,158,11,0.08)" : "#141414", border: `1px solid ${summary.openaiMismatched > 0 ? "rgba(245,158,11,0.35)" : "#2a2a2a"}`, borderRadius: 1.5, p: 1.25 }}>
              <Typography variant="caption" sx={{ color: "#bfbfbf" }}>OpenAI Mismatched</Typography>
              <Typography variant="body2" className="text-white-100">{summary.openaiMismatched}</Typography>
            </Box>
            <Box sx={{ backgroundColor: summary.openaiNoExternalId > 0 ? "rgba(59,130,246,0.08)" : "#141414", border: `1px solid ${summary.openaiNoExternalId > 0 ? "rgba(59,130,246,0.35)" : "#2a2a2a"}`, borderRadius: 1.5, p: 1.25 }}>
              <Typography variant="caption" sx={{ color: "#bfbfbf" }}>No External ID</Typography>
              <Typography variant="body2" className="text-white-100">{summary.openaiNoExternalId}</Typography>
            </Box>
            <Box sx={{ backgroundColor: summary.openaiError > 0 ? "rgba(239,68,68,0.08)" : "#141414", border: `1px solid ${summary.openaiError > 0 ? "rgba(239,68,68,0.35)" : "#2a2a2a"}`, borderRadius: 1.5, p: 1.25 }}>
              <Typography variant="caption" sx={{ color: "#bfbfbf" }}>OpenAI Errors</Typography>
              <Typography variant="body2" className="text-white-100">{summary.openaiError}</Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );

  if (headerOutside) {
    return (
      <>
        {Header}
        {Content}
      </>
    );
  }

  return (
    <Paper sx={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 2, p: 3, mb: 3 }}>
      {Header}
      {Content.props.children}
    </Paper>
  );
};

export default IntegritySummary;
