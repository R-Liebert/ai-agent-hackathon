import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { MeetingNotesPage } from "./pages/feature-generator-meeting-notes/meeting-notes-page";
import MenuPage from "./pages/menu/MenuPage";
import { LoginPage } from "./pages/login/LoginPage";
import { BrowserRouter } from "react-router-dom";
import { MsalProvider } from "./hooks/useMsalMock";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import Docuscan from "./pages/feature-docuscan/docuscan";
import "./i18n";
import UserConfigurationProvider from "./contexts/UserConfigurationProvider";
import { useWorkspaceRouter } from "./pages/feature-workspaces";
import { useGenericRouter } from "./pages/generic";
import { AuthProvider } from "./contexts/AuthProvider";
import { LeaderChatPage } from "./pages/feature-chatgpt-leader/leaderchat-page";
import { SelectedValueProvider } from "./contexts/SelectedValueContext";
import { ChatPage } from "./pages/feature-chatgpt/chat-page";
import SystemMaintenanceModal from "./components/system-maintenance";
import NotificationProvider from "./components/Global/AppNotificationProvider";
import { SurveyDialogModal } from "./components/SurveyDialog/SurveyDialogModal";
import { SurveysProvider } from "./components/SurveyDialog/SurveysContext";
import { DndContextProvider } from "./contexts/DndContext";
import { AppInsightsContextProvider } from "./telemetry/AppInsightsContextProvider";
import { AppInsightsErrorBoundaryProvider } from "./telemetry/AppInsightsErrorBoundaryProvider";
import { HelmetProvider } from "react-helmet-async";
import AiTrafficInformation from "./pages/feature-ai-traffic-information/ai-traffic-information";
import Feedback from "./pages/feedback/feedback";
import AdminRouter from "./pages/admin/AdminRouter";
import { FeedbackChatPage } from "./pages/feedback/feedback-chat-page";
import JobPostCreator from "./pages/feature-job-post-creator/job-post-creator";
import JobPostEditor from "./pages/feature-job-post-creator/job-post-editor";
import { CanvasProvider } from "./contexts/CanvasContext";
import SessionExpiredDialog from "./components/Global/SessionExpiredDialog";
import { useSubscriptionRouter } from "./pages/feature-maas";

// Create a client
const queryClient = new QueryClient();

export default function App() {
  const GenericRoutes = useGenericRouter();
  const WorkspaceRoutes = useWorkspaceRouter();
  const SubscriptionRoutes = useSubscriptionRouter();

  return (
    <AppInsightsErrorBoundaryProvider>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <QueryClientProvider client={queryClient}>
          <HelmetProvider>
            <BrowserRouter>
              <NotificationProvider>
                <AppInsightsContextProvider>
                  <SystemMaintenanceModal />
                  <SessionExpiredDialog />
                  <AuthProvider>
                    <UserConfigurationProvider>
                      <DndContextProvider>
                        <CanvasProvider>
                          <Routes>
                            <Route element={<MenuPage />} />
                            <Route
                              index
                              path="/*"
                              element={
                                <SelectedValueProvider>
                                  <ChatPage />
                                </SelectedValueProvider>
                              }
                            />
                            <Route
                              path="job-post-creator"
                              element={<JobPostCreator />}
                            />
                            <Route
                              path="job-post-creator/:jobPostId"
                              element={<JobPostEditor />}
                            />
                            <Route
                              path="meeting-note-generator/*"
                              element={<MeetingNotesPage />}
                            />
                            <Route
                              path="leader-chat/*"
                              element={<LeaderChatPage />}
                            />
                            <Route
                              path="docuscan/*"
                              element={<Docuscan />}
                            />
                            <Route
                              path="ai-traffic-information/*"
                              element={<AiTrafficInformation />}
                            />

                            <Route
                              path="give-feedback/*"
                              element={
                                window?.env?.features?.useFeedbackChat ? (
                                  <FeedbackChatPage />
                                ) : (
                                  <Feedback />
                                )
                              }
                            />
                            <Route
                              path="admin/*"
                              element={<AdminRouter />}
                            />
                            {GenericRoutes}
                            {WorkspaceRoutes}
                            {SubscriptionRoutes}
                          </Routes>
                        </CanvasProvider>
                        <SurveysProvider>
                          <SurveyDialogModal />
                        </SurveysProvider>
                      </DndContextProvider>
                    </UserConfigurationProvider>
                  </AuthProvider>
                </AppInsightsContextProvider>
              </NotificationProvider>
            </BrowserRouter>
          </HelmetProvider>
        </QueryClientProvider>
      </LocalizationProvider>
    </AppInsightsErrorBoundaryProvider>
  );
}
