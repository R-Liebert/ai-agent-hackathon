import type { OpenAiState, OpenAiChipStyle, DbStatusChipStyle, OpenAiRowStatusById } from "./types";
import type { WorkspaceFileDto } from "../../../../services/admin/types/adminWorkspace.types";

export const formatBytes = (bytes?: number): string => {
  if (bytes == null) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  const rounded = value >= 10 ? value.toFixed(0) : value.toFixed(1);
  return `${rounded} ${units[unitIndex]}`;
};

export const formatDateTime = (dateString?: string, locale: string = "en-US"): string => {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

export const getDatePartsWithUrgency = (
  dateString: string,
  locale: string = "en-US",
  urgentWithinHours: number = 2
): { date: string; time: string; isUrgent: boolean } => {
  const date = new Date(dateString);
  const now = new Date();
  const isValid = !Number.isNaN(date.getTime());
  if (!isValid) {
    return { date: "—", time: "—", isUrgent: false };
  }
  const diffHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
  const parts = {
    date: date.toLocaleDateString(locale, { month: "short", day: "numeric" }),
    time: date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }),
  };
  return { ...parts, isUrgent: diffHours < 24 && diffHours < urgentWithinHours };
};

export const formatRelativeDateTime = (dateString: string, locale: string = "en-US"): string => {
  const date = new Date(dateString);
  const now = new Date();
  if (Number.isNaN(date.getTime())) return "—";
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays === 0) {
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes <= 1 ? "Just now" : `${diffMinutes} minutes ago`;
    }
    return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  return date.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
};

export const getOpenAiChipStyles = (state: OpenAiState): OpenAiChipStyle => {
  switch (state) {
    case "present":
      return {
        label: "Yes",
        sx: {
          backgroundColor: "rgba(34, 197, 94, 0.2)",
          color: "#22c55e",
          border: "1px solid #22c55e",
        },
      };
    case "missing":
    case "mismatched":
    case "noExternalId":
      return {
        label: "No",
        sx: {
          backgroundColor: "rgba(245, 158, 11, 0.2)",
          color: "#f59e0b",
          border: "1px solid #f59e0b",
        },
      };
    case "error":
      return {
        label: "Error",
        sx: {
          backgroundColor: "rgba(239, 68, 68, 0.2)",
          color: "#ef4444",
          border: "1px solid #ef4444",
        },
      };
    default:
      return {
        label: "Unknown",
        sx: {
          backgroundColor: "#1f1f1f",
          color: "#a3a3a3",
          border: "1px solid #2a2a2a",
        },
      };
  }
};

export const getDbStatusChipStyles = (status?: string): DbStatusChipStyle => {
  const s = status || "Unknown";
  const styles: Record<string, { bg: string; fg: string; bd: string }> = {
    Pending: { bg: "#1f1f1f", fg: "#a3a3a3", bd: "#a3a3a3" },
    Processing: { bg: "rgba(245, 158, 11, 0.2)", fg: "#f59e0b", bd: "#f59e0b" },
    Completed: { bg: "rgba(34, 197, 94, 0.2)", fg: "#22c55e", bd: "#22c55e" },
    Failed: { bg: "rgba(239, 68, 68, 0.2)", fg: "#ef4444", bd: "#ef4444" },
    Unknown: { bg: "#1f1f1f", fg: "#a3a3a3", bd: "#2a2a2a" },
  };
  const c = styles[s] || styles.Unknown;
  return { label: s, sx: { backgroundColor: c.bg, color: c.fg, border: `1px solid ${c.bd}` } };
};

export const groupSharePointFiles = (files: WorkspaceFileDto[], inactiveFiles?: WorkspaceFileDto[]): Map<string, WorkspaceFileDto[]> => {
  const all = [...files, ...(inactiveFiles || [])];
  const filtered = all.filter((f) => (f.fileSource || "").toLowerCase() === "sharepoint");
  const byDrive = new Map<string, WorkspaceFileDto[]>();
  
  for (const f of filtered) {
    const key = f.driveId || "unknown";
    const arr = byDrive.get(key) || [];
    arr.push(f);
    byDrive.set(key, arr);
  }
  
  // Sort groups and files by blobName/fileName for consistency
  for (const [k, arr] of byDrive) {
    arr.sort((a, b) => ((a.blobName || a.fileName || "").toLowerCase()).localeCompare((b.blobName || b.fileName || "").toLowerCase()));
  }
  
  return byDrive;
};

// Files that are not indexed and should be excluded from index integrity logic
const NON_INDEXED_EXTENSIONS = new Set([".xlsx", ".csv", ".xml"]);

export const isIndexApplicable = (fileName?: string): boolean => {
  if (!fileName || typeof fileName !== "string") return true;
  const lower = fileName.toLowerCase();
  // Find last dot; if none, assume applicable
  const dotIndex = lower.lastIndexOf(".");
  if (dotIndex === -1) return true;
  const ext = lower.slice(dotIndex);
  return !NON_INDEXED_EXTENSIONS.has(ext);
};

export interface IntegritySummary {
  total: number;
  dbTotalAll: number;
  blobTotalAll: number;
  indexTotalAll: number;
  blobPresent: number;
  missingBlob: number;
  indexPresent: number;
  missingIndex: number;
  indexApplicableTotal: number;
  openaiPresent: number;
  openaiMissing: number;
  openaiMismatched: number;
  openaiNoExternalId: number;
  openaiUnknown: number;
  openaiError: number;
  blobOver: number;
  indexOver: number;
  issueCount: number;
  inactiveCount: number;
}

export interface IntegrityRow {
  fileName: string;
  dbId?: string;
  blobExists: boolean;
  indexExists: boolean;
  indexApplicable?: boolean;
  openAiState?: OpenAiState;
}

export const buildIntegritySummary = (
  integrityRows: IntegrityRow[],
  openAiRowStatusById: OpenAiRowStatusById,
  totals: { dbTotalAll: number; blobTotalAll: number; indexTotalAll: number },
  inactiveCount: number = 0
): IntegritySummary => {
  const total = integrityRows.length;
  const { dbTotalAll, blobTotalAll, indexTotalAll } = totals;
  let blobPresent = 0;
  let indexPresent = 0;
  let missingBlob = 0;
  let missingIndex = 0;
  let indexApplicableTotal = 0;
  let openaiPresent = 0;
  let openaiMissing = 0;
  let openaiMismatched = 0;
  let openaiNoExternalId = 0;
  let openaiUnknown = 0;
  let openaiError = 0;

  for (const r of integrityRows) {
    if (r.blobExists) blobPresent++; else missingBlob++;
    // Only count index presence/missing for applicable files
    const applicable = r.indexApplicable !== false;
    if (applicable) {
      indexApplicableTotal++;
      if (r.indexExists) indexPresent++; else missingIndex++;
    }
    const key = r.dbId || r.fileName;
    const st = (openAiRowStatusById[key]?.state || r.openAiState || "unknown") as OpenAiState;
    switch (st) {
      case "present": openaiPresent++; break;
      case "missing": openaiMissing++; break;
      case "mismatched": openaiMismatched++; break;
      case "noExternalId": openaiNoExternalId++; break;
      case "error": openaiError++; break;
      default: openaiUnknown++; break;
    }
  }

  const blobOver = Math.max(0, (blobTotalAll || 0) - (dbTotalAll || 0));
  const indexOver = Math.max(0, (indexTotalAll || 0) - (dbTotalAll || 0));
  
  // Count issue categories, not individual file problems
  let issueCount = 0;
  
  // Blob-related issues (missing files OR storage over-count)
  if (missingBlob > 0 || blobOver > 0) issueCount++;
  
  // Index-related issues (missing files OR storage over-count) 
  if (missingIndex > 0 || indexOver > 0) issueCount++;
  
  // OpenAI-related issues (any OpenAI problems)
  if (openaiMissing > 0 || openaiMismatched > 0 || openaiError > 0) issueCount++;
  
  // Inactive files issue
  if (inactiveCount > 0) issueCount++;

  return {
    total,
    dbTotalAll,
    blobTotalAll,
    indexTotalAll,
    blobPresent,
    missingBlob,
    indexPresent,
    missingIndex,
    indexApplicableTotal,
    openaiPresent,
    openaiMissing,
    openaiMismatched,
    openaiNoExternalId,
    openaiUnknown,
    openaiError,
    blobOver,
    indexOver,
    issueCount,
    inactiveCount,
  };
};

export const buildMatrixCounts = (integrityRows: IntegrityRow[]): Map<string, number> => {
  const counts = new Map<string, number>();
  
  for (const r of integrityRows) {
    const blobKey = r.blobExists ? "blob-present" : "blob-missing";
    const indexKey = r.indexExists ? "index-present" : "index-missing";
    const openaiKey = `openai-${r.openAiState || "unknown"}`;
    
    counts.set(blobKey, (counts.get(blobKey) || 0) + 1);
    counts.set(indexKey, (counts.get(indexKey) || 0) + 1);
    counts.set(openaiKey, (counts.get(openaiKey) || 0) + 1);
  }
  
  return counts;
};