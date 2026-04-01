import type { Components } from 'react-markdown'

/** Concatenate streaming text parts so markdown can parse across chunk boundaries. */
export function joinChatMessageParts(
  parts: { type: string; text?: string }[] | undefined
): string {
  if (!parts?.length) return ''
  return parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('')
}

/** Tailwind mapping for assistant/user chat bubbles (react-markdown). */
export const chatMarkdownComponents: Partial<Components> = {
  p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  h1: ({ children }) => (
    <h1 className="text-base font-bold mt-2 mb-1 first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-sm font-bold mt-2 mb-1 first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-bold mt-2 mb-1 first:mt-0">{children}</h3>
  ),
  ul: ({ children }) => <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ children, href }) => (
    <a
      href={href}
      className="underline font-medium text-emerald-800 hover:text-emerald-900"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  code: ({ className, children }) => {
    const inline = !className
    return inline ? (
      <code className="rounded bg-black/10 px-1 py-0.5 font-mono text-[0.9em]">{children}</code>
    ) : (
      <code className={className}>{children}</code>
    )
  },
  pre: ({ children }) => (
    <pre className="my-2 overflow-x-auto rounded-md bg-black/10 p-2 font-mono text-xs">{children}</pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-gray-400 pl-3 my-2 text-gray-700">{children}</blockquote>
  ),
}
