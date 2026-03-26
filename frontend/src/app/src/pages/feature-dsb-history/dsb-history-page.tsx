import { useTranslation } from "react-i18next";
import { ChatComponent } from "../../components/Chat/ChatComponent";
import { IoLibrary } from "react-icons/io5";
import { Helmet } from "react-helmet-async";
import { useWorkspaces } from "../../hooks/useWorkspaces";

export const DsbHistoryPage: React.FC = () => {
  const { t } = useTranslation();
  const { workspaces } = useWorkspaces();
  return (
    <>
      <Helmet>
        <title>History Chat - AI Launchpad</title>
        <meta name="description" content="History Chat Page" />
      </Helmet>
      <ChatComponent
        Icon={IoLibrary}
        chatType="History"
        accentColor="#3782E1"
        title="History Chat (Beta)"
        moduleName={t("dsb-history:chatDialogueBox.title")}
        welcomeMessage={t("dsb-history:chatDialogueBox.title")}
        description={t("dsb-history:chatDialogueBox.description")}
        isModelSelectable={false}
        hasHistory={false}
        predefinedPrompts={
          t("dsb-history:predefinedPrompts", { returnObjects: true }) as any[]
        }
        showWelcome={true}
        userWorkspaces={workspaces}
      />
    </>
  );
};
