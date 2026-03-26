import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export const ChatFooter: React.FC = () => {
  const { t } = useTranslation();
  const [displayText, setDisplayText] = useState<string>("");

  // Update footer text based on screen size
  const updateFooterText = () => {
    const isMobileView = window.innerWidth < 768; // Mobile breakpoint
    setDisplayText(
      isMobileView
        ? t("common:footerNotes.descriptionMobile") // Mobile-specific text
        : t("common:footerNotes.description") // Default text
    );
  };

  useEffect(() => {
    updateFooterText();

    window.addEventListener("resize", updateFooterText);

    return () => {
      window.removeEventListener("resize", updateFooterText);
    };
  }, [t]);

  return (
    <div className="flex center mt-2 font-body text-[13px] text-gray-300">
      {displayText}
      <a
        href="https://dsbintranet.sharepoint.com/sites/trAIn_/SitePages/Guidelines-for-ansvarlig-brug-af-AI.aspx?web=1"
        target="_blank"
        rel="noopener noreferrer"
        className="ml-1 underline text-[13px]"
      >
        {t("common:footerNotes.linkText")}.
      </a>
    </div>
  );
};
