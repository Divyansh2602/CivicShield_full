// Session-scoped scan numbering.
//
// The backend assigns every scan a global auto-increment id (e.g. 83). Showing
// that raw id leaks the total scan count and is confusing across users. For
// display we map each real id to a per-session sequence so every visitor sees
// their own scans numbered from #1, and the sequence resets with each new
// browser session (sessionStorage clears when the tab/session ends).
//
// The real id is still used for every API call — this only changes what's shown.

const MAP_KEY = "cs_scan_display_map"
const COUNTER_KEY = "cs_scan_display_counter"

/**
 * Returns the session-local display number for a real scan id, assigning the
 * next number the first time an id is seen this session. Safe to call during
 * SSR (falls back to the real id when sessionStorage is unavailable).
 */
export function displayScanNumber(realId: string | number | null | undefined): string {
  if (realId === null || realId === undefined || realId === "") return "—"
  const id = String(realId)

  if (typeof window === "undefined" || !window.sessionStorage) return id

  try {
    const map: Record<string, number> = JSON.parse(
      window.sessionStorage.getItem(MAP_KEY) || "{}"
    )
    if (map[id]) return String(map[id])

    const next = (parseInt(window.sessionStorage.getItem(COUNTER_KEY) || "0", 10) || 0) + 1
    map[id] = next
    window.sessionStorage.setItem(MAP_KEY, JSON.stringify(map))
    window.sessionStorage.setItem(COUNTER_KEY, String(next))
    return String(next)
  } catch {
    return id
  }
}
