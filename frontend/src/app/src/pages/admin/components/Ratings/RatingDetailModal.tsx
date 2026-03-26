import React from "react";
import {
  Box,
  Typography,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
} from "@mui/material";
import {
  TbThumbUp,
  TbThumbDown,
  TbQuestionMark,
  TbCheck,
  TbX,
  TbRobot,
  TbUser,
  TbLock,
  TbExternalLink,
  TbAlertTriangle,
  TbDatabase,
  TbChevronLeft,
  TbChevronRight,
} from "react-icons/tb";
import ModalContainer from "../../../../components/Global/ModalContainer";
import { AdminRatingDetailDto } from "../../../../services/admin/types/adminRatings.types";
import { UserRating } from "../../../../models/message-rating.types";
import { UI_TEXT, STYLES } from "../../constants";

interface RatingDetailModalProps {
  open: boolean;
  onClose: () => void;
  rating: AdminRatingDetailDto | null;
  isLoading: boolean;
  error: Error | null;
}

const RatingDetailModal: React.FC<RatingDetailModalProps> = ({
  open,
  onClose,
  rating,
  isLoading,
  error,
}) => {
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getRatingIcon = (userRating: UserRating) => {
    switch (userRating) {
      case UserRating.ThumbsUp:
        return <TbThumbUp size={24} color={STYLES.SUCCESS_COLOR} />;
      case UserRating.ThumbsDown:
        return <TbThumbDown size={24} color={STYLES.ERROR_COLOR} />;
      default:
        return <TbQuestionMark size={24} color={STYLES.WARNING_COLOR} />;
    }
  };

  const ContentSection: React.FC<{
    title: string;
    content: string | null;
    isRedacted?: boolean;
    redactionReason?: string;
  }> = ({ title, content, isRedacted = false, redactionReason }) => (
    <Box sx={{ mb: 3 }}>
      <Typography
        variant="subtitle2"
        sx={{
          color: "#9ca3af",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          mb: 1,
        }}
      >
        {title}
      </Typography>
      {isRedacted ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            p: 2,
            backgroundColor: "rgba(151, 122, 36, 0.1)",
            border: "1px solid rgba(151, 122, 36, 0.3)",
            borderRadius: 1,
          }}
        >
          <TbLock size={18} color={STYLES.WARNING_COLOR} />
          <Typography variant="body2" sx={{ color: STYLES.WARNING_COLOR }}>
            {redactionReason || UI_TEXT.CONTENT_REDACTED}
          </Typography>
        </Box>
      ) : content ? (
        <Box
          sx={{
            p: 2,
            backgroundColor: "#1f1f1f",
            border: "1px solid #3A3A3D",
            borderRadius: 1,
            maxHeight: 200,
            overflow: "auto",
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: "#EDEDED", whiteSpace: "pre-wrap", wordBreak: "break-word" }}
          >
            {content}
          </Typography>
        </Box>
      ) : (
        <Typography variant="body2" sx={{ color: "#6a6a6a", fontStyle: "italic" }}>
          No content
        </Typography>
      )}
    </Box>
  );

  // Determine content visibility and redaction reason
  const getContentRedactionInfo = () => {
    if (!rating) return { isRedacted: false, reason: "" };

    // Content requires BOTH consent AND contentAvailable to be visible
    if (!rating.consent) {
      return { isRedacted: true, reason: "User did not consent to data analysis" };
    }
    if (rating.contentAvailable === false) {
      return {
        isRedacted: true,
        reason: rating.contentUnavailableReason || "Content unavailable"
      };
    }
    return { isRedacted: false, reason: "" };
  };

  const contentRedactionInfo = getContentRedactionInfo();
  const versions = rating?.assistantMessageVersions ?? null;
  const defaultVersionIndex = React.useMemo(() => {
    if (!rating || !versions || versions.length === 0) return null;

    const activeVersionIndex = versions.findIndex(
      (version) =>
        version.isActive || version.id === rating.activeAssistantMessageVersionId
    );
    if (activeVersionIndex >= 0) return activeVersionIndex;

    if (rating.activeAssistantMessageVersionId) {
      const byIdIndex = versions.findIndex(
        (version) => version.id === rating.activeAssistantMessageVersionId
      );
      if (byIdIndex >= 0) return byIdIndex;
    }
    return versions.length - 1;
  }, [rating, versions]);

  const [selectedVersionIndex, setSelectedVersionIndex] = React.useState<
    number | null
  >(defaultVersionIndex);

  React.useEffect(() => {
    setSelectedVersionIndex(defaultVersionIndex);
  }, [defaultVersionIndex]);

  const selectedVersion = React.useMemo(() => {
    if (
      !versions ||
      selectedVersionIndex === null ||
      selectedVersionIndex < 0 ||
      selectedVersionIndex >= versions.length
    ) {
      return null;
    }
    return versions[selectedVersionIndex] ?? null;
  }, [versions, selectedVersionIndex]);

  const hasMultipleVersions = !!versions && versions.length > 1;

  const canSelectOlderVersion =
    hasMultipleVersions && selectedVersionIndex !== null && selectedVersionIndex > 0;
  const canSelectNewerVersion =
    hasMultipleVersions &&
    versions &&
    selectedVersionIndex !== null &&
    selectedVersionIndex < versions.length - 1;

  const handleSelectOlderVersion = () => {
    setSelectedVersionIndex((prev) => {
      if (prev === null) return prev;
      return Math.max(0, prev - 1);
    });
  };

  const handleSelectNewerVersion = () => {
    setSelectedVersionIndex((prev) => {
      if (prev === null || !versions) return prev;
      return Math.min(versions.length - 1, prev + 1);
    });
  };

  const assistantAnswerContent = selectedVersion?.content ?? rating?.assistantAnswer ?? null;
  const selectedVersionLabel =
    selectedVersionIndex !== null && versions
      ? `Version ${selectedVersionIndex + 1} of ${versions.length}`
      : null;

  const assistantVersionMeta = React.useMemo(() => {
    if (!selectedVersion) return null;

    return {
      createdAt: formatDate(selectedVersion.createdAt),
      createdBy: selectedVersion.createdByUserId
        ? `Edited by ${selectedVersion.createdByUserId}`
        : "Edited by System",
      isActive:
        selectedVersion.isActive ||
        selectedVersion.id === rating?.activeAssistantMessageVersionId,
    };
  }, [selectedVersion, rating?.activeAssistantMessageVersionId]);

  const AssistantAnswerSection: React.FC = () => (
    <Box sx={{ mb: 3 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          mb: 1,
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            color: "#9ca3af",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Assistant Answer
        </Typography>

        {hasMultipleVersions && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton
              size="small"
              onClick={handleSelectOlderVersion}
              disabled={!canSelectOlderVersion}
              aria-label="Show older version"
              sx={{
                color: canSelectOlderVersion ? "#EDEDED" : "#6a6a6a",
                border: "1px solid #3A3A3D",
                borderRadius: 1,
                "&.Mui-disabled": {
                  color: "#8b949e",
                  borderColor: "#4b5563",
                  opacity: 1,
                },
              }}
            >
              <TbChevronLeft size={16} />
            </IconButton>
            {selectedVersionLabel && (
              <Chip
                label={selectedVersionLabel}
                size="small"
                sx={{
                  backgroundColor: "rgba(96, 165, 250, 0.15)",
                  color: "#93c5fd",
                  border: "1px solid rgba(96, 165, 250, 0.35)",
                  fontWeight: 600,
                }}
              />
            )}
            <IconButton
              size="small"
              onClick={handleSelectNewerVersion}
              disabled={!canSelectNewerVersion}
              aria-label="Show newer version"
              sx={{
                color: canSelectNewerVersion ? "#EDEDED" : "#6a6a6a",
                border: "1px solid #3A3A3D",
                borderRadius: 1,
                "&.Mui-disabled": {
                  color: "#8b949e",
                  borderColor: "#4b5563",
                  opacity: 1,
                },
              }}
            >
              <TbChevronRight size={16} />
            </IconButton>
          </Box>
        )}
      </Box>

      {contentRedactionInfo.isRedacted ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            p: 2,
            backgroundColor: "rgba(151, 122, 36, 0.1)",
            border: "1px solid rgba(151, 122, 36, 0.3)",
            borderRadius: 1,
          }}
        >
          <TbLock size={18} color={STYLES.WARNING_COLOR} />
          <Typography variant="body2" sx={{ color: STYLES.WARNING_COLOR }}>
            {contentRedactionInfo.reason || UI_TEXT.CONTENT_REDACTED}
          </Typography>
        </Box>
      ) : assistantAnswerContent ? (
        <>
          <Box
            sx={{
              p: 2,
              backgroundColor: "#1f1f1f",
              border: "1px solid #3A3A3D",
              borderRadius: 1,
              minHeight: 140,
              maxHeight: 220,
              overflow: "auto",
            }}
          >
            <Typography
              variant="body2"
              sx={{ color: "#EDEDED", whiteSpace: "pre-wrap", wordBreak: "break-word" }}
            >
              {assistantAnswerContent}
            </Typography>
          </Box>
          {assistantVersionMeta && (
            <Box sx={{ mt: 1.25, px: 0.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                  {assistantVersionMeta.createdAt}
                </Typography>
                <Chip
                  label={assistantVersionMeta.isActive ? "Active" : "Historical"}
                  size="small"
                  sx={{
                    height: 20,
                    fontWeight: 600,
                    fontSize: "0.68rem",
                    ...(assistantVersionMeta.isActive
                      ? {
                          backgroundColor: "rgba(34, 197, 94, 0.16)",
                          color: "#4ade80",
                          border: "1px solid rgba(34, 197, 94, 0.35)",
                        }
                      : {
                          backgroundColor: "rgba(148, 163, 184, 0.18)",
                          color: "#cbd5e1",
                          border: "1px solid rgba(148, 163, 184, 0.35)",
                        }),
                  }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: "#6a6a6a", display: "block" }}>
                {assistantVersionMeta.createdBy}
              </Typography>
            </Box>
          )}
        </>
      ) : (
        <Typography variant="body2" sx={{ color: "#6a6a6a", fontStyle: "italic" }}>
          No content
        </Typography>
      )}
    </Box>
  );

  return (
    <ModalContainer
      open={open}
      onClose={onClose}
      title={UI_TEXT.RATING_DETAILS}
      width="max-w-2xl"
    >
      <Box sx={{ p: 2 }}>
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress sx={{ color: "#f92a4b" }} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error.message || "Failed to load rating details"}
          </Alert>
        ) : rating ? (
          <>
            {/* Metadata Section */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 2,
                mb: 3,
              }}
            >
              {/* Rating */}
              <Box>
                <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                  Rating
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                  {getRatingIcon(rating.userRating)}
                  <Typography variant="body1" sx={{ color: "#EDEDED" }}>
                    {rating.userRatingText}
                  </Typography>
                </Box>
              </Box>

              {/* Date */}
              <Box>
                <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                  Submitted
                </Typography>
                <Typography variant="body2" sx={{ color: "#EDEDED", mt: 0.5 }}>
                  {formatDate(rating.createdDate)}
                </Typography>
              </Box>

              {/* Consent */}
              <Box>
                <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                  Consent
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                  {rating.consent ? (
                    <>
                      <TbCheck size={18} color={STYLES.SUCCESS_COLOR} />
                      <Typography variant="body2" sx={{ color: STYLES.SUCCESS_COLOR }}>
                        {UI_TEXT.CONSENTED}
                      </Typography>
                    </>
                  ) : (
                    <>
                      <TbX size={18} color={STYLES.ERROR_COLOR} />
                      <Typography variant="body2" sx={{ color: STYLES.ERROR_COLOR }}>
                        {UI_TEXT.NO_CONSENT}
                      </Typography>
                    </>
                  )}
                </Box>
              </Box>

              {/* Source */}
              <Box>
                <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                  Source
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                  {rating.generatedByAgent ? (
                    <>
                      <TbRobot size={18} color="#60a5fa" />
                      <Typography variant="body2" sx={{ color: "#EDEDED" }}>
                        {rating.agentName || "Agent"}
                      </Typography>
                    </>
                  ) : (
                    <>
                      <TbUser size={18} color="#9ca3af" />
                      <Typography variant="body2" sx={{ color: "#EDEDED" }}>
                        User
                      </Typography>
                    </>
                  )}
                </Box>
              </Box>

              {/* User ID */}
              <Box>
                <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                  User ID
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "#EDEDED",
                    fontFamily: "monospace",
                    fontSize: "0.75rem",
                    mt: 0.5,
                  }}
                >
                  {rating.userId}
                </Typography>
              </Box>

              {/* Content Available */}
              <Box>
                <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                  Content Available
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                  {rating.contentAvailable ? (
                    <>
                      <TbCheck size={18} color={STYLES.SUCCESS_COLOR} />
                      <Typography variant="body2" sx={{ color: STYLES.SUCCESS_COLOR }}>
                        Yes
                      </Typography>
                    </>
                  ) : (
                    <>
                      <TbAlertTriangle size={18} color={STYLES.WARNING_COLOR} />
                      <Typography variant="body2" sx={{ color: STYLES.WARNING_COLOR }}>
                        {rating.contentUnavailableReason || "No"}
                      </Typography>
                    </>
                  )}
                </Box>
              </Box>
            </Box>

            {/* IDs Section */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  mb: 1,
                }}
              >
                Identifiers
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 2,
                  p: 2,
                  backgroundColor: "#1f1f1f",
                  border: "1px solid #3A3A3D",
                  borderRadius: 1,
                }}
              >
                <Box>
                  <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                    Chat ID
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: rating.chatId ? "#EDEDED" : "#6a6a6a",
                      fontFamily: "monospace",
                      fontSize: "0.7rem",
                      mt: 0.5,
                      wordBreak: "break-all",
                    }}
                  >
                    {rating.chatId || "N/A (legacy rating)"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                    Message ID
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#EDEDED",
                      fontFamily: "monospace",
                      fontSize: "0.7rem",
                      mt: 0.5,
                      wordBreak: "break-all",
                    }}
                  >
                    {rating.chatMessageId}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                    Parent Message ID
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: rating.parentMessageId ? "#EDEDED" : "#6a6a6a",
                      fontFamily: "monospace",
                      fontSize: "0.7rem",
                      mt: 0.5,
                      wordBreak: "break-all",
                    }}
                  >
                    {rating.parentMessageId || "N/A"}
                  </Typography>
                </Box>
                {rating.agentId && (
                  <Box>
                    <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                      Agent ID
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#EDEDED",
                        fontFamily: "monospace",
                        fontSize: "0.7rem",
                        mt: 0.5,
                        wordBreak: "break-all",
                      }}
                    >
                      {rating.agentId}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Page URL */}
            {rating.currentPageUrl && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                  Page URL
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                  <TbExternalLink size={14} color="#60a5fa" />
                  <Typography
                    variant="body2"
                    component="a"
                    href={rating.currentPageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      color: "#60a5fa",
                      textDecoration: "none",
                      "&:hover": { textDecoration: "underline" },
                      wordBreak: "break-all",
                    }}
                  >
                    {rating.currentPageUrl}
                  </Typography>
                </Box>
              </Box>
            )}

            <Divider sx={{ borderColor: "#3A3A3D", my: 3 }} />

            {/* Content Sections */}
            <ContentSection
              title="User Question"
              content={rating.userQuestion}
              isRedacted={contentRedactionInfo.isRedacted}
              redactionReason={contentRedactionInfo.reason}
            />

            <AssistantAnswerSection />

            {/* SQL Queries Section */}
            {rating.sqlQueries && rating.sqlQueries.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: "#9ca3af",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    mb: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <TbDatabase size={16} />
                  SQL Queries ({rating.sqlQueries.length})
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.5,
                  }}
                >
                  {rating.sqlQueries.map((query, index) => (
                    <Box
                      key={index}
                      sx={{
                        p: 2,
                        backgroundColor: "#1a1a2e",
                        border: "1px solid #3A3A3D",
                        borderRadius: 1,
                        maxHeight: 200,
                        overflow: "auto",
                      }}
                    >
                      <Typography
                        variant="body2"
                        component="pre"
                        sx={{
                          color: "#e2e8f0",
                          fontFamily: "monospace",
                          fontSize: "0.8rem",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          margin: 0,
                        }}
                      >
                        {query}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            <ContentSection
              title="User Feedback Message"
              content={rating.userMessage}
            />

            {/* Redaction Notice */}
            {contentRedactionInfo.isRedacted && (
              <Alert
                severity="warning"
                icon={<TbLock />}
                sx={{
                  mt: 2,
                  backgroundColor: "rgba(151, 122, 36, 0.1)",
                  border: "1px solid rgba(151, 122, 36, 0.3)",
                  "& .MuiAlert-icon": { color: STYLES.WARNING_COLOR },
                  "& .MuiAlert-message": { color: "#EDEDED" },
                }}
              >
                {contentRedactionInfo.reason}
              </Alert>
            )}
          </>
        ) : (
          <Typography sx={{ color: "#9ca3af", textAlign: "center", py: 4 }}>
            No rating data available
          </Typography>
        )}
      </Box>
    </ModalContainer>
  );
};

export default RatingDetailModal;
