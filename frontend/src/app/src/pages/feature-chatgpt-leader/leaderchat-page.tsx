import { useTranslation } from "react-i18next";
import { ChatComponent } from "../../components/Chat/ChatComponent";
import { MdChat } from "react-icons/md";
import { Helmet } from "react-helmet-async";

export const LeaderChatPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <>
      <Helmet>
        <title>Leader Chat - AI Launchpad</title>
        <meta name="description" content="Leader Chat Page" />
      </Helmet>
      <ChatComponent
        Icon={MdChat}
        chatType="Manager"
        accentColor="#13717A"
        title="Leader Chat"
        moduleName={t("leader-chat:menuAppBar.title")}
        welcomeMessage={t("leader-chat:chatDialogueBox.title")}
        description={t("leader-chat:chatDialogueBox.description")}
        isModelSelectable={false}
        predefinedPrompts={
          t("leader-chat:predefinedPrompts", { returnObjects: true }) as any[]
        }
        showWelcome={true}
      />
    </>
  );
};
