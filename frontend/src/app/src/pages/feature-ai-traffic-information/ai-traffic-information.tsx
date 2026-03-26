import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { Navigate } from "react-router-dom";
import {
  TrafficInformationProvider,
  useTrafficInformationContext,
} from "../../contexts/TrafficInformationContext";
import { TrafficInformationInterface } from "../../components/AiTrafficInformation/TrafficInformationInterface";
import AppHeader from "../../components/Global/AppHeader";
import { ChatFooter } from "../../components/Chat/ChatFooter";
import {
  useCanUseTrafficInformation,
  usePermissions,
} from "../../contexts/AuthProvider";
import { CircularProgress } from "@mui/material";
import PageTransitionContainer from "../../components/Global/PageTransitionContainer";

const AiTrafficInformationContent: React.FC = () => {
  const { t } = useTranslation();
  const { resetAll, tabContents, isGenerating } =
    useTrafficInformationContext();

  const handleReset = () => {
    resetAll();
  };

  // Check if we have any content to display (same logic as in TrafficInformationInterface)
  const hasContent =
    Object.values(tabContents).some(
      (tab) => tab.content.Danish || tab.content.English || tab.isLoading
    ) || isGenerating;

  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isGenerating && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [isGenerating]);

  return (
    <>
      <Helmet>
        <title>AI Traffic Information - AI Launchpad</title>
        <meta name="description" content="AI Traffic Information Page" />
      </Helmet>

      <AppHeader
        title={t("traffic-information:menuAppBar.title")}
        handleReset={handleReset}
        moduleName="AI Traffic Information"
        returnBtnText={t("codechat:menuLink")}
        showContent={true}
        resetMeetingNotes={hasContent}
      />
      <PageTransitionContainer>
        <div
          ref={containerRef}
          className={`${
            isGenerating ? "h-auto" : "h-screen"
          } !space-between flex flex-col`}
        >
          <TrafficInformationInterface accentColor="#13717A" />
          <div ref={bottomRef} className="mb-3 px-4">
            <ChatFooter />
          </div>
        </div>
      </PageTransitionContainer>
    </>
  );
};

const AiTrafficInformation: React.FC = () => {
  const canUseTrafficInformation = useCanUseTrafficInformation();
  const { isLoadingPermissions } = usePermissions();

  // Show loading spinner while permissions are being fetched
  if (isLoadingPermissions) {
    return (
      <div className="flex items-center justify-center h-screen">
        <CircularProgress size={40} />
      </div>
    );
  }

  // Redirect to home page if user doesn't have permission
  if (!canUseTrafficInformation) {
    return <Navigate to="/" replace />;
  }

  return (
    <TrafficInformationProvider>
      <AiTrafficInformationContent />
    </TrafficInformationProvider>
  );
};

export default AiTrafficInformation;
