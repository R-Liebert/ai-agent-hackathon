import { useTranslation } from "react-i18next";
import { ChatComponent } from "../../components/Chat/ChatComponent";
import { MdFeedback } from "react-icons/md";
import { Helmet } from "react-helmet-async";

export const FeedbackChatPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <>
      <Helmet>
        <title>Feedback Chat - AI Launchpad</title>
        <meta
          name="description"
          content="Get help with providing feedback and reporting bugs"
        />
      </Helmet>
      <ChatComponent
        Icon={MdFeedback}
        chatType="Feedback"
        accentColor="#FF6B35"
        title="Feedback Assistant"
        moduleName={t("feedback:chatDialogueBox.title")}
        welcomeMessage={t("feedback:chatDialogueBox.welcomeMessage")}
        description={t("feedback:chatDialogueBox.description")}
        isModelSelectable={false}
        hasHistory={false}
        predefinedPrompts={
          t("feedback:predefinedPrompts", { returnObjects: true }) as any[]
        }
        showWelcome={true}
        placeholderText={t("feedback:chatDialogueBox.placeholderText")}
      />
    </>
  );
};
