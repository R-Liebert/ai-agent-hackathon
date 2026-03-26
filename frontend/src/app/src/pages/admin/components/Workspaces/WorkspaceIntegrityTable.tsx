import React from "react";
import { Box, Typography, Paper, Button, Chip, CircularProgress } from "@mui/material";
import { TbDatabase, TbCloud, TbSearch, TbBrandOpenai, TbShieldCheck, TbPlayerStop } from "react-icons/tb";
import type { OpenAiState } from "./types";
import { formatBytes, getOpenAiChipStyles } from "./utils";
import { FixedSizeList, ListChildComponentProps } from "react-window";

export { OpenAiState };

export type IntegrityRow = {
  fileName: string;
  dbId?: string;
  dbStatus?: string;
  blobExists: boolean;
  indexExists: boolean;
  indexApplicable?: boolean;
  indexDocCount?: number;
  openAiState?: OpenAiState;
  size?: number;
  anomalyTags: string[];
};

type WorkspaceIntegrityTableProps = {
  rows: IntegrityRow[];
  showAnomaliesOnly: boolean;
  onToggleAnomaliesOnly: () => void;
  dbFilesCount: number;
  blobCount: number;
  indexFilesCount: number;
  openAiCheckedCount: number;
  openAiRowStatusById: Record<string, { state: OpenAiState; pending: boolean }>;
  onCheckFile: (fileId: string) => void;
  onCancelCheck?: (fileId: string) => void;
  isMassCheckRunning?: boolean;
};

const WorkspaceIntegrityTable: React.FC<WorkspaceIntegrityTableProps> = ({
  rows,
  showAnomaliesOnly,
  onToggleAnomaliesOnly,
  dbFilesCount,
  blobCount,
  indexFilesCount,
  openAiCheckedCount,
  openAiRowStatusById,
  onCheckFile,
  onCancelCheck,
  isMassCheckRunning,
}) => {
  const filteredRows = rows.filter(r => {
    const anomalies = showAnomaliesOnly ? r.anomalyTags.length > 0 : true;
    return anomalies;
  });

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" className="text-white-100">
          Integrity (DB vs Blob vs Index vs OpenAI)
        </Typography>
        {rows.length > 0 && (
          <Button
            variant="outlined"
            size="small"
            onClick={onToggleAnomaliesOnly}
            sx={{
              textTransform: "none",
              borderRadius: "9999px",
              backgroundColor: showAnomaliesOnly ? "rgba(59,130,246,0.15)" : "rgba(59,130,246,0.15)",
              border: showAnomaliesOnly ? "1px solid rgba(59,130,246,0.55)" : "1px solid rgba(59,130,246,0.35)",
              color: "#60a5fa",
              py: 0.25,
              px: 1,
              '&:hover': {
                backgroundColor: "rgba(59,130,246,0.25)",
                border: "1px solid rgba(59,130,246,0.55)",
              },
            }}
          >
            {showAnomaliesOnly ? "Showing anomalies" : "Show anomalies only"}
          </Button>
        )}
      </Box>
      <Paper
        sx={{
          backgroundColor: "#1a1a1a",
          border: "1px solid #2a2a2a",
          borderRadius: 2,
          p: 3,
        }}
      >
        
        {/* Integrated summary row */}
        <Box display="flex" gap={2} flexWrap="wrap" mb={2}>
          <Box display="flex" alignItems="center" gap={1} sx={{ backgroundColor: "#141414", border: "1px solid #2a2a2a", borderRadius: 1, px: 1.5, py: 0.75 }}>
            <TbDatabase size={16} style={{ color: "#f59e0b" }} />
            <Typography variant="caption" sx={{ color: "#bfbfbf" }}>DB (page): {dbFilesCount}</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1} sx={{ backgroundColor: "#141414", border: "1px solid #2a2a2a", borderRadius: 1, px: 1.5, py: 0.75 }}>
            <TbCloud size={16} style={{ color: "#60a5fa" }} />
            <Typography variant="caption" sx={{ color: "#bfbfbf" }}>Blob: {blobCount}</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1} sx={{ backgroundColor: "#141414", border: "1px solid #2a2a2a", borderRadius: 1, px: 1.5, py: 0.75 }}>
            <TbSearch size={16} style={{ color: "#22c55e" }} />
            <Typography variant="caption" sx={{ color: "#bfbfbf" }}>Index: {indexFilesCount}</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1} sx={{ backgroundColor: "#141414", border: "1px solid #2a2a2a", borderRadius: 1, px: 1.5, py: 0.75 }}>
            <TbBrandOpenai size={16} style={{ color: "#a78bfa" }} />
            <Typography variant="caption" sx={{ color: "#bfbfbf" }}>OpenAI checked: {openAiCheckedCount}</Typography>
          </Box>
        </Box>

        {rows.length === 0 ? (
          <Box sx={{ minHeight: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5, p: 2 }}>
            <Box sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: 'rgba(6,182,212,0.15)',
              border: '1px solid rgba(6,182,212,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#06b6d4',
            }}>
              <TbShieldCheck size={28} />
            </Box>
            <Typography variant="subtitle1" className="text-white-100" sx={{ mt: 0.5 }}>
              No files to check
            </Typography>
            <Typography variant="body2" sx={{ color: '#bfbfbf', textAlign: 'center' }}>
              Upload files to this workspace to check their integrity across storage systems.
            </Typography>
          </Box>
        ) : filteredRows.length === 0 ? (
          <Box sx={{ minHeight: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5, p: 2 }}>
            <Box sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: 'rgba(6,182,212,0.15)',
              border: '1px solid rgba(6,182,212,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#06b6d4',
            }}>
              <TbShieldCheck size={28} />
            </Box>
            <Typography variant="subtitle1" className="text-white-100" sx={{ mt: 0.5 }}>
              No anomalies found
            </Typography>
            <Typography variant="body2" sx={{ color: '#bfbfbf', textAlign: 'center' }}>
              All files have consistent integrity across storage systems. Clear the anomalies filter to view all files.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ 
            maxHeight: 320, 
            overflow: "auto",
            '&::-webkit-scrollbar': {
              height: 6,
              width: 6,
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: '#1a1a1a',
              borderRadius: 3,
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#4a4a4a',
              borderRadius: 3,
              '&:hover': {
                backgroundColor: '#5a5a5a',
              },
            },
          }}>
            <Box display="grid" gridTemplateColumns="minmax(220px,1fr) 100px 100px 120px 140px 100px" gap={1.5} pb={1.5} px={1}>
              <Typography variant="caption" sx={{ color: "#bfbfbf" }}>File</Typography>
              <Typography variant="caption" sx={{ color: "#bfbfbf" }}>File Status</Typography>
              <Typography variant="caption" sx={{ color: "#bfbfbf" }}>Blob</Typography>
              <Typography variant="caption" sx={{ color: "#bfbfbf" }}>Index</Typography>
              <Typography variant="caption" sx={{ color: "#bfbfbf", textAlign: "center" }}>OpenAI</Typography>
              <Typography variant="caption" sx={{ color: "#bfbfbf" }}>Size</Typography>
            </Box>
            <FixedSizeList height={320} itemCount={filteredRows.length} itemSize={44} width="100%">
              {({ index, style }: ListChildComponentProps) => {
                const r = filteredRows[index];
                return (
                  <Box key={r.dbId || r.fileName} style={style as React.CSSProperties} display="grid" gridTemplateColumns="minmax(220px,1fr) 100px 100px 120px 140px 100px" gap={1.5} py={1} px={1} alignItems="center">
                    <Typography variant="body2" className="text-white-100" noWrap title={r.fileName}>{r.fileName}</Typography>
                    <Chip label={r.dbStatus || "—"} size="small" sx={{ backgroundColor: "#1f1f1f", color: "#a3a3a3", border: "1px solid #2a2a2a" }} />
                    <Chip 
                      label={r.blobExists ? "Yes" : "No"} 
                      size="small" 
                      sx={{ 
                        backgroundColor: r.blobExists ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)", 
                        color: r.blobExists ? "#22c55e" : "#ef4444", 
                        border: `1px solid ${r.blobExists ? "#22c55e" : "#ef4444"}` 
                      }} 
                    />
                    {r.indexApplicable === false ? (
                      <Chip 
                        label="N/A" 
                        size="small" 
                        sx={{ 
                          backgroundColor: "#1f1f1f", 
                          color: "#a3a3a3", 
                          border: "1px solid #2a2a2a" 
                        }} 
                      />
                    ) : (
                      <Chip 
                        label={r.indexExists ? (r.indexDocCount && r.indexDocCount > 1 ? `Yes (${r.indexDocCount})` : "Yes") : "No"} 
                        size="small" 
                        sx={{ 
                          backgroundColor: r.indexExists ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)", 
                          color: r.indexExists ? "#22c55e" : "#ef4444", 
                          border: `1px solid ${r.indexExists ? "#22c55e" : "#ef4444"}` 
                        }} 
                      />
                    )}
                    <Box display="flex" alignItems="center" gap={1} sx={{ width: "100%", justifyContent: "center" }}>
                      {openAiRowStatusById[r.dbId || r.fileName]?.pending ? (
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <CircularProgress size={16} sx={{ color: "#EDEDED" }} />
                          {onCancelCheck && !isMassCheckRunning && (
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => onCancelCheck(r.dbId || "")}
                              startIcon={<TbPlayerStop size={14} />}
                              sx={{
                                textTransform: "none",
                                borderRadius: "9999px",
                                backgroundColor: "rgba(239,68,68,0.15)",
                                border: "1px solid rgba(239,68,68,0.35)",
                                color: "#ef4444",
                                py: 0.125,
                                px: 0.75,
                                fontSize: '0.75rem',
                                transition: "all 0.3s ease",
                                '&:hover': {
                                  backgroundColor: "rgba(239,68,68,0.25)",
                                  border: "1px solid rgba(239,68,68,0.55)",
                                },
                              }}
                            >
                              Cancel
                            </Button>
                          )}
                        </Box>
                      ) : (
                        (() => {
                          const effectiveState = (openAiRowStatusById[r.dbId || r.fileName]?.state || r.openAiState || "unknown") as OpenAiState;
                          if (effectiveState === "unknown") {
                            return (
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => onCheckFile(r.dbId || "")}
                                sx={{
                                  textTransform: "none",
                                  width: "100%",
                                  borderRadius: "9999px",
                                  backgroundColor: "rgba(59,130,246,0.15)",
                                  border: "1px solid rgba(59,130,246,0.35)",
                                  color: "#60a5fa",
                                  py: 0.25,
                                  '&:hover': {
                                    backgroundColor: "rgba(59,130,246,0.25)",
                                    border: "1px solid rgba(59,130,246,0.55)",
                                  },
                                }}
                              >
                                Check
                              </Button>
                            );
                          }
                          const { label, sx } = getOpenAiChipStyles(effectiveState);
                          return (
                            <Chip
                              label={label}
                              size="small"
                              sx={{
                                ...sx,
                                width: "100%",
                                justifyContent: "center",
                                '& .MuiChip-label': { width: "100%", px: 0, textAlign: "center" },
                              }}
                            />
                          );
                        })()
                      )}
                    </Box>
                    <Typography variant="caption" className="text-gray-300">{formatBytes(r.size)}</Typography>
                  </Box>
                );
              }}
            </FixedSizeList>
          </Box>
        )}
      </Paper>
    </>
  );
};

export default WorkspaceIntegrityTable;