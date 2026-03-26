// Section identifiers
export const SECTIONS = {
  LANDING: "landing",
  GRAPH_SUBSCRIPTIONS: "graph-subscriptions",
  RETRY_MANAGEMENT: "retry-management",
  STATISTICS: "statistics",
  JOB_CONTROL: "job-control",
  WORKSPACES_BROWSE: "workspaces-browse",
  WORKSPACE_DETAILS: "workspace-details",
  MESSAGE_RATINGS: "message-ratings",
  MIGRATIONS: "migrations",
  BACKGROUND_JOBS: "background-jobs",
  RESEARCH_EXPORTS: "research-exports",
  MAINTENANCE_ALERTS: "maintenance-alerts",
  LAUNCHPAD_SETTINGS: "launchpad-settings",
};

// UI text constants
export const UI_TEXT = {
  ADMIN_DASHBOARD: "Admin Dashboard",
  GRAPH_SUBSCRIPTIONS: "Graph Subscriptions",
  RETRY_MANAGEMENT: "Retry Management",
  STATISTICS: "Statistics",
  JOB_CONTROL: "Job Control",
  DELETE: "Delete",
  CANCEL: "Cancel",
  DELETE_SUBSCRIPTION: "Delete Subscription",
  DELETE_CONFIRMATION:
    "Are you sure you want to delete this subscription? This action cannot be undone.",
  NO_SUBSCRIPTIONS: "No subscriptions found",
  RETURN_TO_HOME: "Return to Home",
  RENEW: "Renew",
  RENEW_ALL: "Trigger renewal check",
  RENEW_ALL_SUBSCRIPTIONS: "Renewal Check",
  RENEW_ALL_CONFIRMATION:
    "This will trigger a check for subscriptions that need renewal. Only subscriptions expiring within the next 48 hours will be renewed. Others will be checked but left unchanged.",
  CLEAR_RETRY: "Clear Retry",
  RETRY_NOW: "Retry Now",
  // Message Ratings
  MESSAGE_RATINGS: "Message Ratings",
  MIGRATIONS: "Migrations",
  // Background Jobs
  BACKGROUND_JOBS: "Background Jobs",
  BACKGROUND_JOBS_DESCRIPTION: "Monitor and manage Hangfire background jobs",
  RESEARCH_EXPORTS: "Research Exports",
  RESEARCH_EXPORTS_DESCRIPTION: "Queue and download research data exports",
  LAUNCHPAD_SETTINGS: "Launchpad Settings",
  LAUNCHPAD_SETTINGS_DESCRIPTION:
    "Manage Launchpad feature flags and access controls",
  // Maintenance & Alerts
  MAINTENANCE_ALERTS: "Maintenance & Alerts",
  MAINTENANCE_ALERTS_DESCRIPTION: "Manage site-wide alerts and maintenance messages",
  REQUEUE: "Requeue",
  REQUEUE_JOB: "Requeue Job",
  REQUEUE_ALL_FAILED: "Requeue All Failed",
  DELETE_JOB: "Delete Job",
  CANCEL_JOB: "Cancel Job",
  TRIGGER_NOW: "Trigger Now",
  PAUSE_JOB: "Pause",
  RESUME_JOB: "Resume",
  JOB_DETAILS: "Job Details",
  NO_JOBS_FOUND: "No jobs found",
  // Common
  EXPORT_CSV: "Export CSV",
  NO_RATINGS: "No ratings found",
  RATING_DETAILS: "Rating Details",
  CONTENT_REDACTED: "Content hidden - user did not consent",
  LOAD_MORE: "Load More",
  THUMBS_UP: "Thumbs Up",
  THUMBS_DOWN: "Thumbs Down",
  NOT_RATED: "Not Rated",
  CONSENTED: "Consented",
  NO_CONSENT: "No Consent",
  AGENT_GENERATED: "Agent",
  USER_GENERATED: "User",
  CLOSE: "Close",
  REFRESH: "Refresh",
};

// Error messages
export const ERROR_MESSAGES = {
  LOAD_FAILED: "Failed to load notification subscriptions",
  DELETE_FAILED: "Failed to delete subscription",
  NO_ID_PROVIDED: "Failed to delete subscription: No ID provided",
};

// Success messages
export const SUCCESS_MESSAGES = {
  DELETE_SUCCESS: "Subscription deleted successfully",
};

// Styling constants - DSB Brand Colors
export const STYLES = {
  CHIP_BACKGROUND: "#424242", // gray-400 from tailwind
  CHIP_COLOR: "#EDEDED", // white-100
  CHIP_FONT: '"Nunito Sans", sans-serif',
  TABS_INDICATOR: "#EDEDED", // white-100
  BORDER_COLOR: "rgba(106, 106, 106, 0.3)", // Based on #6a6a6a
  SURFACE_COLOR: "#444654", // Consistent with feedback button
  SUCCESS_COLOR: "#16692D", // notification-success
  ERROR_COLOR: "#A6363D", // notification-error
  WARNING_COLOR: "#977A24", // notification-warning
  INFO_COLOR: "#424242", // notification-info
};
