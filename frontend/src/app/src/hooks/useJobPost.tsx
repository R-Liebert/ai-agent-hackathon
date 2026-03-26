import { useCanvasContext } from "../contexts/CanvasContext";
import { useCallback } from "react";
import handleCopyContent from "../utils/handleCopyContent";
import { notificationsService } from "../services/notificationsService";
import { useCanvas } from "./useCanvas";
import { useTranslation } from "react-i18next";
import jobPostService from "../services/jobPostService";
import { useParams } from "react-router-dom";

export function useJobPost() {
  const ctx = useCanvasContext();

  // Destructure context states needed for job post logic
  const {
    canvasTitle,
    isGeneratedJobPost,
    setIsGeneratedJobPost,
    isLoading,
    setIsLoading,
    isDefaultView,
    setIsDefaultView,
    positionTitle,
    setPositionTitle,
    isHeaderBackgroundRemoved,
    setIsHeaderBackgroundRemoved,
    resetFormSignal,
    setResetFormSignal,
    isGeneratedJobPostReadyToCopy,
    setIsGeneratedJobPostReadyToCopy,
    formattedContent,
    activeGeneratedContent,
    jobPostStreamingSystemMessage,
    jobPostGeneratedSystemMessage,
    formSubmitted,
    setFormSubmitted,
  } = ctx;

  const { resetAllStates } = useCanvas();
  const { t } = useTranslation();

  const jobPostId = useParams<{ jobPostId: string }>().jobPostId;

  const triggerFormReset = useCallback(() => {
    setResetFormSignal((prev) => prev + 1);
  }, [setResetFormSignal]);

  const resetJobPostStates = useCallback(() => {
    setIsGeneratedJobPost(false);
    setIsLoading(false);
    setIsDefaultView(true);
    setPositionTitle("New Job Post");
    triggerFormReset();
    setFormSubmitted(false);
  }, [
    setIsGeneratedJobPost,
    setIsLoading,
    setIsDefaultView,
    setPositionTitle,
    triggerFormReset,
    setFormSubmitted,
  ]);

  // Utility to escape only content inside tags
  const escapeHtml = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  // Build HTML from canvas content versions
  const buildCanvasHtml = (
    versions: Array<{ header?: string; text?: string }>
  ): string => {
    return (versions || [])
      .map(({ header, text }) => {
        const h = (header || "").trim();
        const t = (text || "").trim();

        // Escape only the content, not the tags
        const headerHtml = h ? `<h3>${escapeHtml(h)}</h3>` : "";
        const bodyHtml = t
          ? `<p>${escapeHtml(t).replace(/(?:\r\n|\r|\n)/g, "<br>")}</p>`
          : "";

        return `${headerHtml}${bodyHtml}`;
      })
      .filter(Boolean)
      .join("<br><br>");
  };

  // Normalize HTML and enforce bold headers
  const preprocessHtmlContent = (html: string): string => {
    const tempElement = document.createElement("div");
    tempElement.innerHTML = html;

    let processedHtml = tempElement.innerHTML.replace(
      /(?:\r\n|\r|\n)/g,
      "<br>"
    );

    // Find all h1–h6 and make them bold
    processedHtml = processedHtml.replace(
      /<h([1-6])[^>]*>(.*?)<\/h\1>/gi,
      (_match, level, inner) => {
        const sizeMap: Record<string, number> = {
          "1": 22,
          "2": 20,
          "3": 18,
          "4": 16,
          "5": 15,
          "6": 14,
        };
        const content = String(inner).replace(/<\/?strong>/gi, ""); // avoid nested <strong>
        return `<h${level} style="font-weight:600; font-size:${sizeMap[level]}px; line-height:1;"><strong>${content}</strong></h${level}>`;
      }
    );

    return processedHtml;
  };

  // Copy Job Post
  const handleCopyJobPost = useCallback(async () => {
    try {
      if (
        !formattedContent ||
        (Array.isArray(formattedContent) && formattedContent.length === 0)
      ) {
        console.error("Formatted content is empty or undefined.");
        notificationsService.error("No content available to copy.");
        return;
      }

      // If formattedContent is an array, convert it to HTML
      const html = Array.isArray(formattedContent)
        ? buildCanvasHtml(formattedContent)
        : formattedContent;

      await handleCopyContent({
        htmlToCopy: preprocessHtmlContent(html),
        errorMessage: "Failed to copy job post content!",
        successMessage: `Copied job post: "${positionTitle}" successfully!`,
        defaultFont: {
          fontFamily: "Calibri, sans-serif",
          fontSize: "15px",
          color: "#000",
        },
        setMessageCopyOk: setIsGeneratedJobPostReadyToCopy,
      });
    } catch (error) {
      console.error("[useJobPost] handleCopyJobPost error:", error);
      notificationsService.error("Failed to copy job post content.");
    }
  }, [formattedContent, positionTitle, setIsGeneratedJobPostReadyToCopy]);

  const handleDownloadClick = useCallback(
    async (explicitJobPostId?: string) => {
      try {
        const idToUse = explicitJobPostId ?? jobPostId;
        if (!idToUse) {
          notificationsService.error(
            t("job-post-creator:notifications.download.error")
          );
          return;
        }

        const res = await jobPostService.download(idToUse);

        const blob = new Blob([res.data], {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;

        const fileName = res.headers["x-file-name"];
        a.download = fileName || `${(positionTitle || "Job Post").trim()}.docx`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        notificationsService.success(
          t("job-post-creator:notifications.download.success", {
            positionTitle,
          })
        );
      } catch (error) {
        console.error("[useJobPost] handleDownloadClick error:", error);
        notificationsService.error(
          t("job-post-creator:notifications.download.error")
        );
      }
    },
    [jobPostId, positionTitle, t]
  );

  const handleDeleteJobPost = () => {
    try {
      if (!jobPostId) {
        console.error("Job post ID is not available for deletion.");
        return;
      }

      jobPostService.deleteJobPost(jobPostId).then(() => {
        resetAllStates(() => {
          resetJobPostStates();
        });

        console.log("Job post deleted successfully.");

        notificationsService.success(
          t("job-post-creator:notifications.delete.success", {
            positionTitle: canvasTitle,
          })
        );
      });
    } catch (error) {
      console.error("Error deleting job post:", error);
      notificationsService.error(
        t("job-post-creator:notifications.delete.error", {
          positionTitle: canvasTitle,
        })
      );
    }
  };

  const newJobPostSession = useCallback(() => {
    setIsLoading(false);
    setIsGeneratedJobPost(false);
    setIsDefaultView(true);
    triggerFormReset();
    setFormSubmitted(false);
  }, [
    setIsLoading,
    setIsGeneratedJobPost,
    setIsDefaultView,
    triggerFormReset,
    setFormSubmitted,
  ]);

  const handleJobPostEvaluationFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0) {
        console.log("[useJobPost] No file selected for evaluation upload.");
        notificationsService.error(
          t("job-post-creator:notifications.upload.error.noFile")
        );
        return;
      }

      const file = e.target.files[0];
      const fileNameLower = file.name.toLowerCase();

      if (!fileNameLower.endsWith(".docx") && !fileNameLower.endsWith(".txt")) {
        console.error(
          "Invalid file type. Only .docx and .txt files are allowed."
        );
        notificationsService.error(
          t("job-post-creator:notifications.upload.error.invalidFileType", {
            fileName: file.name,
          })
        );
        return;
      }

      jobPostService
        .uploadForEvaluation(jobPostId!, file)
        .then(() => {
          console.log(
            `[useJobPost] File uploaded for evaluation: ${file.name}`
          );
          notificationsService.success(
            t("job-post-creator:notifications.upload.success", {
              fileName: file.name,
            })
          );
        })
        .catch((error) => {
          console.error("File upload failed:", error);
          notificationsService.error(
            t("job-post-creator:notifications.upload.error.uploadFailed", {
              fileName: file.name,
            })
          );
        });
    },
    [jobPostId, t, notificationsService]
  );

  // Return all relevant Job Post states and handlers
  return {
    // States
    isGeneratedJobPost,
    setIsGeneratedJobPost,
    isLoading,
    setIsLoading,
    isDefaultView,
    setIsDefaultView,
    positionTitle,
    setPositionTitle,
    isHeaderBackgroundRemoved,
    setIsHeaderBackgroundRemoved,
    resetFormSignal,
    setResetFormSignal,
    isGeneratedJobPostReadyToCopy,
    setIsGeneratedJobPostReadyToCopy,
    formSubmitted,
    setFormSubmitted,

    formattedContent,
    activeGeneratedContent,
    jobPostStreamingSystemMessage,
    jobPostGeneratedSystemMessage,

    // Handlers
    triggerFormReset,
    resetJobPostStates,
    handleCopyJobPost,
    handleDownloadClick,
    handleDeleteJobPost,
    newJobPostSession,
    handleJobPostEvaluationFileUpload,
  };
}
