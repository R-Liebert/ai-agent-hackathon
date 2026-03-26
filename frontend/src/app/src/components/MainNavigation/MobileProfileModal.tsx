import React from "react";
import {
  Dialog,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Slide,
} from "@mui/material";
import { TransitionProps } from "@mui/material/transitions";
import { TbX } from "react-icons/tb";
import { useTranslation } from "react-i18next";
import { IconType } from "react-icons";

interface MobileProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileName?: string | null;
  profilePhoto?: string | null;
  menuItems: Array<{
    label: string;
    Icon: IconType;
    onClick: () => void;
  }>;
  onMenuItemClick?: () => void;
}

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function MobileProfileModal({
  isOpen,
  onClose,
  profileName,
  profilePhoto,
  menuItems,
  onMenuItemClick,
}: MobileProfileModalProps) {
  const { t } = useTranslation();

  const getFirstLetter = () => {
    if (!profileName) return "";
    return profileName.charAt(0).toUpperCase();
  };

  return (
    <Dialog
      fullScreen
      open={isOpen}
      onClose={onClose}
      TransitionComponent={Transition}
      className="md:hidden"
      sx={{
        "& .MuiDialog-paper": {
          backgroundColor: "#212121",
        },
      }}
    >
      <AppBar sx={{ position: "relative", backgroundColor: "#212121" }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={onClose}
            aria-label="Close profile menu"
          >
            <TbX size={24} />
          </IconButton>
          <Typography
            sx={{ ml: 2, flex: 1, fontFamily: "Nunito Sans" }}
            variant="h6"
          >
            {t("components:profileTabLinks.profileTitle")}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box className="p-8 text-center bg-gray-800">
        {profilePhoto ? (
          <img
            src={profilePhoto}
            alt={`Profile of ${profileName}`}
            className="w-20 h-20 rounded-full mx-auto mb-4"
          />
        ) : (
          <div className="w-20 h-20 rounded-full mx-auto mb-4 bg-purple flex items-center justify-center text-3xl font-bold text-superwhite">
            {getFirstLetter()}
          </div>
        )}
        <Typography
          variant="h6"
          className="text-superwhite font-body"
          sx={{ fontFamily: "Nunito Sans" }}
        >
          {profileName}
        </Typography>
      </Box>

      <List className="bg-gray-800 flex-1">
        {menuItems.map((item, index) => (
          <ListItem
            key={index}
            button
            onClick={() => {
              item.onClick();
              onClose();
              // Close sidebar on mobile after menu item click
              if (onMenuItemClick) {
                onMenuItemClick();
              }
            }}
            className="py-4 border-b border-gray-700 hover:bg-gray-600 transition-colors"
            sx={{
              "&:hover": {
                backgroundColor: "#2F2F2F",
              },
            }}
          >
            <ListItemIcon>
              <item.Icon size={24} className="text-gray-300" />
            </ListItemIcon>
            <ListItemText
              primary={t(item.label)}
              primaryTypographyProps={{
                className: "text-superwhite font-body",
                sx: { fontFamily: "Nunito Sans" },
              }}
            />
          </ListItem>
        ))}
      </List>
    </Dialog>
  );
}
