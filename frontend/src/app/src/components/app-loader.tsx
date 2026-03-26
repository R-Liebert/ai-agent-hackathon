import React from "react";
import CircularProgress from "@mui/material/CircularProgress";

const Loader: React.FC = () => {
  return (
    <div className="flex justify-center items-center bg-gray-950 bg-opacity-[95%]  h-screen w-full absolute top-0 right-0 z-[999]">
      <CircularProgress sx={{ color: "#FFFFFF" }} size={60} />
    </div>
  );
};

export default Loader;
