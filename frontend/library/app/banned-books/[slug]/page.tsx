import { notFound } from 'next/navigation'
import { getBookBySlug, getBannedBookSlugs } from '@/lib/bannedBooksData'
import BannedBookProfileView from '@/components/banned/BannedBookProfile'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getBannedBookSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const book = getBookBySlug(slug)
  if (!book) return { title: 'Not Found | Alexandria Library' }
  return {
    title: `${book.title} — Banned Books | Alexandria Library`,
    description: `Why ${book.title} by ${book.author} was banned, and why it still matters.`,
  }
}

export default async function BannedBookDetailPage({ params }: PageProps) {
  const { slug } = await params
  const book = getBookBySlug(slug)
  if (!book) notFound()
  return <BannedBookProfileView book={book} />
}
