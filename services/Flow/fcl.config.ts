import * as fcl from '@onflow/fcl'

// Determine which network to use (default to testnet)
const FLOW_NETWORK = process.env.NEXT_PUBLIC_FLOW_NETWORK || 'testnet'

// WalletConnect Project ID (obtener de https://cloud.walletconnect.com/)
const WALLET_CONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''

// Network configurations
const NETWORK_CONFIG = {
  mainnet: {
    'accessNode.api': 'https://rest-mainnet.onflow.org',
    'discovery.wallet': 'https://fcl-discovery.onflow.org/authn',
    'discovery.authn.endpoint': 'https://fcl-discovery.onflow.org/api/authn',
    // Flow Wallet (oficial) - ID: 0xf8d6e0586b0a20c7
    // Blocto - ID: 0x82ec283f88a62e65 (ya no funciona bien)
    // Dapper - ID: 0xead892083b3e2c6c
    'discovery.authn.include': [
      '0xf8d6e0586b0a20c7', // Flow Wallet (oficial) - PRIORIDAD
      // '0x82ec283f88a62e65', // Blocto - comentado porque ya no funciona
      // '0xead892083b3e2c6c', // Dapper - opcional
    ],
    'flow.network': 'mainnet',
  },
  testnet: {
    'accessNode.api': 'https://rest-testnet.onflow.org',
    'discovery.wallet': 'https://fcl-discovery.onflow.org/testnet/authn',
    'discovery.authn.endpoint': 'https://fcl-discovery.onflow.org/api/testnet/authn',
    // Flow Wallet (oficial) - ID: 0xf8d6e0586b0a20c7 (mismo para testnet)
    // Incluir Flow Wallet explícitamente para que aparezca y funcione el QR
    'discovery.authn.include': [
      '0xf8d6e0586b0a20c7', // Flow Wallet (oficial) - PRIORIDAD
    ],
    'flow.network': 'testnet',
  },
}

// Flag to ensure configuration only runs once
let isConfigured = false

// Configure FCL for Flow blockchain
// Call this before using FCL queries
export function configureFCL() {
  // Only configure on client-side
  if (typeof window === 'undefined') return

  if (isConfigured) return

  const networkConfig =
    NETWORK_CONFIG[FLOW_NETWORK as keyof typeof NETWORK_CONFIG] || NETWORK_CONFIG.testnet

  // Configuración completa de FCL
  const config = {
    ...networkConfig,
    // App metadata (se muestra en el modal de wallets)
    'app.detail.title': 'Payload Galaxy',
    'app.detail.icon': 'https://payload-galaxy.com/icon.png', // Actualizar con tu ícono real
    // WalletConnect configuration (requerido para ciertas wallets)
    'walletconnect.projectId': WALLET_CONNECT_PROJECT_ID,
  }

  fcl.config(config)

  // Suppress FCL's noisy error logs for user cancellations
  // This intercepts console.error calls from FCL and filters out expected user actions
  if (typeof window !== 'undefined') {
    const originalError = console.error
    const originalLog = console.log
    const originalInfo = console.info

    // Intercept console.error
    console.error = (...args: unknown[]) => {
      const errorMessage = args.join(' ')

      // Suppress these expected "errors" that are actually just user actions
      // or FCL initialization errors before wallet connection
      if (
        errorMessage.includes('Declined: Externally Halted') ||
        errorMessage.includes('Error on execService authn') ||
        errorMessage.includes('User rejected') ||
        errorMessage.includes('User cancelled') ||
        // Suprimir errores de postMessage que ocurren antes de conectar wallet
        errorMessage.includes('postMessage') ||
        errorMessage.includes('Cannot read properties of undefined') ||
        errorMessage.includes("reading 'postMessage'") ||
        errorMessage.includes('r is not a function') ||
        errorMessage.includes('Frame Send Error') ||
        errorMessage.includes('Frame Close Error') ||
        // Errores de WalletConnect antes de conexión
        errorMessage.includes('installHook') ||
        errorMessage.includes('onReady')
      ) {
        // Silently ignore - these are expected during FCL initialization
        // or when wallets are not yet connected
        return
      }

      // For all other errors, use the original console.error
      originalError.apply(console, args)
    }

    // Intercept console.log to suppress WalletConnect initialization logs
    console.log = (...args: unknown[]) => {
      const logMessage = args.join(' ')

      // Suppress WalletConnect initialization logs
      if (
        logMessage.includes('Core Initialization Success') ||
        logMessage.includes('SignClient Initialization Success') ||
        logMessage.includes('Relayer connected') ||
        logMessage.includes('Emitting subscription_created') ||
        logMessage.includes('session request queue is empty')
      ) {
        // Silently ignore WalletConnect initialization logs
        return
      }

      // For all other logs, use the original console.log
      originalLog.apply(console, args)
    }

    // Intercept console.info to suppress WalletConnect info logs
    console.info = (...args: unknown[]) => {
      const infoMessage = args.join(' ')

      // Suppress WalletConnect initialization logs
      if (
        infoMessage.includes('Core Initialization Success') ||
        infoMessage.includes('SignClient Initialization Success') ||
        infoMessage.includes('Relayer connected') ||
        infoMessage.includes('Emitting subscription_created') ||
        infoMessage.includes('session request queue is empty')
      ) {
        // Silently ignore WalletConnect initialization logs
        return
      }

      // For all other info logs, use the original console.info
      originalInfo.apply(console, args)
    }
  }

  // Log warning si falta el projectId (importante para producción)
  if (!WALLET_CONNECT_PROJECT_ID) {
    console.warn(
      '⚠️  WalletConnect projectId no configurado. Algunas wallets pueden no funcionar correctamente.\n' +
        'Obtén uno gratis en: https://cloud.walletconnect.com/\n' +
        'Luego agrega: NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=tu_project_id al archivo .env',
    )
  }

  isConfigured = true
}

export { fcl }
