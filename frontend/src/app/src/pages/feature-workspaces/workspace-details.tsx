import { useNavigate, useParams } from "react-router-dom";
import { t } from "i18next";
import { ChatComponent } from "../../components/Chat/ChatComponent";
import { workspacesService } from "../../services/workspacesService";
import {
  ProcessStatusResponse,
  WorkspaceDetailsResponse,
  WorkspaceProcessingStatusResponse,
} from "../../models/workspace-model";
import { Query, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import Loader from "../../components/app-loader";
import { useCallback, useEffect } from "react";
import { IoLayers } from "react-icons/io5";
import { Helmet } from "react-helmet-async";
import { toTitleCase } from "../../utils/stringUtils";
import { useWorkspaces } from "../../hooks/useWorkspaces";

// Utility function to handle capitalization and Title Case
const formatTitle = (title: string) => {
  const isCapitalized = title === title.toUpperCase();
  if (isCapitalized) {
    return title;
  }
  return title
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const WorkspaceDetailsPage = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { workspaces } = useWorkspaces();

  const {
    data: workspaceDetails,
    isLoading,
    error,
    isError,
  } = useQuery<WorkspaceDetailsResponse, AxiosError>({
    queryKey: ["workspace-details", workspaceId],
    queryFn: () => workspacesService.get(workspaceId!),
    enabled: !!workspaceId,
    retry: (_, error) => {
      return error?.request?.status != 403;
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: true,
  });

  // Fetch processing status
  const {
    data: processingStatus,
    error: processingError,
    isError: isProcessingError,
    isFetching: isProcessingFetching,
  } = useQuery<ProcessStatusResponse, AxiosError>({
    queryKey: ["workspace-processing-status", workspaceId],
    queryFn: () => workspacesService.getProcessingStatus(workspaceId!),
    enabled:
      !!workspaceDetails && workspaceDetails.processingStatus !== "Completed",
    refetchInterval: (query: Query<ProcessStatusResponse, AxiosError>) => {
      const data = query.state.data;
      if (
        data?.processingStatus === "Completed" ||
        data?.processingStatus === "Failed"
      ) {
        return false; // Stop polling
      }
      // Poll more frequently during active processing
      if (data?.processingStatus === "Processing") {
        return 5000; // 5 seconds
      }
      return 10000; // 10 seconds for Pending state
    },
    refetchOnWindowFocus: false,
  });

  // Use useEffect to handle side effects based on processingStatus
  useEffect(() => {
    if (
      processingStatus?.processingStatus === "Completed" ||
      processingStatus?.processingStatus === "Failed"
    ) {
      // Refetch workspace details to update processingStatus
      queryClient.invalidateQueries({
        queryKey: ["workspace-details", workspaceId],
      });
    }
  }, [processingStatus, queryClient, workspaceId]);

  // Handle processing status error
  useEffect(() => {
    if (isProcessingError) {
      console.error("Error fetching processing status", processingError);
      // Optionally, you can stop polling by invalidating the query
      queryClient.invalidateQueries({
        queryKey: ["workspace-processing-status", workspaceId],
      });
    }
  }, [isProcessingError, processingError, queryClient, workspaceId]);

  // Do not block render with a full-screen loader; render page with inline loading states instead

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

  // Determine if processing is still ongoing
  const isProcessing = workspaceDetails?.processingStatus !== "Completed";

  const predefinedPrompts = workspaceDetails?.conversationStarters?.map((x) => {
    return { icon: "", description: x.content };
  });

  return (
    <>
      <Helmet>
        <title>
          {workspaceDetails
            ? `${formatTitle(workspaceDetails.name)} - AI Launchpad`
            : "DSB AI Launchpad"}
        </title>
        <meta
          name="description"
          content={
            workspaceDetails
              ? `Details for workspace  ${toTitleCase(workspaceDetails.name)}`
              : "Workspace Details Page"
          }
        />
      </Helmet>
      <ChatComponent
        Icon={IoLayers}
        chatType="Workspace"
        workspaceId={workspaceId}
        workspaceImage={workspaceDetails?.imageUrl}
        moduleName={workspaceDetails?.name}
        accentColor={workspaceDetails?.color}
        isModelSelectable={false}
        owner={workspaceDetails?.createdBy}
        detailsLoading={isLoading}
        isProcessing={isProcessing}
        predefinedPrompts={predefinedPrompts}
        advancedFileAnalysis={workspaceDetails?.advancedFileAnalysis}
        workspaceFiles={workspaceDetails?.files}
        showWelcome={true}
        userWorkspaces={workspaces}
      />
    </>
  );
};

export default WorkspaceDetailsPage;
