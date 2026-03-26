import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import jobPostService from "../services/jobPostService";
import { JobPostResponseDto } from "src/pages/feature-job-post-creator/types";

export const useJobPostDetails = (jobPostId?: string) => {
  const {
    data: jobPostDetails,
    isLoading,
    error,
    isError,
  } = useQuery<JobPostResponseDto, AxiosError>({
    queryKey: ["job-post-details", jobPostId],
    queryFn: () => jobPostService.get(jobPostId!),
    enabled: !!jobPostId,
    retry: (_, error) => {
      return error?.response?.status !== 403;
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: true,
  });

  return {
    jobPostDetails,
    isLoading,
    error,
    isError
  };
};
