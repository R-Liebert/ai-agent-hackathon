import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Chip,
  Stack,
  Skeleton,
} from "@mui/material";
import { TbChartBar } from "react-icons/tb";

interface RetryDistributionProps {
  distribution: Record<string, number> | undefined;
  loading?: boolean;
}

const RetryDistribution: React.FC<RetryDistributionProps> = ({
  distribution,
  loading,
}) => {
  const sortedDistribution = React.useMemo(() => {
    if (!distribution) return [];
    return Object.entries(distribution).sort(
      ([a], [b]) => parseInt(a) - parseInt(b)
    );
  }, [distribution]);

  const getChipColor = (retryCount: string) => {
    const count = parseInt(retryCount);
    if (count <= 1) return { bg: "#16692D", color: "#EDEDED" }; // success
    if (count <= 3) return { bg: "#977A24", color: "#EDEDED" }; // warning
    if (count <= 5) return { bg: "#A6363D", color: "#EDEDED" }; // error
    return { bg: "#424242", color: "#EDEDED" }; // default
  };

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
              <TbChartBar className="text-white-100" />
              <Typography variant="h6" className="!text-white-100 !font-headers">Retry Count Distribution</Typography>
            </Box>
          }
        />
        <CardContent>
          <Skeleton variant="rectangular" height={100} sx={{ bgcolor: "#2F2F2F" }} />
        </CardContent>
      </Card>
    );
  }

  if (sortedDistribution.length === 0) {
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
              <TbChartBar className="text-white-100" />
              <Typography variant="h6" className="!text-white-100 !font-headers">Retry Count Distribution</Typography>
            </Box>
          }
        />
        <CardContent>
          <Typography variant="body2" className="!text-gray-300 !font-body" textAlign="center">
            No retry distribution data available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(...sortedDistribution.map(([, count]) => count));

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
            <TbChartBar className="text-white-100" />
            <Typography variant="h6" className="!text-white-100 !font-headers">Retry Count Distribution</Typography>
          </Box>
        }
      />
      <CardContent>
        <Stack spacing={1}>
          {sortedDistribution.map(([retryCount, count]) => {
            const percentage = (count / maxValue) * 100;
            const label = `${retryCount} ${
              retryCount === "1" ? "retry" : "retries"
            }`;

            return (
              <Box key={retryCount}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={0.5}
                >
                  <Typography variant="body2" className="!text-white-100 !font-body" fontWeight={500}>
                    {label}
                  </Typography>
                  <Chip
                    label={`${count} subscription${count !== 1 ? "s" : ""}`}
                    size="small"
                    sx={{
                      backgroundColor: getChipColor(retryCount).bg,
                      color: getChipColor(retryCount).color,
                      fontWeight: 600
                    }}
                  />
                </Box>
                <Box
                  sx={{
                    height: 20,
                    backgroundColor: "#424242",
                    borderRadius: 1,
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${percentage}%`,
                      backgroundColor: getChipColor(retryCount).bg,
                      transition: "width 0.3s ease",
                    }}
                  />
                </Box>
              </Box>
            );
          })}
        </Stack>
        <Box mt={2}>
          <Typography variant="caption" className="!text-gray-300 !font-body">
            Total subscriptions with retry state:{" "}
            {sortedDistribution.reduce((sum, [, count]) => sum + count, 0)}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default RetryDistribution;