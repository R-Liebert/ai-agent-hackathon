import { ReactNode, useState } from "react";
import axiosInstance from "../services/axiosInstance";
import Tooltip from "../components/Global/Tooltip";
import { CircularProgress } from "@mui/material";

interface CodeInterpreterLinkProps {
  href: string | undefined;
  children: ReactNode;
}

const CodeInterpreterLink = ({ href, children }: CodeInterpreterLinkProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Either keep the full URL including the protocol
  let fullPath = href || "";

  let controller: AbortController | null = null;

  const handleClick = async () => {
    if (!fullPath) return;

    // Cancel previous request if it exists
    if (controller) {
      controller.abort();
    }

    controller = new AbortController();

    try {
      setIsLoading(true);

      // Make request using axiosInstance which already has auth headers
      const response = await axiosInstance.get(fullPath, {
        responseType: "blob",
        signal: controller.signal,
      });

      // Get content type from the response headers
      const contentType =
        response.headers["content-type"] || "application/octet-stream";

      // Get filename from x-file-name header
      let filename = response.headers["x-file-name"];

      // If we couldn't get a filename, use a fallback based on the URL path
      if (!filename) {
        filename = fullPath.split("/").pop() || "download";
        console.log("Using fallback filename:", filename);
      }

      // Create a Blob with the correct content type
      const blob = new Blob([response.data], { type: contentType });

      // Use URL.createObjectURL to create a link to the blob
      const url = window.URL.createObjectURL(blob);

      // Create a link element and trigger the download
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);

      // Append to body, click, and then remove
      document.body.appendChild(link);
      link.click();

      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      }, 100);
    } catch (error) {
      console.error("Error downloading interpreter file:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Tooltip useMui text="Download file">
      <button
        onClick={handleClick}
        disabled={isLoading}
        className="relative inline-flex mt-0 items-center disabled:opacity-50"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <span className="font-semibild flex items-center gap-1 text-[#4E95FF] hover:opacity-70 transition-colors">
          <span className="mb-[6px]">👉</span> {children}
          {isLoading ? (
            <CircularProgress
              size={18}
              className="ml-2"
              color="inherit"
              style={{ color: isHovered ? "white" : "black" }}
            />
          ) : null}
        </span>
      </button>
    </Tooltip>
  );
};

export default CodeInterpreterLink;
