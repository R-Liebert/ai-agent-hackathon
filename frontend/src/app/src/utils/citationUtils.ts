import { WorkspaceFileDto } from "../models/workspace-model";

/**
 * Finds a workspace file by filename using fuzzy matching
 * @param filename - The filename to search for
 * @param workspaceFiles - Array of workspace files to search in
 * @returns The matching workspace file or undefined
 */
export const findWorkspaceFileByName = (
  filename: string,
  workspaceFiles?: WorkspaceFileDto[]
): WorkspaceFileDto | undefined => {
  if (!workspaceFiles || !filename) return undefined;

  const normalizedFilename = filename.toLowerCase();

  return workspaceFiles.find(
    (file) =>
      file.fileName.toLowerCase() === normalizedFilename ||
      file.fileName.toLowerCase().includes(normalizedFilename) ||
      normalizedFilename.includes(file.fileName.toLowerCase())
  );
};

/**
 * Parses citation text to extract filename and title
 * @param citation - The citation text to parse
 * @returns Object containing filename and title
 */
export const parseCitationText = (
  citation: string
): { filename: string; title: string } => {
  // Try to extract filename from various citation formats
  // Examples: "Document 1: Page 5", "filename.pdf", "Report.docx: Section 3"

  // First, check if it looks like a filename with extension
  const filenameMatch = citation.match(/([^:]+\.[a-zA-Z0-9]+)/);
  if (filenameMatch) {
    return {
      filename: filenameMatch[1].trim(),
      title: citation.trim(),
    };
  }

  // If no file extension found, try to extract the first part before colon
  const colonMatch = citation.match(/^([^:]+)/);
  if (colonMatch) {
    const potentialFilename = colonMatch[1].trim();
    // Add a default extension if none exists
    const filename = potentialFilename.includes(".")
      ? potentialFilename
      : `${potentialFilename}.pdf`;
    return {
      filename: filename,
      title: citation.trim(),
    };
  }

  // Fallback: use the entire citation as both filename and title
  const filename = citation.includes(".")
    ? citation.trim()
    : `${citation.trim()}.pdf`;
  return {
    filename: filename,
    title: citation.trim(),
  };
};

/**
 * Creates a file URL from a filename, using workspace file's blobName if available
 * @param filename - The filename to create URL for
 * @param workspaceFiles - Optional array of workspace files to search for blobName
 * @returns The file URL
 */
export const createFileUrl = (
  filename: string,
  workspaceFiles?: WorkspaceFileDto[]
): string => {
  const workspaceFile = findWorkspaceFileByName(filename, workspaceFiles);

  if (workspaceFile?.blobName) {
    // Use the blobName directly as it should already contain the proper timestamp format
    return workspaceFile.blobName;
  }

  // Fallback to encoded filename if no workspace file found
  return encodeURIComponent(filename);
};

/**
 * Removes duplicate citations based on their parsed filenames
 * @param citations - Array of citation strings
 * @returns Array of unique citations (keeps the first occurrence)
 */
export const removeDuplicateCitations = (citations: string[]): string[] => {
  const seen = new Set<string>();
  const uniqueCitations: string[] = [];

  for (const citation of citations) {
    const { filename } = parseCitationText(citation);
    const normalizedFilename = filename.toLowerCase();

    if (!seen.has(normalizedFilename)) {
      seen.add(normalizedFilename);
      uniqueCitations.push(citation);
    }
  }

  return uniqueCitations;
};
