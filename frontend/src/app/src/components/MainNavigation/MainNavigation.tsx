import React, {
  useState,
  useContext,
  memo,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Profile from "./Profile";
import { ChatModel } from "../../models/chat-model";
import { SelectedValueContext } from "../../contexts/SelectedValueContext";
import { useMsGraphApi } from "../../services/graph";
import { useTranslation } from "react-i18next";
import { useRouteChanger } from "../../utils/navigation";
import axiosInstance from "../../services/axiosInstance";
import { useMsal } from "@azure/msal-react";
import { useQuery } from "@tanstack/react-query";
import ModelSelector from "../Chat/ChatModelSelector";
import { UnsentAttachmentsSummary } from "../Chat/ChatInput";
import launchpadMetrics from "../../services/launchpadMetrics";
import { notificationsService } from "../../services/notificationsService";
import featureHighlightService from "../../services/featureHighlightService";
import {
  getModelSupportsFiles,
  getModelSupportsDocuments,
  getModelSupportsImages,
  getModelsForSelector,
} from "../../models/models-config";
import FeedbackButton from "./FeedbackButton";
import {
  TbSchool,
  TbSearch,
  TbSparkles,
  TbStack2,
  TbMenu2,
  TbTrafficCone,
  TbTransactionDollar,
  TbApiApp,
  TbDashboard,
} from "react-icons/tb";
import { PiStackPlus } from "react-icons/pi";
import NewChatBtn from "../../assets/icons/newchat-btn";
import { v4 as uuidv4 } from "uuid";
import Sidebar from "./Sidebar";
import useSidebarStore from "../../stores/navigationStore";
import { getTransitionStyle } from "../../utils/navigation";
import SearchDialog from "./components/SearchChatsModal";
import RecentWorkspaces from "../Chat/RecentWorkspaces";
import { IconBaseProps } from "react-icons";
import { useLocation } from "react-router-dom";
import Tooltip from "../Global/Tooltip";
import { useScrollStore } from "../../stores/scrollStore";
import { useCanUseTrafficInformation } from "../../contexts/AuthProvider";
import StickyWarning from "../sticky-warning";
import useAgentsStore from "../../stores/agentsStore";
import { useSubscriptionsStore } from "../../stores/maasStore";

export const isChatRoute = (path: string) => {
  const CHAT_ROUTE_PREFIXES = ["/dsb-chat", "/workspaces/"];
  return CHAT_ROUTE_PREFIXES.some((p) => path.startsWith(p));
};

interface TopBarProps {
  title: string;
  hideHomeBtn?: boolean;
  buttons?: React.ReactNode;
  buttonRight?: React.ReactNode;
  select?: React.ReactNode;
  isModelSelectable?: boolean;
  workspaceId?: string | null;
  isWorkspace?: boolean;
  workspaceActions?: React.ReactNode;
  moduleName?: React.ReactNode;
  hasAttachedFiles?: boolean;
  unsentAttachmentsSummary?: UnsentAttachmentsSummary;
  conversationHasDocuments?: boolean;
  conversationHasImages?: boolean;
  isHeaderBackgroundRemoved?: boolean;
  canvasOptions?: React.ReactNode;
  canvasTitle?: React.ReactNode;
  handleNewChat?: () => void;
  historyTitle?: React.ReactNode;
  // History bindings (prefer passing data/handlers over React elements to avoid remounts)
  type?: string;
  onSelectChat?: (chat: any) => void;
  onDeleteChat?: (chat: any) => void;
  handleChatExport?: (
    chatId: string,
    chatType: string,
    workspaceId?: string,
    fileName?: string,
  ) => Promise<void>;
  historyRef?: React.Ref<any>;
  isHistoryVisible?: boolean;
}

const useProfileData = () => {
  const { getUserPhoto, getUserInfo } = useMsGraphApi();
  const { accounts } = useMsal();

  return useQuery({
    queryKey: ["profileData", accounts[0]?.localAccountId],
    queryFn: async () => {
      const [photo, info] = await Promise.all([getUserPhoto(), getUserInfo()]);
      return { photo, name: info.fullName };
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
};

const useModelData = (isModelSelectable: boolean) => {
  const { t, i18n } = useTranslation("common");

  return useQuery<ChatModel[]>({
    queryKey: ["modelData", isModelSelectable, i18n.language],
    queryFn: async () => {
      if (!isModelSelectable) return [];

      // Get models from API first to ensure we have the latest configuration
      const response = await axiosInstance.get<ChatModel[]>("/chat/models");

      // Get our local configuration that includes metadata
      const localModels = getModelsForSelector();

      // Match the API models with our local config
      // This ensures we only show models that exist on the server
      const availableModels = response.data.map((apiModel) => {
        // Find the matching local model
        const localModel = localModels.find((m) => m.key === apiModel.key);
        return localModel || apiModel;
      });

      const translatedModels = t("models", { returnObjects: true }) as Array<{
        key: string;
        description: string;
        name: string;
      }>;

      return availableModels.map((model) => {
        const translatedModel = translatedModels.find(
          (m) => m.key === model.key,
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

const MemoizedProfile = memo(Profile);

export default function MainNav({
  buttons,
  moduleName,
  buttonRight,
  select,
  isModelSelectable = false,
  workspaceActions,
  hasAttachedFiles = false,
  unsentAttachmentsSummary,
  conversationHasDocuments,
  conversationHasImages,
  isHeaderBackgroundRemoved,
  canvasOptions,
  canvasTitle,
  handleNewChat,
  historyTitle,
  type,
  onSelectChat,
  onDeleteChat,
  handleChatExport,
  workspaceId,
  historyRef,
  isHistoryVisible,
}: TopBarProps) {
  const { changeRoute } = useRouteChanger();
  const selectedModelValueContext = useContext(SelectedValueContext);
  const { selectedValue, setSelectedValue } = selectedModelValueContext;
  const { isSidebarOpen, toggleSidebar, closeSidebar } = useSidebarStore();
  const { selectedAgent } = useAgentsStore();
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const isWorkspacesPath = location.pathname === "/workspaces";
  const canUseTrafficInformation = useCanUseTrafficInformation();
  const beginCreateFlow = useSubscriptionsStore((s) => s.beginCreateFlow);
  const isAdmin = useSubscriptionsStore((s) => s.admin.isAdmin);

  // Mobile detection - needed to disable transition style on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // sm breakpoint
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const {
    data: profileData,
    isLoading: isProfileLoading,
    error: profileError,
  } = useProfileData();
  const {
    data: modelDataSource = [],
    isLoading: isModelLoading,
    error: modelError,
  } = useModelData(!!isModelSelectable);

  const { accounts } = useMsal();
  const userId = useMemo(() => accounts[0]?.localAccountId, [accounts]);
  const { t, i18n } = useTranslation();
  const isAgentModelLockActive = type === "Normal" && !!selectedAgent;
  const isModelSelectorInteractive =
    !!isModelSelectable && !isAgentModelLockActive;
  const defaultModelKey =
    modelDataSource.find((item) => item.defaultModel)?.key ??
    modelDataSource[0]?.key;

  // Add a reference to the model selector button
  const modelSelectorRef = useRef<HTMLDivElement>(null);

  // Check and show model highlight for new models
  useEffect(() => {
    // Only proceed if we have models and the user hasn't seen the highlight yet
    if (!isModelSelectable || !modelDataSource || modelDataSource.length === 0)
      return;

    // Watch for when loading finishes
    if (
      isModelLoading === false &&
      !featureHighlightService.hasUserSeenFeature(
        "new-models-2025",
        userId || "unknown",
      )
    ) {
      // Short delay to ensure rendering is complete
      const timeoutId = setTimeout(() => {
        // Use translations from i18n
        const titleText = t("components:featureHighlights.newModels.title");
        const descriptionText = t(
          "components:featureHighlights.newModels.description",
        );
        const buttonText = t(
          "components:featureHighlights.newModels.buttonText",
        );

        // Show the highlight using the new API
        featureHighlightService.showElementHighlight(
          [
            {
              elementId: "model-selector-button",
              title: titleText,
              description: descriptionText,
              side: "bottom",
              align: "start",
            },
          ],
          {
            featureId: "new-models-2025",
            userId: userId || "unknown",
            buttonText: buttonText,
          },
        );
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [isModelSelectable, modelDataSource, isModelLoading, userId, t]);

  React.useEffect(() => {
    if (modelDataSource.length > 0 && !selectedValue) {
      // Find the default model as specified in our models config
      const defaultModelItem = modelDataSource.find(
        (item) => item.defaultModel === true,
      );
      const initialSelectedValue =
        defaultModelItem?.key ?? modelDataSource[0].key;
      setSelectedValue(initialSelectedValue);
    }
  }, [modelDataSource, selectedValue, setSelectedValue]);

  React.useEffect(() => {
    if (!isModelSelectable || !isAgentModelLockActive) return;
    if (!defaultModelKey) return;
    if (selectedValue === defaultModelKey) return;
    setSelectedValue(defaultModelKey);
  }, [
    isModelSelectable,
    isAgentModelLockActive,
    selectedValue,
    defaultModelKey,
    setSelectedValue,
  ]);

  const handleModelChange = useCallback(
    (value: string) => {
      if (isAgentModelLockActive) return;

      // Block switching if there are unsent or conversation document attachments and the target model doesn't support documents
      if (unsentAttachmentsSummary?.hasDocuments) {
        if (!getModelSupportsDocuments(value)) {
          notificationsService.error(
            t("components:topBar.incompatibleModelError"),
          );
          return;
        }
      }

      if (conversationHasDocuments) {
        if (!getModelSupportsDocuments(value)) {
          notificationsService.error(
            t("components:topBar.incompatibleModelError"),
          );
          return;
        }
      }

      // Block switching if there are images (unsent or in conversation) and target model doesn't support images
      if (unsentAttachmentsSummary?.hasImages || conversationHasImages) {
        if (!getModelSupportsImages(value)) {
          notificationsService.error(
            t("components:topBar.incompatibleModelError"),
          );
          return;
        }
      }

      setSelectedValue(value);
      launchpadMetrics.track({
        metric: "launchpad_ui_model_selection_click_count",
        labels: {
          model: value,
        },
      });
    },
    [
      setSelectedValue,
      unsentAttachmentsSummary?.hasDocuments,
      unsentAttachmentsSummary?.hasImages,
      conversationHasDocuments,
      conversationHasImages,
      t,
      isAgentModelLockActive,
    ],
  );

  const onCreateWorkspaceButtonClick = () => {
    const workspaceId = uuidv4();
    changeRoute(`/workspaces/${workspaceId}/create`);
  };

  const WrappedNewChatBtn: React.FC<IconBaseProps> = (props) => {
    return <NewChatBtn {...props} />;
  };
  const mainNavLinks = useMemo(() => {
    const links = [
      {
        label: t("components:mainNavigation.menu.label"),
        Icon: TbApiApp,
        onClick: () => changeRoute("/"),
        tooltipText: "components:mainNavigation.menu.tooltipText",
      },
      // {
      //   label: t("components:mainNavigation.search.label"),
      //   Icon: TbSearch,
      //   onClick: () => setShowSearchModal(true),
      //   tooltipText: "components:mainNavigation.search.tooltipText",
      // },
      {
        label: t("components:mainNavigation.newChat.label"),
        Icon: WrappedNewChatBtn,
        onClick: () => {
          changeRoute("/dsb-chat");
          if (handleNewChat) handleNewChat();
        },
        tooltipText: "components:mainNavigation.newChat.tooltipText",
      },
      {
        label: t("components:mainNavigation.newJobPost.label"),
        Icon: TbSchool,
        onClick: () => changeRoute("/job-post-creator"),
        tooltipText: "components:mainNavigation.newJobPost.tooltipText",
      },
      {
        label: t("components:mainNavigation.workspacesList.label"),
        Icon: TbStack2,
        onClick: () => changeRoute("/workspaces"),
        tooltipText: "components:mainNavigation.workspacesList.tooltipText",
      },
      ...(canUseTrafficInformation
        ? [
            {
              label: t("components:mainNavigation.aiTrafficInformation.label"),
              Icon: TbTrafficCone,
              onClick: () => changeRoute("/ai-traffic-information"),
              tooltipText:
                "components:mainNavigation.aiTrafficInformation.tooltipText",
            },
          ]
        : []),
      /*
      {
        label: t("components:mainNavigation.createSubscription.label"),
        Icon: TbTransactionDollar,
        onClick: () => {
          const { path } = beginCreateFlow();
          changeRoute(path);
        },
        tooltipText: "components:mainNavigation.createSubscription.tooltipText",
      },
      */

      {
        label: t("components:mainNavigation.modelsDiscovery.label"),
        Icon: TbSparkles,
        onClick: () => changeRoute("/maas"),
        tooltipText: "components:mainNavigation.modelsDiscovery.tooltipText",
      },
      ...(isAdmin
        ? [
            {
              label: t("components:mainNavigation.adminDashboard.label"),
              Icon: TbDashboard,
              onClick: () => changeRoute("/maas/dashboard"),
              tooltipText:
                "components:mainNavigation.adminDashboard.tooltipText",
            },
          ]
        : []),
    ];

    return links;
  }, [changeRoute, handleNewChat, t, canUseTrafficInformation]);

  // Only apply transition style on desktop/tablet, not mobile
  const transitionStyle = isMobile ? {} : getTransitionStyle(isSidebarOpen);

  const { showBorder, setShowBorder, setShowArrow, setScrollPosition } =
    useScrollStore();

  // Turn off the border/arrow for non-chat routes on every route change
  useEffect(() => {
    const path = location.pathname || "";
    const chatRoute =
      path.startsWith("/dsb-chat") || path.startsWith("/workspaces/");
    if (!chatRoute) {
      setShowBorder(false);
      setShowArrow(false);
      setScrollPosition(0);
    }
  }, [location.pathname, setShowBorder, setShowArrow, setScrollPosition]);

  console.log(isAdmin);

  return (
    <>
      <Box id="header" sx={{ flexGrow: 1 }}>
        <AppBar
          style={{
            backgroundColor: !isHeaderBackgroundRemoved
              ? "#212121"
              : "transparent",
            boxShadow: "none",
            transition: "transform .5s ease-in-out",
            paddingTop: "6px",
            paddingBottom: "6px",
            zIndex: "102",
            borderBottom: showBorder
              ? "1.4px solid #2F2F2F"
              : "1.4px solid transparent",
          }}
        >
          {/* Slim rail moved into Sidebar component */}
          <div
            className={`${
              isMobile
                ? "ml-0 px-2 justify-start"
                : "ml-12 px-4 justify-between"
            } w-full mr-auto flex flex-start align-flex-start`}
          >
            {/* Mobile hamburger menu - only visible on mobile */}
            {isMobile && (
              <button
                className="p-2 hover:bg-gray-600 rounded-lg flex items-center justify-center"
                onClick={toggleSidebar}
                aria-label="Open navigation menu"
              >
                <TbMenu2 size={24} strokeWidth={1.5} />
              </button>
            )}

            <div className="w-auto flex flex-wrap flex-start align-flex-start">
              <div
                style={transitionStyle}
                className={`w-auto flex-wrap flex align-center place-center items-center ${
                  isModelSelectable || workspaceActions ? " mb-3 md:mb-0" : ""
                }`}
              >
                {buttons}
                {moduleName}
                {select}
              </div>
              <div className={`${workspaceActions ? "w-[28rem]" : "w-auto"}`}>
                {workspaceActions}
                {isModelSelectable && (
                  <div
                    id="model-selector-container"
                    className="h-full"
                    ref={modelSelectorRef}
                  >
                    <ModelSelector
                      models={modelDataSource}
                      selectedValue={selectedValue}
                      onChange={(value: string) => {
                        handleModelChange(value);
                      }}
                      isModelSelectable={isModelSelectorInteractive}
                      hasAttachedFiles={hasAttachedFiles}
                      hasUnsentDocumentAttachments={
                        unsentAttachmentsSummary?.hasDocuments
                      }
                      conversationHasDocuments={
                        conversationHasDocuments || false
                      }
                      conversationHasImages={conversationHasImages || false}
                      isLoading={isModelLoading}
                    />
                  </div>
                )}
                {/*Create workspace button*/}
                {isWorkspacesPath && (
                  <button
                    className="flex place-items-center cursor-pointer outline-none height-auto width-auto px-3 pt-[4px] pb-[6px] mt-[3px] rounded-lg z-[99] active:outline-none  active:ring-transparent hover:bg-gray-600 hover:text-superwhite transition-all duration-300 ease-out"
                    aria-label={t("workspaces:listing:mainButton")}
                    onClick={onCreateWorkspaceButtonClick}
                  >
                    <span className="mr-2 font-semibold">
                      {t("workspaces:create.createButton")}
                    </span>
                    <PiStackPlus
                      size={20}
                      className="text-gray-300 hover:text-white-100 transition-all duration-300 ease-out"
                    />
                  </button>
                )}
              </div>
              {canvasOptions}
            </div>
            {canvasTitle}
            {/* Right-side elements - push to right on mobile with ml-auto */}
            <div className="ml-auto flex items-center gap-2">
              {buttonRight && <>{buttonRight}</>}
              {isMobile && type === "Normal" && (
                <Tooltip text={t("components:tooltips:newChatIcon")} useMui>
                  <button
                    className={`hover:bg-gray-600 bg-transparent flex cursor-pointer outline-none height-auto width-auto fixed top-2 right-12 p-2 rounded-lg z-[99] hover:text-superwhite transition-all duration-300 ease-out`}
                    aria-label={t("components:tooltips:newChatIcon")}
                    onClick={handleNewChat}
                  >
                    <NewChatBtn />
                  </button>
                </Tooltip>
              )}
              <FeedbackButton />
            </div>
          </div>
          {/*Sidebar - always mounted to avoid re-opening animation on route changes*/}
          <Sidebar
            isOpen={isSidebarOpen}
            handleSidebarClose={closeSidebar}
            handleSidebarOpen={useCallback(
              () => toggleSidebar(),
              [toggleSidebar],
            )}
            aria-expanded={isSidebarOpen}
            mainNavLinks={mainNavLinks}
            historyTitle={historyTitle}
            recentWorkspaces={<RecentWorkspaces onNewChat={handleNewChat} />}
            type={type}
            workspaceId={workspaceId || undefined}
            onSelectChat={onSelectChat}
            onDeleteChat={onDeleteChat}
            handleChatExport={handleChatExport}
            historyRef={historyRef}
            profileName={profileData?.name}
            profilePhoto={profileData?.photo}
            userId={userId}
            isHistoryVisible={isHistoryVisible}
          />
        </AppBar>
        <StickyWarning />
      </Box>
      {showSearchModal && (
        <SearchDialog
          open={showSearchModal}
          onClose={() => setShowSearchModal(false)}
        />
      )}
    </>
  );
}
