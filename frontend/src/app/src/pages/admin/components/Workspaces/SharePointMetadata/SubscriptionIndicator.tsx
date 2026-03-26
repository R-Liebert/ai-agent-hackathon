import React from "react";
import { Box } from "@mui/material";
import { SubscriptionStatus } from "../../../hooks/useSubscriptionQueries";
import Tooltip from "../../../../../components/Global/Tooltip";

interface SubscriptionIndicatorProps {
  status: SubscriptionStatus;
  driveId: string;
}

const SubscriptionIndicator: React.FC<SubscriptionIndicatorProps> = ({
  status,
  driveId,
}) => {
  const getIndicatorStyle = () => {
    if (!status.exists) {
      // No subscription - gray dot
      return {
        backgroundColor: "#6b7280",
        boxShadow: "0 0 4px rgba(107, 114, 128, 0.4)",
        borderColor: "#9ca3af",
      };
    }

    if (status.isActive && status.status === "Active") {
      // Active subscription - green dot with glow
      return {
        backgroundColor: "#22c55e",
        boxShadow:
          "0 0 8px rgba(34, 197, 94, 0.6), 0 0 16px rgba(34, 197, 94, 0.3)",
        borderColor: "#16a34a",
      };
    }

    if (status.exists && status.status === "NotFound") {
      // Subscription exists but not found in Graph - orange dot
      return {
        backgroundColor: "#f59e0b",
        boxShadow: "0 0 6px rgba(245, 158, 11, 0.5)",
        borderColor: "#d97706",
      };
    }

    if (status.exists && status.status === "ValidationError") {
      // Subscription exists but has validation error - red dot
      return {
        backgroundColor: "#ef4444",
        boxShadow: "0 0 6px rgba(239, 68, 68, 0.5)",
        borderColor: "#dc2626",
      };
    }

    // Default inactive - gray dot
    return {
      backgroundColor: "#6b7280",
      boxShadow: "0 0 4px rgba(107, 114, 128, 0.4)",
      borderColor: "#9ca3af",
    };
  };

  const getTooltipText = () => {
    if (!status.exists) {
      return `No subscription found for drive ${driveId.substring(0, 8)}...`;
    }

    const shortDriveId = driveId.substring(0, 8) + "...";
    const subscriptionId =
      status.subscription?.subscriptionId?.substring(0, 8) + "..." || "Unknown";

    if (status.isActive && status.status === "Active") {
      return `🟢 Active subscription\nDrive: ${shortDriveId}\nSubscription: ${subscriptionId}\nFiles: ${
        status.subscription?.uniqueFileCount || 0
      }\nWorkspaces: ${status.subscription?.workspaceCount || 0}`;
    }

    if (status.status === "NotFound") {
      return `🟠 Subscription not found in Microsoft Graph\nDrive: ${shortDriveId}\nSubscription: ${subscriptionId}\nStatus: Not Found`;
    }

    if (status.status === "ValidationError") {
      return `🔴 Subscription validation error\nDrive: ${shortDriveId}\nSubscription: ${subscriptionId}\nError: ${
        status.subscription?.lastFailureReason || "Unknown error"
      }`;
    }

    return `⚫ Inactive subscription\nDrive: ${shortDriveId}\nSubscription: ${subscriptionId}\nStatus: ${status.status}`;
  };

  const style = getIndicatorStyle();

  return (
    <Tooltip text={getTooltipText()} useMui>
      <Box
        sx={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          border: "1px solid",
          transition: "all 0.2s ease-in-out",
          cursor: "help",
          flexShrink: 0,
          ...style,
          "&:hover": {
            transform: "scale(1.2)",
            boxShadow: style.boxShadow.replace(
              /rgba\(([^)]+)\)/g,
              (match, rgba) => {
                const values = rgba.split(", ");
                if (values.length === 4) {
                  values[3] = (parseFloat(values[3]) * 1.3).toString();
                  return `rgba(${values.join(", ")})`;
                }
                return match;
              }
            ),
          },
        }}
      />
    </Tooltip>
  );
};

export default SubscriptionIndicator;
