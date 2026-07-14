import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle, ExternalLink, Globe, Mail, MapPin } from 'lucide-react'
import { OrdstirrGearChart } from '@/components/cairn/ordstirr/ordstirr-gear-chart'
import { GlobalSearchTrigger } from '@/components/core/command-palette/global-search-trigger'
import { StudioContextBar } from '@/components/core/layout/studio-context-bar'
import { Avatar } from '@/components/core/ui/avatar'
import { Button } from '@/components/core/ui/button'
import { Input } from '@/components/core/ui/input'
import { Label } from '@/components/core/ui/label'
import { RichTextContent } from '@/components/core/ui/rich-text-content'
import { useTerminology } from '@/hooks/use-terminology'
import type { ManifestGear } from '@/lib/manifest-api'
import {
  fetchPublicContact,
  fetchPublicJourney,
  fetchPublicManifest,
  submitPublicContact,
  type PublicJourneyData,
  type PublicManifestData,
} from '@/lib/manifest-public-api'
import {
  formatCompanionAge,
  formatManifestDate,
  formatManifestDateRange,
} from '@/lib/ordstirr-format'
import { publicManifestPath, type PublicManifestView } from '@/lib/public-manifest-path'
import { cn } from '@/lib/utils'

function SectionHeading({ title }: { title: string }) {
  return (
    <div className="mb-4 flex items-center gap-4">
      <h2 className="shrink-0 text-lg font-semibold">{title}</h2>
      <div className="h-px flex-1 bg-border" />
    </div>
  )
}

function TimelineEntry({
  title,
  subtitle,
  location,
  range,
  description,
}: {
  title: string
  subtitle?: string | null
  location?: string | null
  range: string
  description?: string | null
}) {
  return (
    <div className="flex flex-col gap-1 border-l-2 border-border pl-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium">{title}</p>
          {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
          {location ? <p className="text-sm text-muted-foreground">{location}</p> : null}
        </div>
        <span className="shrink-0 text-sm text-muted-foreground">{range}</span>
      </div>
      {description ? (
        <RichTextContent html={description} className="text-sm text-muted-foreground" />
      ) : null}
    </div>
  )
}

function ContactLinks({
  username,
  name,
  origins,
  contactLabel,
}: {
  username: string
  name: string | null
  origins: PublicManifestData['origins'] | PublicJourneyData['origins']
  contactLabel: string
}) {
  const label = `${contactLabel} ${name ?? username}`
  return (
    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
      {origins?.location ? (
        <div className="flex items-center gap-1">
          <MapPin className="h-4 w-4" aria-hidden />
          {origins.location}
        </div>
      ) : null}
      <div className="flex items-center gap-1">
        <Mail className="h-4 w-4" aria-hidden />
        <Link
          to={publicManifestPath(username, 'contact')}
          className="underline underline-offset-4 hover:text-foreground"
        >
          {label}
        </Link>
      </div>
      {origins?.website ? (
        <div className="flex items-center gap-1">
          <Globe className="h-4 w-4" aria-hidden />
          <a
            href={origins.website}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 hover:text-foreground"
          >
            {origins.website}
          </a>
        </div>
      ) : null}
      {origins?.linkedin ? (
        <a
          href={origins.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 hover:text-foreground"
        >
          LinkedIn
        </a>
      ) : null}
      {origins?.github ? (
        <a
          href={origins.github}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 hover:text-foreground"
        >
          GitHub
        </a>
      ) : null}
    </div>
  )
}

function ManifestView({ data }: { data: PublicManifestData }) {
  const { terms } = useTerminology()
  const wayfarer = data.wayfarer
  const initials = wayfarer.name?.slice(0, 2) ?? wayfarer.email?.[0] ?? '?'
  const avatar = wayfarer.image ?? wayfarer.avatar ?? null

  const grouped = data.gear.reduce<Record<string, typeof data.gear>>((acc, item) => {
    const key = item.category ?? 'Other'
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-12 px-6 py-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Avatar
            src={avatar}
            alt={wayfarer.name ?? wayfarer.username}
            fallback={initials}
            className="h-20 w-20"
          />
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold">{wayfarer.name ?? wayfarer.email}</h1>
            {data.origins?.headline ? (
              <p className="text-muted-foreground">{data.origins.headline}</p>
            ) : null}
          </div>
        </div>

        <ContactLinks
          username={wayfarer.username}
          name={wayfarer.name}
          origins={data.origins}
          contactLabel={terms.contact}
        />

        {data.origins?.summary ? (
          <RichTextContent html={data.origins.summary} className="text-muted-foreground" />
        ) : null}

        <div className="flex justify-end">
          <Button asChild variant="outline" size="sm">
            <Link to={publicManifestPath(wayfarer.username, 'journey')}>{terms.bio_button}</Link>
          </Button>
        </div>
      </div>

      {data.expeditions.length > 0 ? (
        <section>
          <SectionHeading title={terms.expeditions} />
          <div className="flex flex-col gap-6">
            {data.expeditions.map((exp) => (
              <TimelineEntry
                key={exp.id}
                title={exp.title}
                subtitle={exp.company}
                location={exp.location}
                range={formatManifestDateRange(exp.startDate, exp.endDate, exp.current)}
                description={exp.description}
              />
            ))}
          </div>
        </section>
      ) : null}

      {data.training.length > 0 ? (
        <section>
          <SectionHeading title={terms.training} />
          <div className="flex flex-col gap-6">
            {data.training.map((item) => (
              <TimelineEntry
                key={item.id}
                title={item.institution}
                subtitle={item.degree}
                location={item.field}
                range={formatManifestDateRange(item.startDate, item.endDate, item.current)}
                description={item.description}
              />
            ))}
          </div>
        </section>
      ) : null}

      {data.gear.length > 0 ? (
        <section>
          <SectionHeading title={terms.gear} />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {Object.entries(grouped).map(([category, items]) => (
              <OrdstirrGearChart
                key={category}
                category={category}
                items={items as ManifestGear[]}
              />
            ))}
          </div>
        </section>
      ) : null}

      {data.landmarks.length > 0 ? (
        <section>
          <SectionHeading title={terms.landmarks} />
          <div className="flex flex-col gap-4">
            {data.landmarks.map((landmark) => (
              <div key={landmark.id} className="flex flex-col gap-1">
                <div className="flex items-start justify-between gap-4">
                  <p className="font-medium">
                    {landmark.name}
                    {landmark.url ? (
                      <a
                        href={landmark.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-1.5 inline-block align-middle text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-3 w-3" aria-hidden />
                      </a>
                    ) : null}
                  </p>
                  {landmark.startDate ? (
                    <span className="shrink-0 text-sm text-muted-foreground">
                      {formatManifestDateRange(
                        landmark.startDate,
                        landmark.endDate,
                        landmark.current,
                      )}
                    </span>
                  ) : null}
                </div>
                {landmark.description ? (
                  <RichTextContent
                    html={landmark.description}
                    className="text-sm text-muted-foreground"
                  />
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {data.summits.length > 0 ? (
        <section>
          <SectionHeading title={terms.summits} />
          <div className="flex flex-col gap-4">
            {data.summits.map((summit) => (
              <div key={summit.id} className="flex flex-col gap-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">
                      {summit.title}
                      {summit.url ? (
                        <a
                          href={summit.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-1.5 inline-block align-middle text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="h-3 w-3" aria-hidden />
                        </a>
                      ) : null}
                    </p>
                    {summit.issuer ? (
                      <p className="text-sm text-muted-foreground">{summit.issuer}</p>
                    ) : null}
                  </div>
                  {summit.date ? (
                    <span className="shrink-0 text-sm text-muted-foreground">
                      {formatManifestDate(summit.date)}
                    </span>
                  ) : null}
                </div>
                {summit.description ? (
                  <RichTextContent
                    html={summit.description}
                    className="text-sm text-muted-foreground"
                  />
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {data.pathfinding.length > 0 ? (
        <section>
          <SectionHeading title={terms.pathfinding} />
          <div className="flex flex-col gap-6">
            {data.pathfinding.map((item) => (
              <TimelineEntry
                key={item.id}
                title={item.organization}
                subtitle={item.role}
                location={item.location}
                range={formatManifestDateRange(item.startDate, item.endDate, item.current)}
                description={item.description}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

function JourneyView({ data }: { data: PublicJourneyData }) {
  const { terms } = useTerminology()
  const wayfarer = data.wayfarer
  const initials = wayfarer.name?.slice(0, 2) ?? wayfarer.email?.[0] ?? '?'
  const avatar = wayfarer.image ?? wayfarer.avatar ?? null
  const companions = data.companions ?? []
  const living = companions.filter((c) => !c.passed)
  const memorial = companions.filter((c) => Boolean(c.passed))

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-12 px-6 py-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Avatar src={avatar} alt={wayfarer.name ?? wayfarer.username} fallback={initials} className="h-20 w-20" />
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold">{wayfarer.name ?? wayfarer.email}</h1>
            {data.origins?.headline ? (
              <p className="text-muted-foreground">{data.origins.headline}</p>
            ) : null}
          </div>
        </div>

        <ContactLinks
          username={wayfarer.username}
          name={wayfarer.name}
          origins={data.origins}
          contactLabel={terms.contact}
        />

        {data.origins?.bio ? (
          <RichTextContent html={data.origins.bio} className="text-muted-foreground" />
        ) : null}
      </div>

      {living.length > 0 ? (
        <section>
          <SectionHeading title={terms.companions} />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {living.map((companion) => (
              <CompanionCard key={companion.id} companion={companion} />
            ))}
          </div>
        </section>
      ) : null}

      {memorial.length > 0 ? (
        <section>
          <SectionHeading title={terms.summit_reached} />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {memorial.map((companion) => (
              <CompanionCard key={companion.id} companion={companion} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

function CompanionCard({
  companion,
}: {
  companion: PublicJourneyData['companions'][number]
}) {
  const age = formatCompanionAge(companion.birthday)
  const subtitle = [companion.species, companion.breed, age].filter(Boolean).join(' · ')
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
      <p className="font-medium">{companion.name}</p>
      {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
      {companion.bio ? (
        <RichTextContent html={companion.bio} className="text-sm text-muted-foreground" />
      ) : null}
    </div>
  )
}

function ContactForm({ username, wayfarerName }: { username: string; wayfarerName: string | null }) {
  const [success, setSuccess] = useState(false)
  const [threadUrl, setThreadUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    if (data.get('honeypot')) return

    setPending(true)
    setError(null)
    try {
      const result = await submitPublicContact(username, {
        senderName: String(data.get('senderName') ?? ''),
        senderEmail: String(data.get('senderEmail') ?? ''),
        body: String(data.get('body') ?? ''),
      })
      setSuccess(true)
      if (result.threadUrl) setThreadUrl(result.threadUrl)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setPending(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <CheckCircle className="h-10 w-10 text-primary" aria-hidden />
        <div>
          <p className="font-medium">Message sent</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {wayfarerName ?? 'They'} will be in touch soon.
          </p>
          {threadUrl ? (
            <p className="mt-3 text-sm text-muted-foreground">
              <a href={threadUrl} className="underline underline-offset-4 hover:text-foreground">
                View your conversation thread
              </a>
            </p>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <input name="honeypot" type="text" className="hidden" tabIndex={-1} autoComplete="off" />
      <div className="flex flex-col gap-4">
        <SectionHeading title="Your details" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="senderName">Name</Label>
            <Input id="senderName" name="senderName" placeholder="Your name" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="senderEmail">Email</Label>
            <Input
              id="senderEmail"
              name="senderEmail"
              type="email"
              placeholder="your@email.com"
              required
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <SectionHeading title="Message" />
        <textarea
          id="body"
          name="body"
          required
          maxLength={2000}
          rows={6}
          placeholder={`Write your message to ${wayfarerName ?? 'them'}...`}
          className={cn(
            'flex w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground shadow-sm',
            'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? 'Sending…' : 'Send message'}
        </Button>
      </div>
    </form>
  )
}

function ContactView({
  username,
  wayfarerName,
  image,
}: {
  username: string
  wayfarerName: string | null
  image: string | null
}) {
  const { terms } = useTerminology()
  const initials = wayfarerName?.slice(0, 2) ?? username.slice(0, 2)

  return (
    <div className="flex min-h-0 flex-1 items-start justify-center overflow-y-auto px-4 py-8">
      <div className="flex w-full max-w-md flex-col gap-6 rounded-xl bg-muted/50 p-6">
        <div className="flex items-center gap-4">
          <Avatar src={image} alt={wayfarerName ?? username} fallback={initials} className="h-16 w-16" />
          <div>
            <h1 className="text-2xl font-semibold">
              {terms.contact} {wayfarerName ?? username}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Send a message — your email stays private.
            </p>
          </div>
        </div>
        <ContactForm username={username} wayfarerName={wayfarerName} />
      </div>
    </div>
  )
}

function pageTitle(
  view: PublicManifestView,
  terms: { manifest: string; bio_button: string; contact: string },
) {
  if (view === 'journey') return terms.bio_button
  if (view === 'contact') return terms.contact
  return terms.manifest
}

export function PublicManifestPage({ view }: { view: PublicManifestView }) {
  const { username } = useParams<{ username: string }>()
  const { terms } = useTerminology()
  const title = pageTitle(view, terms)

  const manifestQuery = useQuery({
    queryKey: ['public-manifest', username],
    queryFn: () => fetchPublicManifest(username!),
    enabled: Boolean(username) && view === 'manifest',
    retry: false,
  })

  const journeyQuery = useQuery({
    queryKey: ['public-manifest-journey', username],
    queryFn: () => fetchPublicJourney(username!),
    enabled: Boolean(username) && view === 'journey',
    retry: false,
  })

  const contactQuery = useQuery({
    queryKey: ['public-manifest-contact', username],
    queryFn: () => fetchPublicContact(username!),
    enabled: Boolean(username) && view === 'contact',
    retry: false,
  })

  if (!username) return <Navigate to="/" replace />

  const isError =
    (view === 'manifest' && manifestQuery.isError) ||
    (view === 'journey' && journeyQuery.isError) ||
    (view === 'contact' && contactQuery.isError)

  if (isError) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <StudioContextBar aria-label={title} title={title} actions={<GlobalSearchTrigger />} />
        <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
          This public profile could not be loaded.
        </div>
      </div>
    )
  }

  let body: React.ReactNode = (
    <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
      Loading…
    </div>
  )

  if (view === 'manifest' && manifestQuery.data) {
    body = (
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ManifestView data={manifestQuery.data} />
      </div>
    )
  } else if (view === 'journey' && journeyQuery.data) {
    body = (
      <div className="min-h-0 flex-1 overflow-y-auto">
        <JourneyView data={journeyQuery.data} />
      </div>
    )
  } else if (view === 'contact' && contactQuery.data) {
    body = (
      <ContactView
        username={username}
        wayfarerName={contactQuery.data.wayfarer.name}
        image={contactQuery.data.wayfarer.image}
      />
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <StudioContextBar aria-label={title} title={title} actions={<GlobalSearchTrigger />} />
      {body}
    </div>
  )
}
