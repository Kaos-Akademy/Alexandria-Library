# Eternity Project - FCL Implementation Analysis

## Overview
This document analyzes how the [Eternity project](https://github.com/Kaos-Akademy/Eternity) uses `@onflow/fcl` for Flow blockchain integration.

## Key Findings

### 1. **FCL Configuration** (`frontend/src/config.ts`)

**Location**: `frontend/src/config.ts` (imported in `main.tsx`)

**Key Configuration:**
```typescript
fcl.config({
  // Network
  "accessNode.api": "https://rest-mainnet.onflow.org",
  "flow.network": "mainnet",
  "env": "mainnet",
  
  // App Details
  "app.detail.title": "Eternity",
  "app.detail.icon": "https://eternity.gg/logo.png",
  "app.detail.url": "https://floweternity.xyz",
  
  // Discovery Service
  "discovery.wallet": "https://fcl-discovery.onflow.org/authn",
  "discovery.authn.endpoint": "https://fcl-discovery.onflow.org/api/authn",
  "discovery.authn.include": ['0xead892083b3e2c6c', '0xe5cd26afebe62781'],
  
  // Wallet Methods
  "discovery.wallet.method.default": "HTTP/POST",
  "discovery.wallet.method.use": "HTTP/POST,IFRAME/RPC,POP/RPC,EXT/RPC,TAB/RPC",
  
  // WalletConnect
  "walletconnect.projectId": "cb5fcfa20a2aab5a35103fcae74109e4",
  "fcl.walletconnect.enabled": true,
  
  // Transaction Settings
  "fcl.limit": 9999,
  "fcl.eventPollRate": 1000,
  
  // Debug
  "debug.accounts": true,
  "logger.level": 3
});
```

**Key Differences from Alexandria Library:**
- ✅ Uses `flow.network` and `env` for explicit network configuration
- ✅ Sets `fcl.limit` to 9999 (higher gas limit)
- ✅ Sets `fcl.eventPollRate` to 1000ms (more frequent polling)
- ✅ Includes debug settings (`debug.accounts`, `logger.level`)
- ✅ Uses static production URL instead of dynamic `window.location.origin`

### 2. **WalletConnect Integration** (`frontend/src/walletConnect.ts`)

**Key Implementation:**
- Uses `@onflow/fcl-wc` package (version 6.0.1)
- Initializes WalletConnect with `init()` function
- Registers plugin with `fcl.pluginRegistry.add(FclWcServicePlugin)`
- Stores client globally for debugging: `(window as any).wcClient`
- Includes `includeBaseWC: true` to show generic WalletConnect in Discovery

**Initialization Pattern:**
```typescript
export const initWalletConnect = async () => {
  // Check if already initialized
  if ((window as any).wcClient) {
    return { /* reuse existing */ };
  }
  
  // Initialize
  const { FclWcServicePlugin, client } = await init({
    projectId: WC_PROJECT_ID,
    metadata: WC_APP_METADATA,
    includeBaseWC: true,
    wcRequestHook: (wcRequestData) => { /* handle requests */ }
  });
  
  // Register with FCL
  fcl.pluginRegistry.add(FclWcServicePlugin);
  
  // Store globally
  (window as any).wcClient = client;
  (window as any).FclWcServicePlugin = FclWcServicePlugin;
  
  return { FclWcServicePlugin, client };
};
```

**Called in:** `useFlowAuth` hook on component mount

### 3. **Authentication Hook** (`frontend/src/hooks/useFlowAuth.ts`)

**Pattern:**
```typescript
export const useFlowAuth = () => {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // Subscribe to user changes
    fcl.currentUser().subscribe(setUser);
    
    // Initialize WalletConnect
    initWalletConnect();
    
    // Debug: Attach FCL to window
    (window as any).fcl = fcl;
    
    // Transaction monitoring helper
    (window as any).logTx = (txId: string) => {
      fcl.tx(txId).subscribe((txData) => {
        console.log('Transaction Update:', txData);
      });
    };
  }, []);
  
  const handleConnectWallet = async () => {
    await fcl.authenticate();
  };
  
  const handleDisconnectWallet = () => {
    fcl.unauthenticate();
  };
  
  return { user, handleConnectWallet, handleDisconnectWallet };
};
```

**Key Features:**
- ✅ Subscribes to `fcl.currentUser()` for reactive updates
- ✅ Initializes WalletConnect on mount
- ✅ Exposes FCL globally for debugging
- ✅ Provides transaction monitoring helper

### 4. **Transaction Handling** (`frontend/src/flow.ts`)

**Key Patterns:**

#### A. **Query Pattern** (Read Operations)
```typescript
const result = await fcl.query({
  cadence: `
    import Eternity from ${CONTRACT_ADDRESS}
    access(all) fun main(): String? {
      return Eternity.getLast()
    }
  `,
});
```

#### B. **Balance Check Pattern**
```typescript
const balance = await fcl.query({
  cadence: `
    import FungibleToken from 0xf233dcee88fe0abe
    import FlowToken from 0x1654653399040a61
    
    access(all) fun main(address: Address): UFix64 {
      let account = getAccount(address)
      let vaultRef = account.capabilities.borrow<&{FungibleToken.Balance}>(
        /public/flowTokenBalance
      ) ?? panic("Could not borrow Balance reference")
      return vaultRef.balance
    }
  `,
  args: (arg, t) => [arg(user.addr, t.Address)],
});
```

#### C. **Transaction Pattern** (Write Operations)
```typescript
const txId = await fcl.mutate({
  cadence: `
    import Eternity from ${CONTRACT_ADDRESS}
    // ... transaction code
  `,
  args: (arg, t) => [
    arg(description, t.String),
    arg(image, t.String),
  ],
  limit: 9999,
});

// Monitor transaction
fcl.tx(txId).subscribe((txStatus) => {
  console.log('Transaction status:', txStatus);
});

// Wait for sealing
const txResult = await fcl.tx(txId).onceSealed();
```

**Advanced Features:**
- ✅ **Timeout Handling**: Uses `Promise.race()` with 60-second timeout
- ✅ **Transaction Monitoring**: Subscribes to transaction status updates
- ✅ **Error Handling**: Comprehensive error messages with context
- ✅ **Balance Verification**: Checks balance before transaction
- ✅ **User Verification**: Verifies user is logged in before transactions

### 5. **Error Handling Patterns**

**User-Friendly Error Messages:**
```typescript
if (errorMessage.includes("storage.borrow") || errorMessage.includes("Vault")) {
  errorMessage = "Your Flow wallet needs to be properly initialized";
  actionMessage = "Please make sure your wallet has been properly set up...";
} else if (errorMessage.includes("balance") || errorMessage.includes("insufficient")) {
  actionMessage = "You need at least 0.02 FLOW in your wallet...";
} else if (errorMessage.includes("rejected") || errorMessage.includes("declined")) {
  errorMessage = "Transaction was rejected by the wallet";
  actionMessage = "Please try again and approve the transaction...";
}
```

### 6. **Logging Strategy**

**Custom Logger** (`frontend/src/utils/logger.ts`):
```typescript
export const logger = {
  log: (context: string, message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${context}] ${message}`, data);
  },
  error: (context: string, message: string, error?: any) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [${context}] ❌ ${message}`, error);
  }
};
```

**Extensive Console Logging:**
- Uses emoji prefixes (🔄, ✅, ❌, 📡, etc.) for visual scanning
- Logs at every step of transaction flow
- Includes stack traces for errors
- Contextual logging with component/service names

## Comparison: Eternity vs Alexandria Library

| Feature | Eternity | Alexandria Library |
|---------|----------|-------------------|
| **FCL Version** | `^1.4.0` | `^1.1.0` |
| **WalletConnect** | ✅ Uses `@onflow/fcl-wc` | ✅ Built-in only |
| **Config Location** | Separate `config.ts` | In `actions.ts` |
| **App URL** | Static production URL | Dynamic `window.location.origin` |
| **Gas Limit** | `9999` (explicit) | `200` (default) |
| **Event Polling** | `1000ms` (explicit) | Default |
| **Debug Settings** | ✅ Enabled | ❌ Not set |
| **Transaction Timeout** | ✅ 60 seconds | ❌ No timeout |
| **Balance Check** | ✅ Before transactions | ❌ Not implemented |
| **Error Messages** | ✅ User-friendly | ⚠️ Basic |
| **Logging** | ✅ Extensive with logger | ⚠️ Basic console |

## Recommendations for Alexandria Library

### 1. **Update FCL Configuration**
```typescript
fcl.config({
  // Add these:
  "flow.network": "mainnet",
  "env": "mainnet",
  "fcl.limit": 9999,
  "fcl.eventPollRate": 1000,
  "debug.accounts": true,
  "logger.level": 3
});
```

### 2. **Add WalletConnect Initialization**
- Consider using `@onflow/fcl-wc` if you need WalletConnect support
- Initialize in a hook similar to `useFlowAuth`
- Register plugin with `fcl.pluginRegistry.add()`

### 3. **Improve Transaction Handling**
- Add timeout handling with `Promise.race()`
- Add balance verification before transactions
- Add transaction status monitoring with `fcl.tx(txId).subscribe()`
- Improve error messages with context

### 4. **Add Logging Utility**
- Create a logger utility similar to Eternity's
- Use consistent logging format with timestamps
- Add contextual logging (component/service names)

### 5. **Separate Configuration**
- Move FCL config to separate `config.ts` file
- Import in `main.tsx` before app initialization
- Keep it clean and well-documented

## Key Takeaways

1. **Eternity uses a more mature FCL setup** with explicit configuration options
2. **WalletConnect integration** is properly initialized and registered
3. **Transaction handling** includes comprehensive error handling and monitoring
4. **Logging strategy** is well-structured with contextual information
5. **User experience** is prioritized with user-friendly error messages
6. **Debugging support** is built-in with global FCL access and transaction helpers

## Files Structure

```
frontend/src/
├── config.ts              # FCL configuration
├── walletConnect.ts       # WalletConnect initialization
├── flow.ts                # Transaction & query functions
├── hooks/
│   ├── useFlowAuth.ts     # Authentication hook
│   ├── useMintNFT.ts      # NFT minting hook
│   └── useImageUpload.ts  # Image handling hook
├── components/
│   ├── ConnectWallet.tsx  # Wallet connection UI
│   └── ImageUploader.tsx  # Upload & mint UI
└── utils/
    └── logger.ts          # Logging utility
```

## Conclusion

The Eternity project demonstrates a **production-ready FCL implementation** with:
- ✅ Proper WalletConnect integration
- ✅ Comprehensive error handling
- ✅ Transaction monitoring and timeouts
- ✅ User-friendly error messages
- ✅ Extensive logging for debugging
- ✅ Balance verification before transactions
- ✅ Clean separation of concerns

This is a good reference implementation for improving the Alexandria Library's FCL integration.
