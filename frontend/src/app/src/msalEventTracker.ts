import { AuthenticationResult, EventType, InteractionType, PublicClientApplication } from "@azure/msal-browser";
import axiosInstance from "./services/axiosInstance";

let lastIssuedAt: number | undefined;

async function postAuthEvent(payload: {
    type: "login" | "session_extended";
    expiresOn?: string;
    issuedAt?: string;
}) {
    try {
        const url = payload.type === "login" ? "auth/signIn" : "auth/sessionExtended";
        axiosInstance.post(url, payload);
    } catch (err) {
        console.error("Failed to post auth event:", err);
    }
}

export function registerMsalAuthEventTracking(msal: PublicClientApplication) {

    msal.addEventCallback((event) => {
        if (event.eventType === EventType.LOGIN_SUCCESS) {
            const result = event.payload as AuthenticationResult;
            const expiresOn = result.expiresOn?.toISOString();
            const claims = result.idTokenClaims as { iat?: number };

            const issuedAt = claims?.iat
                ? new Date(claims.iat * 1000).toISOString()
                : undefined;

            lastIssuedAt = claims?.iat;

            postAuthEvent({
                type: "login",
                expiresOn,
                issuedAt,
            });
        }

        else if (
            event.eventType === EventType.ACQUIRE_TOKEN_SUCCESS &&
            event.interactionType === InteractionType.Silent
        ) {
            const result = event.payload as AuthenticationResult;
            const expiresOn = result.expiresOn?.toISOString();
            const claims = result.idTokenClaims as { iat?: number };

            const currentIat = claims?.iat;

            // Only log if "iat" changed -> new silent token issued
            if (currentIat && currentIat !== lastIssuedAt) {

                lastIssuedAt = currentIat;

                const issuedAt = new Date(currentIat * 1000).toISOString();

                postAuthEvent({
                    type: "session_extended",
                    expiresOn,
                    issuedAt,
                });
            }
        }
    });
}
