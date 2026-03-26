import { SilentRequest } from "@azure/msal-browser";
import { msalInstance } from "../App";
import { getAccessToken } from "./msalToken";
import { useSessionStore } from "../stores/sessionStore";
import { EventSourceMessage, getBytes, getLines, getMessages } from "./parse";

export const EventStreamContentType = "text/event-stream";

const config = window.env;

const DefaultRetryInterval = 1000;
const LastEventId = "last-event-id";

// Determine API scopes only (avoid mixing Graph scopes). Fallback to default scopes if none match
const apiScopesFiltered: string[] = Array.isArray(config.clientScopes)
  ? config.clientScopes.filter((s: string) => s.startsWith("api://"))
  : [];

export interface FetchEventSourceInit extends RequestInit {
  /**
   * The request headers. FetchEventSource only supports the Record<string,string> format.
   */
  headers?: Record<string, string>;

  /**
   * Called when a response is received. Use this to validate that the response
   * actually matches what you expect (and throw if it doesn't.) If not provided,
   * will default to a basic validation to ensure the content-type is text/event-stream.
   */
  onopen?: (response: Response) => Promise<void>;

  /**
   * Called when a message is received. NOTE: Unlike the default browser
   * EventSource.onmessage, this callback is called for _all_ events,
   * even ones with a custom `event` field.
   */
  onmessage?: (ev: EventSourceMessage) => void;

  /**
   * Called when a response finishes. If you don't expect the server to kill
   * the connection, you can throw an exception here and retry using onerror.
   */
  onclose?: () => void;

  /**
   * Called when there is any error making the request / processing messages /
   * handling callbacks etc. Use this to control the retry strategy: if the
   * error is fatal, rethrow the error inside the callback to stop the entire
   * operation. Otherwise, you can return an interval (in milliseconds) after
   * which the request will automatically retry (with the last-event-id).
   * If this callback is not specified, or it returns undefined, fetchEventSource
   * will treat every error as retriable and will try again after 1 second.
   */
  onerror?: (err: any) => number | null | undefined | void;

  /**
   * If true, will keep the request open even if the document is hidden.
   * By default, fetchEventSource will close the request and reopen it
   * automatically when the document becomes visible again.
   */
  openWhenHidden?: boolean;

  /** The Fetch function to use. Defaults to window.fetch */
  fetch?: typeof fetch;
}

export function fetchEventSource(
  input: RequestInfo,
  {
    signal: inputSignal,
    headers: inputHeaders,
    onopen: inputOnOpen,
    onmessage,
    onclose,
    onerror,
    openWhenHidden,
    fetch: inputFetch,
    ...rest
  }: FetchEventSourceInit
) {
  return new Promise<void>((resolve, reject) => {
    // make a copy of the input headers since we may modify it below:
    const headers = { ...inputHeaders };
    if (!headers.accept) {
      headers.accept = EventStreamContentType;
    }

    let curRequestController: AbortController;

    let retryInterval = DefaultRetryInterval;
    let retryTimer = 0;
    function dispose() {
      window.clearTimeout(retryTimer);
      curRequestController.abort();
    }

    // if the incoming signal aborts, dispose resources and resolve:
    inputSignal?.addEventListener("abort", () => {
      dispose();
      resolve(); // don't waste time constructing/logging errors
    });

    const fetch = inputFetch ?? window.fetch;
    const onopen = inputOnOpen ?? defaultOnOpen;
    async function create() {
      curRequestController = new AbortController();
      try {
        const response = await fetch(input, {
          ...rest,
          headers,
          signal: curRequestController.signal,
        });

        if (!response.ok) {
          // If the response is not ok, throw an error with the status
          const error: any = new Error(
            `HTTP error! status: ${response.status}`
          );
          error.status = response.status;
          throw error;
        }

        await onopen(response);

        await getBytes(
          response.body!,
          getLines(
            getMessages(
              (id) => {
                if (id) {
                  // store the id and send it back on the next retry:
                  headers[LastEventId] = id;
                } else {
                  // don't send the last-event-id header anymore:
                  delete headers[LastEventId];
                }
              },
              (retry) => {
                retryInterval = retry;
              },
              onmessage
            )
          )
        );

        onclose?.();
        dispose();
        resolve();
      } catch (err) {
        if (!curRequestController.signal.aborted) {
          // if we haven't aborted the request ourselves:
          try {
            // check if we need to retry:
            const interval: any = onerror?.(err) ?? retryInterval;
          } catch (innerErr) {
            // we should not retry anymore:
            dispose();
            reject(innerErr);
          }
        }
      }
    }

    create();
  });
}

function defaultOnOpen(response: Response) {
  const contentType = response.headers.get("content-type");
  if (!contentType?.startsWith(EventStreamContentType)) {
    throw new Error(
      `Expected content-type to be ${EventStreamContentType}, Actual: ${contentType}`
    );
  }
}

async function _acquireAccessToken(scopes?: string[]): Promise<string> {
  return getAccessToken(scopes);
}

const fetch = window.fetch;

window.fetch = (...args) =>
  (async (args) => {
    const input = args[0] as any;
    const resource = typeof input === "string" ? input : (input && input.url ? input.url : String(input));
    const config = args[1];

    const requestHeaders: HeadersInit =
      config && config.headers ? new Headers(config.headers) : new Headers();

    const isApiCall = resource.includes("/api/");
    if (isApiCall && !requestHeaders.has("Authorization")) {
      const accessToken = await _acquireAccessToken(apiScopesFiltered.length ? apiScopesFiltered : undefined);
      if (accessToken) {
        requestHeaders.set("Authorization", `Bearer ${accessToken}`);
      }

      const configClone = { ...config };
      configClone.headers = requestHeaders;

      const first = await fetch(resource, configClone);
      if (first.status === 401) {
        const sessionStore = useSessionStore.getState();
        sessionStore.markExpired();
        // try forced refresh once
        const refreshed = await getAccessToken(
          apiScopesFiltered.length ? apiScopesFiltered : undefined,
          { forceRefresh: true }
        );
        if (refreshed) {
          requestHeaders.set("Authorization", `Bearer ${refreshed}`);
          const retryConfig = { ...configClone, headers: requestHeaders };
          sessionStore.clearExpired();
          return await fetch(resource, retryConfig);
        }
        // Forced silent refresh failed – likely interaction required
        // Enqueue retry and show session expired
        const body = configClone?.body;
        const method = (configClone?.method || "GET").toUpperCase();
        const retryFn = async () => {
          const headers = new Headers(configClone?.headers as any);
          const token = await getAccessToken(undefined, { forceRefresh: true });
          if (token) headers.set("Authorization", `Bearer ${token}`);
          const retryConfig = { ...configClone, method, body, headers } as RequestInit;
          return fetch(resource, retryConfig);
        };
        sessionStore.enqueueRetry(retryFn);
      }
      return first;
    }

    const result = await fetch(resource, config);
    return result;
  })(args);
