/** Slugify names the same way as the Stjornur system-create API. */
export function stjornurSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}
