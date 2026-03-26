import { ReactNode } from "react";
import { TbRocket, TbBug, TbStar } from "react-icons/tb";
import { TFunction } from "i18next";
import { FeedbackType } from "./feedbackTypes";

// Tabs configuration

export const getTabs = (
  t: TFunction
): { id: FeedbackType; label: string; icon: React.ReactElement }[] => [
  {
    id: "featureRequest",
    label: t("feedback:tabs.featureRequest"),
    icon: <TbRocket />,
  },
  {
    id: "bugReport",
    label: t("feedback:tabs.bugReport"),
    icon: <TbBug />,
  },
  {
    id: "applicationRating",
    label: t("feedback:tabs.applicationRating"),
    icon: <TbStar />,
  },
];

// Impact Level Options
export const getImpactLevelOptions = (t: TFunction) => [
  {
    value: t("feedback:forms.workflowImpactLevel.options.veryLow"),
    label: t("feedback:forms.workflowImpactLevel.options.veryLow"),
  },
  {
    value: t("feedback:forms.workflowImpactLevel.options.low"),
    label: t("feedback:forms.workflowImpactLevel.options.low"),
  },
  {
    value: t("feedback:forms.workflowImpactLevel.options.neutral"),
    label: t("feedback:forms.workflowImpactLevel.options.neutral"),
  },
  {
    value: t("feedback:forms.workflowImpactLevel.options.high"),
    label: t("feedback:forms.workflowImpactLevel.options.high"),
  },
  {
    value: t("feedback:forms.workflowImpactLevel.options.critical"),
    label: t("feedback:forms.workflowImpactLevel.options.critical"),
  },
];

// Error Frequency Options
export const getErrorFrequencyOptions = (t: TFunction) => [
  {
    value: "once",
    label: t("feedback:forms.bugReportForm.errorFrequency.once"),
  },
  {
    value: "fewTimes",
    label: t("feedback:forms.bugReportForm.errorFrequency.fewTimes"),
  },
  {
    value: "manyTimes",
    label: t("feedback:forms.bugReportForm.errorFrequency.manyTimes"),
  },
  {
    value: "always",
    label: t("feedback:forms.bugReportForm.errorFrequency.always"),
  },
];

// Time Saving Options
export const getTimeSavingOptions = (t: TFunction) => [
  {
    value: t(
      "feedback:forms.applicationRatingForm.timeSavingData.options.lessThanOne"
    ),
    label: t(
      "feedback:forms.applicationRatingForm.timeSavingData.options.lessThanOne"
    ),
  },
  {
    value: t(
      "feedback:forms.applicationRatingForm.timeSavingData.options.betweenOneAndTwo"
    ),
    label: t(
      "feedback:forms.applicationRatingForm.timeSavingData.options.betweenOneAndTwo"
    ),
  },
  {
    value: t(
      "feedback:forms.applicationRatingForm.timeSavingData.options.betweenThreeAndFive"
    ),
    label: t(
      "feedback:forms.applicationRatingForm.timeSavingData.options.betweenThreeAndFive"
    ),
  },
  {
    value: t(
      "feedback:forms.applicationRatingForm.timeSavingData.options.moreThanFive"
    ),
    label: t(
      "feedback:forms.applicationRatingForm.timeSavingData.options.moreThanFive"
    ),
  },
  {
    value: t(
      "feedback:forms.applicationRatingForm.timeSavingData.options.moreThanTen"
    ),
    label: t(
      "feedback:forms.applicationRatingForm.timeSavingData.options.moreThanTen"
    ),
  },
];

// Job Satisfaction Options
export const getJobSatisfactionOptions = (t: TFunction) => [
  {
    value: t(
      "feedback:forms.applicationRatingForm.jobSatisfaction.options.veryLow"
    ),
    label: t(
      "feedback:forms.applicationRatingForm.jobSatisfaction.options.veryLow"
    ),
  },
  {
    value: t(
      "feedback:forms.applicationRatingForm.jobSatisfaction.options.low"
    ),
    label: t(
      "feedback:forms.applicationRatingForm.jobSatisfaction.options.low"
    ),
  },
  {
    value: t(
      "feedback:forms.applicationRatingForm.jobSatisfaction.options.neutral"
    ),
    label: t(
      "feedback:forms.applicationRatingForm.jobSatisfaction.options.neutral"
    ),
  },
  {
    value: t(
      "feedback:forms.applicationRatingForm.jobSatisfaction.options.high"
    ),
    label: t(
      "feedback:forms.applicationRatingForm.jobSatisfaction.options.high"
    ),
  },
  {
    value: t(
      "feedback:forms.applicationRatingForm.jobSatisfaction.options.critical"
    ),
    label: t(
      "feedback:forms.applicationRatingForm.jobSatisfaction.options.critical"
    ),
  },
];

// Rating Options
export const getRatingOptions = () =>
  Array.from({ length: 5 }, (_, index) => ({
    value: (index + 1).toString(),
    label: `${index + 1} Star${index > 0 ? "s" : ""}`, // Label as "1 Star", "2 Stars", etc.
  }));

// Error Frequency Options
export const getDeviceType = (t: TFunction) => [
  {
    value: t("feedback:forms.bugReportForm.errorFrequency.once"),
    label: t("feedback:forms.bugReportForm.errorFrequency.once"),
  },
  {
    value: t("feedback:forms.bugReportForm.errorFrequency.fewTimes"),
    label: t("feedback:forms.bugReportForm.errorFrequency.fewTimes"),
  },
  {
    value: t("feedback:forms.bugReportForm.errorFrequency.manyTimes"),
    label: t("feedback:forms.bugReportForm.errorFrequency.manyTimes"),
  },
  {
    value: t("feedback:forms.bugReportForm.errorFrequency.always"),
    label: t("feedback:forms.bugReportForm.errorFrequency.always"),
  },
];

// Device Type Options
export const getDeviceTypeOptions = (t: TFunction) => [
  {
    value: t(
      "feedback:forms.bugReportForm.systemInformation.deviceType.desktop"
    ),
    label: t(
      "feedback:forms.bugReportForm.systemInformation.deviceType.desktop"
    ),
  },
  {
    value: t(
      "feedback:forms.bugReportForm.systemInformation.deviceType.mobile"
    ),
    label: t(
      "feedback:forms.bugReportForm.systemInformation.deviceType.mobile"
    ),
  },
  {
    value: t(
      "feedback:forms.bugReportForm.systemInformation.deviceType.tablet"
    ),
    label: t(
      "feedback:forms.bugReportForm.systemInformation.deviceType.tablet"
    ),
  },
];

// Operating System Options
export const getOperatingSystemOptions = (t: TFunction) => [
  {
    value: t(
      "feedback:forms.bugReportForm.systemInformation.operatingSystem.windows"
    ),
    label: t(
      "feedback:forms.bugReportForm.systemInformation.operatingSystem.windows"
    ),
  },
  {
    value: t(
      "feedback:forms.bugReportForm.systemInformation.operatingSystem.macos"
    ),
    label: t(
      "feedback:forms.bugReportForm.systemInformation.operatingSystem.macos"
    ),
  },
  {
    value: t(
      "feedback:forms.bugReportForm.systemInformation.operatingSystem.linux"
    ),
    label: t(
      "feedback:forms.bugReportForm.systemInformation.operatingSystem.linux"
    ),
  },
  {
    value: t(
      "feedback:forms.bugReportForm.systemInformation.operatingSystem.android"
    ),
    label: t(
      "feedback:forms.bugReportForm.systemInformation.operatingSystem.android"
    ),
  },
  {
    value: t(
      "feedback:forms.bugReportForm.systemInformation.operatingSystem.ios"
    ),
    label: t(
      "feedback:forms.bugReportForm.systemInformation.operatingSystem.ios"
    ),
  },
  {
    value: t(
      "feedback:forms.bugReportForm.systemInformation.operatingSystem.other"
    ),
    label: t(
      "feedback:forms.bugReportForm.systemInformation.operatingSystem.other"
    ),
  },
];

// Browser Type Options
export const getBrowserTypeOptions = (t: TFunction) => [
  {
    value: t(
      "feedback:forms.bugReportForm.systemInformation.browserType.chrome"
    ),
    label: t(
      "feedback:forms.bugReportForm.systemInformation.browserType.chrome"
    ),
  },
  {
    value: t(
      "feedback:forms.bugReportForm.systemInformation.browserType.firefox"
    ),
    label: t(
      "feedback:forms.bugReportForm.systemInformation.browserType.firefox"
    ),
  },
  {
    value: t(
      "feedback:forms.bugReportForm.systemInformation.browserType.safari"
    ),
    label: t(
      "feedback:forms.bugReportForm.systemInformation.browserType.safari"
    ),
  },
  {
    value: t("feedback:forms.bugReportForm.systemInformation.browserType.edge"),
    label: t("feedback:forms.bugReportForm.systemInformation.browserType.edge"),
  },
  {
    value: t(
      "feedback:forms.bugReportForm.systemInformation.browserType.opera"
    ),
    label: t(
      "feedback:forms.bugReportForm.systemInformation.browserType.opera"
    ),
  },
  {
    value: t(
      "feedback:forms.bugReportForm.systemInformation.browserType.other"
    ),
    label: t(
      "feedback:forms.bugReportForm.systemInformation.browserType.other"
    ),
  },
];
