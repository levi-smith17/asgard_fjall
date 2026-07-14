import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronUp, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { FormFieldsSkeleton } from '@/components/core/ui/studio-skeletons'
import { Button } from '@/components/core/ui/button'
import { Input } from '@/components/core/ui/input'
import { PasswordInput } from '@/components/core/ui/password-input'
import { Select } from '@/components/core/ui/select'
import { Switch } from '@/components/core/ui/switch'
import { ThingSettingRow } from '@/components/thing/thing-setting-row'
import { CairnNotConfiguredNotice } from '@/components/cairn/cairn-not-configured'
import {
  addCairnCalendarSubscription,
  addCairnICloudCalendar,
  deleteCairnCalendarSubscription,
  deleteCairnICloudCalendar,
  fetchCairnFullSettings,
  fetchCairnStatus,
  saveCairnItinerarySettings,
  updateCairnICloudCalendar,
  type CairnCalendarEntry,
} from '@/lib/cairn-api'
import { useTerms } from '@/hooks/use-terminology'
import { ASGARD_PRIMARY_HEX } from '@/lib/brand-colors'

const PRESET_COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  ASGARD_PRIMARY_HEX,
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#6b7280',
  '#14b8a6',
]

function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESET_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className="h-6 w-6 rounded-full ring-offset-2 transition-all"
          style={{ backgroundColor: color, outline: value === color ? `2px solid ${color}` : 'none' }}
          aria-label={`Color ${color}`}
        />
      ))}
    </div>
  )
}

function ICloudCalendarRow({
  calendar,
  onRefresh,
}: {
  calendar: CairnCalendarEntry
  onRefresh: () => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(calendar.name)
  const [editColor, setEditColor] = useState(calendar.color)
  const [editPassword, setEditPassword] = useState('')

  useEffect(() => {
    if (!editing) {
      setEditName(calendar.name)
      setEditColor(calendar.color)
      setEditPassword('')
    }
  }, [calendar.color, calendar.name, editing])

  const saveMutation = useMutation({
    mutationFn: () =>
      updateCairnICloudCalendar(calendar.id, {
        name: editName.trim(),
        color: editColor,
        ...(editPassword.trim() ? { password: editPassword.trim() } : {}),
      }),
    onSuccess: async () => {
      toast.success('Calendar updated')
      setEditing(false)
      setEditPassword('')
      await onRefresh()
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to update calendar'),
  })

  function handleCancel() {
    setEditName(calendar.name)
    setEditColor(calendar.color)
    setEditPassword('')
    setEditing(false)
  }

  return (
    <li className="overflow-hidden rounded-lg border border-border bg-muted/20">
      <div className="flex items-center gap-3 p-3">
        <span
          className="h-4 w-4 shrink-0 rounded-full ring-1 ring-border"
          style={{ backgroundColor: editing ? editColor : calendar.color }}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{calendar.name}</p>
          {calendar.appleId ? (
            <p className="truncate text-xs text-muted-foreground">{calendar.appleId}</p>
          ) : null}
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label={editing ? 'Cancel editing calendar' : 'Edit calendar'}
          onClick={() => (editing ? handleCancel() : setEditing(true))}
        >
          {editing ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Pencil className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Remove calendar"
          onClick={() =>
            void deleteCairnICloudCalendar(calendar.id).then(() => {
              toast.success('Calendar removed')
              return onRefresh()
            })
          }
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
      {editing ? (
        <form
          className="space-y-3 border-t border-border px-3 pb-3 pt-2"
          onSubmit={(event) => {
            event.preventDefault()
            if (!editName.trim()) return
            saveMutation.mutate()
          }}
        >
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground" htmlFor={`calendar-name-${calendar.id}`}>
              Calendar name
            </label>
            <Input
              id={`calendar-name-${calendar.id}`}
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
              placeholder="Name as shown in Apple Calendar"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label
              className="text-xs font-medium text-muted-foreground"
              htmlFor={`calendar-password-${calendar.id}`}
            >
              App-specific password
            </label>
            <PasswordInput
              id={`calendar-password-${calendar.id}`}
              value={editPassword}
              onChange={(event) => setEditPassword(event.target.value)}
              placeholder="Leave blank to keep current"
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Color</span>
            <ColorPicker value={editColor} onChange={setEditColor} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={saveMutation.isPending || !editName.trim()}>
              {saveMutation.isPending ? 'Saving…' : 'Save'}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}
    </li>
  )
}

export function ThingItinerarySettings() {
  const terms = useTerms()
  const queryClient = useQueryClient()

  const statusQuery = useQuery({
    queryKey: ['cairn-status'],
    queryFn: fetchCairnStatus,
    retry: false,
  })

  const settingsQuery = useQuery({
    queryKey: ['cairn-full-settings'],
    queryFn: fetchCairnFullSettings,
    enabled: statusQuery.data?.configured === true,
    retry: false,
  })

  const itinerary = settingsQuery.data?.itinerary
  const calendars = settingsQuery.data?.calendars ?? []
  const subscriptions = settingsQuery.data?.calendarSubscriptions ?? []

  const [defaultView, setDefaultView] = useState<'MONTH' | 'WEEK' | 'DAY'>('MONTH')
  const [firstDayOfWeek, setFirstDayOfWeek] = useState<'SUNDAY' | 'MONDAY'>('SUNDAY')
  const [defaultEventDuration, setDefaultEventDuration] = useState(60)
  const [showWeekNumbers, setShowWeekNumbers] = useState(false)

  const [showAddCalendar, setShowAddCalendar] = useState(false)
  const [appleId, setAppleId] = useState('')
  const [appPassword, setAppPassword] = useState('')
  const [calendarName, setCalendarName] = useState('')
  const [calendarColor, setCalendarColor] = useState('#3b82f6')

  const [showAddSubscription, setShowAddSubscription] = useState(false)
  const [subName, setSubName] = useState('')
  const [subUrl, setSubUrl] = useState('')
  const [subColor, setSubColor] = useState(ASGARD_PRIMARY_HEX)

  useEffect(() => {
    if (!itinerary) return
    setDefaultView(itinerary.defaultView)
    setFirstDayOfWeek(itinerary.firstDayOfWeek)
    setDefaultEventDuration(itinerary.defaultEventDuration)
    setShowWeekNumbers(itinerary.showWeekNumbers)
  }, [itinerary])

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ['cairn-full-settings'] })
    await queryClient.invalidateQueries({ queryKey: ['cairn-itinerary-events'] })
  }

  const savePrefsMutation = useMutation({
    mutationFn: () =>
      saveCairnItinerarySettings({
        defaultView,
        firstDayOfWeek,
        defaultEventDuration,
        showWeekNumbers,
      }),
    onSuccess: async () => {
      toast.success(`${terms.calendar} settings saved`)
      await refresh()
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to save'),
  })

  const addCalendarMutation = useMutation({
    mutationFn: () =>
      addCairnICloudCalendar({
        appleId: appleId.trim(),
        password: appPassword,
        name: calendarName.trim(),
        color: calendarColor,
      }),
    onSuccess: async () => {
      toast.success('Calendar added')
      setShowAddCalendar(false)
      setAppleId('')
      setAppPassword('')
      setCalendarName('')
      await refresh()
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to add calendar'),
  })

  const addSubscriptionMutation = useMutation({
    mutationFn: () =>
      addCairnCalendarSubscription({
        name: subName.trim(),
        url: subUrl.trim(),
        color: subColor,
      }),
    onSuccess: async () => {
      toast.success('Subscription added')
      setShowAddSubscription(false)
      setSubName('')
      setSubUrl('')
      await refresh()
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to add subscription'),
  })

  if (statusQuery.isLoading) {
    return <FormFieldsSkeleton fields={5} />
  }

  if (!statusQuery.data?.configured) {
    return <CairnNotConfiguredNotice />
  }

  if (settingsQuery.isLoading || !itinerary) {
    return <FormFieldsSkeleton fields={5} />
  }

  if (settingsQuery.isError) {
    return (
      <p className="text-sm text-destructive">
        {settingsQuery.error instanceof Error
          ? settingsQuery.error.message
          : `Failed to load ${terms.calendar} settings`}
      </p>
    )
  }

  return (
    <div className="space-y-8">
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault()
          savePrefsMutation.mutate()
        }}
      >
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Preferences</p>

        <ThingSettingRow
          label="Default view"
          description={`Calendar view when opening ${terms.calendar}`}
          control={
            <Select
              value={defaultView}
              onChange={(value) => setDefaultView(value as typeof defaultView)}
              options={[
                { value: 'MONTH', label: 'Month' },
                { value: 'WEEK', label: 'Week' },
                { value: 'DAY', label: 'Day' },
              ]}
              className="w-28"
            />
          }
        />

        <ThingSettingRow
          label="First day of week"
          description="Which day starts the week"
          control={
            <Select
              value={firstDayOfWeek}
              onChange={(value) => setFirstDayOfWeek(value as typeof firstDayOfWeek)}
              options={[
                { value: 'SUNDAY', label: 'Sunday' },
                { value: 'MONDAY', label: 'Monday' },
              ]}
              className="w-28"
            />
          }
        />

        <ThingSettingRow
          label="Default event duration"
          description="Minutes for new events"
          control={
            <Input
              type="number"
              min={15}
              step={15}
              value={defaultEventDuration}
              onChange={(event) => setDefaultEventDuration(Number(event.target.value))}
              className="w-24"
            />
          }
        />

        <ThingSettingRow
          label="Show week numbers"
          description="Display ISO week numbers in the calendar"
          control={
            <Switch
              checked={showWeekNumbers}
              onCheckedChange={setShowWeekNumbers}
              aria-label="Week numbers"
            />
          }
        />

        <Button type="submit" disabled={savePrefsMutation.isPending}>
          {savePrefsMutation.isPending ? 'Saving…' : 'Save'}
        </Button>
      </form>

      <section className="space-y-3 border-t border-border pt-8">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">iCloud calendars</h3>
          <Button type="button" size="sm" variant="outline" onClick={() => setShowAddCalendar((v) => !v)}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>

        {calendars.length === 0 ? (
          <p className="text-sm text-muted-foreground">No iCloud calendars connected.</p>
        ) : (
          <ul className="space-y-2">
            {calendars.map((calendar) => (
              <ICloudCalendarRow key={calendar.id} calendar={calendar} onRefresh={refresh} />
            ))}
          </ul>
        )}

        {showAddCalendar ? (
          <form
            className="space-y-3 rounded-lg border border-border p-4"
            onSubmit={(event) => {
              event.preventDefault()
              addCalendarMutation.mutate()
            }}
          >
            <Input
              type="email"
              value={appleId}
              onChange={(event) => setAppleId(event.target.value)}
              placeholder="Apple ID"
              required
            />
            <PasswordInput
              value={appPassword}
              onChange={(event) => setAppPassword(event.target.value)}
              placeholder="App-specific password"
              required
            />
            <Input
              value={calendarName}
              onChange={(event) => setCalendarName(event.target.value)}
              placeholder="Calendar name in Apple Calendar"
              required
            />
            <ColorPicker value={calendarColor} onChange={setCalendarColor} />
            <div className="flex gap-2">
              <Button type="submit" disabled={addCalendarMutation.isPending}>
                {addCalendarMutation.isPending ? 'Adding…' : 'Add calendar'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowAddCalendar(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : null}
      </section>

      <section className="space-y-3 border-t border-border pt-8">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Calendar subscriptions</h3>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setShowAddSubscription((v) => !v)}
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>

        {subscriptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No subscribed calendars.</p>
        ) : (
          <ul className="space-y-2">
            {subscriptions.map((sub) => (
              <li
                key={sub.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 p-3"
              >
                <span
                  className="h-4 w-4 shrink-0 rounded-full ring-1 ring-border"
                  style={{ backgroundColor: sub.color }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{sub.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{sub.url}</p>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() =>
                    void deleteCairnCalendarSubscription(sub.id).then(() => {
                      toast.success('Subscription removed')
                      return refresh()
                    })
                  }
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        {showAddSubscription ? (
          <form
            className="space-y-3 rounded-lg border border-border p-4"
            onSubmit={(event) => {
              event.preventDefault()
              addSubscriptionMutation.mutate()
            }}
          >
            <Input
              value={subName}
              onChange={(event) => setSubName(event.target.value)}
              placeholder="Display name"
              required
            />
            <Input
              value={subUrl}
              onChange={(event) => setSubUrl(event.target.value)}
              placeholder="https://calendar.example.com/feed.ics"
              required
            />
            <ColorPicker value={subColor} onChange={setSubColor} />
            <div className="flex gap-2">
              <Button type="submit" disabled={addSubscriptionMutation.isPending}>
                {addSubscriptionMutation.isPending ? 'Adding…' : 'Add subscription'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowAddSubscription(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : null}
      </section>
    </div>
  )
}
