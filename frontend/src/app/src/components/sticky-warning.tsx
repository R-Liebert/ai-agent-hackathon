import { GoAlert, GoInfo } from "react-icons/go";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSiteAlert } from "../hooks/useSiteAlertQueries";
import {
  ALERT_SEVERITY_STYLES,
  SupportedLanguage,
} from "../services/admin/types/siteAlert.types";

const StickyWarning = () => {
  const location = useLocation();
  const { i18n } = useTranslation();

  // Get language from i18n, default to 'en'
  const lang: SupportedLanguage =
    i18n.language === "da" ? "da" : "en";

  const { data: alertConfig, isLoading } = useSiteAlert(lang, 60000);

  // Don't render on admin pages (they have their own preview)
  if (location.pathname.startsWith("/admin")) {
    return null;
  }

  // Don't render if loading, disabled, or no message
  if (isLoading || !alertConfig?.enabled || !alertConfig?.message) {
    return null;
  }

  const styles =
    ALERT_SEVERITY_STYLES[alertConfig.severity] ||
    ALERT_SEVERITY_STYLES.warning;
  const Icon = alertConfig.severity === "info" ? GoInfo : GoAlert;

  return (
    <div className="fixed top-[57px] left-[15px] md:left-[69px] right-[15px] z-[101]">
      <div
        className="p-2 flex items-center justify-center gap-3 text-center rounded-lg"
        style={{ backgroundColor: styles.backgroundColor, color: styles.color }}
      >
        <Icon className="hidden min-[1100px]:block h-4 w-4 flex-shrink-0" />
        <span className="font-medium">{alertConfig.message}</span>
      </div>
    </div>
  );
};

export default StickyWarning;
