import React from "react";
import { Button } from "@mui/material";
import { WorkspaceFileDto } from "../../models/workspace-model";
import { filesService } from "../../services/filesService";
import { enqueueSnackbar } from "notistack";
import {
  parseCitationText,
  findWorkspaceFileByName,
  createFileUrl,
} from "../../utils/citationUtils";
import Tooltip from "../Global/Tooltip";

interface CitationLinkProps {
  citationText: string;
  citationNumber: string;
  workspaceId?: string;
  workspaceFiles?: WorkspaceFileDto[];
  children: React.ReactNode;
}

const CitationLink: React.FC<CitationLinkProps> = ({
  citationText,
  citationNumber,
  workspaceId,
  workspaceFiles,
  children,
}) => {
  // Parse the citation text to get filename
  const { filename } = parseCitationText(citationText);

  // Find the workspace file to get the clean filename for display
  const workspaceFile = findWorkspaceFileByName(filename, workspaceFiles);
  const displayTitle = workspaceFile?.fileName || filename;

  // Truncate the display title for the button text
  const buttonText =
    displayTitle.length > 8
      ? displayTitle.substring(0, 8) + "..."
      : displayTitle;

  const handleClick = async (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();

    try {
      const url = createFileUrl(filename, workspaceFiles);
      let fileUrl: string | undefined = undefined;

      if (workspaceId) {
        const container = "workspace-files";
        const blobName = url;

        fileUrl = await filesService.getPreviewFileLink(
          container,
          blobName,
          workspaceId
        );
      } else {
        // Handle non-workspace files
        let urlObj = null;
        try {
          urlObj = new URL(url);
        } catch {
          urlObj = new URL(url, window.location.origin);
        }

        const pathParts = urlObj.pathname.split("/").filter(Boolean);
        if (pathParts.length >= 2) {
          // Check if the URL already starts with 'files/'
          let container, blobName;
          if (pathParts[0] === "files") {
            container = pathParts[1];
            blobName = pathParts.slice(2).join("/");
          } else {
            container = pathParts[0];
            blobName = pathParts.slice(1).join("/");
          }

          fileUrl = await filesService.getPreviewFileLink(
            container,
            blobName,
            workspaceId
          );
        }
      }

      if (fileUrl) {
        window.open(fileUrl, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      console.error("Error processing file access:", error);
      enqueueSnackbar("Unable to access file. Please try again.", {
        variant: "error",
        autoHideDuration: null,
        anchorOrigin: {
          horizontal: "right",
          vertical: "bottom",
        },
      });
    }
  };

  return (
    <Tooltip text={displayTitle} useMui placement="top">
      <Button
        onClick={handleClick}
        size="small"
        sx={{
          minWidth: "auto",
          padding: "6px 12px",
          borderRadius: "12px",
          backgroundColor: "#414141",
          color: "#ffffff",
          fontSize: "11px",
          fontWeight: 500,
          lineHeight: 1,
          textTransform: "none",
          marginLeft: "4px",
          marginRight: "4px",
          verticalAlign: "baseline",
          display: "inline-flex",
          alignItems: "center",
          fontFamily: "monospace",
          "&:hover": {
            backgroundColor: "#525252",
            color: "#ffffff",
          },
          "&:active": {
            backgroundColor: "#616161",
          },
          "&.MuiButton-root": {
            minHeight: "auto",
          },
        }}
      >
        {buttonText}
      </Button>
    </Tooltip>
  );
};

export default CitationLink;
