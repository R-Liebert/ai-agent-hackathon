import React, { useState, useRef } from "react";
import UploadButton from "./AppUploadButton";
import { AnimatePresence, motion } from "framer-motion";
import { IconType } from "react-icons";

interface AppDefaultProps {
  children: React.ReactNode;
  Icon?: IconType;
  iconSize?: number;
  colorCode: string;
  moduleName: string;
  placeholderText: string;
  noteText?: string;
  textWidth: string;
  getRootProps?: (options?: any) => any;
  getInputProps?: () => any;
  handleAction?: () => void;
}

const AppDefault: React.FC<AppDefaultProps> = ({
  getRootProps,
  getInputProps,
  placeholderText,
  moduleName,
  noteText,
  colorCode,
  Icon,
  iconSize,
  textWidth,
  children,
  handleAction,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const dragEnterTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleDragEnter = () => {
    dragEnterTimeout.current = setTimeout(() => {
      setIsDragOver(true);
    }, 200);
  };

  const handleDragLeave = () => {
    if (dragEnterTimeout.current) {
      clearTimeout(dragEnterTimeout.current);
      dragEnterTimeout.current = null;
    }
    setIsDragOver(false);
  };

  const handleDrop = () => {
    if (dragEnterTimeout.current) {
      clearTimeout(dragEnterTimeout.current);
      dragEnterTimeout.current = null;
    }
    setIsDragOver(false);
  };

  return (
    <AnimatePresence>
      <motion.main
        className="mt-6 sm:w-[30rem] w-[80%] xxxl:w-[36rem] mx-auto xxxl:h-[48rem] lg:h-[70vh] !h-[67vh] lg:max-h-[40rem] xxxl:max-h-[48rem] xxl:h-[74vh] min-h-[26rem] h-full place-items-center place-content-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-full flex flex-col justify-between h-full w-full xxxl:pl-0 mx-auto place-items-center place-content-center">
          <div className="w-full xxxl:h-[93.8%] xxl:h-[92%] lg:h-[91%] sm:h-[38rem] h-[28rem] flex flex-col lg:mb-0 mb-14">
            {getRootProps && getInputProps ? (
              <div
                {...getRootProps({
                  onDragEnter: handleDragEnter,
                  onDragLeave: handleDragLeave,
                  onDrop: handleDrop,
                  className: `cursor-pointer flex flex-col h-full flex-grow border-2 border-dashed rounded-2xl ${
                    isDragOver ? "bg-gray-900" : "bg-gray-750"
                  } border-gray-500 mb-4 xxxl:mb-6`,
                })}
              >
                <div className="h-full mb-4 flex items-center justify-center">
                  <input {...getInputProps()} />
                  <div className="flex flex-col w-full place-items-center place-content-center font-body">
                    <div
                      className={`rounded-full w-20 h-20 ${colorCode} mb-2 flex place-items-center place-content-center`}
                    >
                      {Icon && <Icon size={iconSize} />}
                    </div>
                    <div
                      className={`flex flex-col ${textWidth} place-items-center place-content-center`}
                    >
                      <p className="text-lg font-medium">{moduleName}</p>
                      <p className="text-gray-300 text-center text-md">
                        {placeholderText}
                      </p>
                    </div>
                    {noteText && (
                      <span className="text-gray-300 text-center mt-2 md:w-[90%] w-[70%]">
                        ( {noteText} )
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={handleAction}
                className="cursor-pointer flex h-full w-full flex-grow border-2 border-dashed rounded-2xl bg-gray-750 border-gray-500 mb-4 xxxl:mb-6"
              >
                <div className="h-full mb-4 flex items-center justify-center w-full h-full">
                  <div className="flex flex-col w-full place-items-center place-content-center font-body">
                    <div
                      className={`rounded-full w-20 h-20 ${colorCode} mb-2 flex place-items-center place-content-center`}
                    >
                      {Icon && <Icon size={iconSize} />}
                    </div>
                    <div
                      className={`flex flex-col ${textWidth} place-items-center place-content-center`}
                    >
                      <p className="text-lg font-medium">{moduleName}</p>
                      <p className="text-gray-300 text-center text-md">
                        {placeholderText}
                      </p>
                    </div>
                    {noteText && (
                      <span className="text-gray-300 text-center mt-2 w-[90%]">
                        ( {noteText} )
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )}
            {children}
          </div>
        </div>
      </motion.main>
    </AnimatePresence>
  );
};

export default AppDefault;
