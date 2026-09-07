import BannedBooksListing from '@/components/banned/BannedBooksListing'

export const metadata = {
  title: 'Banned Books | Alexandria Library',
  description: 'Books that were silenced — removed, burned, or banned — now preserved on-chain and free to read.',
}

export default function BannedBooksPage() {
  return <BannedBooksListing />
}
