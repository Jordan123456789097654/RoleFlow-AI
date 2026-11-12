# API Keys

**Last updated:** November 12, 2026

RoleFlow API keys let your own software send chat requests to RoleFlow and receive the assistant's replies. This page covers creating and managing keys, authenticating requests, the chat completions endpoint, limits, errors, and security practices.

## 1. Overview

An API key is a secret string that identifies your RoleFlow account when a program calls the API. Each key:

- belongs to the account that created it and counts against that account's usage;
- has its own per-minute and per-day request limits;
- can be restricted to specific models;
- can be given an expiry date, or none; and
- can be revoked at any time.

Keys begin with `rf_live_` followed by a random string. Requests are made over HTTPS to the base URL `https://roleflow.site`.

## 2. Before You Start

- You must have a RoleFlow account and be signed in. Guest sessions cannot create keys.
- API keys must be enabled for RoleFlow. If they are turned off, key creation and API requests return an error explaining that.
- Your account must be in good standing. Suspended accounts cannot create keys, and existing keys stop working.
- Review the [Terms of Service](/terms), the [Acceptable Use Policy](/acceptable-use), and the [Moderation and Appeals Policy](/moderation). API requests are subject to the same content rules as the chat application.

## 3. Creating a Key

1. Sign in and open **Settings**, then the **API Keys** section.
2. Select **Create key**.
3. Enter the settings below and confirm.
4. Copy the key immediately. The full key is shown **once**. RoleFlow stores only a cryptographic hash of the key and a short display prefix, so the full key cannot be retrieved later.

| Setting | Allowed values | Default |
|---|---|---|
| Name | 1 to 60 characters | none (required) |
| Requests per minute (`rpm`) | whole number from 1 to 120 | 30 |
| Requests per day (`rpd`) | whole number from 1 to 10,000 | 2,500 |
| Expiry | 7, 30, or 90 days, or never | never |
| Allowed models | any combination of the models you are permitted to use | all models |

Each account may hold up to **5 active keys** by default. Revoked and expired keys do not count toward this limit.

### 3.1 Creating a key programmatically

Keys are created through the same endpoint the Settings page uses. This requires a signed-in browser session and is not available with an API key:

```
POST /api/keys
Content-Type: application/json

{ "name": "my-integration", "rpm": 30, "rpd": 2500, "expiresInDays": 90 }
```

Set `expiresInDays` to `null` or omit it for a key that never expires. The response contains the full key once, as `key`, and the stored record without its hash.

## 4. Listing and Revoking Keys

- **List keys.** Open Settings → API Keys. You can see each key's name, display prefix, creation date, last-used time, request count, limits, expiry, and status.
- **Revoke a key.** Select **Revoke** next to the key. Revocation takes effect immediately for new requests. Revoked keys cannot be restored; create a new one instead.
- **Delete a revoked key.** Send `DELETE /api/keys/{id}` from a signed-in session to remove the record.

If a key is exposed, revoke it immediately, then create a replacement and update your systems.

## 5. Authenticating Requests

Send the key in the `Authorization` header using the Bearer scheme:

```
Authorization: Bearer rf_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Do not send keys in URLs, query strings, or client-side code that users can view. Keys sent from a web browser can be read by anyone who visits the page.

## 6. Chat Completions Endpoint

```
POST https://roleflow.site/api/v1/chat/completions
Authorization: Bearer rf_live_...
Content-Type: application/json
```

### 6.1 Request body

```json
{
  "model": "roleflow-genesis-1",
  "messages": [
    { "role": "user", "content": "Explain what a mutex is in two sentences." }
  ],
  "effort": "medium"
}
```

| Field | Required | Description |
|---|---|---|
| `messages` | yes | Non-empty array of objects with `role` (`user` or `assistant`) and `content` (non-empty string, up to 16,000 characters per message). The last message must have role `user`. |
| `model` | no | `roleflow-apex-1` (highest-intelligence frontier), `roleflow-omni-1` (frontier reasoning), `roleflow-genesis-1` (balanced flagship, Genesis 1.5), or `roleflow-flash-2` (ultra-fast, default). `roleflow-flash-1` is still accepted and is served by `roleflow-flash-2`. |
| `effort` | no | `low`, `medium` (default), `high`, `extra`, or `max`. |

Notes on the request:

- **System messages are not used.** Any system-role content is removed before the request is processed. Put instructions in the first user message.
- **Text only.** Attachments are not accepted. A message with attachments returns an `unsupported_attachment` error.
- **Conversation history.** The API is stateless. To continue a conversation, send the earlier messages again in `messages`. Only the most recent 30 messages are used.
- **Effort levels.** `extra` and `max` may be lowered to `high` when those levels are not enabled for your account. The response does not indicate the adjustment.
- **Streaming is not supported.** Each request returns one complete JSON response.
- **Memory is not used.** API requests do not read or write user memory, and they are not saved to chat history.

### 6.2 Response

```json
{
  "id": "chatcmpl-1763000000000",
  "object": "chat.completion",
  "created": 1763000000,
  "model": "roleflow-genesis-1",
  "choices": [
    {
      "index": 0,
      "message": { "role": "assistant", "content": "A mutex is ..." },
      "finish_reason": "stop"
    }
  ],
  "usage": { "used": 12, "limit": 100, "remaining": 88 }
}
```

- `usage` reports the owning account's usage for the current period.
- Responses include these headers:
  - `X-RateLimit-Limit-Minute`: your key's per-minute limit.
  - `X-RateLimit-Remaining-Day`: requests remaining today for this key.

### 6.3 Example

```bash
curl https://roleflow.site/api/v1/chat/completions \
  -H "Authorization: Bearer $ROLEFLOW_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "roleflow-flash-2",
    "messages": [{ "role": "user", "content": "Give me three synonyms for happy." }]
  }'
```

```javascript
const res = await fetch("https://roleflow.site/api/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.ROLEFLOW_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    messages: [{ role: "user", content: "Give me three synonyms for happy." }],
  }),
});

if (!res.ok) {
  const { error } = await res.json();
  throw new Error(`${error.code}: ${error.message}`);
}
const data = await res.json();
console.log(data.choices[0].message.content);
```

Store the key in an environment variable or a secrets manager, never in source code.

## 7. Limits

Each key is limited in two ways:

- **Per minute.** A sliding one-minute window set by the key's `rpm`. When exceeded, the response is HTTP `429` with a `Retry-After` header giving the number of seconds to wait.
- **Per day.** The key's `rpd`, counted per UTC calendar day. The counter resets at midnight UTC. When exceeded, the response is HTTP `429` with code `rate_limit_exceeded`.

Requests that fail with a validation error or a model-unavailable error are not counted toward the daily limit.

Account-level usage limits also apply and are shared across all of your keys and the chat application.

## 8. Errors

Errors use a consistent JSON shape:

```json
{
  "error": {
    "message": "Rate limit reached: 30 requests per minute for this key. Retry shortly.",
    "type": "rate_limit_error",
    "code": "rate_limit_exceeded"
  }
}
```

Use `code` for programmatic handling. The `message` text may change.

| HTTP status | `code` | Meaning and what to do |
|---|---|---|
| 400 | `invalid_json` | The body is not valid JSON. Fix the request. |
| 400 | `invalid_messages` | `messages` is missing, empty, malformed, has no string content, is too long, or does not end with a `user` message. |
| 400 | `invalid_model` | `model` is not one of the supported values. |
| 400 | `invalid_effort` | `effort` is not one of the supported values. |
| 400 | `unsupported_attachment` | Remove attachments. The API accepts text only. |
| 401 | `invalid_api_key` | The header is missing or malformed, or the key does not exist. Check the `Authorization: Bearer` header. |
| 403 | `key_revoked` | The key was revoked. Create a new key. |
| 403 | `key_expired` | The key reached its expiry date. Create a new key. |
| 403 | `model_not_allowed` | The key is restricted and does not permit this model. Use an allowed model or edit the key's permissions. |
| 403 | `api_disabled` | API access is turned off. Try again later. |
| 403 | `account_suspended` | The account is suspended. See the [Moderation and Appeals Policy](/moderation). |
| 429 | `rate_limit_exceeded` | Per-minute or per-day limit reached. Wait for `Retry-After` or until the daily reset. |
| 500 | `internal_error` | An unexpected error occurred. Retry with backoff. |
| 503 | `maintenance` | RoleFlow is in scheduled maintenance. Retry later. |
| 503 | `model_unavailable` | The model provider is temporarily unavailable. You are not charged. Retry with backoff. |

### 8.1 Content refusals

If a request violates the Acceptable Use Policy, it is refused and logged for review. The refusal is returned as an error and no answer is generated. Repeated or severe violations can lead to account action, and API keys tied to a suspended account stop working. See the [Moderation and Appeals Policy](/moderation) for how decisions are made and how to appeal.

## 9. Retries and Good Practice

- Retry `429`, `500`, and `503` responses with exponential backoff and jitter. Honor `Retry-After` when present.
- Do not retry `400`, `401`, or `403` responses without changing the request or the key.
- Keep requests within the `rpm` you configured. Spread batch work over time rather than sending bursts.
- Keep messages focused. Long histories consume more capacity and may be truncated to the most recent 30 messages.
- Log `error.code` and the request timestamp for debugging. Do not log full prompts or responses unless you have a lawful basis and a retention plan.

## 10. Security Practices

- **Treat keys as passwords.** Anyone with your key can use your account's quota and send requests in your name.
- **Use one key per integration.** Separate keys let you revoke one without affecting others, and make usage easier to attribute.
- **Restrict models and limits.** Give each key only the models and request limits it needs.
- **Set an expiry.** Short-lived keys reduce the impact of an unnoticed leak. Rotate keys on a schedule.
- **Keep keys server-side.** Call the API from your backend. If a browser or mobile app must call RoleFlow, route the call through your own server that holds the key.
- **Do not commit keys.** Add `.env` files to `.gitignore`, and use your platform's secret store. If a key appears in a repository, public log, or chat transcript, revoke it right away.
- **Monitor.** Review last-used times and request counts regularly, and revoke keys that are no longer in use.

If you discover that a key has been misused, revoke it and contact support@roleflow.site.

## 11. Data Handling for API Requests

- Prompts and responses are sent to the model provider that serves your request. See the [Privacy Policy](/privacy) for how provider processing works.
- API requests are not saved to chat history and do not read or write memory.
- Safety checks apply to API requests. Flagged content is logged for review as described in the [Moderation and Appeals Policy](/moderation).
- Do not send personal information, credentials, or other sensitive data unless you have a lawful basis and have reviewed the [Privacy Policy](/privacy).

## 12. Changes and Deprecations

We may add models, change limits, or retire models with notice where practicable. Model retirements and provider outages can happen at short notice; design your integration to handle `model_unavailable` and to switch models when needed. Material changes to this page will be noted at the top.

## 13. Support

- Questions and help: support@roleflow.site
- Security reports: security@roleflow.site

