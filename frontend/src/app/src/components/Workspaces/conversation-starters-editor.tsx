import { FormLabel, FormHelperText } from "@mui/material";
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from "uuid";
import Tooltip from "../Global/Tooltip";
import { IoHelpCircleSharp } from "react-icons/io5";
import { useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { ConversationStarterDto } from "../../models/workspace-model";
import { TbGridDots } from "react-icons/tb";
import { TbCirclePlus } from "react-icons/tb";
import { TbTrash } from "react-icons/tb";
import ClearIcon from "../../assets/icons/newchat-btn";
import { useEffect, useRef } from "react";

type ConversationStarterEx = ConversationStarterDto & {
  isRequired: boolean;
  isDirty: boolean;
};

const ItemType = "CONVERSATION_STARTER";

export type ConversationStartersEditorProps = {
  value: ConversationStarterDto[];
  onChange: (value: ConversationStarterDto[]) => void;
};

const ConversationStartersEditor = ({
  value,
  onChange,
}: ConversationStartersEditorProps) => {
  const { t } = useTranslation();

  const [conversationStarters, setConversationStarters] = useState<
    ConversationStarterEx[]
  >(
    value?.map((x) => ({
      ...x,
      isRequired: false,
      isDirty: false,
    })) ?? []
  );

  const updateConversationStarters = (newState: ConversationStarterEx[]) => {
    setConversationStarters(newState);
    setTimeout(() => {
      onChange(newState.map((x) => x as ConversationStarterDto));
    }, 200);
  };

  const maxNumberOfItems = 4;

  const moveItem = (fromIndex: number, toIndex: number) => {
    const updatedList = [...conversationStarters];
    const [movedItem] = updatedList.splice(fromIndex, 1);
    updatedList.splice(toIndex, 0, movedItem);
    updateConversationStarters(updatedList);
  };

  const deleteItem = (id: string) => {
    if (conversationStarters.length === 1) {
      clearItem(id);
    } else {
      updateConversationStarters(
        conversationStarters.filter((item) => item.id !== id)
      );
    }
  };

  const clearItem = (id: string) => {
    const updatedList = conversationStarters.map((item) =>
      item.id === id ? { ...item, content: "" } : item
    );
    updateConversationStarters(updatedList);
  };

  const addItem = () => {
    if (conversationStarters.length < maxNumberOfItems) {
      updateConversationStarters([
        ...conversationStarters,
        {
          id: uuidv4().toString(),
          content: "",
          isRequired: false,
          isDirty: false,
        },
      ]);
    }
  };

  const updateContent = (index: number, value: string) => {
    const updatedList = [...conversationStarters];
    updatedList[index].content = value;
    updatedList[index].isDirty = true;

    updatedList[index].isRequired = !value.trim();

    updateConversationStarters(updatedList);
  };

  return (
    <>
      <DndProvider backend={HTML5Backend}>
        <FormLabel className="flex gap-2 place-items-center relative !font-body !text-md !w-full !text-white-100 mt-10 mb-2 group !cursor-pointer">
          {t("workspaces:common.starterPrompts.label")}
          <Tooltip
            width="w-auto"
            text="workspaces:common.starterPrompts.labelTooltip"
            position="left-[6.8rem] bottom-7"
          />
          <IoHelpCircleSharp size={22} />
        </FormLabel>

        <div className="flex flex-col gap-2 w-full">
          {conversationStarters?.map((item, index) => (
            <DraggableRow
              key={item.id}
              item={item}
              index={index}
              moveItem={moveItem}
              onDelete={deleteItem}
              onClear={clearItem}
              onContentChange={updateContent}
              isRequired={item.isRequired}
            />
          ))}
        </div>
        {conversationStarters?.length < 4 && (
          <button
            className="w-full py-3 rounded-xl bg-gray-600 flex place-items-center place-content-center text-left mt-4 capitalize"
            aria-label={t("workspaces:common.starterPrompts.btnText")}
            onClick={addItem}
          >
            <TbCirclePlus size={24} strokeWidth={1.2} />
            <span className="text-white-100 ml-2 font-body">
              {t("workspaces:common.starterPrompts.btnText")}
            </span>
          </button>
        )}
      </DndProvider>
    </>
  );
};

const DraggableRow = ({
  item,
  index,
  moveItem,
  onDelete,
  onClear,
  onContentChange,
  isRequired,
}: any) => {
  const isDraggable = !!item.content.trim();
  const maxLength = 80;
  const { t } = useTranslation();

  const [rows, setRows] = useState(1);
  const [error, setError] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const adjustRows = () => {
    if (textareaRef.current) {
      const lineHeight = 28;
      const scrollHeight = textareaRef.current.scrollHeight;
      const newRows = Math.max(1, Math.ceil(scrollHeight / lineHeight));
      setRows(newRows);
    }
  };

  useEffect(() => {
    adjustRows();
  }, [item.content]);

  const [, ref] = useDrag({
    type: ItemType,
    item: { index },
    canDrag: isDraggable,
  });

  const [, drop] = useDrop({
    accept: ItemType,
    hover: (draggedItem: { index: number }) => {
      if (draggedItem.index !== index) {
        moveItem(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  });

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const isError = newContent.length === maxLength;
    setError(isError);

    if (!isError) {
      onContentChange(index, newContent);
    }
    adjustRows();
  };

  return (
    <>
      <div
        ref={(node) => drop(node)}
        className={`border-gray-500 flex items-center gap-2 border-2 p-3 rounded-xl w-full rouded-2xl focus:!border-white-100`}
      >
        <button
          aria-label={t("workspaces:common.starterPrompts.dragTooltip")}
          ref={isDraggable ? ref : null}
          className={`relative group ${
            isDraggable ? "cursor-grab" : "cursor-not-allowed"
          }`}
        >
          <Tooltip
            width="w-[9rem]"
            text="workspaces:common.starterPrompts.dragTooltip"
            position="-left-2 bottom-10 text-left"
          />
          <TbGridDots
            size={24}
            className={`${isDraggable ? "text-white-100" : "text-gray-300"}`}
          />
        </button>

        <div className="flex-1 flex items-center">
          <textarea
            ref={textareaRef}
            rows={rows}
            data-testid="system-message"
            maxLength={maxLength}
            value={item.content}
            onChange={handleContentChange}
            className={`w-full !text-left border-none font-body text-md text-white-100 outline-none bg-transparent resize-none placeholder-gray-300`}
            placeholder={t("workspaces:common.starterPrompts.placeholder")}
          />
        </div>
        <div className="flex gap-2 place-items-center">
          <button
            aria-label={t("workspaces:common.starterPrompts.icons.clearIcon")}
            onClick={() => onClear(item.id)}
          >
            <ClearIcon />
          </button>
          <button
            aria-label={t("workspaces:common.starterPrompts.icons.deleteIcon")}
            onClick={() => onDelete(item.id)}
          >
            <TbTrash size={22} strokeWidth={1.2} />
          </button>
        </div>
      </div>
      {error && (
        <FormHelperText error>
          {t("workspaces:common.starterPrompts.errorMessage")}
        </FormHelperText>
      )}
    </>
  );
};

export default ConversationStartersEditor;
