import { Document, Packer, Paragraph, TextRun } from "docx";
import { notificationsService } from "../services/notificationsService";

type DownloadParams = {
  isReadyData: boolean;
  textToDownload: string;
  errorMessage?: string;
  errorMessageDownload?: string;
  successMessage?: string;
  fileName?: string;
  fileType?: "txt" | "docx";
};

const handleDownload = async ({
  isReadyData,
  textToDownload,
  errorMessage = "Content is not ready yet.",
  errorMessageDownload = "Something went wrong while downloading. Please try again",
  successMessage = "Download started successfully!",
  fileName = "download.txt",
  fileType = "txt",
}: DownloadParams): Promise<void> => {
  if (!isReadyData || !textToDownload) {
    notificationsService.error(errorMessage);
    return;
  }

  try {
    const cleanedText = textToDownload
      .replace(/\*+/g, "") // Remove all '*' characters
      .replace(/^\s*-\s*/gm, "• ")
      .replace(/【\d+[^】]*】/g, ""); // Remove all variations like " " or " "; // Rtra whitespace after cleaning

    let blob: Blob;

    if (fileType === "docx") {
      const lines = cleanedText.split("\n");

      const doc = new Document({
        sections: [
          {
            children: lines.map((line) => {
              const headerMatch = line.match(/^(#+)\s*(.*)$/); // Match `#`, `##`, etc.
              if (headerMatch) {
                const headerLevel = headerMatch[1].length; // Number of `#`
                const headerText = headerMatch[2]; // Text after `#`

                // Define styles dynamically for header levels
                const fontSizeMap: Record<number, number> = {
                  1: 40,
                  2: 32,
                  3: 28,
                  4: 24,
                };
                const fontSize = fontSizeMap[headerLevel] || 24;

                return new Paragraph({
                  children: [
                    new TextRun({
                      text: headerText,
                      font: "Calibri",
                      size: fontSize,
                      bold: true,
                      color: "000000",
                    }),
                  ],
                  spacing: {
                    before: 400,
                    after: 400,
                  },
                  alignment: "left",
                });
              } else {
                // Split line by highlighted parts surrounded by backticks
                const parts = line.split(/(`.*?`)/g);
                const children = parts.map((part) => {
                  if (part.startsWith("`") && part.endsWith("`")) {
                    const textContent = ` ${part.slice(1, -1)} `; // Add spaces around the highlighted text
                    return new TextRun({
                      text: textContent,
                      font: "Miriam Mono CLM",
                      size: 20,
                      color: "000000",
                      highlight: "lightGray",
                    });
                  }
                  return new TextRun({
                    text: part,
                    font: "Calibri",
                    size: 24,
                    color: "000000",
                  });
                });

                return new Paragraph({
                  children,
                  spacing: {
                    before: 140,
                    after: 140,
                    line: 320,
                  },
                });
              }
            }),
          },
        ],
      });

      // Generate the .docx file
      const buffer = await Packer.toBlob(doc);
      blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      if (!fileName.endsWith(".docx")) {
        fileName = fileName.replace(/\.txt$/, "") + ".docx";
      }
    } else {
      blob = new Blob([cleanedText], {
        type: "text/plain;charset=utf-8",
      });

      if (!fileName.endsWith(".txt")) {
        fileName = fileName.replace(/\.docx$/, "") + ".txt";
      }
    }

    // Trigger file download
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    notificationsService.success(successMessage);
  } catch (error) {
    console.error("Download error:", error);
    notificationsService.error(errorMessageDownload);
  }
};

export default handleDownload;
