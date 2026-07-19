import { useState, useMemo, useEffect } from 'react'
import { X, Search, Plus, Pencil } from 'lucide-react'
import { Button } from '@/components/core/ui/button'
import { Input } from '@/components/core/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/core/ui/alert-dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/core/ui/tooltip'
import { Badge } from '@/components/core/ui/badge'
import {
  InspectorFormHeader,
} from '@/components/core/ui/inspector-form-actions'
import { ResourceList } from './resource-list'
import { ResourceForm } from './resource-form'
import { SF_CONTROL, SF_ICON_CONTROL } from './constants'
import { deleteResource } from '@/lib/stjornur-api'

interface ResourcesPanelProps {
  resources: any[]
  onClose: () => void
  onRefresh: () => void
}

type SubMode =
  | { mode: 'list' }
  | { mode: 'detail'; resource: any }
  | { mode: 'form'; resource: any | null }

const PAGE_SIZE = 25

export function ResourcesPanel({ resources, onClose: _onClose, onRefresh }: ResourcesPanelProps) {
  const [subMode, setSubMode] = useState<SubMode>({ mode: 'list' })
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  const sortedResources = useMemo(() =>
    [...resources].sort((a, b) => {
      const typeA = (a.type ?? '').localeCompare(b.type ?? '')
      if (typeA !== 0) return typeA
      return a.name.localeCompare(b.name)
    }), [resources])

  const filteredResources = useMemo(() => search.trim()
    ? sortedResources.filter(r =>
        (r.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (r.abbreviation ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (r.type ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : sortedResources, [sortedResources, search])

  useEffect(() => { setPage(1) }, [search])

  const isSearching = !!search.trim()
  const pagedResources = isSearching
    ? filteredResources
    : filteredResources.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    await deleteResource(deleteTarget.id)
    if (subMode.mode === 'detail' && subMode.resource?.id === deleteTarget.id) {
      setSubMode({ mode: 'list' })
    }
    if (subMode.mode === 'form' && subMode.resource?.id === deleteTarget.id) {
      setSubMode({ mode: 'list' })
    }
    onRefresh()
    setDeleteTarget(null)
  }

  const deleteDialog = (
    <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Resource</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove "{deleteTarget?.name}"? This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  if (subMode.mode === 'form') {
    return (
      <div className="flex h-full flex-col">
        <InspectorFormHeader
          eyebrow="Inspector"
          title={subMode.resource?.id ? 'Edit Resource' : 'Add Resource'}
          onBack={() => setSubMode({ mode: 'list' })}
        />
        <ResourceForm
          key={subMode.resource?.id ?? 'new'}
          resource={subMode.resource}
          resources={resources}
          onDone={() => setSubMode({ mode: 'list' })}
          onRefresh={onRefresh}
          onDelete={
            subMode.resource?.id
              ? () => setDeleteTarget({ id: subMode.resource.id, name: subMode.resource.name })
              : undefined
          }
        />
        {deleteDialog}
      </div>
    )
  }

  if (subMode.mode === 'detail') {
    const resource = subMode.resource
    const ingredients = (resource.ingredients ?? [])
      .map((id: string) => resources.find((r: any) => r.id === id || r.sk === `RESOURCE#${id}`))
      .filter(Boolean)

    return (
      <div className="flex h-full flex-col">
        <InspectorFormHeader
          eyebrow="Inspector"
          title="View Resource"
          onBack={() => setSubMode({ mode: 'list' })}
          actions={
            <Button
              variant="ghost"
              size="icon"
              className={SF_ICON_CONTROL}
              onClick={() => setSubMode({ mode: 'form', resource })}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          }
        />

        <div className="shrink-0 border-b border-border px-5 py-3">
          <p className="truncate text-sm font-medium text-foreground">{resource.name}</p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="mb-3 flex items-center gap-2">
            <Badge variant="outline" className="text-xs">{resource.abbreviation}</Badge>
            <span className="text-xs text-muted-foreground">{resource.type}</span>
          </div>
          {ingredients.length > 0 ? (
            <div className="space-y-1">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Recipe</span>
              {ingredients.map((ing: any) => (
                <div key={ing.id ?? ing.sk} className="flex items-center gap-2 border-b border-border/50 py-2.5 text-sm last:border-0">
                  <Badge variant="outline" className="font-mono text-xs">{ing.abbreviation}</Badge>
                  <span>{ing.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
              No recipe — mined or raw resource.
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-border px-5 py-4">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={() => setDeleteTarget({ id: resource.id, name: resource.name })}
          >
            Delete Resource
          </Button>
        </div>

        {deleteDialog}
      </div>
    )
  }

  const displayCount = isSearching ? filteredResources.length : resources.length
  const countLabel = `${displayCount} resource${displayCount !== 1 ? 's' : ''}${
    isSearching && filteredResources.length < resources.length ? ' (filtered)' : ''
  }`

  return (
    <div className="flex h-full flex-col">
      <InspectorFormHeader
        eyebrow="Inspector"
        title="Manage Resources"
        showBack={false}
        actions={
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={SF_ICON_CONTROL}
                onClick={() => setSubMode({ mode: 'form', resource: null })}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add resource</TooltipContent>
          </Tooltip>
        }
      />

      <div className="shrink-0 border-b border-border px-5 py-3">
        <p className="truncate text-sm font-medium text-foreground">{countLabel}</p>
      </div>

      <div className="shrink-0 border-b border-border/50 px-3 py-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search resources…"
            className={`pl-8 pr-8 ${SF_CONTROL} text-sm`}
          />
          {search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2"
              onClick={() => setSearch('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <ResourceList
          resources={pagedResources}
          selectedResourceId={null}
          onSelect={id => {
            const resource = resources.find(r => (r.id ?? r.sk) === id)
            if (resource && (resource.ingredients?.length ?? 0) > 0) {
              setSubMode({ mode: 'detail', resource })
            }
          }}
          onNew={() => setSubMode({ mode: 'form', resource: null })}
          onEdit={resource => setSubMode({ mode: 'form', resource })}
          totalCount={filteredResources.length}
          currentPage={page}
          pageSize={PAGE_SIZE}
          isSearching={isSearching}
          onPageChange={setPage}
          onNewWithType={type => setSubMode({ mode: 'form', resource: { type } })}
          allResources={resources}
          hideHeader
        />
      </div>

      {deleteDialog}
    </div>
  )
}
