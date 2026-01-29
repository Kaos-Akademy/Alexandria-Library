# Flow React SDK Migration Summary

This document summarizes the migration from FCL to the Flow React SDK for the Alexandria Library donation functionality.

## Changes Made

### 1. Installed Flow React SDK
```bash
npm install @onflow/react-sdk
```

### 2. App.tsx - Added FlowProvider
- Wrapped the entire app with `<FlowProvider>` from `@onflow/react-sdk`
- Configured the provider with:
  - `accessNodeUrl`: REST API endpoint for mainnet
  - `flowNetwork`: Set to 'mainnet'
  - `appDetailTitle`, `appDetailIcon`, `appDetailDescription`: App metadata for wallet display
  - `discoveryWallet` & `discoveryAuthnEndpoint`: Wallet discovery configuration  
  - `walletconnectProjectId`: WalletConnect project ID
  - `flowJson`: Imported flow.json configuration

### 3. Donation.tsx - Migrated to React SDK Hooks
Replaced FCL-based implementation with modern React SDK hooks:

- **`useFlowCurrentUser()`**: Replaced `fcl.currentUser()` for authentication
  - Provides: `user`, `authenticate()`, `unauthenticate()`
  
- **`useFlowQuery()`**: For fetching donation balance
  - Automatically refetches every 10 seconds
  - Uses TanStack Query for caching and background updates
  - Cadence script to query FlowToken balance from donation account

- **`useFlowMutate()`**: For executing donation transactions
  - Replaces `fcl.mutate()` with modern hook-based approach
  - Provides `mutate()`, `isPending`, `isSuccess`, `isError` states
  - Includes `onSuccess` and `onError` callbacks for handling transaction results

### 4. Removed Old FCL Files
- Deleted `src/flow/config.ts` (no longer needed with FlowProvider)
- Deleted `src/flow/donations.ts` (replaced with hooks in component)
- Removed FCL initialization from `main.tsx`

### 5. Updated actions.ts
- Kept FCL for backwards compatibility with existing library queries
- Added minimal FCL configuration for direct script queries
- Note: These can be migrated to `useFlowQuery` hooks later if needed

### 6. Simplified Configuration
- Removed `flow.json` import dependency (optional parameter in FlowProvider)
- Contract addresses are specified directly in Cadence code
- Cleaner deployment without build path issues

## Benefits of Flow React SDK

1. **Modern React Patterns**: Built on React Query for optimal caching and state management
2. **TypeScript-First**: Full type safety out of the box
3. **Better DX**: Hooks-based API is more intuitive than FCL's imperative style
4. **Automatic Retries**: Built-in retry logic for failed requests
5. **Background Refetching**: Keeps data fresh automatically
6. **Loading & Error States**: Simplified state management
7. **No Manual Subscriptions**: React Query handles all subscriptions internally

## Transaction Flow (Donation)

1. User clicks "Donate"
2. If not authenticated, triggers `authenticate()` via wallet discovery
3. Validates donation amount
4. Calls `donate()` mutation with:
   - Cadence transaction code (inline)
   - Transaction arguments (amount in UFix64)
   - Gas limit (9999)
5. SDK handles:
   - Transaction signing via wallet
   - Transaction submission
   - Status monitoring
   - Success/error callbacks
6. On success: Refetches balance after 3 seconds
7. On error: Displays user-friendly error message

## Network Configuration

**Mainnet:**
- Access Node: `https://rest-mainnet.onflow.org`
- Donations Contract: `0xfed1adffd14ea9d0`
- FlowToken: `0x1654653399040a61`
- FungibleToken: `0xf233dcee88fe0abe`

## Next Steps (Optional)

1. Migrate remaining library queries in `actions.ts` to use `useFlowQuery` hooks
2. Add transaction status monitoring with `useFlowTransactionStatus`
3. Implement scheduled transactions for future DAO features
4. Add NFT minting for donor rewards using `useFlowMutate`

## Documentation References

- [Flow React SDK](https://developers.flow.com/build/tools/react-sdk)
- [React SDK Hooks](https://developers.flow.com/build/tools/react-sdk/hooks)
- [FlowProvider Configuration](https://developers.flow.com/build/tools/react-sdk)
