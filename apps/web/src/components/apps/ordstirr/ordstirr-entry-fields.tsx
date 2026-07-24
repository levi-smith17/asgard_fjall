import { MonthYearPicker } from '@/components/core/ui/month-year-picker'
import { Input } from '@/components/core/ui/input'
import { RichEditor } from '@/components/core/ui/rich-editor'
import { Select } from '@/components/core/ui/select'
import { SwitchField } from '@/components/core/ui/switch-field'
import type { ManifestGear } from '@/lib/manifest-api'

export function ManifestTextField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  )
}

export function ManifestMonthField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string | null
  onChange: (value: string | null) => void
}) {
  return (
    <label className="block min-w-0 space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <MonthYearPicker value={value} onChange={onChange} />
    </label>
  )
}

export function ManifestDateRangeFields({
  startDate,
  endDate,
  current,
  onStartDateChange,
  onEndDateChange,
  onCurrentChange,
}: {
  startDate: string
  endDate: string | null
  current: boolean
  onStartDateChange: (value: string) => void
  onEndDateChange: (value: string | null) => void
  onCurrentChange: (value: boolean) => void
}) {
  return (
    <>
      <ManifestMonthField
        label="Start date"
        value={startDate}
        onChange={(value) => value && onStartDateChange(value)}
      />
      <SwitchField label="Current" checked={current} onCheckedChange={onCurrentChange} />
      {!current ? (
        <ManifestMonthField label="End date" value={endDate} onChange={onEndDateChange} />
      ) : null}
    </>
  )
}

export function ManifestPlainTextareaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string
  value: string | null
  onChange: (value: string | null) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <textarea
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value || null)}
        placeholder={placeholder ?? 'Notes…'}
        rows={rows}
        className="flex min-h-[5rem] w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </label>
  )
}

export function ManifestDescriptionField({
  value,
  onChange,
  placeholder,
}: {
  value: string | null
  onChange: (value: string | null) => void
  placeholder?: string
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">Description</span>
      <RichEditor
        value={value ?? ''}
        onChange={(html) => onChange(html || null)}
        placeholder={placeholder ?? 'Description…'}
      />
    </label>
  )
}

export const GEAR_LEVEL_OPTIONS = [
  { value: '', label: 'No level' },
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
  { value: 'EXPERT', label: 'Expert' },
]

export function ManifestGearLevelField({
  value,
  onChange,
}: {
  value: ManifestGear['level']
  onChange: (value: ManifestGear['level']) => void
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">Level</span>
      <Select
        value={value ?? ''}
        onChange={(next) => onChange((next || null) as ManifestGear['level'])}
        options={GEAR_LEVEL_OPTIONS}
      />
    </label>
  )
}
