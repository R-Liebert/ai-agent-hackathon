import React, { useState, FormEvent, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsService } from "../../services/notificationsService";
import { feedbackService } from "../../services/feedbackService";
import { AxiosError } from "axios";
import MainNav from "../../components/MainNavigation/MainNavigation";
import GlobalContainer from "../../components/Global/AppContainer";
import Loader from "../../components/app-loader";
import { Helmet } from "react-helmet-async";
import Heading from "../../components/Global/AppHeading";
import ApplicationRatingForm from "../../components/Feedback/ApplicationRatingForm";
import BugReportForm from "../../components/Feedback/BugReportForm";
import FeatureRequestForm from "../../components/Feedback/FeatureRequestForm";
import FormTabs from "../../components/Feedback/FormTabs";
import {
  getTabs,
  getImpactLevelOptions,
  getErrorFrequencyOptions,
  getTimeSavingOptions,
  getRatingOptions,
  getJobSatisfactionOptions,
} from "./feedbackOptions";
import { TFunction } from "i18next";
import PageTransitionContainer from "../../components/Global/PageTransitionContainer";

import {
  getDeviceType,
  getOperatingSystem,
  getBrowserType,
} from "../../utils/systemInfoUtils";
import {
  getDeviceTypeOptions,
  getOperatingSystemOptions,
  getBrowserTypeOptions,
} from "./feedbackOptions";
import { FeedbackType, FeedbackFormValues } from "./feedbackTypes";
import BlockUI from "../../components/block-ui";

const FeedbackPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<FeedbackType>("applicationRating");
  const [selectedValues, setSelectedValues] = useState({
    applicationRating: {
      starRating: "",
      timeSavingData: "",
      workQualityImpact: "",
      jobSatisfaction: "",
    },
    bugReport: {
      errorFrequency: "",
      workflowSeverityImpactLevel: "",
    },
    featureRequest: {
      workflowSeverityImpactLevel: "",
    },
  });

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  // Tabs configuration
  const tabs = getTabs(t);

  // Options
  const impactLevelOptions = getImpactLevelOptions(t);
  const errorFrequencyOptions = getErrorFrequencyOptions(t);
  const timeSavingOptions = getTimeSavingOptions(t);
  const ratingOptions = getRatingOptions();
  const deviceType = getDeviceType(t);
  const operatingSystem = getOperatingSystem(t);
  const browserType = getBrowserType(t);
  const deviceTypeOptions = getDeviceTypeOptions(t);
  const operatingSystemOptions = getOperatingSystemOptions(t);
  const browserTypeOptions = getBrowserTypeOptions(t);
  const jobSatisfactionOptions = getJobSatisfactionOptions(t);

  // Mutation for submitting feedback
  const { mutateAsync: submitFeedback, isPending } = useMutation({
    mutationFn: feedbackService.submitFeedback,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
    },
    onError: (error: AxiosError) => {
      console.error(error);
    },
  });

  const getValidationSchema = (feedbackType: FeedbackType, t: TFunction) => {
    return Yup.object().shape({
      feedbackType: Yup.string().required(
        t("feedback:forms.workflowImpactLevel.validationMessage")
      ),
      applicationRating:
        feedbackType === "applicationRating"
          ? Yup.object().shape({
              starRating: Yup.string().required(
                t(
                  "feedback:forms.applicationRatingForm.starRating.validationMessage"
                )
              ),
              timeSavingData: Yup.string().required(
                t(
                  "feedback:forms.applicationRatingForm.timeSavingData.validationMessage"
                )
              ),
              workQualityImpact: Yup.string().required(
                t(
                  "feedback:forms.applicationRatingForm.workQualityImpact.validationMessage"
                )
              ),
              jobSatisfaction: Yup.string().required(
                t(
                  "feedback:forms.applicationRatingForm.jobSatisfaction.validationMessage"
                )
              ),
              useCaseScenario: Yup.string().required(
                t(
                  "feedback:forms.applicationRatingForm.useCaseScenario.validationMessage"
                )
              ),
            })
          : Yup.object().nullable(),
      bugReport:
        feedbackType === "bugReport"
          ? Yup.object().shape({
              issueDescription: Yup.string()
                .min(
                  10,
                  t(
                    "feedback:forms.bugReportForm.issueDescription.validationMessage"
                  )
                )
                .required(
                  t(
                    "feedback:forms.bugReportForm.issueDescription.validationMessage"
                  )
                ),
              expectedBehaviour: Yup.string().required(
                t(
                  "feedback:forms.bugReportForm.expectedBehaviour.validationMessage"
                )
              ),
              stepsToReproduceIssue: Yup.string().required(
                t(
                  "feedback:forms.bugReportForm.stepsToReproduceIssue.validationMessage"
                )
              ),
              errorFrequency: Yup.string().required(
                t(
                  "feedback:forms.bugReportForm.errorFrequency.validationMessage"
                )
              ),
            })
          : Yup.object().nullable(),
      featureRequest:
        feedbackType === "featureRequest"
          ? Yup.object().shape({
              featureDescription: Yup.string()
                .min(
                  10,
                  t(
                    "feedback:forms.featureRequestForm.featureDescription.validationMessage"
                  )
                )
                .required(
                  t(
                    "feedback:forms.featureRequestForm.featureDescription.validationMessage"
                  )
                ),
              problemStatement: Yup.string().required(
                t(
                  "feedback:forms.featureRequestForm.problemStatement.validationMessage"
                )
              ),
              useCaseScenario: Yup.string().required(
                t(
                  "feedback:forms.featureRequestForm.useCaseScenario.validationMessage"
                )
              ),
              workflowSeverityImpactLevel: Yup.string().required(
                t(
                  "feedback:forms.featureRequestForm.workflowSeverityImpactLevel.validationMessage"
                )
              ),
            })
          : Yup.object().nullable(),
    });
  };

  // Formik initial values
  const initialValues: FeedbackFormValues = {
    feedbackType: "applicationRating", // Default form type
    applicationRating: {
      starRating: "",
      timeSavingData: "",
      workQualityImpact: "",
      jobSatisfaction: "",
      useCaseScenario: "",
      otherAiToolsUsed: "",
      missingFeatureIndication: "",
    },
    bugReport: {
      issueDescription: "",
      expectedBehaviour: "",
      stepsToReproduceIssue: "",
      errorFrequency: "",
      workflowImpactDescription: "",
      workflowSeverityImpactLevel: "",
      errorMessages: "",
      supportingReference: [],
      systemInformation: {
        deviceType,
        operatingSystem,
        browserType,
      },
    },
    featureRequest: {
      featureDescription: "",
      problemStatement: "",
      useCaseScenario: "",
      workflowSeverityImpactLevel: "",
      supportingReference: [],
      otherInformation: "",
    },
  };

  // Submit Function
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    formik.handleSubmit();
  };

  // Formik
  const formik = useFormik<FeedbackFormValues>({
    initialValues,
    validationSchema: getValidationSchema(activeTab, t),
    enableReinitialize: true,
    onSubmit: async (values) => {
      const activeFormData = values[values.feedbackType as FeedbackType];
      const payload = {
        feedbackType: values.feedbackType,
        ...activeFormData,
      };

      try {
        await feedbackService.submitFeedback(payload);
        notificationsService.success(
          t("feedback:forms.notifications.onSubmit.success")
        );
        console.log("API Response:", payload); // debugging
        handleCancel(); // reset the form upon submit
      } catch (error) {
        notificationsService.error(
          t("feedback:forms.notifications.onSubmit.error")
        );
        console.error("Error submitting feedback:", error);
        console.log("Form Values:", values); // debugging
        console.log("Payload:", payload); // debugging
      }
    },
  });

  // Cancel Function
  const handleCancel = () => {
    try {
      formik.resetForm();
      setUploadedFiles([]);
      formik.setFieldValue("feedbackType", activeTab); // Reset to the current active tab
      const fileInput = document.getElementById(
        "file-upload"
      ) as HTMLInputElement | null;
      if (fileInput) {
        fileInput.value = "";
      }
    } catch (error) {
      notificationsService.error(
        t("feedback:forms.notifications.onCancel.error")
      );
      console.error("Error resetting form and selected options:", error);
    }
  };

  // Helper Functions
  const handleFilesChange = (files: File[]) => {
    setUploadedFiles(files);
    console.log("Uploaded files:", files);

    if (activeTab === "bugReport") {
      formik.setFieldValue("bugReport.supportingReference", files);
    } else if (activeTab === "featureRequest") {
      formik.setFieldValue("featureRequest.supportingReference", files);
    }
  };

  const handleImpactLevelChange = (value: string) => {
    if (formik.values.feedbackType === "bugReport") {
      formik.setFieldValue("bugReport.workflowSeverityImpactLevel", value);
      setSelectedValues((prev) => ({
        ...prev,
        bugReport: {
          ...prev.bugReport,
          workflowSeverityImpactLevel: value,
        },
      }));
    } else if (formik.values.feedbackType === "featureRequest") {
      formik.setFieldValue("featureRequest.workflowSeverityImpactLevel", value);
      setSelectedValues((prev) => ({
        ...prev,
        featureRequest: {
          ...prev.featureRequest,
          workflowSeverityImpactLevel: value,
        },
      }));
    } else if (formik.values.feedbackType === "applicationRating") {
      formik.setFieldValue("applicationRating.workQualityImpact", value);
      setSelectedValues((prev) => ({
        ...prev,
        applicationRating: {
          ...prev.applicationRating,
          workQualityImpact: value,
        },
      }));
    }
    console.log("Selected Impact Level:", value);
  };

  const handleErrorFrequencyChange = (value: string) => {
    if (formik.values.feedbackType === "bugReport") {
      formik.setFieldValue("bugReport.errorFrequency", value);
      setSelectedValues((prev) => ({
        ...prev,
        bugReport: {
          ...prev.bugReport,
          errorFrequency: value,
        },
      }));
    }
    console.log("Selected Error Frequency:", value);
  };

  const handleTimeSavingChange = (value: string) => {
    if (formik.values.feedbackType === "applicationRating") {
      formik.setFieldValue("applicationRating.timeSavingData", value);
      setSelectedValues((prev) => ({
        ...prev,
        applicationRating: {
          ...prev.applicationRating,
          timeSavingData: value,
        },
      }));
    }
    console.log("Selected Time Saving Option:", value);
  };

  const handleJobSatisfactionChange = (value: string) => {
    if (formik.values.feedbackType === "applicationRating") {
      formik.setFieldValue("applicationRating.jobSatisfaction", value);
      setSelectedValues((prev) => ({
        ...prev,
        applicationRating: {
          ...prev.applicationRating,
          jobSatisfaction: value,
        },
      }));
    }
    console.log("Selected Job Satisfaction Option:", value);
  };

  const handleRatingChange = (value: string) => {
    if (formik.values.feedbackType === "applicationRating") {
      formik.setFieldValue("applicationRating.starRating", value);
      setSelectedValues((prev) => ({
        ...prev,
        applicationRating: {
          ...prev.applicationRating,
          starRating: value,
        },
      }));
    }
    console.log("Selected Rating:", value);
  };

  // Render form content based on feedback type
  const renderFormContent = () => {
    switch (activeTab) {
      case "featureRequest":
        return (
          <FeatureRequestForm
            formik={formik}
            impactLevelOptions={impactLevelOptions}
            handleImpactLevelChange={handleImpactLevelChange}
            handleFilesChange={handleFilesChange}
            uploadedFiles={uploadedFiles}
          />
        );
      case "bugReport":
        return (
          <BugReportForm
            formik={formik}
            impactLevelOptions={impactLevelOptions}
            handleImpactLevelChange={handleImpactLevelChange}
            handleErrorFrequencyChange={handleErrorFrequencyChange}
            errorFrequencyOptions={errorFrequencyOptions}
            deviceTypeOptions={deviceTypeOptions}
            operatingSystemOptions={operatingSystemOptions}
            browserTypeOptions={browserTypeOptions}
            handleFilesChange={handleFilesChange}
            uploadedFiles={uploadedFiles}
          />
        );
      case "applicationRating":
        return (
          <ApplicationRatingForm
            impactLevelOptions={impactLevelOptions}
            handleImpactLevelChange={handleImpactLevelChange}
            formik={formik}
            timeSavingOptions={timeSavingOptions}
            handleTimeSavingChange={handleTimeSavingChange}
            ratingOptions={ratingOptions}
            handleRatingChange={handleRatingChange}
            handleJobSatisfactionChange={handleJobSatisfactionChange}
            jobSatisfactionOptions={jobSatisfactionOptions}
          />
        );
      default:
        return null;
    }
  };

  const handleTabChange = (tabId: FeedbackType) => {
    setActiveTab(tabId);
    formik.setFieldValue("feedbackType", tabId);
  };

  if (isPending) return <Loader />;

  return (
    <>
      <Helmet>
        <title>{t("feedback:title")} - AI Launchpad</title>
        <meta name="description" content={t("feedback:description")} />
      </Helmet>
      <MainNav title={t("feedback:title")} />
      <PageTransitionContainer>
        <GlobalContainer>
          <div className="max-w-3xl px-4 sm:px-12 mx-auto mb-16">
            <form onSubmit={handleSubmit}>
              <Heading
                titleKey={t("feedback:title")}
                taglineKey={t("feedback:description")}
              />
              {/* Tabs Navigation */}
              <FormTabs
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={handleTabChange}
              />

              {/* Form Content */}
              <div className="flex flex-col w-full place-items-center my-10">
                {renderFormContent()}
              </div>

              {/* Form Buttons */}
              <BlockUI open={formik.isSubmitting} />
              <div className="flex flex-col sm:flex-row w-full gap-4 mt-14">
                <button
                  type="submit"
                  data-testid="submit-button"
                  className="text-md font-body py-[.9em] flex bg-white-100 hover:bg-red-600 hover:text-white-100 text-gray-700 font-semibold
            transition-color duration-300 ease-out rounded-full w-full text-center place-content-center"
                  aria-label={t("feedback:forms.buttons.submit")}
                >
                  {t("feedback:forms.buttons.submit")}
                </button>
              </div>
            </form>
          </div>
        </GlobalContainer>
      </PageTransitionContainer>
    </>
  );
};

export default FeedbackPage;
