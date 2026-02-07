import './App.css'
import '@/components/ui/title-animation.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { FlowProvider } from '@onflow/react-sdk'
import { MoonPayProvider } from '@moonpay/moonpay-react'
import Home from '@/components/Home'
import Mission from '@/components/Mission'
import Donation from '@/components/Donation'
import Roadmap from '@/components/Roadmap'

const appUrl = typeof window !== 'undefined' 
  ? window.location.origin 
  : 'https://alexandrialib.online'

const moonPayApiKey = import.meta.env.VITE_MOONPAY_API_KEY || ''

function App() {
  return (
    <FlowProvider
      config={{
        accessNodeUrl: 'https://rest-mainnet.onflow.org',
        flowNetwork: 'mainnet',
        appDetailTitle: 'Alexandria Library',
        appDetailUrl: appUrl,
        appDetailIcon: `${appUrl}/owl.jpeg`,
        appDetailDescription: 'Preserving humanity\'s knowledge on the Flow blockchain',
        discoveryWallet: 'https://fcl-discovery.onflow.org/authn',
        discoveryAuthnEndpoint: 'https://fcl-discovery.onflow.org/api/authn',
        walletconnectProjectId: 'cb5fcfa20a2aab5a35103fcae74109e4',
      }}
    >
      <MoonPayProvider apiKey={moonPayApiKey}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/mission" element={<Mission />} />
            <Route path="/roadmap" element={<Roadmap />} />
            <Route path="/contribute" element={<Donation />} />
          </Routes>
        </BrowserRouter>
      </MoonPayProvider>
    </FlowProvider>
  )
}

export default App
