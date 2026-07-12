import { Switch } from '@/components/core/ui/switch'
import { cn } from '@/lib/utils'

export function SwitchField({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
  className,
}: {
  label: string
  description?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
}) {
  return (
    <div className={cn('flex items-start gap-3 py-1', disabled && 'opacity-50', className)}>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} className="mt-0.5 shrink-0" />
      <button
        type="button"
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn('min-w-0 flex-1 text-left', disabled ? 'cursor-not-allowed' : 'cursor-pointer')}
      >
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {description ? <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground/80">{description}</span> : null}
      </button>
    </div>
  )
}
