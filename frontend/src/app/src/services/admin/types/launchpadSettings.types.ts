export interface BestySettings {
  enabled: boolean;
  exposeInAgentCatalog: boolean;
  allowedEntraGroupIds: string[];
}

export interface LaunchpadSettingsResponse {
  schemaVersion: number;
  agents: {
    besty: BestySettings;
  };
  updatedAt: string;
  updatedBy?: string | null;
  eTag?: string | null;
  fromCache: boolean;
}

export interface UpdateBestySettingsRequest {
  enabled?: boolean;
  exposeInAgentCatalog?: boolean;
  allowedEntraGroupIds?: string[] | null;
}

export interface UpdateLaunchpadSettingsRequest {
  expectedEtag?: string;
  agents?: {
    besty?: UpdateBestySettingsRequest;
  };
}

export interface LaunchpadSettingsValidationProblem {
  title?: string;
  detail?: string;
  message?: string;
  errors?: Record<string, string[]>;
}
