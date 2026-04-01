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

## Flow Wallet API (On-Chain Journal)

The Librarian agent can record journal entries on-chain via the `recordJournalEntry` tool. This requires a Flow Wallet API (e.g. [flow-hydraulics/flow-wallet-api](https://github.com/flow-hydraulics/flow-wallet-api)) that holds the Librarian account key and signs transactions.

Add to `frontend/library/.env.local`:

```bash
BLOCKCHAIN_API_URL=http://localhost:8080   # or your Flow Wallet API URL
LIBRARIAN_ADDRESS=0x6d96bf7d95a8b595       # Flow address of the Librarian account (optional; defaults to mainnet)
```

The Flow Wallet API must have the Librarian account registered with the key from `librarian.pkey`.

## Testing the Librarian Flow Service

### 1. Start the app

```bash
npm run dev
```

This runs the Next.js app. The chat API is at `/api/chat`.

### 2. Trigger the recordJournalEntry tool via chat

Open the Librarian chat and send prompts that explicitly ask to save. Examples that work best:

- **"Save this to your journal: User asked about Ecce Homo."**
- **"Record this: The Alexandria Library preserves knowledge on Flow blockchain."**
- **"Remember this for later: [your content here]"**

The agent is instructed to use the tool when you say "save", "record", or "remember". If the tool runs, you will see `[Chat] recordJournalEntry tool called:` in the terminal.

### 3. Verify in the terminal

When a chat request arrives, you should see `[Chat] Request received, messages: N`. When the tool runs:

- `[Chat] recordJournalEntry tool called:` — tool was invoked by the model
- `[Chat] recordJournalEntry success:` — transaction submitted
- `[Chat] recordJournalEntry failed:` — Flow Wallet API or other error

If you see the request log but never see `recordJournalEntry tool called`, the model is not choosing to use the tool. Try:
- A more explicit prompt: "Save this to your journal: [content]"
- Switching to Gemini: set `AI_PROVIDER=google` in .env.local (Gemini has strong tool support)

### 4. Verify on-chain

Use the `get_librarian_context` script to read name, mission statement, and journal entries in one call:

```bash
flow scripts execute scripts/get_librarian_context.cdc \
  --network mainnet \
  --args-json '[{"type": "Int", "value": "5"}]'
```

The Flow CLI resolves the Librarian contract from `flow.json` deployments (mainnet-Librarian at 0x6d96bf7d95a8b595).

### 5. Test the service directly (optional)

Create a small script to call the service without the chat:

```ts
// test-librarian-service.ts (run with ts-node or in a Next.js API route)
import librarianFlowService from './services/Flow/librarian.service'

const result = await librarianFlowService.recordEntry({
  entryType: 'note',
  content: 'Test entry from direct service call',
  metadata: { source: 'manual-test' },
})
console.log(result) // { transactionId, status } or { error }
```

### 6. Cadence contract tests (emulator)

The Go tests in `librarian_flow_test.go` exercise the Librarian contract against the Flow emulator:

```bash
go test -v -run TestLibrarianFlow
```

Requires the Flow emulator and Overflow setup. These tests do not use the Flow Wallet API.
