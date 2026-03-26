import React from "react";
import { Box, Paper, Skeleton } from "@mui/material";

interface JobsLoadingSkeletonProps {
  rows?: number;
  variant?: "table" | "cards" | "dashboard";
}

const JobsLoadingSkeleton: React.FC<JobsLoadingSkeletonProps> = ({
  rows = 5,
  variant = "table",
}) => {
  if (variant === "dashboard") {
    return (
      <Box role="status" aria-live="polite" aria-label="Loading dashboard data">
        <span className="sr-only">Loading dashboard data, please wait...</span>

        {/* Statistics Cards Skeleton */}
        <Box sx={{ mb: 3 }}>
          <Skeleton
            variant="rectangular"
            width={120}
            height={24}
            sx={{ backgroundColor: "#3A3A3D", borderRadius: 1, mb: 2 }}
          />
          <Box
            display="grid"
            gridTemplateColumns={{
              xs: "1fr",
              sm: "1fr 1fr",
              md: "repeat(4, 1fr)",
            }}
            gap={2}
          >
            {Array.from({ length: 8 }).map((_, index) => (
              <Paper
                key={index}
                sx={{
                  p: 3,
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #313131",
                  borderRadius: 2,
                }}
              >
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box flex={1}>
                    <Skeleton
                      variant="text"
                      width="60%"
                      height={16}
                      sx={{ backgroundColor: "#3A3A3D", mb: 1 }}
                    />
                    <Skeleton
                      variant="text"
                      width="40%"
                      height={32}
                      sx={{ backgroundColor: "#3A3A3D" }}
                    />
                  </Box>
                  <Skeleton
                    variant="rectangular"
                    width={48}
                    height={48}
                    sx={{ backgroundColor: "#3A3A3D", borderRadius: 2 }}
                  />
                </Box>
              </Paper>
            ))}
          </Box>
        </Box>

        {/* Server Health Skeleton */}
        <Box sx={{ mb: 3 }}>
          <Skeleton
            variant="rectangular"
            width={140}
            height={24}
            sx={{ backgroundColor: "#3A3A3D", borderRadius: 1, mb: 2 }}
          />
          <Box display="flex" gap={2} flexWrap="wrap">
            {Array.from({ length: 3 }).map((_, index) => (
              <Paper
                key={index}
                sx={{
                  p: 2,
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #313131",
                  borderRadius: 2,
                  width: { xs: "100%", sm: "calc(50% - 8px)", md: "calc(33.33% - 11px)" },
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Skeleton
                    variant="text"
                    width="60%"
                    height={20}
                    sx={{ backgroundColor: "#3A3A3D" }}
                  />
                  <Skeleton
                    variant="rectangular"
                    width={60}
                    height={24}
                    sx={{ backgroundColor: "#3A3A3D", borderRadius: "9999px" }}
                  />
                </Box>
                <Box display="flex" gap={2}>
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <Box key={idx}>
                      <Skeleton
                        variant="text"
                        width={50}
                        height={12}
                        sx={{ backgroundColor: "#3A3A3D" }}
                      />
                      <Skeleton
                        variant="text"
                        width={30}
                        height={16}
                        sx={{ backgroundColor: "#3A3A3D" }}
                      />
                    </Box>
                  ))}
                </Box>
              </Paper>
            ))}
          </Box>
        </Box>
      </Box>
    );
  }

  if (variant === "cards") {
    return (
      <Box role="status" aria-live="polite" aria-label="Loading data">
        <span className="sr-only">Loading data, please wait...</span>
        <Box
          display="grid"
          gridTemplateColumns={{
            xs: "1fr",
            sm: "1fr 1fr",
            md: "repeat(4, 1fr)",
          }}
          gap={2}
        >
          {Array.from({ length: rows }).map((_, index) => (
            <Paper
              key={index}
              sx={{
                p: 3,
                backgroundColor: "#1a1a1a",
                border: "1px solid #313131",
                borderRadius: 2,
              }}
            >
              <Box display="flex" alignItems="center" gap={2}>
                <Skeleton
                  variant="rectangular"
                  width={48}
                  height={48}
                  sx={{ backgroundColor: "#3A3A3D", borderRadius: 2 }}
                />
                <Box flex={1}>
                  <Skeleton
                    variant="text"
                    width="80%"
                    height={14}
                    sx={{ backgroundColor: "#3A3A3D", mb: 0.5 }}
                  />
                  <Skeleton
                    variant="text"
                    width="50%"
                    height={24}
                    sx={{ backgroundColor: "#3A3A3D" }}
                  />
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      </Box>
    );
  }

  // Table variant (default)
  return (
    <Box role="status" aria-live="polite" aria-label="Loading jobs data">
      <span className="sr-only">Loading jobs data, please wait...</span>
      <Paper
        sx={{
          backgroundColor: "#1a1a1a",
          border: "1px solid #313131",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        {/* Table Header Skeleton */}
        <Box
          sx={{
            display: "flex",
            gap: 2,
            p: 2,
            backgroundColor: "#262626",
            borderBottom: "1px solid #313131",
          }}
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton
              key={index}
              variant="text"
              width={index === 0 ? 80 : index === 1 ? 150 : 100}
              height={16}
              sx={{ backgroundColor: "#3A3A3D" }}
            />
          ))}
        </Box>

        {/* Table Rows Skeleton */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <Box
            key={rowIndex}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              p: 2,
              backgroundColor: "#262626",
              borderBottom: rowIndex < rows - 1 ? "1px solid #313131" : "none",
            }}
          >
            {/* Job ID */}
            <Skeleton
              variant="text"
              width={80}
              height={20}
              sx={{ backgroundColor: "#3A3A3D" }}
            />
            {/* Job Name */}
            <Box flex={1}>
              <Skeleton
                variant="text"
                width="70%"
                height={18}
                sx={{ backgroundColor: "#3A3A3D", mb: 0.5 }}
              />
              <Skeleton
                variant="text"
                width="40%"
                height={14}
                sx={{ backgroundColor: "#3A3A3D" }}
              />
            </Box>
            {/* Queue */}
            <Skeleton
              variant="rectangular"
              width={60}
              height={24}
              sx={{ backgroundColor: "#3A3A3D", borderRadius: "9999px" }}
            />
            {/* Created */}
            <Skeleton
              variant="text"
              width={100}
              height={16}
              sx={{ backgroundColor: "#3A3A3D" }}
            />
            {/* State At */}
            <Skeleton
              variant="text"
              width={100}
              height={16}
              sx={{ backgroundColor: "#3A3A3D" }}
            />
            {/* Actions */}
            <Box display="flex" gap={0.5}>
              <Skeleton
                variant="circular"
                width={28}
                height={28}
                sx={{ backgroundColor: "#3A3A3D" }}
              />
              <Skeleton
                variant="circular"
                width={28}
                height={28}
                sx={{ backgroundColor: "#3A3A3D" }}
              />
            </Box>
          </Box>
        ))}
      </Paper>
    </Box>
  );
};

export default JobsLoadingSkeleton;
