import ModalContainer from "./ModalContainer";
import {
  Button,
  CircularProgress,
  createTheme,
  ThemeProvider,
} from "@mui/material";

type ConfirmActionDialogProps = {
  open: boolean;
  title: string;
  message: string;
  cancelBtn: string;
  confirmBtn: string;
  onCancel: () => void;
  onConfirm: () => void;
  onClose: () => void;
  isLoading?: boolean;
  confirmButtonColor?:
    | "inherit"
    | "primary"
    | "secondary"
    | "success"
    | "error"
    | "info"
    | "warning";
};

const theme = createTheme({
  palette: {
    error: {
      main: "#B41730", // bg-red-800
      dark: "#C41A35", // hover:bg-red-700
      contrastText: "#ffffff", // Text color
    },
  },
});

const ConfirmActionDialog = ({
  open,
  title,
  message,
  cancelBtn,
  confirmBtn,
  onCancel,
  onConfirm,
  onClose,
  isLoading = false,
  confirmButtonColor = "error",
}: ConfirmActionDialogProps) => {
  return (
    <ThemeProvider theme={theme}>
      <ModalContainer
        open={open}
        title={title}
        onClose={onClose}
        width="max-w-md"
      >
        <div className="w-full flex flex-col h-auto border-none outline-none">
          <div>
            <p className="text-gray-300 text-[15.4px] font-body">{message}</p>
          </div>
          <div className="flex w-full justify-end pt-2 place-content-center gap-3 mt-2">
            <button
              aria-label={cancelBtn}
              className="flex place-content-center place-items-center rounded-full px-3 py-2 text-[14px] border-2 border-gray-350 font-medium bg-gray-600 text-white-100 hover:bg-gray-400 hover:text-superwhite
              focus:bg-gray-650 focus:text-white-100 font-body"
              onClick={onCancel}
            >
              {cancelBtn}
            </button>
            <Button
              variant="contained"
              color={confirmButtonColor}
              onClick={onConfirm}
              disabled={isLoading}
              sx={{
                borderRadius: "9999px",
                px: 1.6,
                py: 0.58,
                fontFamily: '"Nunito Sans", sans-serif',
                fontWeight: 500,
                textTransform: "none",
                fontSize: "14px",
                boxShadow: "none",
              }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                confirmBtn
              )}
            </Button>
          </div>
        </div>
      </ModalContainer>
    </ThemeProvider>
  );
};

export default ConfirmActionDialog;
