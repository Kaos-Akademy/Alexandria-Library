import Hero from '@/components/landing/Hero'
import CrisisStats from '@/components/landing/CrisisStats'
import AlexandriaMission from '@/components/landing/AlexandriaMission'
import FeaturedBannedBooks from '@/components/landing/FeaturedBannedBooks'
import WhyBooksAreBanned from '@/components/landing/WhyBooksAreBanned'
import CensorshipTimeline from '@/components/landing/CensorshipTimeline'
import WritersContext from '@/components/landing/WritersContext'
import BlockchainMission from '@/components/landing/BlockchainMission'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0d0d14] text-gray-200 antialiased">
      <main>
        <Hero />
        <CrisisStats />
        <AlexandriaMission />
        <FeaturedBannedBooks />
        <WhyBooksAreBanned />
        <CensorshipTimeline />
        <WritersContext />
        <BlockchainMission />
      </main>
    </div>
  )
}
