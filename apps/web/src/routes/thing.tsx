import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarDays, Shield, User } from 'lucide-react'
import { StudioLayout } from '@/components/core/layout/studio-layout'
import { ThingAccountSettings } from '@/components/thing/thing-account-settings'
import { ThingContextBar } from '@/components/thing/thing-context-bar'
import { ThingItinerarySettings } from '@/components/thing/thing-itinerary-settings'
import { ThingPrivacySettings } from '@/components/thing/thing-privacy-settings'
import { ThingSectionsRail } from '@/components/thing/thing-sections-rail'
import { useTerms } from '@/hooks/use-terminology'

type ThingSection = 'account' | 'privacy' | 'dagatal'

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
  const thingSections = useMemo(
    () =>
      [
        { id: 'account' as const, label: terms.account, icon: User },
        { id: 'privacy' as const, label: terms.privacy, icon: Shield },
        { id: 'dagatal' as const, label: terms.calendar, icon: CalendarDays },
      ] satisfies Array<{ id: ThingSection; label: string; icon: typeof User }>,
    [terms],
  )
  const [searchParams, setSearchParams] = useSearchParams()
  const sectionParam = searchParams.get('section')
  const activeSection: ThingSection =
    sectionParam === 'privacy' || sectionParam === 'dagatal' ? sectionParam : 'account'

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
          sections={thingSections}
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
          ) : activeSection === 'privacy' ? (
            <ThingSectionShell title={terms.privacy} description="Manifest visibility and contact settings.">
              <ThingPrivacySettings />
            </ThingSectionShell>
          ) : (
            <ThingSectionShell title={terms.account} description="Profile and Cairn account details.">
              <ThingAccountSettings />
            </ThingSectionShell>
          )}
        </div>
      }
    />
  )
}
