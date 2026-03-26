import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { workspacesService } from "../services/workspacesService";
import { WorkspaceDto } from "../models/workspace-model";
import { useMsal } from "@azure/msal-react";
import { useCallback, useMemo } from "react";

interface UpdateWorkspaceInteractionParams {
  workspaceId: string;
  lastInteraction?: Date;
}

export const useWorkspaces = () => {
  const queryClient = useQueryClient();
  const { accounts } = useMsal();
  const userId = accounts[0]?.localAccountId;

  const {
    data: workspaces,
    isLoading,
    error,
  } = useQuery<WorkspaceDto[], Error>({
    queryKey: ["workspaces", userId],
    queryFn: workspacesService.getWorkspaces,
    staleTime: 8 * 60 * 60 * 1000, // 8 hours
    enabled: !!userId, // Only run the query if we have a userId
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: true,
  });

  const updateWorkspaceMutation = useMutation({
    mutationFn: ({
      workspaceId,
      isHidden,
    }: {
      workspaceId: string;
      isHidden: boolean;
    }) =>
      workspacesService.updateWorkspaceSidebarVisibility(workspaceId, isHidden),
    onSuccess: (_, variables) => {
      queryClient.setQueryData<WorkspaceDto[]>(
        ["workspaces", userId],
        (oldData) => {
          if (!oldData) return [];
          return oldData.map((workspace) =>
            workspace.id === variables.workspaceId
              ? { ...workspace, isHidden: variables.isHidden }
              : workspace
          );
        }
      );
    },
  });

  const updateWorkspaceInteractionMutation = useMutation({
    mutationFn: async ({
      workspaceId,
      lastInteraction,
    }: UpdateWorkspaceInteractionParams): Promise<void> => {
      if (lastInteraction) {
        await workspacesService.updateWorkspaceLastInteraction(workspaceId);
      }
      // Ensure the function always resolves to void
      return;
    },
    onMutate: async ({ workspaceId, lastInteraction }) => {
      await queryClient.cancelQueries({ queryKey: ["workspaces", userId] });

      const previousWorkspaces = queryClient.getQueryData<WorkspaceDto[]>([
        "workspaces",
        userId,
      ]);

      queryClient.setQueryData<WorkspaceDto[]>(
        ["workspaces", userId],
        (old) => {
          if (!old) return [];

          const interactionDate = lastInteraction || new Date();
          return old.map((workspace) =>
            workspace.id === workspaceId
              ? { ...workspace, lastInteraction: interactionDate }
              : workspace
          );
        }
      );

      return { previousWorkspaces };
    },
    onError: (err, newTodo, context) => {
      if (context?.previousWorkspaces) {
        queryClient.setQueryData(
          ["workspaces", userId],
          context.previousWorkspaces
        );
      }
    },
  });

  const leaveWorkspaceMutation = useMutation({
    mutationFn: ({ workspaceId }: { workspaceId: string }) =>
      workspacesService.leaveWorkspace(workspaceId),
    onSuccess: async (_, { workspaceId }) => {
      // Invalidate both cache entries in parallel and await them
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["workspaces", userId] }),
        queryClient.invalidateQueries({
          queryKey: ["workspace-details", workspaceId],
        }),
      ]);
    },
  });

  const getRecentWorkspaces = useCallback(
    (limit: number = 3): WorkspaceDto[] => {
      if (!workspaces) return [];
      return workspaces
        .filter(
          (workspace) =>
            !workspace.isHidden && workspace.lastInteraction !== null
        )
        .sort((a, b) => {
          const dateA = a.lastInteraction
            ? new Date(a.lastInteraction).getTime()
            : 0;
          const dateB = b.lastInteraction
            ? new Date(b.lastInteraction).getTime()
            : 0;
          return dateB - dateA;
        })
        .slice(0, limit);
    },
    [workspaces]
  );

  return useMemo(
    () => ({
      workspaces,
      isLoading,
      error,
      updateWorkspaceMutation,
      updateWorkspaceInteractionMutation,
      leaveWorkspaceMutation,
      getRecentWorkspaces,
    }),
    [
      workspaces,
      isLoading,
      error,
      updateWorkspaceMutation,
      updateWorkspaceInteractionMutation,
      getRecentWorkspaces,
    ]
  );
};
