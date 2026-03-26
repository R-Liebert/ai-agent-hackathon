import React, { useMemo, useState, useCallback } from "react";
import { Box, Grid, Typography, TextField, Button, CircularProgress, Chip, InputAdornment, IconButton, Tooltip } from "@mui/material";
import { WorkspaceFileDto } from "../../../../services/admin/types/adminWorkspace.types";
import { TbDatabase, TbCloud, TbSearch, TbX, TbCheck } from "react-icons/tb";
import { formatBytes, isIndexApplicable } from "./utils";
import type { DbStatusChipStyle } from "./types";
import { FixedSizeList, ListChildComponentProps } from "react-window";
import { adminWorkspaceOperations } from "../../../../services/admin/adminWorkspaceOperations";
import { notificationsService } from "../../../../services/notificationsService";

type DbStatusFn = (status?: string) => DbStatusChipStyle;

type WorkspaceFilesListsProps = {
  dbFiles: WorkspaceFileDto[];
  dbHasMore?: boolean;
  onLoadMoreDb?: () => void;
  blobFiles: string[];
  blobLoading?: boolean;
  blobError?: boolean;
  indexFiles: string[];
  indexLoading?: boolean;
  indexError?: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  getDbStatusChipStyles: DbStatusFn;
  workspaceId: string;
};


const EmptyState: React.FC<{ icon: React.ReactNode; title: string; subtitle: string }> = ({ icon, title, subtitle }) => (
  <Box sx={{ minHeight: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5, p: 2 }}>
    {icon}
    <Typography variant="subtitle1" className="text-white-100" sx={{ mt: 0.5 }}>{title}</Typography>
    <Typography variant="body2" sx={{ color: '#bfbfbf', textAlign: 'center' }}>{subtitle}</Typography>
  </Box>
);

const iconBadge = (bg: string, border: string, color: string, child: React.ReactNode) => (
  <Box sx={{
    width: 64,
    height: 64,
    borderRadius: '50%',
    backgroundColor: bg,
    border: `1px solid ${border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color,
  }}>{child}</Box>
);

const WorkspaceFilesLists: React.FC<WorkspaceFilesListsProps> = ({
  dbFiles,
  dbHasMore,
  onLoadMoreDb,
  blobFiles,
  blobLoading,
  blobError,
  indexFiles,
  indexLoading,
  indexError,
  search,
  onSearchChange,
  getDbStatusChipStyles,
  workspaceId,
}) => {
  const blobSet = useMemo(() => new Set(blobFiles || []), [blobFiles]);
  const indexSet = useMemo(() => new Set(indexFiles || []), [indexFiles]);
  const [selectedBlobNames, setSelectedBlobNames] = useState<Set<string>>(new Set());

  const getBaseName = (name: string) => {
    if (!name) return name;
    const idx1 = name.lastIndexOf("/");
    const idx2 = name.lastIndexOf("\\");
    const idx = Math.max(idx1, idx2);
    return idx >= 0 ? name.slice(idx + 1) : name;
  };

  const dbFiltered = useMemo(() => (
    (dbFiles || [])
      .filter(f => !search || f.fileName.toLowerCase().includes(search.toLowerCase()) || (f.blobName || '').toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => ((a.blobName || a.fileName || '').toLowerCase()).localeCompare((b.blobName || b.fileName || '').toLowerCase()))
  ), [dbFiles, search]);

  const blobFiltered = useMemo(() => (
    (blobFiles || [])
      .filter(name => !search || name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
  ), [blobFiles, search]);

  const indexFiltered = useMemo(() => (
    (indexFiles || [])
      .filter(name => !search || name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
  ), [indexFiles, search]);

  // Compute green/yellow highlight membership across lists efficiently
  const { goodDbIds, goodDbFileNames, goodDbBlobNames, warnDbIds, warnDbFileNames, warnDbBlobNames } = useMemo(() => {
    const goodDbIds = new Set<string>();
    const goodDbFileNames = new Set<string>();
    const goodDbBlobNames = new Set<string>();
    const warnDbIds = new Set<string>();
    const warnDbFileNames = new Set<string>();
    const warnDbBlobNames = new Set<string>();

    const indexFileNameSet = new Set((indexFiles || []).map(getBaseName));
    const blobFileNameSet = new Set((blobFiles || []).map(getBaseName));

    for (const f of dbFiles || []) {
      const indexOk = isIndexApplicable(f.fileName);

      // Present in blob (direct blobName or by base file name match)
      const inBlob = Boolean(
        (f.blobName && blobSet.has(f.blobName)) ||
        blobFileNameSet.has(f.fileName)
      );

      // Present in index (only relevant when applicable)
      const inIndex = indexOk && Boolean(
        (f.blobName && indexSet.has(f.blobName)) ||
        indexSet.has(f.fileName) ||
        indexFileNameSet.has(f.fileName)
      );

      const isGreen = inBlob && (!indexOk || inIndex);
      if (isGreen) {
        if (f.id) goodDbIds.add(f.id);
        if (f.fileName) goodDbFileNames.add(f.fileName);
        if (f.blobName) goodDbBlobNames.add(f.blobName);
      }

      // Yellow: In DB and Blob, index applicable but missing in Index
      const isYellow = inBlob && indexOk && !inIndex;
      if (isYellow) {
        if (f.id) warnDbIds.add(f.id);
        if (f.fileName) warnDbFileNames.add(f.fileName);
        if (f.blobName) warnDbBlobNames.add(f.blobName);
      }
    }

    return { goodDbIds, goodDbFileNames, goodDbBlobNames, warnDbIds, warnDbFileNames, warnDbBlobNames };
  }, [dbFiles, blobFiles, indexFiles, blobSet, indexSet]);

  const toggleSelectDbFile = useCallback((f: WorkspaceFileDto) => {
    if (!f || !warnDbIds.has(f.id || "")) return;
    const name = f.blobName;
    if (!name || !blobSet.has(name)) return;
    const isSelected = selectedBlobNames.has(name);
    setSelectedBlobNames(prev => {
      const next = new Set(prev);
      if (isSelected) next.delete(name); else next.add(name);
      return next;
    });
  }, [warnDbIds, blobSet, selectedBlobNames]);

  const toggleSelectByBlobName = useCallback((name: string) => {
    if (!name) return;
    setSelectedBlobNames(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  }, []);

  // Compute yellow (missing index) blob names currently visible in the blob list
  const visibleYellowBlobNames = useMemo(() => {
    const names = new Set<string>();
    for (const name of blobFiltered) {
      if (warnDbBlobNames.has(name)) names.add(name);
    }
    return names;
  }, [blobFiltered, warnDbBlobNames]);

  const allVisibleYellowSelected = useMemo(() => {
    if (visibleYellowBlobNames.size === 0) return false;
    for (const name of visibleYellowBlobNames) {
      if (!selectedBlobNames.has(name)) return false;
    }
    return true;
  }, [visibleYellowBlobNames, selectedBlobNames]);

  const handleToggleSelectAllYellowInBlob = useCallback(() => {
    setSelectedBlobNames(prev => {
      const next = new Set(prev);
      if (allVisibleYellowSelected) {
        for (const name of visibleYellowBlobNames) next.delete(name);
      } else {
        for (const name of visibleYellowBlobNames) next.add(name);
      }
      return next;
    });
  }, [allVisibleYellowSelected, visibleYellowBlobNames]);

  return (
    <>
      <Box display="flex" gap={2} alignItems="center" mb={2}>
        <TextField
          size="medium"
          placeholder="Search files..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <TbSearch size={20} style={{ color: "#6a6a6a" }} />
              </InputAdornment>
            ),
            endAdornment: search && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => onSearchChange("")}
                  sx={{
                    color: "#6a6a6a",
                    p: 0.5,
                    '&:hover': {
                      color: '#EDEDED',
                      backgroundColor: 'rgba(255,255,255,0.05)'
                    }
                  }}
                >
                  <TbX size={18} />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            minWidth: 420,
            "& .MuiInputBase-root": { backgroundColor: "#1f1f1f", color: "#EDEDED", height: 44, "&:hover": { backgroundColor: "#262626" } },
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#2a2a2a" },
            "& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#3a3a3a" },
            "& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#a3a3a3" },
          }}
        />
        <Box sx={{ flexGrow: 1 }} />
        <Button
          variant="outlined"
          size="medium"
          disabled={selectedBlobNames.size === 0}
          sx={{
            textTransform: "none",
            borderRadius: "9999px",
            backgroundColor: "rgba(59,130,246,0.15)",
            border: "1px solid rgba(59,130,246,0.35)",
            color: "#60a5fa",
            py: 1,
            px: 3,
            fontSize: "1rem",
            minWidth: "auto",
            '&:hover': {
              backgroundColor: "rgba(59,130,246,0.25)",
              border: "1px solid rgba(59,130,246,0.55)",
            },
            '&.Mui-disabled': {
              backgroundColor: "rgba(59,130,246,0.1)",
              border: "1px solid rgba(59,130,246,0.25)",
              color: "#60a5fa",
              opacity: 0.7,
            },
          }}
          onClick={async () => {
            try {
              await adminWorkspaceOperations.ingestFiles(workspaceId, Array.from(selectedBlobNames));
              notificationsService.success("Ingestion queued. Verification scheduled in ~15s.");
            } catch (e: any) {
              if (e?.response?.status === 404) notificationsService.error("No provided blobs exist in storage");
              else if (e?.response?.status === 400) notificationsService.error("Invalid request payload");
              else notificationsService.error(e?.message ?? "Failed to schedule ingestion");
            }
          }}
        >
          {`Index files (${selectedBlobNames.size})`}
        </Button>
        {dbHasMore && (
          <Button variant="outlined" onClick={onLoadMoreDb} sx={{ borderColor: "#2a2a2a", color: "#EDEDED", "&:hover": { backgroundColor: "#262626", borderColor: "#3a3a3a" } }}>
            Load more DB files
          </Button>
        )}
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Box sx={{ backgroundColor: "#141414", border: "1px solid #2a2a2a", borderRadius: 2, overflow: "hidden" }}>
            <Box sx={{ p: 1, borderBottom: "1px solid #2a2a2a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TbDatabase size={18} style={{ color: '#f59e0b' }} />
                <Typography variant="subtitle2" className="text-white-100">
                  Database ({dbFiltered.length})
                </Typography>
              </Box>
            </Box>
            {dbFiltered.length === 0 ? (
              <EmptyState
                icon={iconBadge('rgba(245,158,11,0.15)', 'rgba(245,158,11,0.35)', '#f59e0b', <TbDatabase size={28} />)}
                title={dbFiles.length === 0 ? 'No database files' : 'No files match your search'}
                subtitle={dbFiles.length === 0 ? 'Upload files to populate the database list.' : 'Try adjusting or clearing your search to view files.'}
              />
            ) : (
              <Box>
                <Box display="grid" gridTemplateColumns="minmax(220px,1fr) 140px 120px 28px" gap={1.5} px={1.5} py={0.75} sx={{ position: "sticky", top: 0, zIndex: 1, backgroundColor: "#1a1a1a", borderBottom: "1px solid #2a2a2a" }}>
                  <Typography variant="caption" sx={{ color: "#bfbfbf" }}>Name</Typography>
                  <Typography variant="caption" sx={{ color: "#bfbfbf", textAlign: "center" }}>Status</Typography>
                  <Typography variant="caption" sx={{ color: "#bfbfbf", marginLeft: "32px" }}>Size</Typography>
                  <Typography variant="caption" sx={{ color: "#bfbfbf", textAlign: "right" }}></Typography>
                </Box>
                <FixedSizeList height={520} itemCount={dbFiltered.length} itemSize={40} width="100%">
                  {({ index, style }: ListChildComponentProps) => {
                    const f = dbFiltered[index];
                    const { label, sx } = getDbStatusChipStyles(f.status);
                    const isGreen = f.id ? goodDbIds.has(f.id) : false;
                    const isYellow = f.id ? warnDbIds.has(f.id) : false;
                    // Selected if its own blobName is selected
                    const isSelected = Boolean(f.blobName && selectedBlobNames.has(f.blobName));
                    return (
                      <Box key={f.id} style={style} display="grid" gridTemplateColumns="minmax(220px,1fr) 140px 120px 28px" gap={1.5} px={1.5} py={0.75} alignItems="center" sx={
                        isSelected
                          ? { backgroundColor: "rgba(59,130,246,0.10)" }
                          : isGreen
                          ? { backgroundColor: "rgba(34,197,94,0.08)" }
                          : isYellow
                          ? { backgroundColor: "rgba(245,158,11,0.10)", cursor: "pointer" }
                          : undefined
                      } onClick={() => isYellow ? toggleSelectDbFile(f) : undefined}>
                        <Typography variant="body2" className="text-white-100" noWrap title={f.fileName}>{f.fileName}</Typography>
                        <Chip label={label} size="small" sx={sx} />
                        <Typography variant="caption" sx={{ color: "#bfbfbf", marginLeft: "25px" }}>{formatBytes(f.contentLength)}</Typography>
                        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                          {isSelected && <TbCheck size={18} style={{ color: "#60a5fa" }} />}
                        </Box>
                      </Box>
                    );
                  }}
                </FixedSizeList>
              </Box>
            )}
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          <Box sx={{ backgroundColor: "#141414", border: "1px solid #2a2a2a", borderRadius: 2, overflow: "hidden" }}>
            <Box sx={{ p: 1, borderBottom: "1px solid #2a2a2a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TbCloud size={18} style={{ color: '#60a5fa' }} />
                <Typography variant="subtitle2" className="text-white-100">
                  Blob Storage ({blobFiltered.length})
                </Typography>
              </Box>
              <Tooltip
                title="Nothing to select: no DB+Blob files missing in Index"
                placement="top"
                arrow
                disableHoverListener={visibleYellowBlobNames.size !== 0}
              >
                <span style={{ display: "inline-block" }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleToggleSelectAllYellowInBlob}
                    disabled={visibleYellowBlobNames.size === 0}
                    sx={{
                      textTransform: "none",
                      borderRadius: "9999px",
                      backgroundColor: "rgba(59,130,246,0.15)",
                      border: "1px solid rgba(59,130,246,0.35)",
                      color: "#60a5fa",
                      py: 0.25,
                      px: 1.5,
                      fontSize: '0.85rem',
                      minWidth: "auto",
                      '&:hover': {
                        backgroundColor: "rgba(59,130,246,0.25)",
                        border: "1px solid rgba(59,130,246,0.55)",
                      },
                      '&.Mui-disabled': {
                        backgroundColor: "rgba(59,130,246,0.1)",
                        border: "1px solid rgba(59,130,246,0.25)",
                        color: "#60a5fa",
                        opacity: 0.7,
                      },
                    }}
                  >
                    {allVisibleYellowSelected ? "Clear all" : "Select all"}
                  </Button>
                </span>
              </Tooltip>
            </Box>
            {blobLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" py={2}>
                <CircularProgress size={18} sx={{ color: "#EDEDED" }} />
              </Box>
            ) : blobError ? (
              <Typography color="error" sx={{ p: 1.5 }}>Failed to load blobs</Typography>
            ) : blobFiltered.length === 0 ? (
              <EmptyState
                icon={iconBadge('rgba(59,130,246,0.15)', 'rgba(59,130,246,0.35)', '#60a5fa', <TbCloud size={28} />)}
                title={blobFiles.length === 0 ? 'No blob files' : 'No files match your search'}
                subtitle={blobFiles.length === 0 ? 'No files present in blob storage for this workspace.' : 'Try adjusting or clearing your search to view files.'}
              />
            ) : (
              <Box>
                <Box display="grid" gridTemplateColumns="minmax(220px,1fr) 28px" gap={1.5} px={1.5} py={0.75} sx={{ position: "sticky", top: 0, zIndex: 1, backgroundColor: "#1a1a1a", borderBottom: "1px solid #2a2a2a" }}>
                  <Typography variant="caption" sx={{ color: "#bfbfbf" }}>Name</Typography>
                  <Typography variant="caption" sx={{ color: "#bfbfbf", textAlign: "right" }}></Typography>
                </Box>
                <FixedSizeList height={520} itemCount={blobFiltered.length} itemSize={40} width="100%">
                  {({ index, style }: ListChildComponentProps) => {
                    const name = blobFiltered[index];
                    const isGreen = goodDbBlobNames.has(name) || goodDbFileNames.has(getBaseName(name));
                    const isYellow = warnDbBlobNames.has(name) || warnDbFileNames.has(getBaseName(name));
                    const isSelected = selectedBlobNames.has(name);
                    return (
                      <Box key={name} style={style} display="grid" gridTemplateColumns="minmax(220px,1fr) 28px" gap={1.5} px={1.5} py={1} sx={
                        isSelected
                          ? { backgroundColor: "rgba(59,130,246,0.10)" }
                          : isGreen
                          ? { backgroundColor: "rgba(34,197,94,0.08)" }
                          : isYellow
                          ? { backgroundColor: "rgba(245,158,11,0.10)", cursor: "pointer" }
                          : undefined
                      } onClick={() => isYellow ? toggleSelectByBlobName(name) : undefined}>
                        <Typography variant="body2" className="text-gray-300" noWrap title={name}>{name}</Typography>
                        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                          {isSelected && <TbCheck size={18} style={{ color: "#60a5fa" }} />}
                        </Box>
                      </Box>
                    );
                  }}
                </FixedSizeList>
              </Box>
            )}
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          <Box sx={{ backgroundColor: "#141414", border: "1px solid #2a2a2a", borderRadius: 2, overflow: "hidden" }}>
            <Box sx={{ p: 1, borderBottom: "1px solid #2a2a2a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TbSearch size={18} style={{ color: '#22c55e' }} />
                <Typography variant="subtitle2" className="text-white-100">
                  Azure Search Index ({indexFiltered.length})
                </Typography>
              </Box>
            </Box>
            {indexLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" py={2}>
                <CircularProgress size={18} sx={{ color: "#EDEDED" }} />
              </Box>
            ) : indexError ? (
              <Typography color="error" sx={{ p: 1.5 }}>Failed to load index files</Typography>
            ) : indexFiltered.length === 0 ? (
              <EmptyState
                icon={iconBadge('rgba(34,197,94,0.15)', 'rgba(34,197,94,0.35)', '#22c55e', <TbSearch size={28} />)}
                title={indexFiles.length === 0 ? 'No index files' : 'No files match your search'}
                subtitle={indexFiles.length === 0 ? 'No entries found in the Azure Search index.' : 'Try adjusting or clearing your search to view files.'}
              />
            ) : (
              <Box>
                <Box display="grid" gridTemplateColumns="minmax(220px,1fr)" gap={1.5} px={1.5} py={0.75} sx={{ position: "sticky", top: 0, zIndex: 1, backgroundColor: "#1a1a1a", borderBottom: "1px solid #2a2a2a" }}>
                  <Typography variant="caption" sx={{ color: "#bfbfbf" }}>Name</Typography>
                </Box>
                <FixedSizeList height={520} itemCount={indexFiltered.length} itemSize={40} width="100%">
                  {({ index, style }: ListChildComponentProps) => {
                    const name = indexFiltered[index];
                    const isGreen = goodDbFileNames.has(getBaseName(name)) || goodDbBlobNames.has(name);
                    return (
                      <Box key={name} style={style} display="grid" gridTemplateColumns="minmax(220px,1fr)" gap={1.5} px={1.5} py={1} sx={isGreen ? { backgroundColor: "rgba(34,197,94,0.08)" } : undefined}>
                        <Typography variant="body2" className="text-gray-300" noWrap title={name}>{name}</Typography>
                      </Box>
                    );
                  }}
                </FixedSizeList>
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>
    </>
  );
};

export default WorkspaceFilesLists;


