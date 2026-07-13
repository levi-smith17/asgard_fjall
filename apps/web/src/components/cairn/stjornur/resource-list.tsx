import { useSearchParams } from 'react-router-dom'
import { Button } from '@/components/core/ui/button'
import { ChevronLeft, ChevronRight, Pencil, Plus } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/core/ui/tooltip'

interface ResourceListProps {
  resources: any[]
  selectedResourceId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onEdit: (resource: any) => void
  totalCount: number
  currentPage: number
  pageSize: number
  isSearching: boolean
  hideHeader?: boolean
  onPageChange?: (page: number) => void
  onNewWithType?: (type: string) => void
  allResources?: any[]
}

export function ResourceList({ resources, selectedResourceId, onSelect, onNew, onEdit, totalCount, currentPage, pageSize, isSearching, hideHeader, onPageChange, onNewWithType, allResources }: ResourceListProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  function goToPage(page: number) {
    if (onPageChange) {
      onPageChange(page)
      return
    }
    const next = new URLSearchParams(searchParams)
    next.set('page', String(page))
    setSearchParams(next, { preventScrollReset: true })
  }

  const groups: { type: string; items: any[] }[] = []
  for (const resource of resources) {
    const typeName = resource.type ?? 'Other'
    const last = groups[groups.length - 1]
    if (last && last.type === typeName) {
      last.items.push(resource)
    } else {
      groups.push({ type: typeName, items: [resource] })
    }
  }

  const displayCount = isSearching ? resources.length : totalCount

  return (
    <div className="flex flex-col h-full">
      {!hideHeader && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <span className="text-sm font-medium">
            {displayCount} resource{displayCount !== 1 ? 's' : ''}
            {isSearching && resources.length < totalCount && (
              <span className="text-xs text-muted-foreground ml-1">(filtered)</span>
            )}
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onNew}>
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add resource</TooltipContent>
          </Tooltip>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {groups.map(({ type, items }) => (
          <div key={`${type}-${currentPage}`}>
            <div className="px-4 py-1.5 bg-muted/50 border-b border-border/50 flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex-1">
                {type}
              </span>
              {!isSearching && currentPage > 1 && groups[0].type === type && (
                <span className="text-[10px] text-muted-foreground/60">(continued)</span>
              )}
              {onNewWithType && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={e => { e.stopPropagation(); onNewWithType(type) }}
                  aria-label={`Add ${type} resource`}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
            {items.map(resource => {
              const ingredients = allResources && resource.ingredients?.length
                ? resource.ingredients
                    .map((id: string) => allResources.find(r => r.id === id))
                    .filter(Boolean)
                    .sort((a: any, b: any) => a.name.localeCompare(b.name))
                : []
              const resourceId = resource.id ?? resource.sk
              const isManufactured = (resource.ingredients?.length ?? 0) > 0
              const isSelected = selectedResourceId === resourceId
              return (
                <div
                  key={resourceId}
                  className={`flex items-center justify-between px-4 py-3 border-b border-border/50 transition-colors group ${
                    isManufactured ? 'cursor-pointer' : ''
                  } ${isSelected ? 'bg-primary/20' : isManufactured ? 'hover:bg-muted/50' : ''}`}
                  onClick={() => {
                    if (isManufactured) onSelect(resourceId)
                  }}
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate">{resource.name}</span>
                    <span className="font-mono text-xs text-muted-foreground truncate">
                      {resource.abbreviation}
                      {ingredients.length > 0 && ` — ${ingredients.map((i: any) => i.abbreviation).join(' · ')}`}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1" onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(resource)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {!isSearching && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 border-t shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="text-xs text-muted-foreground">{currentPage} / {totalPages}</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages}>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  )
}
