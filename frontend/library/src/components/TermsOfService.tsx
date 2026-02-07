import { Link } from 'react-router-dom'

export default function TermsOfService() {
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
            Terms of Service
          </h1>

          <p className="text-sm text-gray-600 mb-6">
            Last updated: February 6, 2026
          </p>

          <div className="space-y-4 sm:space-y-5 md:space-y-6 text-sm sm:text-base text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mt-6 mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing or using Alexandria Library ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service. These Terms apply to all visitors, users, and others who access or use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mt-6 mb-3">2. Description of Service</h2>
              <p>
                Alexandria Library is a decentralized digital library built on the Flow blockchain that provides free, permanent access to books and written works. The Service includes a donation platform that allows users to contribute FLOW tokens to support the library's infrastructure and operations.
              </p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mt-6 mb-3">3. Eligibility</h2>
              <p>
                You must be at least 18 years old to use the Service. By using the Service, you represent and warrant that you are of legal age to form a binding contract and meet all eligibility requirements. You are responsible for ensuring that your use of the Service complies with all applicable laws in your jurisdiction.
              </p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mt-6 mb-3">4. User Accounts and Wallet Connections</h2>
              <p>
                To make donations or participate in governance, you may connect a Flow blockchain wallet. You are solely responsible for maintaining the security of your wallet and private keys. Alexandria Library does not store or have access to your wallet credentials. Any unauthorized access to your wallet is your responsibility.
              </p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mt-6 mb-3">5. Donations and Contributions</h2>
              <p className="mb-3">When making donations:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>All donations are voluntary and non-refundable</li>
                <li>Donations are processed on the Flow blockchain and are irreversible</li>
                <li>Donation amounts and wallet addresses are publicly visible on the blockchain</li>
                <li>Donations contribute toward the library's goal of operating a Flow verification node</li>
                <li>Contributors may be eligible to receive Zenodotus NFTs based on contribution amounts</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mt-6 mb-3">6. MoonPay Payment Terms</h2>
              <p className="mb-3">
                When purchasing FLOW tokens through MoonPay to make donations:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Payment processing is handled by MoonPay, a third-party payment provider</li>
                <li>MoonPay's terms of service and privacy policy apply to payment transactions</li>
                <li>You agree to pay all fees associated with MoonPay transactions</li>
                <li>Refunds for MoonPay purchases are subject to MoonPay's refund policy</li>
                <li>FLOW tokens purchased through MoonPay are sent directly to the library address</li>
                <li>We are not responsible for MoonPay's services, fees, or policies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mt-6 mb-3">7. Cryptocurrency and Blockchain Risks</h2>
              <p className="mb-3">
                You acknowledge and agree that:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Cryptocurrency transactions are irreversible and cannot be undone</li>
                <li>Cryptocurrency values are highly volatile and may fluctuate significantly</li>
                <li>Blockchain networks may experience congestion, delays, or failures</li>
                <li>Smart contracts may contain bugs or vulnerabilities</li>
                <li>You may lose access to funds if you lose your private keys</li>
                <li>Regulatory changes may affect cryptocurrency use</li>
                <li>You are solely responsible for understanding these risks</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mt-6 mb-3">8. NFTs and DAO Participation</h2>
              <p className="mb-3">
                Contributors may receive Zenodotus NFTs:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>NFTs are minted based on cumulative contribution amounts</li>
                <li>NFTs represent membership in the Alexandria Library DAO</li>
                <li>NFT ownership does not grant control over library content</li>
                <li>NFTs may be used for governance participation in the DAO</li>
                <li>NFT minting occurs after the verification node is operational</li>
                <li>NFTs are non-transferable (soulbound) tokens</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mt-6 mb-3">9. Intellectual Property</h2>
              <p>
                The content available through Alexandria Library, including books and written works, may be subject to copyright and other intellectual property rights. Alexandria Library provides access to content for educational and preservation purposes. Users are responsible for ensuring their use of content complies with applicable copyright laws. The Alexandria Library platform, including its design, code, and branding, is the property of Alexandria Library.
              </p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mt-6 mb-3">10. Prohibited Uses</h2>
              <p className="mb-3">You agree not to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use the Service for any illegal purpose or in violation of any laws</li>
                <li>Attempt to hack, disrupt, or interfere with the Service or blockchain network</li>
                <li>Use the Service to transmit malware, viruses, or harmful code</li>
                <li>Impersonate others or provide false information</li>
                <li>Violate any intellectual property rights</li>
                <li>Use automated systems to access the Service without permission</li>
                <li>Engage in any activity that could harm the Service or its users</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mt-6 mb-3">11. Disclaimers and Limitations of Liability</h2>
              <p className="mb-3">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. TO THE MAXIMUM EXTENT PERMITTED BY LAW:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>We disclaim all warranties, express or implied</li>
                <li>We do not guarantee the Service will be uninterrupted or error-free</li>
                <li>We are not responsible for blockchain network failures or delays</li>
                <li>We are not responsible for losses due to cryptocurrency volatility</li>
                <li>We are not responsible for losses due to wallet security breaches</li>
                <li>We are not responsible for MoonPay's services or policies</li>
                <li>Our liability is limited to the maximum extent permitted by law</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mt-6 mb-3">12. Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless Alexandria Library, its operators, and affiliates from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from your use of the Service, violation of these Terms, or infringement of any rights of another party.
              </p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mt-6 mb-3">13. Termination</h2>
              <p>
                We reserve the right to terminate or suspend your access to the Service at any time, with or without cause or notice, for any reason including violation of these Terms. Upon termination, your right to use the Service will immediately cease. However, blockchain transactions and on-chain data cannot be deleted.
              </p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mt-6 mb-3">14. Governing Law and Dispute Resolution</h2>
              <p>
                These Terms shall be governed by and construed in accordance with applicable laws. Any disputes arising from these Terms or your use of the Service shall be resolved through appropriate legal channels. You agree that any legal action or proceeding shall be brought in the appropriate courts having jurisdiction.
              </p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mt-6 mb-3">15. Changes to Terms</h2>
              <p>
                We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion. Your continued use of the Service after any changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mt-6 mb-3">16. Contact Information</h2>
              <p>
                If you have any questions about these Terms of Service, please contact us at:
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
