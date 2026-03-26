import React from "react";
import { Box, Typography, Paper, Button, CircularProgress, Chip } from "@mui/material";
import { TbBrandOpenai, TbPlayerStop } from "react-icons/tb";
import type { OpenAiState, OpenAiChipStyle } from "./types";

type FileRow = {
  id: string;
  fileName: string;
  blobName?: string | null;
};

type OpenAiFileCheckProps = {
  files: FileRow[];
  search: string;
  rowStateById: Record<string, { state: OpenAiState; pending?: boolean } | undefined>;
  getOpenAiChipStyles: (state: OpenAiState) => OpenAiChipStyle;
  onCheckFile: (fileId: string) => void;
  onCheckAll: () => void;
  onCancelCheck?: (fileId: string) => void;
  isMassCheckRunning?: boolean;
};

const OpenAiFileCheck: React.FC<OpenAiFileCheckProps> = ({ files, search, rowStateById, getOpenAiChipStyles, onCheckFile, onCheckAll, onCancelCheck, isMassCheckRunning }) => {
  const filtered = files.filter(f => !search || f.fileName.toLowerCase().includes(search.toLowerCase()) || (f.blobName || "").toLowerCase().includes(search.toLowerCase()));
  
  // Check if any individual check is running (not part of mass check)
  const hasIndividualPending = files.some(f => rowStateById[f.id]?.pending && !isMassCheckRunning);
  
  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" className="text-white-100">
          OpenAI File Check
        </Typography>
        {files.length > 0 && (
          <Button
            variant="outlined"
            size="small"
            onClick={onCheckAll}
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
            {isMassCheckRunning ? "Cancel" : "Check All"}
          </Button>
        )}
      </Box>
      <Paper sx={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 2, p: 3 }}>
        <Box sx={{ maxHeight: 520, overflow: "auto" }}>
          {filtered.length === 0 ? (
            <Box sx={{ minHeight: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5, p: 2 }}>
              <Box sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                backgroundColor: 'rgba(167,139,250,0.15)',
                border: '1px solid rgba(167,139,250,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#a78bfa',
              }}>
                <TbBrandOpenai size={28} />
              </Box>
              <Typography variant="subtitle1" className="text-white-100" sx={{ mt: 0.5 }}>
                {files.length === 0 ? 'No files in this workspace' : 'No files match your search'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#bfbfbf', textAlign: 'center' }}>
                {files.length === 0
                  ? 'Upload files to this workspace to run OpenAI checks.'
                  : 'Try adjusting or clearing your search to view files.'}
              </Typography>
            </Box>
          ) : (
            <>
              <Box display="grid" gridTemplateColumns="minmax(220px,1fr) 200px" gap={1.5} pb={1.5} px={1}>
                <Typography variant="caption" sx={{ color: "#bfbfbf" }}>File</Typography>
                <Typography variant="caption" sx={{ color: "#bfbfbf", textAlign: "center" }}>OpenAI</Typography>
              </Box>
              {filtered.map(f => {
              const rowState = rowStateById[f.id];
              const currentState = rowState?.state || "unknown";
              const isPending = rowState?.pending;
              return (
                <Box key={f.id} display="grid" gridTemplateColumns="minmax(220px,1fr) 200px" gap={1.5} py={1} px={1} alignItems="center">
                  <Typography variant="body2" className="text-white-100" noWrap title={f.fileName}>{f.fileName}</Typography>
                  <Box display="flex" alignItems="center" sx={{ width: "100%", justifyContent: "center" }}>
                    {isPending ? (
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <CircularProgress size={16} sx={{ color: "#EDEDED" }} />
                        {onCancelCheck && !isMassCheckRunning && (
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => onCancelCheck(f.id)}
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
                        const st = currentState as OpenAiState;
                        if (st === "unknown") {
                          return (
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => onCheckFile(f.id)}
                              disabled={isPending}
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
                        const { label, sx } = getOpenAiChipStyles(st);
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
                </Box>
              );
            })}
            </>
          )}
        </Box>
      </Paper>
    </>
  );
};

export default OpenAiFileCheck;


