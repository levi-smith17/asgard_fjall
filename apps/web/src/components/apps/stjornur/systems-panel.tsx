import { useState } from 'react'
import { X, Plus, Pencil, Trash2, ChevronRight, Check } from 'lucide-react'
import { Button } from '@/components/core/ui/button'
import { Input } from '@/components/core/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/core/ui/tooltip'
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
import { InspectorFormHeader } from '@/components/core/ui/inspector-form-actions'

interface Planet {
  id: string
  name: string
}

interface SystemEntry {
  id: string
  name: string
  planets: Planet[]
}

interface SystemsPanelProps {
  systems: SystemEntry[]
  onClose: () => void
  onSystemCreate: (name: string) => void
  onSystemRename: (id: string, newName: string) => void
  onSystemDelete: (id: string) => void
  onPlanetCreate: (systemId: string, name: string) => void
  onPlanetRename: (systemId: string, planetId: string, newName: string) => void
  onPlanetDelete: (systemId: string, planetId: string) => void
}

interface InlineInputProps {
  value: string
  onChange: (v: string) => void
  onSave: () => void
  onCancel: () => void
  onRemove?: () => void
  placeholder: string
}

function InlineInput({ value, onChange, onSave, onCancel, onRemove, placeholder }: InlineInputProps) {
  return (
    <div className="flex items-center gap-2 border-b border-border/50 px-3 py-2">
      <Input
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); onSave() }
          if (e.key === 'Escape') onCancel()
        }}
        placeholder={placeholder}
        className="h-8 flex-1 text-sm"
        autoFocus
      />
      <Button
        type="button"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={onSave}
        disabled={!(value ?? '').trim()}
        aria-label="Save"
      >
        <Check className="h-4 w-4" />
      </Button>
      {onRemove && (
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-destructive hover:text-destructive/80" onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onCancel}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function SystemsPanel({
  systems,
  onClose: _onClose,
  onSystemCreate,
  onSystemRename,
  onSystemDelete,
  onPlanetCreate,
  onPlanetRename,
  onPlanetDelete,
}: SystemsPanelProps) {
  const [view, setView] = useState<'systems' | 'planets'>('systems')
  const [activeSystemId, setActiveSystemId] = useState<string | null>(null)

  const [addingSystem, setAddingSystem] = useState(false)
  const [editingSystemId, setEditingSystemId] = useState<string | null>(null)
  const [systemInput, setSystemInput] = useState('')

  const [addingPlanet, setAddingPlanet] = useState(false)
  const [editingPlanetId, setEditingPlanetId] = useState<string | null>(null)
  const [planetInput, setPlanetInput] = useState('')

  const [confirmDelete, setConfirmDelete] = useState<{
    type: 'system' | 'planet'
    id: string
    name: string
    systemId?: string
  } | null>(null)

  const activeSystem = systems.find(s => s.id === activeSystemId) ?? null
  const sortedSystems = [...systems].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
  const sortedPlanets = [...(activeSystem?.planets ?? [])].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))

  function drillInto(id: string) {
    setActiveSystemId(id)
    setView('planets')
    setAddingPlanet(false)
    setEditingPlanetId(null)
    setPlanetInput('')
  }

  function goBack() {
    setView('systems')
    setActiveSystemId(null)
    setAddingPlanet(false)
    setEditingPlanetId(null)
    setPlanetInput('')
    setAddingSystem(false)
    setEditingSystemId(null)
    setSystemInput('')
  }

  function saveSystem() {
    const name = systemInput.trim()
    if (!name) return
    if (editingSystemId) {
      onSystemRename(editingSystemId, name)
      setEditingSystemId(null)
    } else {
      onSystemCreate(name)
      setAddingSystem(false)
    }
    setSystemInput('')
  }

  function savePlanet() {
    const name = planetInput.trim()
    if (!name || !activeSystemId) return
    if (editingPlanetId) {
      onPlanetRename(activeSystemId, editingPlanetId, name)
      setEditingPlanetId(null)
    } else {
      onPlanetCreate(activeSystemId, name)
      setAddingPlanet(false)
    }
    setPlanetInput('')
  }

  function executeDelete() {
    if (!confirmDelete) return
    if (confirmDelete.type === 'system') {
      onSystemDelete(confirmDelete.id)
      if (activeSystemId === confirmDelete.id) goBack()
    } else {
      onPlanetDelete(confirmDelete.systemId!, confirmDelete.id)
    }
    setConfirmDelete(null)
  }

  if (view === 'planets' && activeSystem) {
    return (
      <>
        <div className="flex h-full flex-col">
          <InspectorFormHeader
            eyebrow="Inspector"
            title="Manage Planets"
            onBack={goBack}
          />

          <div className="flex shrink-0 items-center gap-2 border-b border-border px-5 py-3">
            <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{activeSystem.name}</p>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => { setAddingPlanet(true); setEditingPlanetId(null); setPlanetInput('') }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add planet</TooltipContent>
            </Tooltip>
          </div>

          <div className="flex-1 overflow-y-auto">
            {addingPlanet && (
              <InlineInput
                value={planetInput}
                onChange={setPlanetInput}
                onSave={savePlanet}
                onCancel={() => { setAddingPlanet(false); setPlanetInput('') }}
                placeholder="Planet name…"
              />
            )}
            {sortedPlanets.length === 0 && !addingPlanet && (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">No planets yet.</p>
            )}
            {sortedPlanets.map(planet => (
              <div key={planet.id} className="group flex items-center border-b border-border/50 last:border-0">
                {editingPlanetId === planet.id ? (
                  <div className="flex-1">
                    <InlineInput
                      value={planetInput}
                      onChange={setPlanetInput}
                      onSave={savePlanet}
                      onCancel={() => { setEditingPlanetId(null); setPlanetInput('') }}
                      onRemove={() => setConfirmDelete({ type: 'planet', id: planet.id, name: planet.name, systemId: activeSystem.id })}
                      placeholder="Planet name…"
                    />
                  </div>
                ) : (
                  <>
                    <span className="flex-1 py-3.5 pl-4 pr-2 text-sm">{planet.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mr-3 h-8 w-8 shrink-0"
                      onClick={() => { setEditingPlanetId(planet.id); setPlanetInput(planet.name); setAddingPlanet(false) }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <AlertDialog open={!!confirmDelete} onOpenChange={open => { if (!open) setConfirmDelete(null) }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Remove {confirmDelete?.type === 'system' ? 'system' : 'planet'} "{confirmDelete?.name}"?
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirmDelete?.type === 'system'
                  ? 'This will remove the system and all its planets. Outposts referencing it will not be affected.'
                  : 'This will remove the planet from the list.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={executeDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    )
  }

  return (
    <>
      <div className="flex h-full flex-col">
        <InspectorFormHeader
          eyebrow="Inspector"
          title="Manage Systems"
          showBack={false}
        />

        <div className="flex shrink-0 items-center gap-2 border-b border-border px-5 py-3">
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
            {`${sortedSystems.length} system${sortedSystems.length !== 1 ? 's' : ''}`}
          </p>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => { setAddingSystem(true); setEditingSystemId(null); setSystemInput('') }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add system</TooltipContent>
          </Tooltip>
        </div>

        <div className="flex-1 overflow-y-auto">
          {sortedSystems.length === 0 && !addingSystem && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">No systems yet.</p>
          )}
          {sortedSystems.map(sys => (
            <div key={sys.id} className="group flex items-center border-b border-border/50 last:border-0">
              {editingSystemId === sys.id ? (
                <div className="flex-1">
                  <InlineInput
                    value={systemInput}
                    onChange={setSystemInput}
                    onSave={saveSystem}
                    onCancel={() => { setEditingSystemId(null); setSystemInput('') }}
                    onRemove={() => setConfirmDelete({ type: 'system', id: sys.id, name: sys.name })}
                    placeholder="System name…"
                  />
                </div>
              ) : (
                <>
                  <div className="flex min-w-0 flex-1 flex-col justify-center py-3 pl-4 pr-2">
                    <span className="truncate text-sm">{sys.name}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{sys.planets.length} {sys.planets.length === 1 ? 'planet' : 'planets'}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mr-1 h-8 w-8 shrink-0"
                    onClick={() => { setEditingSystemId(sys.id); setSystemInput(sys.name); setAddingSystem(false) }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mr-3 h-9 w-9 shrink-0"
                    onClick={() => drillInto(sys.id)}
                  >
                    <ChevronRight className="h-10 w-10" />
                  </Button>
                </>
              )}
            </div>
          ))}
          {addingSystem && (
            <InlineInput
              value={systemInput}
              onChange={setSystemInput}
              onSave={saveSystem}
              onCancel={() => { setAddingSystem(false); setSystemInput('') }}
              placeholder="System name…"
            />
          )}
        </div>
      </div>

      <AlertDialog open={!!confirmDelete} onOpenChange={open => { if (!open) setConfirmDelete(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove system "{confirmDelete?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the system and all its planets. Outposts referencing it will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
