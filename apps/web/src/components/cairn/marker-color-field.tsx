import { MarkerColorSwatch, PRESET_COLORS } from '@/components/cairn/markers-list'
import { Input } from '@/components/core/ui/input'
import { cn } from '@/lib/utils'

function normalizeHex(value: string): string | null {
  const trimmed = value.trim()
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toLowerCase()
  if (/^[0-9a-fA-F]{6}$/.test(trimmed)) return `#${trimmed.toLowerCase()}`
  return null
}

export function MarkerColorField({
  color,
  onChange,
}: {
  color: string
  onChange: (color: string) => void
}) {
  const normalized = normalizeHex(color) ?? color
  const isPreset = PRESET_COLORS.some((preset) => preset.toLowerCase() === normalized.toLowerCase())

  return (
    <div className="space-y-3">
      <span className="text-xs font-medium text-muted-foreground">Color</span>
      <div className="flex flex-wrap gap-2">
        {PRESET_COLORS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset)}
            className={cn(
              'rounded-full border-2 p-0.5',
              normalized.toLowerCase() === preset.toLowerCase()
                ? 'border-primary'
                : 'border-transparent',
            )}
            aria-label={`Color ${preset}`}
          >
            <MarkerColorSwatch color={preset} className="h-4 w-4" />
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <label className="relative flex h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-md border border-border">
          <span
            className="absolute inset-0"
            style={{ backgroundColor: normalizeHex(normalized) ?? '#6b7280' }}
            aria-hidden
          />
          <input
            type="color"
            value={normalizeHex(normalized) ?? '#6b7280'}
            onChange={(event) => onChange(event.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label="Custom color"
          />
        </label>
        <Input
          value={normalized}
          onChange={(event) => {
            const next = event.target.value
            onChange(next.startsWith('#') ? next : `#${next}`)
          }}
          onBlur={() => {
            const hex = normalizeHex(normalized)
            if (hex) onChange(hex)
          }}
          placeholder="#6b7280"
          className="font-mono text-xs"
          aria-label="Custom hex color"
        />
        {!isPreset && normalizeHex(normalized) ? (
          <span className="shrink-0 text-[10px] text-muted-foreground">Custom</span>
        ) : null}
      </div>
    </div>
  )
}
