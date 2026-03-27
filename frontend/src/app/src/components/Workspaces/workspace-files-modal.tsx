import React, { useState, useCallback } from "react";
import ModalContainer from "../Global/ModalContainer";
import { CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useMsal } from "../../hooks/useMsalMock";
import { WorkspaceDetailsResponse } from "../../models/workspace-model";
import { workspacesService } from "../../services/workspacesService";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import FileIcon from "../../assets/icons/file_icon.png";
import FileLink from "../FileLink/file-link";
import { useTranslation } from "react-i18next";
import SearchField from "../Global/AppSearchField";
import { format, formatDistanceToNow, isToday } from "date-fns";

type WorkspaceDetailsProps = {
  title: string;
  manageBtn: string;
  addBtn: string;
  isOpen: boolean;
  workspaceId: string;
  onClose: () => void;
};

const FilesModal = ({
  title,
  manageBtn,
  addBtn,
  workspaceId,
  onClose,
  isOpen,
}: WorkspaceDetailsProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const { accounts } = useMsal();
  const currentUserId = accounts[0]?.localAccountId;

  const {
    data: workspaceDetails,
    isLoading,
    isError,
    error,
  } = useQuery<WorkspaceDetailsResponse, AxiosError>({
    queryKey: ["workspace-details", workspaceId],
    queryFn: () => workspacesService.get(workspaceId.toString()),
    enabled: workspaceId !== undefined,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: true,
  });

  if (!isOpen) return null;

  if (isError) {
    console.error(error);
    if (error.request.status) {
      switch (error.request.status) {
        case 401:
        case 403:
          navigate("/access-denied");
          break;
        default:
          navigate("/server-error");
      }
    }
  }

  const files = workspaceDetails?.files || [];

  const filteredFiles = files.filter((file) =>
    file.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const workspaceOwners =
    workspaceDetails?.members.filter((x) => x.isOwner) ?? [];
  const workspaceOwner =
    workspaceOwners.find((x) => x.id == currentUserId) != null ||
    workspaceDetails?.createdBy.id == currentUserId;

  return (
    <ModalContainer
      open={isOpen}
      title={`${workspaceDetails?.name} ${title}`}
      onClose={onClose}
      width={`${files.length > 0 ? "max-w-lg" : "max-w-sm"}`}
    >
      <div className={`w-full flex flex-col gap-6 max-h-[28rem] h-auto`}>
        {isLoading && (
          <CircularProgress
            sx={{ color: "white", marginX: "auto" }}
            size={32}
          />
        )}
        {files.length > 2 && (
          <div className="w-full -mt-8 -mb-10">
            <SearchField
              placeholder={t("menu-page:searchBar.placeholder")}
              onSearch={setSearchQuery}
              isNarrow={true}
            />
          </div>
        )}

        {files.length === 0 ? (
          <p className="mt-2 text-gray-300">
            {t("workspaces:singleWorkspace:modals:filesModal.noWorkspaceFiles")}
          </p>
        ) : filteredFiles.length === 0 ? (
          <p className="mt-2 text-gray-300">
            {t("workspaces:singleWorkspace:modals:filesModal.noFoundFiles")}
          </p>
        ) : (
          <ul
            className={`flex-1 overflow-y-auto ${
              filteredFiles.length > 4 ? "mr-0" : "mr-2"
            }`}
          >
            {filteredFiles.map((file) => {
              let formattedDate = "-";
              if (file.uploadedAt) {
                const uploadedDate = new Date(file.uploadedAt);
                if (isToday(uploadedDate)) {
                  formattedDate = formatDistanceToNow(uploadedDate, {
                    addSuffix: true,
                  });
                } else {
                  formattedDate = format(uploadedDate, "PPpp");
                }
              }

              return (
                <li
                  className="flex mb-3 list-none my-1 mx-0 justify-between w-full place-items-center"
                  key={file.id}
                >
                  <div className="flex w-[70%] md:w-[80%] gap-2 place-items-center">
                    <img
                      src={FileIcon}
                      alt="Pdf file icon"
                      className="w-5 h-auto"
                    />
                    <div className="flex flex-col w-[90%] pr-2">
                      <p className="text-sm font-body font-medium w-full truncate">
                        {file.fileName}
                      </p>
                      <p className="text-xs text-gray-300 font-body font-medium w-full">
                        {formattedDate}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-end mr-5">
                    <FileLink
                      url={`${file.blobName}`}
                      title={file.fileName}
                      workspaceId={workspaceId}
                      renderAs={"icon"}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {workspaceOwner && (
          <div className="flex w-full justify-end mb-1">
            <button
              aria-label={t(files.length > 0 ? manageBtn : addBtn)}
              className="relative !z-90 flex place-content-center rounded-full px-3 py-2 text-[14px] bg-white-200
              hover:bg-red-700 hover:text-white-100 font-body text-gray-600 font-semibold 
              transition-colors transition-background duration-300 ease-in-out 
              place-items-center"
              onClick={() => navigate(`/workspaces/${workspaceId}/edit`)}
            >
              {files.length > 0 ? manageBtn : addBtn}
            </button>
          </div>
        )}
      </div>
    </ModalContainer>
  );
};

export default FilesModal;
