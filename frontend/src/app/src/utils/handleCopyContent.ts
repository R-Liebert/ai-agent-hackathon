// utils/copyUtils.ts
import { notificationsService } from "../services/notificationsService";

type CopyParams = {
  htmlToCopy: string;
  setMessageCopyOk: React.Dispatch<React.SetStateAction<boolean>>;
  timeout?: number;
  errorMessage: string;
  successMessage: string;
  defaultFont?: {
    fontFamily?: string;
    fontSize?: string;
    color?: string;
  };
};

const handleCopyContent = async ({
  htmlToCopy,
  setMessageCopyOk,
  timeout = 2500,
  errorMessage,
  successMessage,
  defaultFont = {
    fontFamily: "Calibri, Arial, sans-serif",
    fontSize: "14px",
    color: "#000",
  },
}: CopyParams) => {
  if (!htmlToCopy) {
    notificationsService.error(errorMessage);
    return;
  }

  // Wrap the HTML content with default styles
  const styledHtmlToCopy = `<div style="font-family: ${defaultFont.fontFamily}; font-size: ${defaultFont.fontSize}; color: ${defaultFont.color};">${htmlToCopy}</div>`;

  const copyToClipboard = async (html: string) => {
    try {
      // Extract plain text from the HTML
      const tempElement = document.createElement("div");
      tempElement.innerHTML = html;
      const plainText = (
        tempElement.textContent ||
        tempElement.innerText ||
        ""
      ).trim();

      // Create blobs for both HTML and plain text
      const htmlBlob = new Blob([html], { type: "text/html" });
      const textBlob = new Blob([plainText], { type: "text/plain" });

      // Create a ClipboardItem with both formats
      const data = [
        new ClipboardItem({
          "text/html": htmlBlob,
          "text/plain": textBlob,
        }),
      ];

      // Write to clipboard
      await navigator.clipboard.write(data);
      notificationsService.success(successMessage);
    } catch (error) {
      notificationsService.error(errorMessage);
      console.error("Failed to copy text: ", error);
    }
  };

  setMessageCopyOk(true);
  await copyToClipboard(styledHtmlToCopy);

  setTimeout(() => {
    setMessageCopyOk(false);
  }, timeout);
};

export default handleCopyContent;
