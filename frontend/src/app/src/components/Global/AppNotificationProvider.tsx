import React, { ReactNode } from "react";
import {
  SnackbarProvider,
  closeSnackbar,
  MaterialDesignContent,
} from "notistack";
import { IconButton } from "@mui/material";
import { styled } from "@mui/system";
import { HiOutlineX } from "react-icons/hi";
import { TbBellRinging } from "react-icons/tb";

// Styled content for snackbar notifications
const StyledMaterialDesignContent = styled(MaterialDesignContent)(() => ({
  "&.notistack-MuiContent-success": {
    backgroundColor: "#16692D",
  },
  "&.notistack-MuiContent-error": {
    backgroundColor: "#A6363D",
  },
  "&.notistack-MuiContent-info": {
    backgroundColor: "#424242",
  },
  "&.notistack-MuiContent-warning": {
    backgroundColor: "#977A24",
  },
}));

interface NotificationProviderProps {
  children: ReactNode;
}

const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  return (
    <SnackbarProvider
      Components={{
        success: StyledMaterialDesignContent,
        error: StyledMaterialDesignContent,
        info: StyledMaterialDesignContent,
        warning: StyledMaterialDesignContent,
      }}
      className="font-body !font-medium !text-[16px] !text-white-100 !rounded-tl-xl !rounded-tr-xs !rounded-bl-xl !rounded-br-xl !py-2 !px-3 !pr-8 sm:!pr-3 md:!px-6 sm:!pr-6 !flex !flex-wrap !place-items-center w-full h-auto"
      maxSnack={4}
      action={(snackbarId) => (
        <IconButton
          onClick={() => closeSnackbar(snackbarId)}
          className="!absolute !top-[20%] !right-0 sm:!static"
        >
          <HiOutlineX
            size={22}
            strokeWidth={1.4}
            className="!text-white-100 !ml-0"
          />
        </IconButton>
      )}
      iconVariant={{
        success: <TbBellRinging size={24} strokeWidth={1.4} className="mr-3" />,
        error: <TbBellRinging size={24} strokeWidth={1.4} className="mr-3" />,
        info: <TbBellRinging size={24} strokeWidth={1.4} className="mr-3" />,
        warning: <TbBellRinging size={24} strokeWidth={1.4} className="mr-3" />,
      }}
    >
      {children}
    </SnackbarProvider>
  );
};

export default NotificationProvider;
