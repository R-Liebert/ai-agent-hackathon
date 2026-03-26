//FeedbackType type
export type FeedbackType = "applicationRating" | "bugReport" | "featureRequest";

// ApplicationRatingFormValues type
export interface ApplicationRatingFormValues {
  starRating: string;
  timeSavingData: string;
  workQualityImpact: string;
  jobSatisfaction: string;
  useCaseScenario: string;
  otherAiToolsUsed?: string;
  missingFeatureIndication?: string;
}

// BugReportFormValues type
export interface BugReportFormValues {
  issueDescription: string;
  expectedBehaviour: string;
  stepsToReproduceIssue: string;
  errorFrequency: string;
  workflowImpactDescription: string;
  workflowSeverityImpactLevel: string;
  errorMessages?: string;
  supportingReference?: File[]; // For file uploads
  systemInformation: {
    deviceType: string;
    operatingSystem: string;
    browserType: string;
  };
}

// FeatureRequestFormValues type
export interface FeatureRequestFormValues {
  featureDescription: string;
  problemStatement: string;
  useCaseScenario: string;
  workflowSeverityImpactLevel: string;
  supportingReference?: File[]; // For file uploads
  otherInformation?: string;
}

// FeedbackFormValues type
export interface FeedbackFormValues {
  feedbackType: FeedbackType;
  applicationRating: ApplicationRatingFormValues;
  bugReport: BugReportFormValues;
  featureRequest: FeatureRequestFormValues;
}
