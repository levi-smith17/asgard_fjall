import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Bookmark, CalendarDays, KeyRound, NotebookPen, User } from 'lucide-react'
import { StudioLayout } from '@/components/core/layout/studio-layout'
import { ThingAccountSettings } from '@/components/thing/thing-account-settings'
import { ThingContextBar } from '@/components/thing/thing-context-bar'
import { ThingIntegrationsSettings } from '@/components/thing/thing-integrations-settings'
import { ThingItinerarySettings } from '@/components/thing/thing-itinerary-settings'
import { ThingLogSettings } from '@/components/thing/thing-log-settings'
import { ThingSectionsRail } from '@/components/thing/thing-sections-rail'
import { ThingWaypointSettings } from '@/components/thing/thing-waypoint-settings'
import { useTerms } from '@/hooks/use-terminology'

type ThingSection = 'account' | 'integrations' | 'dagatal' | 'sogur' | 'hlidskjalf'

function ThingSectionShell({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6 sm:px-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  )
}

export function ThingPage() {
  const terms = useTerms()
  const isAsgard = terms.account === 'Heiti'
  const thingGroups = useMemo(
    () => [
      {
        id: 'account',
        label: isAsgard ? 'Sjálfr' : 'Account',
        sections: [{ id: 'account' as const, label: terms.account, icon: User }],
      },
      {
        id: 'apps',
        label: isAsgard ? 'Forrit' : 'Apps',
        sections: [
          { id: 'integrations' as const, label: 'Integrations', icon: KeyRound },
          { id: 'dagatal' as const, label: terms.calendar, icon: CalendarDays },
          { id: 'sogur' as const, label: terms.notes, icon: NotebookPen },
          { id: 'hlidskjalf' as const, label: terms.laufar, icon: Bookmark },
        ],
      },
    ],
    [isAsgard, terms],
  )
  const [searchParams, setSearchParams] = useSearchParams()
  const sectionParam = searchParams.get('section')
  const activeSection: ThingSection =
    sectionParam === 'integrations' ||
    sectionParam === 'dagatal' ||
    sectionParam === 'sogur' ||
    sectionParam === 'hlidskjalf'
      ? sectionParam
      : 'account'

  useEffect(() => {
    if (sectionParam === 'privacy' || sectionParam === 'appearance') {
      const params = new URLSearchParams(searchParams.toString())
      params.delete('section')
      setSearchParams(params, { replace: true })
    }
  }, [sectionParam, searchParams, setSearchParams])

  function setSection(section: ThingSection) {
    const params = new URLSearchParams(searchParams.toString())
    if (section === 'account') {
      params.delete('section')
    } else {
      params.set('section', section)
    }
    setSearchParams(params)
  }

  return (
    <StudioLayout
      railLabel="Sections"
      contextBar={<ThingContextBar />}
      rail={
        <ThingSectionsRail
          groups={thingGroups}
          activeSection={activeSection}
          onSelectSection={(section) => setSection(section as ThingSection)}
        />
      }
      canvas={
        <div className="min-h-0 flex-1 overflow-y-auto">
          {activeSection === 'dagatal' ? (
            <ThingSectionShell
              title={terms.calendar}
              description={`Calendars, subscriptions, and ${terms.calendar.toLowerCase()} preferences.`}
            >
              <ThingItinerarySettings />
            </ThingSectionShell>
          ) : activeSection === 'integrations' ? (
            <ThingSectionShell
              title="Integrations"
              description="Personal API tokens for trusted tools and automations."
            >
              <ThingIntegrationsSettings />
            </ThingSectionShell>
          ) : activeSection === 'sogur' ? (
            <ThingSectionShell
              title={terms.notes}
              description={`${terms.notes} display and sorting preferences.`}
            >
              <ThingLogSettings />
            </ThingSectionShell>
          ) : activeSection === 'hlidskjalf' ? (
            <ThingSectionShell
              title={terms.laufar}
              description={`${terms.laufar} display and behavior preferences.`}
            >
              <ThingWaypointSettings />
            </ThingSectionShell>
          ) : (
            <ThingSectionShell title={terms.account} description="Profile, appearance, and public settings.">
              <ThingAccountSettings />
            </ThingSectionShell>
          )}
        </div>
      }
    />
  )
}
