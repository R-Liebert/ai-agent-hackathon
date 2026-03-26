import { enqueueSnackbar } from "notistack";

const defaultAutoHideDuration = 2200;

const hideIconVariant = false;

// Helper function to generate unique keys
const generateUniqueKey = (message: string) => {
  return `${message}_${Date.now()}_${Math.random()
    .toString(36)
    .substring(2, 9)}`;
};

const success = (
  message: string,
  autoHideDuration?: number,
  persist: boolean = false
) => {
  enqueueSnackbar(message, {
    key: generateUniqueKey(message),
    variant: "success",
    hideIconVariant,
    persist,
    autoHideDuration: autoHideDuration || defaultAutoHideDuration,
    anchorOrigin: {
      horizontal: "right",
      vertical: "bottom",
    },
  });
};

// Repeat similar structure for other notification types
const error = (message: string, autoHideDuration?: number, persist = false) => {
  enqueueSnackbar(message, {
    key: generateUniqueKey(message),
    variant: "error",
    hideIconVariant,
    persist,
    autoHideDuration: autoHideDuration || defaultAutoHideDuration,
    anchorOrigin: {
      horizontal: "right",
      vertical: "bottom",
    },
  });
};

const warn = (message: string, autoHideDuration?: number, persist = false) => {
  enqueueSnackbar(message, {
    key: generateUniqueKey(message),
    variant: "warning",
    hideIconVariant,
    persist,
    autoHideDuration: autoHideDuration || defaultAutoHideDuration,
    anchorOrigin: {
      horizontal: "right",
      vertical: "bottom",
    },
  });
};

const info = (message: string, autoHideDuration?: number, persist = false) => {
  enqueueSnackbar(message, {
    key: generateUniqueKey(message),
    variant: "info",
    hideIconVariant,
    persist,
    autoHideDuration: autoHideDuration || defaultAutoHideDuration,
    anchorOrigin: {
      horizontal: "right",
      vertical: "bottom",
    },
  });
};

export const notificationsService = {
  success,
  error,
  warn,
  info,
};
