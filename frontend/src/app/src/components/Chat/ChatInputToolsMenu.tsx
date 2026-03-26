import React, { useRef, forwardRef, useImperativeHandle } from "react";
import { IoMdAttach } from "react-icons/io";
import {
  TbPhotoSpark,
  TbUserStar,
  TbCloudUpload,
  TbPlus,
} from "react-icons/tb";
import useAgentsStore from "../../stores/agentsStore";
import Tooltip from "../Global/Tooltip";

export interface ToolsMenuRef {
  openFileUpload: () => void;
  getFileInputElement: () => HTMLInputElement | null;
}

interface ToolsMenuProps {
  isAttachmentEnabled: boolean;
  totalFileCount: number;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleOneDriveSelect: () => void;
  isDropupOpen: boolean;
  setIsDropupOpen: (open: boolean) => void;
  allowedExtensionsForModel: string[];
  chatType: string;
  selectedModel?: string;
  getModelSupportsTools: (model: string) => boolean;
  isImageGeneration: boolean;
  setIsImageGeneration: (enabled: boolean) => void;
  onImageGenerationChange?: (enabled: boolean) => void;
  t: (key: string) => string;
  direction?: "up" | "down";
}

const ChatInputToolsMenu = forwardRef<ToolsMenuRef, ToolsMenuProps>(
  (
    {
      isAttachmentEnabled,
      totalFileCount,
      handleFileUpload,
      handleOneDriveSelect,
      isDropupOpen,
      setIsDropupOpen,
      allowedExtensionsForModel,
      chatType,
      selectedModel,
      getModelSupportsTools,
      isImageGeneration,
      setIsImageGeneration,
      onImageGenerationChange,
      t,
      direction = "up",
    },
    ref
  ) => {
    // Persistent off-screen input, always mounted, not display:none
    const persistentInputRef = useRef<HTMLInputElement>(null);
    const uploadButtonRef = useRef<HTMLDivElement>(null);

    const {
      setShowActiveAgentListButton,
      toggleAgentList,
      selectedAgent,
      setShowAgentList,
      clearSelectedAgent,
      showActiveAgentListButton,
      showAgentList,
      agents,
    } = useAgentsStore();

    const menuPositionClasses =
      direction === "up" ? "bottom-full mb-2" : "top-full mt-2";

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
      openFileUpload: () => {
        if (
          persistentInputRef.current &&
          isAttachmentEnabled &&
          totalFileCount < 20
        ) {
          persistentInputRef.current.click();
        }
      },
      getFileInputElement: () => persistentInputRef.current,
    }));

    return (
      <div className="relative">
        {/* Plus Icon Button - with ID for driver.js targeting */}
        <div
          id="tools-menu-upload-button"
          ref={uploadButtonRef}
          className={`flex items-start text-superwhite relative z-[101] ${
            isAttachmentEnabled ? "cursor-pointer" : ""
          }`}
          onClick={
            isAttachmentEnabled
              ? () => setIsDropupOpen(!isDropupOpen)
              : undefined
          }
        >
          <Tooltip text={t("components:chatInput.plusIconTooltip")} useMui>
            <div className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-400 active:bg-transparent">
              <TbPlus size={21} strokeWidth={2} />
            </div>
          </Tooltip>
        </div>

        {/* Permanently mounted file input (off-screen). Not display:none. */}
        <input
          id="tools-menu-file-input"
          ref={persistentInputRef}
          type="file"
          multiple
          accept={allowedExtensionsForModel.join(",")}
          onChange={handleFileUpload}
          disabled={totalFileCount >= 20 || !isAttachmentEnabled}
          style={{
            position: "fixed",
            top: -9999,
            left: -9999,
            width: 1,
            height: 1,
            opacity: 0,
          }}
          aria-hidden="true"
          tabIndex={-1}
        />

        {/* Dropup Menu */}
        {isDropupOpen && (
          <div
            id="tools-menu-dropdown"
            className={`absolute ${menuPositionClasses} left-0 w-[14.7rem] bg-gray-550 rounded-2xl shadow-md z-10 overflow-hidden`}
          >
            <div className="p-2">
              {/* Upload from Device - wired to persistent input via htmlFor */}
              <label
                id="tools-menu-device-upload"
                htmlFor="tools-menu-file-input"
                className="flex items-center gap-2 px-2 py-[10px] hover:bg-gray-450 rounded-xl cursor-pointer"
                aria-label={t("components:chatInput.uploadFromDevice")}
              >
                <IoMdAttach
                  size={20}
                  color="text-white-100"
                  strokeWidth={1.6}
                />
                <div className="flex flex-col">
                  <span className="text-sm text-white-100 hover:text-superwhite">
                    {t("components:chatInput.uploadFromDevice")}
                  </span>
                </div>
                {/* No inline input here; htmlFor triggers the persistent one */}
              </label>

              {/* OneDrive Option */}
              <div
                id="tools-menu-onedrive-upload"
                className="flex items-center gap-2 px-2 py-[10px] hover:bg-gray-450 rounded-xl cursor-pointer"
                onClick={handleOneDriveSelect}
              >
                <TbCloudUpload
                  size={22}
                  color="text-white-100"
                  strokeWidth={1.6}
                />
                <div className="flex flex-col">
                  <span className="text-sm text-white-100 hover:text-superwhite">
                    {t("components:chatInput.addFromSharepoint")}
                  </span>
                </div>
              </div>

              {/* Divider / other menu items */}
              {chatType === "Normal" &&
                !showActiveAgentListButton &&
                (getModelSupportsTools(selectedModel || "") ||
                  showActiveAgentListButton) && (
                  <div className="flex w-[94%] mx-auto h-[1.2px] bg-gray-400 my-1"></div>
                )}

              {chatType === "Normal" &&
                selectedModel &&
                getModelSupportsTools(selectedModel) &&
                !showActiveAgentListButton &&
                !selectedAgent && (
                  <div
                    className="flex items-center gap-2 px-2 py-[10px] hover:bg-gray-450 rounded-xl cursor-pointer"
                    onClick={() => {
                      const newValue = !isImageGeneration;
                      setIsImageGeneration(newValue);
                      onImageGenerationChange?.(newValue);
                      setIsDropupOpen(false);
                    }}
                  >
                    <TbPhotoSpark
                      size={20}
                      color="text-white-100"
                      strokeWidth={1.6}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm text-white-100 hover:text-superwhite">
                        {t("components:chatInput.generateImage")}
                      </span>
                    </div>
                  </div>
                )}

              {chatType === "Normal" &&
                !showActiveAgentListButton &&
                !isImageGeneration && (
                  <div
                    className="flex items-center gap-2 px-2 py-[10px] hover:bg-gray-450 rounded-xl cursor-pointer"
                    onClick={() => {
                      toggleAgentList();
                      setIsDropupOpen(false);
                      setShowActiveAgentListButton(true);
                      if (selectedAgent) {
                        clearSelectedAgent();
                        setShowAgentList(true);
                        setShowActiveAgentListButton(true);
                      }
                    }}
                  >
                    <TbUserStar
                      size={20}
                      color="text-white-100"
                      strokeWidth={1.6}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm text-white-100 hover:text-superwhite">
                        {t("components:chatInput.chooseAgent")}
                      </span>
                    </div>
                  </div>
                )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

export default ChatInputToolsMenu;
