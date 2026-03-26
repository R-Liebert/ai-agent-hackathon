import React, { createContext, useContext, ReactNode } from "react";

interface ChatContextType {
  chatId: string | null;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
  chatId: string | null;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({
  children,
  chatId,
}) => {
  return (
    <ChatContext.Provider value={{ chatId }}>{children}</ChatContext.Provider>
  );
};

export const useChatContext = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
};
