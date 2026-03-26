import { 
    AdGroup,
    TransactionRequest,
    TransactionResponse,
    ApiKeyMeta,
    Model,
    PaginatedResponse,
    ServiceNowApplication,
    SubscriptionEntity,
    SubscriptionEnricher,
    SubscriptionEnricherKey,
    SubscriptionModel,
    SubscriptionUsage
} from "../types/maasTypes";
import { axiosInstanceMaasApi } from "./axiosInstance";


/* ============================
 *  Subscriptions
 * ============================ */
/*
    *  Fetches subscriptions where the user is either:
    *    1. creator and the subscription is of type SANDBOX
    *    2. OR the the user is a member of the subscription ad group
*/ 
export const getUserManagedSubscriptions = async (): Promise<SubscriptionEntity[]> => {
    const response: { data: SubscriptionEntity[] } = await axiosInstanceMaasApi.get("/v1/subscriptions");
    return response.data;
}

export const addSubscription = async (subscription: SubscriptionEntity): Promise<SubscriptionEntity> => {
    const response: { data: SubscriptionEntity } = await axiosInstanceMaasApi.post("/v1/subscriptions", subscription);
    return response.data;
}

/*
    *  Fetches ALL subscriptions (requires admin role).
*/
export const getAdminSubscriptions = async (): Promise<SubscriptionEntity[]> => {
    const response: { data: SubscriptionEntity[] } = await axiosInstanceMaasApi.get("/v1/admin/subscriptions");
    return response.data;
}

/*
    *  Deactivates a subscription and blocks the api keys associated with it.
    *  Only subscriptions in ACTIVE status can be deactivated
*/ 
export const deactivateSubscription = async (subscription: SubscriptionEntity): Promise<SubscriptionEntity> => {
    const response: { data: SubscriptionEntity } = await axiosInstanceMaasApi.post(`/v1/subscriptions/${subscription.id}/deactivate`, subscription);
    return response.data;
}

/* ============================
 *  Service Now Applications
 * ============================ */
/*
    * Fetches ServiceNow applications with optional search and pagination.
    *
    * @param search - Optional search term to filter by name or application ID (case-insensitive)
    * @param pageSize - Number of items per page to return (1-100, default: 20)
*/
export const getApplications = async (
    search?: string,
    page: number = 1,
    pageSize: number = 20
): Promise<PaginatedResponse<ServiceNowApplication>> => {
    const response = await axiosInstanceMaasApi.get<PaginatedResponse<ServiceNowApplication>>("/v1/applications", {
        params: { search, page, pageSize },
    });
    return response.data;
}


/* ============================
 *  AD/Entra groups
 * ============================ */
/*
    * Fetches AD/Entra groups with optional search and pagination.
    *
    * @param search - Optional search term to filter by name or object ID (case-insensitive)
    * @param pageSize - Number of items per page to return (1-100, default: 20)
*/
export const getAdGroups = async (
    search?: string,
    page: number = 1,
    pageSize: number = 20
): Promise<PaginatedResponse<AdGroup>> => {
    const response = await axiosInstanceMaasApi.get<PaginatedResponse<AdGroup>>("/v1/groups", {
        params: { search, page, pageSize },
    });
    return response.data;
}

/* ============================
 *  Models
 * ============================ */
/*
    * Fetches all models available regardless of they are active or not
*/ 
export const getAllModels = async (): Promise<Model[]> => {
    let models: Model[] = [];
    try {
        models = (await axiosInstanceMaasApi.get("/v1/models")).data;
        return models;
    } catch (error) {
        console.error("Failed to fetch models from the Management API:", error);
        throw error;
    }
}

/* ============================
 *  Subscription Details (per-resource)
 * ============================ */

export const getSubscriptionModels = async (subscriptionId: string): Promise<SubscriptionModel[]> => {
    let models: SubscriptionModel[] = [];
    try {
        models = (await axiosInstanceMaasApi.get(`/v1/subscriptions/${subscriptionId}/models`)).data;
        return models;
    } catch (error) {
        console.error("Failed to fetch subscription models from the Management API:", error);
        throw error;
    }
}

export const getSubscriptionUsage = async (subscriptionId: string): Promise<SubscriptionUsage> => {
    try {
        const response = await axiosInstanceMaasApi.get<SubscriptionUsage>(`/v1/subscriptions/${subscriptionId}/usage`);
        return response.data;
    } catch (error) {
        console.error("Failed to fetch subscription usage from the Management API:", error);
        throw error;
    }
}

export const getSubscriptionApiKeyMeta = async (subscriptionId: string): Promise<ApiKeyMeta | null> => {
    try {
        const response = await axiosInstanceMaasApi.get<ApiKeyMeta>(`/v1/subscriptions/${subscriptionId}/<fabios endpoint>`);
        return response.data;
    } catch (error: any) {
        if (error?.response?.status === 404) return null;
        console.error("Failed to fetch subscription API key metadata from the Management API:", error);
        throw error;
    }
}

/* ============================
 *  Enricher registry & status tracking
 * ============================ */

export const subscriptionDetailEnrichers: SubscriptionEnricher[] = [
    {
        key: SubscriptionEnricherKey.Models,
        fn: async (subscriptionId) => {
            const models = await getSubscriptionModels(subscriptionId);
            return { models };
        },
    },
    {
        key: SubscriptionEnricherKey.Usage,
        fn: async (subscriptionId) => {
            const usage = await getSubscriptionUsage(subscriptionId);
            return { tokenUsage: usage.tokenUsage, requestStats: usage.requestStats, costStats: usage.costStats };
        },
    },
    // {
    //     key: SubscriptionEnricherKey.ApiKeyMeta,
    //     fn: async (subscriptionId) => {
    //         const apiKeyMeta = await getSubscriptionApiKeyMeta(subscriptionId);
    //         return { apiKeyMeta: apiKeyMeta ?? undefined };
    //     },
    // },
];

/** Tracks in-flight / completed enrichers per subscription.  key = `${subscriptionId}::${enricherKey}` */
export const enricherStatus = new Map<string, "pending" | "done">();

export const enricherCacheKey = (id: string, key: SubscriptionEnricherKey) => `${id}::${key}`;

export const invalidateSubscriptionEnrichers = (
    subscriptionId: string,
    keys?: SubscriptionEnricherKey[],
) => {
    if (!keys || keys.length === 0) {
        for (const enricher of subscriptionDetailEnrichers) {
            enricherStatus.delete(enricherCacheKey(subscriptionId, enricher.key));
        }
        return;
    }

    for (const key of keys) {
        enricherStatus.delete(enricherCacheKey(subscriptionId, key));
    }
};

export const invalidateAllSubscriptionEnrichers = () => {
    enricherStatus.clear();
};

/* ============================
 * Transactions
 * ============================ */
/*
    * Executes an ADMIN transaction on a subscription.
    *
    * Supported actions: APPROVE, DISABLE, CANCELLED, DELETE, ENABLE, EXTEND
*/
export const postSubscriptionAdminTransaction = async (
    subscriptionId: string,
    transaction: TransactionRequest,
): Promise<TransactionResponse> => {
    const response = await axiosInstanceMaasApi.post<TransactionResponse>(
        `/v1/admin/subscriptions/${subscriptionId}/transactions`,
        transaction,
    );
    if (response.data.status !== "SUCCESS") {
        console.error("Transaction failed:", response.data);
        throw new Error(`Transaction failed with status: ${response.data.status}`);
    }

    return response.data;
};

export const maasService = {
    getUserManagedSubscriptions,
    getAdminSubscriptions,
    addSubscription,
    deactivateSubscription,
    postSubscriptionAdminTransaction,
    getSubscriptionModels,
    getAllModels,
    getApplications,
    getAdGroups,
    getSubscriptionApiKeyMeta,
    getSubscriptionUsage,
};