import React, { useState, useEffect } from "react";
import {
  CircularProgress,
  Checkbox,
  FormControlLabel,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import ModalContainer from "../Global/ModalContainer";
import { FiCheckCircle, FiThumbsDown, FiThumbsUp, FiX } from "react-icons/fi";
import Tooltip from "../Global/Tooltip";
import { motion, AnimatePresence } from "framer-motion";

interface MessageRatingProps {
  selectedIcon: string | null;
  onIconClick: (
    iconType: string,
    userMessage: string,
    consent: boolean,
    editedAssistantMessage?: string
  ) => void;
  dialogMessage?: string;
  renderCard?: boolean;
  messageDate?: string;
  messageId?: string;
  assistantContent?: string;
  chatId?: string;
  /** Agent information for agent-generated messages */
  agent?: { id: string; name: string };
}

const MessageRating: React.FC<MessageRatingProps> = ({
  selectedIcon,
  onIconClick,
  dialogMessage = "Please provide your comments about this message.",
  renderCard = false,
  messageDate,
  messageId,
  assistantContent,
  chatId,
  agent,
}) => {
  const [open, setOpen] = useState(false);
  const [userMessage, setUserMessage] = useState("");
  const messageMaxLength = 1500;
  const [localSelectedIcon, setLocalSelectedIcon] = useState<string | null>(
    null
  );
  const [isError, setIsError] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [showCard, setShowCard] = useState(true);
  const [showThankYou, setShowThankYou] = useState(false);
  const [consentValue, setConsentValue] = useState<boolean | null>(null);
  const [editAssistantEnabled, setEditAssistantEnabled] = useState(false);
  const [editedAssistantMessage, setEditedAssistantMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const SUCCESS_STATE_DURATION_MS = 2200;

  const { t } = useTranslation();

  // Storage constants and helpers
  const STORAGE_PREFIX = "messageRating";

  type RatingStatus = "up" | "down" | "dismissed";

  const buildStorageKey = (id: string, input: string | Date) => {
    const d = typeof input === "string" ? new Date(input) : input;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${STORAGE_PREFIX}:${id}:${y}-${m}-${day}`;
  };

  const getStoredStatus = (key: string): RatingStatus | null => {
    try {
      const v = localStorage.getItem(key);
      if (v === "up" || v === "down" || v === "dismissed") return v;
      return null;
    } catch {
      return null;
    }
  };

  const setStoredStatus = (key: string, value: RatingStatus) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore storage errors (e.g., private mode)
    }
  };

  // Default date to now if not provided
  const effectiveMessageDate = React.useMemo(
    () => messageDate ?? new Date().toISOString(),
    [messageDate]
  );

  const isToday = () => {
    return (
      new Date().toDateString() ===
      new Date(effectiveMessageDate).toDateString()
    );
  };

  // Control whether to hide card once answered today.
  const HIDE_CARD_IF_ALREADY_ANSWERED_TODAY = true;

  // CHANGED: Initialize showCard based on storage status
  useEffect(() => {
    // Only apply card-visibility control for today's messages when renderCard is true
    if (!renderCard || !isToday()) {
      return;
    }

    // if messageId is missing, just show the card normally
    if (!messageId) {
      setShowCard(true);
      return;
    }

    const key = buildStorageKey(messageId, effectiveMessageDate);
    const status = getStoredStatus(key);

    // Hide card if already answered/dismissed today, else show
    setShowCard(HIDE_CARD_IF_ALREADY_ANSWERED_TODAY ? status === null : true);
  }, [messageId, effectiveMessageDate, renderCard]);

  // Keep thank-you visible briefly
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (showThankYou) {
      timeout = setTimeout(() => {
        setShowThankYou(false);
      }, SUCCESS_STATE_DURATION_MS);
    }
    return () => clearTimeout(timeout);
  }, [showThankYou, SUCCESS_STATE_DURATION_MS]);

  const handleOpen = (iconType: string) => {
    setLocalSelectedIcon(iconType);
    setOpen(true);
    setEditAssistantEnabled(false);
    setEditedAssistantMessage(assistantContent ?? "");
  };

  const handleClose = () => {
    setOpen(false);
    setUserMessage("");
    setLocalSelectedIcon(null);
    setConsentValue(null);
    setEditAssistantEnabled(false);
    setEditedAssistantMessage("");
    setIsSubmitting(false);
  };

  // Modal submit: do NOT write to localStorage.
  const handleSend = async (
    iconType: string,
    userMessage: string,
    consent: boolean
  ) => {
    setIsSubmitting(true);
    setIsError(false);
    try {
      await Promise.resolve(
        onIconClick(
          iconType,
          userMessage,
          consent,
          editAssistantEnabled ? editedAssistantMessage : undefined
        )
      );

      if (renderCard && messageId) {
        const key = buildStorageKey(messageId, effectiveMessageDate);
        setStoredStatus(key, iconType === "up" ? "up" : "down");
      }
      if (renderCard) {
        setShowCard(false);
        setShowThankYou(true);
      }

      setIsSent(true);

      setTimeout(() => {
        handleClose();
        setIsSent(false);
      }, SUCCESS_STATE_DURATION_MS);
    } catch (error) {
      console.error("Error sending feedback:", error);
      setIsError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Card thumbs open modal to capture explicit consent
  const handleCardClick = (iconType: string) => {
    handleOpen(iconType);
  };

  const closeCard = () => {
    setShowCard(false);
  };

  const dialogMessageTrans =
    t("components:messageRating.dialog.dialogMessage") ?? dialogMessage;

  const canEditAssistant = !!chatId;
  const isEditedMessageInvalid =
    editAssistantEnabled && editedAssistantMessage.trim().length === 0;
  const isSendDisabled =
    consentValue === null || isEditedMessageInvalid || isSubmitting;

  // Only show rating card for today's message.
  if (!isToday() && renderCard) {
    return null;
  }

  return (
    <div className="flex items-center">
      {showThankYou ? (
        <AnimatePresence>
          <motion.div
            className="mx-auto mb-8 flex items-center gap-2 rounded-xl border border-emerald-700/60 bg-emerald-950/40 px-4 py-2 text-emerald-100 font-body"
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            role="status"
            aria-live="polite"
          >
            <FiCheckCircle size={16} />
            {t("components:feedbackComponent.feedbackDialog.thankYouMessage")}
          </motion.div>
        </AnimatePresence>
      ) : isToday() && renderCard ? (
        showCard ? (
          <div className="mx-auto flex justify-center items-center mb-8 relative border-2 border-gray-500 pl-4 rounded-xl">
            <span>{t("components:feedbackComponent.feedbackCard.title")}</span>
            <div className="flex gap-1 ml-3 border-r-2 border-gray-500">
              <Tooltip
                text={t("common:chatActionIconTooltips.goodResponse")}
                useMui
              >
                <button
                  aria-label={t("common:chatActionIconTooltips.goodResponse")}
                  className="group relative p-3 text-white-100 bg-transparent text-white-100 hover:bg-gray-600 hover:text-superwhite flex items-center justify-center"
                  onClick={() => handleCardClick("up")}
                >
                  <FiThumbsUp size={16} />
                </button>
              </Tooltip>

              <Tooltip
                text={t("common:chatActionIconTooltips.badResponse")}
                useMui
              >
                <button
                  aria-label={t("common:chatActionIconTooltips.badResponse")}
                  className="group relative p-3 text-white-100 bg-transparent text-white-100 hover:bg-gray-600 hover:text-superwhite flex items-center justify-center"
                  onClick={() => handleCardClick("down")}
                >
                  <FiThumbsDown size={16} />
                </button>
              </Tooltip>
            </div>
            <Tooltip
              text={t("components:feedbackComponent.feedbackCard.close")}
              useMui
            >
              <button
                aria-label={t(
                  "components:feedbackComponent.feedbackCard.title"
                )}
                className="group relative p-3 text-white-100 bg-transparent text-white-100 hover:bg-gray-600 hover:text-superwhite rounded-tr-xl rounded br-xl flex items-center justify-center"
                onClick={closeCard}
              >
                <FiX size={16} />
              </button>
            </Tooltip>
          </div>
        ) : null
      ) : (
        <>
          <Tooltip
            text={t("common:chatActionIconTooltips.goodResponse")}
            useMui
          >
            <button
              aria-label={t("common:chatActionIconTooltips.goodResponse")}
              className="group relative h-8 w-8 text-white-100 bg-transparent text-white-100 hover:bg-gray-600 hover:text-superwhite rounded-lg flex items-center justify-center"
              onClick={() => handleOpen("up")}
            >
              <FiThumbsUp size={16} />
            </button>
          </Tooltip>

          <Tooltip text={t("common:chatActionIconTooltips.badResponse")} useMui>
            <button
              aria-label={t("common:chatActionIconTooltips.badResponse")}
              className="group relative h-8 w-8 text-white-100 bg-transparent text-white-100 hover:bg-gray-600 hover:text-superwhite rounded-lg flex items-center justify-center"
              onClick={() => handleOpen("down")}
            >
              <FiThumbsDown size={16} />
            </button>
          </Tooltip>

          {open && (
            <ModalContainer
              open={open}
              title={t("components:messageRating.dialog.title")}
              onClose={handleClose}
              width="max-w-md"
            >
              <div className="w-full flex flex-col">
                {isError ? (
                  <p className="font-body text-[16px] py-3 px-3 mb-1 rounded-xl border border-red-900/60 bg-red-950/30 text-red-100">
                    {t(
                      "components:feedbackComponent.feedbackDialog.errorMessage"
                    )}
                  </p>
                ) : isSent ? (
                  <motion.div
                    className="w-full flex flex-col items-center text-center py-4 px-2"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    role="status"
                    aria-live="polite"
                  >
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-emerald-700/70 bg-emerald-950/40 text-emerald-200">
                      <FiCheckCircle size={24} />
                    </div>
                    <p className="font-body text-[16px] text-superwhite">
                      {t(
                        "components:feedbackComponent.feedbackDialog.thankYouMessage"
                      )}
                    </p>
                    <div className="mt-4 h-[4px] w-full rounded-full bg-gray-600 overflow-hidden">
                      <motion.div
                        className="h-full bg-emerald-400"
                        initial={{ width: "100%" }}
                        animate={{ width: "0%" }}
                        transition={{
                          duration: SUCCESS_STATE_DURATION_MS / 1000,
                          ease: "linear",
                        }}
                      />
                    </div>
                  </motion.div>
                ) : (
                  <div>
                    <div>
                      <p className="font-body text-[15px] my-3 text-white-100">
                        {dialogMessageTrans}
                      </p>
                      <TextField
                        autoFocus
                        margin="dense"
                        id="user-message"
                        label={t("components:messageRating.userMessage.label")}
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={userMessage}
                        onChange={(e) => setUserMessage(e.target.value)}
                        multiline
                        rows={4}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            color: "#DEDEDE !important",
                            "& fieldset": {
                              borderColor: "#3A3A3D !important",
                              borderWidth: "1.8px !important",
                              borderRadius: "14px",
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: "#DEDEDE !important",
                              borderWidth: "1.8px !important",
                            },
                            fontFamily: "'Nunito Sans', sans-serif!important",
                          },
                          "& .MuiInputLabel-root": {
                            color: "#89898E",
                            fontFamily: "'Nunito Sans', sans-serif!important",
                            fontSize: "14px",
                          },
                          "& .MuiInputLabel-root.Mui-focused": {
                            color: "#DEDEDE!important",
                            fontSize: "18px",
                            backgroundColor: "transparent!important",
                            paddingRight: "8px!important",
                          },
                        }}
                        className="!font-body"
                      />
                      <div className="!font-body text-gray-300 text-xs mt-2">
                        {userMessage.length}/{messageMaxLength}
                      </div>

                      {/* Optional assistant response edit */}
                      <div className="mt-5">
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={editAssistantEnabled}
                              onChange={(e) =>
                                setEditAssistantEnabled(e.target.checked)
                              }
                              disabled={!canEditAssistant}
                              sx={{
                                color: "#89898E",
                                "&.Mui-checked": {
                                  color: "#EDEDED",
                                },
                              }}
                            />
                          }
                          label={t("components:messageRating.assistantEdit.label")}
                          sx={{
                            "& .MuiFormControlLabel-label": {
                              color: "#DEDEDE",
                              fontFamily: "'Nunito Sans', sans-serif",
                              fontSize: "14px",
                            },
                          }}
                        />
                        <Typography
                          sx={{
                            color: "#89898E",
                            fontFamily: "'Nunito Sans', sans-serif",
                            fontSize: "12px",
                            mb: editAssistantEnabled ? 1.5 : 0,
                          }}
                        >
                          {canEditAssistant
                            ? t("components:messageRating.assistantEdit.helper")
                            : t(
                                "components:messageRating.assistantEdit.disabled"
                              )}
                        </Typography>

                        {editAssistantEnabled && (
                          <>
                            <TextField
                              margin="dense"
                              id="assistant-message-edit"
                              label={t(
                                "components:messageRating.assistantEdit.fieldLabel"
                              )}
                              type="text"
                              fullWidth
                              variant="outlined"
                              value={editedAssistantMessage}
                              onChange={(e) =>
                                setEditedAssistantMessage(e.target.value)
                              }
                              multiline
                              rows={6}
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  color: "#DEDEDE !important",
                                  "& fieldset": {
                                    borderColor: "#3A3A3D !important",
                                    borderWidth: "1.8px !important",
                                    borderRadius: "14px",
                                  },
                                  "&.Mui-focused fieldset": {
                                    borderColor: "#DEDEDE !important",
                                    borderWidth: "1.8px !important",
                                  },
                                  fontFamily:
                                    "'Nunito Sans', sans-serif!important",
                                },
                                "& .MuiInputLabel-root": {
                                  color: "#89898E",
                                  fontFamily:
                                    "'Nunito Sans', sans-serif!important",
                                  fontSize: "14px",
                                },
                                "& .MuiInputLabel-root.Mui-focused": {
                                  color: "#DEDEDE!important",
                                  fontSize: "18px",
                                  backgroundColor: "transparent!important",
                                  paddingRight: "8px!important",
                                },
                              }}
                              className="!font-body"
                            />
                            {isEditedMessageInvalid && (
                              <Typography
                                sx={{
                                  color: "#89898E",
                                  fontFamily: "'Nunito Sans', sans-serif",
                                  fontSize: "12px",
                                  mt: 1,
                                  fontStyle: "italic",
                                }}
                              >
                                {t(
                                  "components:messageRating.assistantEdit.required"
                                )}
                              </Typography>
                            )}
                          </>
                        )}
                      </div>

                      {/* Consent Selection */}
                      <div className="mt-5">
                        <Typography
                          sx={{
                            color: "#DEDEDE",
                            fontFamily: "'Nunito Sans', sans-serif",
                            fontSize: "14px",
                            mb: 1.5,
                          }}
                        >
                          {t("components:messageRating.consent.question")}
                        </Typography>
                        <ToggleButtonGroup
                          value={consentValue}
                          exclusive
                          onChange={(_e, newValue: boolean | null) => {
                            if (newValue !== null) {
                              setConsentValue(newValue);
                            }
                          }}
                          aria-label="consent selection"
                          sx={{
                            display: "flex",
                            gap: 1,
                            "& .MuiToggleButton-root": {
                              flex: 1,
                              border: "1.5px solid #3A3A3D",
                              borderRadius: "10px !important",
                              color: "#89898E",
                              fontFamily: "'Nunito Sans', sans-serif",
                              fontSize: "14px",
                              textTransform: "none",
                              py: 1,
                              "&:hover": {
                                backgroundColor: "rgba(255, 255, 255, 0.05)",
                                borderColor: "#565869",
                              },
                              "&.Mui-selected": {
                                backgroundColor: "rgba(255, 255, 255, 0.1)",
                                borderColor: "#EDEDED",
                                color: "#EDEDED",
                                "&:hover": {
                                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                                },
                              },
                            },
                          }}
                        >
                          <ToggleButton value={true} aria-label="yes consent">
                            {t("components:messageRating.consent.yes")}
                          </ToggleButton>
                          <ToggleButton value={false} aria-label="no consent">
                            {t("components:messageRating.consent.no")}
                          </ToggleButton>
                        </ToggleButtonGroup>
                        {consentValue === null && (
                          <Typography
                            sx={{
                              color: "#89898E",
                              fontFamily: "'Nunito Sans', sans-serif",
                              fontSize: "12px",
                              mt: 1,
                              fontStyle: "italic",
                            }}
                          >
                            {t("components:messageRating.consent.required")}
                          </Typography>
                        )}
                      </div>
                    </div>
                    <div className="flex w-full justify-end pb-2 ml-auto gap-3 mt-8">
                      <button
                        aria-label={t(
                          "components:feedbackComponent.buttons.cancel"
                        )}
                        className="flex place-content-center place-items-center rounded-full px-3 py-2 text-[14px] border-2 border-gray-350 font-medium bg-gray-600 text-white-100 hover:bg-gray-400 hover:text-superwhite focus:bg-gray-650 focus:text-white-100 font-body"
                        onClick={handleClose}
                        disabled={isSubmitting}
                      >
                        {t("components:messageRating.buttons.cancel")}
                      </button>
                      <button
                        aria-label={t(
                          "components:feedbackComponent.buttons.send"
                        )}
                        className={`flex place-content-center rounded-full px-3 py-2 text-[14px] font-body font-semibold transition-color transition-background duration-300 ease-in-out place-items-center ${
                          !isSendDisabled
                            ? "bg-white-200 hover:bg-red-700 hover:text-white-100 text-gray-600"
                            : "bg-gray-500 text-gray-400 cursor-not-allowed"
                        }`}
                        onClick={() =>
                          handleSend(localSelectedIcon!, userMessage, consentValue ?? false)
                        }
                        disabled={isSendDisabled}
                      >
                        {isSubmitting ? (
                          <>
                            <CircularProgress
                              size={14}
                              sx={{ color: "#DEDEDE", mr: 1 }}
                            />
                            Sending...
                          </>
                        ) : (
                          t("components:feedbackComponent.buttons.send")
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </ModalContainer>
          )}
        </>
      )}
    </div>
  );
};

export default MessageRating;
