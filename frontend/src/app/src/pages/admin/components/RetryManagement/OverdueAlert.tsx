import React from "react";
import { Alert, AlertTitle, Box, Button, Typography } from "@mui/material";
import { TbAlertTriangle, TbRefresh } from "react-icons/tb";

interface OverdueAlertProps {
  overdueCount: number;
  onProcessRetries?: () => void;
  isProcessing?: boolean;
}

const OverdueAlert: React.FC<OverdueAlertProps> = ({
  overdueCount,
  onProcessRetries,
  isProcessing,
}) => {
  if (overdueCount === 0) {
    return null;
  }

  const severity = overdueCount > 10 ? "error" : "warning";

  return (
    <Alert
      severity={severity}
      icon={<TbAlertTriangle size={24} />}
      action={
        onProcessRetries && (
          <Button
            color="inherit"
            size="small"
            startIcon={<TbRefresh />}
            onClick={onProcessRetries}
            disabled={isProcessing}
            sx={{
              color: "#EDEDED",
              "&:hover": {
                backgroundColor: "rgba(237, 237, 237, 0.1)"
              }
            }}
          >
            Process Now
          </Button>
        )
      }
      sx={{ 
        mb: 2,
        backgroundColor: overdueCount > 10 ? "#A6363D" : "#977A24",
        color: "#EDEDED",
        "& .MuiAlert-icon": {
          color: "#EDEDED"
        }
      }}
    >
      <AlertTitle>Overdue Retries</AlertTitle>
      <Typography variant="body2">
        You have <strong>{overdueCount}</strong> subscription
        {overdueCount !== 1 ? "s" : ""} overdue for retry. These subscriptions
        may need immediate attention.
      </Typography>
    </Alert>
  );
};

export default OverdueAlert;