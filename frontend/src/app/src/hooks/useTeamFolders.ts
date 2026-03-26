import { useQuery } from "@tanstack/react-query";
import { DriveItem } from "../components/Workspaces/SharePoint/types";
import { useMsGraphApi } from "../services/graph";

interface Channel {
  id: string;
  displayName: string;
}

const createBasicFolderItem = (
  channel: Channel,
  teamId: string
): DriveItem => ({
  id: channel.id,
  name: channel.displayName,
  folder: true,
  channelId: channel.id,
  isChannel: true,
  size: 0,
  parentReference: {
    driveId: "",
  },
});

export const useChannelFolders = (
  teamId: string | null,
  channels: Channel[]
) => {
  const { baseUrl, getHeaders } = useMsGraphApi();

  // Create a stable key from the channel IDs (sorted and joined)
  const channelIdsKey = channels
    .map((c) => c.id)
    .sort()
    .join(",");

  return useQuery({
    queryKey: ["channelFolders", teamId, channelIdsKey],
    queryFn: async () => {
      if (!teamId || !channels.length) return {};

      const headers = await getHeaders();
      const results: Record<string, DriveItem> = {};

      // Process in batches of 5
      for (let i = 0; i < channels.length; i += 5) {
        const batch = channels.slice(i, i + 5);
        const batchPromises = batch.map(async (channel) => {
          try {
            const response = await fetch(
              `${baseUrl}/teams/${teamId}/channels/${channel.id}/filesFolder`,
              { headers }
            );

            if (!response.ok) {
              return [channel.id, createBasicFolderItem(channel, teamId)];
            }

            const filesFolder = await response.json();
            return [
              channel.id,
              {
                ...filesFolder,
                name: channel.displayName,
                folder: true,
                channelId: channel.id,
                isChannel: true,
                parentReference: {
                  ...filesFolder.parentReference,
                  driveId: filesFolder.parentReference?.driveId || "",
                },
              } as DriveItem,
            ];
          } catch (error) {
            console.error(`Error fetching channel ${channel.id}:`, error);
            return [channel.id, createBasicFolderItem(channel, teamId)];
          }
        });

        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach(([channelId, data]) => {
          results[channelId as string] = data as DriveItem;
        });

        // Add a small delay between batches
        if (i + 5 < channels.length) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      return results;
    },
    enabled: Boolean(teamId) && channels.length > 0,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep unused data in cache for 30 minutes
    refetchOnWindowFocus: false, // Prevent refetching when window regains focus
    refetchOnMount: false, // Prevent refetching when component remounts
    refetchOnReconnect: false, // Prevent refetching when network reconnects
  });
};

export const useSiteLibraryFolders = (
  teamId: string | null,
  driveId: string | null
) => {
  const { baseUrl, getHeaders } = useMsGraphApi();

  return useQuery({
    queryKey: ["siteLibraryFolders", teamId, driveId],
    queryFn: async () => {
      if (!teamId || !driveId) return [];

      const headers = await getHeaders();
      const response = await fetch(
        `${baseUrl}/drives/${driveId}/root/children`,
        { headers }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch site library folders");
      }

      const data = await response.json();
      return data.value.map((item: DriveItem) => ({
        ...item,
        isAllowed: item.folder || true, // Folders are always allowed
      }));
    },
    enabled: Boolean(teamId) && Boolean(driveId),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep unused data in cache for 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};
