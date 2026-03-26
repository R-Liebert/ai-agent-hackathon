import React, {
  useEffect,
  useState,
  useRef,
  useLayoutEffect,
  useMemo,
} from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { AnimatePresence, motion } from "framer-motion";
import { ChatFooter } from "../../components/Chat/ChatFooter";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import JobPostCreatorInstructions from "../../components/JobPostCreator/JobPostCreatorInstructions";
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

import { useNavigate } from "react-router-dom";
import jobPostService from "../../services/jobPostService";
import PageTransitionContainer from "../../components/Global/PageTransitionContainer";
import useSidebarStore from "../../stores/navigationStore";
import { mapI18nContentToContentItems } from "./sections";

const JobPostCreator: React.FC = () => {
  const { isSidebarOpen } = useSidebarStore();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery("(min-width: 1200px)");
  const isAbove700px = useMediaQuery("(min-width: 700px)");
  const { t, i18n } = useTranslation();
  const {
    setCanvasTitle,
    isCanvasMode,
    setIsCanvasMode,
    isStreamingCanvasContent,
    setIsStreamingCanvasContent,
    resetAllStates,
    streamController,
    setContentVersions,
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
    resetJobPostStates,
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

  useEffect(() => {
    resetAllStates(() => {
      resetJobPostStates();
    });
  }, [resetAllStates, resetJobPostStates]);

  // Push initial content into canvas state on mount or language change
  useEffect(() => {
    const i18nContent = t("job-post-creator:temporaryContent.content", {
      returnObjects: true,
    }) as Array<{ header: string; text: string }>;

    const initialContent = mapI18nContentToContentItems(t, i18nContent);
    setContentVersions(initialContent as unknown as ContentItem[]);
  }, [i18n.language, setContentVersions, t]);

  // -------------------------------
  // Partial Streaming-Related State
  // -------------------------------
  // Streaming controller is managed via CanvasContext so the global
  // Stop button can cancel in-flight requests.

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

  // Use stable enum codes for position level; map to backend codes on submit
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

      // Custom logic from handleFormSubmit
      setIsDefaultView(false);
      setFormSubmitted(true);
      setTimeout(() => {
        handleFormFadeOut();
      }, 1000);
      setIsStreamingCanvasContent(true);

      try {
        await handleGenerate(values);
        notificationsService.success(
          t("job-post-creator:notifications.stream.success")
        );
      } catch (err: any) {
        console.error("Error during form submission:", err);
        notificationsService.error("Something went wrong when submitting form");
      }
    },
  });

  const prevResetSignalRef = useRef<number>(resetFormSignal);

  useEffect(() => {
    if (resetFormSignal !== prevResetSignalRef.current) {
      prevResetSignalRef.current = resetFormSignal;

      formik.resetForm({
        values: {
          jobTitle: "",
          departmentTeam: "",
          jobScope: "",
          qualifications: "",
          positionLevel: "",
          language: "",
        },
      });

      setSelectedValues({
        positionLevel: "",
        language: "",
      });
    }
  }, [resetFormSignal]);
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form before submitting
    const errors = await formik.validateForm();

    if (Object.keys(errors).length > 0) {
      // Touch all fields to show validation errors inline
      formik.setTouched({
        jobTitle: true,
        departmentTeam: true,
        jobScope: true,
        qualifications: true,
        positionLevel: true,
        language: true,
      });
      // Show toast error notification
      notificationsService.error(
        t("job-post-creator:form.notifications.onFormSubmit.validationError")
      );
      return;
    }

    formik.handleSubmit();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    setPositionTitle(formik.values.jobTitle);
  }, [formik.values.jobTitle, setPositionTitle]);

  useEffect(() => {
    setCanvasTitle(positionTitle);
  }, [positionTitle, setCanvasTitle]);

  const content = useMemo(
    () =>
      t("job-post-creator:temporaryContent.content", {
        returnObjects: true,
      }) as ContentItem[],
    [t, i18n.language]
  );

  const jobPostHeaders: string[] = content.map(
    (item: ContentItem) => item.header
  );

  // --------------------------------
  // Streaming Logic - PENDING UPDATE
  // --------------------------------
  const handleGenerate = async (values: typeof formik.values) => {
    // Clean up old results
    setIsGeneratedJobPost(false);

    // Indicate streaming is in progress
    setIsStreamingCanvasContent(true);
    setIsLoading(true);

    // Create an AbortController to manage SSE stream
    const controller = new AbortController();
    if (streamController) {
      streamController.current = controller;
    }

    // Prepare the SSE request payload
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

    try {
      const response = await jobPostService.create(requestPayload);
      if (response?.jobPost) {
        setTimeout(() => {
          navigate(`/job-post-creator/${response.jobPost.id}`);
        }, 200);
      }
    } catch (err) {
      console.error("Fetch SSE error:", err);
      //setIsStreamingCanvasContent(false);
      setIsLoading(false);
      notificationsService.error(
        t("job-post-creator:notifications.stream.error")
      );
    } finally {
      // Ensure cleanup after the stream ends

      //setIsStreamingCanvasContent(false); // Uncomment this when ful logic is added
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
        duration: 1,
        onComplete: () => {
          gsap.delayedCall(0.6, () => {
            setIsCanvasMode(true);
          });
        },
      });
    } else {
    }
  };

  const formContainerWidth =
    "w-full mx-auto lg:mx-0 max-w-[36rem] lg:w-[37vw] xxl:w-[30vw]";

  const shouldRenderForm =
    (!isDesktop && !isGeneratedJobPost && !formSubmitted) ||
    (isDesktop && !isCanvasMode);

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
              className="xxxl:w-[90rem] xxl:w-[82rem] lg:w-[76vw] md:w-[82%] w-[90%] mx-auto pt-16 pb-4 flex flex-col relative overflow-y-visible"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
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
              <div className="w-full flex lg:flex-row flex-col justify-between mx-auto relative">
                {/* ----- Left Panel ----- */}
                <div className={`${formContainerWidth} flex flex-col relative`}>
                  {/* Form Section => Disappears once the Card expands */}
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
                      className={`${formContainerWidth} fixed ${
                        isSidebarOpen && isAbove700px
                          ? "!w-[calc(90%-14rem)] md:!w-[60vw] lg:!w-[37vw]"
                          : "!w-[90%] lg:!w-[37vw]"
                      } bottom-7 md:bottom-9 z-10 flex mt-16 text-md font-body py-[.9em] bg-white-100 hover:bg-red-600 hover:text-white-100 text-gray-700 font-semibold transition-color duration-300 ease-out rounded-full text-center place-content-center`}
                      aria-label={t(
                        "job-post-creator:form.buttons.submitButton"
                      )}
                    >
                      {t("job-post-creator:form.buttons.submitButton")}
                    </button>
                  </form>
                </div>

                {/* ----- Right Panel / Instructions or Generated ----- */}
                {!isGeneratedJobPost &&
                  !isStreamingCanvasContent &&
                  isDefaultView &&
                  isDesktop && <JobPostCreatorInstructions />}
                {formSubmitted && !isDefaultView && (
                  <JobPostCreatorCardToCanvas
                    formSubmitted={formSubmitted}
                    agentAvatarColor={agentAvatarColor}
                    Icon={Icon}
                    iconSize={iconSize}
                    moduleName={moduleName}
                    jobPostHeaders={jobPostHeaders}
                    isGeneratedJobPost={isGeneratedJobPost}
                  />
                )}
              </div>
              {!isCanvasMode && (
                <div
                  className={`fixed w-full bottom-0 pb-1 md:pb-0 md:bottom-2 left-1/2  transition-transform duration-700 ease-in-out bg-gray-800 -z-1 flex items-center justify-center`}
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

export default JobPostCreator;
