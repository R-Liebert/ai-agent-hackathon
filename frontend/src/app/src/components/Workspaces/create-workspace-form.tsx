import { FormLabel, Box, Button } from "@mui/material";
import React, {
  useRef,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { FormikProps } from "formik";
import MembersPicker from "./members-picker";
import {
  CreateWorkspaceDto,
  WorkspaceMemberDto,
  UserDto,
  WorkspaceSettingsDto,
  WorkspaceFileDto,
} from "../../models/workspace-model";
import {
  FileWithSharePointMetadata,
  GraphFileDownloadRequest,
} from "../../types/sharepoint-types";
import { FileUpload } from "./file-upload";
import WorkspaceImagePicker from "./workspace-image-picker";
import PersonaConfigurator from "./persona-configurator";
import BlockUI from "../block-ui";
import { useTranslation } from "react-i18next";
import CustomToggleButton from "../app-toggle-button";
import { WorkspaceFilesList } from "./workspace-files-list";
import { SharePointFilePicker } from "./SharePointFilePicker";
import { TbCloudUpload } from "react-icons/tb";
import RemoveAdvancedFilesModal from "./remove-advanced-files-modal";
import { workspacesService } from "../../services/workspacesService";
import WorkspaceMembersList from "./members-list";
import ConversationStartersEditor from "./conversation-starters-editor";
import AdvancedSettingsAccordion from "./advanced-settings-accordion";
import FormTabsNavigation from "./form-tabs-navigation";

type CreateWorkspaceFormProps = {
  formik: FormikProps<CreateWorkspaceDto>;
  onReturn: () => void;
  onRemoveWorkspaceFile: (workspaceFile: WorkspaceFileDto) => void;
  workspaceSettings: WorkspaceSettingsDto;
  getWorkspaceFiles: () => WorkspaceFileDto[];
  isPending: boolean;
  onNameChanged?: (name: string) => void;
};

const CreateWorkspaceForm = ({
  formik,
  onReturn,
  onRemoveWorkspaceFile,
  workspaceSettings,
  getWorkspaceFiles,
  isPending,
  onNameChanged,
}: CreateWorkspaceFormProps) => {
  const { t } = useTranslation();
  const [isSharePointPickerOpen, setIsSharePointPickerOpen] = useState(false);

  const nameRef = useRef(null);

  // Keep track of all files and their status
  const filesTracker = React.useRef<
    Map<string, { file: File; status: string; response?: any }>
  >(new Map());

  const handleMembersChange = async (
    value: UserDto[] | WorkspaceMemberDto[]
  ) => {
    await formik.setFieldValue(
      "members",
      value.map((x) => {
        let workspaceMember = x as WorkspaceMemberDto;
        if (workspaceMember.isOwner == undefined) {
          workspaceMember.isOwner = false;
        }
        return workspaceMember;
      }) ?? []
    );
  };

  const mapToWorkspaceFile = (file: File) => {
    // Check if this is a replacement file (marked by file-upload.tsx)
    const isReplacement = (file as any).replace === true;

    const workspaceFile = {
      id: "", // Temporary ID since it's not uploaded yet
      externalId: "",
      fileName: file.name,
      contentType: file.type,
      contentLength: file.size,
      status: "Pending", // Frontend-only status
      uploadedAt: new Date(), // Optional
    } as WorkspaceFileDto;

    // Add the replacement flag as a custom property
    if (isReplacement) {
      (workspaceFile as any).isReplacement = true;
    }

    return workspaceFile;
  };

  // Function to update a file's status and sync with formik
  const updateFileStatus = (
    fileName: string,
    status: string,
    response?: any
  ) => {
    // Get the normalized key
    const fileKey = fileName.toLowerCase();

    // Get the current tracked file info
    const fileInfo = filesTracker.current.get(fileKey);
    if (!fileInfo) return;

    // Update the tracker with new status/response
    filesTracker.current.set(fileKey, {
      ...fileInfo,
      status,
      response,
    });

    // Now rebuild the complete workspaceFiles list from our tracker
    const updatedFiles = Array.from(filesTracker.current.values()).map(
      (info) => {
        const baseFile = mapToWorkspaceFile(info.file);

        // Apply any response data if available
        if (info.response) {
          return {
            ...baseFile,
            ...info.response,
            status: info.status,
          };
        }

        return {
          ...baseFile,
          status: info.status,
        };
      }
    );

    // Update formik with the complete, consistent list
    formik.setFieldValue("workspaceFiles", updatedFiles);
  };

  const markAsFailed = (fileName: string) => {
    updateFileStatus(fileName, "Failed");
  };

  const appendFile = (file: FileWithSharePointMetadata) => {
    const isReplacement = file.replace === true;
    const fileKey = file.name.toLowerCase();

    // Track this file
    filesTracker.current.set(fileKey, {
      file,
      status: "Pending",
    });

    // Update the UI
    updateFileStatus(file.name, "Pending");
  };

  const handleFilesChange = (files: File[]) => {
    const workspaceId = formik.values.workspaceId;
    const MAX_CONCURRENT_UPLOADS = 10;

    // Filter valid files
    const filesToUpload = files?.filter((x) => x.name != undefined) || [];

    // Add all files to the UI immediately
    filesToUpload.forEach((file) => {
      appendFile(file as FileWithSharePointMetadata);
    });

    // Create a queue of files to upload
    let uploadQueue = [...filesToUpload];
    let activeUploads = 0;

    // Function to process the next file in the queue
    const processNextFile = () => {
      if (uploadQueue.length === 0 || activeUploads >= MAX_CONCURRENT_UPLOADS) {
        return;
      }

      // Get the next file from the queue
      const file = uploadQueue.shift() as FileWithSharePointMetadata;
      if (!file) return;

      // Increment active uploads counter
      activeUploads++;

      const fileName = file.name;

      // Check if this is a SharePoint file
      if (file.sharePointMetadata) {
        // Use the SharePoint download endpoint
        workspacesService
          .downloadFromSharePoint(
            workspaceId,
            btoa(
              unescape(
                encodeURIComponent(JSON.stringify(file.sharePointMetadata))
              )
            )
          )
          .then((response) => {
            // Update file status with the response data
            updateFileStatus(fileName, "Uploaded", response);

            // Decrement active uploads counter
            activeUploads--;

            // Process next file
            processNextFile();
          })
          .catch(() => {
            // Mark as failed
            updateFileStatus(fileName, "Failed");

            // Decrement active uploads counter
            activeUploads--;

            // Process next file
            processNextFile();
          });
      } else {
        // Regular file upload
        workspacesService
          .uploadWorkspaceFile(workspaceId, file)
          .then((response) => {
            // Update file status with the response data
            updateFileStatus(fileName, "Uploaded", response);

            // Decrement active uploads counter
            activeUploads--;

            // Process next file
            processNextFile();
          })
          .catch(() => {
            // Mark as failed
            updateFileStatus(fileName, "Failed");

            // Decrement active uploads counter
            activeUploads--;

            // Process next file
            processNextFile();
          });
      }
    };

    // Start processing files up to the maximum concurrent uploads
    for (
      let i = 0;
      i < Math.min(MAX_CONCURRENT_UPLOADS, filesToUpload.length);
      i++
    ) {
      processNextFile();
    }
  };

  const handleSelectImage = (imageUrl?: string) => {
    formik.setFieldValue("imageUrl", imageUrl ?? null);
  };

  const handleSharePointFilesSelected = (files: File[]) => {
    handleFilesChange(files);
  };

  useEffect(() => {
    if (onNameChanged) onNameChanged(formik.values.name);
  }, [formik.values.name]);

  const onCreateWorkspaceClick = () => {
    if (!formik.isValid) {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      (nameRef.current as unknown as HTMLInputElement)?.focus();
      return;
    }
    formik.submitForm();
  };

  const workspaceFilesCount = getWorkspaceFiles().length;
  const MAX_FILES_FOR_ADVANCED_ANALYSIS = 20;

  const shouldDisableAdvancedFileAnalysis =
    workspaceFilesCount > MAX_FILES_FOR_ADVANCED_ANALYSIS;

  useEffect(() => {
    if (
      shouldDisableAdvancedFileAnalysis &&
      formik.values.advancedFileAnalysis
    ) {
      formik.setFieldValue("advancedFileAnalysis", false);
    }
    // We only need to run this effect when the file count changes
    // or if advancedFileAnalysis changes (so we can revert it if needed)
  }, [
    workspaceFilesCount,
    formik.values.advancedFileAnalysis,
    shouldDisableAdvancedFileAnalysis,
    formik,
  ]);

  const [removeAdvancedFilesModalOpen, setRemoveAdvancedFilesModalOpen] =
    useState(false);
  const [advancedFilesToRemove, setAdvancedFilesToRemove] = useState<
    WorkspaceFileDto[]
  >([]);

  const advancedFileTypes = [
    {
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      fileExtension: ".xlsx",
    },
    {
      contentType: "text/csv",
      fileExtension: ".csv",
    },
    {
      contentType: "text/xml",
      fileExtension: ".xml",
    },
    {
      contentType: "application/xml",
      fileExtension: ".xml",
    },
  ];

  const isSystemMessageEmpty =
    !formik.values.persona?.systemMessage ||
    formik.values.persona.systemMessage.trim().length === 0;
  const isSystemMessageOverrideToggleDisabled =
    isSystemMessageEmpty && !formik.values.systemMessageOverride;

  function isAdvancedFile(file: WorkspaceFileDto | undefined): boolean {
    if (!file?.fileName) return false;

    // Check file extension
    const extMatch = file.fileName.match(/\.[^/.]+$/);
    const extension = (extMatch ? extMatch[0] : "").toLowerCase();

    // Check if either extension or content type matches advanced file types
    return advancedFileTypes.some(
      (type) =>
        type.fileExtension.toLowerCase() === extension ||
        type.contentType.toLowerCase() === file.contentType?.toLowerCase()
    );
  }

  const handleConfirmRemoveAdvancedFiles = () => {
    // 1. Close the modal first
    setRemoveAdvancedFilesModalOpen(false);

    // 2. Update states after a small delay to ensure modal is closed
    setTimeout(() => {
      // Remove advanced files from tracker
      advancedFilesToRemove.forEach((file) => {
        if (file.fileName) {
          filesTracker.current.delete(file.fileName.toLowerCase());
        }
      });

      const filtered = formik.values.workspaceFiles.filter(
        (file: WorkspaceFileDto) =>
          !advancedFilesToRemove.some(
            (advFile) =>
              advFile.fileName === file.fileName &&
              advFile.contentType === file.contentType &&
              (advFile.status === "Pending" || advFile.externalId === "")
          )
      );
      formik.setFieldValue("workspaceFiles", filtered);
      formik.setFieldValue("advancedFileAnalysis", false);
      setAdvancedFilesToRemove([]);
    }, 0);
  };

  const handleCancelRemoveAdvancedFiles = () => {
    // Close modal first
    setRemoveAdvancedFilesModalOpen(false);

    // Clear state after modal is closed
    setTimeout(() => {
      setAdvancedFilesToRemove([]);
    }, 0);
  };

  function getAllowedFileTypes(
    serverFileTypes: { contentType: string; fileExtension: string }[],
    advancedFileAnalysis: boolean
  ) {
    const baseFileTypes = serverFileTypes.filter(
      (sf) =>
        !advancedFileTypes.some(
          (af) =>
            af.fileExtension.toLowerCase() === sf.fileExtension.toLowerCase()
        )
    );

    if (advancedFileAnalysis) {
      return [...baseFileTypes, ...advancedFileTypes];
    } else {
      return baseFileTypes;
    }
  }

  const finalAllowedFileTypes = useMemo(() => {
    return getAllowedFileTypes(
      workspaceSettings.files.allowedFileTypes,
      formik.values.advancedFileAnalysis
    );
  }, [
    workspaceSettings.files.allowedFileTypes,
    formik.values.advancedFileAnalysis,
  ]);

  const onRemoveAllWorkspaceFiles = () => {
    // Clear the filesTracker to prevent removed files from reappearing
    filesTracker.current.clear();
    formik.setFieldValue("files", []);
    formik.setFieldValue("workspaceFiles", []);
  };

  // Enhance the onRemoveWorkspaceFile prop with our tracker cleanup
  const enhancedRemoveWorkspaceFile = useCallback(
    (workspaceFile: WorkspaceFileDto) => {
      // Remove the file from the tracker to prevent it from reappearing
      if (workspaceFile.fileName) {
        const fileNameLower = workspaceFile.fileName.toLowerCase();

        // Remove from filesTracker
        filesTracker.current.delete(fileNameLower);

        // Remove from formik.values.workspaceFiles
        const workspaceFiles = formik.values.workspaceFiles || [];
        const updatedWorkspaceFiles = workspaceFiles.filter((file: any) => {
          const fileName = file.fileName || file.name || "";
          return fileName.toLowerCase() !== fileNameLower;
        });
        formik.setFieldValue("workspaceFiles", updatedWorkspaceFiles);
      }

      // Call the original removal function
      onRemoveWorkspaceFile(workspaceFile);
    },
    [onRemoveWorkspaceFile, formik]
  );

  return (
    <div className="w-full flex flex-col mt-6">
      <FormTabsNavigation />
      <section id="general" className="flex flex-col">
        <div className="flex flex-col place-items-center place-content-center mt-8 mb-4">
          <WorkspaceImagePicker
            imageUrl={formik.values.imageUrl}
            onSelect={handleSelectImage}
          />
        </div>
        <FormLabel className="!font-body !text-md !w-full !text-white-100 mt-6 mb-2">
          {t("workspaces:common:form:labels:name")}
        </FormLabel>
        <textarea
          id="name"
          name="name"
          data-testid="name"
          ref={nameRef}
          autoFocus={false}
          value={formik.values.name}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          autoComplete="off"
          maxLength={500}
          className={`w-full p-4 text-white-100 bg-transparent border-2 rounded-xl 
            outline-none placeholder-white-200/40 resize-none transition-colors duration-300 ease-in-out text-md
            ${
              formik.touched.name && formik.errors.name
                ? "!border-red-400 focus:!border-red-400"
                : "!border-gray-500 focus:!border-white-100"
            }`}
          rows={1}
          placeholder={t("workspaces:common:form:placeholders:name")}
        />
        {formik.touched.name && formik.errors.name && (
          <p className="text-red-400 mt-2 text-md font-body">
            {formik.errors.name}
          </p>
        )}
        <FormLabel className="!font-body !text-md !w-full !text-white-100 mt-10 mb-2">
          {t("workspaces:common:form:labels:description")}
        </FormLabel>
        <textarea
          id="description"
          name="description"
          data-testid="description"
          autoFocus={false}
          value={formik.values.description}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          autoComplete="off"
          maxLength={1000}
          className="w-full p-4 text-white-100 bg-transparent border-2 rounded-xl border-gray-500
            outline-none placeholder-white-200/40 resize-none transition-all duration-300 ease-in-out text-md
            focus:border-white-200"
          rows={4}
          placeholder={t("workspaces:common:form:placeholders:description")}
        />
      </section>
      <section id="files" className="flex flex-col">
        <FileUpload
          label={t("workspaces:common:form:labels:files")}
          dropAreaHeader={t("workspaces:common:form:placeholders:files:header")}
          dropAreaSubheader={t(
            "workspaces:common:form:placeholders:files:subheader"
          )}
          dropAreaSubheaderFiletypes={t(
            "workspaces:common:form:placeholders:files:filesSubHeader"
          )}
          files={[]}
          filesOfWorkspace={formik.values.workspaceFiles || []}
          maxNumberOfFiles={workspaceSettings.files.maxNumberOfFiles}
          allowedFileTypes={finalAllowedFileTypes}
          maxFileSize={workspaceSettings.files.maxFileSize}
          maxQuotaSize={workspaceSettings.files.maxBatchSize}
          onChange={handleFilesChange}
          onRemoveFile={enhancedRemoveWorkspaceFile}
          oneDriveButton={
            <button
              className="place-items-center place-content-center gap-2 bg-white-200 text-gray-600 px-4 py-2 font-semibold rounded-full cursor-pointer flex hover:text-white-100 hover:bg-red-600 transition-all"
              onClick={() => setIsSharePointPickerOpen(true)}
            >
              <TbCloudUpload strokeWidth={2} size={24} />
              {t("workspaces:common:sharePointPicker:button")}
            </button>
          }
        />
        <WorkspaceFilesList
          workspaceFiles={getWorkspaceFiles()}
          onRemoveWorkspaceFile={enhancedRemoveWorkspaceFile}
          onRemoveAllWorkspaceFiles={onRemoveAllWorkspaceFiles}
        />
      </section>
      <section id="members" className="flex flex-col">
        <MembersPicker
          label={t("workspaces:common:form:labels:members")}
          placeholder={t("workspaces:common:form:placeholders:members")}
          onChange={handleMembersChange}
        />

        <WorkspaceMembersList
          members={formik.values.members}
          onChange={handleMembersChange}
        />
      </section>
      <AdvancedSettingsAccordion>
        <ConversationStartersEditor
          value={formik.values.conversationStarters}
          onChange={(value) => {
            formik.setFieldValue("conversationStarters", value);
          }}
        />
        <PersonaConfigurator
          labelInstructions={t(
            "workspaces:common:form:labels:chatInstructions"
          )}
          labelTone={t("workspaces:common:form:labels:toneOfVoice")}
          labelLength={t("workspaces:common:form:labels:responceLength")}
          placeholderInstructions={t(
            "workspaces:common:form:placeholders:chatInstructions"
          )}
          persona={formik.values.persona}
          systemMessageOverride={formik.values.systemMessageOverride}
          onChange={(persona) => {
            formik.setFieldValue("persona", persona);
          }}
        />

        <div className="flex flex-col gap-8 mt-20 mb-10">
          <CustomToggleButton
            text={t(
              "workspaces:common:form:toggleButtons:systemMessageOverride.header"
            )}
            description={t(
              "workspaces:common:form:toggleButtons:systemMessageOverride.description"
            )}
            isToggled={formik.values.systemMessageOverride ?? false}
            disabled={isSystemMessageOverrideToggleDisabled}
            onToggle={() =>
              formik.setFieldValue(
                "systemMessageOverride",
                !formik.values.systemMessageOverride
              )
            }
          />
          {isSystemMessageOverrideToggleDisabled && (
            <p className="text-xs font-body text-gray-300 -mt-4">
              {t("workspaces:common:form:systemMessageOverride.disabledHint")}
            </p>
          )}
          <CustomToggleButton
            text={t(
              "workspaces:common:form:toggleButtons:advancedFileAnalysis.header"
            )}
            description={t(
              "workspaces:common:form:toggleButtons:advancedFileAnalysis.description"
            )}
            isToggled={formik.values.advancedFileAnalysis ?? false}
            onToggle={() => {
              if (!shouldDisableAdvancedFileAnalysis) {
                // If user is enabling advanced mode -> just flip it on
                if (!formik.values.advancedFileAnalysis) {
                  // user toggling from false -> true
                  formik.setFieldValue("advancedFileAnalysis", true);
                  return;
                }

                // Else user is toggling from true -> false,
                // we must check if there are any advanced files
                const advancedFiles = getWorkspaceFiles().filter((f) =>
                  isAdvancedFile(f)
                );

                if (advancedFiles.length === 0) {
                  // no advanced files -> simply turn off advanced mode
                  formik.setFieldValue("advancedFileAnalysis", false);
                } else {
                  // show modal
                  setAdvancedFilesToRemove(advancedFiles);
                  setRemoveAdvancedFilesModalOpen(true);
                }
              }
            }}
            disabled={shouldDisableAdvancedFileAnalysis}
          />
          <CustomToggleButton
            text={t("workspaces:common:form:toggleButtons:sources.header")}
            description={t(
              "workspaces:common:form:toggleButtons:sources.description"
            )}
            isToggled={formik.values.showCitations ?? false}
            onToggle={() =>
              formik.setFieldValue(
                "showCitations",
                !formik.values.showCitations
              )
            }
          />
          <CustomToggleButton
            dataTestId="knowledge-centricMode-toggle"
            text={t("workspaces:common:form:toggleButtons:mode.header")}
            description={t(
              "workspaces:common:form:toggleButtons:mode.description"
            )}
            isToggled={formik.values.isConservative ?? false}
            onToggle={() =>
              formik.setFieldValue(
                "isConservative",
                !formik.values.isConservative
              )
            }
          />
          <CustomToggleButton
            dataTestId="file-access-toggle"
            text={t("workspaces:common:form:toggleButtons:fileAccess.header")}
            description={t(
              "workspaces:common:form:toggleButtons:fileAccess.description"
            )}
            isToggled={formik.values.isFileAccessRestrictedForMembers ?? false}
            onToggle={() =>
              formik.setFieldValue(
                "isFileAccessRestrictedForMembers",
                !formik.values.isFileAccessRestrictedForMembers
              )
            }
          />
          <CustomToggleButton
            dataTestId="enable-email-notifications"
            text={t(
              "workspaces:common:form:toggleButtons:emailNotificationsDisabled.header"
            )}
            description={t(
              "workspaces:common:form:toggleButtons:emailNotificationsDisabled.description"
            )}
            isToggled={formik.values.emailNotificationsDisabled ?? false}
            onToggle={() =>
              formik.setFieldValue(
                "emailNotificationsDisabled",
                !formik.values.emailNotificationsDisabled
              )
            }
          />
        </div>
      </AdvancedSettingsAccordion>
      <SharePointFilePicker
        isOpen={isSharePointPickerOpen}
        onClose={() => setIsSharePointPickerOpen(false)}
        onFilesSelected={handleSharePointFilesSelected}
        allowedFileTypes={finalAllowedFileTypes}
        existingFiles={getWorkspaceFiles().map((f) => f.fileName)}
      />

      <BlockUI data-testid="block-ui" open={isPending} />

      <div className="flex flex-col sm:flex-row w-full gap-4 mt-14">
        <button
          data-testid="cancel-button"
          className="text-md font-body py-[.9em] flex bg-gray-600 hover:bg-gray-400 text-white-100 font-medium 
            rounded-full w-full sm:w-[30%] place-content-center transition-color duration-300 ease-out"
          onClick={onReturn}
          aria-label={t("workspaces:create:cancelButton")}
        >
          {t("workspaces:create:cancelButton")}
        </button>
        <button
          data-testid="create-button"
          className="text-md font-body py-[.9em] flex bg-white-100 hover:bg-red-600 hover:text-white-100 text-gray-700 font-semibold
            transition-color duration-300 ease-out rounded-full w-full sm:w-[80%] text-center place-content-center"
          onClick={onCreateWorkspaceClick}
          aria-label={t("workspaces:create:createButton")}
        >
          {t("workspaces:create:createButton")}
        </button>
      </div>
      <RemoveAdvancedFilesModal
        open={removeAdvancedFilesModalOpen}
        advancedFiles={advancedFilesToRemove}
        onClose={handleCancelRemoveAdvancedFiles}
        onConfirm={handleConfirmRemoveAdvancedFiles}
      />
    </div>
  );
};

export default CreateWorkspaceForm;
