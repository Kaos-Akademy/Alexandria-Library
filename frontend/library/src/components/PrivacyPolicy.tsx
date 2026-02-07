import { Link } from 'react-router-dom'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6 md:py-8">
        <div className="text-center mb-6 sm:mb-8">
          <Link to="/" className="text-3xl sm:text-5xl md:text-6xl lg:text-8xl font-bold alexandria-title block mb-2 sm:mb-4">
            Alexandria Library
          </Link>
          <p className="text-xs font-mono text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-purple-600">
            Knowledge belongs to everyone, forever.
          </p>
        </div>

        <div className="prose prose-sm sm:prose-base md:prose-lg max-w-none">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-4 sm:mb-5 md:mb-6 text-gray-900">
            Privacy Policy
          </h1>

          <p className="text-sm text-gray-600 mb-6">
            Last updated: February 6, 2026
          </p>

          <div className="space-y-4 sm:space-y-5 md:space-y-6 text-sm sm:text-base text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mt-6 mb-3">1. Introduction and Scope</h2>
              <p>
                This Privacy Policy describes how Alexandria Library ("we," "our," or "us") collects, uses, and protects your personal information when you use our website and services, including our donation platform and digital library services. By using Alexandria Library, you agree to the collection and use of information in accordance with this policy.
              </p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mt-6 mb-3">2. Information We Collect</h2>
              <p className="mb-3">We collect only the minimum information necessary to provide our services:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Wallet Addresses:</strong> When you connect your Flow wallet or make donations, your blockchain wallet address is used to process transactions. This information is publicly visible on the Flow blockchain.</li>
                <li><strong>Transaction Data:</strong> Information about donations and contributions made through our platform, including amounts and transaction hashes. This data is recorded on-chain and is publicly visible.</li>
                <li><strong>Payment Information:</strong> When using MoonPay to purchase FLOW tokens, payment data is processed by MoonPay according to their privacy policy. We do not receive, store, or have access to your credit card information or other sensitive payment details.</li>
                <li><strong>On-Chain Data:</strong> All transactions on the Flow blockchain are publicly visible and permanent.</li>
              </ul>
              <p className="mt-3">
                <strong>We do not collect:</strong> IP addresses, browser type, device information, usage patterns, or any other tracking data. We do not use analytics services, cookies for tracking, or any third-party tracking technologies.
              </p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mt-6 mb-3">3. How We Use Your Information</h2>
              <p className="mb-3">We use collected information only to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Process and record donations and contributions on the Flow blockchain</li>
                <li>Display contributor leaderboards and donation progress (using publicly available on-chain data)</li>
                <li>Mint and distribute Zenodotus NFTs to contributors based on contribution amounts</li>
                <li>Facilitate DAO governance participation for contributors</li>
                <li>Comply with legal obligations when required</li>
              </ul>
              <p className="mt-3">
                We do not use your information for analytics, marketing, or service improvement purposes. All data we use is either publicly available on the blockchain or necessary for the core functionality of our donation and library services.
              </p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mt-6 mb-3">4. MoonPay Payment Processing</h2>
              <p>
                When you purchase FLOW tokens using MoonPay's payment services, MoonPay processes your payment information according to their privacy policy. We receive transaction confirmations and wallet addresses associated with purchases, but we do not receive or store your credit card details or other sensitive payment information. MoonPay's privacy policy governs their handling of payment data.
              </p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mt-6 mb-3">5. Blockchain and On-Chain Data</h2>
              <p>
                Alexandria Library operates on the Flow blockchain. All transactions, including donations and NFT mints, are recorded on-chain and are publicly visible and permanent. Wallet addresses and transaction amounts are part of the public blockchain record and cannot be deleted or modified. By using our services, you acknowledge that blockchain transactions are irreversible and publicly accessible.
              </p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mt-6 mb-3">6. Data Sharing and Third Parties</h2>
              <p className="mb-3">We may share information with:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>MoonPay:</strong> Payment processing data as necessary to complete transactions. MoonPay handles all payment processing and we do not receive sensitive payment information.</li>
                <li><strong>Flow Blockchain:</strong> All transactions are publicly recorded on the Flow network. This is inherent to blockchain technology and cannot be avoided.</li>
                <li><strong>Hosting Provider:</strong> Our hosting provider (Vercel) may have access to server logs, but we do not actively collect or analyze this data.</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              </ul>
              <p className="mt-3">
                We do not use analytics services, tracking services, or any third-party data collection tools. We do not sell your personal information to third parties.
              </p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mt-6 mb-3">7. Your Privacy Rights</h2>
              <p className="mb-3">
                Since we collect minimal data and most information is publicly available on the blockchain, privacy rights apply differently:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Access:</strong> All transaction data and wallet addresses are publicly visible on the Flow blockchain. You can view this data yourself using Flowscan or other blockchain explorers. We do not maintain separate databases of your personal information.</li>
                <li><strong>Rectification:</strong> We cannot modify on-chain blockchain data, as it is immutable. If you need to correct information, you would need to create a new transaction on the blockchain.</li>
                <li><strong>Erasure:</strong> On-chain blockchain data cannot be deleted due to the immutable nature of blockchain technology.</li>
                <li><strong>Portability:</strong> All blockchain data is already publicly accessible and portable. You can access your transaction history directly from the Flow blockchain.</li>
                <li><strong>Objection:</strong> Since we do not process personal data for analytics, marketing, or profiling purposes, there is no data processing to object to.</li>
              </ul>
              <p className="mt-3">
                <strong>Important:</strong> We do not maintain databases of personal information. The only data we have access to is what is publicly visible on the Flow blockchain, which anyone can view. Reading preferences are stored locally in your browser and never sent to our servers.
              </p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mt-6 mb-3">8. Data Storage and Retention</h2>
              <p className="mb-3">
                <strong>We do not retain or store any personal information.</strong> We do not maintain databases, servers, or any storage systems that contain your personal data.
              </p>
              <p className="mb-3">
                The only data related to your use of our services exists in the following places:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Flow Blockchain:</strong> Transaction data (wallet addresses, donation amounts) is permanently recorded on the Flow blockchain. This data is publicly visible and immutable. We do not control or store this data - it exists on the decentralized Flow network.</li>
                <li><strong>MoonPay:</strong> Payment information is processed and stored by MoonPay according to their privacy policy. We do not receive or store this data.</li>
              </ul>
              <p className="mt-3">
                Since we do not retain personal information, there is no data retention period or deletion process. All data we access is either publicly available on the blockchain or processed by third-party services (MoonPay) that maintain their own data retention policies.
              </p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mt-6 mb-3">9. Cookies and Tracking Technologies</h2>
              <p>
                We do not use cookies or any tracking technologies. We do not use analytics cookies, advertising cookies, or any form of tracking.
              </p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mt-6 mb-3">10. International Data Transfers</h2>
              <p>
                Since we do not collect, store, or retain personal information, there are no international data transfers of personal data by us. Any data transfers that occur (such as transaction data to the Flow blockchain or payment data to MoonPay) are handled by those respective services according to their own policies. The Flow blockchain operates globally, and MoonPay processes payments internationally according to their own policies.
              </p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mt-6 mb-3">11. Children's Privacy</h2>
              <p>
                Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children. Since we do not retain personal information, there is no risk of storing children's data.
              </p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mt-6 mb-3">12. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mt-6 mb-3">13. Contact Information</h2>
              <p>
                If you have questions about this Privacy Policy or wish to exercise your privacy rights, please contact us at:
              </p>
              <div className="mt-2 space-y-2">
                <p>
                  <strong>Email:</strong> <a href="mailto:alexandria.librarian.prime@proton.me" className="text-emerald-600 hover:text-emerald-700 underline">alexandria.librarian.prime@proton.me</a>
                </p>
                <p>
                  <strong>X (Twitter):</strong> <a href="https://x.com/AlexandriaLib_" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700 underline">@AlexandriaLib_</a>
                </p>
              </div>
            </section>
          </div>

          <div className="mt-8 sm:mt-10 md:mt-12 pt-6 sm:pt-8 border-t border-gray-200">
            <Link
              to="/"
              className="text-sm sm:text-base text-emerald-600 hover:text-emerald-700 underline font-medium"
            >
              ← Back to Library
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
