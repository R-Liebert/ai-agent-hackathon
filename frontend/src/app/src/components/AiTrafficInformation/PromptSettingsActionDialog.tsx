import ModalContainer from "../Global/ModalContainer";
import React, { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { notificationsService } from "../../services/notificationsService";
import {
  PromptSettingsDialogProps,
  TabKey,
  SystemPrompts,
} from "../../types/trafficInformation";
import { usePersistedTab } from "../../hooks/usePersistedTab";
import { getTabDisplayName } from "../../utils/tabDisplayNames";

const PromptSettingsActionDialog = ({
  open,
  title,
  cancelBtn,
  confirmBtn,
  onCancel,
  onConfirm,
  onClose,
  systemPrompts,
  updateSystemPrompts,
  isLoadingPrompts,
  refreshSystemPrompts,
}: PromptSettingsDialogProps) => {
  const { t } = useTranslation();

  const tabs: TabKey[] = ["DSB.dk", "Tavle 7", "Infoskaerm"];

  // Validate function to ensure saved tab is valid
  const validateTab = (value: unknown): value is TabKey => {
    return typeof value === "string" && tabs.includes(value as TabKey);
  };

  const { activeTab, setActiveTab } = usePersistedTab({
    defaultValue: "Tavle 7" as TabKey,
    storageKey: "activeTab",
    validate: validateTab,
  });

  // Local state for editing
  const [prompts, setPrompts] = useState(
    systemPrompts || {
      "DSB.dk": "",
      "Tavle 7": "",
      Infoskaerm: "",
    }
  );

  // Update local prompts when system prompts change
  useEffect(() => {
    if (systemPrompts) {
      setPrompts(systemPrompts);
    }
  }, [systemPrompts]);

  // Refresh prompts when dialog opens
  useEffect(() => {
    if (open && refreshSystemPrompts) {
      refreshSystemPrompts();
    }
  }, [open, refreshSystemPrompts]);

  const debounce = <T extends (...args: any[]) => void>(
    fn: T,
    delay: number
  ): T => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return ((...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    }) as T;
  };

  type PromptsType = { [key: string]: string };

  const debouncedSavePrompt = useCallback(
    debounce((updatedPrompts: PromptsType) => {
      localStorage.setItem("systemPrompts", JSON.stringify(updatedPrompts));
    }, 500),
    []
  );

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const updatedPrompts = { ...prompts, [activeTab]: e.target.value };
    setPrompts(updatedPrompts);
    debouncedSavePrompt(updatedPrompts);
  };

  const handleUpdate = async () => {
    if (!prompts[activeTab]?.trim()) {
      notificationsService.error(
        t("traffic-information:promptSettingsActionDialog.notifications.error")
      );
      return;
    }
    try {
      if (updateSystemPrompts) {
        await updateSystemPrompts(prompts);
        notificationsService.success(
          t(
            "traffic-information:promptSettingsActionDialog.notifications.success"
          )
        );
      }
      onConfirm();
    } catch {
      notificationsService.error(
        t("traffic-information:promptSettingsActionDialog.notifications.error")
      );
    }
  };

  return (
    <>
      <ModalContainer
        open={open}
        title={title}
        onClose={onClose}
        width="max-w-lg"
      >
        <div>
          {/* Tabs */}
          <div className="flex py-3 space-x-4">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`py-[.5rem] px-4 !font-body text-[15px] rounded-xl ${
                  activeTab === tab
                    ? "bg-superwhite font-semibold text-gray-700"
                    : "bg-gray-400 font-medium text-gray-300 hover:text-white-100"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {getTabDisplayName(tab)}
              </button>
            ))}
          </div>
          {/* Content */}
          <div className="my-4 max-h-[70vh] overflow-y-auto">
            <textarea
              aria-label={t(
                "traffic-information:promptSettingsActionDialog.textareaLabel",
                {
                  tab: getTabDisplayName(activeTab),
                }
              )}
              className="w-full bg-transparent outline-none focus:border-white-200 border border-gray-500 rounded-xl p-4 text-md text-white-100 h-[40vh] placeholder:text-gray-300"
              value={prompts[activeTab] || ""}
              onChange={handlePromptChange}
              placeholder="Add your system prompt here...."
              disabled={isLoadingPrompts || false}
            />
          </div>
        </div>
        <div className="w-full flex flex-col h-auto border-none outline-none">
          <div></div>
          <div className="flex w-full justify-end py-2 place-content-center gap-4">
            <button
              aria-label={cancelBtn}
              className="flex place-content-center place-items-center rounded-full px-3 py-2 text-[14px] border-2 border-gray-350 font-medium bg-gray-600 text-white-100 hover:bg-gray-400 hover:text-superwhite
              focus:bg-gray-650 focus:text-white-100 font-body"
              onClick={onCancel}
            >
              {cancelBtn}
            </button>
            <button
              aria-label={confirmBtn}
              className="text-gray-700 hover:text-white-100 !text-md font-body flex place-content-center place-items-center rounded-full px-3 py-2 text-[14px] bg-white-100 hover:bg-red-700 font-semibold transition-color duration-300 ease-in-out"
              onClick={handleUpdate}
              disabled={isLoadingPrompts || false}
            >
              {confirmBtn}
            </button>
          </div>
        </div>
      </ModalContainer>
    </>
  );
};

export default PromptSettingsActionDialog;
