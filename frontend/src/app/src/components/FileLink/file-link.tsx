import React from "react";
import { Link } from "@mui/material";
import { enqueueSnackbar } from "notistack";
import { HiOutlineDownload, HiOutlineEye } from "react-icons/hi";
import { downloadFile, filesService } from "../../services/filesService";
import { idea } from "react-syntax-highlighter/dist/esm/styles/hljs";

const FileLink: React.FC<{
  url: string;
  title: string;
  workspaceId?: string;
  index?: number;
  renderAs?: "icon" | "link";
}> = ({ url, title, workspaceId, index, renderAs }) => {

  // Define allowed file types for preview
  const allowedPreviewExtensions = [
    ".pdf",
    ".html",
    ".htm",
    ".css",
    ".js",
    ".txt",
    ".xml",
    ".json",
    ".md",
    ".csv",
    ".yaml",
    ".yml",
  ];

  // Helper function to get file extension
  const getFileExtension = (filename: string) => {
    return filename
      .slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2)
      .toLowerCase();
  };

  // Check if the file extension is allowed for preview
  const isPreviewAllowed = allowedPreviewExtensions.includes(
    `.${getFileExtension(url || title)}`
  );

  const handleClick = async (
    e: React.MouseEvent<HTMLAnchorElement>,
    preview: boolean
  ) => {
    e.preventDefault();
    try {
      const { container, blobName } = getFileContainerAndBlob(url, workspaceId);
      const fileUrl = await handleFileOperation(container, blobName, workspaceId, preview);

      if (preview && fileUrl) {
        window.open(fileUrl, "_blank", "noopener,noreferrer");
      } else if (preview && !fileUrl) {
        showError("Unable to generate file URL. Please try again later.");
      }

    } catch (error) {
      console.error("Error processing file access:", error);
      showError("Unable to access file. Please try again.");
    }
  };

  function getFileContainerAndBlob(url: string, workspaceId?: string) {
    if (workspaceId) {
      return { container: "workspace-files", blobName: url };
    }

    const urlObj = safeParseUrl(url);
    const pathParts = urlObj.pathname.split("/").filter(Boolean);

    if (pathParts.length < 2) throw new Error("Invalid URL structure");

    // Normalize 'files/' prefix
    const isPrefixed = pathParts[0] === "files";
    const container = isPrefixed ? pathParts[1] : pathParts[0];
    const blobName = pathParts.slice(isPrefixed ? 2 : 1).join("/");

    return { container, blobName };
  }

  function safeParseUrl(url: string) {
    try {
      return new URL(url);
    } catch {
      return new URL(url, window.location.origin);
    }
  }

  async function handleFileOperation(
    container: string,
    blobName: string,
    workspaceId?: string,
    preview?: boolean
  ): Promise<string | undefined> {
    if (preview) {
      // Generate SAS URL for preview (opens in new tab)
      return await filesService.getPreviewFileLink(container, blobName, workspaceId);
    }
    // Authenticated download via axios
    await filesService.downloadFile(container, blobName, workspaceId);
    return undefined;
  }

  function showError(message: string) {
    enqueueSnackbar(message, {
      variant: "error",
      autoHideDuration: null,
      anchorOrigin: { horizontal: "right", vertical: "bottom" },
    });
  }

  if (renderAs == "icon") {
    return (
      <>
        {isPreviewAllowed && ( // Conditionally render the "eye" icon
          <Link
            onClick={(e) => handleClick(e, true)}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              color: "inherit",
            }}
          >
            <button
              className="mr-3 text-white-100 translate-y-[2px]"
              aria-label="View file"
            >
              <HiOutlineEye />
            </button>
          </Link>
        )}
        <Link
          onClick={(e) => handleClick(e, false)}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            color: "inherit",
          }}
        >
          <button
            className="mb-1 mx-auto text-white-100"
            aria-label="Download file"
          >
            <HiOutlineDownload />
          </button>
        </Link>
      </>
    );
  }

  return (
    <Link
      onClick={(e) => handleClick(e, true)}
      className="citations inline-block cursor-pointer"
      sx={{
        background: "#4f5d76",
        padding: "0px 8px 0px 8px",
        borderRadius: "5px",
        fontWeight: 500,
        fontSize: "13px",
        textTransform: "lowercase",
        textDecoration: "none",
        color: "inherit",
      }}
      target="_blank"
      rel="noopener noreferrer"
    >
      {index != undefined && <>{`${index + 1} - ${title}`}</>}
      {index == undefined && <>{`${title}`}</>}
    </Link>
  );
};

export default FileLink;
