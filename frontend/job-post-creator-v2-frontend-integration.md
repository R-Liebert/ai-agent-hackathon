# Job Post Creator V2 – Front-End Integration Guide

This guide explains how to consume the versioned `api/v2/jobpoststream` surface from the browser. It focuses on streaming patterns, SSE contracts, correlation IDs, and UX considerations so that the newest Job Post Creator provides a responsive, trustworthy experience.

## 1. Platform Overview

- **Base route**: `/api/v2/jobpoststream`
- **Transport**: JSON over HTTPS + Server-Sent Events (SSE) for long-running flows
- **Auth**: Same Microsoft Identity access tokens used elsewhere (`Authorization: Bearer {token}`)
- **Feature gate**: The backend emits a `feature_disabled` SSE if `FeatureFlags:EnableJobPostV2` is off—front-end should fall back to `/api/jobpoststream` in that case.
- **Versioning**: All CRUD endpoints mirror V1 behaviour, but streaming flows (generate/chat/modify/transform) emit richer event payloads and require SSE listeners.

## 2. Prerequisites & Client Setup

1. **SSE-capable HTTP client** – browsers should use `EventSource`, `ReadableStream`, or `fetch` with `ReadableStream` support. Remember to set `Accept: text/event-stream`.
2. **Abort handling** – pass an `AbortController` token; the backend watches `HttpContext.RequestAborted` and stops work immediately.
3. **Correlation ID plumbing** – include a `correlationId` string for chat/modify/transform requests. If omitted, the API generates one and mirrors it in every SSE payload plus `x-correlation-id` header.
4. **Unicode & streaming** – treat payloads as UTF-8. SSE events arrive as `data: {json}\n\n`; parse on receipt, don’t buffer the entire stream.

### Sample SSE bootstrap (React + fetch)

```ts
const controller = new AbortController();
const response = await fetch(`/api/v2/jobpoststream/${jobPostId}/chat`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream'
  },
  body: JSON.stringify(payload),
  signal: controller.signal
});

const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (reader) {
  const { value, done } = await reader.read();
  if (done) break;
  decoder.decode(value, { stream: true })
    .split('\n\n')
    .filter(Boolean)
    .forEach((chunk) => {
      const json = JSON.parse(chunk.replace(/^data: /, ''));
      handleEvent(json);
    });
}
```

## 3. Endpoint Matrix

| Endpoint | Method | Streaming? | Purpose |
| --- | --- | --- | --- |
| `/api/v2/jobpoststream` | POST | No | Create job post (delegates to V1 service)
| `/api/v2/jobpoststream/{id}` | GET/PUT/DELETE | No | CRUD operations; responses match V1 DTOs
| `/api/v2/jobpoststream/{id}/section` | PUT | No | Update single section
| `/api/v2/jobpoststream/{id}/generate?regenerate={bool}` | POST | **SSE** | Parallel section generation with per-section streaming
| `/api/v2/jobpoststream/{id}/chat` | POST | **SSE** | Explain, brainstorm, or auto-modify content via chat + orchestrator
| `/api/v2/jobpoststream/{id}/modify` | POST | **SSE** | Direct contextual modification (selection required)
| `/api/v2/jobpoststream/{id}/transform` | POST | **SSE** | Polish/expand/summarize entire job post or a single section
| `/api/v2/jobpoststream/{id}/batch` | PATCH | JSON | Phase‑4 optimistic batch update with ETags
| `/api/v2/jobpoststream/{id}/pending` (if enabled) | GET | JSON | Inspect queued background updates (Phase 4)

## 4. Request DTOs (front-end contracts)

### 4.1 `ChatRequest`

```json
{
  "message": "Tighten the qualifications to highlight TypeScript",
  "sectionName": "Qualifications",
  "selection": {
    "selectedText": "5+ years building web apps",
    "beforeText": "We look for",
    "afterText": "with a passion for UX",
    "startPosition": 140,
    "endPosition": 172
  },
  "includeHistory": true,
  "correlationId": "chat-20241205-abc"
}
```

- `sectionName` is optional but improves intent classification.
- `selection` is optional for chat but required for `/modify`.
- `includeHistory=true` streams recent chat context (up to 10 messages) for richer answers.

### 4.2 `ModificationRequest`

```json
{
  "instruction": "Rewrite in bullet form and call out remote perks",
  "sectionName": "JobDescription",
  "selection": {
    "selectedText": "You will work on...",
    "startPosition": 0,
    "endPosition": 220
  },
  "correlationId": "modify-98432"
}
```

### 4.3 `TransformRequest`

```json
{
  "transformType": "polish", // also supports expand, summarize
  "sectionName": null,
  "additionalInstructions": "Keep tone friendly",
  "correlationId": "transform-1"
}
```

### 4.4 Batch Update DTOs

```json
PATCH /api/v2/jobpoststream/{id}/batch
{
  "sectionUpdates": {
    "Header": "Join Contoso AI",
    "Appetizer": "We build safer copilots..."
  },
  "expectedHashes": {
    "Header": "c1e9b...",
    "Appetizer": "9fe11..."
  },
  "expectedETag": "\"0x8DAFC9F3\""
}
```

- Supply either `expectedHashes`, `expectedETag`, or both to detect concurrent edits. The response returns `conflicts` with server truth if validation fails.

## 5. SSE Contract by Flow

### 5.1 Generation (`POST /{id}/generate`)

1. **Request** – send `regenerate=true` to force re-run even if `contentGenerated` is true.
2. **SSE payloads** – generated in `GenerationCoordinator`:

```
data: {"Section":"Header","Content":"...","Progress":{"Completed":1,"Total":6}}
```

3. **Completion** – once every section is streamed, the service calls `EndStreamAsync` ⇒ `data: {"Content":"stream-ended"}`.
4. **Client handling**
   - Build progress as `Progress.Completed / Progress.Total`
   - Use `Section` to know which UI panel to populate
   - Treat absence of `Content` (null) as a failed section; display inline retry CTA.

### 5.2 Chat with Modification (`POST /{id}/chat`)

Event ordering (happy path):

| Order | Event type | Payload snippet |
| --- | --- | --- |
| 1 | `chat_start` | `{ "intent": "modification_text_selection", "targetSection": "Qualifications", "willModify": true }` |
| 2..n | `chat_chunk` | `{ "content": "Here’s how to tighten...", "index": 0 }` |
| parallel | `modification_queued` | `{ "jobId": "mod-123", "modificationType": "text_selection" }` |
| parallel | `modification_progress` | `{ "jobId": "mod-123", "progress": 70, "message": "Validating changes" }` |
| optional | `modification_complete` | `{ "modification": { "sectionName": "Qualifications", "replacementText": "..." } }` |
| end | `chat_complete` | `{ "fullMessage": "Updated the skills section..." }` |
| final | stream-ended | `data: {"Content":"stream-ended"}` |

Notes:

- If the intent classifier decides no modification is needed, you’ll only see chat events.
- `StreamErrorEvent` payloads always set `type: "error"`, `errorType` (e.g., `modification_timeout`, `circuit_breaker_open`, `orchestration_failed`) plus `recoverable` flag—show toast + re-enable controls if `recoverable=true`.
- Modification completion contains:

```json
{
  "type": "modification_complete",
  "correlationId": "chat-20241205-abc",
  "jobId": "mod-123",
  "modification": {
    "sectionName": "ShortIntroduction",
    "textToReplace": "...old text...",
    "replacementText": "...new text...",
    "completeSectionContent": "...",
    "revisionId": "v2-20241205T104500Z",
    "appliedToCache": true,
    "persistedToDatabase": true
  }
}
```

### 5.3 `/modify`

- Same SSE types as chat, but there is no `chat_chunk` stream unless the orchestrator decides to send explanatory text.
- Require a selection. If section lookup fails you’ll receive a `type: "error"`, `message: "Section 'X' not found or empty"` before any modification work begins.

### 5.4 `/transform`

Sequence:

1. `transform_start` – emitted before validations; includes section + human-readable message.
2. Zero or more validation errors (as `type: "error"`) – e.g., invalid `transformType`.
3. `transform_complete` – placeholder implementation today acknowledges the request and states how many sections were queued. Expect future versions to emit per-section completion events.
4. Stream end marker.

Sample completion payload:

```json
{
  "type": "transform_complete",
  "transformType": "polish",
  "sectionsProcessed": 3,
  "message": "Transformation 'polish' request acknowledged...",
  "correlationId": "transform-1"
}
```

### 5.5 Batch Updates (`PATCH /batch`)

- Pure JSON response:

```json
{
  "success": true,
  "newETag": "\"0x8DAFC9F8\"",
  "updatedSections": ["Header", "Appetizer"],
  "queuedForBatch": false
}
```

- On conflict (`409`):

```json
{
  "message": "Section conflicts detected",
  "conflicts": [
    {
      "section": "Header",
      "expectedHash": "c1e9b...",
      "actualHash": "7fa1d...",
      "message": "Section changed since last fetch"
    }
  ]
}
```

## 6. Correlation & Telemetry Best Practices

1. **Send your own `correlationId`** for every streaming request so the UI can stitch SSE events to optimistic updates. Use a namespaced format (`chat:{jobPostId}:{timestamp}`) to keep logs human-friendly.
2. **Display the request-scoped ID** somewhere in dev builds to speed up log searches—back-end logs include it in every line for generate/chat/modify/transform flows.
3. **Read the `x-correlation-id` header** returned by middleware. It tracks the HTTP request itself (one per network call) whereas the body-level IDs track per-operation state. When debugging, capture both.

## 7. Error Handling Matrix

| errorType | When it fires | Recommended UX |
| --- | --- | --- |
| `generation_failed` | `InvalidOperationException` during generate | Show inline retry CTA and leave previous draft intact |
| `internal_error` | Unexpected exception (generate/chat/modify/transform) | Toast “Something went wrong. Try again.”; log correlation ID |
| `chat_failed` / `modification_failed` | Validation or orchestration failures | Highlight the affected section, prompt to fix inputs |
| `modification_timeout` | LLM or persistence exceeded timeout | Present gentle warning; allow user to retry only modification |
| `circuit_breaker_open` | Backend detected consecutive modification failures | Disable modification-specific controls temporarily |
| `feature_disabled` | V2 flag off | Automatically downgrade to V1 endpoints |
| `transformation_failed` | Invalid section/type or missing job post | Keep modal open, show validation message |

Every error payload contains `recoverable` (default false). Respect it when deciding whether to re-enable the CTA automatically.

## 8. UX Recommendations

1. **Dual-track progress UI** – show chat streaming text separately from modification progress so users understand both tracks.
2. **Section-level patching** – when receiving `modification_complete`, reconcile the `ReplacementText` with the locally edited document before displaying the final section to avoid cursor jumps.
3. **Selection safety rails** – capture `beforeText`/`afterText` in the editor so the backend can anchor replacements even if positions drift.
4. **Optimistic updates** – apply chat suggestions to a preview pane, but wait for `modification_complete` (or `sectionsProcessed` in transforms) before mutating the canonical editor state.
5. **Stream termination** – treat `{"Content":"stream-ended"}` as success. If the connection ends without that token, surface a transient warning—most often it means the browser cancelled or network dropped.

## 9. Testing & Troubleshooting

- **Manual curl** (generation example):

```bash
curl -N -H "Authorization: Bearer $TOKEN" -H "Accept: text/event-stream" \
  -X POST "https://api.dev.dsb.com/api/v2/jobpoststream/{jobPostId}/generate?regenerate=false"
```

- **Replay SSE** – we log every event (type + correlationId). Ask backend for Kibana query `CorrelationId:"chat-20241205-abc"` to inspect the exact timeline.
- **Timeouts** – the backend aborts after ~60s if the client disconnects; always close the `AbortController` when unmounting React components to avoid zombie work.
- **Batch update conflicts** – when you see `expectedETag` mismatch, re-fetch via `GET /api/v2/jobpoststream/{id}` to sync latest server snapshot before retrying.

---

Adhering to this contract ensures the front-end takes full advantage of the parallel streaming, better logging, and improved resilience that shipped with Job Post Creator V2. Reach out to the API team if you need mock servers or updated DTOs.
