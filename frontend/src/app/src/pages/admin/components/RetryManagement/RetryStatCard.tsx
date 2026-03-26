import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Skeleton,
  useTheme,
} from "@mui/material";
import { IconType } from "react-icons";

interface RetryStatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactElement<IconType>;
  color?: "primary" | "secondary" | "error" | "warning" | "info" | "success";
  subtitle?: string;
  loading?: boolean;
}

const getColorFromType = (colorType: string) => {
  const colorMap = {
    primary: { bg: "#204E5F", color: "#EDEDED" }, // DSB blue
    secondary: { bg: "#424242", color: "#EDEDED" }, // gray-400
    error: { bg: "#A6363D", color: "#EDEDED" }, // notification-error
    warning: { bg: "#977A24", color: "#EDEDED" }, // notification-warning
    info: { bg: "#424242", color: "#EDEDED" }, // notification-info
    success: { bg: "#16692D", color: "#EDEDED" }, // notification-success
  };
  return colorMap[colorType as keyof typeof colorMap] || colorMap.primary;
};

const RetryStatCard: React.FC<RetryStatCardProps> = ({
  title,
  value,
  icon,
  color = "primary",
  subtitle,
  loading = false,
}) => {
  const theme = useTheme();
  const colors = getColorFromType(color);

  if (loading) {
    return (
      <Card 
        className="!bg-transparent !border-2 !border-gray-500 !shadow-none"
        sx={{ 
          height: "100%",
          backgroundImage: "none"
        }}
      >
        <CardContent>
          <Box display="flex" alignItems="center" gap={2}>
            <Skeleton variant="circular" width={48} height={48} sx={{ bgcolor: "#2F2F2F" }} />
            <Box flex={1}>
              <Skeleton variant="text" width="60%" sx={{ bgcolor: "#2F2F2F" }} />
              <Skeleton variant="text" width="40%" sx={{ bgcolor: "#2F2F2F" }} />
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="!bg-transparent !border-2 !border-gray-500 !shadow-none hover:!bg-gray-650"
      sx={{
        height: "100%",
        backgroundImage: "none",
        transition: "transform 0.2s, background-color 0.2s",
        "&:hover": {
          transform: "translateY(-2px)",
        },
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar
            sx={{
              bgcolor: colors.bg,
              color: colors.color,
              width: 48,
              height: 48,
            }}
          >
            {icon}
          </Avatar>
          <Box flex={1}>
            <Typography
              variant="h4"
              component="div"
              className="!text-white-100 !font-headers"
              sx={{ fontWeight: "bold" }}
            >
              {value}
            </Typography>
            <Typography variant="body2" className="!text-white-100 !font-body">
              {title}
            </Typography>
            {subtitle && (
              <Typography
                variant="caption"
                className="!text-gray-300 !font-body"
                sx={{ mt: 0.5 }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default RetryStatCard;