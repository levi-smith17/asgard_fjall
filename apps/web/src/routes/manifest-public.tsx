import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  GitBranch,
  Globe,
  Mail,
  MapPin,
} from 'lucide-react'
import { OrdstirrGearChart } from '@/components/apps/ordstirr/ordstirr-gear-chart'
import { PublicOrdstirrSectionsRail } from '@/components/apps/ordstirr/public-ordstirr-sections-rail'
import { PublicSurface } from '@/components/core/layout/public-surface'
import { StudioContextBar } from '@/components/core/layout/studio-context-bar'
import { StudioLayout } from '@/components/core/layout/studio-layout'
import { PublicOrdstirrCanvasSkeleton } from '@/components/core/ui/studio-skeletons'
import { Avatar } from '@/components/core/ui/avatar'
import { Button } from '@/components/core/ui/button'
import { Input } from '@/components/core/ui/input'
import { Label } from '@/components/core/ui/label'
import { RichTextContent } from '@/components/core/ui/rich-text-content'
import { termsFor } from '@/lib/terminology'
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
  sortExpeditionsByDateDesc,
  sortSummitsByDateDesc,
} from '@/lib/ordstirr-format'
import { publicCompanionMediaUrl } from '@/lib/public-media-url'
import {
  buildPublicOrdstirrRailGroups,
  type PublicOrdstirrRailSectionId,
  viewForPublicRailSection,
} from '@/lib/public-ordstirr-rail'
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
}: {
  username: string
  name: string | null
  origins: PublicManifestData['origins'] | PublicJourneyData['origins']
}) {
  // Visitor-facing English — do not use Ordsending/terminology for this CTA.
  const label = `Contact ${name ?? username}`
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

function LandmarkCard({
  landmark,
}: {
  landmark: PublicManifestData['landmarks'][number]
}) {
  const [expanded, setExpanded] = useState(false)
  const [overflows, setOverflows] = useState(false)
  const innerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = innerRef.current
    if (el) setOverflows(el.scrollHeight > el.clientHeight)
  }, [landmark.description, landmark.startDate])

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-secondary p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium">{landmark.name}</p>
        <div className="flex shrink-0 items-center gap-2">
          {landmark.url ? (
            <a
              href={landmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Open project link"
            >
              <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          ) : null}
          {landmark.githubUrl ? (
            <a
              href={landmark.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Open GitHub repository"
            >
              <GitBranch className="h-3 w-3" aria-hidden />
            </a>
          ) : null}
        </div>
      </div>
      <div ref={innerRef} className={cn('relative', !expanded && 'max-h-48 overflow-hidden')}>
        {landmark.startDate ? (
          <p className="text-sm text-muted-foreground">
            {formatManifestDateRange(landmark.startDate, landmark.endDate, landmark.current)}
          </p>
        ) : null}
        {landmark.description ? (
          <RichTextContent html={landmark.description} className="text-sm text-muted-foreground" />
        ) : null}
        {!expanded && overflows ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-secondary to-transparent" />
        ) : null}
      </div>
      {overflows ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="self-start text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      ) : null}
    </div>
  )
}

function CompanionMediaCarousel({
  companion,
}: {
  companion: PublicJourneyData['companions'][number]
}) {
  const media = useMemo(() => {
    const items = companion.media ?? []
    if (items.length > 0) return items
    if (companion.imageUrl) {
      return [{ id: 'image', key: companion.imageUrl, type: 'IMAGE', caption: null }]
    }
    return []
  }, [companion.imageUrl, companion.media])

  const [index, setIndex] = useState(0)
  const current = media[index]

  if (media.length === 0) {
    return companion.bio ? (
      <RichTextContent html={companion.bio} className="text-muted-foreground" />
    ) : null
  }

  return (
    <div className="flex flex-col gap-3">
      {companion.bio ? (
        <RichTextContent html={companion.bio} className="text-muted-foreground" />
      ) : null}
      <div className="relative">
        <div className="flex h-96 items-center justify-center overflow-hidden rounded-lg bg-transparent">
          {String(current.type).toUpperCase() === 'VIDEO' ? (
            <video
              key={current.id}
              src={publicCompanionMediaUrl(current.key)}
              className="h-full w-full object-contain"
              controls
            />
          ) : (
            <img
              key={current.id}
              src={publicCompanionMediaUrl(current.key)}
              alt={current.caption ?? companion.name}
              className="h-full w-full object-contain"
            />
          )}
        </div>
        {media.length > 1 ? (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 h-8 w-8 -translate-y-1/2 bg-muted/90 opacity-90 hover:opacity-100"
              onClick={() => setIndex((value) => (value - 1 + media.length) % media.length)}
              aria-label="Previous media"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 bg-muted/90 opacity-90 hover:opacity-100"
              onClick={() => setIndex((value) => (value + 1) % media.length)}
              aria-label="Next media"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        ) : null}
      </div>
      {current.caption ? (
        <p className="text-center text-xs text-muted-foreground">{current.caption}</p>
      ) : null}
    </div>
  )
}

function CompanionBlock({
  companion,
}: {
  companion: PublicJourneyData['companions'][number]
}) {
  const memorial = Boolean(companion.passed)
  const age = memorial ? null : formatCompanionAge(companion.birthday)
  const subtitle = [companion.species, companion.breed, age].filter(Boolean).join(' · ')
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="font-medium">{companion.name}</h3>
        {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      <CompanionMediaCarousel companion={companion} />
    </div>
  )
}

function ManifestView({ data }: { data: PublicManifestData }) {
  // Public Ordstirr is Standard-only (never Asgard / Cairn labels).
  const terms = termsFor('STANDARD')
  const wayfarer = data.wayfarer
  const initials = wayfarer.name?.slice(0, 2) ?? wayfarer.email?.[0] ?? '?'
  const avatar = wayfarer.image ?? wayfarer.avatar ?? null
  const expeditions = sortExpeditionsByDateDesc(data.expeditions)
  const summits = sortSummitsByDateDesc(data.summits)

  const grouped = data.gear.reduce<Record<string, typeof data.gear>>((acc, item) => {
    const key = item.category ?? 'Other'
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  return (
    <div className="manifest-page mx-auto flex max-w-3xl flex-col gap-12 px-6 py-6 print:mx-0 print:max-w-none print:px-0 print:pb-0">
      <div id="origins" className="flex scroll-mt-6 flex-col gap-6">
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

        <ContactLinks username={wayfarer.username} name={wayfarer.name} origins={data.origins} />

        {data.origins?.summary ? (
          <RichTextContent html={data.origins.summary} className="text-muted-foreground" />
        ) : null}

        <div className="flex justify-end print:hidden">
          <Button asChild variant="outline" size="sm">
            <Link to={publicManifestPath(wayfarer.username, 'journey')}>{terms.bio_button}</Link>
          </Button>
        </div>
      </div>

      {expeditions.length > 0 ? (
        <section id="expeditions" className="scroll-mt-6">
          <SectionHeading title={terms.expeditions} />
          <div className="flex flex-col gap-6">
            {expeditions.map((exp) => (
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
        <section id="training" className="scroll-mt-6">
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
        <section id="gear" className="scroll-mt-6">
          <SectionHeading title={terms.gear} />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 print:hidden">
            {Object.entries(grouped).map(([category, items]) => (
              <OrdstirrGearChart
                key={category}
                category={category}
                items={items as ManifestGear[]}
              />
            ))}
          </div>
          <div className="hidden print:flex print:flex-wrap print:gap-x-8 print:gap-y-4">
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category} className="flex flex-col gap-1">
                <p className="text-sm font-semibold">{category}</p>
                <ul className="m-0 flex list-none flex-col gap-0.5 p-0 text-sm text-muted-foreground">
                  {items.map((item) => (
                    <li key={item.id}>
                      {item.name}
                      {item.level ? ` — ${item.level}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {data.landmarks.length > 0 ? (
        <section id="landmarks" className="scroll-mt-6">
          <SectionHeading title={terms.landmarks} />
          <div className="flex flex-col gap-4 sm:hidden">
            {data.landmarks.map((landmark) => (
              <LandmarkCard key={landmark.id} landmark={landmark} />
            ))}
          </div>
          <div className="hidden gap-4 sm:flex">
            <div className="flex flex-1 flex-col gap-4">
              {data.landmarks
                .filter((_, index) => index % 2 === 0)
                .map((landmark) => (
                  <LandmarkCard key={landmark.id} landmark={landmark} />
                ))}
            </div>
            <div className="flex flex-1 flex-col gap-4">
              {data.landmarks
                .filter((_, index) => index % 2 === 1)
                .map((landmark) => (
                  <LandmarkCard key={landmark.id} landmark={landmark} />
                ))}
            </div>
          </div>
        </section>
      ) : null}

      {summits.length > 0 ? (
        <section id="summits" className="scroll-mt-6">
          <SectionHeading title={terms.summits} />
          <div className="flex flex-col gap-4">
            {summits.map((summit) => (
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
        <section id="pathfinding" className="scroll-mt-6">
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
  // Public Ordstirr is Standard-only (never Asgard / Cairn labels).
  const terms = termsFor('STANDARD')
  const wayfarer = data.wayfarer
  const initials = wayfarer.name?.slice(0, 2) ?? wayfarer.email?.[0] ?? '?'
  const avatar = wayfarer.image ?? wayfarer.avatar ?? null
  const companions = data.companions ?? []
  const living = companions.filter((c) => !c.passed)
  const memorial = companions.filter((c) => Boolean(c.passed))

  return (
    <div className="manifest-page mx-auto flex max-w-3xl flex-col gap-12 px-6 py-6 print:mx-0 print:max-w-none print:px-0 print:pb-0">
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

        <ContactLinks username={wayfarer.username} name={wayfarer.name} origins={data.origins} />
      </div>

      {data.origins?.bio ? (
        <section id="bio" className="scroll-mt-6">
          <SectionHeading title={terms.bio} />
          <RichTextContent html={data.origins.bio} className="text-muted-foreground" />
        </section>
      ) : null}

      {living.length > 0 ? (
        <section id="companions" className="scroll-mt-6">
          <SectionHeading title={terms.companions} />
          <div className="flex flex-col gap-8">
            {living.map((companion) => (
              <CompanionBlock key={companion.id} companion={companion} />
            ))}
          </div>
        </section>
      ) : null}

      {memorial.length > 0 ? (
        <section id="in-memoriam" className="scroll-mt-6">
          <SectionHeading title={terms.summit_reached} />
          <div className="flex flex-col gap-8">
            {memorial.map((companion) => (
              <CompanionBlock key={companion.id} companion={companion} />
            ))}
          </div>
        </section>
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
  const initials = wayfarerName?.slice(0, 2) ?? username.slice(0, 2)

  return (
    <div
      id="ordsending"
      className="flex min-h-0 flex-1 scroll-mt-6 items-start justify-center overflow-y-auto px-4 py-8"
    >
      <div className="flex w-full max-w-md flex-col gap-6 rounded-xl bg-muted/50 p-6">
        <div className="flex items-center gap-4">
          <Avatar src={image} alt={wayfarerName ?? username} fallback={initials} className="h-16 w-16" />
          <div>
            <h1 className="text-2xl font-semibold">Contact {wayfarerName ?? username}</h1>
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

function scrollToSection(sectionId: PublicOrdstirrRailSectionId) {
  window.requestAnimationFrame(() => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

export function PublicManifestPage({ view }: { view: PublicManifestView }) {
  const { username } = useParams<{ username: string }>()
  // Public Ordstirr is Standard-only (never Asgard / Cairn labels).
  const terms = termsFor('STANDARD')
  const navigate = useNavigate()
  const { hash } = useLocation()
  const title = pageTitle(view, terms)
  const [activeSection, setActiveSection] = useState<PublicOrdstirrRailSectionId | null>(null)

  const manifestQuery = useQuery({
    queryKey: ['public-manifest', username],
    queryFn: () => fetchPublicManifest(username!),
    enabled: Boolean(username),
    retry: false,
  })

  const journeyQuery = useQuery({
    queryKey: ['public-manifest-journey', username],
    queryFn: () => fetchPublicJourney(username!),
    enabled: Boolean(username),
    retry: false,
  })

  const contactQuery = useQuery({
    queryKey: ['public-manifest-contact', username],
    queryFn: () => fetchPublicContact(username!),
    enabled: Boolean(username) && view === 'contact',
    retry: false,
  })

  const railGroups = useMemo(() => buildPublicOrdstirrRailGroups(terms), [terms])

  useEffect(() => {
    const fromHash = hash.replace(/^#/, '') as PublicOrdstirrRailSectionId
    if (fromHash === 'bio') {
      // Keep selection, but land at the top of Ferd Min rather than #bio.
      setActiveSection('bio')
      window.requestAnimationFrame(() => {
        document
          .querySelector<HTMLElement>('[data-public-ordstirr-scroll]')
          ?.scrollTo({ top: 0, behavior: 'smooth' })
      })
      return
    }
    if (fromHash) {
      setActiveSection(fromHash)
      scrollToSection(fromHash)
      return
    }
    const firstOnPage = railGroups
      .find((group) => group.id === view)
      ?.sections[0]
    setActiveSection(firstOnPage?.id ?? null)
  }, [hash, railGroups, view])

  if (!username) return <Navigate to="/" replace />

  const viewError =
    (view === 'manifest' && manifestQuery.isError) ||
    (view === 'journey' && journeyQuery.isError) ||
    (view === 'contact' && contactQuery.isError)

  const scrollJourneyToTop = () => {
    window.requestAnimationFrame(() => {
      document
        .querySelector<HTMLElement>('[data-public-ordstirr-scroll]')
        ?.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }

  const handleSelectSection = (sectionId: PublicOrdstirrRailSectionId) => {
    if (sectionId === 'bio') {
      setActiveSection('bio')
      if (view !== 'journey') {
        navigate(publicManifestPath(username, 'journey'))
        return
      }
      scrollJourneyToTop()
      return
    }
    const targetView = viewForPublicRailSection(sectionId)
    setActiveSection(sectionId)
    if (targetView === view) {
      scrollToSection(sectionId)
      return
    }
    navigate(`${publicManifestPath(username, targetView)}#${sectionId}`)
  }

  let body: React.ReactNode = <PublicOrdstirrCanvasSkeleton view={view} />

  if (viewError) {
    body = (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
        This public profile could not be loaded.
      </div>
    )
  } else if (view === 'manifest' && manifestQuery.data) {
    body = <ManifestView data={manifestQuery.data} />
  } else if (view === 'journey' && journeyQuery.data) {
    body = <JourneyView data={journeyQuery.data} />
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
    <PublicSurface>
      <StudioLayout
        railLabel="Sections"
        contextBar={
          <div className="print:hidden">
            <StudioContextBar aria-label={title} title={title} actions={null} />
          </div>
        }
        rail={
          <div className="flex h-full min-h-0 flex-col print:hidden">
            <PublicOrdstirrSectionsRail
              groups={railGroups}
              activeSection={activeSection}
              currentView={view}
              onSelectSection={handleSelectSection}
            />
          </div>
        }
        canvas={
          <div
            className="min-h-0 flex-1 overflow-y-auto print:overflow-visible"
            data-public-ordstirr-scroll
          >
            {body}
          </div>
        }
      />
    </PublicSurface>
  )
}
