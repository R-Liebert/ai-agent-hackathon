import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { MeetingNotesPage } from "./pages/feature-generator-meeting-notes/meeting-notes-page";
import MenuPage from "./pages/menu/MenuPage";
import { LoginPage } from "./pages/login/LoginPage";
import { BrowserRouter } from "react-router-dom";
import { MsalProvider } from "@azure/msal-react";
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
import { msalConfig } from "./config";
import { EventType, PublicClientApplication } from "@azure/msal-browser";
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
import AdminPage from "./pages/admin/admin-page";
import { logHMRUpdate } from "./utils/hmr";
import SessionExpiredDialog from "./components/Global/SessionExpiredDialog";
import { useSessionStore } from "./stores/sessionStore";
import { getAccessToken } from "./services/msalToken";
import {
  AuthenticatedTemplate,
  UnauthenticatedTemplate,
} from "@azure/msal-react";
import { registerMsalAuthEventTracking } from "./msalEventTracker";
import { useSubscriptionRouter } from "./pages/feature-maas";

export const msalInstance = new PublicClientApplication(msalConfig);

// Log HMR updates
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    logHMRUpdate("App component updated");
  });
}

// Ensure we always have an active account for token acquisition
msalInstance.addEventCallback((event) => {
  if (
    (event.eventType === EventType.LOGIN_SUCCESS ||
      event.eventType === EventType.SSO_SILENT_SUCCESS ||
      event.eventType === EventType.ACQUIRE_TOKEN_SUCCESS) &&
    (event as any).payload?.account
  ) {
    const account = (event as any).payload.account;
    // Only set if not already set, to avoid overriding explicit selections
    if (!msalInstance.getActiveAccount()) {
      msalInstance.setActiveAccount(account);
    }
    // Clear expired and drain queued requests on successful auth
    try {
      useSessionStore.getState().clearExpired();
      useSessionStore.getState().drainQueue();
      // Broadcast to other tabs
      try {
        localStorage.setItem("auth:recovered", Date.now().toString());
      } catch {}
    } catch {}
  }
});

registerMsalAuthEventTracking(msalInstance);

// Create a client
const queryClient = new QueryClient();

export default function App() {
  const GenericRoutes = useGenericRouter();
  const WorkspaceRoutes = useWorkspaceRouter();
  const SubscriptionRoutes = useSubscriptionRouter();

  // Proactive token refresh in visible tab
  useEffect(() => {
    let interval: number | undefined;
    const check = async () => {
      try {
        const account =
          msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0];
        const claims: any = account?.idTokenClaims;
        if (!claims?.exp) return;
        const expiresInMs = claims.exp * 1000 - Date.now();
        const isVisible = document.visibilityState === "visible";
        if (isVisible && expiresInMs > 0 && expiresInMs < 5 * 60 * 1000) {
          await getAccessToken(undefined, { forceRefresh: true });
        }
      } catch {}
    };
    const start = () => {
      if (interval) return;
      interval = window.setInterval(check, 60 * 1000);
    };
    const stop = () => {
      if (interval) {
        window.clearInterval(interval);
        interval = undefined;
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") start();
      else stop();
    };
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stop();
    };
  }, []);

  return (
    <AppInsightsErrorBoundaryProvider>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <MsalProvider instance={msalInstance}>
          <QueryClientProvider client={queryClient}>
            <HelmetProvider>
              <BrowserRouter>
                <NotificationProvider>
                  <AuthenticatedTemplate>
                    <AppInsightsContextProvider>
                      <SystemMaintenanceModal />
                      <SessionExpiredDialog />
                      <AuthProvider>
                        <UserConfigurationProvider>
                          <DndContextProvider>
                            <CanvasProvider>
                              <Routes>
                                <Route index element={<MenuPage />} />
                                <Route
                                  path="dsb-chat/*"
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
                  </AuthenticatedTemplate>
                  <UnauthenticatedTemplate>
                    <LoginPage />
                  </UnauthenticatedTemplate>
                </NotificationProvider>
              </BrowserRouter>
            </HelmetProvider>
          </QueryClientProvider>
        </MsalProvider>
      </LocalizationProvider>
    </AppInsightsErrorBoundaryProvider>
  );
}
