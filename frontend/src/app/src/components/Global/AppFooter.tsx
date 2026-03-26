import React, { FC } from "react";
import { ChatFooter } from "../Chat/ChatFooter";

interface AppFooterProps {
  className?: string;
}

const AppFooter: FC<AppFooterProps> = ({ className }) => {
  return (
    <footer
      className={` ${
        className
          ? className
          : "relative z-99 xxxl:mt-12 xxl:mt-10 lg:mb-3 xxl:mb-0 lg:mt-6 mt-8 mb-4"
      } text-gray-300 w-full text-center`}
    >
      <ChatFooter />
    </footer>
  );
};

export default AppFooter;
