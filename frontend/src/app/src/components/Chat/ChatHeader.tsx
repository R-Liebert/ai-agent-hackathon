import React, {
  useState,
  useContext,
  useEffect,
  useCallback,
  forwardRef,
  useMemo,
} from "react";
import MainNav from "../MainNavigation/MainNavigation";
import { UnsentAttachmentsSummary } from "./ChatInput";
import WorkspaceDropdown from "../Workspaces/workspace-dropdown";
import { useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import Tooltip from "../Global/Tooltip";
import { useTranslation } from "react-i18next";
import { TbPencilStar, TbChevronRight } from "react-icons/tb";
import { SelectedValueContext } from "../../contexts/SelectedValueContext";
import { ChatModel } from "../../models/chat-model";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../../services/axiosInstance";
import { useWorkspaces } from "../../hooks/useWorkspaces";
import CanvasNavButtons from "../Canvas/CanvasNavButtons";
import JobPostNavButtons from "../../components/JobPostCreator/JobPostNavButtons";
import CanvasOptionButton from "../../components/Canvas/CanvasOptionButton";
import CanvasHeaderTitle from "../Canvas/CanvasHeaderTitle";
import { useCanvas } from "../../hooks/useCanvas";
import { useJobPost } from "../../hooks/useJobPost";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { ChatHistoryComponent } from "./ChatHistory";
import { ChatHistoryDto, ChatHistoryRef } from "../../interfaces/interfaces";
import NewChatBtn from "../../assets/icons/newchat-btn";

interface ChatHeaderProps {
  title: string;
  hasHistory: boolean;
  handleChatExport: (
    chatId: string,
    chatType: string,
    workspaceId?: string,
    fileName?: string
  ) => Promise<void>;
  newChatSession: () => void;
  workspaceId?: string | undefined;
  moduleName?: string;
  detailsLoading?: boolean;
  isModelSelectable?: boolean;
  isTemporaryChat: boolean;
  currentChat?: ChatHistoryDto | null;
  handleReturnWorkspaces?: () => void;
  hasAttachedFiles?: boolean;
  unsentAttachmentsSummary?: UnsentAttachmentsSummary;
  conversationHasDocuments?: boolean;
  conversationHasImages?: boolean;
  onSelectChat: (chat: ChatHistoryDto) => void;
  onDeleteChat: (chat: ChatHistoryDto) => void;
  onNewChat: () => void;
  type: string;
}

// Function to fetch models
const useModelData = (isModelSelectable: boolean) => {
  const { t, i18n } = useTranslation("common");

  return useQuery<ChatModel[]>({
    queryKey: ["modelData", isModelSelectable, i18n.language],
    queryFn: async () => {
      if (!isModelSelectable) return [];

      const response = await axiosInstance.get<ChatModel[]>("/chat/models");

      const translatedModels = t("models", { returnObjects: true }) as Array<{
        key: string;
        description: string;
        name: string;
      }>;

      return response.data.map((model) => {
        const translatedModel = translatedModels.find(
          (m) => m.key === model.key
        );
        return {
          ...model,
          description: translatedModel?.description || model.description,
          name: translatedModel?.name || model.name,
        };
      });
    },
    enabled: isModelSelectable,
    staleTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: true,
  });
};

const ChatHeader = forwardRef<ChatHistoryRef, ChatHeaderProps>(
  (props, historyRef) => {
    // Destructure props inside the function
    const {
      title,
      hasHistory,
      workspaceId,
      moduleName,
      detailsLoading,
      isModelSelectable = false,
      currentChat,
      hasAttachedFiles = false,
      unsentAttachmentsSummary,
      conversationHasDocuments,
      conversationHasImages,
      handleChatExport,
      onSelectChat,
      onDeleteChat,
      onNewChat,
      type,
    } = props;

    // Your existing logic...
    const {
      isCanvasMode,
      handleCloseCanvas,
      handleNavigateCanvas,
      isStreamingCanvasContent,
      handleRename,
    } = useCanvas();

    const { isHeaderBackgroundRemoved, isGeneratedJobPost } = useJobPost();
    const isDesktop = useMediaQuery("(min-width: 900px)");
    const [showChevron, setShowChevron] = useState(false);
    const navigate = useNavigate();
    const { accounts } = useMsal();
    const accountID = accounts[0].localAccountId;
    const [isWorkspaceOwner, setIsWorkspaceOwner] = useState<boolean>(false);
    const { selectedValue, setSelectedValue } =
      useContext(SelectedValueContext);
    const { t, i18n } = useTranslation();
    const [isHistoryVisible, setIsHistoryVisible] = useState(true);

    const chatId = currentChat?.id;

    // Fetch model data
    const { data: modelDataSource = [], isLoading: isModelLoading } =
      useModelData(isModelSelectable);

    const { workspaces } = useWorkspaces();

    // Initialize the selected model if not already selected
    useEffect(() => {
      if (modelDataSource.length > 0 && !selectedValue) {
        const defaultModelItem = modelDataSource.find(
          (item) => item.defaultModel === true
        );
        const initialSelectedValue =
          defaultModelItem?.key ?? modelDataSource[0].key;
        setSelectedValue(initialSelectedValue);
      }
    }, [modelDataSource, selectedValue, setSelectedValue]);

    useEffect(() => {
      if (workspaceId && workspaces) {
        const workspace = workspaces.find((w) => w.id === workspaceId);
        if (workspace) {
          const workspaceOwners = workspace.members.filter((x) => x.isOwner);
          const workspaceOwner =
            workspaceOwners.find((x) => x.id == accountID) != null;
          setIsWorkspaceOwner(workspaceOwner);
        }
      }
    }, [workspaceId, workspaces]);

    const memoizedOnNewChat = useCallback(() => {
      onNewChat();
    }, [onNewChat]);

    // Memoized props for MainNav to avoid unnecessary re-renders/remounts
    const historyTitleMemo = useMemo(
      () =>
        hasHistory ? (
          <button
            className="flex items-center gap-1 ml-3 mt-5 mb-2 text-gray-300 focus:outline-none"
            onMouseEnter={() => setShowChevron(true)}
            onMouseLeave={() => setShowChevron(false)}
            onClick={() => setIsHistoryVisible((v) => !v)}
            aria-expanded={isHistoryVisible}
            aria-label={t("components:chatHistoryComponent.titleAriaLabel")}
          >
            <span className="flex font-body text-sm">
              {" "}
              {t("components:chatHistoryComponent.title")}
            </span>
            {showChevron && (
              <TbChevronRight
                size={16}
                className={`transform transition-transform duration-200 ${
                  isHistoryVisible ? "rotate-90" : ""
                }`}
              />
            )}
          </button>
        ) : null,
      [hasHistory, t, isHistoryVisible, showChevron]
    );

    const workspaceActionsMemo = useMemo(
      () =>
        workspaceId ? (
          <WorkspaceDropdown
            name={moduleName || ""}
            workspaceId={workspaceId}
            isLoading={detailsLoading}
            chatId={chatId}
          />
        ) : null,
      [workspaceId, moduleName, detailsLoading, chatId]
    );

    const moduleNameMemo = useMemo(
      () =>
        !isModelSelectable &&
        !workspaceId &&
        moduleName !== t("dsb-history:chatDialogueBox.title") &&
        moduleName !== t("leader-chat:menuAppBar.title") ? (
          <div
            className={` font-medium${
              isCanvasMode ? "hidden lg:flex" : "flex ml-4 mt-1"
            }`}
          >
            <span
              className={`font-medium ${
                isCanvasMode ? "ml-4 hidden md:flex" : ""
              } pt-1`}
            >
              {moduleName}
            </span>
          </div>
        ) : null,
      [isModelSelectable, workspaceId, moduleName, t, isCanvasMode]
    );

    const canvasOptionsMemo = useMemo(
      () =>
        isCanvasMode && isDesktop ? (
          <CanvasOptionButton
            moduleName={moduleName}
            size={24}
            positionFixed={true}
          />
        ) : null,
      [isCanvasMode, isDesktop, moduleName]
    );

    const canvasTitleMemo = useMemo(
      () =>
        isCanvasMode ? (
          <CanvasHeaderTitle
            onRename={handleRename}
            handleCloseCanvas={handleCloseCanvas}
          />
        ) : null,
      [isCanvasMode, handleRename, handleCloseCanvas]
    );

    const buttonRightMemo = useMemo(
      () =>
        workspaceId ? (
          <>
            <button
              className={`${
                isWorkspaceOwner ? "right-[5.5rem]" : "right-12"
              } flex cursor-pointer outline-none height-auto width-auto fixed top-2 p-2 rounded-lg z-[99] active:outline-none active:ring-6 active:ring-opacity-10 active:ring-transparent hover:bg-gray-600 hover:text-superwhite transition-all duration-300 ease-out`}
              aria-label={t("components:tooltips:newChatIcon")}
              onClick={onNewChat}
            >
              <div className="relative group">
                <NewChatBtn />
                <Tooltip
                  text="components:tooltips:newChatIcon"
                  position="-right-3 -bottom-10"
                />
              </div>
            </button>

            {isWorkspaceOwner && (
              <button
                className="flex cursor-pointer outline-none height-auto width-auto fixed top-2 right-12 p-2 rounded-lg z-[99] active:outline-none active:ring-6 active:ring-opacity-10 active:ring-transparent hover:bg-gray-600 hover:text-superwhite transition-all duration-300 ease-out"
                aria-label={t("workspaces:edit:editButton")}
                onClick={() => navigate(`/workspaces/${workspaceId}/edit`)}
              >
                <div className="relative group">
                  <TbPencilStar
                    size={22}
                    strokeWidth={1.4}
                    className="text-superwhite"
                  />
                  <Tooltip
                    text="workspaces:edit:editButton"
                    position="-right-3 -bottom-10"
                  />
                </div>
              </button>
            )}
          </>
        ) : isCanvasMode ? (
          <CanvasNavButtons moduleName={moduleName} />
        ) : !isCanvasMode &&
          isGeneratedJobPost &&
          !isStreamingCanvasContent &&
          moduleName == t("job-post-creator:moduleName") ? (
          <JobPostNavButtons onEditClick={handleNavigateCanvas} />
        ) : null,
      [
        workspaceId,
        t,
        onNewChat,
        isWorkspaceOwner,
        navigate,
        isCanvasMode,
        moduleName,
        isGeneratedJobPost,
        isStreamingCanvasContent,
        handleNavigateCanvas,
      ]
    );

    return (
      <div>
        <MainNav
          isHeaderBackgroundRemoved={isHeaderBackgroundRemoved}
          handleNewChat={memoizedOnNewChat}
          title={title}
          historyTitle={historyTitleMemo}
          type={hasHistory ? type : undefined}
          onSelectChat={hasHistory ? onSelectChat : undefined}
          onDeleteChat={hasHistory ? onDeleteChat : undefined}
          handleChatExport={hasHistory ? handleChatExport : undefined}
          historyRef={historyRef}
          workspaceId={workspaceId}
          workspaceActions={workspaceActionsMemo}
          moduleName={moduleNameMemo}
          isModelSelectable={isModelSelectable}
          canvasOptions={canvasOptionsMemo}
          canvasTitle={canvasTitleMemo}
          buttonRight={buttonRightMemo}
          hasAttachedFiles={hasAttachedFiles}
          unsentAttachmentsSummary={unsentAttachmentsSummary}
          conversationHasDocuments={conversationHasDocuments}
          conversationHasImages={conversationHasImages}
          isHistoryVisible={isHistoryVisible}
        />
      </div>
    );
  }
);

export default ChatHeader;
