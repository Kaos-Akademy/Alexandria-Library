import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as fcl from '@onflow/fcl'
import { sendDonation, fetchDonationBalance } from '@/flow/donations'

type FclUser = {
  addr?: string | null
}

export default function Donation() {
  const [currentUser, setCurrentUser] = useState<FclUser | null>(null)
  const [amount, setAmount] = useState('1.0')
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [raised, setRaised] = useState<number>(0)
  const [loadingBalance, setLoadingBalance] = useState(true)

  const target = 135000 // Target amount in FLOW (or FLOW-equivalent)

  useEffect(() => {
    const unsubscribe = fcl.currentUser().subscribe((user) => {
      setCurrentUser(user as FclUser)
    })
    return () => {
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        setLoadingBalance(true)
        const balance = await fetchDonationBalance()
        if (!cancelled) {
          setRaised(balance)
          setLoadingBalance(false)
        }
      } catch (e) {
        console.error('Failed to fetch donation balance:', e)
        if (!cancelled) {
          setRaised(0)
          setLoadingBalance(false)
        }
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [])

  const handleConnect = async () => {
    try {
      await fcl.authenticate()
    } catch (e) {
      console.error(e)
    }
  }

  const handleDonate = async () => {
    if (!currentUser?.addr) {
      await handleConnect()
      return
    }

    // Basic validation: must be a positive number
    const numeric = Number(amount)
    if (!Number.isFinite(numeric) || numeric <= 0) {
      setError('Please enter a valid positive amount.')
      return
    }

    // Convert to UFix64 with 2 decimal places
    const ufix = numeric.toFixed(2)

    setStatus('pending')
    setError(null)
    try {
      await sendDonation(ufix)
      setStatus('success')
      // Refresh balance after successful donation
      setTimeout(async () => {
        try {
          const balance = await fetchDonationBalance()
          setRaised(balance)
        } catch (e) {
          console.error('Failed to refresh balance:', e)
        }
      }, 2000)
    } catch (e) {
      console.error(e)
      setStatus('error')
      setError(e instanceof Error ? e.message : 'Donation failed.')
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="text-sm font-mono text-white/70 hover:text-white transition-colors">
            ← Back to Library
          </Link>
          <button
            onClick={currentUser?.addr ? () => fcl.unauthenticate() : handleConnect}
            className="text-xs px-3 py-1 rounded-full border border-emerald-400/60 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"
          >
            {currentUser?.addr ? `Connected: ${currentUser.addr.slice(0, 6)}…` : 'Connect Wallet'}
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="max-w-xl w-full text-center space-y-8">
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              Support the{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Alexandria Library
              </span>
            </h1>
            <p className="text-sm sm:text-base text-white/70">
              Your donation helps us reach our goal of running an independent Flow Verification Node so that
              humanity&apos;s knowledge can stay open, uncensorable, and preserved on-chain forever.
            </p>
            <p className="text-[11px] sm:text-xs text-white/60 leading-relaxed max-w-xl mx-auto">
              We are raising <span className="font-semibold text-emerald-400">$135,000</span> in FLOW to bootstrap the
              Alexandria Verification Node. Once the node is live, all donors will receive a soulbound-style NFT that
              represents their contribution. This NFT is your membership pass to the Alexandria DAO and encodes your
              donation amount on-chain, so your stake in the Library is transparently recorded and can be used for
              governance, reputation and future contributor rewards.
            </p>
            <div className="space-y-2 pt-2">
              <p className="text-[11px] sm:text-xs text-white/60 font-mono">
                {loadingBalance ? (
                  'Loading progress...'
                ) : (
                  <>
                    Currently raised:{' '}
                    <span className="text-emerald-400">
                      {raised.toLocaleString(undefined, { maximumFractionDigits: 2 })} FLOW
                    </span>{' '}
                    of a <span className="text-emerald-400">{target.toLocaleString()} FLOW</span> target (
                    {Math.min(100, (raised / target) * 100).toFixed(2)}%)
                  </>
                )}
              </p>
              <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 transition-all duration-500"
                  style={{ width: `${Math.min(100, (raised / target) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-xs font-mono text-white/60">
              Donation amount (FLOW)
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-2 w-full rounded-md border border-white/15 bg-black/60 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                placeholder="1.00"
              />
            </label>

            <button
              onClick={handleDonate}
              disabled={status === 'pending'}
              className="relative w-full py-3 rounded-md text-lg font-semibold tracking-wide
                         bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400
                         text-black shadow-lg shadow-emerald-500/30
                         hover:from-emerald-300 hover:via-cyan-300 hover:to-purple-300
                         disabled:opacity-60 disabled:cursor-not-allowed
                         transition-all duration-200
                         animate-pulse"
            >
              {status === 'pending' ? 'Processing donation…' : 'Donate'}
            </button>

            {status === 'success' && (
              <p className="text-sm text-emerald-400 font-mono">Thank you. Your donation has been recorded on Flow.</p>
            )}
            {status === 'error' && error && (
              <p className="text-sm text-red-400 font-mono break-words">Error: {error}</p>
            )}
          </div>

          <div className="p-4 rounded-lg border border-emerald-400/30 bg-emerald-500/5 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-emerald-400/20 bg-black/40">
                <img 
                  src="/image.png" 
                  alt="Zenodotus NFT" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 text-left space-y-1">
                <h3 className="text-sm font-semibold text-emerald-400">
                  Exclusive: Zenodotus NFT
                </h3>
                <p className="text-[10px] sm:text-xs text-white/70 leading-relaxed mb-2">
                  The first donors who help us reach the 135k FLOW goal will receive a{' '}
                  <span className="font-semibold text-emerald-300">Zenodotus NFT</span> — named after the first 
                  superintendent of the Library of Alexandria and the first critical editor. This exclusive soulbound NFT will{' '}
                  <span className="font-semibold">only be minted to those who helped launch the node</span>, and it&apos;s a{' '}
                  <span className="font-semibold text-purple-300">dynamic NFT that evolves</span> with your ongoing 
                  involvement in the Library, reflecting your contributions and stewardship over time.
                </p>
                <div className="mt-3 pt-3 border-t border-emerald-400/20 space-y-2">
                  <p className="text-[10px] sm:text-xs text-white/60 font-mono">
                    <span className="text-emerald-300 font-semibold">Donation Tiers:</span> Your cumulative donation amount determines your NFT tier and frame color:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[9px] sm:text-[10px] font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                      <span className="text-white/70">Scribe:</span>
                      <span className="text-emerald-300">10 FLOW</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                      <span className="text-white/70">Archivist:</span>
                      <span className="text-emerald-300">100 FLOW</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                      <span className="text-white/70">Steward:</span>
                      <span className="text-emerald-300">1,000 FLOW</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-400 to-purple-400"></span>
                      <span className="text-white/70">Keeper:</span>
                      <span className="text-emerald-300">10,000 FLOW</span>
                    </div>
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-white/50 font-mono italic">
                    Donations accumulate across multiple transactions — make multiple donations to reach higher tiers!
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[11px] sm:text-xs text-white/50 font-mono">
              Donations are sent in FLOW to the on-chain `Donations_Alexandria` contract on Flow mainnet.
            </p>
            <p className="text-[11px] sm:text-xs text-white/50 font-mono">
              When the Verification Node is running, we&apos;ll take an on-chain snapshot of all donations and mint
              one NFT per donor that reflects their cumulative contribution. Those NFTs will be used inside the DAO
              to recognize and coordinate the stewards who helped bring the node online.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

