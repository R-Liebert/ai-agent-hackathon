import React from "react";
import { Skeleton } from "@mui/material";
import useWindowSize from "../../hooks/useWindowSize";

const CodeLoadingSkeleton = ({}) => {
  const { width } = useWindowSize();
  const getResponsiveHeight = () => {
    if (width >= 2000) return 144; // Large screens
    if (width >= 1800) return 110; // Medium screens
    return 80; // Small screens
  };

  const shouldShowLastBlock = width > 2566;

  return (
    <div className="mt-6 w-full flex flex-col xxxl:gap-12 xxl:gap-10 lg:gap-[2.44rem] gap-6 lg:mb-0 mb-14">
      <div className="w-full flex flex-col gap-2">
        <div className="!rounded-lg !bg-gray-650 w-full overflow-hidden !w-[30%]">
          {" "}
          <Skeleton variant="rectangular" width="100%" animation="pulse" />
        </div>
        <div className="!rounded-2xl !bg-gray-650 w-full overflow-hidden">
          <Skeleton
            variant="rectangular"
            width="100%"
            height={getResponsiveHeight()}
            animation="pulse"
          />
        </div>
      </div>
      <div className="w-full flex flex-col gap-2">
        <div className="!rounded-lg !bg-gray-650 w-full overflow-hidden !w-[30%]">
          {" "}
          <Skeleton variant="rectangular" width="100%" animation="pulse" />
        </div>
        <div className="!rounded-2xl !bg-gray-650 w-full overflow-hidden">
          <Skeleton
            variant="rectangular"
            width="100%"
            height={getResponsiveHeight()}
            animation="pulse"
          />
        </div>
        <div className="!rounded-xl !bg-gray-650 w-full overflow-hidden">
          <Skeleton
            variant="rectangular"
            width="100%"
            height={getResponsiveHeight() / 2}
            animation="pulse"
          />
        </div>
      </div>
      {shouldShowLastBlock && (
        <div className="w-full flex flex-col gap-2">
          <div className="!rounded-lg !bg-gray-650 w-full overflow-hidden !w-[30%]">
            {" "}
            <Skeleton variant="rectangular" width="100%" animation="pulse" />
          </div>
          <div className="!rounded-2xl !bg-gray-650 w-full overflow-hidden">
            <Skeleton
              variant="rectangular"
              width="100%"
              height={getResponsiveHeight()}
              animation="pulse"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeLoadingSkeleton;
