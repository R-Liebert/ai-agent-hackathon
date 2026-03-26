import React, { useMemo } from "react";
import { Box, Typography, Paper, Button } from "@mui/material";
import { WorkspaceFileDto } from "../../../../services/admin/types/adminWorkspace.types";
import { CheckCircle } from "@mui/icons-material";
import { formatBytes } from "./utils";

type InactiveFilesListProps = {
  files: WorkspaceFileDto[];
  search: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
};


const InactiveFilesList: React.FC<InactiveFilesListProps> = ({ files, search, onLoadMore, hasMore }) => {
  const filtered = useMemo(() => (
    (files || [])
      .filter(f => !search || f.fileName.toLowerCase().includes(search.toLowerCase()) || (f.blobName || "").toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => ((a.blobName || a.fileName || "").toLowerCase()).localeCompare((b.blobName || b.fileName || "").toLowerCase()))
  ), [files, search]);

  if (!files || files.length === 0) {
    return (
      <Paper sx={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 2, p: 3 }}>
        <Box sx={{ minHeight: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            backgroundColor: 'rgba(34,197,94,0.15)',
            border: '1px solid rgba(34,197,94,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#22c55e',
          }}>
            <CheckCircle sx={{ fontSize: 28 }} />
          </Box>
          <Typography variant="subtitle1" className="text-white-100" sx={{ mt: 0.5 }}>
            No inactive files
          </Typography>
          <Typography variant="body2" sx={{ color: '#bfbfbf', textAlign: 'center' }}>
            Everything looks good. There are no inactive files in this workspace.
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 2, p: 3 }}>
      <Box sx={{ maxHeight: 520, overflow: "auto" }}>
        <Box display="grid" gridTemplateColumns="minmax(220px,1fr) 140px 120px" gap={1.5} px={1.5} py={0.75} sx={{ position: "sticky", top: 0, zIndex: 1, backgroundColor: "#1a1a1a", borderBottom: "1px solid #2a2a2a" }}>
          <Typography variant="caption" sx={{ color: "#bfbfbf" }}>Name</Typography>
          <Typography variant="caption" sx={{ color: "#bfbfbf" }}>Status</Typography>
          <Typography variant="caption" sx={{ color: "#bfbfbf" }}>Size</Typography>
        </Box>
        {filtered.map(f => (
          <Box key={f.id} display="grid" gridTemplateColumns="minmax(220px,1fr) 140px 120px" gap={1.5} px={1.5} py={0.75} alignItems="center">
            <Typography variant="body2" className="text-white-100" noWrap title={f.fileName}>{f.fileName}</Typography>
            <Typography variant="caption" sx={{ color: "#bfbfbf" }}>{f.status || "—"}</Typography>
            <Typography variant="caption" sx={{ color: "#bfbfbf" }}>{formatBytes(f.contentLength)}</Typography>
          </Box>
        ))}
      </Box>
      {hasMore && (
        <Box mt={2}>
          <Button variant="outlined" onClick={onLoadMore} sx={{ borderColor: "#2a2a2a", color: "#EDEDED", '&:hover': { backgroundColor: "#262626", borderColor: "#3a3a3a" } }}>
            Load more inactive files
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default InactiveFilesList;


