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
