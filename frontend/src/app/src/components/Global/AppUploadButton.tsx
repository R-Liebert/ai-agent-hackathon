import React from "react";

interface UploadButtonProps {
  buttonText: string;
  getRootProps: () => any;
  getInputProps: () => any;
}

const AppUploadButton: React.FC<UploadButtonProps> = ({
  getRootProps,
  getInputProps,
  buttonText,
}) => {
  return (
    <button
      aria-label={buttonText}
      className="dropzone rounded-full w-full bg-white-200 text-gray-700 !font-body py-4 font-semibold flex items-center justify-center hover:bg-red-600 hover:text-white-100 transition-color duration-300 ease-out"
      {...getRootProps()} // Call getRootProps without any arguments
    >
      <input {...getInputProps()} style={{ display: "none" }} />
      {buttonText}
    </button>
  );
};

export default AppUploadButton;
