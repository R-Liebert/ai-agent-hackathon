import { defaultStyles } from "react-file-icon";

export const getFileExtension = (filename: string): string => {
  return filename
    .slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2)
    .toLowerCase();
};

export const getFileIconProps = (extension: string) => {
  // Return default styles if they exist for this extension
  if (extension in defaultStyles) {
    return defaultStyles[extension as keyof typeof defaultStyles];
  }

  // Default mappings for common file types
  const typeMap: { [key: string]: any } = {
    // Documents
    doc: { type: "document", color: "#2B579A" },
    docx: { type: "document", color: "#2B579A" },
    pdf: { type: "acrobat", color: "#D93831" },
    txt: { type: "document", color: "#798082" },

    // Spreadsheets
    xls: { type: "spreadsheet", color: "#217346" },
    xlsx: { type: "spreadsheet", color: "#217346" },
    csv: { type: "spreadsheet", color: "#217346" },

    // Presentations
    ppt: { type: "presentation", color: "#B7472A" },
    pptx: { type: "presentation", color: "#B7472A" },

    // Images
    jpg: { type: "image", color: "#D4AF37" },
    jpeg: { type: "image", color: "#D4AF37" },
    png: { type: "image", color: "#D4AF37" },
    gif: { type: "image", color: "#D4AF37" },
    svg: { type: "vector", color: "#FF9A00" },

    // Code
    json: { type: "code", color: "#F1E05A" },
    js: { type: "code", color: "#F1E05A" },
    ts: { type: "code", color: "#3178C6" },
    html: { type: "code", color: "#E44D26" },
    css: { type: "code", color: "#264DE4" },

    // Archives
    zip: { type: "compressed", color: "#906030" },
    rar: { type: "compressed", color: "#906030" },
    "7z": { type: "compressed", color: "#906030" },

    // Audio/Video
    mp3: { type: "audio", color: "#1ED760" },
    wav: { type: "audio", color: "#1ED760" },
    mp4: { type: "video", color: "#FF4081" },
    mov: { type: "video", color: "#FF4081" },
  };

  return typeMap[extension] || { type: "document", color: "#798082" };
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const fileTypeGroups = {
  all: { extensions: [] }, // empty array means no filtering
  word: { extensions: [".doc", ".docx", ".rtf", ".odt"] },
  spreadsheet: { extensions: [".xls", ".xlsx", ".csv", ".ods"] },
  pdf: { extensions: [".pdf"] },
};
