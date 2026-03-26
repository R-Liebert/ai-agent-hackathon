export type SiteAlertSeverity = "info" | "warning" | "error";
export type SupportedLanguage = "en" | "da";

// Response for public endpoint (single language)
export interface SiteAlertResponse {
  enabled: boolean;
  message: string; // Message in requested language
  severity: SiteAlertSeverity;
  updatedAt: string;
  updatedBy: string | null;
  fromCache: boolean;
}

// Response for admin endpoint (both languages)
export interface SiteAlertAdminResponse {
  enabled: boolean;
  messageEn: string;
  messageDa: string;
  severity: SiteAlertSeverity;
  updatedAt: string;
  updatedBy: string | null;
  fromCache: boolean;
}

// Request for updating (admin only)
export interface UpdateSiteAlertRequest {
  enabled: boolean;
  messageEn: string;
  messageDa: string;
  severity: SiteAlertSeverity;
}

export const ALERT_SEVERITY_STYLES: Record<
  SiteAlertSeverity,
  { backgroundColor: string; color: string }
> = {
  info: { backgroundColor: "#1d4ed8", color: "#ffffff" }, // blue-700
  warning: { backgroundColor: "#ca8a04", color: "#000000" }, // yellow-600
  error: { backgroundColor: "#991b1b", color: "#ffffff" }, // red-800
};
