import { useMsalApi } from "./auth";
import { DriveItem } from "../components/Workspaces/SharePoint/types";

export const useMsGraphApi = () => {
  const baseUrl = "https://graph.microsoft.com/v1.0";
  const graphScopes = [
    "User.Read",
    "Files.Read.All",
    "Sites.Read.All",
    "Group.Read.All",
    "Directory.Read.All",
  ];
  const { getTokentWithScopes } = useMsalApi();

  const getHeaders = async (): Promise<Headers> => {
    console.log("Requesting token with scopes:", graphScopes);
    const token = await getTokentWithScopes(graphScopes);

    // Log first and last few characters of token for debugging
    console.log("Token received:", {
      start: token.substring(0, 10),
      end: token.substring(token.length - 10),
      length: token.length,
    });

    const headers = new Headers({
      "Content-type": "application/json",
      Authorization: `Bearer ${token}`,
    });
    return headers;
  };

  const getUserPhoto = async (): Promise<string | undefined> => {
    const headers = await getHeaders();
    return fetch(`${baseUrl}/me/photo/$value`, { headers })
      .then((response) => {
        return response.status == 200 ? response.blob() : undefined;
      })
      .then((data) => {
        return data != null ? URL.createObjectURL(data) : undefined;
      });
  };

  const getUserInfo = async (): Promise<{ fullName: string }> => {
    const headers = await getHeaders();
    const response = await fetch(`${baseUrl}/me`, { headers });

    if (!response.ok) {
      throw new Error("Failed to fetch user information");
    }

    const userData = await response.json();
    const fullName = `${userData.givenName} ${userData.surname}`;
    return { fullName };
  };

  // Helper function to check if a file is an image
  const isImage = (file: any): boolean => {
    const imageExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".bmp",
      ".webp",
      ".svg",
      ".ico",
    ];
    const name = file.name.toLowerCase();
    return imageExtensions.some((ext) => name.endsWith(ext));
  };

  const getOneDriveFiles = async (
    path: string = "/me/drive/root/children"
  ): Promise<any[]> => {
    const headers = await getHeaders();
    const response = await fetch(`${baseUrl}${path}`, { headers });

    if (!response.ok) {
      throw new Error("Failed to fetch OneDrive files");
    }

    const data = await response.json();
    console.log(data);
    return data.value;
  };

  const getRecentFiles = async (): Promise<any[]> => {
    const headers = await getHeaders();
    const response = await fetch(`${baseUrl}/me/drive/recent`, {
      headers,
    });

    if (!response.ok) {
      throw new Error("Failed to fetch recent files");
    }

    const data = await response.json();
    return data.value;
  };

  const downloadOneDriveFile = async (downloadUrl: string): Promise<Blob> => {
    const headers = await getHeaders();
    const response = await fetch(downloadUrl, { headers });

    if (!response.ok) {
      throw new Error("Failed to download file");
    }

    return await response.blob();
  };

  const downloadDriveItemContent = async (
    driveId: string,
    itemId: string
  ): Promise<Blob> => {
    const headers = await getHeaders();
    const response = await fetch(
      `${baseUrl}/drives/${driveId}/items/${itemId}/content`,
      { headers }
    );

    if (!response.ok) {
      throw new Error("Failed to download file from drive");
    }

    return await response.blob();
  };

  interface SearchResponse {
    hits: DriveItem[];
    nextPage?: string;
    totalResults: number;
  }

  const fileTypeToKQL = {
    word: "(fileextension=docx OR fileextension=doc)",
    spreadsheet:
      "(fileextension=xlsx OR fileextension=xls OR fileextension=csv)",
    pdf: "fileextension=pdf",
    all: "", // No filter for "all"
  };

  const searchFiles = async (
    query: string,
    skipCount?: string,
    pageSize: number = 25,
    sortField: string = "name",
    sortDirection: "asc" | "desc" = "asc",
    fileTypeFilter: string = "all"
  ): Promise<SearchResponse> => {
    if (query.length < 3) return { hits: [], totalResults: 0 };

    const headers = await getHeaders();
    const skip = skipCount ? parseInt(skipCount, 10) : 0;

    // Map our sort fields to Microsoft Graph fields
    const sortFieldMap: Record<string, string> = {
      name: "name",
      size: "size",
      lastModified: "lastModifiedDateTime",
    };

    const graphSortField = sortFieldMap[sortField] || "name";

    // Build the KQL query with proper AND operators
    const baseQuery = `${query} AND isDocument=true AND NOT folder:true`;
    const typeFilter =
      fileTypeFilter in fileTypeToKQL
        ? fileTypeToKQL[fileTypeFilter as keyof typeof fileTypeToKQL]
        : "";
    const finalQuery = typeFilter
      ? `${baseQuery} AND ${typeFilter}`
      : baseQuery;

    console.log("File type filter:", fileTypeFilter); // Add debug log
    console.log("Type filter value:", typeFilter); // Add debug log
    console.log("Final KQL query:", finalQuery); // Log the query for debugging

    const body: any = {
      requests: [
        {
          entityTypes: ["driveItem"],
          query: {
            queryString: finalQuery,
          },
          from: skip,
          size: pageSize,
          fields: [
            "name",
            "id",
            "webUrl",
            "parentReference",
            "size",
            "lastModifiedDateTime",
            "folder",
          ],
          sortProperties: [
            {
              name: graphSortField,
              isDescending: sortDirection === "desc",
            },
          ],
        },
      ],
    };

    const response = await fetch(`${baseUrl}/search/query`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error("Failed to search files");
    }

    const data = await response.json();
    const searchHits = data.value[0]?.hitsContainers[0]?.hits || [];
    const totalResults = data.value[0]?.hitsContainers[0]?.total || 0;
    const hasMoreResults = skip + searchHits.length < totalResults;
    const nextPage = hasMoreResults
      ? (skip + searchHits.length).toString()
      : undefined;

    console.log("Search hits:", searchHits); // Let's log the results to verify
    console.log("Next page token:", nextPage); // Log the next page token
    console.log("Total results:", totalResults); // Log total results
    console.log("Current skip:", skip); // Log current skip value

    return {
      hits: searchHits.map((hit: any) => ({
        id: hit.resource.id,
        name: hit.resource.name,
        parentReference: hit.resource.parentReference,
        size: hit.resource.size || 0,
        lastModifiedDateTime:
          hit.resource.lastModifiedDateTime || new Date().toISOString(),
        folder: hit.resource.folder || null,
      })),
      nextPage,
      totalResults,
    };
  };

  const getJoinedTeams = async () => {
    try {
      const headers = await getHeaders();
      console.log("Fetching teams with headers:", headers);

      const response = await fetch(`${baseUrl}/me/joinedTeams`, { headers });
      console.log("Teams response status:", response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Teams response error:", {
          status: response.status,
          statusText: response.statusText,
          errorData,
        });
        throw new Error(
          `Failed to fetch joined teams: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("Teams data:", data);
      return data.value;
    } catch (error) {
      console.error("Error in getJoinedTeams:", error);
      throw error;
    }
  };

  const getTeamDrive = async (teamId: string) => {
    const headers = await getHeaders();
    const response = await fetch(`${baseUrl}/groups/${teamId}/drive`, {
      headers,
    });

    if (!response.ok) {
      throw new Error("Failed to fetch team drive");
    }

    const data = await response.json();
    return data;
  };

  const getTeamDriveContents = async (driveId: string) => {
    const headers = await getHeaders();
    const response = await fetch(`${baseUrl}/drives/${driveId}/root/children`, {
      headers,
    });

    if (!response.ok) {
      throw new Error("Failed to fetch team drive contents");
    }

    const data = await response.json();
    return data.value;
  };

  const getTeamPhoto = async (teamId: string): Promise<string | undefined> => {
    try {
      const headers = await getHeaders();
      const response = await fetch(`${baseUrl}/teams/${teamId}/photo/$value`, {
        headers,
      });

      if (response.status === 200) {
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      }
      return undefined;
    } catch (error) {
      console.error(`Error fetching team photo for ${teamId}:`, error);
      return undefined;
    }
  };

  const getTeamChannels = async (teamId: string) => {
    try {
      const headers = await getHeaders();
      const response = await fetch(`${baseUrl}/teams/${teamId}/channels`, {
        headers,
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Team channels response error:", {
          status: response.status,
          statusText: response.statusText,
          errorData,
        });
        throw new Error(
          `Failed to fetch team channels: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return data.value;
    } catch (error) {
      console.error(`Error fetching channels for team ${teamId}:`, error);
      throw error;
    }
  };

  const getChannelFiles = async (teamId: string, channelId: string) => {
    try {
      const headers = await getHeaders();
      const response = await fetch(
        `${baseUrl}/teams/${teamId}/channels/${channelId}/filesFolder`,
        { headers }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Channel files response error:", {
          status: response.status,
          statusText: response.statusText,
          errorData,
        });
        throw new Error(
          `Failed to fetch channel files: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(
        `Error fetching files for channel ${channelId} in team ${teamId}:`,
        error
      );
      throw error;
    }
  };

  return {
    getUserPhoto,
    getUserInfo,
    getOneDriveFiles,
    getRecentFiles,
    downloadOneDriveFile,
    downloadDriveItemContent,
    baseUrl,
    getHeaders,
    searchFiles,
    getJoinedTeams,
    getTeamDrive,
    getTeamDriveContents,
    getTeamPhoto,
    getTeamChannels,
    getChannelFiles,
  };
};
