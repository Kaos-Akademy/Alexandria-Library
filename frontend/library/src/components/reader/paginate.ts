export function paginateParagraphs(
  paragraphs: string[],
  measure: (joinedHtml: string) => number,
  pageHeight: number
): string[] {
  const pages: string[] = []
  let current: string[] = []
  for (const p of paragraphs) {
    const test = [...current, p].join('')
    const h = measure(test)
    if (h <= pageHeight) {
      current.push(p)
    } else {
      if (current.length > 0) pages.push(current.join(''))
      current = [p]
    }
  }
  if (current.length > 0) pages.push(current.join(''))
  return pages
}


