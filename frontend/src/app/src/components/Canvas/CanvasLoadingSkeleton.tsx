import React from "react";
import { Skeleton } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";

interface CanvasLoadingSkeletonProps {
  jobPostHeaders?: string[];
  canvasContentWidth: string;
}

const CanvasLoadingSkeleton: React.FC<CanvasLoadingSkeletonProps> = ({
  jobPostHeaders,
  canvasContentWidth,
}) => {
  const skeletonCounts: { [header: string]: number } = {
    Header: 1,
    Appetizer: 2,
    "Short Introduction": 3,
    "Team Description": 2,
    "Job Description": 4,
    Qualifications: 4,
  };

  return (
    <AnimatePresence>
      {!jobPostHeaders ? (
        <motion.div
          className={`${canvasContentWidth} mx-auto flex flex-col gap-10`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }} // Animation duration
        >
          <div className="w-full flex flex-col gap-3">
            <div className="!rounded-lg !bg-gray-650 overflow-hidden !w-[100%]">
              <Skeleton
                variant="rectangular"
                width="100%"
                height={28}
                animation="pulse"
              />
            </div>
            <div className="!rounded-lg !bg-gray-650 overflow-hidden !w-[100%]">
              <Skeleton
                variant="rectangular"
                width="100%"
                height={28}
                animation="pulse"
              />
            </div>
            <div className="!rounded-lg !bg-gray-650 overflow-hidden !w-[100%]">
              <Skeleton
                variant="rectangular"
                width="100%"
                height={28}
                animation="pulse"
              />
            </div>
            <div className="!rounded-lg !bg-gray-650 overflow-hidden !w-[40%]">
              <Skeleton
                variant="rectangular"
                width="100%"
                height={28}
                animation="pulse"
              />
            </div>
          </div>
          <div className="w-full flex flex-col gap-3">
            <div className="!rounded-lg !bg-gray-650 overflow-hidden !w-[100%]">
              <Skeleton
                variant="rectangular"
                width="100%"
                height={28}
                animation="pulse"
              />
            </div>
            <div className="!rounded-lg !bg-gray-650 overflow-hidden !w-[100%]">
              <Skeleton
                variant="rectangular"
                width="100%"
                height={28}
                animation="pulse"
              />
            </div>
            <div className="!rounded-lg !bg-gray-650 overflow-hidden !w-[100%]">
              <Skeleton
                variant="rectangular"
                width="100%"
                height={28}
                animation="pulse"
              />
            </div>
            <div className="!rounded-lg !bg-gray-650 overflow-hidden !w-[100%]">
              <Skeleton
                variant="rectangular"
                width="100%"
                height={28}
                animation="pulse"
              />
            </div>
            <div className="!rounded-lg !bg-gray-650 overflow-hidden !w-[40%]">
              <Skeleton
                variant="rectangular"
                width="100%"
                height={28}
                animation="pulse"
              />
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          className={`${canvasContentWidth} mx-auto flex flex-col gap-4`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }} // Animation duration
        >
          {jobPostHeaders.map((item, index) => {
            const count = skeletonCounts[item] || 1;

            return (
              <div key={index} className="w-full flex flex-col gap-2">
                <h2 className="text-md font-medium w-full font-body text-white-100">
                  {item}
                </h2>
                {Array.from({ length: count }).map((_, skeletonIndex) => (
                  <div
                    key={skeletonIndex}
                    className="rounded-lg lg:bg-gray-650 bg-gray-600 overflow-hidden w-full"
                  >
                    <Skeleton
                      variant="rectangular"
                      width="100%"
                      height={24}
                      animation="pulse"
                    />
                  </div>
                ))}
              </div>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CanvasLoadingSkeleton;
