import { Search } from 'lucide-react'
import { ToolbarTooltip } from '@/components/core/ui/toolbar-tooltip'
import { useCommandPalette } from '@/context/command-palette-context'

export function GlobalSearchTrigger() {
  const { openCommandPalette } = useCommandPalette()

  return (
    <ToolbarTooltip label="Search everywhere (⌘K)">
      <button
        type="button"
        onClick={openCommandPalette}
        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted-hover hover:text-foreground"
        aria-label="Search everywhere"
      >
        <Search className="h-4 w-4" />
      </button>
    </ToolbarTooltip>
  )
}
