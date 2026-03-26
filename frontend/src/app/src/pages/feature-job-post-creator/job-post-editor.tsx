import React, { useEffect, useState, useRef } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { AnimatePresence, motion } from "framer-motion";
import { ChatFooter } from "../../components/Chat/ChatFooter";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import JobPostCreatorFormItems from "../../components/JobPostCreator/JobPostCreatorFormItems";
import { notificationsService } from "../../services/notificationsService";
import { HiMiniUserGroup } from "react-icons/hi2";
import JobPostGenerated from "../../components/JobPostCreator/JobPostGenerated";
import JobPostCreatorCardToCanvas from "../../components/JobPostCreator/JobPostCreatorCardToCanvas";
import { gsap } from "gsap";
import { ChatComponent } from "../../components/Chat/ChatComponent";
import { ContentItem } from "../../contexts/CanvasContext";
import { useCanvas } from "../../hooks/useCanvas";
import { useJobPost } from "../../hooks/useJobPost";
import { useMediaQuery } from "../../hooks/useMediaQuery";

import { useNavigate, useParams } from "react-router-dom";
import jobPostService from "../../services/jobPostService";
const { generateEnhanced } = jobPostService;
import type {
  SSEEvent,
  GenerationProgressEvent,
} from "./sseEvents";
import {
  isShortPostStartEvent,
  isShortPostSectionGeneratedEvent,
  isShortPostSectionFailedEvent,
  isHeartbeatEvent,
  isShortPostSummarizingEvent,
  isShortPostSummarizationCompleteEvent,
  isSectionCompleteEvent,
  isShortPostCompleteEvent,
  isStreamErrorEvent,
} from "./sseEvents";
import { useJobPostDetails } from "../../hooks/useJobPostDetails";
import { ChatMessage } from "../../models/chat-message";
import PageTransitionContainer from "../../components/Global/PageTransitionContainer";
import useSidebarStore from "../../stores/navigationStore";
import {
  toCanonicalSection,
  getSectionLabel,
  CANONICAL_SECTIONS,
  SectionId,
} from "./sections";

/**
 * Maps backend position level (TemplateType) to UI form values
 * Backend returns integers: 0 = Specialist, 1 = Student, 2 = ShortPost
 * May also return string representations for backward compatibility
 */
const mapBackendPositionLevelToUI = (backendValue: string | number | undefined): string => {
  if (backendValue === undefined || backendValue === null) return "junior";

  // Handle integer values (as per API spec)
  if (typeof backendValue === "number") {
    switch (backendValue) {
      case 0: return "senior";    // Specialist
      case 1: return "junior";    // Student
      case 2: return "shortpost"; // ShortPost
      default: return "junior";
    }
  }

  // Handle string values (backward compatibility)
  const normalized = String(backendValue).toLowerCase();
  if (normalized === "specialist" || normalized === "0" || normalized === "senior") {
    return "senior";
  }
  if (normalized === "shortpost" || normalized === "2" || normalized === "short") {
    return "shortpost";
  }
  // Default to junior for "Junior", "Student", "1", or any other value
  return "junior";
};

const JobPostEditor: React.FC = () => {
  const { isSidebarOpen } = useSidebarStore();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery("(min-width: 899px)");
  const isAbove700px = useMediaQuery("(min-width: 700px)");
  const { jobPostId } = useParams();
  const { t } = useTranslation();

  const {
    setCurrentVersionIndex,
    setPointsToVersionIndex,
    setHasPreviousContent,
    setHasNextContent,
    setCanvasTitle,
    isCanvasMode,
    setIsCanvasMode,
    isStreamingCanvasContent,
    setIsStreamingCanvasContent,
    setContentVersions,
    documentETag,
    setDocumentETag,
    headVersionId,
    setHeadVersionId,
    setCurrentVersionId,
    setVersionCounter,
    setRedoStack,
    setSectionVersions,
    mapContentItemsToChatMessages,
    regenerateContentSignal,
    setCurrentChatMessages,
    applyUpdates,
    streamController,
  } = useCanvas();

  const {
    isGeneratedJobPost,
    setIsGeneratedJobPost,
    isLoading,
    setIsLoading,
    activeGeneratedContent,
    positionTitle,
    setPositionTitle,
    isDefaultView,
    setIsDefaultView,
    resetFormSignal,
    formSubmitted,
    setFormSubmitted,
  } = useJobPost();

  const [selectedValues, setSelectedValues] = useState({
    positionLevel: "",
    language: "",
  });
  const [loadingText, setLoadingText] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  //Static variables
  const agentAvatarColor = "#8856BB";
  const moduleName = t("job-post-creator:moduleName");
  const Icon = HiMiniUserGroup;
  const iconSize = 18;
  const [skipAnimation, setSkipAnimation] = useState(false);

  // Fetch job post details - must be called before any conditional returns (Rules of Hooks)
  const {
    jobPostDetails,
    isLoading: isJobPostDetailsLoading,
    error,
    isError,
  } = useJobPostDetails(jobPostId);

  // Streaming controller is provided via CanvasContext so Stop can cancel SSE

  // Form Validation Schema
  const validationSchema = Yup.object().shape({
    jobTitle: Yup.string().required(
      t("job-post-creator:form.jobTitle.validationMessage")
    ),
    departmentTeam: Yup.string().required(
      t("job-post-creator:form.departmentTeam.validationMessage")
    ),
    jobScope: Yup.string().required(
      t("job-post-creator:form.jobScope.validationMessage")
    ),
    qualifications: Yup.string().required(
      t("job-post-creator:form.qualifications.validationMessage")
    ),
    positionLevel: Yup.string().required(
      t("job-post-creator:form.positionLevel.validationMessage")
    ),
    language: Yup.string().required(
      t("job-post-creator:form.language.validationMessage")
    ),
  });

  // Use stable codes for language; display translated labels
  const languageOptions = [
    {
      value: "Danish",
      label: t("job-post-creator:form.language.options.da"),
    },
    {
      value: "English",
      label: t("job-post-creator:form.language.options.en"),
    },
  ];

  // Backend codes: 0 = senior/specialist, 1 = junior/student, 2 = shortpost
  const positionLevelOptions = [
    {
      value: "senior",
      label: t("job-post-creator:form.positionLevel.options.senior"),
    },
    {
      value: "junior",
      label: t("job-post-creator:form.positionLevel.options.junior"),
    },
    {
      value: "shortpost",
      label: t("job-post-creator:form.positionLevel.options.shortpost"),
    },
  ];

  const handlePositionLevelChange = (value: string) => {
    formik.setFieldValue("positionLevel", value);
    setSelectedValues((prev) => ({
      ...prev,
      positionLevel: value,
    }));
    console.log("Position Level changed to:", value);
  };

  const handleLanguageChange = (value: string) => {
    formik.setFieldValue("language", value);
    setSelectedValues((prev) => ({
      ...prev,
      language: value,
    }));
    console.log("Language changed to:", value);
  };

  // Formik for Form State Management
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      jobTitle: "",
      departmentTeam: "",
      jobScope: "",
      qualifications: "",
      positionLevel: "",
      language: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      console.log("Form submitted with values:", values);
      try {
        // Map UI enum to backend TemplateType integer: 0 = Specialist, 1 = Student, 2 = ShortPost
        const getPositionLevelCode = (level: string): number => {
          switch (level) {
            case "senior": return 0;    // Specialist
            case "junior": return 1;    // Student
            case "shortpost": return 2; // ShortPost
            default: return 1;
          }
        };

        const requestPayload = {
          jobTitle: values.jobTitle,
          departmentTeam: values.departmentTeam,
          jobScope: values.jobScope,
          qualifications: values.qualifications,
          positionLevel: getPositionLevelCode(values.positionLevel),
          language: values.language,
        };

        const jobPostUpdateResponse = await jobPostService.update(
          jobPostId!,
          requestPayload,
          { expectedETag: documentETag ?? null }
        );

        setPositionTitle(values.jobTitle);
        setSkipAnimation(true);

        applyUpdates(jobPostUpdateResponse);

        await handleGenerate(true);
        notificationsService.success(
          t("job-post-creator:notifications.generated.success")
        );
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 409) {
          const opCode = err?.response?.data?.code;
          notificationsService.warn(
            opCode === "OPERATION_IN_PROGRESS"
              ? t("job-post-creator:notifications.versioning.contention")
              : t("job-post-creator:notifications.versioning.conflict")
          );

          if (jobPostId) {
            jobPostService
              .get(jobPostId)
              .then((latest) => {
                applyUpdates(latest);
                formik.setValues({
                  jobTitle: latest.state.properties.jobTitle || "",
                  departmentTeam: latest.state.properties.departmentTeam || "",
                  jobScope: latest.state.properties.jobScope || "",
                  qualifications: latest.state.properties.qualifications || "",
                  positionLevel: mapBackendPositionLevelToUI(latest.state.properties.positionLevel),
                  language: latest.state.properties.language || "",
                });
                setPositionTitle(latest.state.properties.jobTitle);
              })
              .catch(() =>
                notificationsService.warn(
                  t("job-post-creator:notifications.versioning.refreshFailed")
                )
              );
          }
          return;
        }

        console.error("Error during form submission:", err);
        notificationsService.error(
          t(
            "job-post-creator:notifications.form.notifications.onFormSubmit.error"
          )
        );
      }
    },
  });

  const prevResetSignalRef = useRef<number>(resetFormSignal);

  useEffect(() => {
    if (resetFormSignal !== prevResetSignalRef.current) {
      prevResetSignalRef.current = resetFormSignal;
      navigate("/job-post-creator");
    }
  }, [resetFormSignal]);

  const prevRegenerateContentSignal = useRef<number>(regenerateContentSignal);

  useEffect(() => {
    if (regenerateContentSignal !== prevRegenerateContentSignal.current) {
      prevRegenerateContentSignal.current = regenerateContentSignal;
      handleGenerate(true);
    }
  }, [regenerateContentSignal]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    formik.handleSubmit();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const content = t("job-post-creator:temporaryContent.content", {
    returnObjects: true,
  }) as ContentItem[];

  const jobPostHeaders: string[] = content.map(
    (item: ContentItem) => item.header
  );

  // --------------------------------
  // Enhanced Backend Generation
  // --------------------------------
  const handleGenerate = async (force?: boolean) => {
    setIsDefaultView(false);
    setFormSubmitted(true);
    setIsCanvasMode(true);
    setIsStreamingCanvasContent(true);
    setIsGeneratedJobPost(false);
    setIsLoading(true);

    const controller = new AbortController();
    if (streamController) {
      streamController.current = controller;
    }

    // Use enhanced backend generation
    console.log("[Generation] Using enhanced backend");

    try {
      let fullContent: ContentItem[] = [];
      let receivedStreamEnded = false;
      // Track which flow is active (standard vs ShortPost)
      let isShortPostFlowActive = false;

      // Initialize content versions with all sections showing skeleton (empty text)
      const initialContent = CANONICAL_SECTIONS.map(
        (id) =>
          ({
            id,
            header: getSectionLabel(t, id),
            text: "",
          } as ContentItem)
      );
      setContentVersions(initialContent);

      await generateEnhanced(
        jobPostId!,
        force ?? false,
        (event: SSEEvent) => {
          // Log all incoming SSE events
          console.log("[SSE Generation Event]", JSON.stringify(event, null, 2));

          // Handle stream-ended (standard flow)
          if ("Content" in event && event.Content === "stream-ended") {
            receivedStreamEnded = true;
            setIsStreamingCanvasContent(false);
            setIsLoading(false);
            setIsGeneratedJobPost(true);
            return;
          }

          // ================================
          // ShortPost Flow Event Handling
          // ================================

          // ShortPost start - initialize ShortPost flow
          if (isShortPostStartEvent(event)) {
            isShortPostFlowActive = true;
            console.log("[ShortPost] Flow started:", event.Message);
            console.log("[ShortPost] Progress:", event.Progress);
            // Keep loading state, UI shows skeleton
            return;
          }

          // ShortPost section generated - track progress (content comes later via section_complete)
          if (isShortPostSectionGeneratedEvent(event)) {
            console.log(`[ShortPost] Section generated: ${event.Section}`, event.Progress);
            // No content yet - just progress tracking. Content arrives via section_complete after summarization
            return;
          }

          // ShortPost section failed - mark section as failed
          if (isShortPostSectionFailedEvent(event)) {
            console.warn(`[ShortPost] Section failed: ${event.Section}`, event.Error);
            const canonical = toCanonicalSection(event.Section);
            if (canonical) {
              const item: ContentItem = {
                id: canonical,
                header: getSectionLabel(t, canonical),
                text: "",
                failed: true,
              };
              setContentVersions((prev) =>
                prev.map((section) =>
                  section.id === canonical ? item : section
                )
              );
            }
            return;
          }

          // Heartbeat - keep-alive signal, no action needed
          if (isHeartbeatEvent(event)) {
            console.log("[ShortPost] Heartbeat:", event.Timestamp);
            // Could reset a timeout timer here if needed
            return;
          }

          // ShortPost summarizing - phase transition
          if (isShortPostSummarizingEvent(event)) {
            console.log("[ShortPost] Summarization phase started", event.Progress);
            // Could show "Condensing content..." message if desired
            return;
          }

          // ShortPost summarization complete - log status (warnings shown in shortpost_complete)
          if (isShortPostSummarizationCompleteEvent(event)) {
            console.log("[ShortPost] Summarization complete:", {
              wasSummarized: event.WasSummarized,
              warning: event.Warning,
            });
            // Note: Don't show warning here - shortpost_complete will include all warnings
            // to avoid duplicate notifications
            return;
          }

          // Section complete - actual content arrives (ShortPost streaming phase)
          if (isSectionCompleteEvent(event)) {
            const canonical = toCanonicalSection(event.Section);
            if (!canonical) {
              console.warn("[ShortPost] Unknown section:", event.Section);
              return;
            }

            console.log(`[ShortPost] Section content received: ${canonical}`);
            const item: ContentItem = {
              id: canonical,
              header: getSectionLabel(t, canonical),
              text: event.Content,
            };

            // Upsert by id
            const idx = fullContent.findIndex((i) => i.id === canonical);
            if (idx >= 0) fullContent[idx] = item;
            else fullContent.push(item);

            // Update UI immediately as each section content arrives
            setContentVersions((prev) =>
              prev.map((section) => (section.id === canonical ? item : section))
            );
            return;
          }

          // ShortPost complete - final event with payload and warnings
          if (isShortPostCompleteEvent(event)) {
            console.log("[ShortPost] Generation complete:", {
              wasSummarized: event.WasSummarized,
              failedSections: event.FailedSections,
              contentGenerated: event.ContentGenerated,
              warnings: event.Warnings,
            });

            // Show warnings to user
            if (event.Warnings && event.Warnings.length > 0) {
              event.Warnings.forEach((warning) => {
                notificationsService.warn(warning);
              });
            }

            // Show retry suggestion if content wasn't fully generated
            if (!event.ContentGenerated) {
              notificationsService.warn(
                t("job-post-creator:notifications.shortpost.retryAvailable",
                  "Some content could not be generated. You can retry generation.")
              );
            }

            // Apply the full payload if available
            // Note: Backend returns PascalCase keys, need to normalize to camelCase
            if (event.Payload) {
              const payload = event.Payload;
              const normalizedPayload = {
                jobPost: payload.JobPost || payload.jobPost,
                state: payload.State || payload.state,
                chatHistory: payload.ChatHistory || payload.chatHistory || [],
              };

              // Also normalize nested properties if they exist
              if (normalizedPayload.state) {
                const state = normalizedPayload.state;
                const rawProps = state.Properties || state.properties || {};

                // Normalize properties object (PascalCase -> camelCase)
                const normalizedProperties = {
                  positionLevel: rawProps.PositionLevel ?? rawProps.positionLevel,
                  jobTitle: rawProps.JobTitle || rawProps.jobTitle,
                  departmentTeam: rawProps.DepartmentTeam || rawProps.departmentTeam,
                  jobScope: rawProps.JobScope || rawProps.jobScope,
                  qualifications: rawProps.Qualifications || rawProps.qualifications,
                  language: rawProps.Language || rawProps.language,
                };

                normalizedPayload.state = {
                  ...state,
                  // Map PascalCase to camelCase for common fields
                  id: state.Id || state.id,
                  properties: normalizedProperties,
                  sections: state.sections || state.Sections,
                  snapshotVersion: state.SnapshotVersion || state.snapshotVersion,
                  versionCounter: state.SnapshotVersion || state.snapshotVersion || state.versionCounter,
                  canUndo: state.CanUndo ?? state.canUndo,
                  canRedo: state.CanRedo ?? state.canRedo,
                  sectionVersions: state.SectionVersions || state.sectionVersions,
                  headVersionId: state.HeadVersionId || state.headVersionId,
                  currentVersionId: state.CurrentVersionId || state.currentVersionId,
                  eTag: state.ETag || state.eTag || state.etag || state._etag,
                };
              }

              if (normalizedPayload.jobPost) {
                const jp = normalizedPayload.jobPost;
                normalizedPayload.jobPost = {
                  ...jp,
                  id: jp.Id || jp.id,
                  title: jp.Title || jp.title,
                };
              }

              console.log("[ShortPost] Normalized payload for applyUpdates:", normalizedPayload);
              applyUpdates(normalizedPayload);
            }

            setIsStreamingCanvasContent(false);
            setIsLoading(false);
            setIsGeneratedJobPost(true);
            return;
          }

          // ================================
          // Standard Flow Event Handling
          // ================================

          // Handle generation progress (standard flow)
          const genEvent = event as GenerationProgressEvent;
          if (genEvent.Section && genEvent.Content !== undefined && !isShortPostFlowActive) {
            const canonical = toCanonicalSection(genEvent.Section);
            if (!canonical) {
              console.warn("[V2] Unknown section:", genEvent.Section);
              return;
            }

            // NULL CONTENT HANDLING: Backend returns null for failed sections
            if (genEvent.Content === null || genEvent.Content === "") {
              console.warn(
                `[V2] Section ${canonical} generation failed (null content)`
              );
              const item: ContentItem = {
                id: canonical,
                header: getSectionLabel(t, canonical),
                text: "",
                failed: true, // Mark section as failed for UI handling
              };

              const idx = fullContent.findIndex((i) => i.id === canonical);
              if (idx >= 0) fullContent[idx] = item;
              else fullContent.push(item);

              // Update UI immediately to show failed state
              setContentVersions((prev) =>
                prev.map((section) =>
                  section.id === canonical ? item : section
                )
              );

              return;
            }

            const item: ContentItem = {
              id: canonical,
              header: getSectionLabel(t, canonical),
              text: genEvent.Content,
            };

            // Upsert by id
            const idx = fullContent.findIndex((i) => i.id === canonical);
            if (idx >= 0) fullContent[idx] = item;
            else fullContent.push(item);

            // Update UI immediately as each section arrives
            console.log(`[V2] Updating UI for section: ${canonical}`);
            setContentVersions((prev) =>
              prev.map((section) => (section.id === canonical ? item : section))
            );
          }

          // Handle errors (both flows)
          if (isStreamErrorEvent(event)) {
            console.error("[Generation] Error:", event);

            // Show error notification to user
            if (event.recoverable) {
              notificationsService.error(`${event.message} (You can retry)`);
            } else {
              notificationsService.error(event.message);
            }
          }
        },
        controller.signal
      );
    } catch (err) {
      console.error("[Enhanced] Generation error:", err);
      notificationsService.error(
        t("job-post-creator:notifications.stream.error")
      );
    } finally {
      setIsStreamingCanvasContent(false);
      setIsLoading(false);

      if (streamController) {
        streamController.current = null;
      }
    }
  };

  const handleFormFadeOut = () => {
    if (formRef.current) {
      const timeline = gsap.timeline();

      timeline.to(formRef.current, {
        opacity: 0,
        duration: 0.1,
        onComplete: () => {
          gsap.delayedCall(0.1, () => {
            setIsCanvasMode(true);
          });
        },
      });
    } else {
    }
  };

  const formContainerWidth =
    "w-full mx-auto md:mx-0 max-w-[36rem] lg:w-[37vw] xxl:w-[30vw]";

  const shouldRenderForm =
    (!isDesktop && !isGeneratedJobPost && !formSubmitted) ||
    (isDesktop && !isCanvasMode && !isStreamingCanvasContent);

  // Helper function for loading chat history
  const handleChatHistory = () => {
    if (!jobPostDetails) return;
    setCurrentChatMessages([]);
    jobPostService.loadChatHistory(jobPostId!).then((chatHistory) => {
      console.log(
        "[job-post-editor] 📦 RAW chatHistory from backend:",
        chatHistory
      );
      console.log(
        "[job-post-editor] 📦 RAW chatHistory JSON:",
        JSON.stringify(chatHistory, null, 2)
      );

      const chatMessages: ChatMessage[] = chatHistory.map(
        (message: any, index: number) => {
          console.log(`[job-post-editor] Message ${index + 1} RAW:`, message);
          console.log(
            `[job-post-editor] Message ${index + 1} ALL KEYS:`,
            Object.keys(message)
          );
          console.log(
            `[job-post-editor] Message ${index + 1} has selectedText?`,
            "selectedText" in message,
            message.selectedText
          );

          return new ChatMessage(
            message.id,
            message.content,
            message.role,
            new Date(message.createdAt).toISOString(),
            false,
            message.files || [],
            message.header,
            message.agent,
            message.selectedText // Include selectedText from backend
          );
        }
      );

      setCurrentChatMessages((prevMessages) => [
        ...prevMessages,
        ...chatMessages,
      ]);
    });
  };

  // Initialize job post data when details are loaded
  useEffect(() => {
    if (isJobPostDetailsLoading) {
      return;
    }

    if (!jobPostDetails || jobPostDetails == null) {
      navigate("/not-found");
      return;
    }

    setIsCanvasMode(true);

    setCanvasTitle(jobPostDetails.jobPost.title);

    setPositionTitle(jobPostDetails.state.properties.jobTitle);
    setDocumentETag(
      jobPostDetails.state.eTag ??
        jobPostDetails.state.etag ??
        jobPostDetails.state._etag ??
        null
    );

    const versionCounter =
      jobPostDetails.state.versionCounter ??
      jobPostDetails.state.snapshotVersion ??
      0;
    const redoStack = jobPostDetails.state.redoStack ?? [];

    setHeadVersionId(jobPostDetails.state.headVersionId ?? null);
    setCurrentVersionId(jobPostDetails.state.currentVersionId ?? null);
    setVersionCounter(versionCounter);
    setRedoStack(redoStack);
    setSectionVersions(jobPostDetails.state.sectionVersions ?? {});

    setCurrentVersionIndex(versionCounter);
    setPointsToVersionIndex(versionCounter);

    setHasPreviousContent(
      typeof jobPostDetails.state.canUndo === "boolean"
        ? jobPostDetails.state.canUndo
        : versionCounter > 1
    );
    setHasNextContent(redoStack.length > 0 || !!jobPostDetails.state.canRedo);

    formik.setValues({
      jobTitle: jobPostDetails.state.properties.jobTitle || "",
      departmentTeam: jobPostDetails.state.properties.departmentTeam || "",
      jobScope: jobPostDetails.state.properties.jobScope || "",
      qualifications: jobPostDetails.state.properties.qualifications || "",
      positionLevel: mapBackendPositionLevelToUI(jobPostDetails.state.properties.positionLevel),
      language: jobPostDetails.state.properties.language || "",
    });

    handleGenerate(false);
    handleChatHistory();
  }, [jobPostDetails, isJobPostDetailsLoading, setDocumentETag]);

  if (!jobPostId || jobPostId.length === 0) {
    navigate("/job-post-creator");
    return null;
  }

  if (isError) return <div>Error: {error?.message}</div>;

  return (
    <>
      <Helmet>
        <title>{t("job-post-creator:moduleName")} - AI Launchpad</title>
        <meta name="description" content={t("job-post-creator:description")} />
      </Helmet>
      <PageTransitionContainer>
        <div className={`min-h-screen w-full overflow-y-visible`}>
          <AnimatePresence>
            <motion.div
              className="xxxl:w-[90rem] xxl:w-[82rem] lg:w-[76vw] lg:w-[82%] w-[90%] mx-auto pt-16 pb-4 flex flex-col relative overflow-y-visible"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              <ChatComponent
                Icon={Icon}
                chatType="JobPost"
                accentColor={agentAvatarColor}
                moduleName={moduleName}
                iconSize={iconSize}
                loadingText={loadingText}
                isModelSelectable={false}
                showWelcome={false}
                isExternalApplicationWithCanvas={true}
              />
              <div className="w-full flex flex-col md:flex-row gap-0 md:gap-12 xxl:gap-0 flex-col justify-between mx-auto !relative">
                {/* ----- Left Panel ----- */}
                <div className={`${formContainerWidth} flex flex-col relative`}>
                  {/* Form Section => Disappears once the Card expands */}
                  {shouldRenderForm && jobPostDetails != null && (
                    <form
                      ref={formRef}
                      onSubmit={handleFormSubmit}
                      className="w-full flex flex-col pb-[11rem]"
                    >
                      <JobPostCreatorFormItems
                        formik={formik}
                        languageOptions={languageOptions}
                        positionLevelOptions={positionLevelOptions}
                        handleLanguageChange={handleLanguageChange}
                        handlePositionLevelChange={handlePositionLevelChange}
                      />
                      <button
                        type="submit"
                        data-testid="submit-button"
                        className={`mx-auto md:mx-0 ${
                          isSidebarOpen
                            ? "!w-[calc(46vw-5.8rem)] md:!w-[calc(42vw-5.8rem)] xl:!w-[calc(40.8vw-5.8rem)] xxl:!w-[30vw] max-w-[38rem]"
                            : "!w-[calc(46vw-3.8rem)] lg:!w-[calc(42vw-3.8rem)] xl:!w-[calc(39vw-3.8rem)] xxl:!w-[30vw] max-w-[38rem]"
                        } fixed bottom-6 md:bottom-8 z-10 flex mt-16 text-md font-body py-[.9em] bg-white-100 hover:bg-red-600 hover:text-white-100 text-gray-700 font-semibold transition-color duration-300 ease-out rounded-full text-center place-content-center`}
                        aria-label={t(
                          "job-post-creator:form.buttons.regenerateButton"
                        )}
                      >
                        {t("job-post-creator:form.buttons.regenerateButton")}
                      </button>
                    </form>
                  )}
                </div>

                {/* ----- Right Panel / Instructions or Generated ----- */}
                {isGeneratedJobPost &&
                  !isStreamingCanvasContent &&
                  isDefaultView && (
                    <JobPostGenerated
                      dialogue={mapContentItemsToChatMessages(
                        activeGeneratedContent
                      )} // TEMP FINAL CONTENT => ACTIVE ONE
                    />
                  )}
                {formSubmitted && !isDefaultView && (
                  <JobPostCreatorCardToCanvas
                    formSubmitted={formSubmitted}
                    agentAvatarColor={agentAvatarColor}
                    Icon={Icon}
                    iconSize={iconSize}
                    moduleName={moduleName}
                    jobPostHeaders={jobPostHeaders}
                    isGeneratedJobPost={isGeneratedJobPost}
                    skipAnimation={skipAnimation}
                  />
                )}
              </div>
              {!isCanvasMode && (
                <div
                  className={`fixed w-full bottom-0 pb-1 bottom-0 left-1/2  transition-transform duration-700 ease-in-out bg-gray-800 -z-1 flex items-center justify-center`}
                  style={{
                    transform:
                      isSidebarOpen && isAbove700px
                        ? "translateX(calc(-50% + 8rem))"
                        : "translateX(calc(-50% + 2rem))",
                  }}
                >
                  <ChatFooter />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </PageTransitionContainer>
    </>
  );
};

export default JobPostEditor;
