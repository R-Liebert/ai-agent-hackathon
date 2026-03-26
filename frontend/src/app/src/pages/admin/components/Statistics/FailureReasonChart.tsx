import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Skeleton,
} from "@mui/material";
import { TbAlertCircle } from "react-icons/tb";

interface FailureReasonChartProps {
  failureReasons: Record<string, number> | undefined;
  loading?: boolean;
}

const FailureReasonChart: React.FC<FailureReasonChartProps> = ({
  failureReasons,
  loading,
}) => {
  const sortedReasons = React.useMemo(() => {
    if (!failureReasons) return [];
    return Object.entries(failureReasons)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [failureReasons]);

  const maxCount = sortedReasons[0]?.[1] || 1;

  if (loading) {
    return (
      <Card 
        className="!bg-transparent !border-2 !border-gray-500 !shadow-none"
        sx={{ 
          height: "100%",
          backgroundImage: "none"
        }}
      >
        <CardHeader
          title={
            <Box display="flex" alignItems="center" gap={1}>
              <TbAlertCircle className="text-white-100" />
              <Typography variant="h6" className="!text-white-100 !font-headers">Top Failure Reasons</Typography>
            </Box>
          }
        />
        <CardContent>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={40} sx={{ mb: 2, bgcolor: "#2F2F2F" }} />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (sortedReasons.length === 0) {
    return (
      <Card 
        className="!bg-transparent !border-2 !border-gray-500 !shadow-none"
        sx={{ 
          height: "100%",
          backgroundImage: "none"
        }}
      >
        <CardHeader
          title={
            <Box display="flex" alignItems="center" gap={1}>
              <TbAlertCircle className="text-white-100" />
              <Typography variant="h6" className="!text-white-100 !font-headers">Top Failure Reasons</Typography>
            </Box>
          }
        />
        <CardContent>
          <Typography variant="body2" className="!text-gray-300 !font-body" textAlign="center">
            No failure data available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="!bg-transparent !border-2 !border-gray-500 !shadow-none"
      sx={{ 
        height: "100%",
        backgroundImage: "none"
      }}
    >
      <CardHeader
        title={
          <Box display="flex" alignItems="center" gap={1}>
            <TbAlertCircle className="text-white-100" />
            <Typography variant="h6" className="!text-white-100 !font-headers">Top Failure Reasons</Typography>
          </Box>
        }
      />
      <CardContent>
        <List disablePadding>
          {sortedReasons.map(([reason, count], index) => {
            const percentage = (count / maxCount) * 100;
            const truncatedReason =
              reason.length > 50 ? `${reason.substring(0, 50)}...` : reason;

            return (
              <ListItem key={index} sx={{ px: 0, py: 1 }}>
                <ListItemText
                  primary={
                    <Box>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        mb={1}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "70%",
                          }}
                          title={reason}
                        >
                          {truncatedReason}
                        </Typography>
                        <Chip
                          label={count}
                          size="small"
                          sx={{
                            backgroundColor: index === 0 ? "#A6363D" : "#424242",
                            color: "#EDEDED",
                            fontWeight: 600
                          }}
                        />
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={percentage}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: "#424242",
                          "& .MuiLinearProgress-bar": {
                            borderRadius: 3,
                            backgroundColor:
                              index === 0
                                ? "#A6363D"
                                : index === 1
                                ? "#977A24"
                                : "#204E5F",
                          },
                        }}
                      />
                    </Box>
                  }
                />
              </ListItem>
            );
          })}
        </List>
      </CardContent>
    </Card>
  );
};

export default FailureReasonChart;