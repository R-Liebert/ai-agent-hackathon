import ModalContainer from "../Global/ModalContainer";
import { CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { WorkspaceDetailsResponse } from "../../models/workspace-model";
import { workspacesService } from "../../services/workspacesService";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import EntraIdUserProfilePicture from "./entraid-user-profile-picture"; // Import the profile picture component
import { useTranslation } from "react-i18next";
import { TbCrown } from "react-icons/tb";

type WorkspaceDetailsProps = {
  isOpen: boolean;
  workspaceId: string;
  onClose: () => void;
};

const WorkspaceDetails = ({
  workspaceId,
  onClose,
  isOpen,
}: WorkspaceDetailsProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

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

  const isScrollable =
    (workspaceDetails?.description?.length || 0) > 300 &&
    (workspaceDetails?.members?.length || 0) > 6;

  const modalHeight = isScrollable
    ? "h-[28rem] overflow-y-auto my-4"
    : "h-auto my-3";

  const ignoreUserId = workspaceDetails?.createdBy.id;
  const workspaceMembers =
    workspaceDetails?.members.filter((x) => x.id != ignoreUserId) ?? [];

  return (
    <ModalContainer
      open={isOpen}
      title={`About ${workspaceDetails?.name}`}
      onClose={onClose}
      width="max-w-lg"
    >
      <div className={`w-full flex flex-col gap-6 ${modalHeight}`}>
        {isLoading && (
          <CircularProgress
            sx={{ color: "white", marginX: "auto" }}
            size={32}
          />
        )}
        {workspaceDetails && (
          <div className="flex !font-body flex-col gap-6">
            {workspaceDetails.createdBy && (
              <div className="flex place-items-center gap-3">
                <EntraIdUserProfilePicture
                  user={workspaceDetails.createdBy} // Use the profile picture component for the owner
                  width={32}
                  height={32}
                  fallback={
                    <div className="rounded-full w-8 h-8 bg-white-100 flex text-lg font-bold place-items-center place-content-center text-gray-600 font-headers">
                      {workspaceDetails.createdBy.displayName
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  }
                />
                <p>Created by: {workspaceDetails.createdBy.displayName}</p>
              </div>
            )}

            {workspaceDetails.description !== null && (
              <div className="flex flex-col gap-1">
                <p className="font-body text-md w-full text-white-100">
                  Description
                </p>
                <p className="text-gray-300">{workspaceDetails.description}</p>
              </div>
            )}

            {workspaceMembers?.length > 0 && (
              <div className="flex flex-col gap-3">
                <p className="font-body text-md w-full text-white-100 capitalize">
                  {workspaceMembers.length > 1
                    ? `${t(
                        "workspaces:singleWorkspace:modals:aboutModal:membersQty.plural"
                      )}`
                    : `${t(
                        "workspaces:singleWorkspace:modals:aboutModal:membersQty.single"
                      )}`}
                </p>
                <div className="flex flex-wrap gap-3">
                  {workspaceMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex rounded-full py-[4px] pl-2 pr-3 bg-gray-400 gap-2 place-items-center place-content-center !text-[15px] relative"
                    >
                      <EntraIdUserProfilePicture // Use the profile picture component for members
                        user={member}
                        width={30}
                        height={30}
                        fallback={
                          <div className="w-7 h-7 rounded-full bg-white-100 flex items-center justify-center text-gray-600 !font-bold text-md !font-headers">
                            {member.displayName?.charAt(0).toUpperCase()}
                          </div>
                        }
                      />
                      {member.isOwner && (
                        <span className="absolute bottom-[3px] left-[29px] z-6 bg-red-800 h-4 w-4 rounded-full flex place-items-center place-content-center">
                          <TbCrown size={13} />
                        </span>
                      )}
                      <p
                        className={`${
                          member.isOwner ? "ml-[4px]" : "ml-1"
                        } text-white-100`}
                      >
                        {member.displayName} {member.isOwner ? `(Admin)` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ModalContainer>
  );
};

export default WorkspaceDetails;
