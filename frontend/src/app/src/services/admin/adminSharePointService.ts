import { useMsalApi } from "../auth";

export interface AdminGraphUserBasic {
  id: string;
  displayName?: string;
  mail?: string;
  userPrincipalName?: string;
  jobTitle?: string;
  department?: string;
}

export interface AdminDriveInfo {
  id: string;
  name: string;
  driveType: 'personal' | 'business' | 'documentLibrary';
  owner?: {
    user?: { 
      displayName: string; 
      email: string; 
    };
    group?: { 
      displayName: string; 
    };
  };
  webUrl?: string;
  siteName?: string; // SharePoint site name extracted from webUrl
}

export interface AdminFileItemDetails {
  id: string;
  name: string;
  size: number;
  lastModifiedDateTime: string;
  createdDateTime: string;
  createdBy?: {
    user?: {
      displayName: string;
      email: string;
    };
  };
  lastModifiedBy?: {
    user?: {
      displayName: string;
      email: string;
    };
  };
  webUrl?: string;
  isMissing?: boolean; // Flag to indicate file is missing from SharePoint
}

export interface AdminBatchRequest {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
}

export interface AdminBatchResponse {
  id: string;
  status: number;
  body: any;
}

export const useAdminSharePointApi = () => {
  const baseUrl = "https://graph.microsoft.com/v1.0";
  const graphScopes = [
    "User.Read",
    "Files.Read.All",
    "Sites.Read.All",
    "Group.Read.All",
    "Directory.Read.All",
  ];
  const { getTokentWithScopes } = useMsalApi();

  const getAdminHeaders = async (): Promise<Headers> => {
    console.log("Admin SharePoint: Requesting token with scopes:", graphScopes);
    const token = await getTokentWithScopes(graphScopes);

    const headers = new Headers({
      "Content-type": "application/json",
      Authorization: `Bearer ${token}`,
    });
    return headers;
  };

  const getAdminDriveInfo = async (driveId: string): Promise<AdminDriveInfo> => {
    try {
      const headers = await getAdminHeaders();
      const response = await fetch(`${baseUrl}/drives/${driveId}`, { headers });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Drive not found: ${driveId}`);
        }
        throw new Error(`Failed to fetch drive info: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log(`Admin SharePoint: Drive data for ${driveId}:`, {
        id: data.id,
        name: data.name,
        displayName: data.displayName,
        driveType: data.driveType,
        owner: data.owner,
        webUrl: data.webUrl,
        rawData: data
      });
      
      // Extract site name from webUrl if available
      const extractSiteName = (webUrl?: string): string => {
        if (!webUrl) return '';
        try {
          // Case 1: SharePoint site - https://dsbintranet.sharepoint.com/sites/trAIn/...
          const siteMatch = webUrl.match(/\/sites\/([^\/]+)/);
          if (siteMatch) {
            return siteMatch[1];
          }

          // Case 2: Personal OneDrive - https://dsbintranet-my.sharepoint.com/personal/xkapoj3107_dsb_dk/Documents
          const oneDriveMatch = webUrl.match(/\/personal\/([^\/]+)/);
          if (oneDriveMatch) {
            const fullUsername = oneDriveMatch[1];
            // Extract username part before _dsb_dk (or any domain suffix)
            const username = fullUsername.split('_')[0];
            return `OneDrive - ${username}`;
          }

          return '';
        } catch {
          return '';
        }
      };

      const siteName = extractSiteName(data.webUrl);
      const displayName = siteName || data.name || data.displayName || `Drive ${driveId}`;

      console.log(`Admin SharePoint: Extracted site name "${siteName}" from webUrl: ${data.webUrl}`);

      return {
        id: data.id,
        name: displayName,
        driveType: data.driveType || 'business',
        owner: data.owner,
        webUrl: data.webUrl,
        siteName, // Add the extracted site name as a separate field
      };
    } catch (error) {
      console.error(`Admin SharePoint: Error fetching drive ${driveId}:`, error);
      throw error;
    }
  };

  const getAdminFileDetails = async (driveId: string, itemId: string): Promise<AdminFileItemDetails> => {
    try {
      const headers = await getAdminHeaders();
      const response = await fetch(`${baseUrl}/drives/${driveId}/items/${itemId}`, { headers });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`Admin SharePoint: File not found - ${itemId} in drive ${driveId} (deleted or moved)`);
          // Return a special object indicating the file is missing
          return {
            id: itemId,
            name: 'File not found',
            size: 0,
            lastModifiedDateTime: '',
            createdDateTime: '',
            webUrl: '',
            isMissing: true, // Flag to indicate file is missing from SharePoint
          };
        }
        if (response.status === 403) {
          console.warn(`Admin SharePoint: Access denied to file ${itemId} in drive ${driveId}`);
          return {
            id: itemId,
            name: 'Access denied',
            size: 0,
            lastModifiedDateTime: '',
            createdDateTime: '',
            webUrl: '',
            isMissing: true,
          };
        }
        if (response.status === 410) {
          console.warn(`Admin SharePoint: File permanently deleted - ${itemId} in drive ${driveId}`);
          return {
            id: itemId,
            name: 'Permanently deleted',
            size: 0,
            lastModifiedDateTime: '',
            createdDateTime: '',
            webUrl: '',
            isMissing: true,
          };
        }
        throw new Error(`Failed to fetch file details: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        id: data.id,
        name: data.name,
        size: data.size || 0,
        lastModifiedDateTime: data.lastModifiedDateTime,
        createdDateTime: data.createdDateTime,
        createdBy: data.createdBy,
        lastModifiedBy: data.lastModifiedBy,
        webUrl: data.webUrl,
        isMissing: false, // File found successfully
      };
    } catch (error) {
      console.error(`Admin SharePoint: Error fetching file ${itemId} from drive ${driveId}:`, error);
      throw error;
    }
  };

  const batchAdminRequests = async (requests: AdminBatchRequest[]): Promise<AdminBatchResponse[]> => {
    try {
      const headers = await getAdminHeaders();
      
      const batchPayload = {
        requests: requests.map(req => ({
          id: req.id,
          method: req.method,
          url: req.url.startsWith('/') ? req.url : `/${req.url}`,
        }))
      };

      const response = await fetch(`${baseUrl}/$batch`, {
        method: 'POST',
        headers,
        body: JSON.stringify(batchPayload),
      });

      if (!response.ok) {
        throw new Error(`Batch request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.responses || [];
    } catch (error) {
      console.error('Admin SharePoint: Error in batch request:', error);
      throw error;
    }
  };

  const getMultipleAdminDriveInfos = async (driveIds: string[]): Promise<Map<string, AdminDriveInfo | Error>> => {
    if (driveIds.length === 0) return new Map();

    const uniqueDriveIds = [...new Set(driveIds)];
    const driveInfoMap = new Map<string, AdminDriveInfo | Error>();

    // Try batch request first, but with smaller batches
    const maxBatchSize = 10; // Reduce batch size
    const batches = [];
    
    for (let i = 0; i < uniqueDriveIds.length; i += maxBatchSize) {
      batches.push(uniqueDriveIds.slice(i, i + maxBatchSize));
    }

    for (const batch of batches) {
      try {
        const requests: AdminBatchRequest[] = batch.map(driveId => ({
          id: driveId,
          method: 'GET',
          url: `drives/${driveId}`,
        }));

        console.log(`Admin SharePoint: Attempting batch request for ${batch.length} drives`);
        const responses = await batchAdminRequests(requests);

        responses.forEach(response => {
          if (response.status === 200) {
            const data = response.body;
            
            console.log(`Admin SharePoint: Batch drive data for ${response.id}:`, {
              id: data.id,
              name: data.name,
              displayName: data.displayName,
              driveType: data.driveType,
              owner: data.owner,
              webUrl: data.webUrl,
              rawData: data
            });
            
            // Extract site name from webUrl if available
            const extractSiteName = (webUrl?: string): string => {
              if (!webUrl) return '';
              try {
                // Case 1: SharePoint site - https://dsbintranet.sharepoint.com/sites/trAIn/...
                const siteMatch = webUrl.match(/\/sites\/([^\/]+)/);
                if (siteMatch) {
                  return siteMatch[1];
                }

                // Case 2: Personal OneDrive - https://dsbintranet-my.sharepoint.com/personal/xkapoj3107_dsb_dk/Documents
                const oneDriveMatch = webUrl.match(/\/personal\/([^\/]+)/);
                if (oneDriveMatch) {
                  const fullUsername = oneDriveMatch[1];
                  // Extract username part before _dsb_dk (or any domain suffix)
                  const username = fullUsername.split('_')[0];
                  return `OneDrive - ${username}`;
                }

                return '';
              } catch {
                return '';
              }
            };

            const siteName = extractSiteName(data.webUrl);
            const displayName = siteName || data.name || data.displayName || `Drive ${response.id}`;

            console.log(`Admin SharePoint: Batch - Extracted site name "${siteName}" from webUrl: ${data.webUrl}`);

            driveInfoMap.set(response.id, {
              id: data.id,
              name: displayName,
              driveType: data.driveType || 'business',
              owner: data.owner,
              webUrl: data.webUrl,
              siteName, // Add the extracted site name as a separate field
            });
          } else {
            console.error(`Admin SharePoint: Batch drive error for ${response.id}:`, response);
            driveInfoMap.set(response.id, new Error(`Failed to fetch drive: ${response.status}`));
          }
        });

        // Add delay between batches to avoid rate limiting
        if (batches.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

      } catch (batchError) {
        console.warn(`Admin SharePoint: Batch request failed for drives ${batch.join(', ')}, falling back to individual requests:`, batchError);
        
        // Fallback to individual requests
        for (const driveId of batch) {
          try {
            const driveInfo = await getAdminDriveInfo(driveId);
            driveInfoMap.set(driveId, driveInfo);
            
            // Add small delay between individual requests
            await new Promise(resolve => setTimeout(resolve, 50));
          } catch (individualError) {
            console.error(`Admin SharePoint: Individual drive request failed for ${driveId}:`, individualError);
            driveInfoMap.set(driveId, individualError instanceof Error ? individualError : new Error('Failed to fetch drive'));
          }
        }
      }
    }

    return driveInfoMap;
  };

  const getMultipleAdminFileDetails = async (
    fileRequests: Array<{ driveId: string; itemId: string; key: string }>
  ): Promise<Map<string, AdminFileItemDetails | Error>> => {
    if (fileRequests.length === 0) return new Map();

    const fileDetailsMap = new Map<string, AdminFileItemDetails | Error>();
    
    // Process in smaller batches to avoid resource issues
    const maxBatchSize = 5; // Even smaller for file details
    const batches = [];
    
    for (let i = 0; i < fileRequests.length; i += maxBatchSize) {
      batches.push(fileRequests.slice(i, i + maxBatchSize));
    }

    for (const batch of batches) {
      try {
        const requests: AdminBatchRequest[] = batch.map(req => ({
          id: req.key,
          method: 'GET',
          url: `drives/${req.driveId}/items/${req.itemId}`,
        }));

        console.log(`Admin SharePoint: Attempting batch request for ${batch.length} files`);
        const responses = await batchAdminRequests(requests);

        responses.forEach(response => {
          if (response.status === 200) {
            const data = response.body;
            fileDetailsMap.set(response.id, {
              id: data.id,
              name: data.name,
              size: data.size || 0,
              lastModifiedDateTime: data.lastModifiedDateTime,
              createdDateTime: data.createdDateTime,
              createdBy: data.createdBy,
              lastModifiedBy: data.lastModifiedBy,
              webUrl: data.webUrl,
              isMissing: false, // File found successfully
            });
          } else if (response.status === 404) {
            console.warn(`Admin SharePoint: Batch - File not found for request ${response.id}`);
            fileDetailsMap.set(response.id, {
              id: response.id,
              name: 'File not found',
              size: 0,
              lastModifiedDateTime: '',
              createdDateTime: '',
              webUrl: '',
              isMissing: true,
            });
          } else if (response.status === 403) {
            console.warn(`Admin SharePoint: Batch - Access denied for request ${response.id}`);
            fileDetailsMap.set(response.id, {
              id: response.id,
              name: 'Access denied',
              size: 0,
              lastModifiedDateTime: '',
              createdDateTime: '',
              webUrl: '',
              isMissing: true,
            });
          } else {
            fileDetailsMap.set(response.id, new Error(`Failed to fetch file: ${response.status}`));
          }
        });

        // Add delay between batches
        if (batches.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }

      } catch (batchError) {
        console.warn(`Admin SharePoint: File batch request failed, falling back to individual requests:`, batchError);
        
        // Fallback to individual requests
        for (const req of batch) {
          try {
            const fileDetails = await getAdminFileDetails(req.driveId, req.itemId);
            fileDetailsMap.set(req.key, fileDetails);
            
            // Add delay between individual requests
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (individualError) {
            console.error(`Admin SharePoint: Individual file request failed for ${req.key}:`, individualError);
            fileDetailsMap.set(req.key, individualError instanceof Error ? individualError : new Error('Failed to fetch file'));
          }
        }
      }
    }

    return fileDetailsMap;
  };

  // Users (Graph) helpers
  const getUsersBasic = async (userIds: string[]): Promise<Map<string, AdminGraphUserBasic | Error>> => {
    const map = new Map<string, AdminGraphUserBasic | Error>();
    if (!userIds || userIds.length === 0) return map;

    const uniqueIds = [...new Set(userIds)];
    const maxBatchSize = 20;
    for (let i = 0; i < uniqueIds.length; i += maxBatchSize) {
      const batch = uniqueIds.slice(i, i + maxBatchSize);
      const requests: AdminBatchRequest[] = batch.map((id) => ({
        id,
        method: 'GET',
        url: `users/${encodeURIComponent(id)}?$select=id,displayName,mail,userPrincipalName,jobTitle,department`,
      }));
      try {
        const responses = await batchAdminRequests(requests);
        responses.forEach((res) => {
          if (res.status === 200) {
            const b = res.body || {};
            map.set(res.id, {
              id: b.id || res.id,
              displayName: b.displayName,
              mail: b.mail,
              userPrincipalName: b.userPrincipalName,
              jobTitle: b.jobTitle,
              department: b.department,
            });
          } else {
            map.set(res.id, new Error(`Failed to fetch user ${res.id}: ${res.status}`));
          }
        });
      } catch (err) {
        batch.forEach((id) => map.set(id, err instanceof Error ? err : new Error('Failed to fetch user')));
      }
      if (uniqueIds.length > maxBatchSize) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    return map;
  };

  const getUserPhoto = async (userId: string, size: 48 | 64 | 96 | 120 = 48): Promise<string | null> => {
    try {
      const token = await getTokentWithScopes(graphScopes);
      const headers = new Headers({
        Authorization: `Bearer ${token}`,
        Accept: 'image/*',
      });
      const resp = await fetch(`${baseUrl}/users/${encodeURIComponent(userId)}/photos/${size}x${size}/$value`, { headers });
      if (resp.status === 404) return null; // No photo
      if (!resp.ok) throw new Error(`Photo fetch failed: ${resp.status} ${resp.statusText}`);
      const blob = await resp.blob();
      // Convert blob to data URL for <img src="...">
      const toDataUrl = (bl: Blob) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(bl);
      });
      return await toDataUrl(blob);
    } catch (e) {
      console.warn(`Admin SharePoint: Failed to fetch photo for user ${userId}`, e);
      return null;
    }
  };

  return {
    getAdminDriveInfo,
    getAdminFileDetails,
    batchAdminRequests,
    getMultipleAdminDriveInfos,
    getMultipleAdminFileDetails,
    getAdminHeaders,
    getUsersBasic,
    getUserPhoto,
  };
};