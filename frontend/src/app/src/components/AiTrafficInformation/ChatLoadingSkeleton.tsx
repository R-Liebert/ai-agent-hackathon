import React from "react";
import { Skeleton } from "@mui/material";

interface ChatLoadingSkeletonProps {
  isRegenerating?: boolean;
}

const ChatLoadingSkeleton = React.memo<ChatLoadingSkeletonProps>(
  ({ isRegenerating = false }) => {
    return (
      <>
        {!isRegenerating ? (
          <div
            className="w-full flex flex-col gap-6"
            role="status"
            aria-live="polite"
          >
            <span className="sr-only">
              Generating traffic information content, please wait...
            </span>
            <span aria-hidden="true">Generating Content...</span>
            <div className="flex space-x-4 w-full mb-2">
              <div className="!rounded-xl !bg-gray-600 overflow-hidden !w-[14%]">
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height={40}
                  animation="pulse"
                />
              </div>
              <div className="!rounded-xl !bg-gray-600 overflow-hidden !w-[14%]">
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height={40}
                  animation="pulse"
                />
              </div>
              <div className="!rounded-xl !bg-gray-600 overflow-hidden !w-[14%]">
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height={40}
                  animation="pulse"
                />
              </div>
            </div>
            <div className="w-full flex flex-col gap-3">
              <div className="!rounded-lg !bg-gray-600 overflow-hidden !w-[100%]">
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height={28}
                  animation="pulse"
                />
              </div>
              <div className="!rounded-lg !bg-gray-600 overflow-hidden !w-[100%]">
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height={28}
                  animation="pulse"
                />
              </div>
              <div className="!rounded-lg !bg-gray-600 overflow-hidden !w-[100%]">
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height={28}
                  animation="pulse"
                />
              </div>
              <div className="!rounded-lg !bg-gray-600 overflow-hidden !w-[40%]">
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height={28}
                  animation="pulse"
                />
              </div>
            </div>
          </div>
        ) : (
          <div
            className="w-full flex flex-col gap-6"
            role="status"
            aria-live="polite"
          >
            <span className="sr-only">
              Regenerating content, please wait...
            </span>
            <div className="w-full flex flex-col gap-3">
              <div className="!rounded-lg !bg-gray-600 overflow-hidden !w-[100%]">
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height={28}
                  animation="pulse"
                />
              </div>
              <div className="!rounded-lg !bg-gray-600 overflow-hidden !w-[100%]">
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height={28}
                  animation="pulse"
                />
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
);

ChatLoadingSkeleton.displayName = "ChatLoadingSkeleton";

export default ChatLoadingSkeleton;
