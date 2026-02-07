import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useFlowCurrentUser, useFlowMutate, useFlowQuery } from '@onflow/react-sdk'
import { MoonPayBuyWidget } from '@moonpay/moonpay-react'
import { logger } from '@/utils/logger'

const TARGET_FLOW = 135000

const LIBRARY_ADDRESS = '0xfed1adffd14ea9d0'

export default function Donation() {
  const { user, authenticate, unauthenticate } = useFlowCurrentUser()
  const [amount, setAmount] = useState('1.0')
  const [error, setError] = useState<string | null>(null)
  const [moonPayVisible, setMoonPayVisible] = useState(false)
  const [moonPayUsdAmount, setMoonPayUsdAmount] = useState('')

  // Fetch raised balance (library node account)
  const {
    data: raised,
    isLoading: loadingBalance,
    error: queryError,
    refetch: refetchBalance,
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
      refetchInterval: 10000,
      retry: 3,
      retryDelay: 1000,
    },
  })

  useEffect(() => {
    if (queryError) {
      logger.error('Support', 'Failed to fetch balance', queryError)
    }
  }, [queryError])

  // Handle MoonPay redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const moonpayStatus = params.get('moonpay')
    if (moonpayStatus === 'success') {
      logger.log('MoonPay', 'Transaction completed via redirect')
      // Clean up URL
      window.history.replaceState({}, '', '/contribute')
      // Refetch balance
      setTimeout(() => refetchBalance(), 3000)
    }
  }, [refetchBalance])

  // Fetch contributors leaderboard (on-chain)
  const {
    data: contributorsData,
    isLoading: loadingContributors,
    error: contributorsError,
  } = useFlowQuery({
    cadence: `
      import Donations_Alexandria from 0xfed1adffd14ea9d0

      access(all) fun main(): {Address: UFix64} {
        return Donations_Alexandria.getDonations()
      }
    `,
    args: () => [],
    query: {
      refetchInterval: 30000,
      retry: 2,
    },
  })

  const topContributors = useMemo(() => {
    if (!contributorsData || typeof contributorsData !== 'object') return []
    const arr = Object.entries(contributorsData as Record<string, string>).map(([address, amt]) => ({
      address,
      amount: Number(amt),
    }))
    return arr.sort((a, b) => b.amount - a.amount).slice(0, 5)
  }, [contributorsData])

  const { mutate: contribute, isPending, isSuccess, isError } = useFlowMutate({
    mutation: {
      onSuccess: (txId: string) => {
        logger.log('Support', 'Contribution successful', { txId })
        setTimeout(() => refetchBalance(), 3000)
      },
      onError: (txError: Error) => {
        logger.error('Support', 'Contribution failed', txError)
        const msg = txError.message || String(txError)
        if (msg.includes('timed out') || msg.includes('timeout')) {
          setError('Connection to wallet timed out. Please ensure your wallet is open and try again.')
        } else if (msg.includes('rejected') || msg.includes('declined')) {
          setError('Transaction was rejected. Please try again and approve the transaction in your wallet.')
        } else if (msg.includes('balance') || msg.includes('insufficient')) {
          setError('Insufficient FLOW balance. Please ensure you have enough FLOW to complete this.')
        } else if (msg.includes('wallet') || msg.includes('initialized')) {
          setError('Wallet needs to be properly initialized. Please make sure your wallet has been properly set up.')
        } else {
          setError(msg || 'Contribution failed. Please try again.')
        }
      },
    },
  })

  const handleConnect = async () => {
    logger.log('Support', 'Showing wallet connection options')
    try {
      await authenticate()
      logger.log('Support', 'User authenticated successfully')
    } catch (e) {
      logger.error('Support', 'Authentication failed', e)
      setError(e instanceof Error ? e.message : 'Failed to connect wallet')
    }
  }

  const handleContribute = async () => {
    if (!user?.addr) {
      await handleConnect()
      return
    }
    const numeric = Number(amount)
    if (!Number.isFinite(numeric) || numeric <= 0) {
      setError('Please enter a valid positive amount.')
      return
    }
    const ufix = numeric.toFixed(8)
    logger.log('Support', 'Starting contribution', { amount: ufix, user: user.addr })
    setError(null)
    contribute({
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
      // Flow SDK args builder; SDK does not export arg/t types
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      args: (arg: any, t: any) => [arg(ufix, t.UFix64)],
      limit: 9999,
    })
  }

  const raisedAmount = raised ? Number(raised) : 0
  const status = isPending ? 'pending' : isSuccess ? 'success' : isError ? 'error' : 'idle'

  // MoonPay URL signing handler
  const handleUrlSignatureRequested = async (url: string): Promise<string> => {
    const apiUrl = '/api/moonpay/sign-url'
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e6280a01-bea5-4da5-9293-389b04d29926',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Donation.tsx:179',message:'Requesting URL signature',data:{apiUrl,currentOrigin:window.location.origin,urlLength:url.length},timestamp:Date.now(),runId:'production-debug',hypothesisId:'A'})}).catch(()=>{});
    // #endregion agent log
    logger.log('MoonPay', 'Requesting URL signature', { apiUrl, currentOrigin: window.location.origin })
    
    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e6280a01-bea5-4da5-9293-389b04d29926',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Donation.tsx:184',message:'About to make fetch request',data:{method:'POST',apiUrl,hasUrl:!!url},timestamp:Date.now(),runId:'production-debug',hypothesisId:'B'})}).catch(()=>{});
      // #endregion agent log
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e6280a01-bea5-4da5-9293-389b04d29926',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Donation.tsx:192',message:'Fetch response received',data:{status:response.status,ok:response.ok,statusText:response.statusText,headers:Object.fromEntries(response.headers.entries())},timestamp:Date.now(),runId:'production-debug',hypothesisId:'C'})}).catch(()=>{});
      // #endregion agent log
      logger.log('MoonPay', 'Sign URL response', { 
        status: response.status, 
        ok: response.ok,
        statusText: response.statusText 
      })

      if (!response.ok) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e6280a01-bea5-4da5-9293-389b04d29926',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Donation.tsx:198',message:'Response not OK',data:{status:response.status,statusText:response.statusText},timestamp:Date.now(),runId:'production-debug',hypothesisId:'D'})}).catch(()=>{});
        // #endregion agent log
        if (response.status === 404) {
          const errorMsg = `API endpoint not found at ${apiUrl}. Make sure you're accessing the site through "vercel dev" (port 3000), not "npm run dev" (port 5173). Current origin: ${window.location.origin}`
          logger.error('MoonPay', errorMsg, { 
            status: response.status,
            currentOrigin: window.location.origin,
            expectedPort: 3000
          })
          throw new Error(errorMsg)
        }
        const errorText = await response.text()
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e6280a01-bea5-4da5-9293-389b04d29926',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Donation.tsx:208',message:'Error response text received',data:{status:response.status,errorText,apiUrl,currentOrigin:window.location.origin},timestamp:Date.now(),runId:'production-debug',hypothesisId:'E'})}).catch(()=>{});
        // #endregion agent log
        logger.error('MoonPay', 'Failed to sign URL', { 
          status: response.status, 
          error: errorText,
          apiUrl,
          currentOrigin: window.location.origin
        })
        throw new Error(`Failed to sign URL: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e6280a01-bea5-4da5-9293-389b04d29926',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Donation.tsx:218',message:'Success - signature received',data:{hasSignature:!!data.signature},timestamp:Date.now(),runId:'production-debug',hypothesisId:'F'})}).catch(()=>{});
      // #endregion agent log
      logger.log('MoonPay', 'URL signature received successfully')
      return data.signature
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e6280a01-bea5-4da5-9293-389b04d29926',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Donation.tsx:221',message:'Exception caught',data:{errorMessage:error instanceof Error ? error.message : String(error),errorName:error instanceof Error ? error.name : undefined,apiUrl,currentOrigin:window.location.origin},timestamp:Date.now(),runId:'production-debug',hypothesisId:'G'})}).catch(()=>{});
      // #endregion agent log
      logger.error('MoonPay', 'Failed to sign URL', { 
        error,
        apiUrl,
        currentOrigin: window.location.origin,
        errorMessage: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  // Handle MoonPay transaction completion
  const handleMoonPayTransactionCompleted = async (props: {
    id: string
    status: 'completed' | 'failed' | 'pending' | 'waitingAuthorization' | 'waitingPayment'
    walletAddress: string
    baseCurrencyAmount: number
    quoteCurrencyAmount: number
  }): Promise<void> => {
    logger.log('MoonPay', 'Transaction completed', props)
    if (props.status === 'completed') {
      setMoonPayVisible(false)
      // Refetch balance after a short delay to allow blockchain to update
      setTimeout(() => refetchBalance(), 5000)
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
              Humanity&apos;s memory shouldn&apos;t depend on platforms that can disappear.
            </p>
            <div className="space-y-2 text-[11px] sm:text-xs md:text-sm text-white/60 leading-relaxed max-w-4xl mx-auto md:mx-0">
              <p>
                This node keeps banned books permanently online. If the node fails, the library becomes just another website — one that can be taken down.
              </p>
              <p>
                We need <span className="font-semibold text-emerald-400">135,000 FLOW</span> to run a Flow Verification Node: infrastructure that no one can turn off. Every FLOW you contribute is censorship resistance.
              </p>
              <p>
                Contributors get a soulbound NFT and become founding members of the Alexandria DAO — you get to decide what gets preserved.
              </p>
              <p>
                Every contribution keeps ideas safe from takedowns and political cycles.
              </p>
              <p>
                Someone decades from now will still find the book that changed you.
              </p>
            </div>

            {/* 135k goal + Founder payback section */}
            <div className="p-4 rounded-lg border border-cyan-400/30 bg-cyan-500/5 backdrop-blur-sm space-y-2">
              <h3 className="text-sm font-semibold text-cyan-400">The 135,000 FLOW goal</h3>
              <p className="text-[11px] sm:text-xs text-white/70 leading-relaxed">
                Once we reach 135,000 FLOW, we stake a Verification Node. The rewards from that node will be used to <span className="font-semibold text-cyan-300">pay back early contributors</span>. Everyone who contributes before the node goes live earns the <span className="font-semibold text-cyan-300">&quot;Founder&quot;</span> title and is first in line to receive a share of node rewards — our way of saying thank you for keeping the library alive before it could stand on its own.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <p className="text-[11px] sm:text-xs text-white/60 font-mono">
                {loadingBalance ? (
                  'Loading progress...'
                ) : queryError ? (
                  <span className="text-amber-400">
                    Unable to fetch balance. Check{' '}
                    <a
                      href="https://www.flowscan.io/account/0xfed1adffd14ea9d0"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-amber-300"
                    >
                      Flowscan
                    </a>{' '}
                    for current balance.
                  </span>
                ) : (
                  <>
                    Currently raised:{' '}
                    <span className="text-emerald-400">
                      {raisedAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} FLOW
                    </span>{' '}
                    of a <span className="text-emerald-400">{TARGET_FLOW.toLocaleString()} FLOW</span> target (
                    {Math.min(100, (raisedAmount / TARGET_FLOW) * 100).toFixed(2)}%)
                  </>
                )}
              </p>
              <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 transition-all duration-500"
                  style={{ width: `${queryError ? 0 : Math.min(100, (raisedAmount / TARGET_FLOW) * 100)}%` }}
                />
              </div>

              {!loadingContributors && !contributorsError && topContributors.length > 0 && (
                <div className="pt-4">
                  <h3 className="text-xs md:text-sm lg:text-base font-semibold text-emerald-400 mb-3 text-center font-mono">
                    🏆 Top Contributors
                  </h3>
                  <div className="space-y-1.5">
                    {topContributors.map((c, i) => (
                      <div
                        key={c.address}
                        className="flex items-center justify-between px-3 py-2 rounded-md bg-white/5 border border-white/10 hover:border-emerald-400/30 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] md:text-xs lg:text-sm font-bold text-emerald-400 w-5">
                            #{i + 1}
                          </span>
                          <a
                            href={`https://www.flowscan.io/account/${c.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] sm:text-xs md:text-sm font-mono text-white/70 hover:text-emerald-300 transition-colors"
                            title={c.address}
                          >
                            {c.address.slice(0, 6)}...{c.address.slice(-4)}
                          </a>
                        </div>
                        <span className="text-[10px] sm:text-xs md:text-sm font-semibold text-emerald-400 font-mono">
                          {c.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} FLOW
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {loadingContributors && (
                <div className="pt-4 text-center">
                  <p className="text-[10px] md:text-xs lg:text-sm text-white/50 font-mono">
                    Loading contributors...
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* Donation Options Tabs */}
            <div className="flex gap-2 border-b border-white/10">
              <button
                onClick={() => setMoonPayVisible(false)}
                className={`px-4 py-2 text-xs font-mono transition-colors ${
                  !moonPayVisible
                    ? 'text-emerald-400 border-b-2 border-emerald-400'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                Donate with FLOW
              </button>
              <button
                onClick={() => setMoonPayVisible(true)}
                className={`px-4 py-2 text-xs font-mono transition-colors ${
                  moonPayVisible
                    ? 'text-emerald-400 border-b-2 border-emerald-400'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                Buy FLOW with Card
              </button>
            </div>

            {/* Wallet Donation Flow */}
            {!moonPayVisible && (
              <div className="space-y-4">
                <label className="block text-xs font-mono text-white/60">
                  Amount (FLOW)
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
                  onClick={handleContribute}
                  disabled={status === 'pending'}
                  className="relative w-full py-3 rounded-md text-lg font-semibold tracking-wide
                             bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400
                             text-black shadow-lg shadow-emerald-500/30
                             hover:from-emerald-300 hover:via-cyan-300 hover:to-purple-300
                             disabled:opacity-60 disabled:cursor-not-allowed
                             transition-all duration-200 animate-pulse"
                >
                  {status === 'pending' ? 'Processing…' : 'Contribute'}
                </button>
                {status === 'success' && (
                  <p className="text-sm text-emerald-400 font-mono">Thank you. Your contribution has been recorded on Flow.</p>
                )}
                {status === 'error' && error && (
                  <p className="text-sm text-red-400 font-mono break-words">Error: {error}</p>
                )}
              </div>
            )}

            {/* MoonPay Card Purchase Flow */}
            {moonPayVisible && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-emerald-400/30 bg-emerald-500/5 backdrop-blur-sm">
                  <p className="text-xs text-white/70 leading-relaxed mb-3">
                    Purchase FLOW tokens directly with a credit or debit card. Your FLOW will be sent automatically to the library address.
                  </p>
                  <label className="block text-xs font-mono text-white/60 mb-2">
                    Amount (USD) - Optional
                    <input
                      type="number"
                      min="20"
                      step="1"
                      value={moonPayUsdAmount}
                      onChange={(e) => setMoonPayUsdAmount(e.target.value)}
                      className="mt-2 w-full rounded-md border border-white/15 bg-black/60 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                      placeholder="Enter USD amount (min $20)"
                    />
                  </label>
                  <p className="text-[10px] text-white/50 font-mono mt-2">
                    Minimum purchase: $20. FLOW tokens will be sent to: <span className="text-emerald-300">{LIBRARY_ADDRESS}</span>
                  </p>
                  <div className="flex gap-3 text-[10px] text-white/50 font-mono mt-3">
                    <Link
                      to="/privacy-policy"
                      className="hover:text-emerald-300 transition-colors underline"
                    >
                      Privacy Policy
                    </Link>
                    <Link
                      to="/terms-of-service"
                      className="hover:text-emerald-300 transition-colors underline"
                    >
                      Terms of Service
                    </Link>
                  </div>
                </div>
                <MoonPayBuyWidget
                  variant="overlay"
                  visible={moonPayVisible}
                  currencyCode="flow"
                  walletAddress={LIBRARY_ADDRESS}
                  baseCurrencyCode="usd"
                  baseCurrencyAmount={moonPayUsdAmount || undefined}
                  theme="dark"
                  onUrlSignatureRequested={handleUrlSignatureRequested}
                  onTransactionCompleted={handleMoonPayTransactionCompleted}
                  redirectURL={`${window.location.origin}/contribute?moonpay=success`}
                  style={{
                    margin: 0,
                    border: 'none',
                    width: '100%',
                    minHeight: '500px',
                  }}
                />
              </div>
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
                  Early contributors who contribute toward the 135k FLOW goal receive a{' '}
                  <span className="font-semibold text-emerald-300">Zenodotus NFT</span> — named after the first
                  superintendent of the Library of Alexandria and the first critical editor of Homer. This exclusive soulbound NFT will{' '}
                  <span className="font-semibold">only be minted to those who contributed to launch the node</span>, and it&apos;s a{' '}
                  <span className="font-semibold text-purple-300">dynamic NFT that evolves</span> with your ongoing
                  involvement in the Library, reflecting your contributions and stewardship over time.
                </p>
                <div className="mt-3 pt-3 border-t border-emerald-400/20 space-y-2">
                  <p className="text-[10px] sm:text-xs text-white/60 font-mono">
                    <span className="text-emerald-300 font-semibold">Tiers:</span> Your cumulative contribution amount determines your NFT tier and frame color:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[9px] sm:text-[10px] font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-gray-400" />
                      <span className="text-white/70">Scribe:</span>
                      <span className="text-emerald-300">1 FLOW</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      <span className="text-white/70">Archivist:</span>
                      <span className="text-emerald-300">100 FLOW</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-400" />
                      <span className="text-white/70">Steward:</span>
                      <span className="text-emerald-300">1,000 FLOW</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-400 to-purple-400" />
                      <span className="text-white/70">Keeper:</span>
                      <span className="text-emerald-300">10,000 FLOW</span>
                    </div>
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-white/50 font-mono italic">
                    Contributions accumulate across multiple transactions — contribute more to reach higher tiers.
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
              FLOW is sent to the on-chain library account on Flow mainnet.
            </p>
            <p className="text-[11px] sm:text-xs text-white/50 font-mono">
              When the Verification Node is running, we&apos;ll take an on-chain snapshot and mint
              one NFT per contributor that reflects their cumulative contribution. Those NFTs will be used inside the DAO
              to recognize and coordinate the stewards who contributed to bring the node online.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
