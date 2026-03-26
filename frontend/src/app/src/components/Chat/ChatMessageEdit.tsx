import React, { useState } from "react";
import TextareaAutosize from "react-textarea-autosize";

import { useTranslation } from "react-i18next";

interface ChatEditMessageProps {
  initialMessage: string;
  onSave: (updatedMessage: string) => void;
  onCancel: () => void;
}

const ChatMessageEdit: React.FC<ChatEditMessageProps> = ({
  initialMessage,
  onSave,
  onCancel,
}) => {
  const { t } = useTranslation();
  const [editedMessage, setEditedMessage] = useState(initialMessage);

  const handleSaveClick = () => {
    // Validate that the message is not empty or just whitespace
    if (editedMessage.trim() === "") {
      return; // Don't save empty messages
    }
    onSave(editedMessage.trim());
  };

  const handleCancelClick = () => {
    setEditedMessage(initialMessage); // Reset to the original message
    onCancel();
  };

  return (
    <div className="flex flex-col space-y-6 py-4 px-6 bg-gray-600 rounded-3xl w-full items-end">
      <TextareaAutosize
        value={editedMessage}
        onChange={(e) => setEditedMessage(e.target.value)}
        className="w-full bg-transparent border-none outline-none resize-none overflow-hidden text-white"
        minRows={1}
      />
      <div className="flex gap-2">
        <button
          onClick={handleCancelClick}
          className="flex place-content-center place-items-center rounded-full px-3 py-2 text-sm bg-gray-900 text-white-100 hover:bg-gray-950 hover:text-white-100 focus:bg-gray-950 focus:text-white-100 font-body transition-colors duration-300 ease-in-out"
        >
          {t("common:chatEditMessageButtons.cancel")}
        </button>
        <button
          onClick={handleSaveClick}
          disabled={editedMessage.trim() === ""}
          className={`flex place-content-center place-items-center rounded-full px-3 py-2 text-sm font-body font-semibold transition-colors duration-300 ease-in-out ${
            editedMessage.trim() === ""
              ? "bg-gray-400 text-gray-300 cursor-not-allowed opacity-50"
              : "bg-white-200 hover:bg-red-700 text-gray-600 hover:text-white-100"
          }`}
        >
          {t("common:chatEditMessageButtons.save")}
        </button>
      </div>
    </div>
  );
};

export default ChatMessageEdit;
