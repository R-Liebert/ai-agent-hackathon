import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChatComponent } from "../../components/Chat/ChatComponent";
import { MdChat } from "react-icons/md";
import { Helmet } from "react-helmet-async";
import { useWorkspaces } from "../../hooks/useWorkspaces";
import { useMsal } from "@azure/msal-react";
import { useLocation } from "react-router-dom";

// Utility function to pick a random item from an array
const getRandomMessage = (array: string[]): string => {
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
};

export const ChatPage: React.FC = () => {
  const { t } = useTranslation();
  const { workspaces } = useWorkspaces();
  const { accounts } = useMsal();
  const location = useLocation();
  const [welcomeMessage, setWelcomeMessage] = useState<string>("");

  const fullName = accounts?.[0]?.name ?? "";
  const firstName = fullName.split(" ")[0];

  const predefinedMessages: string[] = t(
    "dsb-chat:chatContent.predefinedWelcomeMessages",
    {
      returnObjects: true,
    }
  ) as string[];

  // Add the personalized message to the top of the list
  const allMessages = [
    t("dsb-chat:chatContent.chatDialogueBox.welcomeMessage", { firstName }), // Personalized message
    ...predefinedMessages, // Spread the predefined messages
  ];

  // Update the welcome message when the component mounts or when the route changes
  useEffect(() => {
    const randomMessage = getRandomMessage(allMessages); // Pick a random message
    setWelcomeMessage(randomMessage); // Set the random message
  }, [location.pathname]); // Re-run when the route changes

  const source = new URLSearchParams(location.search).get("source");

  return (
    <>
      <Helmet>
        <title>DSB Chat - AI Launchpad</title>
        <meta name="description" content="DSB Chat Page" />
      </Helmet>

      <ChatComponent
        Icon={MdChat}
        chatType="Normal"
        accentColor="#18AD9B"
        moduleName={t("dsb-chat:menuAppBar.title")}
        welcomeMessage={welcomeMessage}
        userWorkspaces={workspaces}
        showWelcome={true}
        entrySource={source ?? undefined}
        // Uncomment the following line to enable predefined prompts
        // predefinedPrompts={
        //   t("dsb-chat:predefinedPrompts", { returnObjects: true }) as any[]
        // }
      />
    </>
  );
};
