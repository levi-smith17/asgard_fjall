/**
 * Map Summit/Cairn API paths onto Asgard Fjall HTTP routes.
 * Keep client call sites on legacy names; rewrite at the fetch boundary.
 */
export function mapCairnApiPathToAsgard(pathWithQuery: string): string {
  const qIndex = pathWithQuery.indexOf('?')
  const path = qIndex >= 0 ? pathWithQuery.slice(0, qIndex) : pathWithQuery
  const query = qIndex >= 0 ? pathWithQuery.slice(qIndex) : ''

  const rules: Array<[RegExp, string]> = [
    [/^\/public\/manifest\/([^/]+)\/journey(?=\/|$)/, '/public/ordstirr/$1/ferd'],
    [/^\/public\/manifest\/([^/]+)\/contact(?=\/|$)/, '/public/ordstirr/$1/ordsending'],
    [/^\/public\/manifest(?=\/|$)/, '/public/ordstirr'],
    [/^\/settings\/api-token(?=\/|$)/, '/thing/api-token'],
    [/^\/settings\/itinerary(?=\/|$)/, '/thing/dagatal'],
    [/^\/settings\/waypoints(?=\/|$)/, '/thing/laufar'],
    [/^\/settings\/logs(?=\/|$)/, '/thing/sogur'],
    [/^\/settings\/signals(?=\/|$)/, '/thing/sendibod'],
    [/^\/settings(?=\/|$)/, '/thing'],
    [/^\/itinerary-subscriptions(?=\/|$)/, '/dagatal-subscriptions'],
    [/^\/itinerary(?=\/|$)/, '/dagatal'],
    [/^\/waypoints(?=\/|$)/, '/laufar'],
    [/^\/trails(?=\/|$)/, '/greinar'],
    [/^\/markers(?=\/|$)/, '/runir'],
    [/^\/burn(?=\/|$)/, '/surtr'],
    [/^\/supplylines(?=\/|$)/, '/idunn'],
    [/^\/cache(?=\/|$)/, '/skatt'],
    [/^\/logs(?=\/|$)/, '/sogur'],
    [/^\/signals(?=\/|$)/, '/sendibod'],
    [/^\/manifest(?=\/|$)/, '/ordstirr'],
    [/^\/starfield(?=\/|$)/, '/stjornur'],
    [/^\/headwaters(?=\/|$)/, '/nidjatal'],
    [/^\/basecamp(?=\/|$)/, '/hlidskjalf'],
  ]

  let mapped = path
  for (const [pattern, replacement] of rules) {
    if (pattern.test(mapped)) {
      mapped = mapped.replace(pattern, replacement)
      break
    }
  }

  return `${mapped}${query}`
}
