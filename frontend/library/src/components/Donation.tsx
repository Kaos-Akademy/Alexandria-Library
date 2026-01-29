import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useFlowCurrentUser, useFlowMutate, useFlowQuery } from '@onflow/react-sdk'
import { logger } from '@/utils/logger'

export default function Donation() {
  const { user, authenticate, unauthenticate } = useFlowCurrentUser()
  const [amount, setAmount] = useState('1.0')
  const [error, setError] = useState<string | null>(null)

  const target = 135000 // Target amount in FLOW

  // Fetch donation balance
  const { 
    data: raised, 
    isLoading: loadingBalance, 
    error: queryError,
    refetch: refetchBalance 
  } = useFlowQuery({
    cadence: `
      import FlowToken from 0x1654653399040a61

      access(all) fun main(address: Address): UFix64 {
        let account = getAccount(address)
        let vaultRef = account.capabilities
          .get<&FlowToken.Vault>(/public/flowTokenBalance)
          .borrow()
          ?? panic("Could not borrow Balance reference")
        return vaultRef.balance
      }
    `,
    args: (arg, t) => [arg('0xfed1adffd14ea9d0', t.Address)],
    query: {
      refetchInterval: 10000, // Auto-refresh every 10 seconds
      retry: 3, // Retry failed queries
      retryDelay: 1000, // Wait 1 second between retries
    },
  })

  // Log query errors to console
  useEffect(() => {
    if (queryError) {
      console.error('Balance query error:', queryError)
      logger.error('Donation', 'Failed to fetch balance', queryError)
    }
  }, [queryError])

  // Fetch donations leaderboard
  const { 
    data: donationsData, 
    isLoading: loadingDonations,
    error: donationsError 
  } = useFlowQuery({
    cadence: `
      import Donations_Alexandria from 0xfed1adffd14ea9d0

      access(all) fun main(): {Address: UFix64} {
        return Donations_Alexandria.getDonations()
      }
    `,
    args: () => [],
    query: {
      refetchInterval: 30000, // Auto-refresh every 30 seconds
      retry: 2,
    },
  })

  // Process donations data to get top 5 donors
  const topDonors = useMemo(() => {
    if (!donationsData || typeof donationsData !== 'object') return []
    
    const donorsArray = Object.entries(donationsData as Record<string, string>).map(([address, amount]) => ({
      address,
      amount: Number(amount),
    }))
    
    return donorsArray
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
  }, [donationsData])

  // Donation transaction mutation
  const { mutate: donate, isPending, isSuccess, isError } = useFlowMutate({
    mutation: {
      onSuccess: (txId: string) => {
        logger.log('Donation', 'Donation successful', { txId })
        // Refresh balance after successful donation
        setTimeout(() => {
          refetchBalance()
        }, 3000)
      },
      onError: (txError: Error) => {
        logger.error('Donation', 'Donation failed', txError)
        
        // Provide user-friendly error messages
        const errorMessage = txError.message || String(txError)
        
        if (errorMessage.includes('timed out') || errorMessage.includes('timeout')) {
          setError('Connection to wallet timed out. Please ensure your wallet is open and try again.')
        } else if (errorMessage.includes('rejected') || errorMessage.includes('declined')) {
          setError('Transaction was rejected. Please try again and approve the transaction in your wallet.')
        } else if (errorMessage.includes('balance') || errorMessage.includes('insufficient')) {
          setError('Insufficient FLOW balance. Please ensure you have enough FLOW to complete the donation.')
        } else if (errorMessage.includes('wallet') || errorMessage.includes('initialized')) {
          setError('Wallet needs to be properly initialized. Please make sure your wallet has been properly set up.')
        } else {
          setError(errorMessage || 'Donation failed. Please try again.')
        }
      },
    },
  })

  const handleConnect = async () => {
    logger.log('Donation', 'Showing wallet connection options')
    try {
      await authenticate()
      logger.log('Donation', 'User authenticated successfully')
    } catch (e) {
      logger.error('Donation', 'Authentication failed', e)
      setError(e instanceof Error ? e.message : 'Failed to connect wallet')
    }
  }

  const handleDonate = async () => {
    if (!user?.addr) {
      await handleConnect()
      return
    }

    // Basic validation: must be a positive number
    const numeric = Number(amount)
    if (!Number.isFinite(numeric) || numeric <= 0) {
      setError('Please enter a valid positive amount.')
      return
    }

    // Convert to UFix64 with 8 decimal places (Flow standard)
    const ufix = numeric.toFixed(8)

    logger.log('Donation', 'Starting donation', { amount: ufix, user: user.addr })
    setError(null)
    
    // Execute the donation mutation
    donate({
      cadence: `
        import Donations_Alexandria from 0xfed1adffd14ea9d0
        import FungibleToken from 0xf233dcee88fe0abe
        import FlowToken from 0x1654653399040a61

        transaction(amount: UFix64) {
          let sentVault: @{FungibleToken.Vault}
          let donor: Address

          prepare(signer: auth(BorrowValue) &Account) {
            self.donor = signer.address

            let vaultRef = signer.storage.borrow<
              auth(FungibleToken.Withdraw) &FlowToken.Vault
            >(from: /storage/flowTokenVault)
            ?? panic("The signer does not store a FlowToken.Vault object at /storage/flowTokenVault")

            self.sentVault <- vaultRef.withdraw(amount: amount)
          }

          execute {
            Donations_Alexandria.donate(
              from: <- self.sentVault as! @FlowToken.Vault,
              donor: self.donor
            )
          }
        }
      `,
      args: (arg: any, t: any) => [arg(ufix, t.UFix64)],
      limit: 9999,
    })
  }

  const raisedAmount = raised ? Number(raised) : 0
  const status = isPending ? 'pending' : isSuccess ? 'success' : isError ? 'error' : 'idle'

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="text-sm font-mono text-white/70 hover:text-white transition-colors">
            ← Back to Library
          </Link>
          <button
            onClick={user?.loggedIn ? unauthenticate : handleConnect}
            className="text-xs px-3 py-1 rounded-full border border-emerald-400/60 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"
          >
            {user?.loggedIn ? `Connected: ${user.addr?.slice(0, 6)}…` : 'Connect Wallet'}
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 md:px-10 py-10 md:py-16">
        <div className="max-w-5xl w-full mx-auto text-center md:text-left space-y-8 md:space-y-10">
          <div className="space-y-3 md:space-y-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold">
              Support the{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Alexandria Library
              </span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-white/70 max-w-4xl mx-auto md:mx-0">
              Humanity's memory shouldn't depend on platforms that can disappear.
            </p>
            <div className="space-y-2 text-[11px] sm:text-xs md:text-sm text-white/60 leading-relaxed max-w-4xl mx-auto md:mx-0">
              <p>
                Your donation runs a Flow Verification Node — infrastructure that no one can turn off.
              </p>
              <p>
                We need <span className="font-semibold text-emerald-400">135,000 FLOW</span>. Contributors get a soulbound NFT: proof you protected humanity's memory.
              </p>
              <p>
                That NFT makes you a founding member of the Alexandria DAO. You help decide what gets preserved.
              </p>
              <p>
                Every donation keeps ideas safe from takedowns and political cycles.
              </p>
              <p>
                Someone decades from now will still find the book that changed you.
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <p className="text-[11px] sm:text-xs text-white/60 font-mono">
                {loadingBalance ? (
                  'Loading progress...'
                ) : queryError ? (
                  <span className="text-amber-400">
                    Unable to fetch balance. Please check{' '}
                    <a
                      href="https://www.flowscan.io/account/0xfed1adffd14ea9d0"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-amber-300"
                    >
                      Flowscan
                    </a>{' '}
                    for current donations.
                  </span>
                ) : (
                  <>
                    Currently raised:{' '}
                    <span className="text-emerald-400">
                      {raisedAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} FLOW
                    </span>{' '}
                    of a <span className="text-emerald-400">{target.toLocaleString()} FLOW</span> target (
                    {Math.min(100, (raisedAmount / target) * 100).toFixed(2)}%)
                  </>
                )}
              </p>
              <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 transition-all duration-500"
                  style={{ width: `${queryError ? 0 : Math.min(100, (raisedAmount / target) * 100)}%` }}
                />
              </div>

              {/* Top Donors Leaderboard */}
              {!loadingDonations && !donationsError && topDonors.length > 0 && (
                <div className="pt-4">
                  <h3 className="text-xs md:text-sm lg:text-base font-semibold text-emerald-400 mb-3 text-center font-mono">
                    🏆 Top Contributors
                  </h3>
                  <div className="space-y-1.5">
                    {topDonors.map((donor, index) => (
                      <div
                        key={donor.address}
                        className="flex items-center justify-between px-3 py-2 rounded-md bg-white/5 border border-white/10 hover:border-emerald-400/30 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] md:text-xs lg:text-sm font-bold text-emerald-400 w-5">
                            #{index + 1}
                          </span>
                          <a
                            href={`https://www.flowscan.io/account/${donor.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] sm:text-xs md:text-sm font-mono text-white/70 hover:text-emerald-300 transition-colors"
                            title={donor.address}
                          >
                            {donor.address.slice(0, 6)}...{donor.address.slice(-4)}
                          </a>
                        </div>
                        <span className="text-[10px] sm:text-xs md:text-sm font-semibold text-emerald-400 font-mono">
                          {donor.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} FLOW
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {loadingDonations && (
                <div className="pt-4 text-center">
                  <p className="text-[10px] md:text-xs lg:text-sm text-white/50 font-mono">
                    Loading contributors...
                  </p>
                </div>
              )}
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
                      <span className="text-emerald-300">1 FLOW</span>
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

          <div className="space-y-3">
            <div className="p-3 rounded-lg border border-emerald-400/20 bg-emerald-500/5">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-white/70 font-mono">
                <span className="font-semibold text-emerald-400">Library Address:</span>
                <a
                  href="https://www.flowscan.io/account/0xfed1adffd14ea9d0"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-300 hover:text-emerald-200 transition-colors underline decoration-emerald-400/50 hover:decoration-emerald-300 font-semibold"
                  title="View on Flowscan"
                >
                  0xfed1adffd14ea9d0 →
                </a>
              </div>
            </div>
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

