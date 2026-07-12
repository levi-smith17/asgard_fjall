import { cn } from '@/lib/utils'

export function RichTextContent({ html, className }: { html: string; className?: string }) {
  return (
    <div
      className={cn('prose prose-sm max-w-none dark:prose-invert', className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
