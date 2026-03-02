'use client'

import { FlowProvider } from '@onflow/react-sdk'

const appUrl = typeof window !== 'undefined'
  ? window.location.origin
  : 'https://alexandrialib.online'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FlowProvider
      config={{
        accessNodeUrl: 'https://rest-mainnet.onflow.org',
        flowNetwork: 'mainnet',
        appDetailTitle: 'Alexandria Library',
        appDetailUrl: appUrl,
        appDetailIcon: `${appUrl}/owl.jpeg`,
        appDetailDescription: "Preserving humanity's knowledge on the Flow blockchain",
        discoveryWallet: 'https://fcl-discovery.onflow.org/authn',
        discoveryAuthnEndpoint: 'https://fcl-discovery.onflow.org/api/authn',
        walletconnectProjectId: 'cb5fcfa20a2aab5a35103fcae74109e4',
      }}
    >
      {children}
    </FlowProvider>
  )
}
