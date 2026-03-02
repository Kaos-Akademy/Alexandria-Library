# AI Librarian Chat Setup

## Environment Variables

Add to Vercel environment variables (Settings → Environment Variables), or to `frontend/library/.env.local` for local dev.

**Option A: Grok (xAI)** — recommended if Google quota is exhausted

```bash
XAI_API_KEY=xai-...   # From https://console.x.ai/
AI_PROVIDER=grok      # Optional; auto-detected if XAI_API_KEY is set
GROK_MODEL=grok-4-1-fast-reasoning   # Optional; must match your API key's allowed models
```

Get an API key at [xAI Console](https://console.x.ai/). Ensure your key has permission for the model you use (default: `grok-4-1-fast-reasoning` or `grok-4-fast-reasoning`).

**Option B: Google Gemini**

```bash
GOOGLE_GENERATIVE_AI_API_KEY=...  # From https://aistudio.google.com/app/apikey
AI_PROVIDER=google                 # Optional; auto-detected if key is set
```

Get a free key at [Google AI Studio](https://aistudio.google.com/app/apikey). Gemini 2.0 Flash has a free tier (quota limits apply).

**Provider selection**

- `AI_PROVIDER=grok` — use Grok (requires `XAI_API_KEY`)
- `AI_PROVIDER=google` — use Gemini (requires `GOOGLE_GENERATIVE_AI_API_KEY`)
- `AI_PROVIDER=auto` or unset — use whichever API key is present (xAI preferred if both are set)

**Note:** Cursor does not expose a public chat completions API for apps. Its APIs are for team management, analytics, and Cloud Agents (workflow automation), not general chat.

## Local Development

**Important:** Next.js loads env from `frontend/library/.env.local` (the app directory), not from the repo root. Put your AI keys there.

1. Create or edit `frontend/library/.env.local` with one of:
   ```
   XAI_API_KEY=xai-your_key_here
   ```
   or
   ```
   GOOGLE_GENERATIVE_AI_API_KEY=your_key_here
   ```

2. Run `npm run dev` from the project root. The chat API is at `/api/chat`.

## Librarian Contract (On-Chain Identity)

The Librarian Cadence contract is in `contracts/Librarian.cdc`. To deploy:

1. Create a Flow account for the Librarian (the AI's account).
2. Deploy the contract to that account.
3. Run the `setup_identity` transaction to create the LibrarianIdentity resource.
4. Update the placeholder address `0x0000000000000001` in scripts and transactions with the Librarian account address.

See the plan for Phase 2–4 (tools: set_my_name, record_to_blockchain, read_my_memories).
