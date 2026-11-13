# AI quality and key failover changes

## Why replies were weak or made things up
- **Earlier messages were dropped.** The system prompt was estimated at about 3,100 tokens against a
  2,200-token budget, so every request sent only the newest message. The model could not see the
  conversation and filled gaps by guessing. The estimate also counted about 40% too high.
- **Replies were capped at 256 tokens.** The leftover budget collapsed to its floor, so most replies
  were cut short. Reasoning tokens count against the cap, so the answer was often cut off entirely.
- **Summaries came from the weakest model.** A wrong summary stayed in the chat for good. Summaries
  now use the balanced tier.
- **Prompt rules encouraged false claims.** The prompt asked the model to "verify" and "recompute"
  things it cannot do. It now says what it can and cannot check, and forbids invented citations,
  links, and file contents.

## Key failover
- Failed keys go on cooldown: 30 minutes for out-of-credit or rejected keys, 1 minute for rate limits
  (or the Retry-After value), 15 seconds for server errors. Later requests skip them.
- Request-level errors (400/404/422) no longer burn through every key.
- A stalled request times out (default 90 s) and moves on to the next key.
- A dropped stream never retries after text has been shown, so the user never sees duplicated text.
  A partial reply gets a note that it was cut off.
- The admin panel reports keys that are cooling down.

## New settings (all optional)
- `GROQ_PROMPT_TOKEN_BUDGET` (default 4500)
- `GROQ_MAX_OUTPUT_TOKENS` (default 3072)
- `GROQ_REQUEST_TIMEOUT_MS` (default 90000)

Cooldown state lives in server memory, so each serverless instance tracks its own keys.

## Status page and model monitoring
- **Broken status embed fixed.** The home page iframe of status.roleflow.site was blocked by the
  status host, so it showed an error icon. The page now renders live status itself (`SystemStatus`).
- **Per-model status.** `GET /api/status` is public and returns each model's status, latency and a
  generic note. It never returns key labels or provider errors. Results are cached for 5 minutes.
- **Degraded state.** A model is degraded when it answers slowly (5 s or more) or is rate limited.
  Degraded shows amber, down shows red, and the overall banner reports the worst state.
- **Admin overview is live.** The model cards show real status and latency instead of fixed
  "Online" labels and a hardcoded "~840 ms".
- **Better Stack token removed from source.** `BETTERSTACK_API_TOKEN` must now come from the
  environment. The old fallback value was committed in the repo and should be rotated.
- **CSP.** Removed the `frame-src` entry, since nothing is embedded any more.

## One monitor per model
- `GET /api/health/models/<model-id>` checks one model. IDs: `roleflow-apex-1`, `roleflow-omni-1`,
  `roleflow-genesis-1`, `roleflow-flash-2`. It returns 503 when that model is down, and 200 otherwise.
- The token check is shared by both health routes (`src/lib/health-auth.ts`).
- Maintenance mode pauses every monitor listed in `BETTERSTACK_MODEL_MONITOR_IDS`, so planned
  downtime does not page anyone.

## v5: motion, footer, prompt rules, legal updates
- **Motion system** (`globals.css`): scroll-reveal for homepage sections (CSS scroll-driven, content stays visible where unsupported), animated hero preview, button lift and press, card hover, nav underline, live status dot, admin panel fade on tab change. All motion is disabled under `prefers-reduced-motion`.
- **Footer rebuilt**: CTA band, grouped link columns, the Law enforcement link is now its own item (it was nested inside Moderation), status pill, back-to-top.
- **Prompt quality**: conversation-reference resolution, consistent names across turns, root-cause-first bug fixes with complete files, and a final requirements check.
- **Legal**: dates set to November 13, 2026; privacy policy now discloses web search query sharing. Needs legal review before publishing.

## v6: email redesign, vector icons, custom templates
- **No emoji in email.** Every template and the composer use one of 19 vector icons (`src/lib/email-icons.ts`, PNGs in `public/email/`, rendered from 24px stroke SVG). The sign-in email and the security alert also drop their emoji.
- **Email layout remade** (`src/lib/email-template-html.ts`): icon tile, clearer hierarchy, preheader support, trusted extra block for one-time codes. Sign-in now uses the same renderer.
- **All 100 library templates** now carry an `icon` key instead of `emoji`.
- **Custom templates.** Admins can save any composed email as a template ("Save as template"), reuse it from "Your templates", and delete it. Stored in `roleflow_email_templates` (Postgres) or the local store. API: `GET|POST|DELETE /api/admin/emails/templates`.
- **AI draft** returns an icon id from the fixed list instead of an emoji.
