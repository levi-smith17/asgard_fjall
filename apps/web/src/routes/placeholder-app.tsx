export function PlaceholderAppPage({ name }: { name: string }) {
  return (
    <div className="px-6 py-8 sm:px-10">
      <h1 className="text-2xl font-semibold tracking-wide">{name}</h1>
      <p className="mt-2 max-w-xl text-sm text-[var(--muted-foreground)]">
        Port from private Asgard / Cairn client surfaces. Browser → Cairn API (
        <code>VITE_CAIRN_API_URL</code>).
      </p>
    </div>
  )
}
