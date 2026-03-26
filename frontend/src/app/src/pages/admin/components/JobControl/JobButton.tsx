import React, { useState } from "react";
import {
  Button,
  Box,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";

interface JobButtonProps {
  title: string;
  description: string;
  icon: React.ReactElement;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  color?: "primary" | "secondary" | "error" | "warning" | "info" | "success";
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

const JobButton: React.FC<JobButtonProps> = ({
  title,
  description,
  icon,
  onClick,
  disabled = false,
  loading = false,
  color = "primary",
  requiresConfirmation = false,
  confirmationMessage,
}) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleClick = () => {
    if (requiresConfirmation) {
      setShowConfirmDialog(true);
    } else {
      onClick?.();
    }
  };

  const handleConfirm = () => {
    setShowConfirmDialog(false);
    onClick?.();
  };

  const handleCancel = () => {
    setShowConfirmDialog(false);
  };

  return (
    <>
      <Button
        variant="outlined"
        color={color}
        fullWidth
        onClick={handleClick}
        disabled={disabled || loading}
        startIcon={loading ? <CircularProgress size={20} sx={{ color: "#EDEDED" }} /> : icon}
        className="!border-gray-500 hover:!border-gray-400 hover:!bg-gray-650"
        sx={{
          justifyContent: "flex-start",
          textAlign: "left",
          p: 2.5,
          height: "auto",
          minHeight: 80,
          flexDirection: "column",
          alignItems: "flex-start",
          borderRadius: 2,
          transition: "all 0.2s ease-in-out",
          color: "#EDEDED",
          "&:hover": {
            transform: "translateY(-2px)",
            color: "#EDEDED",
          },
          "&:disabled": {
            transform: "none",
            color: "#6a6a6a",
            borderColor: "#424242",
          }
        }}
      >
        <Box>
          <Typography variant="subtitle2" component="div" className="!text-white-100 !font-body" fontWeight={600}>
            {title}
          </Typography>
          <Typography
            variant="caption"
            component="div"
            className="!text-gray-300 !font-body"
            sx={{ mt: 0.5 }}
          >
            {description}
          </Typography>
        </Box>
      </Button>

      {requiresConfirmation && (
        <Dialog open={showConfirmDialog} onClose={handleCancel}>
          <DialogTitle>{title}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {confirmationMessage || `Are you sure you want to ${title.toLowerCase()}?`}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancel} color="inherit">
              Cancel
            </Button>
            <Button onClick={handleConfirm} color={color} variant="contained">
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};

export default JobButton;