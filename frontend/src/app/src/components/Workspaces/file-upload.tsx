import React from "react";
import { FormLabel } from "@mui/material";
import clsx from "clsx";
import "./file-upload.css";
import { notificationsService } from "../../services/notificationsService";
import { TbCloudUpload, TbFolder, TbFileDescription } from "react-icons/tb";
import { useTranslation } from "react-i18next";
import { WorkspaceFileDto } from "../../models/workspace-model";
import FileUploadModal from "./file-upload-modal";

export type FileUploadProps = {
  label: string;
  dropAreaHeader: string;
  dropAreaSubheader: string;
  dropAreaSubheaderFiletypes: string;
  files: File[];
  allowedFileTypes: {
    contentType: string;
    fileExtension: string;
  }[];
  filesOfWorkspace?: WorkspaceFileDto[];
  maxNumberOfFiles: number;
  maxFileSize: number;
  maxQuotaSize: number;
  hoverLabel?: string;
  backgroundColor?: string;
  onChange: (files: File[]) => void;
  onRemoveFile: (workspaceFile: WorkspaceFileDto) => void;
  oneDriveButton?: React.ReactNode;
};

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  dropAreaSubheaderFiletypes,
  dropAreaSubheader,
  dropAreaHeader,
  files,
  maxFileSize,
  maxNumberOfFiles,
  allowedFileTypes,
  maxQuotaSize,
  hoverLabel = "",
  onChange,
  filesOfWorkspace = [],
  onRemoveFile,
  oneDriveButton,
}) => {
  const [labelText, setLabelText] = React.useState<string>(hoverLabel);
  const [isDragOver, setIsDragOver] = React.useState<boolean>(false);
  const [isMouseOver, setIsMouseOver] = React.useState<boolean>(false);
  const [modalOpen, setModalOpen] = React.useState<boolean>(false);
  const [duplicateFile, setDuplicateFile] = React.useState<File | null>(null);
  const [duplicateFiles, setDuplicateFiles] = React.useState<File[]>([]);
  const [currentDuplicateIndex, setCurrentDuplicateIndex] =
    React.useState<number>(0);
  {
    /* States for apply to all functionality */
  }
  const [applyToAll, setApplyToAll] = React.useState<boolean>(false);
  const [actionToApply, setActionToApply] = React.useState<
    "add" | "replace" | "ignore" | null
  >(null);

  const { t } = useTranslation();

  const dropLabel = t("workspaces:common.form.labels.dropLabel");
  const hoverLavel = dropLabel;

  const allowedExtensions = [
    ...new Set(allowedFileTypes.map((type) => type.fileExtension)),
  ];

  let accept: string | undefined;
  try {
    accept = allowedExtensions.join(",");
  } catch {}

  const multiple = maxNumberOfFiles > 1;

  const stopDefaults = (e: React.DragEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const dragEvents = {
    onMouseEnter: () => {
      setIsMouseOver(true);
      setLabelText(hoverLabel);
    },
    onMouseLeave: () => {
      setIsMouseOver(false);
      setLabelText(dropAreaHeader);
    },
    onDragEnter: (e: React.DragEvent) => {
      stopDefaults(e);
      setIsDragOver(true);
      setLabelText(dropLabel);
    },
    onDragLeave: (e: React.DragEvent) => {
      stopDefaults(e);

      // Ensure the drag is fully outside before hiding label
      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        setTimeout(() => setIsDragOver(false), 100); // Debounce drag leave
        setLabelText(hoverLabel); // Return to hover label
      }
    },
    onDragOver: stopDefaults,
    onDrop: async (event: React.DragEvent<HTMLElement>) => {
      stopDefaults(event);
      setLabelText(hoverLabel);
      setIsDragOver(false);

      const processedFiles = new Set<string>();
      const allFiles: File[] = [];

      // Process items (with directory support)
      if (event.dataTransfer.items && event.dataTransfer.items.length > 0) {
        const itemFiles = await processDataTransferItems(
          event.dataTransfer.items,
          processedFiles
        );
        allFiles.push(...itemFiles);
      }

      // Process files as fallback
      if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
        const fileEntries = await processDataTransferFiles(
          event.dataTransfer.files,
          processedFiles
        );
        allFiles.push(...fileEntries);
      }

      if (allFiles.length > 0) {
        appendFiles(allFiles);
      }
    },
  };

  const processDataTransferItems = async (
    items: DataTransferItemList,
    processedFiles: Set<string>
  ): Promise<File[]> => {
    try {
      const newFiles: File[] = [];

      // Important: Create entries array FIRST before any processing
      const entries: {
        entry: FileSystemEntry | null;
        item: DataTransferItem;
      }[] = [];

      // Collect all entries first
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.webkitGetAsEntry) {
          const entry = item.webkitGetAsEntry();
          entries.push({ entry, item });
        } else if (item.kind === "file") {
          entries.push({ entry: null, item });
        }
      }

      // Now process all entries
      for (const { entry, item } of entries) {
        if (entry) {
          if (entry.isDirectory) {
            await traverseFileTree(entry, newFiles, processedFiles);
          } else if (entry.isFile) {
            await processFileEntry(
              entry as FileSystemFileEntry,
              newFiles,
              processedFiles
            );
          }
        } else if (item.kind === "file") {
          addFileIfUnique(item.getAsFile(), newFiles, processedFiles);
        }
      }

      return newFiles;
    } catch (error) {
      console.error("Error processing items:", error);
      return [];
    }
  };

  const processDataTransferFiles = async (
    files: FileList,
    processedFiles: Set<string>
  ): Promise<File[]> => {
    try {
      const filesArray = Array.from(files);
      const uniqueFiles: File[] = [];

      for (const file of filesArray) {
        addFileIfUnique(file, uniqueFiles, processedFiles);
      }

      return uniqueFiles;
    } catch (error) {
      console.error("Error processing files:", error);
      return [];
    }
  };

  const processFileEntry = async (
    fileEntry: FileSystemFileEntry,
    fileList: File[],
    processedFiles: Set<string>
  ): Promise<void> => {
    return new Promise<void>((resolve) => {
      fileEntry.file(
        (file) => {
          addFileIfUnique(file, fileList, processedFiles);
          resolve();
        },
        (error) => {
          console.error("Error accessing file:", error);
          resolve();
        }
      );
    });
  };

  const addFileIfUnique = (
    file: File | null,
    fileList: File[],
    processedFiles: Set<string>
  ): void => {
    if (!file) return;

    const fileId = getFileUniqueId(file);
    if (!processedFiles.has(fileId)) {
      processedFiles.add(fileId);
      fileList.push(file);
    }
  };

  const getFileUniqueId = (file: File): string => {
    return `${file.name}-${file.size}-${file.lastModified}`;
  };

  // Updated traverseFileTree function
  const traverseFileTree = async (
    entry: FileSystemEntry | null,
    fileList: File[],
    processedFiles: Set<string> = new Set()
  ): Promise<void> => {
    if (!entry) return;

    if (entry.isFile) {
      await processFileEntry(
        entry as FileSystemFileEntry,
        fileList,
        processedFiles
      );
    } else if (entry.isDirectory) {
      await traverseDirectory(
        entry as FileSystemDirectoryEntry,
        fileList,
        processedFiles
      );
    }
  };

  const traverseDirectory = async (
    dirEntry: FileSystemDirectoryEntry,
    fileList: File[],
    processedFiles: Set<string>
  ): Promise<void> => {
    const dirReader = dirEntry.createReader();
    let entries: FileSystemEntry[] = [];

    // Read all entries in the directory - required because readEntries() might not
    // return all entries in a single call
    do {
      const newEntries = await readDirectoryEntries(dirReader);
      if (newEntries.length === 0) break;
      entries = [...entries, ...newEntries];
    } while (true);

    // Process all entries
    for (const entry of entries) {
      await traverseFileTree(entry, fileList, processedFiles);
    }
  };

  const readDirectoryEntries = (
    dirReader: FileSystemDirectoryReader
  ): Promise<FileSystemEntry[]> => {
    return new Promise<FileSystemEntry[]>((resolve) => {
      dirReader.readEntries(
        (entries) => resolve(entries),
        (error) => {
          console.error("Error reading directory:", error);
          resolve([]);
        }
      );
    });
  };

  const checkFileSize = (file: File) => {
    if (file.size == 0) {
      return false;
    }

    const fileSizeInMb = file.size / Math.pow(1024, 2);
    const isValid = fileSizeInMb <= maxFileSize;
    return isValid;
  };

  const customAutoHideDuration = 4000;

  const handleApplyToAllChange = (apply: boolean) => {
    setApplyToAll(apply);
  };

  const getFileName = (f: any): string => f.name || f.fileName || "";

  const handleReplaceFile = (file: File) => {
    if (applyToAll) {
      // In applyToAll mode, process all duplicates at once
      let updatedFiles = [...files];
      // Process each duplicate file
      duplicateFiles.forEach((dupFile) => {
        const fileNameLower = getFileName(dupFile).toLowerCase();
        // Remove all existing files with the same name (normalized) from the list
        updatedFiles = updatedFiles.filter(
          (f) => getFileName(f).toLowerCase() !== fileNameLower
        );

        // Create a new File object with the replace flag set
        const replacedFile = new File([dupFile], getFileName(dupFile), {
          type: dupFile.type,
        });
        (replacedFile as any).replace = true;

        // Add the replaced file once
        updatedFiles.push(replacedFile);

        // If the duplicate exists in workspace files, remove it
        const workspaceFile = filesOfWorkspace.find(
          (wf) => wf.fileName.toLowerCase() === fileNameLower
        );
        if (workspaceFile) {
          onRemoveFile(workspaceFile);
        }
      });

      // Update the files list with all replacements applied
      onChange(updatedFiles);

      // Clear modal and reset state
      setModalOpen(false);
      setDuplicateFiles([]);
      setApplyToAll(false);
      setActionToApply(null);
      setCurrentDuplicateIndex(0);

      notificationsService.success(
        t(
          "workspaces:singleWorkspace.modals.filesUploadModal.notifications.replaceFilesSummary"
        ),
        customAutoHideDuration
      );
      console.log("Replaced all files.");
    } else {
      // Existing single replacement logic
      const existingFileName = file.name;
      const existingFileIndex = files.findIndex(
        (f) => getFileName(f).toLowerCase() === existingFileName.toLowerCase()
      );

      const replacedFile = new File([file], existingFileName, {
        type: file.type,
      });
      (replacedFile as any).replace = true;

      let updatedFiles = [...files];

      if (existingFileIndex !== -1) {
        updatedFiles[existingFileIndex] = replacedFile;
      } else {
        const workspaceFile = filesOfWorkspace.find(
          (wf) => wf.fileName.toLowerCase() === existingFileName.toLowerCase()
        );
        if (workspaceFile) {
          updatedFiles.push(replacedFile);
          onRemoveFile(workspaceFile);
        } else {
          updatedFiles.push(replacedFile);
        }
      }

      onChange(updatedFiles);

      // Calculate the next index locally and update state accordingly
      const nextIndex = currentDuplicateIndex + 1;
      if (nextIndex >= duplicateFiles.length) {
        setModalOpen(false);
        setDuplicateFiles([]);
        setCurrentDuplicateIndex(0);
      } else {
        setCurrentDuplicateIndex(nextIndex);
        setDuplicateFile(duplicateFiles[nextIndex]);
      }

      notificationsService.success(
        `${t(
          "workspaces:singleWorkspace.modals.filesUploadModal.notifications.replace.textOne"
        )} ${existingFileName} ${t(
          "workspaces:singleWorkspace.modals.filesUploadModal.notifications.replace.textTwo"
        )}`,
        customAutoHideDuration
      );
    }
  };

  const handleDuplicates = (file: File, existingFileNames: string[]): File => {
    // Extract the file extension
    const fileExtensionMatch = file.name.match(/(\.[^/.]+)$/);
    const fileExtension = fileExtensionMatch ? fileExtensionMatch[0] : "";
    const fileNameWithoutExtension = file.name.replace(fileExtension, "");

    // Start versioning from 2 if the file already exists
    let version = 2;
    let newFileName = `${fileNameWithoutExtension}_v${version}${fileExtension}`;

    // Continue incrementing the version until a unique file name is found
    while (existingFileNames.includes(newFileName)) {
      version++;
      newFileName = `${fileNameWithoutExtension}_v${version}${fileExtension}`;
    }

    // Return the file with the updated name
    return new File([file], newFileName, { type: file.type });
  };

  const handleAddFile = (file: File) => {
    // Create a copy of the current files array
    let newFilesList = [...files];

    // If 'apply to all' is active, process all duplicate files and return early
    if (applyToAll) {
      // Deduplicate duplicateFiles based on file name to avoid processing the same file twice
      const uniqueDuplicates = duplicateFiles.filter(
        (dup, index, self) =>
          index === self.findIndex((f) => f.name === dup.name)
      );
      uniqueDuplicates.forEach((dupFile) => {
        const dupExistingNames = [
          ...newFilesList.map((f) => getFileName(f)),
          ...filesOfWorkspace.map((wf) => wf.fileName),
        ];
        if (dupExistingNames.includes(dupFile.name)) {
          const updatedDupFile = handleDuplicates(dupFile, dupExistingNames);
          console.log(updatedDupFile.name);
          newFilesList.push(updatedDupFile);
        } else {
          newFilesList.push(dupFile);
        }
      });

      // Reset modal and apply-to-all states
      setModalOpen(false);
      setDuplicateFiles([]);
      setApplyToAll(false);
      setActionToApply(null);
      setCurrentDuplicateIndex(0);

      notificationsService.success(
        t(
          "workspaces:singleWorkspace.modals.filesUploadModal.notifications.addFilesSummary"
        ),
        customAutoHideDuration
      );
      onChange(newFilesList);
      return;
    }

    // If not applying to all, process the single file
    const existingFileNames = [
      ...files.map((f) => f.name),
      ...filesOfWorkspace.map((wf) => wf.fileName),
    ];

    if (existingFileNames.includes(file.name)) {
      const updatedFile = handleDuplicates(file, existingFileNames);
      console.log(updatedFile.name);
      newFilesList.push(updatedFile);

      notificationsService.success(
        `${t(
          "workspaces:singleWorkspace.modals.filesUploadModal.notifications.add"
        )} ${updatedFile.name}`,
        customAutoHideDuration
      );
    } else {
      newFilesList.push(file);
    }

    // If not applying to all, update modal to show next duplicate if exists
    setCurrentDuplicateIndex((prevIndex) => {
      const newIndex = prevIndex + 1;
      if (newIndex >= duplicateFiles.length) {
        setModalOpen(false);
        setDuplicateFiles([]);
        return 0;
      }
      setDuplicateFile(duplicateFiles[newIndex]);
      return newIndex;
    });

    onChange(newFilesList);
  };

  const handleIgnoreFile = (file: File) => {
    if (applyToAll) {
      setModalOpen(false);
      setDuplicateFiles([]);
      setApplyToAll(false);
      setActionToApply(null);
    } else {
      setCurrentDuplicateIndex((prev) => prev + 1);
      if (currentDuplicateIndex === duplicateFiles.length - 1) {
        setModalOpen(false);
        setDuplicateFiles([]);
      }
    }
  };

  const filterDuplicates = (
    newFiles: File[],
    existingFiles: File[],
    workspaceFiles: WorkspaceFileDto[]
  ): File[] => {
    // Combine the existing files with workspace files (and versioned file names if applicable)
    const allExistingFiles = [
      ...existingFiles,
      ...workspaceFiles.map((wf) => ({
        name: wf.fileName || "", // Add default empty string if fileName is undefined
        size: wf.contentLength,
        type: wf.contentType,
      })),
    ];

    // Map to file names in lowercase and check for duplicates
    const existingFileNames = allExistingFiles
      .filter((file) => file && file.name) // Filter out any files with undefined name
      .map((file) => file.name.toLowerCase());

    const duplicates = newFiles.filter(
      (newFile) =>
        newFile &&
        newFile.name &&
        existingFileNames.includes(newFile.name.toLowerCase())
    );

    if (duplicates.length > 0) {
      setDuplicateFiles(duplicates);
      setCurrentDuplicateIndex(0);
      setDuplicateFile(duplicates[0]);
      setModalOpen(true);
      return newFiles.filter((file) => !duplicates.includes(file));
    }

    return newFiles; // No duplicates found, return all files
  };

  const appendFiles = (newFiles: File[]) => {
    const maxQuotaSizeInBytes = maxQuotaSize * Math.pow(1024, 3);
    const allowedContentTypes =
      allowedFileTypes?.map((x) => x.contentType) || [];

    const uniqueFiles = filterDuplicates(newFiles, files, filesOfWorkspace);

    let appendList: File[] = [];

    // If no duplicates (or duplicates already handled in filterDuplicates), proceed with appending files
    uniqueFiles.forEach((file) => {
      if (file == null) return;

      // Check if the file's MIME type is allowed
      const isAllowedType = allowedContentTypes.includes(file.type);
      // Fallback: if not allowed by MIME, check if the file extension is allowed
      const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`;
      if (!isAllowedType && !allowedExtensions.includes(fileExtension)) {
        notificationsService.warn(
          ` ${t(
            "workspaces:common.notifications.fileValidations.fileType.textOne"
          )} '${file.name}' ${t(
            "workspaces:common.notifications.fileValidations.fileType.textTwo"
          )}`
        );
        return;
      }

      const totalFiles = files.length + appendList.length;
      if (totalFiles >= maxNumberOfFiles) {
        notificationsService.warn(
          `${t(
            "workspaces:common.notifications.fileValidations.maxQuantity.textOne"
          )} ${maxNumberOfFiles} ${t(
            "workspaces:common.notifications.fileValidations.maxQuantity.textTwo"
          )}`
        );
        return;
      }

      if (!checkFileSize(file)) {
        notificationsService.warn(
          `${t(
            "workspaces:common.notifications.fileValidations.fileSize.textOne"
          )} '${file.name}' ${t(
            "workspaces:common.notifications.fileValidations.fileSize.textTwo"
          )} ${maxFileSize} MB.`
        );
        return;
      }

      const totalSizeBytes =
        files.reduce((sum, existingFile) => sum + existingFile.size, 0) +
        appendList.reduce((sum, appendedFile) => sum + appendedFile.size, 0) +
        file.size;

      if (totalSizeBytes > maxQuotaSizeInBytes) {
        notificationsService.warn(
          `${t(
            "workspaces:common.notifications.fileValidations.maxQuota"
          )} ${maxQuotaSize} GB.`
        );
        return;
      }

      appendList.push(file);
    });

    const newState = [...files, ...appendList];
    onChange(newState);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event?.target?.files != null && event?.target?.files?.length > 0) {
      let newFiles = Array.from(event.target.files || []);

      // Check if this is a folder upload by checking the input id
      if (event.target.id === "folder-upload") {
        // Strip folder path from filenames
        newFiles = newFiles.map((file) => {
          // Get just the filename without the path
          const fileName =
            file.name.split("/").pop() ||
            file.name.split("\\").pop() ||
            file.name;
          // Create a new File object with the same content but with the path removed from the name
          return new File([file], fileName, { type: file.type });
        });
      }

      appendFiles(newFiles);
    }
  };

  return (
    <div className="w-full mt-12">
      <div className="flex justify-between items-center mb-2">
        <FormLabel className="!font-body !text-md !w-full !text-white-100">
          {label}
        </FormLabel>
      </div>
      <div className="flex">
        <input
          onChange={handleChange}
          accept={accept}
          className={"hidden"}
          id="file-upload"
          data-testid="file-upload"
          type="file"
          multiple={multiple}
        />
        <input
          onChange={handleChange}
          accept={accept}
          className={"hidden"}
          id="folder-upload"
          data-testid="folder-upload"
          type="file"
          {...{ webkitdirectory: "", mozdirectory: "", directory: "" }}
          multiple={multiple}
        />

        <label
          htmlFor="file-upload"
          {...dragEvents}
          className={clsx("root", isDragOver && "onDragOver")}
        >
          <div className="w-full flex flex-col items-center justify-center !font-body text-center border-2 rounded-xl border-gray-500 py-6 border-dashed hover:border-white-100 focus:border-white-100">
            <div className="text-white-100">
              <TbCloudUpload strokeWidth={1} size={78} />
            </div>

            <span className="text-md text-center text-white-100 font-medium">
              {isDragOver ? labelText : `${dropAreaHeader}`}
            </span>
            <span className="text-gray-300 text-sm">
              {`( max ${maxFileSize} MB ${dropAreaSubheader} )`}
            </span>
            <span className="text-gray-300 text-sm px-6">
              {`${dropAreaSubheaderFiletypes} ${allowedExtensions.join(", ")}`}
            </span>
            {/* Upload Buttons */}
            <div className="flex flex-wrap gap-4 mt-6 mb-4 w-[92%] place-items-center place-content-center">
              <button
                aria-label={t("workspaces:common.form.labels.uploadFilesBtn")}
                data-testid="upload-files-button"
                onClick={() => document.getElementById("file-upload")?.click()}
                className="place-items-center place-content-center gap-2 bg-white-200 text-gray-600 px-4 py-2 font-semibold rounded-full cursor-pointer flex hover:text-white-100 hover:bg-red-600 transition-all"
              >
                <TbFileDescription strokeWidth={2} size={24} />
                <span>{t("workspaces:common.form.labels.uploadFilesBtn")}</span>
              </button>

              <button
                aria-label={t("workspaces:common.form.labels.uploadFoldersBtn")}
                data-testid="upload-folders-button"
                onClick={() =>
                  document.getElementById("folder-upload")?.click()
                }
                className="place-items-center place-content-center gap-2 bg-white-200 text-gray-600 px-4 py-2 font-semibold rounded-full cursor-pointer flex hover:text-white-100 hover:bg-red-600 transition-all"
              >
                <TbFolder strokeWidth={2} size={24} />
                <span>
                  {" "}
                  {t("workspaces:common.form.labels.uploadFoldersBtn")}
                </span>
              </button>
              {oneDriveButton}
            </div>
          </div>
        </label>
      </div>
      {modalOpen && duplicateFiles.length > 0 && (
        <FileUploadModal
          open={modalOpen && duplicateFiles.length > 0}
          duplicateFileName={duplicateFiles[currentDuplicateIndex]?.name || ""}
          onClose={() => {
            setModalOpen(false);
            setDuplicateFiles([]);
          }}
          onAdd={() => {
            const currentFile = duplicateFiles[currentDuplicateIndex];
            if (currentFile) {
              handleAddFile(currentFile);
            }
          }}
          onIgnore={() =>
            handleIgnoreFile(duplicateFiles[currentDuplicateIndex])
          }
          onReplace={() =>
            handleReplaceFile(duplicateFiles[currentDuplicateIndex])
          }
          onApplyToAllChange={handleApplyToAllChange}
        />
      )}
    </div>
  );
};
