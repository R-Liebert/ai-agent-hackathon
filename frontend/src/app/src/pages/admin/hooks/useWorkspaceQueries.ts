import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { adminWorkspaceService, adminWorkspaceDiagnostics } from "../../../services/admin";
import {
  WorkspaceDetailsDto,
  WorkspaceListResponse,
  WorkspaceQueryParams,
  WorkspaceDetailsQueryParams,
} from "../../../services/admin/types/adminWorkspace.types";

export const workspaceKeys = {
  all: ["admin", "workspaces"] as const,
  lists: () => [...workspaceKeys.all, "list"] as const,
  list: (filters: Partial<WorkspaceQueryParams>) =>
    [...workspaceKeys.lists(), filters] as const,
  details: () => [...workspaceKeys.all, "details"] as const,
  detail: (id: string) => [...workspaceKeys.details(), id] as const,
  diagnostics: (id: string) => [...workspaceKeys.all, "diagnostics", id] as const,
} as const;

export const useWorkspaceList = (params: WorkspaceQueryParams) => {
  return useQuery<WorkspaceListResponse, Error>({
    queryKey: workspaceKeys.list(params),
    queryFn: () => adminWorkspaceService.getWorkspaces(params),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });
};

// Stats endpoints removed; counts are now part of summary DTOs

export const useWorkspaceDetails = (id: string | undefined, params?: WorkspaceDetailsQueryParams) => {
  const key = id ? workspaceKeys.detail(id) : workspaceKeys.details();
  return useQuery<WorkspaceDetailsDto, Error>({
    queryKey: id ? [...key, params] : key,
    queryFn: () => adminWorkspaceService.getWorkspaceDetails(id as string, params),
    enabled: Boolean(id),
    refetchOnWindowFocus: false,
  });
};

export const useWorkspaceDiagnostics = (workspaceId: string | undefined) => {
  const baseKey = workspaceId ? workspaceKeys.diagnostics(workspaceId) : workspaceKeys.diagnostics("unknown");
  const blobs = useQuery<any, Error>({
    queryKey: [...baseKey, "blobs"],
    queryFn: () => adminWorkspaceDiagnostics.getBlobFiles(workspaceId as string),
    enabled: Boolean(workspaceId),
    refetchOnWindowFocus: false,
  });

  const indexFiles = useQuery<any, Error>({
    queryKey: [...baseKey, "index"],
    queryFn: () => adminWorkspaceDiagnostics.getIndexFiles(workspaceId as string),
    enabled: Boolean(workspaceId),
    refetchOnWindowFocus: false,
  });

  return { blobs, indexFiles };
};

export const useOpenAIFilesCheck = (workspaceId: string | undefined) => {
  const mutation = useMutation({
    mutationFn: (files: Array<{ fileName: string; blobName?: string | null; externalId?: string | null }>) =>
      adminWorkspaceDiagnostics.checkOpenAiFiles(workspaceId as string, { files }),
  });

  return mutation;
};


